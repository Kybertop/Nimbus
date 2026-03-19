const {
    ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder,
} = require('discord.js');
const db = require('./database');
const weather = require('./weather');
const embeds = require('./embeds');

// ═══════════════════════════════════════════
//  Routing
// ═══════════════════════════════════════════

async function handleInteraction(interaction) {
    if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
            case 'pocasie': return handlePocasie(interaction);
            case 'vzduch': return handleVzduch(interaction);
            case 'radar': return handleRadar(interaction);
            case 'oblubene': return handleOblubene(interaction);
            case 'nastavenia': return handleNastavenia(interaction);
            case 'notifikacie': return handleNotifikacie(interaction);
            case 'help': return handleHelp(interaction);
            case 'poll': return handlePoll(interaction);
            case 'kanal': return handleKanal(interaction);
            case 'mesiac': return handleMesiac(interaction);
            case 'outfit': return handleOutfit(interaction);
            case 'doprava': return handleDoprava(interaction);
        }
    }

    if (interaction.isButton()) {
        const id = interaction.customId;
        if (id.startsWith('w:')) return handleWeatherButton(interaction);
        if (id === 'setup_city') return showCityModal(interaction);
        if (id === 'setup_units') return showUnitsSelect(interaction);
        if (id === 'setup_notif') return handleNotifAdd(interaction);
        if (id === 'setup_default_view') return showDefaultViewSelect(interaction);
        if (id === 'setup_voice') return showVoiceSetup(interaction);
        if (id === 'setup_reset') return handleReset(interaction);
        if (id === 'setup_done') return handleSetupDone(interaction);
        if (id === 'setup_fav_add') return handleFavAdd(interaction);
        if (id === 'notif_add') return handleNotifAdd(interaction);
        if (id.startsWith('notif_toggle_')) return handleNotifToggle(interaction);
        if (id.startsWith('notif_delete_')) return handleNotifDelete(interaction);
        if (id.startsWith('notif_edit_')) return handleNotifEdit(interaction);
        if (id === 'notif_refresh') return handleNotifikacie(interaction, true);
        if (id.startsWith('fav_use_')) return handleFavUse(interaction);
        if (id.startsWith('fav_del_')) return handleFavDel(interaction);
        if (id.startsWith('nw_mode_time_')) return handleNwModeTime(interaction);
        if (id.startsWith('nw_mode_instant_')) return handleNwModeInstant(interaction);
        if (id.startsWith('help_')) return handleHelp(interaction, true);
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId.startsWith('city_pick_')) return handleCityPick(interaction);
        if (interaction.customId.startsWith('units_pick_')) return handleUnitsPick(interaction);
        if (interaction.customId.startsWith('default_view_pick_')) return handleDefaultViewPick(interaction);
        if (interaction.customId.startsWith('voice_pick_')) return handleVoicePick(interaction);
        if (interaction.customId.startsWith('notif_manage_')) return handleNotifManageSelect(interaction);
        if (interaction.customId.startsWith('fav_pick_')) return handleFavPick(interaction);
        if (interaction.customId.startsWith('nw_type_')) return handleNwTypePick(interaction);
        if (interaction.customId.startsWith('nw_dest_')) return handleNwDestPick(interaction);
        if (interaction.customId.startsWith('nw_offset_sel_')) return handleNwOffsetPick(interaction);
        if (interaction.customId.startsWith('nw_changes_')) return handleNwChangesPick(interaction);
        if (interaction.customId.startsWith('nw_severe_')) return handleNwSeverePick(interaction);
        if (interaction.customId.startsWith('nw_sun_type_')) return handleNwSunTypePick(interaction);
        if (interaction.customId.startsWith('nw_moon_')) return handleNwMoonPick(interaction);
        if (interaction.customId.startsWith('notif_edit_save_')) return handleNotifEditSave(interaction);
        if (interaction.customId.startsWith('poll_day_')) return handlePollDayPick(interaction);
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_city') return handleCityModalSubmit(interaction);
        if (interaction.customId === 'modal_fav') return handleFavModalSubmit(interaction);
        if (interaction.customId.startsWith('modal_nw_time_')) return handleNwTimeSubmit(interaction);
    }
}

// ═══════════════════════════════════════════
//  Helpers — user coords z settings alebo mesta
// ═══════════════════════════════════════════

async function resolveLocation(interaction, mestoOption) {
    let userSettings = db.getUser(interaction.user.id);
    const units = getUserUnits(userSettings);
    if (mestoOption) {
        const results = await weather.geocode(mestoOption);
        if (results.length === 0) return { error: `Mesto "${mestoOption}" sa nenašlo.` };
        const r = results[0];
        return { lat: r.latitude, lon: r.longitude, tz: r.timezone || 'auto', city: r.name, units, settings: { city: r.name, latitude: r.latitude, longitude: r.longitude, timezone: r.timezone } };
    }
    if (!userSettings?.latitude) return { error: 'Najprv si nastav mesto — použi `/nastavenia`' };
    return { lat: userSettings.latitude, lon: userSettings.longitude, tz: userSettings.timezone || 'auto', city: userSettings.city, units, settings: userSettings };
}

function getUserUnits(settings) {
    return {
        temp: settings?.units === 'fahrenheit' ? 'fahrenheit' : 'celsius',
        wind: settings?.wind_unit || 'kmh',
        tempSymbol: settings?.units === 'fahrenheit' ? '°F' : '°C',
        windSymbol: settings?.wind_unit === 'ms' ? 'm/s' : settings?.wind_unit === 'mph' ? 'mph' : 'km/h',
    };
}

// Skrátený ID pre customId (Discord max 100 znakov)
function locId(lat, lon, tz, city = '') {
    // Max 20 znakov pre mesto
    const shortCity = (city || '').slice(0, 20);
    return `${lat.toFixed(4)}|${lon.toFixed(4)}|${tz}|${shortCity}`;
}

function parseLocId(str) {
    const parts = str.split('|');
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    // TZ môže obsahovať / ale nie |, city je posledný segment
    // Formát: lat|lon|tz|city
    const city = parts[parts.length - 1] || '';
    const tz = parts.slice(2, parts.length - 1).join('|') || 'auto';
    return { lat, lon, tz, city };
}

function buildWeatherRows(lid, activeTyp = '') {
    const s = (typ) => typ === activeTyp ? ButtonStyle.Success : ButtonStyle.Secondary;
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`w:current:${lid}`).setLabel('Aktuálne').setEmoji('🌡️').setStyle(s('current')),
        new ButtonBuilder().setCustomId(`w:today:${lid}`).setLabel('Dnes').setEmoji('📋').setStyle(s('today')),
        new ButtonBuilder().setCustomId(`w:7d:${lid}`).setLabel('7 dní').setEmoji('📆').setStyle(s('7d')),
        new ButtonBuilder().setCustomId(`w:14d:${lid}`).setLabel('14 dní').setEmoji('📅').setStyle(s('14d')),
    );
    const trafficLabel = Math.random() < 0.1 ? 'Dolava' : 'Doprava';
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`w:aqi:${lid}`).setLabel('Vzduch').setEmoji('🏔️').setStyle(s('aqi')),
        new ButtonBuilder().setCustomId(`w:nice:${lid}`).setLabel('Pekne?').setEmoji('☀️').setStyle(s('nice')),
        new ButtonBuilder().setCustomId(`w:outfit:${lid}`).setLabel('Outfit').setEmoji('👔').setStyle(s('outfit')),
        new ButtonBuilder().setCustomId(`w:traffic:${lid}`).setLabel(trafficLabel).setEmoji('🚗').setStyle(s('traffic')),
        new ButtonBuilder().setCustomId(`w:history:${lid}`).setLabel('vs Priemer').setEmoji('📊').setStyle(s('history')),
    );
    return [row1, row2];
}

// ═══════════════════════════════════════════
//  /pocasie
// ═══════════════════════════════════════════

