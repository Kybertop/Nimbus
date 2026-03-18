/* ═══════════════════════════════════════════════════════════
   NIMBUS Web Panel — app.js
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ── Config ──────────────────────────────────────────────────
const API_BASE = '/api';

// ── WMO weather codes ────────────────────────────────────────
const WMO = {
    0:  { text: 'Clear sky',           emoji: '☀️',    severity: 0 },
    1:  { text: 'Mainly clear',        emoji: '🌤️',   severity: 0 },
    2:  { text: 'Partly cloudy',       emoji: '⛅',    severity: 0 },
    3:  { text: 'Overcast',            emoji: '☁️',    severity: 1 },
    45: { text: 'Fog',                 emoji: '🌫️',   severity: 1 },
    48: { text: 'Rime fog',            emoji: '🌫️',   severity: 1 },
    51: { text: 'Light drizzle',       emoji: '🌦️',   severity: 1 },
    53: { text: 'Moderate drizzle',    emoji: '🌦️',   severity: 1 },
    55: { text: 'Dense drizzle',       emoji: '🌧️',   severity: 2 },
    56: { text: 'Freezing drizzle',    emoji: '🌧️',   severity: 2 },
    57: { text: 'Dense freezing drizzle', emoji: '🌧️', severity: 2 },
    61: { text: 'Slight rain',         emoji: '🌧️',   severity: 1 },
    63: { text: 'Moderate rain',       emoji: '🌧️',   severity: 2 },
    65: { text: 'Heavy rain',          emoji: '🌧️',   severity: 3 },
    66: { text: 'Freezing rain',       emoji: '❄️🌧️', severity: 3 },
    67: { text: 'Heavy freezing rain', emoji: '❄️🌧️', severity: 3 },
    71: { text: 'Slight snow',         emoji: '🌨️',   severity: 2 },
    73: { text: 'Moderate snow',       emoji: '🌨️',   severity: 2 },
    75: { text: 'Heavy snow',          emoji: '❄️',    severity: 3 },
    77: { text: 'Snow grains',         emoji: '❄️',    severity: 2 },
    80: { text: 'Slight showers',      emoji: '🌦️',   severity: 1 },
    81: { text: 'Moderate showers',    emoji: '🌧️',   severity: 2 },
    82: { text: 'Violent showers',     emoji: '🌧️',   severity: 3 },
    85: { text: 'Slight snow showers', emoji: '🌨️',   severity: 2 },
    86: { text: 'Heavy snow showers',  emoji: '❄️',    severity: 3 },
    95: { text: 'Thunderstorm',        emoji: '⛈️',   severity: 3 },
    96: { text: 'Thunderstorm + hail', emoji: '⛈️🧊',  severity: 4 },
    99: { text: 'Severe thunderstorm', emoji: '⛈️🧊',  severity: 4 },
};

const WMO_SK = {
    0:'Jasno', 1:'Prevažne jasno', 2:'Polojasno', 3:'Zamračené',
    45:'Hmla', 48:'Námraza',
    51:'Slabé mrholenie', 53:'Mierné mrholenie', 55:'Silné mrholenie',
    56:'Mrznúce mrholenie', 57:'Silné mrznúce mrholenie',
    61:'Slabý dážď', 63:'Mierny dážď', 65:'Silný dážď',
    66:'Mrznúci dážď', 67:'Silný mrznúci dážď',
    71:'Slabé sneženie', 73:'Mierné sneženie', 75:'Silné sneženie', 77:'Snehové zrná',
    80:'Slabé prehánky', 81:'Mierné prehánky', 82:'Silné prehánky',
    85:'Slabé snehové prehánky', 86:'Silné snehové prehánky',
    95:'Búrka', 96:'Búrka s krupobitím', 99:'Silná búrka s krupobitím',
};

function wmoText(code) {
    return WMO_SK[code] ?? WMO[code]?.text ?? 'Neznáme';
}

// ── State ───────────────────────────────────────────────────
let state = {
    lat: null,
    lon: null,
    tz: 'auto',
    city: null,
    weatherCode: 0,
    isDay: 1,
    currentUserData: null,
    // Auth — populated by /auth/me on load
    discordUser: null,
};

// ── DOM refs ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const els = {
    sky:            $('sky'),
    skyGradient:    $('skyGradient'),
    stars:          $('stars'),
    sunContainer:   $('sunContainer'),
    moonContainer:  $('moonContainer'),
    cloudsLayer:         $('cloudsLayer'),
    lightning:           $('lightning'),
    horizonGlow:         $('horizonGlow'),
    headerTime:          $('headerTime'),
    weatherLoading:      $('weatherLoading'),
    weatherData:         $('weatherData'),
    weatherIconBig:      $('weatherIconBig'),
    weatherTemp:         $('weatherTemp'),
    weatherDesc:         $('weatherDesc'),
    weatherCity:         $('weatherCity'),
    detailHumidity:      $('detailHumidity'),
    detailWind:          $('detailWind'),
    detailFeels:         $('detailFeels'),
    detailCloud:         $('detailCloud'),
    cityInput:           $('cityInput'),
    searchBtn:           $('searchBtn'),
    cityResults:         $('cityResults'),
    // Auth
    authLogin:           $('authLogin'),
    authUser:            $('authUser'),
    authError:           $('authError'),
    userAvatar:          $('userAvatar'),
    userName:            $('userName'),
    userTag:             $('userTag'),
    logoutBtn:           $('logoutBtn'),
    userConfig:          $('userConfig'),
    tempToggle:          $('tempToggle'),
    windToggle:          $('windToggle'),
    // Favourites
    favList:             $('favList'),
    addFavBtn:           $('addFavBtn'),
    addFavForm:          $('addFavForm'),
    favCityInput:        $('favCityInput'),
    favSearchBtn:        $('favSearchBtn'),
    favCityResults:      $('favCityResults'),
    cancelFavBtn:        $('cancelFavBtn'),
    // Notifications
    notifList:           $('notifList'),
    addNotifBtn:         $('addNotifBtn'),
    addNotifForm:        $('addNotifForm'),
    // Wizard steps
    wizStep1:            $('wizStep1'),
    notifTypeGrid:       $('notifTypeGrid'),
    cancelNotifBtn:      $('cancelNotifBtn'),
    wizStep2Mode:        $('wizStep2Mode'),
    wizStep2ModeTitle:   $('wizStep2ModeTitle'),
    modeTimedBtn:        $('modeTimedBtn'),
    modeInstantBtn:      $('modeInstantBtn'),
    timeInputRow:        $('timeInputRow'),
    notifTime:           $('notifTime'),
    saveNotifBtn:        $('saveNotifBtn'),
    wizBackBtn2Mode:     $('wizBackBtn2Mode'),
    wizStep2Instant:     $('wizStep2Instant'),
    wizStep2InstantTitle:$('wizStep2InstantTitle'),
    saveNotifInstantBtn: $('saveNotifInstantBtn'),
    wizBackBtn2Instant:  $('wizBackBtn2Instant'),
    wizStep2Offset:      $('wizStep2Offset'),
    wizStep2OffsetTitle: $('wizStep2OffsetTitle'),
    offsetToggle:        $('offsetToggle'),
    saveNotifOffsetBtn:  $('saveNotifOffsetBtn'),
    wizBackBtn2Offset:   $('wizBackBtn2Offset'),
    wizStep2Changes:     $('wizStep2Changes'),
    changeGrid:          $('changeGrid'),
    channelPickerMode:   $('channelPickerMode'),
    channelPickerInstant:$('channelPickerInstant'),
    channelPickerOffset: $('channelPickerOffset'),
    channelPickerChanges:$('channelPickerChanges'),
    saveNotifChangesBtn: $('saveNotifChangesBtn'),
    wizBackBtn2Changes:  $('wizBackBtn2Changes'),
    // Settings
    saveSettingsBtn:     $('saveSettingsBtn'),
    deleteUserBtn:       $('deleteUserBtn'),
    saveStatus:          $('saveStatus'),
    modalOverlay:        $('modalOverlay'),
};

// ═══════════════════════════════════════════════════════════
//  SKY SCENE ENGINE
// ═══════════════════════════════════════════════════════════

function getSkyPhase(hour) {
    if (hour >= 5  && hour < 7)  return 'dawn';
    if (hour >= 7  && hour < 10) return 'morning';
    if (hour >= 10 && hour < 16) return 'day';
    if (hour >= 16 && hour < 19) return 'evening';
    if (hour >= 19 && hour < 21) return 'dusk';
    return 'night';
}

const SKY_GRADIENTS = {
    dawn:    'linear-gradient(180deg, #1a1a4e 0%, #4a2060 20%, #c0506a 45%, #f0905a 65%, #ffd080 85%, #ffe8a0 100%)',
    morning: 'linear-gradient(180deg, #1a6abf 0%, #4da8e8 30%, #7dc8f8 60%, #aadcf8 80%, #d0eefa 100%)',
    day:     'linear-gradient(180deg, #1565c0 0%, #1e88e5 25%, #42a5f5 55%, #90caf9 80%, #bbdefb 100%)',
    evening: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 20%, #e65100 55%, #ff8f00 75%, #ffca28 100%)',
    dusk:    'linear-gradient(180deg, #0d0d30 0%, #1a1040 25%, #6a2050 50%, #c05040 70%, #e08050 100%)',
    night:   'linear-gradient(180deg, #020410 0%, #060820 30%, #0a0d30 60%, #0f1540 100%)',

    // Overcast / grey skies — still time-aware but all colour is drained
    overcast_day:     'linear-gradient(180deg, #2e3440 0%, #3d4555 30%, #5a6275 60%, #7a8290 85%, #9aa0a8 100%)',
    overcast_morning: 'linear-gradient(180deg, #2a3040 0%, #3a4256 30%, #525e70 60%, #707880 85%, #8e9498 100%)',
    overcast_evening: 'linear-gradient(180deg, #1e2030 0%, #2e2e40 30%, #484050 60%, #605860 85%, #786870 100%)',
    overcast_night:   'linear-gradient(180deg, #0a0c14 0%, #101420 30%, #181c28 60%, #202430 100%)',

    // Rain — darker, wetter, more blue-grey
    rain_day:     'linear-gradient(180deg, #1a2030 0%, #252e40 25%, #364050 55%, #4a5560 80%, #5e6a72 100%)',
    rain_morning: 'linear-gradient(180deg, #161e2c 0%, #202838 25%, #303a4a 55%, #424e58 80%, #525e66 100%)',
    rain_evening: 'linear-gradient(180deg, #101520 0%, #1a1e2c 25%, #282838 55%, #363040 80%, #443840 100%)',
    rain_night:   'linear-gradient(180deg, #060810 0%, #0c1018 25%, #121620 55%, #181c26 100%)',

    // Snow — pale, desaturated, cold white-grey
    snow_day:     'linear-gradient(180deg, #3a4050 0%, #505868 30%, #6e7888 60%, #909aa4 85%, #b8c0c8 100%)',
    snow_morning: 'linear-gradient(180deg, #303844 0%, #464e5c 30%, #606876 60%, #808890 85%, #a8b0b8 100%)',
    snow_evening: 'linear-gradient(180deg, #252830 0%, #303440 30%, #424858 60%, #585e68 85%, #6e7478 100%)',
    snow_night:   'linear-gradient(180deg, #0c0e14 0%, #141820 30%, #1c2030 60%, #242830 100%)',

    // Storm — almost black, purple-grey bruising
    storm:        'linear-gradient(180deg, #080810 0%, #10101e 20%, #1a1826 40%, #222030 65%, #2e2a30 100%)',
};

const HORIZON_GLOWS = {
    dawn:             'linear-gradient(to top, rgba(240,144,90,0.6) 0%, transparent 100%)',
    morning:          'linear-gradient(to top, rgba(255,220,150,0.3) 0%, transparent 100%)',
    day:              'linear-gradient(to top, rgba(200,230,255,0.2) 0%, transparent 100%)',
    evening:          'linear-gradient(to top, rgba(255,120,40,0.5) 0%, transparent 100%)',
    dusk:             'linear-gradient(to top, rgba(180,80,60,0.4) 0%, transparent 100%)',
    night:            'linear-gradient(to top, rgba(20,40,100,0.3) 0%, transparent 100%)',
    overcast:         'linear-gradient(to top, rgba(80,90,100,0.2) 0%, transparent 100%)',
    rain:             'linear-gradient(to top, rgba(40,55,75,0.3) 0%, transparent 100%)',
    snow:             'linear-gradient(to top, rgba(160,170,180,0.25) 0%, transparent 100%)',
    storm:            'linear-gradient(to top, rgba(20,15,30,0.5) 0%, transparent 100%)',
};

// Sun position: 0 = top center, travels arc across sky
function getSunPosition(hour) {
    // Map 6am-8pm to arc. Outside = below horizon.
    const rise = 6, set = 20;
    if (hour < rise || hour > set) return null;
    const progress = (hour - rise) / (set - rise); // 0..1
    // Arc: x from left(10%) to right(90%), y peak at noon(15% from top)
    const x = 10 + progress * 80; // %
    const y = 65 - Math.sin(progress * Math.PI) * 50; // % from top
    return { x, y };
}

function getMoonPosition(hour) {
    // Moon rises ~8pm, sets ~6am
    const rise = 20, set = 6;
    let progress;
    if (hour >= rise) {
        progress = (hour - rise) / (24 - rise + set);
    } else if (hour <= set) {
        progress = (24 - rise + hour) / (24 - rise + set);
    } else {
        return null;
    }
    const x = 10 + progress * 80;
    const y = 65 - Math.sin(progress * Math.PI) * 45;
    return { x, y };
}

function updateSkyScene(weatherCode, isDay, hour) {
    const phase = getSkyPhase(hour);
    const info = WMO[weatherCode] || WMO[0];
    const severity = info.severity;

    const isRainCode  = [51,53,55,56,57,61,63,65,66,67,80,81,82].includes(weatherCode);
    const isSnowCode  = [71,73,75,77,85,86].includes(weatherCode);
    const isStorm     = [95,96,99].includes(weatherCode);
    const isOvercast  = [3,45,48].includes(weatherCode);
    const isDrizzle   = [51,53,55].includes(weatherCode);

    // Pick sky gradient — weather takes priority over time of day
    let gradient, horizonGlow;

    if (isStorm) {
        gradient    = SKY_GRADIENTS.storm;
        horizonGlow = HORIZON_GLOWS.storm;
    } else if (isSnowCode) {
        const timeKey = (phase === 'morning' || phase === 'dawn') ? 'snow_morning'
                      : (phase === 'evening' || phase === 'dusk') ? 'snow_evening'
                      : !isDay                                    ? 'snow_night'
                      : 'snow_day';
        gradient    = SKY_GRADIENTS[timeKey];
        horizonGlow = HORIZON_GLOWS.snow;
    } else if (isRainCode || isDrizzle) {
        const timeKey = (phase === 'morning' || phase === 'dawn') ? 'rain_morning'
                      : (phase === 'evening' || phase === 'dusk') ? 'rain_evening'
                      : !isDay                                    ? 'rain_night'
                      : 'rain_day';
        gradient    = SKY_GRADIENTS[timeKey];
        horizonGlow = HORIZON_GLOWS.rain;
    } else if (isOvercast || severity >= 1) {
        const timeKey = (phase === 'morning' || phase === 'dawn') ? 'overcast_morning'
                      : (phase === 'evening' || phase === 'dusk') ? 'overcast_evening'
                      : !isDay                                    ? 'overcast_night'
                      : 'overcast_day';
        gradient    = SKY_GRADIENTS[timeKey];
        horizonGlow = HORIZON_GLOWS.overcast;
    } else {
        // Clear/sunny — full time-of-day colours
        gradient    = SKY_GRADIENTS[phase];
        horizonGlow = HORIZON_GLOWS[phase] || HORIZON_GLOWS.day;
    }

    els.skyGradient.style.background = gradient;
    els.horizonGlow.style.background = horizonGlow;

    // Stars
    if (phase === 'night' || phase === 'dusk') {
        els.stars.style.opacity = '1';
    } else {
        els.stars.style.opacity = '0';
    }

    // Sun
    const sunPos = getSunPosition(hour);
    if (sunPos && isDay && severity < 3) {
        els.sunContainer.style.left = `${sunPos.x}%`;
        els.sunContainer.style.top  = `${sunPos.y}%`;
        els.sunContainer.style.opacity = '1';
        els.sunContainer.style.transform = 'translate(-50%, -50%)';
    } else {
        els.sunContainer.style.opacity = '0';
    }

    // Moon
    const moonPos = getMoonPosition(hour);
    if (moonPos && !isDay) {
        els.moonContainer.style.left = `${moonPos.x}%`;
        els.moonContainer.style.top  = `${moonPos.y}%`;
        els.moonContainer.style.opacity = '1';
    } else {
        els.moonContainer.style.opacity = '0';
    }

    // Clouds
    const cloudOpacity = getCloudinessForCode(weatherCode);
    els.cloudsLayer.querySelectorAll('.cloud').forEach((c, i) => {
        const opacity = Math.max(0, cloudOpacity - 0.1 * i);
        c.style.opacity = Math.min(1, opacity).toString();
        c.style.animationPlayState = opacity <= 0 ? 'paused' : 'running';
        if (severity >= 2) {
            c.querySelectorAll('.cloud-body, .cloud-puff').forEach(el => {
                el.style.background = severity >= 3
                    ? 'linear-gradient(180deg, #5a5a6a 0%, #3a3a4a 100%)'
                    : 'linear-gradient(180deg, #8a9aaa 0%, #6a7a8a 100%)';
            });
        } else {
            c.querySelectorAll('.cloud-body').forEach(el => { el.style.background = ''; });
            c.querySelectorAll('.cloud-puff').forEach(el => { el.style.background = ''; });
        }
    });


    // Rain
    const isRain = [51,53,55,56,57,61,63,65,66,67,80,81,82].includes(weatherCode);
    const isThunder = [95,96,99].includes(weatherCode);
    toggleRain(isRain || isThunder, severity);

    // Snow
    const isSnow = [71,73,75,77,85,86].includes(weatherCode);
    toggleSnow(isSnow);

    // Lightning
    if (isThunder) {
        startLightning();
    } else {
        stopLightning();
    }
}

function getCloudinessForCode(code) {
    if ([0, 1].includes(code)) return 0;
    if ([2].includes(code)) return 0.4;
    if ([3, 45, 48].includes(code)) return 0.9;
    if ([51,53].includes(code)) return 0.6;
    return 0.85;
}

// ── Central animation freeze manager ─────────────────────────
// Single timer per weather load — fires once, freezes everything
// Sky freeze — uses CSS animation iteration count trick
// Elements animate freely for 10s then hit their end state and stay there
// No JS timers fighting each other — pure CSS handles the freeze

function scheduleSkyFreeze() {
    // Nothing to do — the CSS handles it via animation-duration limits
    // Just clear any old frozen state on new weather load
    els.sky.classList.remove('sky-frozen');
    // Add the frozen class after 10s — purely for the static overlay
    clearTimeout(scheduleSkyFreeze._t);
    scheduleSkyFreeze._t = setTimeout(() => {
        if (rainDrops.length > 0) els.sky.classList.add('sky-rain-static');
        if (snowFlakes.length > 0) els.sky.classList.add('sky-snow-static');
    }, 10500);
}
scheduleSkyFreeze._t = null;

// ── Canvas weather system (rain + snow) ──────────────────────
let weatherCanvas = null;
let wCtx = null;

function _initCanvas() {
    if (wCtx) return true;
    weatherCanvas = document.getElementById('weatherCanvas');
    if (!weatherCanvas) return false;
    wCtx = weatherCanvas.getContext('2d');
    return !!wCtx;
}

let _wRafId = null;       // rAF handle
let _wParticles = [];     // active particles
let _wMode = null;        // 'rain' | 'snow' | null
let _wStartTime = null;   // when animation began
const W_DURATION = 10000; // animate for 10s then freeze

function _resizeCanvas() {
    if (!weatherCanvas) return;
    // Use getBoundingClientRect for actual rendered size — more reliable than offsetWidth
    const rect = weatherCanvas.getBoundingClientRect();
    weatherCanvas.width  = rect.width  || window.innerWidth;
    weatherCanvas.height = rect.height || window.innerHeight;
}

function _buildRainParticles(severity) {
    const count = severity >= 3 ? 120 : severity >= 2 ? 70 : 40;
    const W = weatherCanvas.width, H = weatherCanvas.height;
    _wParticles = Array.from({ length: count }, () => ({
        x:    Math.random() * W,
        y:    Math.random() * H,          // start scattered — looks natural when frozen
        len:  severity >= 3 ? 22 + Math.random() * 18 : 14 + Math.random() * 12,
        w:    severity >= 3 ? 2.5 + Math.random() * 1.5 : 1.5 + Math.random() * 1.5,
        spd:  severity >= 3 ? 900 + Math.random() * 400 : 600 + Math.random() * 300,
        op:   0.45 + Math.random() * 0.4,
        drift: -0.12,                      // slight diagonal
    }));
}

function _buildSnowParticles() {
    const count = 55;
    const W = weatherCanvas.width, H = weatherCanvas.height;
    _wParticles = Array.from({ length: count }, () => {
        const size = 3 + Math.random() * 6;
        return {
            x:    Math.random() * W,
            y:    Math.random() * H,
            size,
            spd:  40 + Math.random() * 60,
            drift: (Math.random() - 0.5) * 30,
            op:   0.6 + Math.random() * 0.4,
            angle: Math.random() * Math.PI * 2,
            spin:  (Math.random() - 0.5) * 1.5,
        };
    });
}

function _drawRain(dt) {
    const W = weatherCanvas.width, H = weatherCanvas.height;
    wCtx.clearRect(0, 0, W, H);
    for (const p of _wParticles) {
        p.y += p.spd * dt;
        p.x += p.drift * p.spd * dt;
        if (p.y > H + p.len) { p.y = -p.len; p.x = Math.random() * W; }
        wCtx.globalAlpha = p.op;
        wCtx.strokeStyle = 'rgba(180,215,255,1)';
        wCtx.lineWidth = p.w;
        wCtx.beginPath();
        wCtx.moveTo(p.x, p.y);
        wCtx.lineTo(p.x + p.drift * p.len * 0.8, p.y + p.len);
        wCtx.stroke();
    }
    wCtx.globalAlpha = 1;
}

function _drawSnow(dt) {
    const W = weatherCanvas.width, H = weatherCanvas.height;
    wCtx.clearRect(0, 0, W, H);
    for (const p of _wParticles) {
        p.y += p.spd * dt;
        p.x += Math.sin(p.angle) * p.drift * dt;
        p.angle += p.spin * dt;
        if (p.y > H + p.size) { p.y = -p.size; p.x = Math.random() * W; }
        wCtx.globalAlpha = p.op;
        wCtx.fillStyle = 'rgba(220,235,255,1)';
        wCtx.beginPath();
        wCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        wCtx.fill();
    }
    wCtx.globalAlpha = 1;
}

function _weatherLoop(ts) {
    if (!_wStartTime) _wStartTime = ts;
    const elapsed = ts - _wStartTime;
    const dt = Math.min(0.05, (ts - (_weatherLoop._last || ts)) / 1000);
    _weatherLoop._last = ts;

    if (_wMode === 'rain') _drawRain(dt);
    else if (_wMode === 'snow') _drawSnow(dt);

    if (elapsed < W_DURATION) {
        _wRafId = requestAnimationFrame(_weatherLoop);
    }
    // After W_DURATION: loop stops, canvas keeps last frame — perfectly frozen
}

function _stopWeather() {
    if (_wRafId) { cancelAnimationFrame(_wRafId); _wRafId = null; }
    _wMode = null;
    _wParticles = [];
    _wStartTime = null;
    _weatherLoop._last = null;
    if (wCtx && weatherCanvas) wCtx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
}

function toggleRain(active, severity = 1) {
    if (!active) { _stopWeather(); return; }
    if (_wMode === 'rain' && _wRafId) return;
    _stopWeather();
    if (!_initCanvas()) return;
    requestAnimationFrame(() => {
        _resizeCanvas();
        _wMode = 'rain';
        _buildRainParticles(severity);
        _wRafId = requestAnimationFrame(_weatherLoop);
    });
}

function toggleSnow(active) {
    if (!active) { _stopWeather(); return; }
    if (_wMode === 'snow' && _wRafId) return;
    _stopWeather();
    if (!_initCanvas()) return;
    requestAnimationFrame(() => {
        _resizeCanvas();
        _wMode = 'snow';
        _buildSnowParticles();
        _wRafId = requestAnimationFrame(_weatherLoop);
    });
}

// Resize canvas when window resizes (only if frozen — else next start handles it)
window.addEventListener('resize', () => {
    if (_wRafId === null && _wMode === null && wCtx) {
        _resizeCanvas();
    }
});

// ── Lightning system ──
let lightningInterval = null;

function startLightning() {
    if (lightningInterval) return;
    lightningInterval = setInterval(() => {
        if (Math.random() < 0.25) {
            doLightningFlash();
        }
    }, 2000);
}

function stopLightning() {
    if (lightningInterval) {
        clearInterval(lightningInterval);
        lightningInterval = null;
    }
    els.lightning.style.opacity = '0';
}

function doLightningFlash() {
    els.lightning.style.transition = 'none';
    els.lightning.style.opacity = '1';
    setTimeout(() => {
        els.lightning.style.transition = 'opacity 0.15s';
        els.lightning.style.opacity = '0';
        setTimeout(() => {
            if (Math.random() < 0.5) {
                setTimeout(() => {
                    els.lightning.style.opacity = '0.6';
                    setTimeout(() => { els.lightning.style.opacity = '0'; }, 80);
                }, 100);
            }
        }, 150);
    }, 60);
}

// ═══════════════════════════════════════════════════════════
//  CLOCK
// ═══════════════════════════════════════════════════════════

function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const str = `${h}:${m}:${s}`;
    // Only write to DOM if value changed
    if (els.headerTime.textContent !== str) els.headerTime.textContent = str;
}

let _clockRafId = null;
function startClock() {
    let lastSec = -1;
    function tick() {
        const s = new Date().getSeconds();
        if (s !== lastSec) { lastSec = s; updateClock(); }
        _clockRafId = requestAnimationFrame(tick);
    }
    tick();
}

// ═══════════════════════════════════════════════════════════
//  GEOLOCATION + WEATHER FETCH
// ═══════════════════════════════════════════════════════════

async function geocode(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
}

async function fetchWeather(lat, lon, tz = 'auto') {
    const vars = [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
        'is_day', 'precipitation', 'weather_code', 'cloud_cover',
        'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
    ].join(',');

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${vars}&timezone=${tz}`;
    const res = await fetch(url);
    return res.json();
}

async function loadWeather(lat, lon, tz, cityName) {
    state.lat = lat;
    state.lon = lon;
    state.tz  = tz;
    state.city = cityName;

    // Clear tab cache for new city
    Object.keys(tabCache).forEach(k => delete tabCache[k]);

    els.weatherLoading.classList.remove('hidden');
    els.weatherData.classList.add('hidden');

    try {
        const data = await fetchWeather(lat, lon, tz);
        const c = data.current;
        const info = WMO[c.weather_code] || WMO[0];

        state.weatherCode = c.weather_code;
        state.isDay = c.is_day;

        // Update hero
        els.weatherIconBig.textContent = info.emoji;
        els.weatherTemp.textContent    = `${Math.round(c.temperature_2m)}°C`;
        els.weatherDesc.textContent    = wmoText(c.weather_code);
        els.weatherCity.textContent    = cityName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        els.detailHumidity.textContent = `${c.relative_humidity_2m}%`;
        els.detailWind.textContent     = `${Math.round(c.wind_speed_10m)} km/h`;
        els.detailFeels.textContent    = `${Math.round(c.apparent_temperature)}°C`;
        els.detailCloud.textContent    = `${c.cloud_cover}%`;

        // Update sky scene
        const hour = new Date().getHours();
        updateSkyScene(c.weather_code, c.is_day, hour);
        scheduleSkyFreeze();

        els.weatherLoading.classList.add('hidden');
        els.weatherData.classList.remove('hidden');

        // Reset tabs to "current" whenever a new city loads
        switchWeatherTab('current');

    } catch (err) {
        console.error('Weather fetch failed:', err);
        els.weatherLoading.innerHTML = '<p style="color:rgba(255,150,150,0.9)">Počasie sa nepodarilo načítať.</p>';
    }
}

// ═══════════════════════════════════════════════════════════
//  WEATHER TABS
// ═══════════════════════════════════════════════════════════

const tabCache = {}; // tab → city name when last fetched
const tabInflight = new Set(); // prevent duplicate simultaneous fetches
const TAB_TTL_MS = 10 * 60 * 1000; // 10 minutes — re-fetch if stale
const tabFetchTime = {}; // tab → timestamp of last fetch

function isTabFresh(key) {
    return tabCache[key] === state.city && tabFetchTime[key] && (Date.now() - tabFetchTime[key] < TAB_TTL_MS);
}
function markTabFresh(key) {
    tabCache[key] = state.city;
    tabFetchTime[key] = Date.now();
}

function switchWeatherTab(tabId) {
    // Clear cache when city changes
    document.querySelectorAll('.weather-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
    const pane = document.getElementById('tab' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
    if (pane) pane.classList.remove('hidden');

    if (!state.lat) return;

    // Lazy-load tab content
    switch (tabId) {
        case 'today':   loadTabToday();   break;
        case '7d':      loadTab7d();      break;
        case '14d':     loadTab14d();     break;
        case 'air':     loadTabAir();     break;
        case 'nice':    loadTabNice();    break;
        case 'outfit':  loadTabOutfit();  break;
        case 'traffic': loadTabTraffic(); break;
    }
}

function tabLoading(loadingId, show) {
    const el = document.getElementById(loadingId);
    if (el) el.classList.toggle('hidden', !show);
}

// ── Today (hourly) ──
async function loadTabToday() {
    if (isTabFresh('today')) return;
    if (tabInflight.has('today')) return;
    tabInflight.add('today');
    tabLoading('loadingToday', true);
    const content = document.getElementById('contentToday');
    content.innerHTML = '';
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,is_day&timezone=${state.tz}&forecast_days=1`;
        const data = await (await fetch(url)).json();
        const h = data.hourly;
        const now = new Date().getHours();

        for (let i = 0; i < h.time.length; i++) {
            const hour = new Date(h.time[i]).getHours();
            if (hour < now) continue; // skip past hours
            const info = WMO[h.weather_code[i]] || WMO[0];
            const row = document.createElement('div');
            row.className = 'hourly-row';
            row.innerHTML = `
                <span class="hourly-time">${String(hour).padStart(2,'0')}:00</span>
                <span class="hourly-icon">${info.emoji}</span>
                <span class="hourly-temp">${Math.round(h.temperature_2m[i])}°C</span>
                <span class="hourly-desc">${wmoText(h.weather_code[i])}</span>
                <span class="hourly-rain">${h.precipitation_probability[i]}%</span>
                <span class="hourly-wind">${Math.round(h.wind_speed_10m[i])}km/h</span>
            `;
            content.appendChild(row);
        }
        markTabFresh('today');
    } catch (err) { content.innerHTML = `<div class="notif-empty">${'Načítanie zlyhalo.'}</div>`; }
    tabInflight.delete('today');
    tabLoading('loadingToday', false);
}

// ── 7 / 14 day forecasts ──
async function loadDailyForecast(days) {
    const key = `${days}d`;
    if (tabCache[key] === state.city) return;
    tabLoading(`loading${days === 7 ? '7d' : '14d'}`, true);
    const content = document.getElementById(`content${days === 7 ? '7d' : '14d'}`);
    content.innerHTML = '';
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=${state.tz}&forecast_days=${days}`;
        const data = await (await fetch(url)).json();
        const d = data.daily;
        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

        for (let i = 0; i < d.time.length; i++) {
            const date = new Date(d.time[i]);
            const info = WMO[d.weather_code[i]] || WMO[0];
            const row = document.createElement('div');
            row.className = 'daily-row';
            row.innerHTML = `
                <span class="daily-day">${i === 0 ? 'Dnes' : ['Ne','Po','Ut','St','Št','Pi','So'][date.getDay()]}</span>
                <span class="daily-date">${date.getDate()}.${date.getMonth()+1}.</span>
                <span class="daily-icon">${info.emoji}</span>
                <span class="daily-desc">${wmoText(d.weather_code[i])}</span>
                <span class="daily-temps">${Math.round(d.temperature_2m_max[i])}° <span>${Math.round(d.temperature_2m_min[i])}°</span></span>
                <span class="daily-rain">${d.precipitation_probability_max[i]}%</span>
            `;
            content.appendChild(row);
        }
        tabCache[key] = state.city;
    } catch { content.innerHTML = `<div class="notif-empty">${'Načítanie zlyhalo.'}</div>`; }
    tabLoading(`loading${days === 7 ? '7d' : '14d'}`, false);
}

async function loadTab7d()  { await loadDailyForecast(7);  }
async function loadTab14d() { await loadDailyForecast(14); }

// ── Air Quality ──
const AQI_LEVELS = [
    { max: 20,  labelKey: 'good',          color: '#4ade80' },
    { max: 40,  labelKey: 'fair',          color: '#a3e635' },
    { max: 60,  labelKey: 'moderate',      color: '#facc15' },
    { max: 80,  labelKey: 'poor',          color: '#fb923c' },
    { max: 100, labelKey: 'veryPoor',      color: '#f87171' },
    { max: 999, labelKey: 'extremelyPoor', color: '#c084fc' },
];

function getAqiLevel(val) {
    return AQI_LEVELS.find(l => val <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
}

async function loadTabAir() {
    if (isTabFresh('air')) return;
    if (tabInflight.has('air')) return;
    tabInflight.add('air');
    tabLoading('loadingAir', true);
    const content = document.getElementById('contentAir');
    content.innerHTML = '';
    try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${state.lat}&longitude=${state.lon}&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide`;
        const data = await (await fetch(url)).json();
        const c = data.current;
        const aqi = c.european_aqi ?? 0;
        const level = getAqiLevel(aqi);

        content.innerHTML = `
            <div class="aqi-hero">
                <div class="aqi-index" style="color:${level.color}">${aqi}</div>
                <div class="aqi-label" style="color:${level.color}">${{'good':'Dobrý','fair':'Prijateľný','moderate':'Stredný','poor':'Zlý','veryPoor':'Veľmi zlý','extremelyPoor':'Extrémne zlý'}[level.labelKey]}</div>
            </div>
            <div class="aqi-grid">
                <div class="aqi-chip"><div class="aqi-chip-label">PM2.5</div><div class="aqi-chip-value">${c.pm2_5?.toFixed(1) ?? '—'} μg/m³</div></div>
                <div class="aqi-chip"><div class="aqi-chip-label">PM10</div><div class="aqi-chip-value">${c.pm10?.toFixed(1) ?? '—'} μg/m³</div></div>
                <div class="aqi-chip"><div class="aqi-chip-label">NO₂</div><div class="aqi-chip-value">${c.nitrogen_dioxide?.toFixed(1) ?? '—'} μg/m³</div></div>
                <div class="aqi-chip"><div class="aqi-chip-label">O₃</div><div class="aqi-chip-value">${c.ozone?.toFixed(1) ?? '—'} μg/m³</div></div>
                <div class="aqi-chip"><div class="aqi-chip-label">SO₂</div><div class="aqi-chip-value">${c.sulphur_dioxide?.toFixed(1) ?? '—'} μg/m³</div></div>
            </div>
        `;
        markTabFresh('air');
    } catch { content.innerHTML = `<div class="notif-empty">${'Načítanie zlyhalo.'}</div>`; }
    tabInflight.delete('air');
    tabLoading('loadingAir', false);
}

// ── Nice Days ──
async function loadTabNice() {
    if (isTabFresh('nice')) return;
    if (tabInflight.has('nice')) return;
    tabInflight.add('nice');
    tabLoading('loadingNice', true);
    const content = document.getElementById('contentNice');
    content.innerHTML = '';
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max&timezone=${state.tz}&forecast_days=16`;
        const data = await (await fetch(url)).json();
        const d = data.daily;
        const niceDays = [];
        for (let i = 0; i < d.time.length; i++) {
            const info = WMO[d.weather_code[i]] || WMO[0];
            // Score: penalise rain, wind, bad weather; reward warmth, low wind
            let score = 100;
            score -= info.severity * 20;
            score -= Math.min(40, d.precipitation_sum[i] * 10);
            score -= Math.max(0, d.wind_speed_10m_max[i] - 20) * 0.5;
            score += Math.min(10, (d.temperature_2m_max[i] - 10) * 0.5);
            score = Math.max(0, Math.min(100, Math.round(score)));

            if (score >= 50) niceDays.push({ i, score, info, code: d.weather_code[i], date: new Date(d.time[i]) });
        }

        if (niceDays.length === 0) {
            content.innerHTML = `<div class="notif-empty">${'V najbližších 16 dňoch nie sú žiadne pekné dni.'}</div>`;
        } else {
            niceDays.sort((a, b) => b.score - a.score);
            for (const day of niceDays.slice(0, 8)) {
                const color = day.score >= 80 ? '#4ade80' : day.score >= 65 ? '#facc15' : '#fb923c';
                const row = document.createElement('div');
                row.className = 'nice-row';
                row.innerHTML = `
                    <div class="nice-score" style="background:${color}22;border:2px solid ${color};color:${color}">${day.score}</div>
                    <div class="nice-info">
                        <div class="nice-date">${['Ne','Po','Ut','St','Št','Pi','So'][day.date.getDay()]} ${day.date.getDate()}.${day.date.getMonth()+1}. ${day.info.emoji}</div>
                        <div class="nice-desc">${wmoText(day.info.code ?? 0)}</div>
                    </div>
                    <div class="nice-temps">${Math.round(d.temperature_2m_max[day.i])}° / ${Math.round(d.temperature_2m_min[day.i])}°</div>
                `;
                content.appendChild(row);
            }
        }
        markTabFresh('nice');
    } catch { content.innerHTML = `<div class="notif-empty">${'Načítanie zlyhalo.'}</div>`; }
    tabInflight.delete('nice');
    tabLoading('loadingNice', false);
}

// ── Outfit ──
function getOutfitAdvice(temp, feelsLike, code, windSpeed, precip) {
    const info = WMO[code] || WMO[0];
    const layers = [];
    const accessories = [];
    let tip = '';

    // Base layer
    if (feelsLike < 0)       layers.push('🧥 Ťažký zimný kabát', '🧣 Šál', '🧤 Rukavice', '🎿 Termoprádlo');
    else if (feelsLike < 8)  layers.push('🧥 Zimný kabát', '🧣 Šál');
    else if (feelsLike < 14) layers.push('🧥 Bunda alebo kabát');
    else if (feelsLike < 18) layers.push('🧶 Ľahká bunda alebo mikina');
    else if (feelsLike < 24) layers.push('👕 Tričko + ľahká vrstva');
    else                      layers.push('👕 Tričko', '🩳 Kraťasy možné');

    // Rain
    if ([51,53,55,61,63,65,80,81,82].includes(code)) accessories.push('☂️ Dáždnik');
    if ([66,67].includes(code)) accessories.push('🧊 Pozor na ľad');
    if ([71,73,75,85,86].includes(code)) { accessories.push('🥾 Nepremokavé topánky'); tip = 'Hustý sneh — oblečte sa teplo a nepremokavo.'; }
    if ([95,96,99].includes(code)) tip = 'Búrka — zvážte zostať doma.';
    if (windSpeed > 40) accessories.push('💨 Vetrovka');
    if (temp > 28) { accessories.push('🕶️ Slnečné okuliare', '🧴 Opaľovací krém'); tip = 'Horúci deň — pite dostatok tekutín!'; }
    if (info.severity === 0 && temp > 15) accessories.push('🕶️ Slnečné okuliare');
    if (!tip && feelsLike < 5) tip = 'Pocitovo oveľa chladnejšie — oblečte sa podľa pocitovej teploty.';

    return { layers, accessories, tip };
}

async function loadTabOutfit() {
    if (isTabFresh('outfit')) return;
    if (tabInflight.has('outfit')) return;
    tabInflight.add('outfit');
    tabLoading('loadingOutfit', true);
    const content = document.getElementById('contentOutfit');
    content.innerHTML = '';
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation&timezone=${state.tz}`;
        const data = await (await fetch(url)).json();
        const c = data.current;
        const { layers, accessories, tip } = getOutfitAdvice(c.temperature_2m, c.apparent_temperature, c.weather_code, c.wind_speed_10m, c.precipitation);

        let html = `<div class="outfit-section">`;
        if (layers.length) {
            html += `<div class="outfit-title">${'Čo si obliecť'}</div><div class="outfit-items">`;
            layers.forEach(l => html += `<span class="outfit-item">${l}</span>`);
            html += `</div>`;
        }
        if (accessories.length) {
            html += `<div class="outfit-title">${'Nezabudni'}</div><div class="outfit-items">`;
            accessories.forEach(a => html += `<span class="outfit-item">${a}</span>`);
            html += `</div>`;
        }
        if (tip) html += `<div class="outfit-tip">💡 ${tip}</div>`;
        html += `</div>`;
        content.innerHTML = html;
        markTabFresh('outfit');
    } catch { content.innerHTML = `<div class="notif-empty">${'Načítanie zlyhalo.'}</div>`; }
    tabInflight.delete('outfit');
    tabLoading('loadingOutfit', false);
}

// ── Traffic ──
function getTrafficWarnings(current, hourly) {
    const warnings = [];
    const c = current.current;
    const h = hourly.hourly;
    const code = c.weather_code;

    if ([66,67].includes(code)) warnings.push({ level:'high',   icon:'🧊', title:'Riziko poľadovice',         desc:'Mrznúci dážď — cesty môžu byť extrémne kĺzavé.' });
    if ([71,73,75,85,86].includes(code)) warnings.push({ level:'high', icon:'❄️', title:'Sneh na cestách', desc:'Znížená priľnavosť a viditeľnosť. Jazdite pomaly.' });
    if ([95,96,99].includes(code)) warnings.push({ level:'high',   icon:'⛈️', title:'Búrka',          desc:'Zlá viditeľnosť a možné záplavy.' });
    if ([65,82].includes(code))   warnings.push({ level:'medium', icon:'🌧️', title:'Silný dážď',             desc:'Znížená viditeľnosť a riziko aquaplaningu.' });
    if (c.wind_gusts_10m > 60)    warnings.push({ level:'high',   icon:'💨', title:'Nebezpečné nárazy',        desc:`Gusts up to ${Math.round(c.wind_gusts_10m)} km/h — high-sided vehicles at risk.` });
    else if (c.wind_speed_10m > 40) warnings.push({ level:'medium', icon:'💨', title:'Silný vietor',          desc:`${Math.round(c.wind_speed_10m)} km/h — take care on open roads.` });
    if ([45,48].includes(code))   warnings.push({ level:'medium', icon:'🌫️', title:'Hmla',                    desc:'Nízka viditeľnosť — používajte hmlové svetlá a znížte rýchlosť.' });

    // Check next 3 hours for upcoming hazards
    const now = new Date();
    for (let i = 0; i < Math.min(3, h.time?.length || 0); i++) {
        const hCode = h.weather_code?.[i];
        if ([66,67,71,73,75,95,96,99].includes(hCode) && !warnings.find(w => w.title.includes('ice') || w.title.includes('Snow') || w.title.includes('Thunder'))) {
            const hInfo = WMO[hCode] || WMO[0];
            warnings.push({ level:'low', icon:'⚠️', title:`${hInfo.text} expected soon`, desc:'Podmienky sa môžu zhoršiť v najbližších hodinách.' });
            break;
        }
    }

    return warnings;
}

async function loadTabTraffic() {
    if (isTabFresh('traffic')) return;
    if (tabInflight.has('traffic')) return;
    tabInflight.add('traffic');
    tabLoading('loadingTraffic', true);
    const content = document.getElementById('contentTraffic');
    content.innerHTML = '';
    try {
        const [current, hourly] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&current=weather_code,wind_speed_10m,wind_gusts_10m,temperature_2m&timezone=${state.tz}`).then(r => r.json()),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&hourly=weather_code&timezone=${state.tz}&forecast_days=1`).then(r => r.json()),
        ]);

        const warnings = getTrafficWarnings(current, hourly);

        if (warnings.length === 0) {
            content.innerHTML = `<div class="traffic-ok"><span class="traffic-icon">✅</span>${'Cesty sú bez problémov — žiadne havarijné podmienky.'}</div>`;
        } else {
            warnings.forEach(w => {
                const row = document.createElement('div');
                row.className = `warning-row ${w.level}`;
                row.innerHTML = `
                    <span class="warning-icon">${w.icon}</span>
                    <div class="warning-text">
                        <div class="warning-title">${w.title}</div>
                        <div class="warning-desc">${w.desc}</div>
                    </div>
                `;
                content.appendChild(row);
            });
        }
        markTabFresh('traffic');
    } catch { content.innerHTML = `<div class="notif-empty">${'Načítanie zlyhalo.'}</div>`; }
    tabInflight.delete('traffic');
    tabLoading('loadingTraffic', false);
}

// ═══════════════════════════════════════════════════════════
//  CITY SEARCH
// ═══════════════════════════════════════════════════════════

async function handleCitySearch() {
    const query = els.cityInput.value.trim();
    if (!query) return;

    els.searchBtn.textContent = '…';
    els.cityResults.classList.add('hidden');
    els.cityResults.innerHTML = '';

    try {
        const results = await geocode(query);
        els.searchBtn.textContent = 'Hľadaj';

        if (results.length === 0) {
            els.cityResults.innerHTML = '<div class="city-result-item">No results found.</div>';
            els.cityResults.classList.remove('hidden');
            return;
        }

        if (results.length === 1) {
            selectCity(results[0]);
            return;
        }

        results.slice(0, 5).forEach(r => {
            const item = document.createElement('div');
            item.className = 'city-result-item';
            item.innerHTML = `
                <div>${r.name}</div>
                <div class="sub">${[r.admin1, r.country].filter(Boolean).join(', ')}</div>
            `;
            item.addEventListener('click', () => {
                selectCity(r);
                els.cityResults.classList.add('hidden');
            });
            els.cityResults.appendChild(item);
        });

        els.cityResults.classList.remove('hidden');
    } catch (err) {
        els.searchBtn.textContent = 'Hľadaj';
        console.error('Geocode error:', err);
    }
}

function selectCity(result) {
    const name = result.name + (result.country ? `, ${result.country}` : '');
    loadWeather(result.latitude, result.longitude, result.timezone || 'auto', name);
    els.cityInput.value = name;
    els.cityResults.classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════
//  BOT USER CONFIG
// ═══════════════════════════════════════════════════════════

// ── Auth state ───────────────────────────────────────────────

function showAuthState(loggedIn) {
    els.authLogin.classList.toggle('hidden', loggedIn);
    els.authUser.classList.toggle('hidden', !loggedIn);
    els.userConfig.classList.toggle('hidden', !loggedIn);
}

async function checkAuth() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'denied') {
        els.authError.textContent = 'Prihlásenie zrušené.';
        els.authError.classList.remove('hidden');
    } else if (params.get('auth') === 'error') {
        els.authError.textContent = 'Prihlásenie zlyhalo. Skontroluj .env.';
        els.authError.classList.remove('hidden');
    }
    if (params.has('auth')) window.history.replaceState({}, '', '/');

    try {
        const res = await fetch('/auth/me');
        if (!res.ok) { showAuthState(false); return; }

        const user = await res.json();
        state.discordUser = user;

        // Show profile
        els.userAvatar.src = user.avatarUrl;
        els.userName.textContent = user.displayName;
        els.userTag.textContent = `@${user.username}`;
        showAuthState(true);

        // Load their settings
        await loadUserSettings();

    } catch (err) {
        console.error('Auth check failed:', err);
        showAuthState(false);
    }
}

async function loadUserSettings() {
    try {
        const res = await fetch(`${API_BASE}/me`);
        const data = res.ok ? await res.json() : {};
        state.currentUserData = data;
        populateUserConfig(data);
        if (data.latitude) {
            loadWeather(data.latitude, data.longitude, data.timezone || 'auto', data.city || null);
            els.cityInput.value = data.city || '';
        }
    } catch (err) {
        console.error('Load settings error:', err);
        showStatus('Nepodarilo sa načítať nastavenia.', 'error');
    }
}

async function handleLogout() {
    try {
        await fetch('/auth/logout', { method: 'POST' });
    } catch {}
    state.discordUser = null;
    state.currentUserData = null;
    showAuthState(false);
}

function populateUserConfig(data) {
    setToggle(els.tempToggle, data.units === 'fahrenheit' ? 'fahrenheit' : 'celsius');
    setToggle(els.windToggle, data.wind_unit || 'kmh');
    renderFavourites(data.favorites || []);
    renderNotifications(data.notifications || []);
}

function setToggle(container, value) {
    container.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === value);
    });
}

function getToggleValue(container) {
    return container.querySelector('.toggle-btn.active')?.dataset.value || null;
}

// ── Notification type labels ──
const NOTIF_TYPES = [
    { value: 'daily',          label: '📋 Ranný prehľad',     desc: 'Celý prehľad dňa v nastavený čas',    canSchedule: true },
    { value: 'severe',         label: '⚠️ Výstrahy počasia',    desc: 'Búrky, silný dážď v nastavený čas',    canSchedule: true },
    { value: 'weather_change', label: '🔄 Zmena počasia',    desc: 'Keď sa zmení počasie',               needsChanges: true },
    { value: 'rain_now',       label: '🌧️ Práve prší',    desc: 'Hneď keď začne pršať',              instant: true },
    { value: 'storm',          label: '⛈️ Búrka sa blíži',       desc: 'Upozornenie na búrku v reálnom čase',             instant: true },
    { value: 'extreme_temp',   label: '🌡️ Extrémna teplota',     desc: 'Pod 0°C alebo nad 33°C',             instant: true },
    { value: 'sunrise',        label: '🌅 Východ slnka',           desc: 'X minút pred východom slnka',            needsOffset: true },
    { value: 'sunset',         label: '🌇 Západ slnka',            desc: 'X minút pred západom slnka',             needsOffset: true },
];

const CHANGE_OPTIONS = [
    { value: 'sunny_to_cloudy', label: '☁️ Zaťahuje sa' },
    { value: 'cloudy_to_sunny', label: '☀️ Vyčasuje sa' },
    { value: 'start_rain',      label: '🌧️ Začína pršať' },
    { value: 'stop_rain',       label: '🌤️ Prestáva pršať' },
    { value: 'start_snow',      label: '🌨️ Začína snežiť' },
    { value: 'storm_coming',    label: '⛈️ Prichádza búrka' },
    { value: 'fog_coming',      label: '🌫️ Tvorí sa hmla' },
    { value: 'wind_up',         label: '💨 Zosilňuje vietor' },
    { value: 'temp_drop',       label: '🥶 Rýchly pokles teploty' },
    { value: 'temp_rise',       label: '🥵 Rýchly nárast teploty' },
];

function notifTypeLabel(n) {
    const t = NOTIF_TYPES.find(t => t.value === n.type);
    const base = t ? t.label : n.type;
    if (n.event_based && !n.offset_minutes) return `${base} ⚡`;
    if (n.offset_minutes) return `${base} (${n.offset_minutes}min early)`;
    if (n.hour !== null && n.hour !== undefined) {
        const time = `${String(n.hour).padStart(2,'0')}:${String(n.minute).padStart(2,'0')}`;
        return `${base} @ ${time}`;
    }
    if (n.watch_changes?.length) return `${base}: ${n.watch_changes.length} change(s)`;
    return base;
}

// Channel name cache
const channelNameCache = {};

async function resolveChannelName(channelId) {
    if (channelNameCache[channelId]) return channelNameCache[channelId];
    // Look up in already-loaded channel list — no extra API call needed
    const guilds = channelCache;
    if (guilds) {
        for (const g of guilds) {
            const ch = g.channels?.find(c => c.id === channelId);
            if (ch) {
                channelNameCache[channelId] = `#${ch.name}`;
                return channelNameCache[channelId];
            }
        }
    }
    // Not in cache yet — try loading channels then retry
    const loaded = await loadChannels();
    if (loaded) {
        for (const g of loaded) {
            const ch = g.channels?.find(c => c.id === channelId);
            if (ch) {
                channelNameCache[channelId] = `#${ch.name}`;
                return channelNameCache[channelId];
            }
        }
    }
    return `#${channelId}`;
}

function renderNotifications(notifs) {
    els.notifList.innerHTML = '';
    if (!notifs || notifs.length === 0) {
        els.notifList.innerHTML = '<div class="notif-empty">Zatiaľ žiadne notifikácie.</div>';
        return;
    }
    notifs.forEach(n => {
        const item = document.createElement('div');
        item.className = 'notif-item';
        item.innerHTML = `
            <div class="notif-status ${n.enabled ? 'on' : 'off'}"></div>
            <div class="notif-info">
                <div class="notif-time">${notifTypeLabel(n)}</div>
                <div class="notif-type notif-ch-${n.id}">#${n.channel_id}</div>
            </div>
            <div class="notif-actions">
                <button class="glass-btn small" data-id="${n.id}" data-action="toggle">${n.enabled ? 'Vypnúť' : 'Zapnúť'}</button>
                <button class="glass-btn small danger" data-id="${n.id}" data-action="delete">✕</button>
            </div>
        `;
        els.notifList.appendChild(item);
        // Resolve channel name from cached guild list
        resolveChannelName(n.channel_id).then(name => {
            const el = els.notifList.querySelector(`.notif-ch-${n.id}`);
            if (el) el.textContent = name;
        });
    });
    els.notifList.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => handleNotifAction(btn.dataset.action, btn.dataset.id));
    });
}

// ── Favourites ──────────────────────────────────────────────

function renderFavourites(favs) {
    els.favList.innerHTML = '';
    if (!favs || favs.length === 0) {
        els.favList.innerHTML = '<div class="notif-empty">No favourite cities yet.</div>';
        return;
    }
    favs.forEach((f, i) => {
        const item = document.createElement('div');
        item.className = 'fav-item';
        item.innerHTML = `
            <div class="fav-name">⭐ ${f.name}</div>
            <div class="fav-coords">${f.latitude?.toFixed(2)}, ${f.longitude?.toFixed(2)}</div>
            <div class="notif-actions">
                <button class="glass-btn small" data-idx="${i}" data-action="use">Použiť</button>
                <button class="glass-btn small danger" data-idx="${i}" data-action="remove">✕</button>
            </div>
        `;
        els.favList.appendChild(item);
    });
    els.favList.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => handleFavAction(btn.dataset.action, parseInt(btn.dataset.idx)));
    });
}

async function handleFavAction(action, idx) {
    if (!state.discordUser) return;
    const favs = state.currentUserData.favorites || [];

    if (action === 'use') {
        const fav = favs[idx];
        if (!fav) return;
        // Set as primary city in state and load weather
        state.lat = fav.latitude;
        state.lon = fav.longitude;
        state.tz  = fav.timezone || 'auto';
        state.city = fav.name;
        els.cityInput.value = fav.name;
        loadWeather(fav.latitude, fav.longitude, fav.timezone || 'auto', fav.name);
    }

    if (action === 'remove') {
        try {
            await fetch(`${API_BASE}/me/favorites/${idx}`, { method: 'DELETE' });
            state.currentUserData.favorites = favs.filter((_, i) => i !== idx);
            renderFavourites(state.currentUserData.favorites);
        } catch (err) {
            showStatus('Chyba servera.', 'error');
        }
    }
}

async function handleFavSearch() {
    const query = els.favCityInput.value.trim();
    if (!query) return;
    els.favSearchBtn.textContent = '…';
    els.favCityResults.innerHTML = '';
    els.favCityResults.classList.add('hidden');

    try {
        const results = await geocode(query);
        els.favSearchBtn.textContent = 'Hľadaj';
        if (!results.length) {
            els.favCityResults.innerHTML = '<div class="city-result-item">No results.</div>';
            els.favCityResults.classList.remove('hidden');
            return;
        }
        results.slice(0, 5).forEach(r => {
            const item = document.createElement('div');
            item.className = 'city-result-item';
            item.innerHTML = `<div>${r.name}</div><div class="sub">${[r.admin1, r.country].filter(Boolean).join(', ')}</div>`;
            item.addEventListener('click', () => saveFavourite(r));
            els.favCityResults.appendChild(item);
        });
        els.favCityResults.classList.remove('hidden');
    } catch {
        els.favSearchBtn.textContent = 'Hľadaj';
    }
}

async function saveFavourite(result) {
    if (!state.discordUser) return;
    const favs = state.currentUserData.favorites || [];
    if (favs.length >= 10) { showStatus('Maximálne 10 obľúbených.', 'error'); return; }
    if (favs.some(f => f.name === result.name && f.latitude === result.latitude)) {
        showStatus('Mesto už je v obľúbených.', 'error'); return;
    }
    try {
        const res = await fetch(`${API_BASE}/me/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: result.name, latitude: result.latitude, longitude: result.longitude, timezone: result.timezone }),
        });
        const fav = await res.json();
        if (!state.currentUserData.favorites) state.currentUserData.favorites = [];
        state.currentUserData.favorites.push(fav);
        renderFavourites(state.currentUserData.favorites);
        els.addFavForm.classList.add('hidden');
        els.favCityInput.value = '';
        els.favCityResults.classList.add('hidden');
        showStatus(`⭐ ${result.name} added!`, 'success');
    } catch {
        showStatus('Chyba servera.', 'error');
    }
}

// ── Channel Picker ──────────────────────────────────────────

let channelCache = null; // { guilds: [{id, name, icon, channels: [{id, name}]}] }

async function loadChannels() {
    if (channelCache) return channelCache;
    try {
        const res = await fetch('/api/channels');
        if (!res.ok) return null;
        channelCache = await res.json();
        return channelCache;
    } catch {
        return null;
    }
}

function getSelectedChannel(pickerEl) {
    return pickerEl.querySelector('.channel-option.selected')?.dataset.id || null;
}

async function buildChannelPicker(containerEl) {
    containerEl.innerHTML = '<div class="channel-loading">Loading channels…</div>';

    const guilds = await loadChannels();
    containerEl.innerHTML = '';

    if (!guilds || guilds.length === 0) {
        containerEl.innerHTML = '<div class="notif-empty">No shared servers found. Make sure the bot is in your server.</div>';
        return;
    }

    const select = document.createElement('div');
    select.className = 'channel-select';

    for (const guild of guilds) {
        const guildHeader = document.createElement('div');
        guildHeader.className = 'channel-guild-header';
        const iconUrl = guild.icon
            ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=16`
            : null;
        guildHeader.innerHTML = iconUrl
            ? `<img src="${iconUrl}" class="channel-guild-icon"> ${guild.name}`
            : `<span class="channel-guild-icon-fallback">${guild.name[0]}</span> ${guild.name}`;
        select.appendChild(guildHeader);

        for (const ch of guild.channels) {
            const opt = document.createElement('div');
            opt.className = 'channel-option';
            opt.dataset.id = ch.id;
            opt.innerHTML = `<span class="channel-hash">#</span> ${ch.name}`;
            opt.addEventListener('click', () => {
                select.querySelectorAll('.channel-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
            select.appendChild(opt);
        }
    }

    containerEl.appendChild(select);
}



let wizardState = { type: null, mode: null };

function showWizardStep(stepId) {
    const panel = document.querySelector('.glass-panel');
    const scrollPos = panel ? panel.scrollTop : 0;

    ['wizStep1','wizStep2Mode','wizStep2Instant','wizStep2Offset','wizStep2Changes'].forEach(id => {
        $(id)?.classList.add('hidden');
    });
    $(stepId)?.classList.remove('hidden');

    // Restore scroll position — DOM changes can cause jumps
    if (panel) panel.scrollTop = scrollPos;
}

function openNotifWizard() {
    wizardState = { type: null, mode: 'timed' };
    const panel = document.querySelector('.glass-panel');
    const scrollPos = panel ? panel.scrollTop : 0;

    // Build type grid
    els.notifTypeGrid.innerHTML = '';
    NOTIF_TYPES.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'notif-type-btn';
        btn.innerHTML = `<span class="type-name">${t.label}</span><span class="type-desc">${t.desc}</span>`;
        btn.addEventListener('click', () => handleWizTypeSelect(t));
        els.notifTypeGrid.appendChild(btn);
    });

    // Build change grid
    els.changeGrid.innerHTML = '';
    CHANGE_OPTIONS.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'change-btn';
        btn.textContent = c.label;
        btn.dataset.value = c.value;
        btn.addEventListener('click', () => btn.classList.toggle('selected'));
        els.changeGrid.appendChild(btn);
    });

    els.addNotifForm.classList.remove('hidden');
    showWizardStep('wizStep1');
    requestAnimationFrame(() => { if (panel) panel.scrollTop = scrollPos; });
}

function handleWizTypeSelect(typeDef) {
    wizardState.type = typeDef.value;

    if (typeDef.canSchedule) {
        els.wizStep2ModeTitle.textContent = `${typeDef.label} — When?`;
        setWizMode('timed');
        showWizardStep('wizStep2Mode');
        buildChannelPicker(els.channelPickerMode);
    } else if (typeDef.instant) {
        els.wizStep2InstantTitle.textContent = `${typeDef.label} — Channel`;
        showWizardStep('wizStep2Instant');
        buildChannelPicker(els.channelPickerInstant);
    } else if (typeDef.needsOffset) {
        els.wizStep2OffsetTitle.textContent = `${typeDef.label} — How early?`;
        setToggle(els.offsetToggle, '0');
        showWizardStep('wizStep2Offset');
        buildChannelPicker(els.channelPickerOffset);
    } else if (typeDef.needsChanges) {
        els.changeGrid.querySelectorAll('.change-btn').forEach(b => b.classList.remove('selected'));
        showWizardStep('wizStep2Changes');
        buildChannelPicker(els.channelPickerChanges);
    }
}

function setWizMode(mode) {
    wizardState.mode = mode;
    els.modeTimedBtn.classList.toggle('active', mode === 'timed');
    els.modeInstantBtn.classList.toggle('active', mode === 'instant');
    els.timeInputRow.classList.toggle('hidden-row', mode === 'instant');
}

function closeNotifWizard() {
    const panel = document.querySelector('.glass-panel');
    const scrollPos = panel ? panel.scrollTop : 0;
    els.addNotifForm.classList.add('hidden');
    wizardState = { type: null, mode: 'timed' };
    requestAnimationFrame(() => { if (panel) panel.scrollTop = scrollPos; });
}

async function saveNotifScheduled() {
    if (!state.discordUser) return;
    const channelId = getSelectedChannel(els.channelPickerMode);
    if (!channelId) { showStatus('Vyber kanál.', 'error'); return; }

    let hour = null, minute = null, event_based = false;

    if (wizardState.mode === 'timed') {
        const timeStr = els.notifTime.value.trim();
        const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) { showStatus('Neplatný čas. Použi HH:MM', 'error'); return; }
        hour = parseInt(match[1]);
        minute = parseInt(match[2]);
        if (hour > 23 || minute > 59) { showStatus('Neplatné hodnoty času.', 'error'); return; }
    } else {
        event_based = true;
    }

    if (isDuplicateNotif({ type: wizardState.type, hour, minute, channel_id: channelId, event_based })) {
        showStatus('Takáto notifikácia už existuje.', 'error'); return;
    }

    await postNotif({ channel_id: channelId, type: wizardState.type, hour, minute, event_based });
}

async function saveNotifInstant() {
    const channelId = getSelectedChannel(els.channelPickerInstant);
    if (!channelId) { showStatus('Vyber kanál.', 'error'); return; }
    if (isDuplicateNotif({ type: wizardState.type, event_based: true, channel_id: channelId })) {
        showStatus('Takáto notifikácia už existuje.', 'error'); return;
    }
    await postNotif({ channel_id: channelId, type: wizardState.type, hour: null, minute: null, event_based: true });
}

async function saveNotifOffset() {
    const channelId = getSelectedChannel(els.channelPickerOffset);
    if (!channelId) { showStatus('Vyber kanál.', 'error'); return; }
    const offset = parseInt(getToggleValue(els.offsetToggle) || '0');
    await postNotif({ channel_id: channelId, type: wizardState.type, hour: null, minute: null, event_based: true, offset_minutes: offset });
}

async function saveNotifChanges() {
    const channelId = getSelectedChannel(els.channelPickerChanges);
    if (!channelId) { showStatus('Vyber kanál.', 'error'); return; }
    const selected = [...els.changeGrid.querySelectorAll('.change-btn.selected')].map(b => b.dataset.value);
    if (!selected.length) { showStatus('Vyber aspoň jeden typ zmeny.', 'error'); return; }
    await postNotif({ channel_id: channelId, type: 'weather_change', hour: null, minute: null, event_based: true, watch_changes: selected });
}

function isDuplicateNotif(newNotif) {
    return (state.currentUserData.notifications || []).some(n =>
        n.type === newNotif.type &&
        n.channel_id === newNotif.channel_id &&
        n.hour === newNotif.hour &&
        n.minute === newNotif.minute &&
        n.event_based === newNotif.event_based
    );
}

async function postNotif(body) {
    if (!state.discordUser) return;
    try {
        const res = await fetch(`${API_BASE}/me/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const notif = await res.json();
        if (!state.currentUserData.notifications) state.currentUserData.notifications = [];
        state.currentUserData.notifications.push(notif);
        renderNotifications(state.currentUserData.notifications);
        closeNotifWizard();
        showStatus('✅ Notifikácia pridaná!', 'success');
    } catch (err) {
        console.error(err);
        showStatus('Chyba servera.', 'error');
    }
}

async function handleNotifAction(action, notifId) {
    if (!state.discordUser) return;

    try {
        if (action === 'toggle') {
            const res = await fetch(`${API_BASE}/me/notifications/${notifId}`, { method: 'PATCH' });
            const updated = await res.json();
            // Update in state
            const n = state.currentUserData.notifications.find(n => n.id === notifId);
            if (n) n.enabled = updated.enabled;
            renderNotifications(state.currentUserData.notifications);
        }
        if (action === 'delete') {
            await fetch(`${API_BASE}/me/notifications/${notifId}`, { method: 'DELETE' });
            state.currentUserData.notifications = state.currentUserData.notifications.filter(n => n.id !== notifId);
            renderNotifications(state.currentUserData.notifications);
        }
    } catch (err) {
        console.error('Notif action error:', err);
        showStatus('Chyba servera. Beží server?', 'error');
    }
}

// (saveNotification replaced by wizard — see postNotif above)

async function saveSettings() {
    if (!state.discordUser) return;
    if (els.saveSettingsBtn.disabled) return;

    els.saveSettingsBtn.disabled = true;
    els.saveSettingsBtn.textContent = '💾 Saving…';

    const units    = getToggleValue(els.tempToggle) || 'celsius';
    const windUnit = getToggleValue(els.windToggle)  || 'kmh';

    const body = { units, wind_unit: windUnit };

    // Include location if one has been selected
    if (state.lat) {
        body.city      = state.city;
        body.latitude  = state.lat;
        body.longitude = state.lon;
        body.timezone  = state.tz;
    }

    try {
        const res = await fetch(`${API_BASE}/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const updated = await res.json();

        // Merge — server strips notifications/favorites from PATCH response, keep them locally
        state.currentUserData = {
            ...updated,
            notifications: updated.notifications ?? state.currentUserData?.notifications ?? [],
            favorites:     updated.favorites     ?? state.currentUserData?.favorites     ?? [],
        };

        // Re-render notifications in case server response changed them
        renderNotifications(state.currentUserData.notifications);
        showStatus('✅ Nastavenia uložené!', 'success');
    } catch (err) {
        console.error('Save settings error:', err);
        showStatus('Chyba servera. Beží server?', 'error');
    } finally {
        els.saveSettingsBtn.disabled = false;
        els.saveSettingsBtn.textContent = '💾 Save Settings';
    }
}

async function deleteUser() {
    if (!state.discordUser) return;
    if (!confirm(`Delete all your Nimbus data? This cannot be undone.`)) return;

    try {
        await fetch(`${API_BASE}/me`, { method: 'DELETE' });
        // Also log out — clear the session
        await fetch('/auth/logout', { method: 'POST' }).catch(() => {});
        state.discordUser     = null;
        state.currentUserData = null;
        showAuthState(false);
        showStatus('Dáta vymazané. Odhlásený.', 'success');
    } catch (err) {
        showStatus('Chyba servera.', 'error');
    }
}

function showStatus(msg, type = 'success') {
    els.saveStatus.textContent = msg;
    els.saveStatus.className   = `save-status ${type}`;
    els.saveStatus.classList.remove('hidden');
    setTimeout(() => els.saveStatus.classList.add('hidden'), 3500);
}

// ═══════════════════════════════════════════════════════════
//  ENTRY ANIMATION
// ═══════════════════════════════════════════════════════════

function playEntryAnimation() {
    const hour = new Date().getHours();
    const phase = getSkyPhase(hour);

    // Dawn/morning: sun rises from below horizon
    if (phase === 'dawn' || phase === 'morning') {
        els.sunContainer.style.transition = 'none';
        els.sunContainer.style.top = '95%';
        els.sunContainer.style.opacity = '0';
        setTimeout(() => {
            els.sunContainer.style.transition = 'top 3s cubic-bezier(0.45, 0.05, 0.55, 0.95), opacity 2s ease, left 4s ease';
            const pos = getSunPosition(hour);
            if (pos) {
                els.sunContainer.style.top  = `${pos.y}%`;
                els.sunContainer.style.left = `${pos.x}%`;
                els.sunContainer.style.opacity = '1';
            }
        }, 800);
    }

    // Day: sun pulses bright on entry
    if (phase === 'day') {
        setTimeout(() => {
            const core = document.querySelector('.sun-core');
            if (!core) return;
            core.style.transition = 'box-shadow 0.3s ease';
            core.style.boxShadow = '0 0 60px 25px rgba(255,220,0,0.9), 0 0 120px 50px rgba(255,180,0,0.6)';
            setTimeout(() => { core.style.boxShadow = ''; }, 1500);
        }, 600);
    }

    // Freeze sun after one full spin (~12s) — saves CPU/RAM
    setTimeout(() => {
        const sun = document.querySelector('.sun');
        if (sun) sun.classList.add('sun-static');
    }, 12500);

    // Freeze moon glow after it's settled
    setTimeout(() => {
        const moon = document.querySelector('.moon');
        if (moon) moon.style.animationPlayState = 'paused';
    }, 15000);

    // Night: stars fade in one by one
    if (phase === 'night' || phase === 'dusk') {
        const stars = document.querySelectorAll('.star');
        stars.forEach((s, i) => {
            s.style.opacity = '0';
            s.style.transition = `opacity 0.5s ease ${i * 0.08}s`;
        });
        setTimeout(() => {
            els.stars.style.opacity = '1';
            stars.forEach(s => { s.style.opacity = ''; });
        }, 500);
    }
}

// ═══════════════════════════════════════════════════════════
//  GEOLOCATION — try to get user's location on load
// ═══════════════════════════════════════════════════════════

function tryGeolocation() {
    if (!navigator.geolocation) return loadDefaultWeather();

    navigator.geolocation.getCurrentPosition(
        pos => {
            loadWeather(pos.coords.latitude, pos.coords.longitude, 'auto', 'Your Location');
        },
        () => loadDefaultWeather(),
        { timeout: 5000 }
    );
}

function loadDefaultWeather() {
    // Default to Bratislava (home 🇸🇰)
    loadWeather(48.1482, 17.1067, 'Europe/Bratislava', 'Bratislava, Slovakia');
}

// ═══════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

function initEventListeners() {
    // Weather tabs
    document.getElementById('weatherTabs')?.addEventListener('click', e => {
        const btn = e.target.closest('.weather-tab');
        if (!btn) return;
        switchWeatherTab(btn.dataset.tab);
    });

    // City search
    els.searchBtn.addEventListener('click', handleCitySearch);
    els.cityInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleCitySearch(); });
    document.addEventListener('click', e => {
        if (!els.cityResults.contains(e.target) && e.target !== els.cityInput && e.target !== els.searchBtn) {
            els.cityResults.classList.add('hidden');
        }
        if (!els.favCityResults.contains(e.target) && e.target !== els.favCityInput && e.target !== els.favSearchBtn) {
            els.favCityResults.classList.add('hidden');
        }
    });

    // Logout
    els.logoutBtn.addEventListener('click', handleLogout);

    // Toggle groups — units
    [els.tempToggle, els.windToggle].forEach(group => {
        group?.addEventListener('click', e => {
            const btn = e.target.closest('.toggle-btn');
            if (!btn) return;
            group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Favourites
    els.addFavBtn.addEventListener('click', () => {
        els.addFavForm.classList.toggle('hidden');
        els.favCityResults.classList.add('hidden');
    });
    els.cancelFavBtn.addEventListener('click', () => {
        els.addFavForm.classList.add('hidden');
        els.favCityInput.value = '';
        els.favCityResults.classList.add('hidden');
    });
    els.favSearchBtn.addEventListener('click', handleFavSearch);
    els.favCityInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleFavSearch(); });

    // Notification wizard — open
    els.addNotifBtn.addEventListener('click', () => openNotifWizard());

    // Wizard — cancel (step 1)
    els.cancelNotifBtn.addEventListener('click', closeNotifWizard);

    // Wizard — back buttons
    els.wizBackBtn2Mode.addEventListener('click',    () => showWizardStep('wizStep1'));
    els.wizBackBtn2Instant.addEventListener('click', () => showWizardStep('wizStep1'));
    els.wizBackBtn2Offset.addEventListener('click',  () => showWizardStep('wizStep1'));
    els.wizBackBtn2Changes.addEventListener('click', () => showWizardStep('wizStep1'));

    // Wizard — mode toggle (timed vs instant)
    els.modeTimedBtn.addEventListener('click',   () => setWizMode('timed'));
    els.modeInstantBtn.addEventListener('click', () => setWizMode('instant'));

    // Wizard — offset toggle
    els.offsetToggle.addEventListener('click', e => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        els.offsetToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });

    // Wizard — save buttons
    els.saveNotifBtn.addEventListener('click',        saveNotifScheduled);
    els.saveNotifInstantBtn.addEventListener('click', saveNotifInstant);
    els.saveNotifOffsetBtn.addEventListener('click',  saveNotifOffset);
    els.saveNotifChangesBtn.addEventListener('click', saveNotifChanges);

    // Settings
    els.saveSettingsBtn.addEventListener('click', saveSettings);
    els.deleteUserBtn.addEventListener('click',   deleteUser);

    // Page Visibility API — pause animations when tab hidden
    document.addEventListener('visibilitychange', () => {
        // Sky tab visibility handled below
        // UI flourishes (not in sky container)
        const paused = document.hidden ? 'paused' : 'running';
        document.querySelectorAll('.logo-icon, .weather-icon-big').forEach(el => { el.style.animationPlayState = paused; });
        const sun = document.querySelector('.sun');
        if (sun && !sun.classList.contains('sun-static')) {
            sun.querySelectorAll('.sun-ray, .sun-core, .sun-glow').forEach(el => { el.style.animationPlayState = paused; });
        }
        const moon = document.querySelector('.moon');
        if (moon) moon.style.animationPlayState = paused;
    });
}

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════

function init() {
    // Initial sky render based on time of day (before weather loads)
    const hour = new Date().getHours();
    updateSkyScene(0, hour >= 6 && hour < 20 ? 1 : 0, hour);

    // Clock
    startClock();

    // Re-render sky every minute — only if hour changed
    let _lastSkyHour = -1;
    setInterval(() => {
        const h = new Date().getHours();
        if (h !== _lastSkyHour) {
            _lastSkyHour = h;
            updateSkyScene(state.weatherCode, state.isDay, h);
        }
    }, 60_000);

    // Entry animation
    setTimeout(playEntryAnimation, 200);

    // Event listeners
    initEventListeners();

    // Check Discord auth state
    checkAuth();

    // Load weather (geolocation or default)
    tryGeolocation();
}

document.addEventListener('DOMContentLoaded', init);
