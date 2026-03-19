const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TILE_SIZE = 256;
const GRID = 3; // 3x3 tiles = 768x768 px
const ZOOM = 7;
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'radar');

// Vytvor output dir
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Lat/lon -> tile coordinates
function latLonToTile(lat, lon, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const latRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { x, y };
}

async function fetchBuffer(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'NimbusBot/1.0 (Discord weather bot)' },
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return Buffer.from(await res.arrayBuffer());
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

async function generateRadarImage(lat, lon) {
    const center = latLonToTile(lat, lon, ZOOM);
    const offset = Math.floor(GRID / 2);

    // 1. Ziskaj najnovsie RainViewer data
    let radarPath;
    try {
        const apiRes = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const apiData = await apiRes.json();
        const past = apiData.radar?.past;
        if (past?.length > 0) {
            radarPath = past[past.length - 1].path;
        }
    } catch (err) {
        console.error('[RADAR] API error:', err.message);
    }

    // 2. Stiahni tiles — map + radar overlay
    const composites = [];

    for (let dy = 0; dy < GRID; dy++) {
        for (let dx = 0; dx < GRID; dx++) {
            const tx = center.x - offset + dx;
            const ty = center.y - offset + dy;
            const left = dx * TILE_SIZE;
            const top = dy * TILE_SIZE;

            // OpenStreetMap podklad
            try {
                const mapUrl = `https://tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`;
                const mapBuf = await fetchBuffer(mapUrl);
                composites.push({ input: mapBuf, left, top });
            } catch (err) {
                console.error(`[RADAR] Map tile ${tx},${ty} failed:`, err.message);
            }

            // RainViewer radar overlay
            if (radarPath) {
                try {
                    const radarUrl = `https://tilecache.rainviewer.com${radarPath}/${TILE_SIZE}/${ZOOM}/${tx}/${ty}/2/1_1.png`;
                    const radarBuf = await fetchBuffer(radarUrl);
                    // Zvacsenie opacity cez sharp
                    composites.push({ input: radarBuf, left, top });
                } catch {
                    // Radar tile moze byt prazdny pre danu oblast — OK
                }
            }
        }
    }

    if (composites.length === 0) throw new Error('Ziadne tiles sa nepodarilo stiahnut');

    // 3. Zloz vsetko do jedneho obrazku
    const width = GRID * TILE_SIZE;
    const height = GRID * TILE_SIZE;

    const image = sharp({
        create: {
            width,
            height,
            channels: 4,
            background: { r: 30, g: 30, b: 30, alpha: 1 },
        },
    }).composite(composites).png();

    // 4. Uloz
    const filename = `radar_${Date.now()}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    await image.toFile(filepath);

    return filepath;
}

// Cistenie starych suborov (starsia ako 1h)
function cleanOldRadarImages() {
    if (!fs.existsSync(OUTPUT_DIR)) return;
    const now = Date.now();
    const files = fs.readdirSync(OUTPUT_DIR);
    for (const file of files) {
        if (!file.startsWith('radar_')) continue;
        const filepath = path.join(OUTPUT_DIR, file);
        const stat = fs.statSync(filepath);
        if (now - stat.mtimeMs > 60 * 60 * 1000) {
            fs.unlinkSync(filepath);
        }
    }
}

// Cistenie kazdu hodinu
setInterval(cleanOldRadarImages, 60 * 60 * 1000);
cleanOldRadarImages();

module.exports = { generateRadarImage };