async function handlePocasie(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [embeds.buildLoadingEmbed()] }).catch(() => {});
    const mesto1 = interaction.options.getString('mesto');
    const mesto2 = interaction.options.getString('mesto2');

    // Porovnávací mód — dve mestá
    if (mesto2) {
        try {
            const city1name = mesto1 || db.getUser(interaction.user.id)?.city;
            if (!city1name && !mesto1) return interaction.editReply({ embeds: [embeds.buildErrorEmbed('Nastav si mesto cez `/nastavenia` alebo zadaj `mesto`.')] });

            let c1, c2;
            if (mesto1) {
                const r = await weather.geocode(mesto1);
                if (!r.length) return interaction.editReply({ embeds: [embeds.buildErrorEmbed(`Mesto "${mesto1}" sa nenašlo.`)] });
                c1 = r[0];
            } else {
                const s = db.getUser(interaction.user.id);
                c1 = { name: s.city, latitude: s.latitude, longitude: s.longitude, timezone: s.timezone };
            }

            const r2 = await weather.geocode(mesto2);
            if (!r2.length) return interaction.editReply({ embeds: [embeds.buildErrorEmbed(`Mesto "${mesto2}" sa nenašlo.`)] });
            c2 = r2[0];

            const [d1, d2] = await Promise.all([
                weather.getCurrentWeather(c1.latitude, c1.longitude, c1.timezone || 'auto'),
                weather.getCurrentWeather(c2.latitude, c2.longitude, c2.timezone || 'auto'),
            ]);
            return interaction.editReply({ embeds: [embeds.buildCompareEmbed(d1, d2, c1.name, c2.name)] });
        } catch (err) {
            console.error('[POROVNAJ]', err);
            return interaction.editReply({ embeds: [embeds.buildErrorEmbed('Chyba pri porovnávaní.')] });
        }
    }

    // Normálny mód — jedno mesto
    const loc = await resolveLocation(interaction, mesto1);
    if (loc.error) return interaction.editReply({ embeds: [embeds.buildErrorEmbed(loc.error)] });

    try {
        const userDb = db.getUser(interaction.user.id);
        const defaultView = userDb?.default_view || 'current';
        const lid = locId(loc.lat, loc.lon, loc.tz, loc.city);

        let embed;
        switch (defaultView) {
            case 'today': {
                const [hd, dd] = await Promise.all([
                    weather.getHourlyForecast(loc.lat, loc.lon, loc.tz, 1, loc.units),
                    weather.getDailyForecast(loc.lat, loc.lon, loc.tz, 1, loc.units),
                ]);
                embed = embeds.buildDailySummaryEmbed(hd, dd, loc.settings);
                break;
            }
            case '7d': {
                const dd = await weather.getDailyForecast(loc.lat, loc.lon, loc.tz, 7, loc.units);
                embed = embeds.buildMultiDayEmbed(dd, loc.settings);
                break;
            }
            case '14d': {
                const dd = await weather.getDailyForecast(loc.lat, loc.lon, loc.tz, 14, loc.units);
                embed = embeds.buildMultiDayEmbed(dd, loc.settings);
                break;
            }
            default: {
                const [data, dailyData] = await Promise.all([
                    weather.getCurrentWeather(loc.lat, loc.lon, loc.tz, loc.units),
                    weather.getDailyForecast(loc.lat, loc.lon, loc.tz, 1, loc.units),
                ]);
                embed = embeds.buildCurrentWeatherEmbed(data, loc.settings, dailyData);
                break;
            }
        }

        const rows = buildWeatherRows(lid, defaultView);
        return interaction.editReply({ embeds: [embed], components: rows });
    } catch (err) {
        console.error('[POCASIE]', err);
        return interaction.editReply({ embeds: [embeds.buildErrorEmbed('Nepodarilo sa nacitat pocasie.')] });
    }
}

async function handleWeatherButton(interaction) {
    const parts = interaction.customId.split(':');
    const typ = parts[1];
    const { lat, lon, tz, city } = parseLocId(parts.slice(2).join(':'));
    const userSettings = { city: city || `${lat}, ${lon}`, latitude: lat, longitude: lon, timezone: tz };
    const lid = locId(lat, lon, tz, city);
    const units = getUserUnits(db.getUser(interaction.user.id));

    await interaction.deferUpdate();
    try {
        let embed;
        switch (typ) {
            case 'current': {
                const [data, dd] = await Promise.all([
                    weather.getCurrentWeather(lat, lon, tz, units),
                    weather.getDailyForecast(lat, lon, tz, 1, units),
                ]);
                embed = embeds.buildCurrentWeatherEmbed(data, userSettings, dd);
                break;
            }
            case 'today': {
                const [hd, dd] = await Promise.all([
                    weather.getHourlyForecast(lat, lon, tz, 1, units),
                    weather.getDailyForecast(lat, lon, tz, 1, units),
                ]);
                embed = embeds.buildDailySummaryEmbed(hd, dd, userSettings);
                break;
            }
            case '7d': {
                const data = await weather.getDailyForecast(lat, lon, tz, 7, units);
                embed = embeds.buildMultiDayEmbed(data, userSettings);
                break;
            }
            case '14d': {
                const data = await weather.getDailyForecast(lat, lon, tz, 14, units);
                embed = embeds.buildMultiDayEmbed(data, userSettings);
                break;
            }
            case 'aqi': {
                const data = await weather.getAirQuality(lat, lon, tz);
                embed = embeds.buildAirQualityEmbed(data, userSettings);
                break;
            }
            case 'nice': {
                const data = await weather.getDailyForecast(lat, lon, tz, 16, units);
                const niceDays = weather.findNiceDays(data);
                embed = embeds.buildNiceDaysEmbed(niceDays, userSettings);
                break;
            }
            case 'outfit': {
                const [cd, dd] = await Promise.all([
                    weather.getCurrentWeather(lat, lon, tz, units),
                    weather.getDailyForecast(lat, lon, tz, 1, units),
                ]);
                embed = embeds.buildOutfitEmbed(weather.getOutfitAdvice(cd, dd), userSettings);
                break;
            }
            case 'traffic': {
                const [cd, hd] = await Promise.all([
                    weather.getCurrentWeather(lat, lon, tz, units),
                    weather.getHourlyForecast(lat, lon, tz, 2, units),
                ]);
                embed = embeds.buildTrafficEmbed(weather.getTrafficWarnings(cd, hd), userSettings);
                break;
            }
            case 'history': {
                const [dd, hist] = await Promise.all([
                    weather.getDailyForecast(lat, lon, tz, 1, units),
                    weather.getHistoricalComparison(lat, lon, tz),
                ]);
                embed = embeds.buildHistoryEmbed(dd, hist, userSettings);
                break;
            }
        }

        const rows = buildWeatherRows(lid, typ);
        return interaction.editReply({ embeds: [embed], components: rows });
    } catch (err) {
        console.error('[WEATHER_BTN]', err.stack || err.message);
        await interaction.editReply({ embeds: [embeds.buildErrorEmbed('Chyba pri načítaní. Skús znova.')] }).catch(() => {});
    }
}

// ═══════════════════════════════════════════
//  /vzduch
// ═══════════════════════════════════════════

async function handleVzduch(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [embeds.buildLoadingEmbed('Načítavam kvalitu vzduchu...')] }).catch(() => {});
    const loc = await resolveLocation(interaction, interaction.options.getString('mesto'));
    if (loc.error) return interaction.editReply({ embeds: [embeds.buildErrorEmbed(loc.error)] });

    try {
        const data = await weather.getAirQuality(loc.lat, loc.lon, loc.tz);
        return interaction.editReply({ embeds: [embeds.buildAirQualityEmbed(data, loc.settings)] });
    } catch (err) {
        console.error('[VZDUCH]', err);
        return interaction.editReply({ embeds: [embeds.buildErrorEmbed('Nepodarilo sa načítať kvalitu vzduchu.')] });
    }
}

// ═══════════════════════════════════════════
//  /radar
// ═══════════════════════════════════════════

async function handleRadar(interaction) {
    const s = db.getUser(interaction.user.id);
    if (!s?.latitude) return interaction.reply({ embeds: [embeds.buildErrorEmbed('Nastav si mesto cez `/nastavenia`')], ephemeral: true });

    const url = weather.getRadarUrl(s.latitude, s.longitude);
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle(`🗺️  Radar zrážok — ${s.city}`)
        .setDescription(`[🔗 Otvoriť animovaný radar](${url})\n\nRainViewer — real-time radar s animáciou zrážok pre tvoju oblasť.`)
        .setFooter({ text: 'RainViewer' }).setTimestamp();

    return interaction.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════
//  /oblubene
// ═══════════════════════════════════════════

async function handleOblubene(interaction) {
    const favs = db.getFavorites(interaction.user.id);

    if (favs.length === 0) {
        const embed = new EmbedBuilder().setColor(0x5865F2).setTitle('⭐  Obľúbené mestá')
            .setDescription('Nemáš žiadne obľúbené mestá.\n\nPridaj cez `/nastavenia` → ⭐ Pridať obľúbené.');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Select menu na rýchle prepnutie
    const options = favs.map((f, i) => ({
        label: f.name,
        description: `${f.latitude.toFixed(2)}, ${f.longitude.toFixed(2)}`,
        value: String(i),
    }));

    const row1 = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`fav_pick_${interaction.user.id}`)
            .setPlaceholder('Vyber mesto pre počasie...')
            .addOptions(options)
    );

    // Delete buttony (max 5)
    const buttons = favs.slice(0, 5).map((f, i) =>
        new ButtonBuilder().setCustomId(`fav_del_${i}`).setLabel(`Odstrániť ${f.name}`).setStyle(ButtonStyle.Danger).setEmoji('🗑️')
    );
    const row2 = buttons.length > 0 ? new ActionRowBuilder().addComponents(...buttons) : null;

    const embed = new EmbedBuilder().setColor(0x5865F2).setTitle('⭐  Obľúbené mestá')
        .setDescription(favs.map((f, i) => `**${i+1}.** ${f.name}`).join('\n'))
        .setFooter({ text: 'Vyber mesto na zobrazenie počasia' });

    const components = [row1];
    if (row2) components.push(row2);
    return interaction.reply({ embeds: [embed], components, ephemeral: true });
}

