const cron = require('node-cron');
const db = require('./database');
const weather = require('./weather');
const embeds = require('./embeds');

let client = null;

function init(discordClient) {
    client = discordClient;

    // Minútový check — scheduled notifs + server channels + sun events
    cron.schedule('* * * * *', () => {
        checkScheduledNotifs().catch(console.error);
        checkSunNotifs().catch(console.error);
        checkServerChannels().catch(console.error);
    });

    // 5-minútový check — event-based (rain, storm, extreme temp)
    cron.schedule('*/5 * * * *', () => {
        checkEventNotifs().catch(console.error);
    });

    console.log('[NOTIF] Systém spustený');
}

// ─── Scheduled (daily, severe) ─────────────

async function checkScheduledNotifs() {
    if (!client?.isReady()) return;
    const now = new Date();
    const hr = now.getHours(), min = now.getMinutes();

    for (const [userId, settings] of Object.entries(db.getAllUsers())) {
        if (!settings.notifications || !settings.latitude) continue;
        for (const notif of settings.notifications) {
            if (!notif.enabled || notif.event_based) continue;
            if (notif.hour !== hr || notif.minute !== min) continue;
            try {
                await sendScheduledNotif(userId, settings, notif);
            } catch (err) { console.error(`[NOTIF] ${userId}:`, err.message); }
        }
    }
}

async function sendScheduledNotif(userId, settings, notif) {
    const channel = await client.channels.fetch(notif.channel_id).catch(() => null);
    if (!channel) return;
    const tz = settings.timezone || 'auto';

    if (notif.type === 'daily') {
        const [hd, dd] = await Promise.all([
            weather.getHourlyForecast(settings.latitude, settings.longitude, tz, 1),
            weather.getDailyForecast(settings.latitude, settings.longitude, tz, 1),
        ]);
        await channel.send({ content: `<@${userId}> ☀️ Ranný prehľad:`, embeds: [embeds.buildDailySummaryEmbed(hd, dd, settings)] });
    } else if (notif.type === 'severe') {
        const hd = await weather.getHourlyForecast(settings.latitude, settings.longitude, tz, 1);
        const today = hd.hourly?.time?.[0]?.split('T')[0];
        let hasSevere = false;
        for (let i = 0; i < (hd.hourly?.weather_code?.length || 0); i++) {
            if (!hd.hourly.time[i]?.startsWith(today)) continue;
            if (weather.getWeatherInfo(hd.hourly.weather_code[i]).severity >= 3) { hasSevere = true; break; }
        }
        if (hasSevere) {
            const dd = await weather.getDailyForecast(settings.latitude, settings.longitude, tz, 1);
            await channel.send({ content: `<@${userId}> ⚠️ **Výstraha:**`, embeds: [embeds.buildDailySummaryEmbed(hd, dd, settings)] });
        }
    }
}

// ─── Event-based (rain, storm, extreme, weather_change) ────

