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
const COOLDOWN = 60 * 1000;
const userCooldowns = {};

// Stav generovania na pozadi: { "lat|lon": { ready: Set(['radar','wind',...]), generating: true/false } }
const genState = {};

function getCacheKey(lat, lon) {
    return `${lat.toFixed(2)}|${lon.toFixed(2)}`;
}

function checkCooldown(userId) {
    const last = userCooldowns[userId];
    if (last && Date.now() - last < COOLDOWN) {
        return Math.ceil((COOLDOWN - (Date.now() - last)) / 1000);
    }
    return 0;
}

function setCooldown(userId) {
    userCooldowns[userId] = Date.now();
}

function isLayerReady(lat, lon, layerKey) {
    const dir = OUTPUT_DIR;
    if (!fs.existsSync(dir)) return false;
    const files = fs.readdirSync(dir).filter(f => f.startsWith(`radar_${layerKey}_`));
    if (files.length === 0) return false;
    // Skontroluj ci nie je prilis stary (10 min)
    const latest = path.join(dir, files.sort().reverse()[0]);
    return (Date.now() - fs.statSync(latest).mtimeMs) < 10 * 60 * 1000;
}

function getLayerFile(layerKey) {
    if (!fs.existsSync(OUTPUT_DIR)) return null;
    const files = fs.readdirSync(OUTPUT_DIR)
        .filter(f => f.startsWith(`radar_${layerKey}_`))
        .sort().reverse();
    if (files.length === 0) return null;
    const fp = path.join(OUTPUT_DIR, files[0]);
    if (Date.now() - fs.statSync(fp).mtimeMs > 10 * 60 * 1000) return null;
    return fp;
}

function buildUrl(lat, lon, layer) {
    return `https://embed.windy.com/embed2.html`
        + `?lat=${lat}&lon=${lon}`
        + `&detailLat=${lat}&detailLon=${lon}`
        + `&width=1000&height=600`
        + `&zoom=10&level=surface`
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

async function screenshotLayer(page, lat, lon, layerKey, isFirst) {
    const layer = LAYERS[layerKey];
    const url = buildUrl(lat, lon, layer);

    page.goto(url, { timeout: 60000 }).catch(() => {});
    // Prvy load dlhsi, dalsie rychlejsie
    await new Promise(r => setTimeout(r, isFirst ? 15000 : 8000));

    await hideUI(page);
    await new Promise(r => setTimeout(r, 500));

    const filename = `radar_${layerKey}_${Date.now()}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    await page.screenshot({
        path: filepath,
        type: 'png',
        clip: { x: 0, y: 0, width: 1000, height: 560 },
    });

    return filepath;
}

// Zachyti PRVY layer (radar) a vrati ho hned
// Potom na pozadi zachyti zvysok
async function captureFirstLayer(lat, lon) {
    // Ak uz mame cerstvo cache, pouzi ho
    const existing = getLayerFile('radar');
    if (existing) {
        console.log('[RADAR] Pouzivam cache pre radar');
        // Spusti pozadie ak chybaju ostatne
        backgroundCapture(lat, lon);
        return existing;
    }

    console.log('[RADAR] Spustam browser — prvy layer (radar)...');
    const browser = await puppeteer.launch({
        headless: 'shell',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 600 });

    try {
        const filepath = await screenshotLayer(page, lat, lon, 'radar', true);
        console.log('[RADAR] Radar hotovy, spustam pozadie...');

        // Spusti zvysne layers na pozadi — ROVNAKY browser a page
        captureRemainingLayers(browser, page, lat, lon).catch(err => {
            console.error('[RADAR_BG] Chyba:', err.message);
            page.close().catch(() => {});
            browser.close().catch(() => {});
        });

        return filepath;
    } catch (err) {
        await page.close().catch(() => {});
        await browser.close().catch(() => {});
        throw err;
    }
}

// Zachyti zvysne layers na pozadi (pouzije existujuci browser)
async function captureRemainingLayers(browser, page, lat, lon) {
    const key = getCacheKey(lat, lon);
    if (genState[key]?.generating) return;
    genState[key] = { generating: true };

    const remaining = LAYER_KEYS.filter(k => k !== 'radar');

    for (let i = 0; i < remaining.length; i++) {
        const layerKey = remaining[i];
        // Preskoc ak uz mame cerstvo cache
        if (isLayerReady(lat, lon, layerKey)) {
            console.log(`[RADAR_BG] ${layerKey} uz existuje, preskakujem`);
            continue;
        }
        try {
            console.log(`[RADAR_BG] [${i + 1}/${remaining.length}] ${layerKey}...`);
            await screenshotLayer(page, lat, lon, layerKey, false);
            console.log(`[RADAR_BG] [${i + 1}/${remaining.length}] ${layerKey} hotovy`);
        } catch (err) {
            console.error(`[RADAR_BG] ${layerKey} zlyhal:`, err.message);
        }
    }

    genState[key] = { generating: false };
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
    console.log('[RADAR_BG] Vsetko hotove, browser zatvoreny');
}

// Spusti pozadie capture ak chybaju layers
function backgroundCapture(lat, lon) {
    const key = getCacheKey(lat, lon);
    if (genState[key]?.generating) return;

    const missing = LAYER_KEYS.filter(k => !isLayerReady(lat, lon, k));
    if (missing.length === 0) return;

    console.log('[RADAR_BG] Chybajuce:', missing.join(', '));
    (async () => {
        const browser = await puppeteer.launch({
            headless: 'shell',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1000, height: 600 });
        await captureRemainingLayers(browser, page, lat, lon);
    })().catch(err => console.error('[RADAR_BG] Spustenie zlyhalo:', err.message));
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

module.exports = { captureFirstLayer, getLayerFile, isLayerReady, LAYERS, LAYER_KEYS, checkCooldown, setCooldown };