async function handleFavPick(interaction) {
    const idx = parseInt(interaction.values[0]);
    const favs = db.getFavorites(interaction.user.id);
    const fav = favs[idx];
    if (!fav) return interaction.reply({ embeds: [embeds.buildErrorEmbed('Mesto sa nenašlo.')], ephemeral: true });

    await interaction.deferUpdate();
    try {
        const data = await weather.getCurrentWeather(fav.latitude, fav.longitude, fav.timezone || 'auto');
        const settings = { city: fav.name, latitude: fav.latitude, longitude: fav.longitude, timezone: fav.timezone };
        const embed = embeds.buildCurrentWeatherEmbed(data, settings);
        const lid = locId(fav.latitude, fav.longitude, fav.timezone || 'auto', fav.name);
        const rows = buildWeatherRows(lid, 'current');
        await interaction.followUp({ embeds: [embed], components: rows });
    } catch (err) {
        console.error('[FAV]', err);
    }
}

async function handleFavDel(interaction) {
    const idx = parseInt(interaction.customId.replace('fav_del_', ''));
    const removed = db.removeFavorite(interaction.user.id, idx);
    if (removed) {
        await interaction.reply({ embeds: [embeds.buildSuccessEmbed('Obľúbené mesto odstránené.')], ephemeral: true });
    } else {
        await interaction.reply({ embeds: [embeds.buildErrorEmbed('Nepodarilo sa odstrániť.')], ephemeral: true });
    }
}

async function handleFavAdd(interaction) {
    const modal = new ModalBuilder().setCustomId('modal_fav').setTitle('⭐ Pridať obľúbené mesto');
    modal.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('fav_city').setLabel('Názov mesta').setPlaceholder('napr. Praha').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
    ));
    await interaction.showModal(modal);
}

async function handleFavModalSubmit(interaction) {
    const cityName = interaction.fields.getTextInputValue('fav_city');
    await interaction.deferReply({ ephemeral: true });
    const results = await weather.geocode(cityName);
    if (!results.length) return interaction.editReply({ embeds: [embeds.buildErrorEmbed(`Mesto "${cityName}" sa nenašlo.`)] });

    const r = results[0];
    const added = db.addFavorite(interaction.user.id, {
        name: r.name, latitude: r.latitude, longitude: r.longitude, timezone: r.timezone,
    });

    if (added) {
        return interaction.editReply({ embeds: [embeds.buildSuccessEmbed(`⭐ **${r.name}** pridané do obľúbených.`)] });
    }
    return interaction.editReply({ embeds: [embeds.buildErrorEmbed('Maximálne 10 obľúbených alebo mesto už existuje.')] });
}

async function handleFavUse(interaction) {
    // Switch hlavné mesto na obľúbené
    const idx = parseInt(interaction.customId.replace('fav_use_', ''));
    const favs = db.getFavorites(interaction.user.id);
    const fav = favs[idx];
    if (!fav) return;
    db.setUser(interaction.user.id, { city: fav.name, latitude: fav.latitude, longitude: fav.longitude, timezone: fav.timezone });
    await interaction.reply({ embeds: [embeds.buildSuccessEmbed(`Hlavné mesto zmenené na **${fav.name}**`)], ephemeral: true });
}

// ═══════════════════════════════════════════
//  /nastavenia — dashboard
// ═══════════════════════════════════════════

async function handleNastavenia(interaction) {
    const settings = db.getUser(interaction.user.id);
    const embed = embeds.buildSettingsEmbed(settings);
    const rows = buildSettingsButtons(settings);
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
}

function buildSettingsButtons(settings) {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('setup_city').setLabel(settings?.city ? `Zmenit mesto (${settings.city})` : 'Nastavit mesto').setEmoji('📍').setStyle(settings?.city ? ButtonStyle.Secondary : ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('setup_units').setLabel('Jednotky').setEmoji('🌡️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('setup_fav_add').setLabel('Pridat oblubene').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('setup_default_view').setLabel('Default zobrazenie').setEmoji('📋').setStyle(ButtonStyle.Secondary),
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('setup_notif').setLabel('Pridat notifikaciu').setEmoji('🔔').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('setup_voice').setLabel('Voice kanal').setEmoji('🔊').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('setup_reset').setLabel('Vymazat vsetko').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('setup_done').setLabel('Hotovo').setStyle(ButtonStyle.Secondary),
    );
    return [row1, row2];
}

// ─── City modal ────────────────────────────

async function showCityModal(interaction) {
    const modal = new ModalBuilder().setCustomId('modal_city').setTitle('📍 Nastavenie mesta');
    modal.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('city_name').setLabel('Názov mesta').setPlaceholder('napr. Bratislava').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
    ));
    await interaction.showModal(modal);
}

async function handleCityModalSubmit(interaction) {
    const cityName = interaction.fields.getTextInputValue('city_name');
    await interaction.deferUpdate();
    const results = await weather.geocode(cityName);
    if (!results.length) return interaction.followUp({ embeds: [embeds.buildErrorEmbed(`Mesto "${cityName}" sa nenašlo.`)], ephemeral: true });

    if (results.length === 1) {
        const r = results[0];
        const settings = db.setUser(interaction.user.id, { city: r.name, latitude: r.latitude, longitude: r.longitude, timezone: r.timezone || 'auto' });
        return interaction.editReply({ embeds: [embeds.buildSettingsEmbed(settings)], components: buildSettingsButtons(settings) });
    }

    const options = results.slice(0, 5).map(r => ({
        label: r.name,
        description: `${[r.admin1, r.country].filter(Boolean).join(', ')} (${r.latitude.toFixed(2)}, ${r.longitude.toFixed(2)})`.slice(0, 100),
        value: JSON.stringify({ name: r.name, lat: r.latitude, lon: r.longitude, tz: r.timezone }),
    }));
    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(`city_pick_${interaction.user.id}`).setPlaceholder('Vyber mesto...').addOptions(options)
    );
    return interaction.followUp({ content: 'Našiel som viac miest:', components: [row], ephemeral: true });
}

async function handleCityPick(interaction) {
    const sel = JSON.parse(interaction.values[0]);
    const settings = db.setUser(interaction.user.id, { city: sel.name, latitude: sel.lat, longitude: sel.lon, timezone: sel.tz || 'auto' });
    await interaction.update({ content: null, embeds: [embeds.buildSuccessEmbed(`📍 Mesto: **${sel.name}**`)], components: [] });
}

// ─── Units ─────────────────────────────────

async function showUnitsSelect(interaction) {
    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(`units_pick_${interaction.user.id}`).setPlaceholder('Jednotky...').addOptions([
            { label: '°C + km/h', value: 'celsius_kmh', emoji: '🌡️' },
            { label: '°C + m/s', value: 'celsius_ms', emoji: '🌡️' },
            { label: '°F + mph', value: 'fahrenheit_mph', emoji: '🌡️' },
        ])
    );
    await interaction.reply({ content: 'Vyber jednotky:', components: [row], ephemeral: true });
}

async function handleUnitsPick(interaction) {
    const [t, w] = interaction.values[0].split('_');
    db.setUser(interaction.user.id, { units: t, wind_unit: w });
    await interaction.update({ content: null, embeds: [embeds.buildSuccessEmbed(`Jednotky: **${t === 'celsius' ? '°C' : '°F'}** | **${w}**`)], components: [] });
}

// ─── Default view ─────────────────────────

async function showDefaultViewSelect(interaction) {
    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(`default_view_pick_${interaction.user.id}`).setPlaceholder('Default zobrazenie...').addOptions([
            { label: 'Aktualne pocasie', value: 'current', emoji: '🌡️', description: 'Teplota, vietor, vlhkost' },
            { label: 'Dnes podrobne', value: 'today', emoji: '📋', description: 'Hodinovy prehlad + graf' },
            { label: '7 dni', value: '7d', emoji: '📆', description: 'Tyzdenna predpoved' },
            { label: '14 dni', value: '14d', emoji: '📅', description: 'Dvojtyzdnova predpoved' },
        ])
    );
    await interaction.reply({ content: 'Co sa zobrazi ked das /pocasie:', components: [row], ephemeral: true });
}

async function handleDefaultViewPick(interaction) {
    const view = interaction.values[0];
    db.setUser(interaction.user.id, { default_view: view });
    const labels = { current: 'Aktualne', today: 'Dnes', '7d': '7 dni', '14d': '14 dni' };
    await interaction.update({ content: null, embeds: [embeds.buildSuccessEmbed(`Default zobrazenie: **${labels[view]}**`)], components: [] });
}

// ─── Voice channel setup ──────────────────

async function showVoiceSetup(interaction) {
    if (!interaction.guildId) {
        return interaction.reply({ embeds: [embeds.buildErrorEmbed('Voice kanal funguje len na serveri.')], ephemeral: true });
    }
    if (!interaction.memberPermissions?.has('ManageChannels')) {
        return interaction.reply({ embeds: [embeds.buildErrorEmbed('Potrebujes opravnenie **Manage Channels**.')], ephemeral: true });
    }

    // Najdi voice kanaly na serveri
    const guild = interaction.guild;
    const voiceChannels = guild.channels.cache
        .filter(c => c.type === 2) // GuildVoice
        .map(c => ({ label: c.name, value: c.id, emoji: '🔊' }))
        .slice(0, 25);

    if (voiceChannels.length === 0) {
        return interaction.reply({ embeds: [embeds.buildErrorEmbed('Ziadne voice kanaly na tomto serveri.')], ephemeral: true });
    }

    voiceChannels.unshift({ label: 'Vypnut (ziadny)', value: 'off', emoji: '❌' });

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`voice_pick_${interaction.guildId}`)
            .setPlaceholder('Vyber voice kanal...')
            .addOptions(voiceChannels)
    );

    await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865F2)
            .setTitle('🔊 Voice kanal s pocasim')
            .setDescription('Vyber voice kanal ktory sa bude automaticky premenovat podla aktualneho pocasia.\n\nPriklad: `☀️ 18°C Trnava`')
        ],
        components: [row],
        ephemeral: true,
    });
}

