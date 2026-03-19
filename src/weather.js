const WMO_CODES = {
    0: { text: 'Jasno', textEn: 'Clear sky', emoji: '☀️', severity: 0 },
    1: { text: 'Prevažne jasno', textEn: 'Mainly clear', emoji: '🌤️', severity: 0 },
    2: { text: 'Polojasno', textEn: 'Partly cloudy', emoji: '⛅', severity: 0 },
    3: { text: 'Zamračené', textEn: 'Overcast', emoji: '☁️', severity: 1 },
    45: { text: 'Hmla', textEn: 'Fog', emoji: '🌫️', severity: 1 },
    48: { text: 'Námraza', textEn: 'Depositing rime fog', emoji: '🌫️', severity: 1 },
    51: { text: 'Slabé mrholenie', textEn: 'Light drizzle', emoji: '🌦️', severity: 1 },
    53: { text: 'Mierné mrholenie', textEn: 'Moderate drizzle', emoji: '🌦️', severity: 1 },
    55: { text: 'Silné mrholenie', textEn: 'Dense drizzle', emoji: '🌧️', severity: 2 },
    56: { text: 'Mrznúce mrholenie', textEn: 'Freezing drizzle', emoji: '🌧️', severity: 2 },
    57: { text: 'Silné mrznúce mrholenie', textEn: 'Dense freezing drizzle', emoji: '🌧️', severity: 2 },
    61: { text: 'Slabý dážď', textEn: 'Slight rain', emoji: '🌧️', severity: 1 },
    63: { text: 'Mierný dážď', textEn: 'Moderate rain', emoji: '🌧️', severity: 2 },
    65: { text: 'Silný dážď', textEn: 'Heavy rain', emoji: '🌧️', severity: 3 },
    66: { text: 'Mrznúci dážď', textEn: 'Freezing rain', emoji: '❄️🌧️', severity: 3 },
    67: { text: 'Silný mrznúci dážď', textEn: 'Heavy freezing rain', emoji: '❄️🌧️', severity: 3 },
    71: { text: 'Slabé sneženie', textEn: 'Slight snow', emoji: '🌨️', severity: 2 },
    73: { text: 'Mierné sneženie', textEn: 'Moderate snow', emoji: '🌨️', severity: 2 },
    75: { text: 'Silné sneženie', textEn: 'Heavy snow', emoji: '❄️', severity: 3 },
    77: { text: 'Snehové zrná', textEn: 'Snow grains', emoji: '❄️', severity: 2 },
    80: { text: 'Slabé prehánky', textEn: 'Slight showers', emoji: '🌦️', severity: 1 },
    81: { text: 'Mierné prehánky', textEn: 'Moderate showers', emoji: '🌧️', severity: 2 },
    82: { text: 'Silné prehánky', textEn: 'Violent showers', emoji: '🌧️', severity: 3 },
    85: { text: 'Slabé snehové prehánky', textEn: 'Slight snow showers', emoji: '🌨️', severity: 2 },
    86: { text: 'Silné snehové prehánky', textEn: 'Heavy snow showers', emoji: '❄️', severity: 3 },
    95: { text: 'Búrka', textEn: 'Thunderstorm', emoji: '⛈️', severity: 3 },
    96: { text: 'Búrka s krupobitím', textEn: 'Thunderstorm with hail', emoji: '⛈️🧊', severity: 4 },
    99: { text: 'Silná búrka s krupobitím', textEn: 'Thunderstorm with heavy hail', emoji: '⛈️🧊', severity: 4 },
};

function getWeatherInfo(code, lang = 'sk') {
    const info = WMO_CODES[code] || { text: 'Neznáme', textEn: 'Unknown', emoji: '❓', severity: 0 };
    return { text: lang === 'sk' ? info.text : info.textEn, emoji: info.emoji, severity: info.severity };
}

// ─── URL builder ───────────────────────────

function buildUrl(base, params) {
    const parts = [];
    for (const [key, val] of Object.entries(params)) {
        if (Array.isArray(val)) {
            parts.push(`${key}=${val.join(',')}`);
        } else {
            parts.push(`${key}=${encodeURIComponent(val)}`);
        }
    }
    return `${base}?${parts.join('&')}`;
}

