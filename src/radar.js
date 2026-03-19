const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'radar');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const LAYERS = {
    radar:   { overlay: 'radar',    product: 'radar',  name: 'Radar zrazok',  emoji: '🌧️', color: 0x3498DB },
    wind:    { overlay: 'wind',     product: 'ecmwf',  name: 'Vietor',        emoji: '💨', color: 0x1ABC9C },
    temp:    { overlay: 'temp',     product: 'ecmwf',  name: 'Teplota',       emoji: '🌡️', color: 0xE74C3C },
    clouds:  { overlay: 'clouds',   product: 'ecmwf',  name: 'Oblacnost',     emoji: '☁️', color: 0x95A5A6 },
    thunder: { overlay: 'thunder',  product: 'ecmwf',  name: 'Burky',         emoji: '⛈️', color: 0x9B59B6 },
};

const LAYER_KEYS = Object.keys(LAYERS);

// Cache: { "lat|lon": { timestamp, files: { radar: filepath, wind: filepath, ... } } }
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minut
const COOLDOWN = 60 * 1000; // 1 min per user
const userCooldowns = {};

function getCacheKey(lat, lon) {
    return `${lat.toFixed(2)}|${lon.toFixed(2)}`;
}

function getCached(lat, lon) {
    const key = getCacheKey(lat, lon);
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        delete cache[key];
        return null;
    }
    return entry.files;
}

function checkCooldown(userId) {
    const last = userCooldowns[userId];
    if (last && Date.now() - last < COOLDOWN) {
        const wait = Math.ceil((COOLDOWN - (Date.now() - last)) / 1000);
        return wait;
    }
    return 0;
}

function setCooldown(userId) {
    userCooldowns[userId] = Date.now();
}

function buildUrl(lat, lon, layer) {
    return `https://embed.windy.com/embed2.html`
        + `?lat=${lat}&lon=${lon}`
        + `&detailLat=${lat}&detailLon=${lon}`
        + `&width=1000&height=600`
        + `&zoom=9&level=surface`
        + `&overlay=${layer.overlay}&product=${layer.product}`
        + `&menu=&message=&marker=true`
        + `&calendar=now&pressure=`
        + `&type=map&location=coordinates`
        + `&metricWind=km%2Fh&metricTemp=%C2%B0C`;
}

async function hideUI(page) {
    await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = `
            #bottom, .leaflet-control-container, #embed-zoom,
            .logo-wrapper, #windy-app-promo, #mobile-calendar,
            #detail, .progress-bar, .timecode, .overlay-select,
            #plugin-detail, .right-border, .left-border
            { display: none !important; }
        `;
        document.head.appendChild(style);
    }).catch(() => {});
}

// Stiahne VSETKY vrstvy naraz — jeden browser, jedna session
async function captureAllLayers(lat, lon) {
    // Skontroluj cache
    const cached = getCached(lat, lon);
    if (cached) {
        console.log('[RADAR] Pouzivam cache');
        return cached;
    }

    console.log('[RADAR] Spustam browser — generujem vsetkych', LAYER_KEYS.length, 'vrstiev...');
    const browser = await puppeteer.launch({
        headless: 'shell',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const files = {};
    const page = await browser.newPage();

    try {
        await page.setViewport({ width: 1000, height: 600 });

        for (let i = 0; i < LAYER_KEYS.length; i++) {
            const key = LAYER_KEYS[i];
            const layer = LAYERS[key];
            const url = buildUrl(lat, lon, layer);

            console.log(`[RADAR] [${i + 1}/${LAYER_KEYS.length}] ${key}...`);

            if (i === 0) {
                // Prvy layer — nacitaj stranku
                page.goto(url, { timeout: 60000 }).catch(() => {});
                await new Promise(r => setTimeout(r, 15000));
            } else {
                // Dalsie layers — zmen vrstvu cez URL hash / navigaciu na tej istej stranke
                page.goto(url, { timeout: 60000 }).catch(() => {});
                await new Promise(r => setTimeout(r, 8000));
            }

            await hideUI(page);
            await new Promise(r => setTimeout(r, 500));

            const filename = `radar_${key}_${Date.now()}.png`;
            const filepath = path.join(OUTPUT_DIR, filename);

            await page.screenshot({
                path: filepath,
                type: 'png',
                clip: { x: 0, y: 0, width: 1000, height: 560 },
            });

            files[key] = filepath;
            console.log(`[RADAR] [${i + 1}/${LAYER_KEYS.length}] ${key} hotovy`);
        }
    } finally {
        await page.close().catch(() => {});
        await browser.close().catch(() => {});
        console.log('[RADAR] Browser zatvoreny');
    }

    // Uloz do cache
    const cacheKey = getCacheKey(lat, lon);
    cache[cacheKey] = { timestamp: Date.now(), files };

    return files;
}

// Cistenie starych suborov (starsie ako 10 min)
function cleanOldImages() {
    if (!fs.existsSync(OUTPUT_DIR)) return;
    const now = Date.now();
    for (const file of fs.readdirSync(OUTPUT_DIR)) {
        if (!file.startsWith('radar_')) continue;
        const fp = path.join(OUTPUT_DIR, file);
        try {
            if (now - fs.statSync(fp).mtimeMs > 10 * 60 * 1000) fs.unlinkSync(fp);
        } catch {}
    }
}

setInterval(cleanOldImages, 5 * 60 * 1000);
cleanOldImages();

module.exports = { captureAllLayers, LAYERS, LAYER_KEYS, checkCooldown, setCooldown };
