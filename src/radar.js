const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'radar');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const LAYERS = {
    radar:   { overlay: 'radar',    product: 'radar',  name: 'Radar zrazok',  emoji: '🌧️', color: 0x3498DB },
    wind:    { overlay: 'wind',     product: 'ecmwf',  name: 'Vietor',        emoji: '💨', color: 0x1ABC9C },
    temp:    { overlay: 'temp',     product: 'ecmwf',  name: 'Teplota',       emoji: '🌡️', color: 0xE74C3C },
    clouds:  { overlay: 'clouds',   product: 'ecmwf',  name: 'Oblacnost',     emoji: '☁️', color: 0x95A5A6 },
    thunder: { overlay: 'thunder',  product: 'ecmwf',  name: 'Burky',         emoji: '⛈️', color: 0x9B59B6 },
};

async function captureWindy(lat, lon, layerKey = 'radar') {
    const puppeteer = require('puppeteer');
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

    console.log('[RADAR] Spustam browser...');
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--window-size=800,500',
        ],
    });

    let page;
    try {
        page = await browser.newPage();
        await page.setViewport({ width: 800, height: 500 });

        console.log('[RADAR] Nacitavam Windy:', layerKey);
        
        // Nenechavaj page.goto cakat na load — Windy nikdy neskonci loadovat
        // Namiesto toho naviguj a pockaj fixny cas
        page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
        
        // Daj Windy 12 sekund na renderovanie mapy
        await new Promise(r => setTimeout(r, 12000));

        console.log('[RADAR] Robim screenshot...');

        // Skry UI elementy
        await page.evaluate(() => {
            const selectors = [
                '#bottom', '#mobile-calendar', '#embed-zoom',
                '.logo-wrapper', '#windy-app-promo',
                '.leaflet-control-zoom', '.leaflet-control-attribution',
            ];
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    el.style.setProperty('display', 'none', 'important');
                });
            });
        }).catch(() => {});

        await new Promise(r => setTimeout(r, 500));

        const filename = `radar_${layerKey}_${Date.now()}.png`;
        const filepath = path.join(OUTPUT_DIR, filename);

        await page.screenshot({ path: filepath, type: 'png' });
        console.log('[RADAR] Screenshot ulozeny:', filename);

        return { filepath, layer };
    } catch (err) {
        console.error('[RADAR] Chyba:', err.message);
        throw err;
    } finally {
        if (page) await page.close().catch(() => {});
        await browser.close().catch(() => {});
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

module.exports = { captureWindy, LAYERS };
