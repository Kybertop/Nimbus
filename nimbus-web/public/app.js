(() => {
'use strict';

const WMO={0:{e:'<i class="fa-solid fa-sun" style="color:#fbbf24"></i>',t:'Jasno'},1:{e:'<i class="fa-solid fa-cloud-sun" style="color:#fbbf24"></i>',t:'Prevažne jasno'},2:{e:'<i class="fa-solid fa-cloud-sun" style="color:#fbbf24"></i>',t:'Polojasno'},3:{e:'<i class="fa-solid fa-cloud" style="color:#a5b4c8"></i>',t:'Zamračené'},45:{e:'<i class="fa-solid fa-smog" style="color:#a5b4c8"></i>',t:'Hmla'},48:{e:'<i class="fa-solid fa-smog" style="color:#a5b4c8"></i>',t:'Námraza'},51:{e:'<i class="fa-solid fa-cloud-sun-rain" style="color:#60a5fa"></i>',t:'Mrholenie'},53:{e:'<i class="fa-solid fa-cloud-sun-rain" style="color:#60a5fa"></i>',t:'Mrholenie'},55:{e:'<i class="fa-solid fa-cloud-rain" style="color:#38bdf8"></i>',t:'Husté mrholenie'},56:{e:'<i class="fa-solid fa-cloud-rain" style="color:#38bdf8"></i>',t:'Mrznúci mrh.'},57:{e:'<i class="fa-solid fa-cloud-rain" style="color:#38bdf8"></i>',t:'Mrznúci mrh.'},61:{e:'<i class="fa-solid fa-cloud-rain" style="color:#38bdf8"></i>',t:'Mierny dážď'},63:{e:'<i class="fa-solid fa-cloud-showers-heavy" style="color:#3b82f6"></i>',t:'Dážď'},65:{e:'<i class="fa-solid fa-cloud-showers-heavy" style="color:#2563eb"></i>',t:'Silný dážď'},66:{e:'<i class="fa-solid fa-cloud-rain" style="color:#7dd3fc"></i>',t:'Mrznúci dážď'},67:{e:'<i class="fa-solid fa-cloud-rain" style="color:#7dd3fc"></i>',t:'Mrznúci dážď'},71:{e:'<i class="fa-regular fa-snowflake" style="color:#7dd3fc"></i>',t:'Sneženie'},73:{e:'<i class="fa-regular fa-snowflake" style="color:#7dd3fc"></i>',t:'Sneženie'},75:{e:'<i class="fa-solid fa-snowflake" style="color:#93c5fd"></i>',t:'Husté sneženie'},77:{e:'<i class="fa-regular fa-snowflake" style="color:#7dd3fc"></i>',t:'Snehové zrná'},80:{e:'<i class="fa-solid fa-cloud-sun-rain" style="color:#60a5fa"></i>',t:'Prehánky'},81:{e:'<i class="fa-solid fa-cloud-showers-heavy" style="color:#3b82f6"></i>',t:'Silné prehánky'},82:{e:'<i class="fa-solid fa-cloud-showers-heavy" style="color:#2563eb"></i>',t:'Prudký lejak'},85:{e:'<i class="fa-regular fa-snowflake" style="color:#7dd3fc"></i>',t:'Sneh. prehánky'},86:{e:'<i class="fa-solid fa-snowflake" style="color:#93c5fd"></i>',t:'Silné sneh. prehánky'},95:{e:'<i class="fa-solid fa-cloud-bolt" style="color:#fbbf24"></i>',t:'Búrka'},96:{e:'<i class="fa-solid fa-cloud-bolt" style="color:#fbbf24"></i>',t:'Búrka s krupobitím'},99:{e:'<i class="fa-solid fa-cloud-bolt" style="color:#f87171"></i>',t:'Silná búrka'}};
const wm = (c, isNight) => {
    const base = WMO[c]||WMO[0];
    if (!isNight) return base;
    if (c === 0) return {e:'<i class="fa-solid fa-moon" style="color:#e8e2d0"></i>',t:'Jasno'};
    if (c === 1 || c === 2) return {e:'<i class="fa-solid fa-cloud-moon" style="color:#cbd5e1"></i>',t:base.t};
    return base;
};

const NAMEDAYS=["","Drahomíra","Alexandra","Daniela","Drahoslav","Andrea","Antónia","Bohuslava","Severín","Alexej","Dáša","Malvína","Ernest","Rastislav","Radovan","Dobroslav","Kristína","Nataša","Bohdana","Drahomíra","Dalibor","Vincent","Zora","Miloš","Timotej","Gejza","Tamara","Bohuš","Alfonz","Gašpar","Ema","Emil",
"Tatiana","Erika","Blažej","Verona","Agáta","Dorota","Vanda","Zoja","Zdenko","Gabriela","Dezider","Perla","Valentín","Pravoslav","Ida","Miloslava","Jaromír","Vlasta","Lívia","Eleonóra","Etela","Roman","Matej","Frederik","Viktor","Alexander","Zlatica","Radomír",
"Albín","Anežka","Bohumil","Kazimír","Fridrich","Radoslav","Tomáš","Alan","Františka","Branislav","Angela","Gregor","Vlastimil","Matilda","Svetlana","Boleslav","Ľubica","Eduard","Jozef","Víťazoslav","Blahoslav","Beňadik","Adrián","Gabriel","Marián","Dušan","Renáta","Soňa","Miroslav","Vieroslava","Benjamín",
"Hugo","Zita","Richard","Izidor","Miroslava","Irena","Zoltán","Albert","Milena","Igor","Július","Estera","Aleš","Justína","Fedor","Dana","Rudolf","Valér","Jela","Marcel","Jaroslav","Slavomír","Želmíra","Vojtech","Juraj","Jaroslava","Jaroslav","Jarmila","Lea","Anastázia",
"Sviatok práce","Žigmund","Galina","Florián","Lesana","Hermína","Monika","Ingrida","Roland","Viktória","Blažena","Pankrác","Servác","Bonifác","Žofia","Svetozár","Gizela","Viola","Gertrúda","Bernard","Zina","Júlia","Želmíra","Ela","Urban","Dušan","Iveta","Viliam","Vilma","Ferdinand","Petronela",
"Žaneta","Xénia","Karolína","Lenka","Laura","Norbert","Róbert","Medard","Stanislava","Margaréta","Dobroslava","Zlatko","Anton","Vasil","Vít","Blanka","Adolf","Vratislav","Alfréd","Valéria","Alojz","Paulína","Sidónia","Ján","Olívia","Adriána","Ladislav","Beáta","Peter a Pavol","Melánia",
"Diana","Berta","Miloslav","Prokop","Cyril a Metod","Patrícia","Oliver","Ivan","Lujza","Amália","Milota","Nina","Margita","Kamil","Henrich","Drahomír","Bohuslav","Kamila","Dušana","Iľja","Daniel","Magdaléna","Oľga","Vladimír","Jakub","Anna","Božena","Krištof","Marta","Libuša","Ignác",
"Božidara","Gustáv","Jerguš","Dominik","Hortenzia","Jozefína","Štefánia","Oskár","Ľubomíra","Vavrinec","Zuzana","Darina","Ľubomír","Mojmír","Marcela","Leonard","Milica","Elena","Lýdia","Anabela","Jana","Tichomír","Filip","Bartolomej","Ľudovít","Samuel","Silvia","Augustín","Nikola","Ružena","Nora",
"Drahoslava","Linda","Belo","Rozália","Regina","Alica","Marianna","Miriama","Martina","Oleg","Bystrík","Mária","Ctibor","Ľudomil","Jolana","Ľudmila","Olympia","Eugénia","Konštantín","Ľuboslav","Matúš","Móric","Zdenka","Ľuboš","Vladislav","Edita","Cyprián","Václav","Michal","Jarolím",
"Arnold","Levoslav","Stela","František","Viera","Natália","Eliška","Brigita","Dionýz","Slavomíra","Valentína","Maximilián","Koloman","Boris","Terézia","Vladimíra","Hedviga","Lukáš","Kristián","Vendelín","Uršuľa","Sergej","Alojzia","Kvetoslava","Aurel","Demeter","Sabína","Dobromila","Klára","Šimon a Júda","Aurélia",
"Denis","Hubert","Karol","Imrich","Renáta","René","Bohumír","Teodor","Tibor","Maroš","Svätopluk","Stanislav","Irma","Leopold","Agnesa","Klaudia","Eugen","Félix","Alžbeta","Elvíra","Cecília","Klement","Emília","Katarína","Kornel","Milan","Henrieta","Vratko","Štefan","Ondrej",
"Edmund","Bibiána","Oldrich","Barbora","Oto","Mikuláš","Ambróz","Marína","Izabela","Radúz","Hilda","Otília","Lucia","Branislava","Ivica","Albína","Kornélia","Sláva","Judita","Dagmara","Bohdan","Adela","Nadežda","Adam a Eva","1. sviatok vianočný","Štefan","Filoména","Ivana","Milada","Dávid","Silvester"];

function getNameday() {
    const d = new Date();
    const dayOfYear = Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000);
    return NAMEDAYS[dayOfYear] || '';
}

function getMoonPhase(date) {
    const d = date||new Date();
    const jd = Math.floor(365.25*(d.getFullYear()+4716))+Math.floor(30.6001*(d.getMonth()<2?d.getMonth()+14:d.getMonth()+2))+d.getDate()-1524.5;
    const p = (((jd-2451549.5)/29.53059)%1+1)%1;
    const illum = Math.round((1-Math.cos(p*2*Math.PI))*50);
    const waxing = p<0.5;
    const syn = Math.round(p*29.53);
    let name;
    if (illum<3) name='Nov'; else if (illum<25&&waxing) name='Dorastajúci kosáčik';
    else if (illum<50&&waxing) name='Prvá štvrť'; else if (illum<75&&waxing) name='Dorastajúci hrbol';
    else if (illum>=97) name='Spln'; else if (illum>=75&&!waxing) name='Ubúdajúci hrbol';
    else if (illum>=50&&!waxing) name='Posledná štvrť'; else if (illum>=25&&!waxing) name='Ubúdajúci kosáčik';
    else name = waxing?'Dorastajúci':'Ubúdajúci';
    return {illum,waxing,syn,name};
}

function renderMoonSvg(illum, waxing, size) {
    const r=size/2, s=size/24, dark='#252d3a', frac=Math.max(0,Math.min(100,illum))/100;
    if (frac<0.01) return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="${dark}"/></svg>`;
    if (frac>0.99) return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="#ede8d8"/><circle cx="${9*s}" cy="${8*s}" r="${3.5*s}" fill="#d0c8a8" opacity=".4"/><circle cx="${15*s}" cy="${6*s}" r="${2*s}" fill="#c5bda5" opacity=".35"/><circle cx="${7*s}" cy="${15*s}" r="${2.8*s}" fill="#c0b89c" opacity=".3"/></svg>`;
    const f=frac*2-1, bulge=Math.max(0.1,Math.abs(f)*r);
    const lp = waxing
        ? `M ${r},0 A ${r},${r} 0 0,0 ${r},${size} A ${bulge},${r} 0 0,${f>=0?0:1} ${r},0 Z`
        : `M ${r},0 A ${r},${r} 0 0,1 ${r},${size} A ${bulge},${r} 0 0,${f>=0?1:0} ${r},0 Z`;
    const id = 'mc'+Math.random().toString(36).slice(2,7);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><clipPath id="${id}"><path d="${lp}"/></clipPath></defs><circle cx="${r}" cy="${r}" r="${r}" fill="${dark}"/><g clip-path="url(#${id})"><circle cx="${r}" cy="${r}" r="${r}" fill="#ede8d8"/><circle cx="${9*s}" cy="${8*s}" r="${3.5*s}" fill="#d0c8a8" opacity=".4"/><circle cx="${15*s}" cy="${6*s}" r="${2*s}" fill="#c5bda5" opacity=".35"/><circle cx="${7*s}" cy="${15*s}" r="${2.8*s}" fill="#c0b89c" opacity=".3"/></g></svg>`;
}

function getUvLabel(uv) {
    if (uv<=2) return {t:'Nízky',c:'#34d399'};if (uv<=5) return {t:'Stredný',c:'#fbbf24'};
    if (uv<=7) return {t:'Vysoký',c:'#f97316'};if (uv<=10) return {t:'Veľmi vysoký',c:'#ef4444'};
    return {t:'Extrémny',c:'#a855f7'};
}
function getAqiInfo(v) {
    if (v<=20) return {l:'Výborný',c:'#34d399'};if (v<=40) return {l:'Dobrý',c:'#a3e635'};
    if (v<=60) return {l:'Stredný',c:'#fbbf24'};if (v<=80) return {l:'Zlý',c:'#f97316'};
    return {l:'Veľmi zlý',c:'#ef4444'};
}
function getWindDir(deg) {
    const dirs=['S','SSV','SV','VSV','V','VJV','JV','JJV','J','JJZ','JZ','ZJZ','Z','ZSZ','SZ','SSZ'];
    return dirs[Math.round(deg/22.5)%16];
}

function getTempUnit() { return localStorage.getItem('nimbus_temp')||'°C'; }
function getWindUnit() { return localStorage.getItem('nimbus_wind')||'km/h'; }

function convTemp(c) {
    const u = getTempUnit();
    return u === '°F' ? Math.round(c * 9/5 + 32) : Math.round(c);
}
function tempSym() { return getTempUnit(); }

function convWind(kmh) {
    const u = getWindUnit();
    if (u === 'm/s') return (kmh / 3.6).toFixed(1);
    if (u === 'mph') return Math.round(kmh / 1.609);
    return Math.round(kmh);
}
function windSym() { return getWindUnit(); }

const $=id=>document.getElementById(id);
const TABS_ROW1 = [{id:'today',l:'Dnes'},{id:'7d',l:'7 dní'},{id:'14d',l:'14 dní'}];
const TABS_ROW2 = [{id:'air',l:'Vzduch'},{id:'nice',l:'Pekne?'},{id:'outfit',l:'Outfit'},{id:'traffic',l:'Doprava'},{id:'moon',l:'Mesiac'},{id:'history',l:'História'}];

let state = {lat:null,lon:null,tz:'auto',city:null,weatherCode:0,isDay:1,currentData:null,dailyData:null,hourlyData:null,cityHour:null,discordUser:null,userData:null};
let activeTab = 'today';

function startClock() {
    const update = () => {
        const now = new Date();
        const h = state.cityHour!=null?state.cityHour:now.getHours();
        $('headerTime').textContent = String(h).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    };
    update();
    setInterval(update, 10000);
}

function renderStats(c, d) {
    const uvInfo = getUvLabel(d?.uv_index_max?.[0]||0);
    const sunrise = d?.sunrise?.[0]?new Date(d.sunrise[0]):null;
    const sunset = d?.sunset?.[0]?new Date(d.sunset[0]):null;
    const fmt = dt => dt?`${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`:'—';

    const stats = [
        {i:'<i class="fa-solid fa-droplet" style="color:#38bdf8"></i>',l:'Vlhkosť',v:`${c.relative_humidity_2m||0}%`},
        {i:'<i class="fa-solid fa-wind" style="color:#a5b4fc"></i>',l:'Vietor',v:`${convWind(c.wind_speed_10m||0)} ${windSym()}`,s:`${getWindDir(c.wind_direction_10m||0)} · Nár. ${convWind(c.wind_gusts_10m||0)}`},
        {i:'<i class="fa-solid fa-sun" style="color:#fbbf24"></i>',l:'UV Index',v:String(d?.uv_index_max?.[0]||0),s:uvInfo.t,a:uvInfo.c},
        {i:'<i class="fa-solid fa-gauge" style="color:#a78bfa"></i>',l:'Tlak',v:`${Math.round(c.surface_pressure||0)} hPa`},
        {i:'<i class="fa-solid fa-sun" style="color:#fb923c"></i>',l:'Slnko',v:`↑${fmt(sunrise)}`,s:`↓${fmt(sunset)}`},
        {i:'<i class="fa-solid fa-cloud" style="color:#94a3b8"></i>',l:'Oblačnosť',v:`${c.cloud_cover||0}%`},
    ];

    $('statsGrid').innerHTML = stats.map(s =>
        `<div class="stat-card"><div class="stat-label"><span>${s.i}</span>${s.l}</div><div class="stat-value"${s.a?` style="color:${s.a}"`:''}>` +
        `${s.v}</div>${s.s?`<div class="stat-sub">${s.s}</div>`:''}</div>`
    ).join('');
}

function renderTabs() {
    $('tabsRow1').innerHTML = TABS_ROW1.map(t =>
        `<button class="tab-btn${activeTab===t.id?' active':''}" data-tab="${t.id}">${t.l}</button>`
    ).join('');
    $('tabsRow2').innerHTML = TABS_ROW2.map(t =>
        `<button class="tab-btn${activeTab===t.id?' active':''}" data-tab="${t.id}">${t.l}</button>`
    ).join('');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => { activeTab = btn.dataset.tab; renderTabs(); renderTabContent(); });
    });
}

function renderTabContent() {
    const el = $('tabInner');
    switch(activeTab) {
        case 'today': return renderToday(el);
        case '7d': return renderDaily(el, 7);
        case '14d': return renderDaily(el, 14);
        case 'air': return renderAir(el);
        case 'nice': return renderNice(el);
        case 'outfit': return renderOutfit(el);
        case 'traffic': return renderTraffic(el);
        case 'moon': return renderMoon(el);
        case 'history': return renderHistory(el);
        default: el.innerHTML = '';
    }
}

function renderToday(el) {
    const c = state.currentData, d = state.dailyData, h = state.hourlyData;
    if (!c||!d||!h) { el.innerHTML='<p style="color:rgba(255,255,255,0.5)">Načítavam…</p>'; return; }
    const sunrise = d.sunrise?.[0]?new Date(d.sunrise[0]):null;
    const sunset = d.sunset?.[0]?new Date(d.sunset[0]):null;
    const fmt = dt => dt?`${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`:'—';
    const nameday = getNameday();
    const hour = state.cityHour!=null?state.cityHour:new Date().getHours();

    let html = '<div class="today-grid">';
    html += `<div class="info-card"><div class="info-card-label"><i class="fa-solid fa-temperature-half" style="color:#f87171"></i> Teplota</div><div class="info-card-value">↑${convTemp(d.temperature_2m_max?.[0])}° ↓${convTemp(d.temperature_2m_min?.[0])}°</div></div>`;
    html += `<div class="info-card"><div class="info-card-label"><i class="fa-solid fa-wind" style="color:#a5b4fc"></i> Vietor</div><div class="info-card-value">Max ${convWind(d.wind_speed_10m_max?.[0]||0)} ${windSym()}</div></div>`;
    html += `<div class="info-card"><div class="info-card-label"><i class="fa-solid fa-sun" style="color:#fb923c"></i> Slnko</div><div class="info-card-value">↑${fmt(sunrise)} ↓${fmt(sunset)}</div></div>`;
    if (nameday) html += `<div class="info-card"><div class="info-card-label"><i class="fa-solid fa-cake-candles" style="color:#f472b6"></i> Meniny</div><div class="info-card-value">${nameday}</div></div>`;
    html += '</div>';
    html += '<div class="section-label">Hodinová predpoveď</div>';

    for (let i=0;i<h.time.length;i++) {
        const hh = new Date(h.time[i]).getHours();
        if (hh < hour) continue;
        const info = wm(h.weather_code[i], new Date(h.time[i]).getHours()<6||new Date(h.time[i]).getHours()>=20);
        const rain = h.precipitation_probability?.[i]||0;
        html += `<div class="today-hourly"><span class="time">${String(hh).padStart(2,'0')}:00</span><span class="icon">${info.e}</span><span class="temp">${convTemp(h.temperature_2m[i])}${tempSym()}</span><span class="rain${rain>0?' has':''}">${rain>0?rain+'%':''}</span><span class="wind">${convWind(h.wind_speed_10m[i])} ${windSym()}</span></div>`;
    }
    el.innerHTML = html;
}

function renderDaily(el, days) {
    if (!state.dailyData) { el.innerHTML=''; return; }
    const dayNames=['Ne','Po','Ut','St','Št','Pi','So'];
    let html = '<div class="daily-legend"><span>Deň</span><span></span><span>Rozsah teplôt</span><span style="text-align:right"><i class="fa-solid fa-droplet" style="font-size:9px;color:#38bdf8"></i></span><span style="text-align:right">Min</span><span style="text-align:right">Max</span><span></span></div>';

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=${state.tz}&forecast_days=${days}`;
    fetch(url).then(r=>r.json()).then(data => {
        const d = data.daily;
        const maxH = Math.max(...d.temperature_2m_max);
        const minL = Math.min(...d.temperature_2m_min);
        const range = maxH-minL||1;

        for (let i=0;i<d.time.length;i++) {
            const date = new Date(d.time[i]);
            const info = wm(d.weather_code[i]);
            const rain = d.precipitation_probability_max?.[i]||0;
            const bl = ((d.temperature_2m_min[i]-minL)/range)*100;
            const bw = ((d.temperature_2m_max[i]-d.temperature_2m_min[i])/range)*100;
            const dayLabel = i===0?'Dnes':dayNames[date.getDay()];

            html += `<div class="daily-row" data-idx="${i}" data-date="${d.time[i]}">`;
            html += `<span class="daily-day${i===0?' today':''}">${dayLabel}</span>`;
            html += `<span class="daily-icon">${info.e}</span>`;
            html += `<div class="daily-bar"><div class="daily-bar-fill" style="left:${bl}%;width:${Math.max(bw,10)}%"></div></div>`;
            html += `<span class="daily-rain ${rain>0?'has':'none'}">${rain}%</span>`;
            html += `<span class="daily-low">${convTemp(d.temperature_2m_min[i])}°</span>`;
            html += `<span class="daily-high">${convTemp(d.temperature_2m_max[i])}°</span>`;
            html += `<span class="daily-arrow">▼</span>`;
            html += `</div><div class="daily-detail hidden" id="detail-${i}"></div>`;
        }
        el.innerHTML = html;

        el.querySelectorAll('.daily-row').forEach(row => {
            row.addEventListener('click', () => {
                const idx = row.dataset.idx;
                const detail = $('detail-'+idx);
                const arrow = row.querySelector('.daily-arrow');
                const wasOpen = !detail.classList.contains('hidden');
                el.querySelectorAll('.daily-detail').forEach(dd => dd.classList.add('hidden'));
                el.querySelectorAll('.daily-arrow').forEach(a => a.classList.remove('open'));
                if (!wasOpen) {
                    detail.classList.remove('hidden');
                    arrow.classList.add('open');
                    if (!detail.dataset.loaded) loadDayHourly(detail, row.dataset.date);
                }
            });
        });
    });
}

function loadDayHourly(container, dateStr) {
    container.innerHTML = '<div style="text-align:center;padding:8px"><div class="spinner sm"></div></div>';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&timezone=${state.tz}&start_date=${dateStr}&end_date=${dateStr}`;
    fetch(url).then(r=>r.json()).then(data => {
        const h = data.hourly;
        let html = '';
        for (let i=0;i<h.time.length;i++) {
            const hh = new Date(h.time[i]).getHours();
            const info = wm(h.weather_code[i], new Date(h.time[i]).getHours()<6||new Date(h.time[i]).getHours()>=20);
            const rain = h.precipitation_probability?.[i]||0;
            html += `<div class="hourly-sub"><span class="time">${String(hh).padStart(2,'0')}:00</span><span class="icon">${info.e}</span><span class="temp">${convTemp(h.temperature_2m[i])}${tempSym()}</span><span class="rain ${rain>0?'has':'none'}">${rain}%</span><span class="wind">${convWind(h.wind_speed_10m[i])} ${windSym()}</span></div>`;
        }
        container.innerHTML = html;
        container.dataset.loaded = '1';
    }).catch(() => { container.innerHTML = '<p style="color:rgba(255,255,255,0.5);font-size:12px">Chyba</p>'; });
}

function renderAir(el) {
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${state.lat}&longitude=${state.lon}&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide`).then(r=>r.json()).then(data => {
        const c = data.current;
        const aqi = c.european_aqi||0;
        const info = getAqiInfo(aqi);
        const bars = [
            {l:'PM2.5',v:c.pm2_5,m:50,u:'μg/m³',c:'#38bdf8'},
            {l:'PM10',v:c.pm10,m:80,u:'μg/m³',c:'#818cf8'},
            {l:'NO₂',v:c.nitrogen_dioxide,m:100,u:'μg/m³',c:'#f472b6'},
            {l:'O₃',v:c.ozone,m:120,u:'μg/m³',c:'#34d399'},
            {l:'SO₂',v:c.sulphur_dioxide,m:50,u:'μg/m³',c:'#fbbf24'},
        ];
        el.innerHTML = `<div class="aqi-hero"><div class="aqi-value" style="color:${info.c}">${aqi}</div><div class="aqi-label" style="color:${info.c}">${info.l}</div><div class="aqi-sub">European AQI</div></div>` +
            bars.map(b => `<div class="aqi-bar"><span class="aqi-bar-label">${b.l}</span><div class="aqi-bar-track"><div class="aqi-bar-fill" style="width:${Math.min((b.v/b.m)*100,100)}%;background:${b.c}"></div></div><span class="aqi-bar-val">${(b.v||0).toFixed(1)} ${b.u}</span></div>`).join('');
    });
}

function renderNice(el) {
    if (!state.currentData||!state.dailyData) return;
    const c=state.currentData, d=state.dailyData;
    const temp=c.temperature_2m||0, wind=c.wind_speed_10m||0, cloud=c.cloud_cover||0;
    const rain = d.precipitation_probability_max?.[0]||0;
    const uv = d.uv_index_max?.[0]||0;
    const tS = temp>=18&&temp<=28?90:temp>=12&&temp<=32?65:30;
    const rS = rain<10?95:rain<40?65:25;
    const wS = wind<15?85:wind<30?55:20;
    const uS = uv<=5?80:uv<=7?55:25;
    const cS = cloud<30?90:cloud<70?60:30;
    const scores = [{l:'Teplota',v:tS,n:tS>70?'Príjemná':'Menej ideálna'},{l:'Zrážky',v:rS,n:rS>70?'Bez dažďa':'Možný dážď'},{l:'Vietor',v:wS,n:wS>70?'Mierny':'Silnejší'},{l:'UV index',v:uS,n:uS>70?'Nízky':'Vyšší'},{l:'Oblačnosť',v:cS,n:cS>70?'Málo oblakov':'Oblačno'}];
    const tot = Math.round(scores.reduce((s,x)=>s+x.v,0)/scores.length);
    const tc = tot>70?'#34d399':tot>40?'#fbbf24':'#ef4444';
    el.innerHTML = `<div style="text-align:center;padding:10px 0"><div class="nice-circle" style="background:${tc}20;border:2px solid ${tc}50"><span class="nice-score" style="color:${tc}">${tot}%</span></div><div style="font-size:15px;font-weight:600">${tot>70?'Skvelé počasie na vonku!':tot>40?'Ide to, ale pozor.':'Radšej zostaň vnútri.'}</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:3px">Celkové hodnotenie</div></div>` +
        scores.map(s => {const c2=s.v>70?'#34d399':s.v>40?'#a3e635':'#fbbf24';return `<div class="nice-row" style="margin-top:10px"><span class="nice-label">${s.l}</span><div class="nice-track"><div class="nice-fill" style="width:${s.v}%;background:${c2}"></div></div><span class="nice-note">${s.n}</span></div>`;}).join('');
}

function renderOutfit(el) {
    if (!state.currentData) return;
    const c=state.currentData, d=state.dailyData;
    const feelsC = c.apparent_temperature;
    const temp=convTemp(c.temperature_2m), feels=convTemp(feelsC);
    const wind=convWind(c.wind_speed_10m), rain=d?.precipitation_probability_max?.[0]||0;
    let layers=[],footwear='<i class="fa-solid fa-shoe-prints" style="color:#a78bfa"></i> Tenisky',accessories=[];
    if(feelsC<0){layers=['<i class="fa-solid fa-vest" style="color:#60a5fa"></i> Zimný kabát','<i class="fa-solid fa-scarf" style="color:#f472b6"></i> Šál','<i class="fa-solid fa-mitten" style="color:#fbbf24"></i> Rukavice'];footwear='<i class="fa-solid fa-boot" style="color:#a78bfa"></i> Zimné topánky';accessories=['<i class="fa-solid fa-mitten" style="color:#fbbf24"></i> Hrubé rukavice']}
    else if(feelsC<10){layers=['<i class="fa-solid fa-vest" style="color:#60a5fa"></i> Kabát','<i class="fa-solid fa-shirt" style="color:#34d399"></i> Tričko'];footwear='<i class="fa-solid fa-shoe-prints" style="color:#a78bfa"></i> Uzavretá obuv'}
    else if(feelsC<20){layers=['<i class="fa-solid fa-vest" style="color:#60a5fa"></i> Mikina','<i class="fa-solid fa-shirt" style="color:#34d399"></i> Tričko']}
    else{layers=['<i class="fa-solid fa-shirt" style="color:#34d399"></i> Tričko','<i class="fa-solid fa-shorts" style="color:#38bdf8"></i> Krátke nohavice'];accessories=['<i class="fa-solid fa-glasses" style="color:#fbbf24"></i> Slnečné okuliare']}
    if(rain>50) accessories.push('<i class="fa-solid fa-umbrella" style="color:#60a5fa"></i> Dáždnik');
    if(feelsC>25) accessories.push('<i class="fa-solid fa-pump-soap" style="color:#fb923c"></i> Opaľovací krém');

    const isNight = state.cityHour!=null && (state.cityHour<6 || state.cityHour>=20);
    el.innerHTML = `<div style="text-align:center"><div style="font-size:42px;margin-bottom:6px">${wm(c.weather_code, isNight).e}</div><div style="font-size:15px;font-weight:600">${feels}${tempSym()} pocitová</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px">${temp}${tempSym()} skutočná · <i class="fa-solid fa-wind" style="color:#a5b4fc"></i> ${wind} ${windSym()}</div></div>` +
        `<div style="margin-top:14px"><div class="section-label">Oblečenie</div><div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${layers.map(l=>`<span class="outfit-pill">${l}</span>`).join('')}</div></div>` +
        `<div style="margin-top:14px"><div class="section-label">Obuv</div><div style="text-align:center"><span class="outfit-pill">${footwear}</span></div></div>` +
        (accessories.length?`<div style="margin-top:14px"><div class="section-label">Doplnky</div><div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${accessories.map(a=>`<span class="outfit-pill">${a}</span>`).join('')}</div></div>`:'')+
        `<div class="outfit-tip" style="margin-top:14px"><i class="fa-solid fa-lightbulb" style="color:#fbbf24"></i> ${feelsC>22?'Ideálne počasie na prechádzku.':feelsC>10?'Vhodné na vonkajšie aktivity s vrstvami.':'Oblečte sa teplo!'}</div>`;
}

function renderTraffic(el) {
    if (!state.currentData) return;
    const c=state.currentData;
    const code=c.weather_code;
    const warnings = [];
    if([66,67].includes(code)) warnings.push({l:'high',t:'Poľadovica'});
    if([71,73,75,85,86].includes(code)) warnings.push({l:'high',t:'Sneh na cestách'});
    if([95,96,99].includes(code)) warnings.push({l:'high',t:'Búrka'});
    if([65,82].includes(code)) warnings.push({l:'medium',t:'Silný dážď'});

    const safe = warnings.length===0;
    const items = [{l:'Viditeľnosť',v:safe?'Dobrá':'Znížená',i:'<i class="fa-solid fa-eye" style="color:#60a5fa"></i>'},{l:'Cesty',v:[71,73,75,85,86,66,67].includes(code)?'Klzké':'Suché',i:'<i class="fa-solid fa-road" style="color:#94a3b8"></i>'},{l:'Vietor',v:c.wind_speed_10m>40?'Silný':c.wind_speed_10m>20?'Stredný':'Slabý',i:'<i class="fa-solid fa-wind" style="color:#a5b4fc"></i>'},{l:'Zrážky',v:`${c.precipitation||0} mm`,i:'<i class="fa-solid fa-cloud-rain" style="color:#38bdf8"></i>'}];

    el.innerHTML = `<div style="text-align:center;padding:14px 0"><div class="traffic-ok" style="${safe?'':'background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);color:#ef4444'}">${safe?'<i class="fa-solid fa-check"></i>':'<i class="fa-solid fa-triangle-exclamation"></i>'}</div><div style="font-size:16px;font-weight:600;color:${safe?'#34d399':'#ef4444'}">${safe?'Bezpečné podmienky':'Pozor na cestách!'}</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:3px">${safe?'Žiadne výstrahy':warnings.map(w=>w.t).join(', ')}</div></div>` +
        `<div class="traffic-grid">${items.map(x=>`<div class="info-card"><div class="info-card-label">${x.i} ${x.l}</div><div class="info-card-value">${x.v}</div></div>`).join('')}</div>`;
}

function renderMoon(el) {
    const dayNames=['Ne','Po','Ut','St','Št','Pi','So'];
    let html = '';
    for(let i=0;i<14;i++){
        const d = new Date(); d.setDate(d.getDate()+i);
        const mp = getMoonPhase(d);
        const svg = renderMoonSvg(mp.illum, mp.waxing, 18);
        html += `<div class="moon-row"><span class="moon-date${i===0?' today':''}">${dayNames[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}.</span><span>${svg}</span><span class="moon-name">${mp.name}</span><span class="moon-phase">Deň ${mp.syn} · ${mp.illum}%</span></div>`;
    }
    el.innerHTML = html;
}

function renderHistory(el) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=${state.tz}&past_days=7&forecast_days=1`;
    fetch(url).then(r=>r.json()).then(data => {
        const d = data.daily;
        const maxT = Math.max(...d.temperature_2m_max);
        let html = '<div class="section-label">Posledných 7 dní</div><div class="history-bars">';
        for(let i=0;i<d.time.length-1;i++){
            const date = new Date(d.time[i]);
            const h = Math.max(20, (d.temperature_2m_max[i]/maxT)*90);
            html += `<div class="history-bar"><span class="history-bar-high">${convTemp(d.temperature_2m_max[i])}°</span><div class="history-bar-fill" style="height:${h}px"></div><span class="history-bar-low">${convTemp(d.temperature_2m_min[i])}°</span><span class="history-bar-date">${date.getDate()}.${date.getMonth()+1}.</span></div>`;
        }
        html += '</div>';
        const avgMax = d.temperature_2m_max.slice(0,-1).reduce((s,v)=>s+v,0)/(d.time.length-1);
        const avgMin = d.temperature_2m_min.slice(0,-1).reduce((s,v)=>s+v,0)/(d.time.length-1);
        const totalRain = d.precipitation_sum.slice(0,-1).reduce((s,v)=>s+v,0).toFixed(1);
        const maxWind = Math.max(...d.wind_speed_10m_max.slice(0,-1));
        [{l:'Priemer max',v:convTemp(avgMax)+tempSym()},{l:'Priemer min',v:convTemp(avgMin)+tempSym()},{l:'Zrážky',v:totalRain+' mm'},{l:'Max vietor',v:convWind(maxWind)+' '+windSym()}].forEach(r => {
            html += `<div class="history-stat"><span class="history-stat-label">${r.l}</span><span class="history-stat-value">${r.v}</span></div>`;
        });
        el.innerHTML = html;
    });
}

function getWeatherIconGlyph(code, hour) {
    const isNight = hour != null && (hour < 6 || hour >= 20);
    if (code === 0) return isNight ? {char:'\uf186',color:'#e8e2d0'} : {char:'\uf185',color:'#fbbf24'};
    if (code === 1) return isNight ? {char:'\uf6c3',color:'#cbd5e1'} : {char:'\uf6c4',color:'#fbbf24'};
    if (code === 2) return isNight ? {char:'\uf6c3',color:'#cbd5e1'} : {char:'\uf6c4',color:'#fbbf24'};
    if (code === 3) return {char:'\uf0c2',color:'#a5b4c8'};
    if ([45,48].includes(code)) return {char:'\uf75f',color:'#a5b4c8'};
    if ([51,53,80].includes(code)) return {char:'\uf743',color:'#60a5fa'};
    if ([55,56,57,61,66,67].includes(code)) return {char:'\uf73d',color:'#38bdf8'};
    if ([63,65,81,82].includes(code)) return {char:'\uf740',color:'#3b82f6'};
    if ([71,73,75,77,85,86].includes(code)) return {char:'\uf2dc',color:'#93c5fd'};
    if ([95,96,99].includes(code)) return {char:'\uf76c',color:'#fbbf24'};
    return isNight ? {char:'\uf186',color:'#e8e2d0'} : {char:'\uf185',color:'#fbbf24'};
}

function updateFavicon(code, hour) {
    const icon = getWeatherIconGlyph(code, hour);
    const draw = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.font = '900 44px "Font Awesome 6 Free"';
        ctx.fillStyle = icon.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon.char, 32, 33);
        let link = document.querySelector('link[rel="icon"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = canvas.toDataURL('image/png');
    };
    if (document.fonts && document.fonts.ready) {
        document.fonts.load('900 44px "Font Awesome 6 Free"').then(draw).catch(draw);
    } else {
        draw();
    }
}

async function loadWeather(lat, lon, tz, cityName) {
    state.lat=lat;state.lon=lon;state.tz=tz;state.city=cityName;
    const ci = $('cityInput');
    if (ci) ci.value = cityName;
    $('weatherLoading').classList.remove('hidden');
    $('heroData').classList.add('hidden');
    $('mainPanel').classList.add('hidden');

    try {
        const vars = 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure';
        const dailyVars = 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max';
        const hourlyVars = 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m';
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${vars}&daily=${dailyVars}&hourly=${hourlyVars}&timezone=${tz}&forecast_days=1`;
        const data = await (await fetch(url)).json();
        const c = data.current, d = data.daily;
        state.currentData=c; state.dailyData=d; state.hourlyData=data.hourly;
        state.weatherCode=c.weather_code; state.isDay=c.is_day;
        const cityTime = c.time?new Date(c.time):new Date();
        state.cityHour = cityTime.getHours();

        const nightNow = state.cityHour<6 || state.cityHour>=20;
        $('heroTemp').textContent = convTemp(c.temperature_2m)+'°';
        $('heroDesc').textContent = wm(c.weather_code, nightNow).t;
        $('heroSub').textContent = `Pocitová: ${convTemp(c.apparent_temperature)}°  H:${convTemp(d.temperature_2m_max[0])}°  L:${convTemp(d.temperature_2m_min[0])}°`;

        $('weatherLoading').classList.add('hidden');
        $('heroData').classList.remove('hidden');
        $('mainPanel').classList.remove('hidden');

        renderStats(c, d);
        renderTabs();
        renderTabContent();
        Sky.update(c.weather_code, state.cityHour);
        updateFavicon(c.weather_code, state.cityHour);
        document.title = `${convTemp(c.temperature_2m)}° ${wm(c.weather_code, nightNow).t} · Nimbus`;
    } catch(err) {
        console.error('Weather fetch failed:', err);
        $('weatherLoading').innerHTML = '<p style="color:#f87171">Počasie sa nepodarilo načítať.</p>';
    }
}

