const { EmbedBuilder } = require('discord.js');
const { getWeatherInfo, getWindDirection, getAqiInfo, getWeatherIcon, getWeatherGif, getMoonPhase, getUvInfo } = require('./weather');
const { getTodayNameday } = require('./namedays');

const COLORS = {
    sunny: 0xFFB347, cloudy: 0x95A5A6, rainy: 0x3498DB, snowy: 0xECF0F1,
    storm: 0xE74C3C, night: 0x2C3E50, default: 0x5865F2,
    success: 0x57F287, error: 0xED4245, warning: 0xFEE75C, info: 0x5865F2,
};

function getColorForTemp(temp) {
    if (temp == null) return COLORS.default;
    if (temp <= -10) return 0x1A237E;  // tmavomodra
    if (temp <= -5)  return 0x283593;
    if (temp <= 0)   return 0x1565C0;  // modra
    if (temp <= 5)   return 0x1E88E5;
    if (temp <= 10)  return 0x42A5F5;  // svetlomodra
    if (temp <= 15)  return 0x26A69A;  // teal
    if (temp <= 20)  return 0x66BB6A;  // zelena
    if (temp <= 25)  return 0xFFA726;  // oranzova
    if (temp <= 30)  return 0xEF5350;  // cervena
    if (temp <= 35)  return 0xD32F2F;  // tmavocervena
    return 0xB71C1C;                   // extrem
}

function getColorForWeather(code, isDay = true, temp = null) {
    // Ak mame teplotu, pouzij teplotny gradient
    if (temp != null) return getColorForTemp(temp);
    // Fallback na weather code
    if (!isDay) return COLORS.night;
    const s = getWeatherInfo(code).severity;
    if (s >= 3) return COLORS.storm;
    if ([61,63,65,66,67,80,81,82,51,53,55,56,57].includes(code)) return COLORS.rainy;
    if ([71,73,75,77,85,86].includes(code)) return COLORS.snowy;
    if ([3,45,48].includes(code)) return COLORS.cloudy;
    return COLORS.sunny;
}

// ─── Aktuálne počasie ──────────────────────

