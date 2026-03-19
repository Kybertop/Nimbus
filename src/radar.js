const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'radar');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let puppeteer;
try { puppeteer = require('puppeteer'); } catch { puppeteer = null; }

let browser = null;

async function getBrowser() {
    if (!puppeteer) throw new Error('Puppeteer nie je nainstalovany');
    if (browser && browser.connected) return browser;
    browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    return browser;
}

const LAYERS = {
    radar:   { overlay: 'radar',    product: 'radar',  name: 'Radar zrazok',  emoji: '🌧️', color: 0x3498DB },
    wind:    { overlay: 'wind',     product: 'ecmwf',  name: 'Vietor',        emoji: '💨', color: 0x1ABC9C },
    temp:    { overlay: 'temp',     product: 'ecmwf',  name: 'Teplota',       emoji: '🌡️', color: 0xE74C3C },
    clouds:  { overlay: 'clouds',   product: 'ecmwf',  name: 'Oblacnost',     emoji: '☁️', color: 0x95A5A6 },
    thunder: { overlay: 'thunder',  product: 'ecmwf',  name: 'Burky',         emoji: '⛈️', color: 0x9B59B6 },
    rain:    { overlay: 'rainAccu', product: 'ecmwf',  name: 'Zrazky',        emoji: '🌧️', color: 0x2980B9 },
};

async function captureWindy(lat, lon, layerKey = 'radar') {
    const layer = LAYERS[layerKey] || LAYERS.radar;

    const url = `https://embed.windy.com/embed2.html`
        + `?lat=${lat}&lon=${lon}`
        + `&detailLat=${lat}&detailLon=${lon}`
        + `&width=800&height=500`
        + `&zoom=8&level=surface`
        + `&overlay=${layer.overlay}&product=${layer.product}`
        + `&menu=&message=true&marker=true`
        + `&calendar=now&pressure=true`
        + `&type=map&location=coordinates`
        + `&metricWind=km%2Fh&metricTemp=%C2%B0C`;

    const br = await getBrowser();
    const page = await br.newPage();

    try {
        await page.setViewport({ width: 800, height: 500 });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

        // Pockaj na nacitanie mapy
        await new Promise(r => setTimeout(r, 4000));

        // Skry Windy logo/menu ak je tam
        await page.evaluate(() => {
            const els = document.querySelectorAll('#bottom, #mobile-calendar, .leaflet-control-container .leaflet-bottom');
            els.forEach(el => { if (el) el.style.display = 'none'; });
        }).catch(() => {});

        const filename = `radar_${layerKey}_${Date.now()}.png`;
        const filepath = path.join(OUTPUT_DIR, filename);

        await page.screenshot({ path: filepath, type: 'png' });
        return { filepath, layer };
    } finally {
        await page.close().catch(() => {});
    }
}

// Cistenie starych suborov (starsie ako 1h)
function cleanOldImages() {
    if (!fs.existsSync(OUTPUT_DIR)) return;
    const now = Date.now();
    for (const file of fs.readdirSync(OUTPUT_DIR)) {
        if (!file.startsWith('radar_')) continue;
        const fp = path.join(OUTPUT_DIR, file);
        try {
            if (now - fs.statSync(fp).mtimeMs > 60 * 60 * 1000) fs.unlinkSync(fp);
        } catch {}
    }
}

setInterval(cleanOldImages, 30 * 60 * 1000);
cleanOldImages();

// Shutdown browser pri ukonceni procesu
process.on('exit', () => { if (browser) browser.close().catch(() => {}); });

module.exports = { captureWindy, LAYERS };