async function handleVoicePick(interaction) {
    const channelId = interaction.values[0];
    const guildId = interaction.customId.replace('voice_pick_', '');

    if (channelId === 'off') {
        db.setServer(guildId, { voice_channel_id: null });
        return interaction.update({ embeds: [embeds.buildSuccessEmbed('Voice kanal vypnuty.')], components: [] });
    }

    // Ak server nema nastavene mesto, pouzi userovo
    const serverConfig = db.getServer(guildId);
    if (!serverConfig?.latitude) {
        const userSettings = db.getUser(interaction.user.id);
        if (userSettings?.latitude) {
            db.setServer(guildId, {
                voice_channel_id: channelId,
                city: userSettings.city,
                latitude: userSettings.latitude,
                longitude: userSettings.longitude,
                timezone: userSettings.timezone || 'auto',
            });
        } else {
            return interaction.update({ embeds: [embeds.buildErrorEmbed('Najprv nastav mesto cez `/kanal` alebo `/nastavenia`.')], components: [] });
        }
    } else {
        db.setServer(guildId, { voice_channel_id: channelId });
    }

    await interaction.update({ embeds: [embeds.buildSuccessEmbed(`Voice kanal nastaveny: <#${channelId}>\nBude sa aktualizovat kazdych 10 minut.`)], components: [] });
}

// ─── Notif wizard (interaktívny) ────────────
// Temp state pre wizard flow
const notifWizardState = new Map();

const NOTIF_TYPE_OPTIONS = [
    { label: '📋 Ranny prehlad', description: 'Celkovy prehlad dna', value: 'daily', canSchedule: true },
    { label: '⚠️ Vystrahy', description: 'Vyber ktore vystrahy chces dostavat', value: 'severe', needsSubtype: true },
    { label: '🔄 Zmena pocasia', description: 'Vyber ake zmeny chces sledovat', value: 'weather_change', needsChanges: true },
    { label: '☀️ Slnko', description: 'Vychod alebo zapad s offsetom', value: 'sun', needsSunType: true },
    { label: '🌙 Mesiac', description: 'Upozorni pri vybranej faze mesiaca', value: 'moon', needsMoonPhase: true },
];

const SEVERE_SUB_OPTIONS = [
    { label: '🌧️ Dazd (lubovolny)', description: 'Slaby aj silny dazd, prehanky', value: 'rain_now', emoji: '🌧️' },
    { label: '⛈️ Burka / krupobitie', description: 'Severity 3+ javy', value: 'storm', emoji: '⛈️' },
    { label: '🌡️ Extremna teplota', description: 'Pod 0°C alebo nad 33°C', value: 'extreme_temp', emoji: '🌡️' },
    { label: '🌨️ Snezenie', description: 'Ked zacne snezit', value: 'snow', emoji: '🌨️' },
    { label: '🌫️ Hmla', description: 'Znizena viditelnost', value: 'fog', emoji: '🌫️' },
    { label: '💨 Silny vietor', description: 'Narazy nad 50 km/h', value: 'wind', emoji: '💨' },
    { label: '🧊 Namraza', description: 'Riziko namrazy na cestach', value: 'frost', emoji: '🧊' },
];

const MOON_PHASE_OPTIONS = [
    { label: '🌑 Nov', description: 'Uplne novy mesiac', value: 'new_moon', emoji: '🌑' },
    { label: '🌓 Prva stvrt', description: 'Polmesiac rastie', value: 'first_quarter', emoji: '🌓' },
    { label: '🌕 Spln', description: 'Uplny mesiac', value: 'full_moon', emoji: '🌕' },
    { label: '🌗 Posledna stvrt', description: 'Polmesiac klesa', value: 'last_quarter', emoji: '🌗' },
];

const WEATHER_CHANGE_OPTIONS = [
    { label: '☀️ → ☁️ Zatiahnuť sa', description: 'Z jasna na zamračené', value: 'sunny_to_cloudy', emoji: '☁️' },
    { label: '☁️ → ☀️ Vyjasniť sa', description: 'Zo zamračeného na jasno', value: 'cloudy_to_sunny', emoji: '☀️' },
    { label: '🌧️ Začne pršať', description: 'Začnú zrážky (dážď/prehánky)', value: 'start_rain', emoji: '🌧️' },
    { label: '🌧️ → ☀️ Prestane pršať', description: 'Dážď skončí', value: 'stop_rain', emoji: '🌤️' },
    { label: '🌨️ Začne snežiť', description: 'Začne sneženie', value: 'start_snow', emoji: '🌨️' },
    { label: '⛈️ Príde búrka', description: 'Búrka alebo krupobitie', value: 'storm_coming', emoji: '⛈️' },
    { label: '🌫️ Príde hmla', description: 'Zníži sa viditeľnosť', value: 'fog_coming', emoji: '🌫️' },
    { label: '💨 Zosilnie vietor', description: 'Nárazy nad 40 km/h', value: 'wind_up', emoji: '💨' },
    { label: '🌡️ Prudký pokles teploty', description: 'Pokles o 5°C+ za hodinu', value: 'temp_drop', emoji: '🥶' },
    { label: '🌡️ Prudký nárast teploty', description: 'Nárast o 5°C+ za hodinu', value: 'temp_rise', emoji: '🥵' },
];

async function handleNotifAdd(interaction) {
    if (!db.getUser(interaction.user.id)?.latitude) {
        const method = (interaction.replied || interaction.deferred) ? 'followUp' : 'reply';
        return interaction[method]({ embeds: [embeds.buildErrorEmbed('Nastav si mesto cez `/nastavenia`!')], ephemeral: true });
    }

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`nw_type_${interaction.user.id}`)
            .setPlaceholder('Vyber typ notifikacie...')
            .addOptions(NOTIF_TYPE_OPTIONS.map(t => ({
                label: t.label, description: t.description, value: t.value,
            })))
    );

    const embed = new EmbedBuilder().setColor(0x5865F2)
        .setTitle('🔔  Nova notifikacia')
        .setDescription(
            '📋 **Ranny prehlad** — celkovy prehlad dna\n' +
            '⚠️ **Vystrahy** — burky, dazd, sneh, vietor, namraza...\n' +
            '🔄 **Zmena pocasia** — ked sa zmeni pocasie\n' +
            '☀️ **Slnko** — vychod/zapad s offsetom\n' +
            '🌙 **Mesiac** — upozornenie pri vybranej faze'
        );

    const method = (interaction.replied || interaction.deferred) ? 'followUp' : 'reply';
    return interaction[method]({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleNwTypePick(interaction) {
    const type = interaction.values[0];
    const def = NOTIF_TYPE_OPTIONS.find(t => t.value === type);

    notifWizardState.set(interaction.user.id, { type, channel_id: interaction.channelId });

    // Najprv sa opytaj kam posielat
    const destOptions = [
        { label: 'Do mojich DMs', description: 'Posle mi sukromnu spravu', value: 'dm', emoji: '📩' },
    ];

    // Ak sme na serveri, ponukni aj aktualny kanal
    if (interaction.guildId) {
        destOptions.push({
            label: `Do #${interaction.channel?.name || 'tento kanal'}`,
            description: 'Posle spravu do tohto kanala na serveri',
            value: `ch_${interaction.channelId}`,
            emoji: '📢',
        });
    }

    // Ak je len jedna moznost (DM), preskoc vyber
    if (destOptions.length === 1) {
        notifWizardState.get(interaction.user.id).dest = 'dm';
        return continueNwAfterDest(interaction, def);
    }

    await interaction.update({
        embeds: [new EmbedBuilder().setColor(0x5865F2)
            .setTitle(`🔔  ${def.label} — Kam posielat?`)
            .setDescription('Vyber kam chces dostavat notifikacie:')
        ],
        components: [new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`nw_dest_${interaction.user.id}`)
                .setPlaceholder('Kam posielat?')
                .addOptions(destOptions)
        )],
    });
}

async function handleNwDestPick(interaction) {
    const val = interaction.values[0];
    const state = notifWizardState.get(interaction.user.id);
    if (!state) return interaction.update({ embeds: [embeds.buildErrorEmbed('Wizard expiroval.')], components: [] });

    if (val === 'dm') {
        state.dest = 'dm';
        // Ziskaj DM channel ID
        try {
            const dm = await interaction.user.createDM();
            state.channel_id = dm.id;
        } catch {
            return interaction.update({ embeds: [embeds.buildErrorEmbed('Nepodarilo sa otvorit DM. Mas zapnute DMs?')], components: [] });
        }
    } else {
        state.dest = 'channel';
        state.channel_id = val.replace('ch_', '');
    }

    const def = NOTIF_TYPE_OPTIONS.find(t => t.value === state.type);
    return continueNwAfterDest(interaction, def);
}

