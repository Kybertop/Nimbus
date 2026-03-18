require('dotenv/config');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { handleInteraction } = require('./handlers');
const notifications = require('./notifications');
const weather = require('./weather');
const db = require('./database');

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error('[FATAL] Chyba DISCORD_TOKEN v .env subore!');
    process.exit(1);
}

// ─── File logging ──────────────────────────

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function getLogFile() {
    const d = new Date();
    const name = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.log`;
    return path.join(LOG_DIR, name);
}

function logToFile(level, msg) {
    const time = new Date().toISOString();
    const line = `[${time}] [${level}] ${msg}\n`;
    fs.appendFileSync(getLogFile(), line);
}

// Presmeruj console.error aj do suboru
const origError = console.error;
console.error = (...args) => {
    origError(...args);
    logToFile('ERROR', args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
};

const origLog = console.log;
console.log = (...args) => {
    origLog(...args);
    logToFile('INFO', args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
};

// ─── Client ────────────────────────────────

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

// ─── Live weather status ───────────────────

async function updateStatus() {
    if (!client?.isReady()) return;

    // Najdi prveho usera s nastavenym mestom pre status
    const statusCity = process.env.STATUS_CITY || null;
    let lat, lon, tz, city;

    if (statusCity) {
        try {
            const results = await weather.geocode(statusCity);
            if (results.length) {
                lat = results[0].latitude;
                lon = results[0].longitude;
                tz = results[0].timezone || 'auto';
                city = results[0].name;
            }
        } catch {}
    }

    if (!lat) {
        // Fallback — pouzi prve mesto z DB
        const allUsers = db.getAllUsers();
        for (const [, settings] of Object.entries(allUsers)) {
            if (settings.latitude) {
                lat = settings.latitude; lon = settings.longitude;
                tz = settings.timezone || 'auto'; city = settings.city;
                break;
            }
        }
    }

    if (!lat) {
        client.user.setActivity('/pocasie | /help', { type: ActivityType.Listening });
        return;
    }

    try {
        const data = await weather.getCurrentWeather(lat, lon, tz);
        const c = data.current;
        const w = weather.getWeatherInfo(c.weather_code);
        const temp = Math.round(c.temperature_2m);
        client.user.setActivity(`${temp}° ${w.text} | ${city}`, { type: ActivityType.Watching });
    } catch {
        client.user.setActivity('/pocasie | /help', { type: ActivityType.Listening });
    }
}

// ─── Ready ─────────────────────────────────

client.once('ready', () => {
    console.log('==========================================');
    console.log(`  Nimbus online!`);
    console.log(`  Prihlaseny ako: ${client.user.tag}`);
    console.log(`  Servery: ${client.guilds.cache.size}`);
    console.log('==========================================');

    // Pociatocny status
    updateStatus();

    // Update status kazdych 10 minut
    setInterval(updateStatus, 10 * 60 * 1000);

    // Spusti notifikacny system
    notifications.init(client);
});

// ─── Interactions ──────────────────────────

client.on('interactionCreate', async (interaction) => {
    try {
        await handleInteraction(interaction);
    } catch (err) {
        console.error('[ERROR] Neostrena chyba:', err.stack || err.message);
        const reply = { content: 'Nieco sa pokazilo. Skus to znova.', ephemeral: true };
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(reply).catch(() => {});
        } else {
            await interaction.reply(reply).catch(() => {});
        }
    }
});

// ─── Crash recovery ────────────────────────

process.on('unhandledRejection', (err) => {
    console.error('[CRASH] Unhandled rejection:', err.stack || err.message || err);
});

process.on('uncaughtException', (err) => {
    console.error('[CRASH] Uncaught exception:', err.stack || err.message || err);
    // Nechaj PM2 restartnut proces
    process.exit(1);
});

client.login(TOKEN);