function buildCurrentWeatherEmbed(data, userSettings, dailyData = null) {
    const c = data.current;
    const cu = data.current_units || {};
    const tu = cu.temperature_2m || '°C';
    const wu = cu.wind_speed_10m || 'km/h';
    const w = getWeatherInfo(c.weather_code);
    const wind = getWindDirection(c.wind_direction_10m);
    const isDay = c.is_day === 1;
    const color = getColorForWeather(c.weather_code, isDay, c.temperature_2m);
    const icon = getWeatherGif(c.weather_code, isDay);

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${w.emoji}  ${userSettings.city}`)
        .setDescription(`**${w.text}**`)
        .setThumbnail(icon)
        .addFields(
            { name: '🌡️ Teplota', value: `**${c.temperature_2m}${tu}**\nPocitová: ${c.apparent_temperature}${tu}`, inline: true },
            { name: '💨 Vietor', value: `${c.wind_speed_10m} ${wu} ${wind.sk}\nNárazy: ${c.wind_gusts_10m} ${wu}`, inline: true },
            { name: '💧 Vlhkosť', value: `${c.relative_humidity_2m}%\nOblačnosť: ${c.cloud_cover}%`, inline: true },
        )
        .setFooter({ text: '⛅ Nimbus' }).setTimestamp();

    if (c.precipitation > 0) {
        embed.addFields({ name: '🌧️ Zrážky', value: `${c.precipitation} mm`, inline: true });
    }

    // UV index z daily dat
    if (dailyData?.daily?.uv_index_max?.[0] != null) {
        const uv = getUvInfo(dailyData.daily.uv_index_max[0]);
        if (uv) {
            embed.addFields({ name: `${uv.emoji} UV ${uv.level}`, value: `**${uv.text}**\n${uv.bar}\n${uv.advice}`, inline: true });
        }
    }

    // Sunrise/sunset s Discord dynamickými timestampmi
    if (dailyData?.daily) {
        const d = dailyData.daily;
        const sunrise = d.sunrise?.[0];
        const sunset = d.sunset?.[0];
        if (sunrise && sunset) {
            const now = new Date();
            const sunriseTime = new Date(sunrise);
            const sunsetTime = new Date(sunset);
            const sunriseUnix = Math.floor(sunriseTime.getTime() / 1000);
            const sunsetUnix = Math.floor(sunsetTime.getTime() / 1000);
            let sunText;
            if (now < sunriseTime) {
                sunText = `🌅 Východ <t:${sunriseUnix}:t> (<t:${sunriseUnix}:R>)\n🌇 Západ <t:${sunsetUnix}:t>`;
            } else if (now < sunsetTime) {
                sunText = `🌇 Západ <t:${sunsetUnix}:t> (<t:${sunsetUnix}:R>)`;
            } else {
                sunText = `🌙 Slnko zapadlo <t:${sunsetUnix}:t>`;
            }
            embed.addFields({ name: '☀️ Slnko', value: sunText, inline: true });
        }
    }

    // Meniny
    const nameday = getTodayNameday();
    if (nameday) {
        embed.addFields({ name: '🎂 Meniny', value: nameday, inline: true });
    }

    return embed;
}

// ─── Denná predpoveď ───────────────────────

function buildDailyForecastEmbed(data, userSettings, dayIndex = 0) {
    const d = data.daily;
    const code = d.weather_code?.[dayIndex] ?? 0;
    const w = getWeatherInfo(code);
    const color = getColorForWeather(code);
    const icon = getWeatherGif(code, true);
    const date = new Date(d.time[dayIndex] + 'T12:00:00');
    const dayNames = ['Nedeľa','Pondelok','Utorok','Streda','Štvrtok','Piatok','Sobota'];
    const dateStr = `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`;
    const sunriseRaw = d.sunrise?.[dayIndex];
    const sunsetRaw = d.sunset?.[dayIndex];
    const sunriseUnix = sunriseRaw ? Math.floor(new Date(sunriseRaw).getTime() / 1000) : 0;
    const sunsetUnix = sunsetRaw ? Math.floor(new Date(sunsetRaw).getTime() / 1000) : 0;
    const sunText = sunriseUnix ? `↑ <t:${sunriseUnix}:t>  ↓ <t:${sunsetUnix}:t>` : '?';
    const uv = d.uv_index_max?.[dayIndex];

    const fields = [
        { name: '🌡️ Teplota', value: `↑ **${d.temperature_2m_max?.[dayIndex]??'?'}°C** ↓ ${d.temperature_2m_min?.[dayIndex]??'?'}°C`, inline: true },
        { name: '💨 Vietor', value: `Max: ${d.wind_speed_10m_max?.[dayIndex]??'?'} km/h\nNárazy: ${d.wind_gusts_10m_max?.[dayIndex]??'?'} km/h`, inline: true },
        { name: '🌧️ Zrážky', value: `${d.precipitation_sum?.[dayIndex]??0} mm | ${d.precipitation_probability_max?.[dayIndex]??'?'}%`, inline: true },
        { name: '🌅 Slnko', value: sunText, inline: true },
    ];
    if (uv != null) {
        const uvInfo = getUvInfo(uv);
        if (uvInfo) fields.push({ name: `${uvInfo.emoji} UV ${uvInfo.level}`, value: `${uvInfo.text} — ${uvInfo.advice}`, inline: true });
    }

    return new EmbedBuilder().setColor(color)
        .setTitle(`${w.emoji}  ${dayNames[date.getDay()]}, ${dateStr} — ${userSettings.city}`)
        .setDescription(`**${w.text}**`).setThumbnail(icon).addFields(...fields)
        .setFooter({ text: '⛅ Nimbus' }).setTimestamp();
}

// ─── Multi-day ─────────────────────────────

function buildMultiDayEmbed(data, userSettings) {
    const d = data.daily;
    const du = data.daily_units || {};
    const tu = du.temperature_2m_max || '°C';
    const days = d.time.length;
    const dayNames = ['Ne','Po','Ut','St','Št','Pi','So'];

    const temps = [];
    for (let i = 0; i < days; i++) temps.push(d.temperature_2m_max?.[i] ?? 0);
    const spark = buildSparkline(temps);

    const lines = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(d.time[i] + 'T12:00:00');
        const dn = dayNames[date.getDay()];
        const dateStr = `${date.getDate()}.${date.getMonth()+1}.`;
        const w = getWeatherInfo(d.weather_code?.[i] ?? 0);
        const precip = d.precipitation_probability_max?.[i];
        const pStr = precip != null && precip > 20 ? ` 💧${precip}%` : '';
        lines.push(`${w.emoji} **${dn} ${dateStr}** — ${d.temperature_2m_max?.[i]??'?'}°/${d.temperature_2m_min?.[i]??'?'}° — ${w.text}${pStr}`);
    }

    return new EmbedBuilder()
        .setColor(getColorForWeather(d.weather_code?.[0] || 0))
        .setTitle(`📅  Predpoveď na ${days} dní — ${userSettings.city}`)
        .setDescription(`\`${spark}\` max ${tu}\n\n${lines.join('\n')}`)
        .setFooter({ text: '⛅ Nimbus' }).setTimestamp();
}

// ─── Daily summary ─────────────────────────