async function checkEventNotifs() {
    if (!client?.isReady()) return;

    for (const [userId, settings] of Object.entries(db.getAllUsers())) {
        if (!settings.notifications || !settings.latitude) continue;

        const eventNotifs = settings.notifications.filter(n => n.enabled && n.event_based && ['rain_now', 'storm', 'extreme_temp', 'weather_change', 'severe', 'daily'].includes(n.type));
        if (!eventNotifs.length) continue;

        try {
            const tz = settings.timezone || 'auto';
            const data = await weather.getCurrentWeather(settings.latitude, settings.longitude, tz);
            const c = data.current;
            const wInfo = weather.getWeatherInfo(c.weather_code);
            const lastAlert = db.getAlertState(userId) || {};

            for (const notif of eventNotifs) {
                // Weather change — porovnaj s posledným stavom
                if (notif.type === 'weather_change' && notif.watch_changes?.length) {
                    const prevState = lastAlert._prevWeather || {};
                    const triggered = [];
                    const prevCode = prevState.code ?? c.weather_code;
                    const prevTemp = prevState.temp ?? c.temperature_2m;
                    const prevWind = prevState.wind ?? c.wind_speed_10m;
                    const prevPrecip = prevState.precip ?? c.precipitation;

                    for (const change of notif.watch_changes) {
                        switch (change) {
                            case 'sunny_to_cloudy':
                                if (prevCode <= 2 && c.weather_code >= 3) triggered.push('☁️ Zatiahlo sa');
                                break;
                            case 'cloudy_to_sunny':
                                if (prevCode >= 3 && c.weather_code <= 1) triggered.push('☀️ Vyjasnilo sa');
                                break;
                            case 'start_rain':
                                if (prevPrecip <= 0.1 && c.precipitation > 0.3) triggered.push(`🌧️ Začalo pršať (${c.precipitation} mm)`);
                                break;
                            case 'stop_rain':
                                if (prevPrecip > 0.3 && c.precipitation <= 0.1) triggered.push('🌤️ Prestalo pršať');
                                break;
                            case 'start_snow':
                                if (![71,73,75,77,85,86].includes(prevCode) && [71,73,75,77,85,86].includes(c.weather_code)) triggered.push('🌨️ Začalo snežiť');
                                break;
                            case 'storm_coming':
                                if (wInfo.severity < 3 || prevCode === c.weather_code) break;
                                if ([95,96,99].includes(c.weather_code)) triggered.push(`⛈️ ${wInfo.text}`);
                                break;
                            case 'fog_coming':
                                if (![45,48].includes(prevCode) && [45,48].includes(c.weather_code)) triggered.push('🌫️ Hmla');
                                break;
                            case 'wind_up':
                                if (prevWind < 35 && c.wind_speed_10m >= 40) triggered.push(`💨 Zosilnel vietor (${c.wind_speed_10m} km/h)`);
                                break;
                            case 'temp_drop':
                                if (prevTemp - c.temperature_2m >= 5) triggered.push(`🥶 Pokles o ${Math.round(prevTemp - c.temperature_2m)}°C`);
                                break;
                            case 'temp_rise':
                                if (c.temperature_2m - prevTemp >= 5) triggered.push(`🥵 Nárast o ${Math.round(c.temperature_2m - prevTemp)}°C`);
                                break;
                        }
                    }

                    // Ulož aktuálny stav pre ďalší check
                    lastAlert._prevWeather = { code: c.weather_code, temp: c.temperature_2m, wind: c.wind_speed_10m, precip: c.precipitation };
                    db.setAlertState(userId, lastAlert);

                    if (triggered.length > 0) {
                        const cooldownKey = `wc_${notif.id}`;
                        const now = Date.now();
                        if (lastAlert[cooldownKey] && (now - lastAlert[cooldownKey]) < 1800000) continue; // 30 min cooldown
                        lastAlert[cooldownKey] = now;
                        db.setAlertState(userId, lastAlert);

                        const channel = await client.channels.fetch(notif.channel_id).catch(() => null);
                        if (channel) {
                            const { EmbedBuilder } = require('discord.js');
                            const embed = new EmbedBuilder()
                                .setColor(0xF39C12)
                                .setTitle(`🔄  Zmena počasia — ${settings.city}`)
                                .setDescription(triggered.join('\n'))
                                .addFields(
                                    { name: '🌡️ Teraz', value: `${c.temperature_2m}°C`, inline: true },
                                    { name: weather.getWeatherInfo(c.weather_code).emoji, value: wInfo.text, inline: true },
                                    { name: '💨 Vietor', value: `${c.wind_speed_10m} km/h`, inline: true },
                                )
                                .setFooter({ text: 'Automatický alert • Open-Meteo' }).setTimestamp();

                            await channel.send({ content: `<@${userId}> 🔄 **Zmena počasia!**`, embeds: [embed] });
                        }
                    }
                    continue;
                }

                let shouldAlert = false;
                let alertKey = notif.type;
                let alertEmbed = null;
                let alertMsg = '';

                if (notif.type === 'rain_now') {
                    shouldAlert = c.precipitation > 0.5;
                    alertMsg = `<@${userId}> 🌧️ **Vonku prší!** (${c.precipitation} mm)`;
                    alertEmbed = embeds.buildCurrentWeatherEmbed(data, settings);
                } else if (notif.type === 'storm') {
                    shouldAlert = wInfo.severity >= 3;
                    alertMsg = `<@${userId}> ⛈️ **${wInfo.text}!**`;
                    alertEmbed = embeds.buildCurrentWeatherEmbed(data, settings);
                } else if (notif.type === 'extreme_temp') {
                    shouldAlert = c.temperature_2m < 0 || c.temperature_2m > 33;
                    const reason = c.temperature_2m < 0 ? `🥶 Mráz: **${c.temperature_2m}°C**` : `🥵 Horúčava: **${c.temperature_2m}°C**`;
                    alertMsg = `<@${userId}> 🌡️ **Extrémna teplota!** ${reason}`;
                    alertEmbed = embeds.buildCurrentWeatherEmbed(data, settings);
                } else if (notif.type === 'severe') {
                    // Okamžité výstrahy — severity >= 3
                    shouldAlert = wInfo.severity >= 3;
                    alertMsg = `<@${userId}> ⚠️ **Výstraha: ${wInfo.text}!**`;
                    alertEmbed = embeds.buildCurrentWeatherEmbed(data, settings);
                } else if (notif.type === 'daily') {
                    // Okamžitý ranný prehľad — posiela sa raz denne pri prvom checku
                    const todayKey = `daily_instant_${new Date().toISOString().split('T')[0]}`;
                    if (lastAlert[todayKey]) continue;
                    shouldAlert = true;
                    lastAlert[todayKey] = true;
                    // Fetch hourly + daily pre prehľad
                    const tz = settings.timezone || 'auto';
                    const [hd, dd] = await Promise.all([
                        weather.getHourlyForecast(settings.latitude, settings.longitude, tz, 1),
                        weather.getDailyForecast(settings.latitude, settings.longitude, tz, 1),
                    ]);
                    alertMsg = `<@${userId}> ☀️ Ranný prehľad:`;
                    alertEmbed = embeds.buildDailySummaryEmbed(hd, dd, settings);
                }

                if (!shouldAlert) {
                    // Reset alert state keď podmienka pominula
                    if (lastAlert[alertKey]) {
                        lastAlert[alertKey] = null;
                        db.setAlertState(userId, lastAlert);
                    }
                    continue;
                }

                // Cooldown — nealertuj tú istú vec viac ako raz za hodinu
                const now = Date.now();
                if (lastAlert[alertKey] && (now - lastAlert[alertKey]) < 3600000) continue;

                lastAlert[alertKey] = now;
                db.setAlertState(userId, lastAlert);

                const channel = await client.channels.fetch(notif.channel_id).catch(() => null);
                if (channel && alertEmbed) {
                    await channel.send({ content: alertMsg, embeds: [alertEmbed] });
                }
            }
        } catch (err) { console.error(`[EVENT] ${userId}:`, err.message); }
    }
}