async function fetchJson(url, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);

            if (!res.ok) {
                const body = await res.text().catch(() => '');
                if (res.status === 429 && attempt < retries) {
                    await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
                    continue;
                }
                throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
            }
            return res.json();
        } catch (err) {
            if (err.name === 'AbortError') {
                if (attempt < retries) { await new Promise(r => setTimeout(r, 1000)); continue; }
                throw new Error('API timeout — server neodpoveda');
            }
            if (attempt < retries && err.message?.includes('fetch failed')) {
                await new Promise(r => setTimeout(r, 1000));
                continue;
            }
            throw err;
        }
    }
}

function tz(timezone) {
    if (!timezone || timezone === 'null' || timezone === 'undefined') return 'auto';
    return timezone;
}

// ─── Geocoding ─────────────────────────────

async function geocode(cityName) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=5&language=sk`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
    const data = await res.json();
    return data.results || [];
}

// ─── Weather ───────────────────────────────

const CURRENT_VARS = [
    'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
    'is_day', 'precipitation', 'weather_code', 'cloud_cover',
    'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
    'surface_pressure',
];

const HOURLY_VARS = [
    'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
    'precipitation_probability', 'precipitation', 'weather_code',
    'cloud_cover', 'wind_speed_10m', 'wind_gusts_10m', 'is_day',
    'surface_pressure',
];

const DAILY_VARS_SHORT = [
    'weather_code', 'temperature_2m_max', 'temperature_2m_min',
    'apparent_temperature_max', 'apparent_temperature_min',
    'sunrise', 'sunset', 'precipitation_sum',
    'precipitation_probability_max', 'wind_speed_10m_max',
    'wind_gusts_10m_max', 'uv_index_max',
];

const DAILY_VARS_FULL = [
    'weather_code', 'temperature_2m_max', 'temperature_2m_min',
    'apparent_temperature_max', 'apparent_temperature_min',
    'sunrise', 'sunset', 'precipitation_sum',
    'precipitation_probability_max', 'wind_speed_10m_max',
    'wind_gusts_10m_max', 'uv_index_max',
];

async function getCurrentWeather(lat, lon, timezone = 'auto', units = {}) {
    const params = {
        latitude: String(lat), longitude: String(lon),
        current: CURRENT_VARS, timezone: tz(timezone),
    };
    if (units.temp === 'fahrenheit') params.temperature_unit = 'fahrenheit';
    if (units.wind === 'ms') params.wind_speed_unit = 'ms';
    if (units.wind === 'mph') params.wind_speed_unit = 'mph';
    return fetchJson(buildUrl('https://api.open-meteo.com/v1/forecast', params));
}

async function getHourlyForecast(lat, lon, timezone = 'auto', days = 1, units = {}) {
    const params = {
        latitude: String(lat), longitude: String(lon),
        hourly: HOURLY_VARS, daily: DAILY_VARS_SHORT,
        timezone: tz(timezone), forecast_days: String(Math.max(1, days)),
    };
    if (units.temp === 'fahrenheit') params.temperature_unit = 'fahrenheit';
    if (units.wind === 'ms') params.wind_speed_unit = 'ms';
    if (units.wind === 'mph') params.wind_speed_unit = 'mph';
    return fetchJson(buildUrl('https://api.open-meteo.com/v1/forecast', params));
}

async function getDailyForecast(lat, lon, timezone = 'auto', days = 7, units = {}) {
    const params = {
        latitude: String(lat), longitude: String(lon),
        daily: DAILY_VARS_FULL, timezone: tz(timezone),
        forecast_days: String(Math.min(Math.max(1, days), 16)),
    };
    if (units.temp === 'fahrenheit') params.temperature_unit = 'fahrenheit';
    if (units.wind === 'ms') params.wind_speed_unit = 'ms';
    if (units.wind === 'mph') params.wind_speed_unit = 'mph';
    return fetchJson(buildUrl('https://api.open-meteo.com/v1/forecast', params));
}

// ─── Air Quality ───────────────────────────

async function getAirQuality(lat, lon, timezone = 'auto') {
    return fetchJson(buildUrl('https://air-quality-api.open-meteo.com/v1/air-quality', {
        latitude: String(lat), longitude: String(lon),
        current: ['european_aqi', 'pm10', 'pm2_5', 'nitrogen_dioxide', 'ozone', 'sulphur_dioxide'],
        timezone: tz(timezone),
    }));
}

function getAqiInfo(aqi) {
    if (aqi == null) return { text: 'Nedostupné', emoji: '❓', color: 0x95A5A6 };
    if (aqi <= 20) return { text: 'Výborná', emoji: '🟢', color: 0x57F287 };
    if (aqi <= 40) return { text: 'Dobrá', emoji: '🟡', color: 0xFEE75C };
    if (aqi <= 60) return { text: 'Stredná', emoji: '🟠', color: 0xF39C12 };
    if (aqi <= 80) return { text: 'Zlá', emoji: '🔴', color: 0xED4245 };
    if (aqi <= 100) return { text: 'Veľmi zlá', emoji: '🟤', color: 0x992D22 };
    return { text: 'Nebezpečná', emoji: '⚫', color: 0x2C2F33 };
}

// ─── Radar URL ─────────────────────────────

function getRadarUrl(lat, lon, zoom = 8) {
    // RainViewer free API — animated radar tiles
    return `https://www.rainviewer.com/map.html?loc=${lat},${lon},${zoom}&oFa=1&oC=1&oU=1&oCS=1&oF=0&oAP=1&c=1&o=83&lm=1&layer=radar&sm=1&sn=1`;
}