function buildDailySummaryEmbed(hourlyData, dailyData, userSettings) {
    const d = dailyData.daily;
    const du = dailyData.daily_units || {};
    const tu = du.temperature_2m_max || '°C';
    const wsu = du.wind_speed_10m_max || 'km/h';
    const h = hourlyData.hourly;
    const w = getWeatherInfo(d.weather_code?.[0] ?? 0);
    const today = d.time?.[0];
    const severeHours = [], rainyHours = [];
    let maxSeverity = 0;

    if (today && h?.time) {
        for (let i = 0; i < h.time.length; i++) {
            if (!h.time[i]?.startsWith(today)) continue;
            const info = getWeatherInfo(h.weather_code?.[i] ?? 0);
            if (info.severity > maxSeverity) maxSeverity = info.severity;
            if (info.severity >= 3) {
                severeHours.push({ hour: new Date(h.time[i]).getHours(), text: info.text, prob: h.precipitation_probability?.[i] ?? 0 });
            }
            if ((h.precipitation_probability?.[i] ?? 0) > 40) {
                rainyHours.push({ hour: new Date(h.time[i]).getHours(), prob: h.precipitation_probability[i] });
            }
        }
    }

    let summary = '';
    if (maxSeverity === 0) summary = `☀️ **Dnes nič špeciálne** — ${w.text.toLowerCase()} počas celého dňa.`;
    else if (maxSeverity <= 1) summary = `🌤️ **Pokojný deň** — ${w.text.toLowerCase()}, žiadne výrazné zmeny.`;
    else if (maxSeverity <= 2) summary = `⚠️ **Pozor na zrážky** — očakávaj ${w.text.toLowerCase()}.`;
    else summary = `🚨 **Výstraha!** Očakávajú sa výrazné poveternostné javy!`;

    if (severeHours.length > 0) {
        const ranges = groupHours(severeHours.map(h => h.hour));
        summary += `\n\n⛈️ **Silné javy:** ${severeHours[0].text} — ${ranges}`;
        summary += `\n📊 Pravdepodobnosť: ${Math.max(...severeHours.map(h => h.prob))}%`;
    } else if (rainyHours.length > 0) {
        const ranges = groupHours(rainyHours.map(h => h.hour));
        summary += `\n\n🌧️ **Dážď:** pravdepodobný ${ranges}`;
        summary += `\n📊 Pravdepodobnosť: až ${Math.max(...rainyHours.map(h => h.prob))}%`;
    }

    const sunriseRaw = d.sunrise?.[0];
    const sunsetRaw = d.sunset?.[0];
    const sunriseUnix = sunriseRaw ? Math.floor(new Date(sunriseRaw).getTime() / 1000) : 0;
    const sunsetUnix = sunsetRaw ? Math.floor(new Date(sunsetRaw).getTime() / 1000) : 0;
    const sunText = sunriseUnix ? `↑ <t:${sunriseUnix}:t>  ↓ <t:${sunsetUnix}:t>` : '?';

    const nameday = getTodayNameday();
    const fields = [
        { name: '🌡️ Teploty', value: `↑ **${d.temperature_2m_max?.[0]??'?'}${tu}** ↓ ${d.temperature_2m_min?.[0]??'?'}${tu}`, inline: true },
        { name: '💨 Vietor', value: `Max: ${d.wind_speed_10m_max?.[0]??'?'} ${wsu}\nNárazy: ${d.wind_gusts_10m_max?.[0]??'?'} ${wsu}`, inline: true },
        { name: '🌅 Slnko', value: sunText, inline: true },
    ];
    if (nameday) fields.push({ name: '🎂 Meniny', value: nameday, inline: true });

    // Hodinovy graf teploty
    const hourlyGraph = buildHourlyGraph(hourlyData, today);
    if (hourlyGraph) {
        fields.push({ name: '📊 Teplota 24h', value: hourlyGraph, inline: false });
    }

    return new EmbedBuilder()
        .setColor(getColorForWeather(d.weather_code?.[0] ?? 0, true, d.temperature_2m_max?.[0]))
        .setTitle(`${w.emoji}  Ranný prehľad — ${userSettings.city}`)
        .setDescription(summary)
        .addFields(...fields)
        .setFooter({ text: '🔔 Automatická notifikácia' }).setTimestamp();
}

// ─── Air Quality ───────────────────────────

function buildAirQualityEmbed(data, userSettings) {
    const c = data.current;
    const aqi = c?.european_aqi;
    const info = getAqiInfo(aqi);

    const embed = new EmbedBuilder()
        .setColor(info.color)
        .setTitle(`${info.emoji}  Kvalita vzduchu — ${userSettings.city}`)
        .setDescription(`**${info.text}** (European AQI: ${aqi ?? '?'})`)
        .addFields(
            { name: 'PM2.5', value: `${c?.pm2_5 ?? '?'} µg/m³`, inline: true },
            { name: 'PM10', value: `${c?.pm10 ?? '?'} µg/m³`, inline: true },
            { name: 'NO₂', value: `${c?.nitrogen_dioxide ?? '?'} µg/m³`, inline: true },
            { name: 'O₃', value: `${c?.ozone ?? '?'} µg/m³`, inline: true },
            { name: 'SO₂', value: `${c?.sulphur_dioxide ?? '?'} µg/m³`, inline: true },
        )
        .setFooter({ text: '🏔️ Kvalita vzduchu' }).setTimestamp();

    return embed;
}

// ─── Compare dva mestá ─────────────────────

function buildCompareEmbed(data1, data2, city1, city2) {
    const c1 = data1.current, c2 = data2.current;
    const w1 = getWeatherInfo(c1.weather_code), w2 = getWeatherInfo(c2.weather_code);

    const embed = new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle(`🌍  ${city1} vs ${city2}`)
        .addFields(
            { name: `${w1.emoji} ${city1}`, value: [
                `🌡️ **${c1.temperature_2m}°C** (pocit. ${c1.apparent_temperature}°C)`,
                `${w1.text}`,
                `💨 ${c1.wind_speed_10m} km/h | 💧 ${c1.relative_humidity_2m}%`,
                `☁️ ${c1.cloud_cover}% | 🌧️ ${c1.precipitation} mm`,
            ].join('\n'), inline: true },
            { name: `${w2.emoji} ${city2}`, value: [
                `🌡️ **${c2.temperature_2m}°C** (pocit. ${c2.apparent_temperature}°C)`,
                `${w2.text}`,
                `💨 ${c2.wind_speed_10m} km/h | 💧 ${c2.relative_humidity_2m}%`,
                `☁️ ${c2.cloud_cover}% | 🌧️ ${c2.precipitation} mm`,
            ].join('\n'), inline: true },
        );

    // Rozdiel
    const diff = (c1.temperature_2m - c2.temperature_2m).toFixed(1);
    const warmer = diff > 0 ? city1 : city2;
    embed.addFields({
        name: '📊 Rozdiel',
        value: `${warmer} je o **${Math.abs(diff)}°C** teplejšie`,
        inline: false,
    });

    return embed.setFooter({ text: '⛅ Nimbus' }).setTimestamp();
}

// ─── Storm alert ───────────────────────────