function setupSearch() {
    const input = $('cityInput');
    const results = $('cityResults');
    let timer;

    input.addEventListener('input', () => {
        clearTimeout(timer);
        const q = input.value.trim();
        if (q.length < 2) { results.classList.add('hidden'); return; }
        timer = setTimeout(async () => {
            try {
                const data = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=sk`)).json();
                const r = data.results||[];
                if (!r.length) { results.innerHTML='<div class="city-result">Žiadne výsledky</div>'; results.classList.remove('hidden'); return; }
                results.innerHTML = r.map(c => `<div class="city-result" data-lat="${c.latitude}" data-lon="${c.longitude}" data-tz="${c.timezone||'auto'}" data-name="${c.name}${c.country?', '+c.country:''}"><div>${c.name}</div><div class="city-result-sub">${[c.admin1,c.country].filter(Boolean).join(', ')}</div></div>`).join('');
                results.classList.remove('hidden');
                results.querySelectorAll('.city-result').forEach(el => {
                    el.addEventListener('click', () => {
                        loadWeather(parseFloat(el.dataset.lat), parseFloat(el.dataset.lon), el.dataset.tz, el.dataset.name);
                        input.value = el.dataset.name;
                        results.classList.add('hidden');
                    });
                });
            } catch {}
        }, 300);
    });

    input.addEventListener('keydown', e => { if(e.key==='Enter') input.dispatchEvent(new Event('input')); });
    document.addEventListener('click', e => { if(!results.contains(e.target)&&e.target!==input) results.classList.add('hidden'); });
}

function setupSettings() {
    const btn = $('settingsBtn');
    const overlay = $('settingsOverlay');
    const close = $('settingsClose');
    const sheet = $('settingsSheet');

    const DISCORD_SVG = '<svg width="16" height="12" viewBox="0 0 71 55" fill="none"><path d="M60.1 4.9A58.6 58.6 0 0 0 45.6.7a40.3 40.3 0 0 0-1.8 3.6 54.2 54.2 0 0 0-16.2 0A38.6 38.6 0 0 0 25.8.7 58.5 58.5 0 0 0 11.2 4.9C1.6 19.2-.9 33.1.3 46.8a59 59 0 0 0 17.9 9 43.3 43.3 0 0 0 3.8-6.1 38.3 38.3 0 0 1-6-2.8c.5-.4 1-.7 1.5-1.1a42 42 0 0 0 35.8 0l1.5 1.1a38.4 38.4 0 0 1-6 2.9 43 43 0 0 0 3.7 6A58.8 58.8 0 0 0 70.7 46.8C72.1 31 68.2 17.2 60.1 4.9Z" fill="white"/></svg>';

    btn.addEventListener('click', () => { renderSettings(); overlay.classList.remove('hidden'); Sky.pause && Sky.pause(); });
    close.addEventListener('click', () => { overlay.classList.add('hidden'); Sky.resume && Sky.resume(); });

    async function renderSettings() {
        const tempUnit = localStorage.getItem('nimbus_temp')||'°C';
        const windUnit = localStorage.getItem('nimbus_wind')||'km/h';

        let html = '<div class="sheet-handle"></div>';
        html += '<div class="sheet-header"><span class="sheet-title"><i class="fa-solid fa-gear" style="color:#94a3b8"></i> Nastavenia</span><button class="sheet-close" id="sheetCloseBtn">✕</button></div>';

        html += '<div class="sheet-section"><div class="sheet-section-title">Zobrazenie</div>';
        html += renderToggle('Teplota', ['°C','°F'], tempUnit, 'tempUnit');
        html += renderToggle('Vietor', ['km/h','m/s','mph'], windUnit, 'windUnit');
        html += '</div>';

        html += '<div class="sheet-section"><div class="sheet-section-title">Discord Bot</div>';
        html += '<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:14px">Prihlás sa pre správu obľúbených miest, notifikácií a nastavení bota.</div>';

        let authData = null;
        try { const r = await fetch('/auth/me'); if(r.ok) authData = await r.json(); } catch{}

        if (!authData) {
            html += `<a href="/auth/login" class="discord-btn" style="text-decoration:none">${DISCORD_SVG} Prihlásiť sa cez Discord</a>`;
        } else {
            state.discordUser = authData;
            html += `<div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:10px"><img src="${authData.avatarUrl}" style="width:36px;height:36px;border-radius:50%"><div><div style="font-size:13px;font-weight:600">${authData.displayName}</div><div style="font-size:11px;color:rgba(255,255,255,0.5)">${authData.username}</div></div></div><button class="btn-danger-small" id="logoutBtn">Odhlásiť</button></div>`;
        }
        html += '</div>';

        if (authData) {
            try { const r = await fetch('/api/me'); if(r.ok) state.userData = await r.json(); } catch{}
            const ud = state.userData||{};

            html += '<div class="sheet-section"><div class="sheet-section-title">Predvolené zobrazenie</div>';
            html += renderToggle('Štart', ['Aktuálne','Dnes','7d'], ud.default_view||'Aktuálne', 'defView');
            html += '</div>';

            html += '<div class="sheet-section"><div class="sheet-section-title">Mesto</div>';
            html += '<div style="position:relative"><input class="settings-input" placeholder="Hľadaj mesto…" id="settCityInput" autocomplete="off" style="width:100%;box-sizing:border-box"><div id="settCityResults" class="sett-city-results hidden"></div></div>';
            html += `<div style="margin-top:10px;font-size:12px;color:rgba(255,255,255,0.73)"><i class="fa-solid fa-location-dot" style="color:#34d399"></i> Aktuálne: <span style="color:#fff;font-weight:500">${ud.city||state.city||'—'}</span></div>`;
            html += '</div>';

            const favs = ud.favorites||[];
            html += '<div class="sheet-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div class="sheet-section-title" style="margin:0"><i class="fa-solid fa-star" style="color:#fbbf24"></i> Obľúbené mestá</div><button class="btn-accent" style="font-size:11px;padding:5px 12px" id="addFavBtn">+ Pridať</button></div>';
            if(!favs.length) html += '<div style="font-size:12px;color:rgba(255,255,255,0.5)">Žiadne obľúbené mestá.</div>';
            favs.forEach((f,i) => {
                html += `<div class="fav-row"><div style="display:flex;align-items:center;gap:8px"><i class="fa-solid fa-star" style="color:#fbbf24;font-size:12px"></i><span style="font-size:13px">${f.name}</span></div><div style="display:flex;gap:6px"><button class="btn-small fav-use" data-idx="${i}">Použiť</button><button class="btn-danger-small fav-del" data-idx="${i}">✕</button></div></div>`;
            });
            html += '</div>';

            const notifs = ud.notifications||[];
            const notifNames = {daily:'Denný prehľad',severe:'Výstrahy',storm:'Búrkový alert',sunrise:'Východ slnka',sunset:'Západ slnka',weather_change:'Zmeny počasia',rain_now:'Dážď teraz',extreme_temp:'Extrémne teploty',moon:'Fáza mesiaca'};
            html += '<div class="sheet-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div class="sheet-section-title" style="margin:0"><i class="fa-solid fa-bell" style="color:#60a5fa"></i> Notifikácie</div><button class="btn-accent" style="font-size:11px;padding:5px 12px" id="addNotifBtn">+ Pridať</button></div>';
            if(!notifs.length) html += '<div style="font-size:12px;color:rgba(255,255,255,0.5)">Žiadne notifikácie.</div>';
            notifs.forEach(n => {
                const time = n.hour!=null?String(n.hour).padStart(2,'0')+':'+String(n.minute||0).padStart(2,'0'):'—';
                html += `<div class="notif-row"><div style="display:flex;align-items:center;gap:8px"><i class="fa-solid fa-circle" style="font-size:8px;color:${n.enabled?'#34d399':'#f87171'}"></i><div><div style="font-size:12px">${notifNames[n.type]||n.type}</div><div style="font-size:10px;color:rgba(255,255,255,0.5)">${time}</div></div></div><div style="display:flex;gap:6px"><button class="btn-small notif-toggle" data-id="${n.id}">${n.enabled?'Vyp':'Zap'}</button><button class="btn-danger-small notif-del" data-id="${n.id}">✕</button></div></div>`;
            });
            html += '</div>';

            html += '<div style="display:flex;gap:10px"><button class="btn-save" id="saveSettBtn"><i class="fa-solid fa-floppy-disk" style="color:#7dd3fc"></i> Uložiť nastavenia</button><button class="btn-delete" id="delAccountBtn"><i class="fa-solid fa-trash" style="color:#f87171"></i></button></div>';
        }

        sheet.innerHTML = html;

        sheet.querySelector('#sheetCloseBtn')?.addEventListener('click', () => { overlay.classList.add('hidden'); Sky.resume && Sky.resume(); });

        sheet.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const group = btn.closest('.toggle-group');
                group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const key = group.dataset.key;
                if(key==='tempUnit') localStorage.setItem('nimbus_temp', btn.textContent);
                if(key==='windUnit') localStorage.setItem('nimbus_wind', btn.textContent);
                if((key==='tempUnit'||key==='windUnit') && state.currentData) {
                    const c = state.currentData, d = state.dailyData;
                    renderStats(c, d);
                    renderTabContent();
                    $('heroTemp').textContent = convTemp(c.temperature_2m)+'°';
                    $('heroSub').textContent = `Pocitová: ${convTemp(c.apparent_temperature)}°  H:${convTemp(d.temperature_2m_max[0])}°  L:${convTemp(d.temperature_2m_min[0])}°`;
                }
            });
        });

        sheet.querySelector('#logoutBtn')?.addEventListener('click', async () => {
            await fetch('/auth/logout',{method:'POST'});
            state.discordUser=null;state.userData=null;
            renderSettings();
        });

        sheet.querySelectorAll('.fav-use').forEach(btn => {
            btn.addEventListener('click', () => {
                const f = state.userData.favorites[parseInt(btn.dataset.idx)];
                if(f) { loadWeather(f.latitude,f.longitude,f.timezone||'auto',f.name); overlay.classList.add('hidden'); Sky.resume && Sky.resume(); }
            });
        });
        sheet.querySelectorAll('.fav-del').forEach(btn => {
            btn.addEventListener('click', async () => {
                await fetch(`/api/me/favorites/${btn.dataset.idx}`,{method:'DELETE'});
                state.userData.favorites.splice(parseInt(btn.dataset.idx),1);
                renderSettings();
            });
        });
        sheet.querySelectorAll('.notif-toggle').forEach(btn => {
            btn.addEventListener('click', async () => {
                await fetch(`/api/me/notifications/${btn.dataset.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:'{}'});
                const n = state.userData.notifications.find(x=>x.id===btn.dataset.id);
                if(n) n.enabled=!n.enabled;
                renderSettings();
            });
        });
        sheet.querySelectorAll('.notif-del').forEach(btn => {
            btn.addEventListener('click', async () => {
                await fetch(`/api/me/notifications/${btn.dataset.id}`,{method:'DELETE'});
                state.userData.notifications = state.userData.notifications.filter(x=>x.id!==btn.dataset.id);
                renderSettings();
            });
        });

        const settCityInput = sheet.querySelector('#settCityInput');
        const settCityResults = sheet.querySelector('#settCityResults');
        if (settCityInput && settCityResults) {
            let settTimer;
            settCityInput.addEventListener('input', () => {
                clearTimeout(settTimer);
                const q = settCityInput.value.trim();
                if (q.length < 2) { settCityResults.classList.add('hidden'); return; }
                settTimer = setTimeout(async () => {
                    try {
                        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=sk`);
                        const data = await res.json();
                        if (!data.results || !data.results.length) {
                            settCityResults.innerHTML = '<div class="fav-search-empty">Nenájdené</div>';
                            settCityResults.classList.remove('hidden');
                            return;
                        }
                        settCityResults.innerHTML = data.results.map(r => {
                            const loc = [r.admin1, r.country].filter(Boolean).join(', ');
                            return `<div class="sett-city-item" data-name="${r.name}${r.country?', '+r.country:''}" data-lat="${r.latitude}" data-lon="${r.longitude}" data-tz="${r.timezone||'auto'}"><div class="fav-search-name">${r.name}</div><div class="fav-search-loc">${loc}</div></div>`;
                        }).join('');
                        settCityResults.classList.remove('hidden');
                        settCityResults.querySelectorAll('.sett-city-item').forEach(item => {
                            item.addEventListener('click', () => {
                                const name = item.dataset.name;
                                const lat = parseFloat(item.dataset.lat);
                                const lon = parseFloat(item.dataset.lon);
                                const tz = item.dataset.tz;
                                loadWeather(lat, lon, tz, name);
                                overlay.classList.add('hidden');
                                settCityInput.value = '';
                                settCityResults.classList.add('hidden');
                            });
                        });
                    } catch(e) {
                        settCityResults.innerHTML = '<div class="fav-search-empty">Chyba</div>';
                        settCityResults.classList.remove('hidden');
                    }
                }, 300);
            });
        }

        sheet.querySelector('#addFavBtn')?.addEventListener('click', () => {
            const modal = document.createElement('div');
            modal.className = 'overlay';
            modal.innerHTML = `
                <div class="overlay-bg"></div>
                <div class="notif-modal">
                    <div class="notif-modal-header">
                        <span class="notif-modal-title"><i class="fa-solid fa-star" style="color:#fbbf24"></i> Pridať obľúbené mesto</span>
                        <button class="sheet-close" id="favCancel"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="notif-modal-body">
                        <div class="notif-type-label">Vyhľadať mesto</div>
                        <input type="text" id="favSearchInput" class="notif-time-input" placeholder="Hľadaj mesto..." autocomplete="off">
                        <div id="favSearchResults" class="fav-search-results"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const close = () => modal.remove();
            modal.querySelector('.overlay-bg').addEventListener('click', close);
            modal.querySelector('#favCancel').addEventListener('click', close);

            const input = modal.querySelector('#favSearchInput');
            const results = modal.querySelector('#favSearchResults');
            let timer;

            input.focus();
            input.addEventListener('input', () => {
                clearTimeout(timer);
                const q = input.value.trim();
                if (q.length < 2) { results.innerHTML = ''; return; }
                timer = setTimeout(async () => {
                    try {
                        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=sk`);
                        const data = await res.json();
                        if (!data.results || !data.results.length) {
                            results.innerHTML = '<div class="fav-search-empty">Nenájdené</div>';
                            return;
                        }
                        results.innerHTML = data.results.map(r => {
                            const loc = [r.admin1, r.country].filter(Boolean).join(', ');
                            return `<div class="fav-search-item" data-name="${r.name}${r.country?', '+r.country:''}" data-lat="${r.latitude}" data-lon="${r.longitude}" data-tz="${r.timezone||'auto'}"><div class="fav-search-name">${r.name}</div><div class="fav-search-loc">${loc}</div></div>`;
                        }).join('');

                        results.querySelectorAll('.fav-search-item').forEach(item => {
                            item.addEventListener('click', async () => {
                                const name = item.dataset.name;
                                const lat = parseFloat(item.dataset.lat);
                                const lon = parseFloat(item.dataset.lon);
                                const tz = item.dataset.tz;
                                const res = await fetch('/api/me/favorites', {
                                    method:'POST',
                                    headers:{'Content-Type':'application/json'},
                                    body: JSON.stringify({name, latitude:lat, longitude:lon, timezone:tz})
                                });
                                if (res.ok) {
                                    state.userData.favorites = state.userData.favorites || [];
                                    state.userData.favorites.push({name, latitude:lat, longitude:lon, timezone:tz});
                                    close();
                                    renderSettings();
                                }
                            });
                        });
                    } catch(e) {
                        results.innerHTML = '<div class="fav-search-empty">Chyba hľadania</div>';
                    }
                }, 300);
            });
        });

        sheet.querySelector('#addNotifBtn')?.addEventListener('click', () => {
            const types = [
                {v:'daily',l:'Denný prehľad',i:'fa-sun',c:'#fbbf24',timed:true},
                {v:'severe',l:'Výstrahy',i:'fa-triangle-exclamation',c:'#f87171',timed:false},
                {v:'storm',l:'Búrkový alert',i:'fa-cloud-bolt',c:'#fbbf24',timed:false},
                {v:'sunrise',l:'Východ slnka',i:'fa-sun',c:'#fb923c',timed:false},
                {v:'sunset',l:'Západ slnka',i:'fa-sun',c:'#ef4444',timed:false},
                {v:'weather_change',l:'Zmeny počasia',i:'fa-cloud',c:'#94a3b8',timed:false},
                {v:'rain_now',l:'Dážď teraz',i:'fa-cloud-rain',c:'#38bdf8',timed:false},
                {v:'extreme_temp',l:'Extrémne teploty',i:'fa-temperature-high',c:'#f87171',timed:false},
                {v:'moon',l:'Fáza mesiaca',i:'fa-moon',c:'#e8e2d0',timed:false},
            ];
            const modal = document.createElement('div');
            modal.className = 'overlay';
            modal.innerHTML = `
                <div class="overlay-bg"></div>
                <div class="notif-modal">
                    <div class="notif-modal-header">
                        <span class="notif-modal-title"><i class="fa-solid fa-bell" style="color:#60a5fa"></i> Nová notifikácia</span>
                        <button class="sheet-close" id="notifCancel"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="notif-modal-body">
                        <div class="notif-type-label">Typ notifikácie</div>
                        <div class="notif-type-grid">
                            ${types.map((t,i)=>`<button class="notif-type-btn${i===0?' active':''}" data-type="${t.v}" data-timed="${t.timed}"><i class="fa-solid ${t.i}" style="color:${t.c};font-size:18px"></i><span>${t.l}</span></button>`).join('')}
                        </div>
                        <div id="notifTimeWrap" class="notif-time-wrap">
                            <div class="notif-type-label">Čas doručenia</div>
                            <input type="time" id="notifTime" value="08:00" class="notif-time-input">
                        </div>
                        <button class="notif-save-btn" id="notifSave"><i class="fa-solid fa-check"></i> Vytvoriť notifikáciu</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const close = () => modal.remove();
            modal.querySelector('.overlay-bg').addEventListener('click', close);
            modal.querySelector('#notifCancel').addEventListener('click', close);

            const timeWrap = modal.querySelector('#notifTimeWrap');
            let selectedType = 'daily';
            let selectedTimed = true;

            modal.querySelectorAll('.notif-type-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.querySelectorAll('.notif-type-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedType = btn.dataset.type;
                    selectedTimed = btn.dataset.timed === 'true';
                    timeWrap.style.display = selectedTimed ? 'block' : 'none';
                });
            });

            modal.querySelector('#notifSave').addEventListener('click', async () => {
                const time = modal.querySelector('#notifTime').value;
                const body = {type:selectedType, enabled:true};
                if (selectedTimed) {
                    const [h,m] = time.split(':');
                    body.hour = parseInt(h); body.minute = parseInt(m);
                }
                const res = await fetch('/api/me/notifications',{
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body: JSON.stringify(body)
                });
                if (res.ok) {
                    const created = await res.json();
                    state.userData.notifications = state.userData.notifications || [];
                    state.userData.notifications.push(created);
                    close();
                    renderSettings();
                } else {
                    alert('Chyba pri vytváraní notifikácie.');
                }
            });
        });

        sheet.querySelector('#saveSettBtn')?.addEventListener('click', async () => {
            const body = {};
            const dv = sheet.querySelector('[data-key="defView"] .active');
            if(dv) body.default_view = dv.textContent;
            if(state.lat) {body.city=state.city;body.latitude=state.lat;body.longitude=state.lon;body.timezone=state.tz;}
            await fetch('/api/me',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        });

        sheet.querySelector('#delAccountBtn')?.addEventListener('click', async () => {
            if(!confirm('Vymazať všetky Nimbus dáta?')) return;
            await fetch('/api/me',{method:'DELETE'});
            await fetch('/auth/logout',{method:'POST'});
            state.discordUser=null;state.userData=null;
            renderSettings();
        });
    }

    function renderToggle(label, opts, active, key) {
        return `<div class="toggle-row"><span class="toggle-label">${label}</span><div class="toggle-group" data-key="${key}">${opts.map(o=>`<button class="toggle-btn${o===active?' active':''}">${o}</button>`).join('')}</div></div>`;
    }
}

function setupDevPanel() {
    const DEMOS = [
        {c:0,l:'<i class="fa-solid fa-sun" style="color:#fbbf24"></i> Jasno'},
        {c:1,l:'<i class="fa-solid fa-cloud-sun" style="color:#fbbf24"></i> Prev. jasno'},
        {c:2,l:'<i class="fa-solid fa-cloud-sun" style="color:#94a3b8"></i> Polojasno'},
        {c:3,l:'<i class="fa-solid fa-cloud" style="color:#a5b4c8"></i> Zamračené'},
        {c:45,l:'<i class="fa-solid fa-smog" style="color:#a5b4c8"></i> Hmla'},
        {c:51,l:'<i class="fa-solid fa-cloud-rain" style="color:#60a5fa"></i> Mrholenie'},
        {c:61,l:'<i class="fa-solid fa-cloud-rain" style="color:#38bdf8"></i> Slabý dážď'},
        {c:63,l:'<i class="fa-solid fa-cloud-showers-heavy" style="color:#3b82f6"></i> Dážď'},
        {c:65,l:'<i class="fa-solid fa-cloud-showers-heavy" style="color:#2563eb"></i> Silný dážď'},
        {c:71,l:'<i class="fa-regular fa-snowflake" style="color:#7dd3fc"></i> Sneženie'},
        {c:75,l:'<i class="fa-solid fa-snowflake" style="color:#93c5fd"></i> Silný sneh'},
        {c:95,l:'<i class="fa-solid fa-cloud-bolt" style="color:#fbbf24"></i> Búrka'},
        {c:99,l:'<i class="fa-solid fa-cloud-bolt" style="color:#f87171"></i> Silná búrka'},
    ];
    const panel = $('devPanel');
    let devCode = null, devHour = null;

    async function checkDev() {
        try {
            const r = await fetch('/auth/me');
            if(!r.ok) return;
            const data = await r.json();
            if(!data.developer) return;
            panel.classList.remove('hidden');
            panel.innerHTML = `<div class="dev-title"><i class="fa-solid fa-wrench"></i> Developer Panel</div><div class="dev-btns">${DEMOS.map(d=>`<button class="dev-btn" data-code="${d.c}">${d.l}</button>`).join('')}</div><div class="dev-slider"><span><i class="fa-solid fa-clock" style="font-size:10px"></i></span><input type="range" min="0" max="23" step="1" value="${new Date().getHours()}" id="devHourSlider"><span id="devHourVal">${new Date().getHours()}h</span></div>`;

            panel.querySelectorAll('.dev-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    panel.querySelectorAll('.dev-btn').forEach(b=>b.classList.remove('active'));
                    btn.classList.add('active');
                    devCode = parseInt(btn.dataset.code);
                    applyDev();
                });
            });
            $('devHourSlider')?.addEventListener('input', e => {
                devHour = parseInt(e.target.value);
                $('devHourVal').textContent = devHour+'h';
                applyDev();
            });
        } catch{}
    }

    function applyDev() {
        const code = devCode!=null?devCode:state.weatherCode;
        const hour = devHour!=null?devHour:(state.cityHour||new Date().getHours());
        Sky.update(code, hour);
        $('heroDesc').textContent = wm(code).t;
    }

    checkDev();
}

function tryGeolocation() {
    if (!navigator.geolocation) { loadWeather(48.1486,17.1077,'Europe/Bratislava','Bratislava, Slovensko'); return; }
    navigator.geolocation.getCurrentPosition(
        pos => {
            const lat=pos.coords.latitude, lon=pos.coords.longitude;
            fetch(`https://geocoding-api.open-meteo.com/v1/search?name=&count=1&language=sk&latitude=${lat}&longitude=${lon}`)
                .then(r=>r.json()).then(data => {
                    const r = data.results?.[0];
                    const name = r?`${r.name}, ${r.country}`:`${lat.toFixed(2)}, ${lon.toFixed(2)}`;
                    loadWeather(lat, lon, r?.timezone||'auto', name);
                }).catch(() => loadWeather(lat, lon, 'auto', `${lat.toFixed(2)}, ${lon.toFixed(2)}`));
        },
        () => loadWeather(48.1486,17.1077,'Europe/Bratislava','Bratislava, Slovensko'),
        {timeout:8000}
    );
}