function getRadarImageUrl(lat, lon) {
    // Static radar image from OpenWeatherMap free tier alternative
    // Používame RainViewer tile API — posledný radar frame
    return `https://tilecache.rainviewer.com/v2/radar/nowcast/256/${Math.floor(lat)}/${Math.floor(lon)}/2/1_1.png`;
}

// Ikony z open-meteo/openweathermap free icon set
const WMO_ICONS = {
    0: { day: 'https://openweathermap.org/img/wn/01d@2x.png', night: 'https://openweathermap.org/img/wn/01n@2x.png' },
    1: { day: 'https://openweathermap.org/img/wn/02d@2x.png', night: 'https://openweathermap.org/img/wn/02n@2x.png' },
    2: { day: 'https://openweathermap.org/img/wn/03d@2x.png', night: 'https://openweathermap.org/img/wn/03n@2x.png' },
    3: { day: 'https://openweathermap.org/img/wn/04d@2x.png', night: 'https://openweathermap.org/img/wn/04n@2x.png' },
    45: { day: 'https://openweathermap.org/img/wn/50d@2x.png', night: 'https://openweathermap.org/img/wn/50n@2x.png' },
    48: { day: 'https://openweathermap.org/img/wn/50d@2x.png', night: 'https://openweathermap.org/img/wn/50n@2x.png' },
    51: { day: 'https://openweathermap.org/img/wn/09d@2x.png', night: 'https://openweathermap.org/img/wn/09n@2x.png' },
    53: { day: 'https://openweathermap.org/img/wn/09d@2x.png', night: 'https://openweathermap.org/img/wn/09n@2x.png' },
    55: { day: 'https://openweathermap.org/img/wn/09d@2x.png', night: 'https://openweathermap.org/img/wn/09n@2x.png' },
    61: { day: 'https://openweathermap.org/img/wn/10d@2x.png', night: 'https://openweathermap.org/img/wn/10n@2x.png' },
    63: { day: 'https://openweathermap.org/img/wn/10d@2x.png', night: 'https://openweathermap.org/img/wn/10n@2x.png' },
    65: { day: 'https://openweathermap.org/img/wn/10d@2x.png', night: 'https://openweathermap.org/img/wn/10n@2x.png' },
    71: { day: 'https://openweathermap.org/img/wn/13d@2x.png', night: 'https://openweathermap.org/img/wn/13n@2x.png' },
    73: { day: 'https://openweathermap.org/img/wn/13d@2x.png', night: 'https://openweathermap.org/img/wn/13n@2x.png' },
    75: { day: 'https://openweathermap.org/img/wn/13d@2x.png', night: 'https://openweathermap.org/img/wn/13n@2x.png' },
    80: { day: 'https://openweathermap.org/img/wn/09d@2x.png', night: 'https://openweathermap.org/img/wn/09n@2x.png' },
    81: { day: 'https://openweathermap.org/img/wn/09d@2x.png', night: 'https://openweathermap.org/img/wn/09n@2x.png' },
    82: { day: 'https://openweathermap.org/img/wn/09d@2x.png', night: 'https://openweathermap.org/img/wn/09n@2x.png' },
    95: { day: 'https://openweathermap.org/img/wn/11d@2x.png', night: 'https://openweathermap.org/img/wn/11n@2x.png' },
    96: { day: 'https://openweathermap.org/img/wn/11d@2x.png', night: 'https://openweathermap.org/img/wn/11n@2x.png' },
    99: { day: 'https://openweathermap.org/img/wn/11d@2x.png', night: 'https://openweathermap.org/img/wn/11n@2x.png' },
};