function buildStormAlertEmbed(userSettings, hourlyData) {
    const h = hourlyData.hourly;
    const alerts = [];
    for (let i = 0; i < h.time.length; i++) {
        const info = getWeatherInfo(h.weather_code?.[i] ?? 0);
        if (info.severity >= 3) {
            alerts.push({ hour: new Date(h.time[i]).getHours(), text: info.text, emoji: info.emoji });
        }
    }
    if (alerts.length === 0) return null;
    const ranges = groupHours(alerts.map(a => a.hour));
    return new EmbedBuilder()
        .setColor(COLORS.storm)
        .setTitle(`⚡  Búrkový alert — ${userSettings.city}`)
        .setDescription(`**${alerts[0].emoji} ${alerts[0].text}** sa blíži!\n\nOčakávaný čas: **${ranges}**`)
        .setFooter({ text: '⚡ Automatický alert' }).setTimestamp();
}

// ─── Sunrise/Sunset ────────────────────────

function buildSunEmbed(userSettings, dailyData, type = 'sunrise') {
    const d = dailyData.daily;
    const sunriseRaw = d.sunrise?.[0];
    const sunsetRaw = d.sunset?.[0];
    const w = getWeatherInfo(d.weather_code?.[0] ?? 0);

    const sunriseUnix = sunriseRaw ? Math.floor(new Date(sunriseRaw).getTime() / 1000) : 0;
    const sunsetUnix = sunsetRaw ? Math.floor(new Date(sunsetRaw).getTime() / 1000) : 0;

    if (type === 'sunrise') {
        return new EmbedBuilder()
            .setColor(0xFFB347)
            .setTitle(`🌅  Východ slnka — ${userSettings.city}`)
            .setDescription(
                `Slnko vychádza <t:${sunriseUnix}:t> (<t:${sunriseUnix}:R>)\n` +
                `Západ dnes <t:${sunsetUnix}:t>\n\n` +
                `${w.emoji} Dnes: ${w.text}, ${d.temperature_2m_max?.[0]??'?'}°/${d.temperature_2m_min?.[0]??'?'}°`
            )
            .setFooter({ text: '⛅ Nimbus' }).setTimestamp();
    }
    return new EmbedBuilder()
        .setColor(0x2C3E50)
        .setTitle(`🌇  Západ slnka — ${userSettings.city}`)
        .setDescription(
            `Slnko zapadá <t:${sunsetUnix}:t> (<t:${sunsetUnix}:R>)\n` +
            `Východ bol dnes <t:${sunriseUnix}:t>`
        )
        .setFooter({ text: '⛅ Nimbus' }).setTimestamp();
}

// ─── Settings ──────────────────────────────

function buildSettingsEmbed(s) {
    const notifs = s?.notifications || [];
    const favs = s?.favorites || [];
    const notifList = notifs.length > 0
        ? notifs.map(n => {
            const status = n.enabled ? '🟢' : '🔴';
            const time = (n.event_based || n.hour == null) ? '⚡' : `${String(n.hour).padStart(2,'0')}:${String(n.minute).padStart(2,'0')}`;
            const types = { daily: 'Ranny prehlad', severe: 'Vystrahy', storm: 'Burka', sunrise: 'Vychod', sunset: 'Zapad', rain_now: 'Prsi', extreme_temp: 'Extrem', weather_change: 'Zmena' };
            return `${status} ${time} — ${types[n.type] || n.type}`;
        }).join('\n')
        : '*Ziadne*';
    const favList = favs.length > 0 ? favs.map((f, i) => `⭐ ${f.name}`).join(', ') : '*Ziadne*';
    const viewLabels = { current: 'Aktualne', today: 'Dnes', '7d': '7 dni', '14d': '14 dni' };
    const defaultView = viewLabels[s?.default_view] || 'Aktualne';

    return new EmbedBuilder().setColor(COLORS.info).setTitle('⚙️  Tvoje nastavenia')
        .setDescription('Klikni na tlacidla nizsie a nastav si vsetko.')
        .addFields(
            { name: '📍 Mesto', value: s?.city || '*Nenastavene*', inline: true },
            { name: '🌐 Suradnice', value: s?.latitude ? `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}` : '*—*', inline: true },
            { name: '🕐 Zona', value: s?.timezone || '*auto*', inline: true },
            { name: '📋 Default zobrazenie', value: defaultView, inline: true },
            { name: '🔔 Notifikacie', value: notifList, inline: false },
            { name: '⭐ Oblubene', value: favList, inline: false },
        )
        .setFooter({ text: '⚙️ Nastavenia sa ukladaju automaticky' }).setTimestamp();
}

function buildErrorEmbed(msg) {
    return new EmbedBuilder().setColor(COLORS.error).setTitle('❌  Chyba').setDescription(msg).setTimestamp();
}

function buildSuccessEmbed(msg) {
    return new EmbedBuilder().setColor(COLORS.success).setTitle('✅  Hotovo').setDescription(msg).setTimestamp();
}

// ─── "Kedy bude pekne?" ───────────────────