// ─── Sunrise/Sunset with offset ────────────

async function checkSunNotifs() {
    if (!client?.isReady()) return;
    const now = new Date();
    const nowMs = now.getTime();

    for (const [userId, settings] of Object.entries(db.getAllUsers())) {
        if (!settings.notifications || !settings.latitude) continue;

        const sunNotifs = settings.notifications.filter(n => n.enabled && n.event_based && ['sunrise', 'sunset'].includes(n.type));
        if (!sunNotifs.length) continue;

        try {
            const tz = settings.timezone || 'auto';
            const dd = await weather.getDailyForecast(settings.latitude, settings.longitude, tz, 1);
            const d = dd.daily;
            if (!d?.sunrise?.[0] || !d?.sunset?.[0]) continue;

            const sunriseMs = new Date(d.sunrise[0]).getTime();
            const sunsetMs = new Date(d.sunset[0]).getTime();
            const lastAlert = db.getAlertState(userId) || {};

            for (const notif of sunNotifs) {
                const offset = (notif.offset_minutes || 0) * 60000;
                const targetMs = notif.type === 'sunrise' ? sunriseMs - offset : sunsetMs - offset;

                // Check ak sme v minútovom okne okolo target času
                const diff = Math.abs(nowMs - targetMs);
                if (diff > 45000) continue; // ±45 sekúnd tolerancia

                // Cooldown — raz za deň
                const todayKey = `${notif.type}_${d.time[0]}`;
                if (lastAlert[todayKey]) continue;

                lastAlert[todayKey] = true;
                db.setAlertState(userId, lastAlert);

                const channel = await client.channels.fetch(notif.channel_id).catch(() => null);
                if (channel) {
                    const embed = embeds.buildSunEmbed(settings, dd, notif.type);
                    const icon = notif.type === 'sunrise' ? '🌅' : '🌇';
                    const offsetText = offset > 0 ? ` (za ${notif.offset_minutes} min)` : '';
                    await channel.send({ content: `<@${userId}> ${icon} ${notif.type === 'sunrise' ? 'Východ' : 'Západ'} slnka${offsetText}`, embeds: [embed] });
                }
            }
        } catch (err) { console.error(`[SUN] ${userId}:`, err.message); }
    }
}

// ─── Server weather channels ───────────────

async function checkServerChannels() {
    if (!client?.isReady()) return;
    const now = new Date();
    const hr = now.getHours(), min = now.getMinutes();

    for (const [guildId, config] of Object.entries(db.getAllServers())) {
        if (!config.enabled || !config.latitude) continue;
        if (config.hour !== hr || (config.minute || 0) !== min) continue;
        try {
            const channel = await client.channels.fetch(config.channel_id).catch(() => null);
            if (!channel) continue;
            const tz = config.timezone || 'auto';
            const [dd, hd] = await Promise.all([
                weather.getDailyForecast(config.latitude, config.longitude, tz, 1),
                weather.getHourlyForecast(config.latitude, config.longitude, tz, 1),
            ]);
            await channel.send({ embeds: [embeds.buildServerWeatherEmbed(dd, hd, config.city)] });
        } catch (err) { console.error(`[SERVER] ${guildId}:`, err.message); }
    }
}

module.exports = { init };