// Animated GIF weather icons (free meteocons set)
const WEATHER_GIFS = {
    0: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/clear-day.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/clear-night.svg' },
    1: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/partly-cloudy-day.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/partly-cloudy-night.svg' },
    2: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/partly-cloudy-day.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/partly-cloudy-night.svg' },
    3: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/overcast.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/overcast.svg' },
    45: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/fog.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/fog.svg' },
    48: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/fog.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/fog.svg' },
    51: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/drizzle.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/drizzle.svg' },
    53: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/drizzle.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/drizzle.svg' },
    55: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/drizzle.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/drizzle.svg' },
    61: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/rain.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/rain.svg' },
    63: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/rain.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/rain.svg' },
    65: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/rain.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/rain.svg' },
    71: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/snow.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/snow.svg' },
    73: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/snow.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/snow.svg' },
    75: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/snow.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/snow.svg' },
    80: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/partly-cloudy-day-rain.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/partly-cloudy-night-rain.svg' },
    81: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/partly-cloudy-day-rain.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/partly-cloudy-night-rain.svg' },
    82: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/partly-cloudy-day-rain.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/partly-cloudy-night-rain.svg' },
    95: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/thunderstorms-rain.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/thunderstorms-rain.svg' },
    96: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/thunderstorms-rain.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/thunderstorms-rain.svg' },
    99: { day: 'https://basmilius.github.io/weather-icons/production/fill/all/thunderstorms-rain.svg', night: 'https://basmilius.github.io/weather-icons/production/fill/all/thunderstorms-rain.svg' },
};

function getWeatherIcon(code, isDay = true) {
    const icons = WMO_ICONS[code] || WMO_ICONS[0];
    return isDay ? icons.day : icons.night;
}

function getWeatherGif(code, isDay = true) {
    const gifs = WEATHER_GIFS[code] || WEATHER_GIFS[0];
    return isDay ? gifs.day : gifs.night;
}

// ─── "Kedy bude pekne?" ───────────────────

function findNiceDays(dailyData, maxDays = 16) {
    const d = dailyData.daily;
    const results = [];
    const dayNames = ['Nedeľa','Pondelok','Utorok','Streda','Štvrtok','Piatok','Sobota'];

    for (let i = 0; i < Math.min(d.time.length, maxDays); i++) {
        const code = d.weather_code?.[i] ?? 99;
        const precip = d.precipitation_probability_max?.[i] ?? 100;
        // "Pekne" = jasno/polojasno (code 0-2) a pravdepodobnosť zrážok < 20%
        if (code <= 2 && precip < 20) {
            const date = new Date(d.time[i] + 'T12:00:00');
            results.push({
                date: d.time[i],
                dayName: dayNames[date.getDay()],
                dateStr: `${date.getDate()}.${date.getMonth()+1}.`,
                tMax: d.temperature_2m_max?.[i] ?? '?',
                tMin: d.temperature_2m_min?.[i] ?? '?',
                code,
                precip,
            });
        }
    }
    return results;
}

function getWindDirection(degrees) {
    const dirs = ['S', 'SSV', 'SV', 'VSV', 'V', 'VSZ', 'SZ', 'SSZ', 'S', 'SJV', 'JV', 'VJV', 'V', 'VJZ', 'JZ', 'SJZ'];
    const index = Math.round(degrees / 22.5) % 16;
    return { sk: dirs[index] || '?' };
}

// ─── Tlak vzduchu ─────────────────────────

function getPressureInfo(pressure, hourlyData) {
    if (pressure == null) return null;
    const hpa = Math.round(pressure);
    let trend = '';
    let trendEmoji = '➡️';

    // Trend z hodinovych dat — porovnaj posledne 3 hodiny
    if (hourlyData?.hourly?.surface_pressure) {
        const p = hourlyData.hourly.surface_pressure;
        const len = p.length;
        if (len >= 3) {
            const recent = p[len - 1];
            const older = p[len - 3];
            if (recent != null && older != null) {
                const diff = recent - older;
                if (diff > 1.5) { trend = 'stupa'; trendEmoji = '📈'; }
                else if (diff < -1.5) { trend = 'klesa'; trendEmoji = '📉'; }
                else { trend = 'stabilny'; trendEmoji = '➡️'; }
            }
        }
    }

    return { hpa, trend, trendEmoji };
}