function buildNiceDaysEmbed(niceDays, userSettings) {
    if (niceDays.length === 0) {
        return new EmbedBuilder().setColor(COLORS.cloudy)
            .setTitle(`☁️  Kedy bude pekne? — ${userSettings.city}`)
            .setDescription('V najbližších 16 dňoch žiadny jasný deň bez zrážok. Drž sa!')
            .setThumbnail(getWeatherIcon(3, true))
            .setFooter({ text: '⛅ Nimbus' }).setTimestamp();
    }

    const lines = niceDays.map(d => {
        const w = getWeatherInfo(d.code);
        return `${w.emoji} **${d.dayName} ${d.dateStr}** — ${d.tMax}°/${d.tMin}° — ${w.text}`;
    });

    const first = niceDays[0];
    const today = new Date();
    const firstDate = new Date(first.date + 'T12:00:00');
    const daysUntil = Math.round((firstDate - today) / 86400000);
    const when = daysUntil === 0 ? 'Dnes!' : daysUntil === 1 ? 'Zajtra!' : `Za ${daysUntil} dní`;

    return new EmbedBuilder().setColor(COLORS.sunny)
        .setTitle(`☀️  Kedy bude pekne? — ${userSettings.city}`)
        .setDescription(`**${when}** Najbližší pekný deň: **${first.dayName} ${first.dateStr}**\n\n${lines.join('\n')}`)
        .setThumbnail(getWeatherIcon(0, true))
        .setFooter({ text: `☀️ ${niceDays.length} pekných dní z 16` }).setTimestamp();
}

// ─── Helpers ───────────────────────────────

function groupHours(hours) {
    if (!hours.length) return '';
    hours.sort((a, b) => a - b);
    const groups = [[hours[0]]];
    for (let i = 1; i < hours.length; i++) {
        if (hours[i] - hours[i-1] === 1) groups[groups.length-1].push(hours[i]);
        else groups.push([hours[i]]);
    }
    return groups.map(g => g.length === 1 ? `${g[0]}:00` : `${g[0]}:00–${g[g.length-1]+1}:00`).join(', ');
}

function buildSparkline(values) {
    const blocks = ['▁','▂','▃','▄','▅','▆','▇','█'];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values.map(v => blocks[Math.round(((v - min) / range) * 7)]).join('');
}

function buildHourlyGraph(hourlyData, today) {
    if (!hourlyData?.hourly?.time) return null;
    const h = hourlyData.hourly;
    const temps = [];
    const hours = [];

    for (let i = 0; i < h.time.length; i++) {
        if (!h.time[i]?.startsWith(today)) continue;
        const hr = new Date(h.time[i]).getHours();
        // Kazdu 2. hodinu pre citatelnost
        if (hr % 2 !== 0) continue;
        temps.push(h.temperature_2m?.[i] ?? 0);
        hours.push(hr);
    }

    if (temps.length === 0) return null;

    const spark = buildSparkline(temps);
    const labels = hours.map(h => String(h).padStart(2, ' ')).join('');
    const min = Math.min(...temps);
    const max = Math.max(...temps);

    return `\`${spark}\`\n\`${labels}\`h\n↓ ${Math.round(min)}° · ↑ ${Math.round(max)}°`;
}

// ─── Loading embed ─────────────────────────

function buildLoadingEmbed(text = 'Načítavam počasie...') {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setDescription(`<a:loading:1483746464122273855> ${text}`)
        ;
}

// ─── Help embed ────────────────────────────

function buildHelpEmbed(section = 'main') {
    const e = new EmbedBuilder().setColor(0x5865F2);

    switch (section) {
        case 'main':
            return e.setTitle('Nimbus Weather Bot')
                .setDescription('Kompletny pocasovy bot pre Discord.\nKlikni na button nizsie pre detail kazdej sekcie.')
                .addFields(
                    { name: 'Pocasie', value: '/pocasie, /vzduch, /radar, /mesiac', inline: true },
                    { name: 'Smart', value: '/outfit, /doprava', inline: true },
                    { name: 'Nastavenia', value: '/nastavenia, /oblubene', inline: true },
                    { name: 'Notifikacie', value: '/notifikacie — 8 typov alertov', inline: true },
                    { name: 'Server', value: '/poll, /kanal', inline: true },
                )
                .setFooter({ text: 'Nimbus' }).setTimestamp();

        case 'pocasie':
            return e.setTitle('Pocasie — commandy')
                .addFields(
                    { name: '/pocasie', value: 'Aktualne pocasie s buttonmi na dnes, 7/14 dni, vzduch, "kedy pekne", outfit, doprava', inline: false },
                    { name: '/pocasie mesto:Praha', value: 'Jednorazovo ine mesto (neprepise tvoje nastavenia)', inline: false },
                    { name: '/pocasie mesto2:Kosice', value: 'Porovnanie dvoch miest vedla seba', inline: false },
                    { name: '/vzduch', value: 'Kvalita vzduchu — European AQI, PM2.5, PM10, NO2, O3, SO2', inline: false },
                    { name: '/radar', value: 'Odkaz na live radar zrazok (RainViewer)', inline: false },
                    { name: '/mesiac', value: 'Lunarny kalendar — fazy mesiaca na 14 dni', inline: false },
                )
                .setFooter({ text: 'Nimbus' }).setTimestamp();

        case 'smart':
            return e.setTitle('Smart funkcie')
                .addFields(
                    { name: '/outfit', value: 'Co si oblect dnes — vrstvy, obuv, doplnky podla teploty, vetra a dazda', inline: false },
                    { name: '/doprava', value: 'Dopravne varovania — namraza, hmla, vietor, silny dazd, burka, snezenie, ranna namraza zajtra', inline: false },
                    { name: 'Kedy pekne? (button)', value: 'Najde najblizsie pekne dni v 16-dnovej predpovedi', inline: false },
                )
                .setFooter({ text: 'Nimbus' }).setTimestamp();

        case 'notif':
            return e.setTitle('Notifikacie — 8 typov')
                .setDescription('Nastavuj cez /nastavenia alebo /notifikacie')
                .addFields(
                    { name: 'Ranny prehlad', value: 'V konkretny cas ALEBO okamzite raz denne', inline: true },
                    { name: 'Vystrahy pocasia', value: 'V cas ALEBO hned pri severity 3+', inline: true },
                    { name: 'Zmena pocasia', value: 'Multi-select 10 typov zmien (slnecno->oblacno, zacne prsat...)', inline: false },
                    { name: 'Prsi / Burka / Extrem', value: 'Okamzite keD sa nieco zisti', inline: true },
                    { name: 'Vychod / Zapad slnka', value: 'S offsetom 0-60 min pred udalostou', inline: true },
                )
                .setFooter({ text: 'Nimbus' }).setTimestamp();

        case 'server':
            return e.setTitle('Server funkcie')
                .addFields(
                    { name: '/poll', value: 'Vyber den z 7-dnovej predpovede → verejny poll s reakciami', inline: false },
                    { name: '/kanal', value: 'Admin nastavi kanal pre automaticky ranny post s pocasim (denne o zadanej hodine)', inline: false },
                    { name: '/oblubene', value: 'Uloz az 10 oblubenych miest a rychlo prepinaj', inline: false },
                )
                .setFooter({ text: 'Nimbus' }).setTimestamp();

        default:
            return buildHelpEmbed('main');
    }
}