const RADAR_LEGENDS = {
    rain:{title:'Zrážky mm/h',gradient:'linear-gradient(to right,transparent,#c8e6ff,#64b5f6,#2196f3,#1565c0,#4caf50,#ffeb3b,#ff9800,#f44336,#9c27b0)',labels:['0','0.5','1','2','5','10','20','40','80']},
    temp:{title:'Teplota °C',gradient:'linear-gradient(to right,#6a1b9a,#283593,#0277bd,#00838f,#2e7d32,#558b2f,#f9a825,#ef6c00,#c62828,#880e4f)',labels:['-30','-20','-10','0','10','15','20','30','40']},
    wind:{title:'Vietor km/h',gradient:'linear-gradient(to right,#e3f2fd,#90caf9,#42a5f5,#1e88e5,#1565c0,#4caf50,#ffeb3b,#ff9800,#f44336,#9c27b0)',labels:['0','5','10','20','30','50','70','100','150']},
    clouds:{title:'Oblačnosť %',gradient:'linear-gradient(to right,#3a3a28,#5a5a3a,#7a7a5a,#9a9a7a,#aaa98a,#bbbaa0,#d0cfb8,#e8e7d8,#ffffff)',labels:['0','10','25','40','55','70','85','100']},
    radar:{title:'Radar dBZ',gradient:'linear-gradient(to right,transparent,#a8d5ff,#64b5f6,#4caf50,#ffeb3b,#ff9800,#f44336,#9c27b0,#e040fb)',labels:['0','5','10','20','30','40','50','60','65']},
    snowcover:{title:'Snehová pokrývka (cm)',gradient:'linear-gradient(to right,transparent,#a5d6a7,#ffee58,#ffca28,#ffa726,#ef5350,#e53935,#ad1457,#e040fb)',labels:['0','1','5','10','20','40','80','150','300+']},
    pressure:{title:'Tlak hPa',gradient:'linear-gradient(to right,#1a237e,#1565c0,#0288d1,#00acc1,#4caf50,#8bc34a,#ffeb3b,#ff9800,#e65100)',labels:['960','970','980','990','1000','1010','1020','1030','1040']},
    thunder:{title:'Búrky',gradient:'linear-gradient(to right,transparent,#37474f40,#607d8b80,#ffeb3b,#ff9800,#f44336,#d50000,#9c27b0,#e040fb)',labels:['0','','Nízke','','Stredné','','Vysoké','','Extr.']},
};