async function continueNwAfterDest(interaction, def) {
    const state = notifWizardState.get(interaction.user.id);
    const type = state.type;

    if (def.canSchedule) {
        await interaction.update({
            embeds: [new EmbedBuilder().setColor(0x5865F2)
                .setTitle(`🔔  ${def.label} — Kedy dostavat?`)
                .setDescription('Vyber ako chces dostavat tuto notifikaciu:')
            ],
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`nw_mode_time_${type}`)
                    .setLabel('V konkretny cas')
                    .setEmoji('⏰')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`nw_mode_instant_${type}`)
                    .setLabel('Hned ako sa nieco zisti')
                    .setEmoji('⚡')
                    .setStyle(ButtonStyle.Secondary),
            )],
        });
    } else if (def.needsSubtype) {
        // Vystrahy — vyber ktore typy
        await interaction.update({
            embeds: [new EmbedBuilder().setColor(0x5865F2)
                .setTitle('⚠️  Vystrahy — Vyber typy')
                .setDescription('Ktore vystrahy chces dostavat?\nMozes vybrat **viac naraz**:')
            ],
            components: [new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`nw_severe_${interaction.user.id}`)
                    .setPlaceholder('Vyber vystrahy...')
                    .setMinValues(1)
                    .setMaxValues(SEVERE_SUB_OPTIONS.length)
                    .addOptions(SEVERE_SUB_OPTIONS)
            )],
        });
    } else if (def.needsChanges) {
        await interaction.update({
            embeds: [new EmbedBuilder().setColor(0x5865F2)
                .setTitle('🔄  Zmena pocasia — Vyber zmeny')
                .setDescription('Vyber na ake zmeny chces byt upozorneny.\nMozes vybrat **viac naraz**:')
            ],
            components: [new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`nw_changes_${interaction.user.id}`)
                    .setPlaceholder('Vyber zmeny pocasia...')
                    .setMinValues(1)
                    .setMaxValues(WEATHER_CHANGE_OPTIONS.length)
                    .addOptions(WEATHER_CHANGE_OPTIONS)
            )],
        });
    } else if (def.needsSunType) {
        // Slnko — vyber vychod alebo zapad + offset
        await interaction.update({
            embeds: [new EmbedBuilder().setColor(0x5865F2)
                .setTitle('☀️  Slnko — Vyber typ')
                .setDescription('Chces notifikaciu na vychod alebo zapad?')
            ],
            components: [new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`nw_sun_type_${interaction.user.id}`)
                    .setPlaceholder('Vyber...')
                    .addOptions([
                        { label: '🌅 Vychod slnka', value: 'sunrise', emoji: '🌅' },
                        { label: '🌇 Zapad slnka', value: 'sunset', emoji: '🌇' },
                    ])
            )],
        });
    } else if (def.needsMoonPhase) {
        // Mesiac — vyber fazy
        await interaction.update({
            embeds: [new EmbedBuilder().setColor(0x2C3E50)
                .setTitle('🌙  Mesiac — Vyber fazy')
                .setDescription('Pri ktorych fazach mesiaca chces byt upozorneny?\nMozes vybrat **viac naraz**:')
            ],
            components: [new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`nw_moon_${interaction.user.id}`)
                    .setPlaceholder('Vyber fazy mesiaca...')
                    .setMinValues(1)
                    .setMaxValues(MOON_PHASE_OPTIONS.length)
                    .addOptions(MOON_PHASE_OPTIONS)
            )],
        });
    }
}

// Krok: user vybral "v konkrétny čas"
async function handleNwModeTime(interaction) {
    const type = interaction.customId.replace('nw_mode_time_', '');
    const state = notifWizardState.get(interaction.user.id);
    if (state) state.type = type;

    const modal = new ModalBuilder().setCustomId(`modal_nw_time_${type}`).setTitle('⏰ Nastaviť čas');
    modal.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('nw_time').setLabel('Čas (HH:MM)').setPlaceholder('07:00').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(5)
    ));
    await interaction.showModal(modal);
}

// Krok: user vybral "hneď / okamžite"
async function handleNwModeInstant(interaction) {
    const type = interaction.customId.replace('nw_mode_instant_', '');
    const state = notifWizardState.get(interaction.user.id);
    if (!state) return interaction.update({ embeds: [embeds.buildErrorEmbed('Wizard expiroval.')], components: [] });

    const notif = db.addNotification(interaction.user.id, {
        channel_id: state.channel_id,
        type,
        hour: null,
        minute: null,
        event_based: true,
    });
    notifWizardState.delete(interaction.user.id);

    const labels = { daily: '📋 Ranny prehlad', severe: '⚠️ Vystrahy pocasia' };
    const destLabel = state.dest === 'dm' ? '📩 DM' : `📢 <#${state.channel_id}>`;
    await interaction.update({
        embeds: [embeds.buildSuccessEmbed(
            `🔔 Notifikacia pridana!\n\n**Typ:** ${labels[type] || type}\n**Kedy:** ⚡ Okamzite\n**Kam:** ${destLabel}\n**ID:** \`${notif.id}\``
        )], components: [],
    });
}

async function handleNwTimeSubmit(interaction) {
    const type = interaction.customId.replace('modal_nw_time_', '');
    const timeStr = interaction.fields.getTextInputValue('nw_time').trim();
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return interaction.reply({ embeds: [embeds.buildErrorEmbed('Neplatný čas. Použi HH:MM.')], ephemeral: true });
    const hour = parseInt(match[1]), minute = parseInt(match[2]);
    if (hour > 23 || minute > 59) return interaction.reply({ embeds: [embeds.buildErrorEmbed('Neplatný čas.')], ephemeral: true });

    const state = notifWizardState.get(interaction.user.id) || { type, channel_id: interaction.channelId };
    const notif = db.addNotification(interaction.user.id, {
        channel_id: state.channel_id, type: state.type || type, hour, minute, event_based: false,
    });
    notifWizardState.delete(interaction.user.id);
    if (!notif) return interaction.reply({ embeds: [embeds.buildErrorEmbed('Nastav si mesto!')], ephemeral: true });

    const labels = { daily: '📋 Ranny prehlad', severe: '⚠️ Denne vystrahy' };
    const timeLabel = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
    const destLabel = state.dest === 'dm' ? '📩 DM' : `📢 <#${state.channel_id}>`;
    await interaction.reply({ embeds: [embeds.buildSuccessEmbed(
        `🔔 Notifikacia pridana!\n\n**Typ:** ${labels[state.type||type]||type}\n**Cas:** ${timeLabel}\n**Kam:** ${destLabel}\n**ID:** \`${notif.id}\``
    )], ephemeral: true });
}

async function handleNwOffsetPick(interaction) {
    const offset = parseInt(interaction.values[0]);
    const state = notifWizardState.get(interaction.user.id);
    if (!state) return interaction.update({ embeds: [embeds.buildErrorEmbed('Wizard expiroval, skús znova.')], components: [] });

    const notif = db.addNotification(interaction.user.id, {
        channel_id: state.channel_id, type: state.type,
        hour: null, minute: null, event_based: true, offset_minutes: offset,
    });
    notifWizardState.delete(interaction.user.id);

    const labels = { sunrise: '🌅 Vychod slnka', sunset: '🌇 Zapad slnka' };
    const offsetText = offset === 0 ? 'Presne v case' : `${offset} min pred`;
    const destLabel = state.dest === 'dm' ? '📩 DM' : `📢 <#${state.channel_id}>`;
    await interaction.update({
        embeds: [embeds.buildSuccessEmbed(
            `🔔 Notifikacia pridana!\n\n**Typ:** ${labels[state.type]}\n**Kedy:** ${offsetText}\n**Kam:** ${destLabel}\n**ID:** \`${notif.id}\``
        )], components: [],
    });
}

async function handleNwChangesPick(interaction) {
    const selectedChanges = interaction.values; // array of selected values
    const state = notifWizardState.get(interaction.user.id);
    if (!state) return interaction.update({ embeds: [embeds.buildErrorEmbed('Wizard expiroval, skús znova.')], components: [] });

    const notif = db.addNotification(interaction.user.id, {
        channel_id: state.channel_id,
        type: 'weather_change',
        hour: null,
        minute: null,
        event_based: true,
        watch_changes: selectedChanges,
    });
    notifWizardState.delete(interaction.user.id);

    const changeLabels = {
        sunny_to_cloudy: '☁️ Zatiahnuť sa',
        cloudy_to_sunny: '☀️ Vyjasniť sa',
        start_rain: '🌧️ Začne pršať',
        stop_rain: '🌤️ Prestane pršať',
        start_snow: '🌨️ Začne snežiť',
        storm_coming: '⛈️ Búrka',
        fog_coming: '🌫️ Hmla',
        wind_up: '💨 Silný vietor',
        temp_drop: '🥶 Pokles teploty',
        temp_rise: '🥵 Nárast teploty',
    };

    const selected = selectedChanges.map(c => changeLabels[c] || c).join('\n');
    const destLabel = state.dest === 'dm' ? '📩 DM' : `📢 <#${state.channel_id}>`;

    await interaction.update({
        embeds: [embeds.buildSuccessEmbed(
            `🔔 Notifikacia pridana!\n\n**Typ:** 🔄 Zmena pocasia\n**Sledujem:**\n${selected}\n\n**Kam:** ${destLabel}\n**ID:** \`${notif.id}\``
        )], components: [],
    });
}