// ─── Poll embed ────────────────────────────

function buildPollEmbed(dailyData, userSettings, dayOffset = 0) {
    const d = dailyData.daily;
    const idx = Math.min(dayOffset, (d.time?.length || 1) - 1);
    const code = d.weather_code?.[idx] ?? 0;
    const w = getWeatherInfo(code);
    const icon = getWeatherGif(code, true);
    const tMax = d.temperature_2m_max?.[idx] ?? '?';
    const tMin = d.temperature_2m_min?.[idx] ?? '?';
    const precip = d.precipitation_probability_max?.[idx] ?? 0;
    const wind = d.wind_speed_10m_max?.[idx] ?? 0;
    const sunriseRaw = d.sunrise?.[idx];
    const sunsetRaw = d.sunset?.[idx];
    const sunriseUnix = sunriseRaw ? Math.floor(new Date(sunriseRaw).getTime() / 1000) : 0;
    const sunsetUnix = sunsetRaw ? Math.floor(new Date(sunsetRaw).getTime() / 1000) : 0;
    const sunLine = sunriseUnix ? `🌅 <t:${sunriseUnix}:t> → <t:${sunsetUnix}:t>` : '';

    // Názov dňa
    const dayNames = ['Nedeľa','Pondelok','Utorok','Streda','Štvrtok','Piatok','Sobota'];
    const date = new Date(d.time[idx] + 'T12:00:00');
    const dayName = dayNames[date.getDay()];
    const dateStr = `${date.getDate()}.${date.getMonth()+1}.`;
    const dayLabel = dayOffset === 0 ? 'Dnes' : dayOffset === 1 ? 'Zajtra' : `${dayName} ${dateStr}`;

    // Auto-odporúčanie
    let verdict, verdictEmoji;
    const severity = getWeatherInfo(code).severity;
    if (severity >= 3) { verdict = 'Radšej zostaňte doma'; verdictEmoji = '🏠'; }
    else if (precip > 60) { verdict = 'Dážď je dosť pravdepodobný'; verdictEmoji = '🌧️'; }
    else if (precip > 30) { verdict = 'Možno si zoberte dáždnik'; verdictEmoji = '☂️'; }
    else if (tMax > 30) { verdict = 'Horúco, nezabudnite na vodu'; verdictEmoji = '🥵'; }
    else if (tMax < 0) { verdict = 'Mrzne, obliekajte sa teplo'; verdictEmoji = '🥶'; }
    else if (wind > 50) { verdict = 'Silný vietor, pozor vonku'; verdictEmoji = '💨'; }
    else if (code <= 1 && precip < 15) { verdict = 'Ideálny deň na vonku!'; verdictEmoji = '🎉'; }
    else { verdict = 'Celkom OK, dá sa ísť von'; verdictEmoji = '👌'; }

    return new EmbedBuilder()
        .setColor(getColorForWeather(code))
        .setTitle(`🗳️  Pôjdeme von? — ${dayLabel} — ${userSettings.city}`)
        .setThumbnail(icon)
        .setDescription(
            `${w.emoji} **${w.text}**\n\n` +
            `🌡️ **${tMax}°** / ${tMin}°  ·  💧 ${precip}%  ·  💨 ${wind} km/h\n` +
            `${sunLine}\n\n` +
            `${verdictEmoji} **${verdict}**\n\n` +
            `Hlasuj reakciami 👍 👎 🤷`
        )
        .setFooter({ text: `🗳️ ${dayName} ${dateStr}` }).setTimestamp();
}

// ─── Multi-day poll ────────────────────────