// ─── UV Index ──────────────────────────────

function getUvInfo(uv) {
    if (uv == null) return null;
    const rounded = Math.round(uv * 10) / 10;
    if (rounded <= 2) return { level: rounded, text: 'Nizky', emoji: '🟢', advice: 'Bez obav', bar: '░░░░░░░░░░' };
    if (rounded <= 5) return { level: rounded, text: 'Stredny', emoji: '🟡', advice: 'Okuliare, krem SPF 30+', bar: '▓▓▓░░░░░░░' };
    if (rounded <= 7) return { level: rounded, text: 'Vysoky', emoji: '🟠', advice: 'Krem SPF 50, okuliare, klobuk', bar: '▓▓▓▓▓▓░░░░' };
    if (rounded <= 10) return { level: rounded, text: 'Velmi vysoky', emoji: '🔴', advice: 'Vyhni sa slnku 11-15h, SPF 50+', bar: '▓▓▓▓▓▓▓▓░░' };
    return { level: rounded, text: 'Extremny', emoji: '⚫', advice: 'Nechod von! Nebezpecne UV', bar: '▓▓▓▓▓▓▓▓▓▓' };
}

// ─── Lunarny kalendar ──────────────────────

function getMoonPhase(date = new Date()) {
    // Algoritmus na výpočet fázy mesiaca (Conwayho metóda)
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let c = Math.floor(year / 100);
    let y = year - 19 * Math.floor(year / 19);
    let k = Math.floor((c - 17) / 25);
    let i = c - Math.floor(c / 4) - Math.floor((c - k) / 3) + 19 * y + 15;
    i = i - 30 * Math.floor(i / 30);
    i = i - Math.floor(i / 28) * (1 - Math.floor(i / 28) * Math.floor(29 / (i + 1)) * Math.floor((21 - y) / 11));
    let j = year + Math.floor(year / 4) + i + 2 - c + Math.floor(c / 4);
    j = j - 7 * Math.floor(j / 7);
    let l = i - j;
    let moonDay = day + l + 1;
    moonDay = ((moonDay % 30) + 30) % 30;

    // Simplified: use synodic month calculation
    const known = new Date(2000, 0, 6, 18, 14); // Known new moon
    const diff = date.getTime() - known.getTime();
    const synodicMonth = 29.53058867;
    const daysSinceNew = (diff / 86400000) % synodicMonth;
    const phase = ((daysSinceNew % synodicMonth) + synodicMonth) % synodicMonth;
    const pct = Math.round((phase / synodicMonth) * 100);

    let name, emoji;
    if (phase < 1.85) { name = 'Nov'; emoji = '🌑'; }
    else if (phase < 7.38) { name = 'Dorastajúci kosáčik'; emoji = '🌒'; }
    else if (phase < 9.23) { name = 'Prvá štvrť'; emoji = '🌓'; }
    else if (phase < 14.77) { name = 'Dorastajúci mesiac'; emoji = '🌔'; }
    else if (phase < 16.61) { name = 'Spln'; emoji = '🌕'; }
    else if (phase < 22.15) { name = 'Ubúdajúci mesiac'; emoji = '🌖'; }
    else if (phase < 23.99) { name = 'Posledná štvrť'; emoji = '🌗'; }
    else if (phase < 27.68) { name = 'Ubúdajúci kosáčik'; emoji = '🌘'; }
    else { name = 'Nov'; emoji = '🌑'; }

    return { name, emoji, phase: pct, daysSinceNew: Math.round(phase), synodicDay: Math.round(phase) };
}

function getLunarCalendar(days = 14) {
    const results = [];
    const dayNames = ['Ne','Po','Ut','St','Št','Pi','So'];
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const moon = getMoonPhase(d);
        const dn = dayNames[d.getDay()];
        const dateStr = `${d.getDate()}.${d.getMonth()+1}.`;
        results.push({ ...moon, dayName: dn, dateStr, date: d });
    }
    return results;
}

// ─── Outfit odporúčanie ────────────────────