async function handleNwSeverePick(interaction) {
    const selectedTypes = interaction.values;
    const state = notifWizardState.get(interaction.user.id);
    if (!state) return interaction.update({ embeds: [embeds.buildErrorEmbed('Wizard expiroval.')], components: [] });

    const notif = db.addNotification(interaction.user.id, {
        channel_id: state.channel_id,
        type: 'severe',
        hour: null,
        minute: null,
        event_based: true,
        watch_severe: selectedTypes,
    });
    notifWizardState.delete(interaction.user.id);

    const severeLabelMap = {};
    SEVERE_SUB_OPTIONS.forEach(o => { severeLabelMap[o.value] = `${o.emoji} ${o.label.split(' ').slice(1).join(' ')}`; });
    const selected = selectedTypes.map(t => severeLabelMap[t] || t).join('\n');
    const destLabel = state.dest === 'dm' ? '📩 DM' : `📢 <#${state.channel_id}>`;

    await interaction.update({
        embeds: [embeds.buildSuccessEmbed(
            `🔔 Notifikacia pridana!\n\n**Typ:** ⚠️ Vystrahy\n**Sledujem:**\n${selected}\n\n**Kam:** ${destLabel}\n**ID:** \`${notif.id}\``
        )], components: [],
    });
}

async function handleNwSunTypePick(interaction) {
    const sunType = interaction.values[0]; // sunrise or sunset
    const state = notifWizardState.get(interaction.user.id);
    if (!state) return interaction.update({ embeds: [embeds.buildErrorEmbed('Wizard expiroval.')], components: [] });

    state.type = sunType; // prepis type na sunrise/sunset

    const label = sunType === 'sunrise' ? 'vychodom' : 'zapadom';
    await interaction.update({
        embeds: [new EmbedBuilder().setColor(0x5865F2)
            .setTitle(`☀️  Kolko minut pred ${label}?`)
        ],
        components: [new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`nw_offset_sel_${interaction.user.id}`)
                .setPlaceholder('Vyber offset...')
                .addOptions([
                    { label: 'Presne v case', value: '0', emoji: '🎯' },
                    { label: '5 minut pred', value: '5', emoji: '⏱️' },
                    { label: '10 minut pred', value: '10', emoji: '⏱️' },
                    { label: '15 minut pred', value: '15', emoji: '⏱️' },
                    { label: '30 minut pred', value: '30', emoji: '⏱️' },
                    { label: '60 minut pred', value: '60', emoji: '⏱️' },
                ])
        )],
    });
}

async function handleNwMoonPick(interaction) {
    const selectedPhases = interaction.values;
    const state = notifWizardState.get(interaction.user.id);
    if (!state) return interaction.update({ embeds: [embeds.buildErrorEmbed('Wizard expiroval.')], components: [] });

    const notif = db.addNotification(interaction.user.id, {
        channel_id: state.channel_id,
        type: 'moon',
        hour: null,
        minute: null,
        event_based: true,
        watch_moon: selectedPhases,
    });
    notifWizardState.delete(interaction.user.id);

    const moonLabelMap = {};
    MOON_PHASE_OPTIONS.forEach(o => { moonLabelMap[o.value] = `${o.emoji} ${o.label.split(' ').slice(1).join(' ')}`; });
    const selected = selectedPhases.map(p => moonLabelMap[p] || p).join('\n');
    const destLabel = state.dest === 'dm' ? '📩 DM' : `📢 <#${state.channel_id}>`;

    await interaction.update({
        embeds: [embeds.buildSuccessEmbed(
            `🔔 Notifikacia pridana!\n\n**Typ:** 🌙 Mesiac\n**Fazy:**\n${selected}\n\n**Kam:** ${destLabel}\n**ID:** \`${notif.id}\``
        )], components: [],
    });
}

// ─── Reset ─────────────────────────────────

async function handleReset(interaction) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('confirm_reset').setLabel('Áno, vymazať').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('setup_done').setLabel('Nie').setStyle(ButtonStyle.Secondary),
    );
    await interaction.update({
        embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('⚠️  Naozaj?').setDescription('Vymaže sa všetko — mesto, notifikácie, obľúbené.')],
        components: [row],
    });
    const collector = interaction.message.createMessageComponentCollector({ time: 30_000 });
    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: 'Nie tvoje.', ephemeral: true });
        if (i.customId === 'confirm_reset') {
            db.deleteUser(interaction.user.id);
            const s = null;
            await i.update({ embeds: [embeds.buildSettingsEmbed(s)], components: buildSettingsButtons(s) });
        }
        collector.stop();
    });
}

async function handleSetupDone(interaction) {
    const s = db.getUser(interaction.user.id);
    await interaction.update({ embeds: [embeds.buildSettingsEmbed(s)], components: [] });
}

// ═══════════════════════════════════════════
//  /notifikacie
// ═══════════════════════════════════════════

async function handleNotifikacie(interaction, isRefresh = false) {
    const settings = db.getUser(interaction.user.id);
    const notifs = settings?.notifications || [];

    if (notifs.length === 0) {
        const embed = new EmbedBuilder().setColor(0x5865F2).setTitle('🔔  Notifikacie')
            .setDescription('Nemas ziadne notifikacie.\nPouzi `/nastavenia` alebo klikni nizsie.');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('notif_add').setLabel('Pridat').setEmoji('➕').setStyle(ButtonStyle.Success),
        );
        if (isRefresh) return interaction.update({ embeds: [embed], components: [row] });
        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // Zgrupuj notifikacie podla kategorie
    const TL = {
        daily: { cat: '📋 Prehlad', name: 'Ranny prehlad' },
        severe: { cat: '⚠️ Vystrahy', name: 'Vystrahy' },
        rain_now: { cat: '⚠️ Vystrahy', name: 'Dazd' },
        storm: { cat: '⚠️ Vystrahy', name: 'Burka' },
        extreme_temp: { cat: '⚠️ Vystrahy', name: 'Extrem. teplota' },
        snow: { cat: '⚠️ Vystrahy', name: 'Snezenie' },
        fog: { cat: '⚠️ Vystrahy', name: 'Hmla' },
        wind: { cat: '⚠️ Vystrahy', name: 'Silny vietor' },
        frost: { cat: '⚠️ Vystrahy', name: 'Namraza' },
        weather_change: { cat: '🔄 Zmeny', name: 'Zmena pocasia' },
        sunrise: { cat: '☀️ Slnko', name: 'Vychod' },
        sunset: { cat: '☀️ Slnko', name: 'Zapad' },
        moon: { cat: '🌙 Mesiac', name: 'Faza mesiaca' },
    };

    const groups = {};
    for (const n of notifs) {
        const info = TL[n.type] || { cat: '🔔 Ostatne', name: n.type };
        if (!groups[info.cat]) groups[info.cat] = [];

        const status = n.enabled ? '🟢' : '🔴';
        let timing;
        if (n.event_based || n.hour == null) {
            if (n.offset_minutes != null) timing = n.offset_minutes === 0 ? 'v case' : `${n.offset_minutes}min pred`;
            else timing = '⚡ hned';
        } else {
            timing = `⏰ ${String(n.hour).padStart(2,'0')}:${String(n.minute ?? 0).padStart(2,'0')}`;
        }

        let detail = info.name;
        if (n.watch_severe?.length) detail += ` (${n.watch_severe.length} typov)`;
        if (n.watch_changes?.length) detail += ` (${n.watch_changes.length} zmien)`;
        if (n.watch_moon?.length) {
            const moonNames = { new_moon: 'Nov', first_quarter: '1. stvrt', full_moon: 'Spln', last_quarter: 'Posl. stvrt' };
            detail += `: ${n.watch_moon.map(m => moonNames[m] || m).join(', ')}`;
        }

        groups[info.cat].push(`${status} **${detail}** — ${timing} — \`#${n.id}\``);
    }

    let description = '';
    for (const [cat, lines] of Object.entries(groups)) {
        description += `\n**${cat}**\n${lines.join('\n')}\n`;
    }

    const embed = new EmbedBuilder().setColor(0x5865F2)
        .setTitle(`🔔  Notifikacie (${notifs.length})`)
        .setDescription(description.trim())
        .setFooter({ text: 'Vyber nizsie na spravu' });

    const rows = [];
    if (notifs.length > 0) {
        const typeEmojis = {
            daily: '📋', severe: '⚠️', rain_now: '🌧️', storm: '⛈️',
            extreme_temp: '🌡️', snow: '🌨️', fog: '🌫️', wind: '💨',
            frost: '🧊', weather_change: '🔄', sunrise: '🌅',
            sunset: '🌇', moon: '🌙',
        };
        const selectOptions = notifs.map(n => {
            const info = TL[n.type] || { name: n.type };
            let timing = (n.event_based || n.hour == null) ? '⚡' : `${String(n.hour).padStart(2,'0')}:${String(n.minute ?? 0).padStart(2,'0')}`;
            return {
                label: `#${n.id} ${info.name} — ${timing}`,
                description: `${n.enabled ? 'Aktivna' : 'Vypnuta'}`,
                value: n.id,
                emoji: typeEmojis[n.type] || '🔔',
            };
        });
        rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId(`notif_manage_${interaction.user.id}`).setPlaceholder('Spravovat notifikaciu...').addOptions(selectOptions)
        ));
    }
    rows.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('notif_add').setLabel('Pridat').setEmoji('➕').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('notif_refresh').setLabel('Obnovit').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    ));

    if (isRefresh) return interaction.update({ embeds: [embed], components: rows });
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
}