function updateRadarLegend(layer) {
    const legend = RADAR_LEGENDS[layer]; if (!legend) return;
    $('radarLegendTitle').textContent = legend.title;
    $('radarLegendBar').style.background = legend.gradient;
    $('radarLegendLabels').innerHTML = legend.labels.map(l => `<span>${l}</span>`).join('');
}

function buildWindyUrl(layer) {
    const lat = state.lat || 48.15;
    const lon = state.lon || 17.11;
    return `https://embed.windy.com/embed2.html?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&detailLat=${lat.toFixed(4)}&detailLon=${lon.toFixed(4)}&zoom=8&level=surface&overlay=${layer}&product=ecmwf&menu=&message=true&marker=&calendar=now&type=map&location=coordinates&metricWind=km%2Fh&metricTemp=%C2%B0C&metricRain=mm&animate=true`;
}

function setupRadar() {
    const fab = $('radarFab');
    const headerBtn = $('radarBtn');
    const overlay = $('radarOverlay');
    const frame = $('radarFrame');
    const closeBtn = $('radarCloseBtn');
    const cityLabel = $('radarCityLabel');
    if (!overlay) return;

    const openRadar = () => {
        if (!state.lat) return;
        overlay.classList.remove('hidden');
        document.querySelectorAll('.radar-layer-btn').forEach(b => b.classList.toggle('active', b.dataset.layer === 'rain'));
        if (cityLabel) cityLabel.textContent = state.city || '';
        updateRadarLegend('rain');
        frame.src = buildWindyUrl('rain');
    };

    fab?.addEventListener('click', openRadar);
    headerBtn?.addEventListener('click', openRadar);

    closeBtn?.addEventListener('click', () => {
        overlay.classList.add('hidden');
        frame.src = '';
    });

    document.querySelectorAll('.radar-layer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const layer = btn.dataset.layer;
            document.querySelectorAll('.radar-layer-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateRadarLegend(layer);
            frame.src = buildWindyUrl(layer);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    Sky.init();
    startClock();
    setupSearch();
    setupSettings();
    setupRadar();
    tryGeolocation();
    setTimeout(setupDevPanel, 1500);
});

})();