function getOutfitAdvice(currentData, dailyData) {
    const c = currentData?.current || {};
    const d = dailyData?.daily || {};
    const temp = c.temperature_2m ?? d.temperature_2m_max?.[0] ?? 15;
    const feelsLike = c.apparent_temperature ?? temp;
    const rain = d.precipitation_probability_max?.[0] ?? 0;
    const wind = c.wind_speed_10m ?? d.wind_speed_10m_max?.[0] ?? 0;
    const code = c.weather_code ?? d.weather_code?.[0] ?? 0;
    const info = getWeatherInfo(code);

    // Random pick helper
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const layers = [];
    const accessories = [];
    let footwear = '';
    let emoji = '';
    let tip = '';

    // Oblecenie podla teploty
    if (feelsLike < -10) {
        layers.push('🧥 Zimna bunda (hruba)');
        layers.push('🧣 Sal + ciapka + rukavice');
        layers.push('👕 Termobielizen + sveter');
        emoji = '🥶';
    } else if (feelsLike < 0) {
        layers.push('🧥 Zimna bunda');
        layers.push('🧣 Sal a ciapka');
        layers.push('👕 Sveter / hruba mikina');
        emoji = '❄️';
    } else if (feelsLike < 10) {
        layers.push('🧥 Prechodna bunda');
        layers.push('👕 Mikina / sveter');
        emoji = '🍂';
    } else if (feelsLike < 18) {
        layers.push('🧥 Lahka bunda / mikina');
        layers.push('👕 Tricko s dlhym rukavom');
        emoji = '🌤️';
    } else if (feelsLike < 25) {
        layers.push('👕 Tricko');
        layers.push('👖 Lahke nohavice');
        emoji = '☀️';
    } else if (feelsLike < 33) {
        layers.push('👕 Tricko / tielko');
        layers.push('🩳 Kratasy');
        emoji = '🥵';
    } else {
        layers.push('👕 Co najmenej oblecenia');
        layers.push('🩳 Kratasy');
        emoji = '🔥';
    }

    // Dazd
    if (rain > 60) {
        accessories.push('☂️ Dazdnik urcite!');
        footwear = '👢 Nepremokava obuv';
    } else if (rain > 30) {
        accessories.push('☂️ Zober si dazdnik pre istotu');
    }

    // Vietor
    if (wind > 40) {
        accessories.push('💨 Vetrovka nutna!');
    } else if (wind > 25) {
        accessories.push('💨 Vetrovka by sa hodila');
    }

    // Sneh
    if ([71,73,75,77,85,86].includes(code)) {
        footwear = '👢 Zimna obuv';
        accessories.push('🧤 Rukavice');
    }

    // UV — okuliare a krem az od UV 6+
    const uvMax = d.uv_index_max?.[0];
    const uvInfo = uvMax != null ? getUvInfo(uvMax) : null;

    if (uvInfo && uvMax >= 6) {
        accessories.push('🕶️ Slnecne okuliare');
        accessories.push(`🧴 Opalovaci krem SPF 50+ (UV ${uvInfo.level})`);
        accessories.push('🧢 Siltovka / klobuk');
    } else if (uvInfo && uvMax >= 8) {
        accessories.push('🕶️ Slnecne okuliare');
        accessories.push(`🧴 SPF 50+ — vyhni sa slnku 11-15h`);
        accessories.push('🧢 Klobuk');
    }

    if (!footwear) {
        if (feelsLike < 5) footwear = '👢 Zateplena obuv';
        else if (feelsLike < 18) footwear = '👟 Tenisky';
        else footwear = '👟 Tenisky / sandale';
    }

    return { layers, accessories, footwear, emoji, tip, temp: Math.round(temp), feelsLike: Math.round(feelsLike), rain, wind: Math.round(wind) };
}

// ─── Dopravné varovanie ────────────────────