async function handleNotifManageSelect(interaction) {
    const nid = interaction.values[0];
    const s = db.getUser(interaction.user.id);
    const n = s?.notifications?.find(x => x.id === nid);
    if (!n) return interaction.reply({ embeds: [embeds.buildErrorEmbed('Nenasla sa.')], ephemeral: true });

    const TL = {
        daily: '📋 Ranny prehlad', severe: '⚠️ Vystrahy', storm: '⛈️ Burka',
        rain_now: '🌧️ Dazd', extreme_temp: '🌡️ Extrem', sunrise: '🌅 Vychod slnka',
        sunset: '🌇 Zapad slnka', weather_change: '🔄 Zmena pocasia',
        snow: '🌨️ Snezenie', fog: '🌫️ Hmla', wind: '💨 Vietor',
        frost: '🧊 Namraza', moon: '🌙 Mesiac',
    };

    let timing;
    if (n.event_based || n.hour == null) {
        if (n.offset_minutes != null) timing = n.offset_minutes === 0 ? 'V case udalosti' : `${n.offset_minutes} min pred`;
        else timing = '⚡ Okamzita';
    } else {
        timing = `⏰ ${String(n.hour).padStart(2,'0')}:${String(n.minute ?? 0).padStart(2,'0')}`;
    }

    const embed = new EmbedBuilder()
        .setColor(n.enabled ? 0x57F287 : 0xED4245)
        .setTitle(`🔔 #${n.id} — ${TL[n.type] || n.type}`)
        .addFields(
            { name: 'Kedy', value: timing, inline: true },
            { name: 'Stav', value: n.enabled ? '🟢 Aktivna' : '🔴 Vypnuta', inline: true },
            { name: 'Kam', value: `<#${n.channel_id}>`, inline: true },
        );

    // Detail pre multi-select typy
    if (n.watch_severe?.length) {
        const sevLabels = { rain_now: '🌧️ Dazd', storm: '⛈️ Burka', extreme_temp: '🌡️ Extrem', snow: '🌨️ Sneh', fog: '🌫️ Hmla', wind: '💨 Vietor', frost: '🧊 Namraza' };
        embed.addFields({ name: 'Sledovane vystrahy', value: n.watch_severe.map(t => sevLabels[t] || t).join(', '), inline: false });
    }
    if (n.watch_changes?.length) {
        const chLabels = { sunny_to_cloudy: '☁️ Zatiahnutie', cloudy_to_sunny: '☀️ Vyjasnenie', start_rain: '🌧️ Dazd', stop_rain: '🌤️ Koniec dazda', start_snow: '🌨️ Sneh', storm_coming: '⛈️ Burka', fog_coming: '🌫️ Hmla', wind_up: '💨 Vietor', temp_drop: '🥶 Pokles', temp_rise: '🥵 Narast' };
        embed.addFields({ name: 'Sledovane zmeny', value: n.watch_changes.map(c => chLabels[c] || c).join(', '), inline: false });
    }
    if (n.watch_moon?.length) {
        const moonLabels = { new_moon: '🌑 Nov', first_quarter: '🌓 Prva stvrt', full_moon: '🌕 Spln', last_quarter: '🌗 Posledna stvrt' };
        embed.addFields({ name: 'Sledovane fazy', value: n.watch_moon.map(m => moonLabels[m] || m).join(', '), inline: false });
    }

    const buttons = [
        new ButtonBuilder().setCustomId(`notif_toggle_${nid}`).setLabel(n.enabled ? 'Vypnut' : 'Zapnut').setEmoji(n.enabled ? '🔴' : '🟢').setStyle(n.enabled ? ButtonStyle.Secondary : ButtonStyle.Success),
    ];

    // Pridaj Upravit button pre typy s multi-select
    if (n.watch_severe?.length || n.watch_changes?.length || n.watch_moon?.length) {
        buttons.push(new ButtonBuilder().setCustomId(`notif_edit_${nid}`).setLabel('Upravit').setEmoji('✏️').setStyle(ButtonStyle.Primary));
    }

    buttons.push(
        new ButtonBuilder().setCustomId(`notif_delete_${nid}`).setLabel('Odstranit').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('notif_refresh').setLabel('Spat').setStyle(ButtonStyle.Secondary),
    );

    const row = new ActionRowBuilder().addComponents(...buttons);
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleNotifToggle(interaction) {
    const nid = interaction.customId.replace('notif_toggle_', '');
    const r = db.toggleNotification(interaction.user.id, nid);
    if (!r) return interaction.update({ embeds: [embeds.buildErrorEmbed('Nenašla sa.')], components: [] });
    await interaction.update({
        embeds: [embeds.buildSuccessEmbed(`Notifikácia \`${nid}\` — ${r.enabled ? '🟢 Zapnutá' : '🔴 Vypnutá'}`)],
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('notif_refresh').setLabel('Späť').setStyle(ButtonStyle.Secondary))],
    });
}

async function handleNotifDelete(interaction) {
    const nid = interaction.customId.replace('notif_delete_', '');
    db.removeNotification(interaction.user.id, nid);
    await interaction.update({
        embeds: [embeds.buildSuccessEmbed(`Notifikacia \`#${nid}\` odstranena.`)],
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('notif_refresh').setLabel('Spat').setStyle(ButtonStyle.Secondary))],
    });
}

async function handleNotifEdit(interaction) {
    const nid = interaction.customId.replace('notif_edit_', '');
    const s = db.getUser(interaction.user.id);
    const n = s?.notifications?.find(x => x.id === nid);
    if (!n) return interaction.update({ embeds: [embeds.buildErrorEmbed('Nenasla sa.')], components: [] });

    let options, placeholder, title;

    if (n.watch_severe?.length || n.type === 'severe') {
        title = '⚠️ Upravit vystrahy';
        placeholder = 'Vyber vystrahy...';
        options = SEVERE_SUB_OPTIONS.map(o => ({
            ...o,
            default: (n.watch_severe || []).includes(o.value),
        }));
    } else if (n.watch_changes?.length || n.type === 'weather_change') {
        title = '🔄 Upravit zmeny pocasia';
        placeholder = 'Vyber zmeny...';
        options = WEATHER_CHANGE_OPTIONS.map(o => ({
            ...o,
            default: (n.watch_changes || []).includes(o.value),
        }));
    } else if (n.watch_moon?.length || n.type === 'moon') {
        title = '🌙 Upravit fazy mesiaca';
        placeholder = 'Vyber fazy...';
        options = MOON_PHASE_OPTIONS.map(o => ({
            ...o,
            default: (n.watch_moon || []).includes(o.value),
        }));
    } else {
        return interaction.update({ embeds: [embeds.buildErrorEmbed('Tato notifikacia sa neda upravit.')], components: [] });
    }

    await interaction.update({
        embeds: [new EmbedBuilder().setColor(0x5865F2)
            .setTitle(`✏️ ${title} — #${nid}`)
            .setDescription('Zmen vyber a potvrdi. Aktualne vybrane su predoznacene:')
        ],
        components: [new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`notif_edit_save_${nid}`)
                .setPlaceholder(placeholder)
                .setMinValues(1)
                .setMaxValues(options.length)
                .addOptions(options)
        )],
    });
}

async function handleNotifEditSave(interaction) {
    const nid = interaction.customId.replace('notif_edit_save_', '');
    const selected = interaction.values;
    const s = db.getUser(interaction.user.id);
    const n = s?.notifications?.find(x => x.id === nid);
    if (!n) return interaction.update({ embeds: [embeds.buildErrorEmbed('Nenasla sa.')], components: [] });

    let updateData = {};
    let label = '';

    if (n.type === 'severe' || n.watch_severe) {
        updateData.watch_severe = selected;
        const sevLabels = { rain_now: '🌧️ Dazd', storm: '⛈️ Burka', extreme_temp: '🌡️ Extrem', snow: '🌨️ Sneh', fog: '🌫️ Hmla', wind: '💨 Vietor', frost: '🧊 Namraza' };
        label = selected.map(t => sevLabels[t] || t).join(', ');
    } else if (n.type === 'weather_change' || n.watch_changes) {
        updateData.watch_changes = selected;
        const chLabels = { sunny_to_cloudy: '☁️ Zatiahnutie', cloudy_to_sunny: '☀️ Vyjasnenie', start_rain: '🌧️ Dazd', stop_rain: '🌤️ Koniec', start_snow: '🌨️ Sneh', storm_coming: '⛈️ Burka', fog_coming: '🌫️ Hmla', wind_up: '💨 Vietor', temp_drop: '🥶 Pokles', temp_rise: '🥵 Narast' };
        label = selected.map(c => chLabels[c] || c).join(', ');
    } else if (n.type === 'moon' || n.watch_moon) {
        updateData.watch_moon = selected;
        const moonLabels = { new_moon: '🌑 Nov', first_quarter: '🌓 Prva stvrt', full_moon: '🌕 Spln', last_quarter: '🌗 Posl. stvrt' };
        label = selected.map(m => moonLabels[m] || m).join(', ');
    }

    db.updateNotification(interaction.user.id, nid, updateData);

    await interaction.update({
        embeds: [embeds.buildSuccessEmbed(`Notifikacia **#${nid}** upravena!\n\n**Nove nastavenie:**\n${label}`)],
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('notif_refresh').setLabel('Spat').setStyle(ButtonStyle.Secondary))],
    });
}

