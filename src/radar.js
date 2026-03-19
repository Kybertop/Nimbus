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

async function captureWindy(lat, lon, layerKey = 'radar') {
    const layer = LAYERS[layerKey] || LAYERS.radar;

    const url = `https://embed.windy.com/embed2.html`
        + `?lat=${lat}&lon=${lon}`
        + `&detailLat=${lat}&detailLon=${lon}`
        + `&width=1000&height=600`
        + `&zoom=9&level=surface`
        + `&overlay=${layer.overlay}&product=${layer.product}`
        + `&menu=&message=&marker=true`
        + `&calendar=now&pressure=`
        + `&type=map&location=coordinates`
        + `&metricWind=km%2Fh&metricTemp=%C2%B0C`;

    console.log('[RADAR] Spustam browser...');
    const browser = await puppeteer.launch({
        headless: 'shell',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    try {
        await page.setViewport({ width: 1000, height: 600 });

        console.log('[RADAR] Nacitavam Windy:', layerKey);
        // Rovnaky pristup ako v teste co fungoval
        page.goto(url, { timeout: 60000 }).catch(e => console.log('[RADAR] goto pozadie:', e.message));

        // Cakaj 15s — Windy sa nacita
        console.log('[RADAR] Cakam 15s na renderovanie...');
        await new Promise(r => setTimeout(r, 15000));

        // Skry vsetky Windy UI elementy
        await page.evaluate(() => {
            const selectors = [
                '#bottom', '#mobile-calendar', '#embed-zoom',
                '.logo-wrapper', '#windy-app-promo',
                '.leaflet-control-zoom', '.leaflet-control-attribution',
                '.right-border', '.left-border',
                '#detail', '.progress-bar', '.timecode',
                '.leaflet-top', '.leaflet-bottom',
                '.overlay-select', '#plugin-detail',
            ];
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    el.style.setProperty('display', 'none', 'important');
                });
            });
            // Skry aj spodny panel cez CSS
            const style = document.createElement('style');
            style.textContent = '#bottom, .leaflet-control-container, #embed-zoom, .logo-wrapper { display: none !important; }';
            document.head.appendChild(style);
        }).catch(() => {});

        await new Promise(r => setTimeout(r, 500));

        const filename = `radar_${layerKey}_${Date.now()}.png`;
        const filepath = path.join(OUTPUT_DIR, filename);

        // Screenshot s orezanim — vyrez cistu mapu bez okrajov
        await page.screenshot({
            path: filepath,
            type: 'png',
            clip: { x: 0, y: 0, width: 1000, height: 560 },
        });
        console.log('[RADAR] Screenshot hotovy:', filename);

        return { filepath, layer };
    } catch (err) {
        console.error('[RADAR] Chyba:', err.message);
        throw err;
    } finally {
        await page.close().catch(() => {});
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