function getTrafficWarnings(currentData, hourlyData) {
    const c = currentData?.current || {};
    const h = hourlyData?.hourly || {};
    const warnings = [];

    const temp = c.temperature_2m ?? 5;
    const wind = c.wind_speed_10m ?? 0;
    const gusts = c.wind_gusts_10m ?? 0;
    const code = c.weather_code ?? 0;
    const visibility = 10000; // default OK
    const humidity = c.relative_humidity_2m ?? 50;

    // Námraza
    if (temp <= 2 && temp >= -5 && humidity > 80) {
        warnings.push({ level: 3, emoji: '🧊', title: 'Námraza na cestách', desc: `Teplota ${temp}°C s vlhkosťou ${humidity}% — pozor na námrazu!` });
    } else if (temp <= 0) {
        warnings.push({ level: 2, emoji: '❄️', title: 'Mráz', desc: `Teplota ${temp}°C — cesty môžu byť šmykľavé` });
    }

    // Hmla
    if ([45, 48].includes(code)) {
        warnings.push({ level: 2, emoji: '🌫️', title: 'Hmla', desc: 'Znížená viditeľnosť — jazdi opatrne, zapni hmlové svetlá' });
    }

    // Silný vietor
    if (gusts > 70) {
        warnings.push({ level: 3, emoji: '🌪️', title: 'Extrémny vietor', desc: `Nárazy až ${gusts} km/h — nebezpečné pre vysoké vozidlá!` });
    } else if (gusts > 50) {
        warnings.push({ level: 2, emoji: '💨', title: 'Silný vietor', desc: `Nárazy ${gusts} km/h — opatrne na mostoch a otvorených úsekoch` });
    }

    // Silný dážď
    if ([65, 67, 82].includes(code)) {
        warnings.push({ level: 2, emoji: '🌧️', title: 'Silný dážď', desc: 'Aquaplaning riziko — znížte rýchlosť' });
    }

    // Búrka
    if ([95, 96, 99].includes(code)) {
        warnings.push({ level: 3, emoji: '⛈️', title: 'Búrka', desc: 'Nebezpečné podmienky — ak nemusíte, necestujte!' });
    }

    // Sneženie
    if ([73, 75, 86].includes(code)) {
        warnings.push({ level: 2, emoji: '🌨️', title: 'Sneženie', desc: 'Znížená viditeľnosť a šmykľavé cesty' });
    }

    // Ranné hodiny — check či bude námraza ráno
    if (h?.time && h?.temperature_2m) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
        for (let i = 0; i < h.time.length; i++) {
            if (!h.time[i]?.startsWith(tomorrowStr)) continue;
            const hr = new Date(h.time[i]).getHours();
            if (hr >= 5 && hr <= 8 && (h.temperature_2m[i] ?? 5) <= 1) {
                warnings.push({ level: 1, emoji: '🌅', title: 'Ranná námraza zajtra', desc: `Okolo ${hr}:00 očakávaná teplota ${h.temperature_2m[i]}°C — cesty ráno šmykľavé` });
                break;
            }
        }
    }

    // Zoradiť podľa severity
    warnings.sort((a, b) => b.level - a.level);
    return warnings;
}

// ─── Historicke porovnanie ─────────────────

async function getHistoricalComparison(lat, lon, timezone = 'auto') {
    // Porovnaj dnesnu teplotu s priemerom za poslednych 5 rokov na tento den
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const years = [];
    for (let y = now.getFullYear() - 5; y < now.getFullYear(); y++) {
        years.push(y);
    }

    try {
        const results = [];
        for (const y of years) {
            const dateStr = `${y}-${month}-${day}`;
            const data = await fetchJson(buildUrl('https://archive-api.open-meteo.com/v1/archive', {
                latitude: String(lat), longitude: String(lon),
                start_date: dateStr, end_date: dateStr,
                daily: ['temperature_2m_max', 'temperature_2m_min'],
                timezone: tz(timezone),
            }));
            if (data?.daily?.temperature_2m_max?.[0] != null) {
                results.push({
                    year: y,
                    max: data.daily.temperature_2m_max[0],
                    min: data.daily.temperature_2m_min[0],
                });
            }
        }

        if (results.length === 0) return null;

        const avgMax = Math.round((results.reduce((s, r) => s + r.max, 0) / results.length) * 10) / 10;
        const avgMin = Math.round((results.reduce((s, r) => s + r.min, 0) / results.length) * 10) / 10;

        return { avgMax, avgMin, years: results, count: results.length };
    } catch {
        return null;
    }
}

module.exports = {
    WMO_CODES, getWeatherInfo, getWeatherIcon, getWeatherGif, geocode,
    getCurrentWeather, getHourlyForecast, getDailyForecast,
    getAirQuality, getAqiInfo, getUvInfo, getPressureInfo,
    getRadarUrl, getRadarImageUrl, getWindDirection, findNiceDays,
    getMoonPhase, getLunarCalendar, getOutfitAdvice, getTrafficWarnings,
    getHistoricalComparison,
};