function buildMultiPollEmbed(dailyData, userSettings, dayOffsets) {
    const d = dailyData.daily;
    const dayNames = ['Nedeľa','Pondelok','Utorok','Streda','Štvrtok','Piatok','Sobota'];
    const numberEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣'];

    const lines = dayOffsets.map((idx, i) => {
        const code = d.weather_code?.[idx] ?? 0;
        const w = getWeatherInfo(code);
        const date = new Date(d.time[idx] + 'T12:00:00');
        const dayName = dayNames[date.getDay()];
        const dateStr = `${date.getDate()}.${date.getMonth()+1}.`;
        const tMax = d.temperature_2m_max?.[idx] ?? '?';
        const tMin = d.temperature_2m_min?.[idx] ?? '?';
        const precip = d.precipitation_probability_max?.[idx] ?? 0;
        const dayLabel = idx === 0 ? 'Dnes' : idx === 1 ? 'Zajtra' : `${dayName} ${dateStr}`;

        return `${numberEmojis[i]} **${dayLabel}** — ${w.emoji} ${w.text} | ${tMax}°/${tMin}° | 💧 ${precip}%`;
    });

    // Nájdi najlepší deň
    let bestIdx = 0;
    let bestScore = -999;
    dayOffsets.forEach((idx, i) => {
        const code = d.weather_code?.[idx] ?? 99;
        const precip = d.precipitation_probability_max?.[idx] ?? 100;
        const temp = d.temperature_2m_max?.[idx] ?? 0;
        const score = (code <= 2 ? 10 : code <= 3 ? 5 : 0) + (100 - precip) / 10 + Math.min(temp, 25) / 5;
        if (score > bestScore) { bestScore = score; bestIdx = i; }
    });

    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🗳️  Kedy ideme von? — ${userSettings.city}`)
        .setDescription(
            lines.join('\n\n') +
            `\n\n⭐ **Odporúčanie:** ${numberEmojis[bestIdx]} vyzerá najlepšie!\n\n` +
            `Hlasuj reakciou za deň ktorý ti vyhovuje:`
        )
        .setFooter({ text: '⛅ Nimbus' }).setTimestamp();
}

// ─── Server channel embed ──────────────────

function buildServerWeatherEmbed(dailyData, hourlyData, city) {
    const d = dailyData.daily;
    const w = getWeatherInfo(d.weather_code?.[0] ?? 0);
    const code = d.weather_code?.[0] ?? 0;
    const icon = getWeatherGif(code, true);
    const sunriseRaw = d.sunrise?.[0];
    const sunsetRaw = d.sunset?.[0];
    const sunriseUnix = sunriseRaw ? Math.floor(new Date(sunriseRaw).getTime() / 1000) : 0;
    const sunsetUnix = sunsetRaw ? Math.floor(new Date(sunsetRaw).getTime() / 1000) : 0;
    const sunText = sunriseUnix ? `↑ <t:${sunriseUnix}:t>  ↓ <t:${sunsetUnix}:t>` : '?';

    // Mini hodinový prehľad
    const h = hourlyData?.hourly;
    let hourlyPreview = '';
    if (h?.time) {
        const today = d.time?.[0];
        const hours = [8, 12, 16, 20];
        const parts = [];
        for (const hr of hours) {
            const idx = h.time.findIndex(t => t?.startsWith(today) && new Date(t).getHours() === hr);
            if (idx >= 0) {
                const hw = getWeatherInfo(h.weather_code?.[idx] ?? 0);
                parts.push(`${hr}:00 ${hw.emoji} ${h.temperature_2m?.[idx] ?? '?'}°`);
            }
        }
        if (parts.length) hourlyPreview = parts.join(' → ');
    }

    const embed = new EmbedBuilder()
        .setColor(getColorForWeather(code))
        .setTitle(`${w.emoji}  Počasie dnes — ${city}`)
        .setThumbnail(icon)
        .setDescription(`**${w.text}**`)
        .addFields(
            { name: '🌡️ Teploty', value: `↑ **${d.temperature_2m_max?.[0]??'?'}°C** ↓ ${d.temperature_2m_min?.[0]??'?'}°C`, inline: true },
            { name: '🌧️ Zrážky', value: `${d.precipitation_sum?.[0]??0} mm | ${d.precipitation_probability_max?.[0]??'?'}%`, inline: true },
            { name: '🌅 Slnko', value: sunText, inline: true },
        )
        .setFooter({ text: '📢 Ranný post' }).setTimestamp();

    if (hourlyPreview) {
        embed.addFields({ name: '🕐 Priebeh dňa', value: hourlyPreview, inline: false });
    }

    const nameday = getTodayNameday();
    if (nameday) {
        embed.addFields({ name: '🎂 Meniny', value: nameday, inline: true });
    }

    return embed;
}

// ─── Lunárny kalendár ──────────────────────

function buildLunarEmbed(lunarDays) {
    const today = lunarDays[0];
    const lines = lunarDays.map((d, i) => {
        const bold = (d.name === 'Spln' || d.name === 'Nov' || d.name === 'Prvá štvrť' || d.name === 'Posledná štvrť');
        const label = `${d.emoji} **${d.dayName} ${d.dateStr}**`;
        return bold ? `${label} — **${d.name}**` : `${label} — ${d.name}`;
    });

    // Nájdi najbližší spln a nov
    const nextFull = lunarDays.find(d => d.name === 'Spln');
    const nextNew = lunarDays.find(d => d.name === 'Nov');
    let highlights = '';
    if (nextFull) highlights += `\n🌕 Najbližší spln: **${nextFull.dayName} ${nextFull.dateStr}**`;
    if (nextNew) highlights += `\n🌑 Najbližší nov: **${nextNew.dayName} ${nextNew.dateStr}**`;

    return new EmbedBuilder()
        .setColor(0x2C3E50)
        .setTitle(`${today.emoji}  Lunárny kalendár`)
        .setDescription(`Dnes: **${today.name}** (deň ${today.synodicDay}/30)${highlights}\n\n${lines.join('\n')}`)
        .setFooter({ text: '🌙 Lunárny kalendár' }).setTimestamp();
}

// ─── Outfit odporúčanie ────────────────────

function buildOutfitEmbed(outfit, userSettings) {
    const layerText = outfit.layers.join('\n');
    const accText = outfit.accessories.length ? outfit.accessories.join('\n') : '*Nič špeciálne*';
    const tipText = outfit.tip ? `\n\n💡 *${outfit.tip}*` : '';

    return new EmbedBuilder()
        .setColor(outfit.temp < 0 ? 0x3498DB : outfit.temp < 15 ? 0xF39C12 : outfit.temp < 25 ? 0x57F287 : 0xE74C3C)
        .setTitle(`${outfit.emoji}  Čo si obliecť — ${userSettings.city}`)
        .setDescription(`**${outfit.temp}°C** (pocit. ${outfit.feelsLike}°C) · 💧 ${outfit.rain}% · 💨 ${outfit.wind} km/h${tipText}`)
        .addFields(
            { name: '👔 Oblečenie', value: layerText, inline: false },
            { name: '👟 Obuv', value: outfit.footwear, inline: true },
            { name: '🎒 Doplnky', value: accText, inline: true },
        )
        .setFooter({ text: '⛅ Nimbus' }).setTimestamp();
}

// ─── Dopravné varovanie ────────────────────

function buildTrafficEmbed(warnings, userSettings) {
    if (warnings.length === 0) {
        return new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle(`✅  Doprava OK — ${userSettings.city}`)
            .setDescription('Žiadne výstrahy — cesty by mali byť v poriadku.')
            .setFooter({ text: '⛅ Nimbus' }).setTimestamp();
    }

    const levelColors = { 1: 0xFEE75C, 2: 0xF39C12, 3: 0xED4245 };
    const levelLabels = { 1: 'ℹ️ Info', 2: '⚠️ Výstraha', 3: '🚨 Nebezpečenstvo' };
    const maxLevel = Math.max(...warnings.map(w => w.level));

    const lines = warnings.map(w => `${w.emoji} **${w.title}** (${levelLabels[w.level]})\n${w.desc}`);

    return new EmbedBuilder()
        .setColor(levelColors[maxLevel] || 0xED4245)
        .setTitle(`🚗  Dopravné varovania — ${userSettings.city}`)
        .setDescription(lines.join('\n\n'))
        .setFooter({ text: `🚗 ${warnings.length} varovanie/a` }).setTimestamp();
}

// ─── Historicke porovnanie ────────────────

function buildHistoryEmbed(dailyData, historical, userSettings) {
    const d = dailyData.daily;
    const todayMax = d.temperature_2m_max?.[0];
    const todayMin = d.temperature_2m_min?.[0];
    const du = dailyData.daily_units || {};
    const tu = du.temperature_2m_max || '°C';

    if (!historical) {
        return new EmbedBuilder()
            .setColor(COLORS.info)
            .setTitle(`📊  Historicke porovnanie — ${userSettings.city}`)
            .setDescription('Historicke data nie su dostupne pre tuto lokalitu.')
            .setFooter({ text: '⛅ Nimbus' }).setTimestamp();
    }

    const diffMax = todayMax != null ? Math.round((todayMax - historical.avgMax) * 10) / 10 : null;
    const diffMin = todayMin != null ? Math.round((todayMin - historical.avgMin) * 10) / 10 : null;

    let verdict = '';
    if (diffMax != null) {
        if (diffMax > 3) verdict = '🥵 Vyrazne teplejsie ako zvycajne!';
        else if (diffMax > 1) verdict = '🌡️ Teplejsie ako priemer';
        else if (diffMax < -3) verdict = '🥶 Vyrazne chladnejsie ako zvycajne!';
        else if (diffMax < -1) verdict = '❄️ Chladnejsie ako priemer';
        else verdict = '✅ Blizko priemeru';
    }

    const diffMaxStr = diffMax != null ? (diffMax >= 0 ? `+${diffMax}` : `${diffMax}`) : '?';
    const diffMinStr = diffMin != null ? (diffMin >= 0 ? `+${diffMin}` : `${diffMin}`) : '?';

    const yearLines = historical.years.map(y =>
        `${y.year}: ${y.max}° / ${y.min}°`
    ).join('\n');

    return new EmbedBuilder()
        .setColor(getColorForTemp(todayMax))
        .setTitle(`📊  Dnes vs priemer — ${userSettings.city}`)
        .setDescription(`**${verdict}**`)
        .addFields(
            { name: '🌡️ Dnes', value: `↑ **${todayMax}${tu}** ↓ ${todayMin}${tu}`, inline: true },
            { name: `📈 Priemer (${historical.count} rokov)`, value: `↑ **${historical.avgMax}${tu}** ↓ ${historical.avgMin}${tu}`, inline: true },
            { name: '📊 Rozdiel', value: `Max: **${diffMaxStr}°**\nMin: **${diffMinStr}°**`, inline: true },
            { name: '📅 Po rokoch', value: `\`\`\`\n${yearLines}\n\`\`\``, inline: false },
        )
        .setFooter({ text: '⛅ Nimbus • Open-Meteo Historical API' }).setTimestamp();
}

module.exports = {
    COLORS, buildCurrentWeatherEmbed, buildDailyForecastEmbed, buildMultiDayEmbed,
    buildDailySummaryEmbed, buildAirQualityEmbed, buildCompareEmbed,
    buildStormAlertEmbed, buildSunEmbed, buildSettingsEmbed,
    buildNiceDaysEmbed, buildErrorEmbed, buildSuccessEmbed,
    buildLoadingEmbed, buildHelpEmbed, buildPollEmbed, buildMultiPollEmbed, buildServerWeatherEmbed,
    buildLunarEmbed, buildOutfitEmbed, buildTrafficEmbed, buildHistoryEmbed,
};