// ═══════════════════════════════════════════
//  /help
// ═══════════════════════════════════════════

function buildHelpButtons(active = 'main') {
    const s = (id) => id === active ? ButtonStyle.Success : ButtonStyle.Secondary;
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_main').setLabel('Prehled').setStyle(s('main')),
        new ButtonBuilder().setCustomId('help_pocasie').setLabel('Pocasie').setStyle(s('pocasie')),
        new ButtonBuilder().setCustomId('help_smart').setLabel('Smart').setStyle(s('smart')),
        new ButtonBuilder().setCustomId('help_notif').setLabel('Notifikacie').setStyle(s('notif')),
        new ButtonBuilder().setCustomId('help_server').setLabel('Server').setStyle(s('server')),
    );
}

async function handleHelp(interaction, isUpdate = false) {
    const section = isUpdate ? interaction.customId.replace('help_', '') : 'main';
    const embed = embeds.buildHelpEmbed(section);
    const row = buildHelpButtons(section);

    if (isUpdate) {
        return interaction.update({ embeds: [embed], components: [row] });
    }
    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// ═══════════════════════════════════════════
//  /poll
// ═══════════════════════════════════════════

async function handlePoll(interaction) {
    const s = db.getUser(interaction.user.id);
    if (!s?.latitude) return interaction.reply({ embeds: [embeds.buildErrorEmbed('Nastav si mesto!')], ephemeral: true });

    await interaction.deferReply({ ephemeral: true });
    try {
        const dd = await weather.getDailyForecast(s.latitude, s.longitude, s.timezone || 'auto', 7);
        const d = dd.daily;
        const dayNames = ['Ne','Po','Ut','St','Št','Pi','So'];

        const options = [];
        for (let i = 0; i < d.time.length && i < 7; i++) {
            const date = new Date(d.time[i] + 'T12:00:00');
            const dn = dayNames[date.getDay()];
            const dateStr = `${date.getDate()}.${date.getMonth()+1}.`;
            const w = weather.getWeatherInfo(d.weather_code?.[i] ?? 0);
            const tMax = d.temperature_2m_max?.[i] ?? '?';
            const tMin = d.temperature_2m_min?.[i] ?? '?';
            const precip = d.precipitation_probability_max?.[i] ?? 0;
            const dayLabel = i === 0 ? 'Dnes' : i === 1 ? 'Zajtra' : `${dn} ${dateStr}`;

            options.push({
                label: `${dayLabel} — ${tMax}°/${tMin}°`,
                description: `${w.text} · 💧 ${precip}%`,
                value: String(i),
                emoji: w.emoji,
            });
        }

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`poll_day_${interaction.user.id}`)
                .setPlaceholder('Vyber 1 alebo viac dní...')
                .setMinValues(1)
                .setMaxValues(Math.min(7, options.length))
                .addOptions(options)
        );

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🗳️  Pôjdeme von? — ${s.city}`)
            .setDescription('Vyber deň alebo viac dní z predpovede.\n\n**1 deň** = 👍👎🤷 hlasovanie\n**Viac dní** = čísla 1️⃣2️⃣3️⃣... na výber dňa');

        return interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
        console.error('[POLL]', err);
        return interaction.editReply({ embeds: [embeds.buildErrorEmbed('Nepodarilo sa načítať predpoveď.')] });
    }
}

const NUMBER_EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣'];

async function handlePollDayPick(interaction) {
    const selectedDays = interaction.values.map(v => parseInt(v)).sort((a, b) => a - b);
    const s = db.getUser(interaction.user.id);
    if (!s?.latitude) return interaction.update({ embeds: [embeds.buildErrorEmbed('Nastav si mesto!')], components: [] });

    // V DMs posli priamo, na serveri posli ako verejnu spravu
    const isDM = !interaction.guildId;

    try {
        const maxDay = Math.max(...selectedDays) + 1;
        const dd = await weather.getDailyForecast(s.latitude, s.longitude, s.timezone || 'auto', maxDay);

        if (selectedDays.length === 1) {
            const embed = embeds.buildPollEmbed(dd, s, selectedDays[0]);
            if (isDM) {
                // V DMs — posli priamo ako odpoved
                await interaction.update({ embeds: [embed], components: [] });
            } else {
                await interaction.update({ embeds: [embeds.buildSuccessEmbed('🗳️ Poll odoslaný!')], components: [] });
                const msg = await interaction.channel.send({ embeds: [embed] });
                await msg.react('👍').catch(() => {});
                await msg.react('👎').catch(() => {});
                await msg.react('🤷').catch(() => {});
            }
        } else {
            const embed = embeds.buildMultiPollEmbed(dd, s, selectedDays);
            if (isDM) {
                await interaction.update({ embeds: [embed], components: [] });
            } else {
                await interaction.update({ embeds: [embeds.buildSuccessEmbed('🗳️ Poll odoslaný!')], components: [] });
                const msg = await interaction.channel.send({ embeds: [embed] });
                for (let i = 0; i < selectedDays.length && i < 7; i++) {
                    await msg.react(NUMBER_EMOJIS[i]).catch(() => {});
                }
            }
        }
    } catch (err) {
        console.error('[POLL_SEND]', err);
    }
}

// ═══════════════════════════════════════════
//  /kanal — server weather channel (admin)
// ═══════════════════════════════════════════

async function handleKanal(interaction) {
    // Len admin/manage guild
    if (!interaction.memberPermissions?.has('ManageGuild')) {
        return interaction.reply({ embeds: [embeds.buildErrorEmbed('Na toto potrebuješ oprávnenie **Manage Server**.')], ephemeral: true });
    }

    const mesto = interaction.options.getString('mesto');
    const hodina = interaction.options.getInteger('hodina') ?? 7;
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    await interaction.deferReply({ ephemeral: true });

    try {
        const results = await weather.geocode(mesto);
        if (!results.length) return interaction.editReply({ embeds: [embeds.buildErrorEmbed(`Mesto "${mesto}" sa nenašlo.`)] });

        const r = results[0];
        db.setServer(interaction.guildId, {
            channel_id: channel.id,
            city: r.name,
            latitude: r.latitude,
            longitude: r.longitude,
            timezone: r.timezone || 'auto',
            hour: hodina,
            minute: 0,
            enabled: true,
        });

        return interaction.editReply({ embeds: [embeds.buildSuccessEmbed(
            `📢 Server počasie nastavené!\n\n` +
            `**Mesto:** ${r.name}\n` +
            `**Kanál:** <#${channel.id}>\n` +
            `**Čas:** ${String(hodina).padStart(2,'0')}:00 denne\n\n` +
            `Každé ráno sa tu objaví predpoveď pre celý server.`
        )] });
    } catch (err) {
        console.error('[KANAL]', err);
        return interaction.editReply({ embeds: [embeds.buildErrorEmbed('Chyba pri nastavovaní.')] });
    }
}

// ═══════════════════════════════════════════
//  /mesiac — lunárny kalendár
// ═══════════════════════════════════════════

async function handleMesiac(interaction) {
    const lunarDays = weather.getLunarCalendar(14);
    return interaction.reply({ embeds: [embeds.buildLunarEmbed(lunarDays)] });
}

// ═══════════════════════════════════════════
//  /outfit — čo si obliecť
// ═══════════════════════════════════════════

async function handleOutfit(interaction) {
    const mesto = interaction.options?.getString?.('mesto') || null;

    await interaction.deferReply();

    const loc = await resolveLocation(interaction, mesto);
    if (loc.error) return interaction.editReply({ embeds: [embeds.buildErrorEmbed(loc.error)] });

    try {
        const [currentData, dailyData] = await Promise.all([
            weather.getCurrentWeather(loc.lat, loc.lon, loc.tz, loc.units),
            weather.getDailyForecast(loc.lat, loc.lon, loc.tz, 1, loc.units),
        ]);
        const advice = weather.getOutfitAdvice(currentData, dailyData);
        return interaction.editReply({ embeds: [embeds.buildOutfitEmbed(advice, loc.settings)] });
    } catch (err) {
        console.error('[OUTFIT]', err);
        return interaction.editReply({ embeds: [embeds.buildErrorEmbed('Chyba pri nacitani.')] });
    }
}

// ═══════════════════════════════════════════
//  /doprava — dopravné varovania
// ═══════════════════════════════════════════

async function handleDoprava(interaction) {
    const s = db.getUser(interaction.user.id);
    if (!s?.latitude) return interaction.reply({ embeds: [embeds.buildErrorEmbed('Nastav si mesto!')], ephemeral: true });

    await interaction.deferReply();
    try {
        const [currentData, hourlyData] = await Promise.all([
            weather.getCurrentWeather(s.latitude, s.longitude, s.timezone || 'auto'),
            weather.getHourlyForecast(s.latitude, s.longitude, s.timezone || 'auto', 2),
        ]);
        const warnings = weather.getTrafficWarnings(currentData, hourlyData);
        return interaction.editReply({ embeds: [embeds.buildTrafficEmbed(warnings, s)] });
    } catch (err) {
        console.error('[DOPRAVA]', err);
        return interaction.editReply({ embeds: [embeds.buildErrorEmbed('Chyba pri načítaní.')] });
    }
}

module.exports = { handleInteraction };
