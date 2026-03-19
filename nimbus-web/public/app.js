'use strict';

const API_BASE = '/api';

const WMO = {
    0:{text:'Clear sky',emoji:'☀️',severity:0},1:{text:'Mainly clear',emoji:'🌤️',severity:0},
    2:{text:'Partly cloudy',emoji:'⛅',severity:0},3:{text:'Overcast',emoji:'☁️',severity:1},
    45:{text:'Fog',emoji:'🌫️',severity:1},48:{text:'Rime fog',emoji:'🌫️',severity:1},
    51:{text:'Light drizzle',emoji:'🌦️',severity:1},53:{text:'Moderate drizzle',emoji:'🌦️',severity:1},
    55:{text:'Dense drizzle',emoji:'🌧️',severity:2},56:{text:'Freezing drizzle',emoji:'🌧️',severity:2},
    57:{text:'Dense freezing drizzle',emoji:'🌧️',severity:2},
    61:{text:'Slight rain',emoji:'🌧️',severity:1},63:{text:'Moderate rain',emoji:'🌧️',severity:2},
    65:{text:'Heavy rain',emoji:'🌧️',severity:3},66:{text:'Freezing rain',emoji:'❄️🌧️',severity:3},
    67:{text:'Heavy freezing rain',emoji:'❄️🌧️',severity:3},
    71:{text:'Slight snow',emoji:'🌨️',severity:2},73:{text:'Moderate snow',emoji:'🌨️',severity:2},
    75:{text:'Heavy snow',emoji:'❄️',severity:3},77:{text:'Snow grains',emoji:'❄️',severity:2},
    80:{text:'Slight showers',emoji:'🌦️',severity:1},81:{text:'Moderate showers',emoji:'🌧️',severity:2},
    82:{text:'Violent showers',emoji:'🌧️',severity:3},
    85:{text:'Slight snow showers',emoji:'🌨️',severity:2},86:{text:'Heavy snow showers',emoji:'❄️',severity:3},
    95:{text:'Thunderstorm',emoji:'⛈️',severity:3},96:{text:'Thunderstorm + hail',emoji:'⛈️🧊',severity:4},
    99:{text:'Severe thunderstorm',emoji:'⛈️🧊',severity:4}
};
const WMO_SK = {
    0:'Jasno',1:'Prevažne jasno',2:'Polojasno',3:'Zamračené',
    45:'Hmla',48:'Námraza',
    51:'Slabé mrholenie',53:'Mierné mrholenie',55:'Silné mrholenie',
    56:'Mrznúce mrholenie',57:'Silné mrznúce mrholenie',
    61:'Slabý dážď',63:'Mierny dážď',65:'Silný dážď',
    66:'Mrznúci dážď',67:'Silný mrznúci dážď',
    71:'Slabé sneženie',73:'Mierné sneženie',75:'Silné sneženie',77:'Snehové zrná',
    80:'Slabé prehánky',81:'Mierné prehánky',82:'Silné prehánky',
    85:'Slabé snehové prehánky',86:'Silné snehové prehánky',
    95:'Búrka',96:'Búrka s krupobitím',99:'Silná búrka s krupobitím'
};
function wmoText(code){return WMO_SK[code]??WMO[code]?.text??'Neznáme'}

let state = {lat:null,lon:null,tz:'auto',city:null,weatherCode:0,isDay:1,currentUserData:null,discordUser:null};
const $ = id => document.getElementById(id);
const els = {};
const EL_IDS = [
    'sky','skyGradient','stars','sunContainer','moonContainer','cloudsLayer','lightning','horizonGlow',
    'headerTime','weatherLoading','weatherData','weatherIconBig','weatherTemp','weatherDesc','weatherCity',
    'currentDetails',
    'cityInput','searchBtn','cityResults',
    'authLogin','authUser','authError','userAvatar','userName','userTag','logoutBtn','userConfig',
    'tempToggle','windToggle','defaultViewToggle',
    'favList','addFavBtn','addFavForm','favCityInput','favSearchBtn','favCityResults','cancelFavBtn',
    'notifList','addNotifBtn','addNotifForm',
    'wizStep1','notifTypeGrid','cancelNotifBtn',
    'wizStep2Mode','wizStep2ModeTitle','modeTimedBtn','modeInstantBtn','timeInputRow','notifTime',
    'saveNotifBtn','wizBackBtn2Mode','destPickerMode','channelPickerMode',
    'wizStep2Instant','wizStep2InstantTitle','saveNotifInstantBtn','wizBackBtn2Instant',
    'destPickerInstant','channelPickerInstant',
    'wizStep2Offset','wizStep2OffsetTitle','offsetToggle','saveNotifOffsetBtn','wizBackBtn2Offset',
    'destPickerOffset','channelPickerOffset',
    'wizStep2Changes','changeGrid','saveNotifChangesBtn','wizBackBtn2Changes',
    'destPickerChanges','channelPickerChanges',
    'wizStep2Severe','severeGrid','saveNotifSevereBtn','wizBackBtn2Severe',
    'sevModeTimedBtn','sevModeInstantBtn','sevTimeInputRow','sevNotifTime',
    'destPickerSevere','channelPickerSevere',
    'wizStep2Moon','moonPhaseGrid','saveNotifMoonBtn','wizBackBtn2Moon',
    'destPickerMoon','channelPickerMoon',
    'editNotifForm','editNotifContent','saveEditNotifBtn','cancelEditNotifBtn',
    'saveSettingsBtn','deleteUserBtn','saveStatus'
];

function getSkyPhase(hour){
    if(hour>=5&&hour<7) return 'dawn';
    if(hour>=7&&hour<10) return 'morning';
    if(hour>=10&&hour<16) return 'day';
    if(hour>=16&&hour<19) return 'evening';
    if(hour>=19&&hour<21) return 'dusk';
    return 'night';
}

const SKY_GRADIENTS = {
    dawn:'linear-gradient(180deg,#1a1a4e 0%,#4a2060 20%,#c0506a 45%,#f0905a 65%,#ffd080 85%,#ffe8a0 100%)',
    morning:'linear-gradient(180deg,#1a6abf 0%,#4da8e8 30%,#7dc8f8 60%,#aadcf8 80%,#d0eefa 100%)',
    day:'linear-gradient(180deg,#1565c0 0%,#1e88e5 25%,#42a5f5 55%,#90caf9 80%,#bbdefb 100%)',
    evening:'linear-gradient(180deg,#0d47a1 0%,#1565c0 20%,#e65100 55%,#ff8f00 75%,#ffca28 100%)',
    dusk:'linear-gradient(180deg,#0d0d30 0%,#1a1040 25%,#6a2050 50%,#c05040 70%,#e08050 100%)',
    night:'linear-gradient(180deg,#020410 0%,#060820 30%,#0a0d30 60%,#0f1540 100%)',
    overcast_day:'linear-gradient(180deg,#2e3440 0%,#3d4555 30%,#5a6275 60%,#7a8290 85%,#9aa0a8 100%)',
    overcast_morning:'linear-gradient(180deg,#2a3040 0%,#3a4256 30%,#525e70 60%,#707880 85%,#8e9498 100%)',
    overcast_evening:'linear-gradient(180deg,#1e2030 0%,#2e2e40 30%,#484050 60%,#605860 85%,#786870 100%)',
    overcast_night:'linear-gradient(180deg,#0a0c14 0%,#101420 30%,#181c28 60%,#202430 100%)',
    rain_day:'linear-gradient(180deg,#1a2030 0%,#252e40 25%,#364050 55%,#4a5560 80%,#5e6a72 100%)',
    rain_morning:'linear-gradient(180deg,#161e2c 0%,#202838 25%,#303a4a 55%,#424e58 80%,#525e66 100%)',
    rain_evening:'linear-gradient(180deg,#101520 0%,#1a1e2c 25%,#282838 55%,#363040 80%,#443840 100%)',
    rain_night:'linear-gradient(180deg,#060810 0%,#0c1018 25%,#121620 55%,#181c26 100%)',
    snow_day:'linear-gradient(180deg,#3a4050 0%,#505868 30%,#6e7888 60%,#909aa4 85%,#b8c0c8 100%)',
    snow_morning:'linear-gradient(180deg,#303844 0%,#464e5c 30%,#606876 60%,#808890 85%,#a8b0b8 100%)',
    snow_evening:'linear-gradient(180deg,#252830 0%,#303440 30%,#424858 60%,#585e68 85%,#6e7478 100%)',
    snow_night:'linear-gradient(180deg,#0c0e14 0%,#141820 30%,#1c2030 60%,#242830 100%)',
    storm:'linear-gradient(180deg,#080810 0%,#10101e 20%,#1a1826 40%,#222030 65%,#2e2a30 100%)'
};
const HORIZON_GLOWS = {
    dawn:'linear-gradient(to top,rgba(240,144,90,.6) 0%,transparent 100%)',
    morning:'linear-gradient(to top,rgba(255,220,150,.3) 0%,transparent 100%)',
    day:'linear-gradient(to top,rgba(200,230,255,.2) 0%,transparent 100%)',
    evening:'linear-gradient(to top,rgba(255,120,40,.5) 0%,transparent 100%)',
    dusk:'linear-gradient(to top,rgba(180,80,60,.4) 0%,transparent 100%)',
    night:'linear-gradient(to top,rgba(20,40,100,.3) 0%,transparent 100%)',
    overcast:'linear-gradient(to top,rgba(80,90,100,.2) 0%,transparent 100%)',
    rain:'linear-gradient(to top,rgba(40,55,75,.3) 0%,transparent 100%)',
    snow:'linear-gradient(to top,rgba(160,170,180,.25) 0%,transparent 100%)',
    storm:'linear-gradient(to top,rgba(20,15,30,.5) 0%,transparent 100%)'
};

function getSunPosition(hour){
    if(hour<6||hour>20) return null;
    const p=(hour-6)/14;
    return {x:10+p*80,y:65-Math.sin(p*Math.PI)*50};
}
function getMoonPosition(hour){
    let p;
    if(hour>=20) p=(hour-20)/(24-20+6);
    else if(hour<=6) p=(24-20+hour)/(24-20+6);
    else return null;
    return {x:10+p*80,y:65-Math.sin(p*Math.PI)*45};
}

function updateSkyScene(weatherCode,isDay,hour){
    const phase=getSkyPhase(hour);
    const info=WMO[weatherCode]||WMO[0];
    const severity=info.severity;
    const isRainCode=[51,53,55,56,57,61,63,65,66,67,80,81,82].includes(weatherCode);
    const isSnowCode=[71,73,75,77,85,86].includes(weatherCode);
    const isStorm=[95,96,99].includes(weatherCode);
    const isOvercast=[3,45,48].includes(weatherCode);
    let gradient,horizonGlow;
    if(isStorm){gradient=SKY_GRADIENTS.storm;horizonGlow=HORIZON_GLOWS.storm}
    else if(isSnowCode){const k=(phase==='morning'||phase==='dawn')?'snow_morning':(phase==='evening'||phase==='dusk')?'snow_evening':!isDay?'snow_night':'snow_day';gradient=SKY_GRADIENTS[k];horizonGlow=HORIZON_GLOWS.snow}
    else if(isRainCode){const k=(phase==='morning'||phase==='dawn')?'rain_morning':(phase==='evening'||phase==='dusk')?'rain_evening':!isDay?'rain_night':'rain_day';gradient=SKY_GRADIENTS[k];horizonGlow=HORIZON_GLOWS.rain}
    else if(isOvercast||severity>=1){const k=(phase==='morning'||phase==='dawn')?'overcast_morning':(phase==='evening'||phase==='dusk')?'overcast_evening':!isDay?'overcast_night':'overcast_day';gradient=SKY_GRADIENTS[k];horizonGlow=HORIZON_GLOWS.overcast}
    else{gradient=SKY_GRADIENTS[phase];horizonGlow=HORIZON_GLOWS[phase]||HORIZON_GLOWS.day}

    els.skyGradient.style.background=gradient;
    els.horizonGlow.style.background=horizonGlow;
    els.stars.style.opacity=(phase==='night'||phase==='dusk')?'1':'0';

    const sunPos=getSunPosition(hour);
    const cloudOpacity=getCloudinessForCode(weatherCode);
    if(sunPos&&isDay&&cloudOpacity<0.8){
        els.sunContainer.style.left=sunPos.x+'%';
        els.sunContainer.style.top=sunPos.y+'%';
        els.sunContainer.style.opacity=cloudOpacity>0.5?'0.3':'1';
    } else {els.sunContainer.style.opacity='0'}

    const moonPos=getMoonPosition(hour);
    if(moonPos&&!isDay&&cloudOpacity<0.8){
        els.moonContainer.style.left=moonPos.x+'%';
        els.moonContainer.style.top=moonPos.y+'%';
        els.moonContainer.style.opacity=cloudOpacity>0.5?'0.3':'1';
    } else {els.moonContainer.style.opacity='0'}

    els.cloudsLayer.querySelectorAll('.cloud').forEach((c,i)=>{
        const op=Math.max(0,cloudOpacity-0.08*i);
        c.style.opacity=Math.min(1,op).toString();
        c.style.animationPlayState=op<=0?'paused':'running';
        if(severity>=2){
            c.querySelectorAll('.cloud-puff,.cloud-base').forEach(el=>{
                el.style.background=severity>=3
                    ?'radial-gradient(ellipse at 30% 40%,rgba(90,90,105,.95),rgba(58,58,74,.7) 50%,rgba(40,40,55,.3) 80%,transparent)'
                    :'radial-gradient(ellipse at 30% 40%,rgba(140,155,175,.9),rgba(110,125,140,.6) 50%,rgba(80,95,110,.3) 80%,transparent)';
            });
            c.style.filter=severity>=3?'blur(2px)':'blur(1px)';
        } else {
            c.querySelectorAll('.cloud-puff,.cloud-base').forEach(el=>{el.style.background=''});
            c.style.filter='blur(1px)';
        }
    });

    toggleRain(isRainCode||isStorm,severity);
    toggleSnow(isSnowCode);
    if(isStorm) startLightning(); else stopLightning();
}

function getCloudinessForCode(code){
    if([0,1].includes(code)) return 0;
    if(code===2) return 0.4;
    if([3,45,48].includes(code)) return 0.9;
    if([51,53].includes(code)) return 0.6;
    return 0.85;
}

function scheduleSkyFreeze(){}

let weatherCanvas=null,wCtx=null;
function _initCanvas(){
    if(wCtx) return true;
    weatherCanvas=$('weatherCanvas');
    if(!weatherCanvas) return false;
    wCtx=weatherCanvas.getContext('2d',{desynchronized:true});
    return !!wCtx;
}
let _wRafId=null,_wParticles=[],_wMode=null,_wStartTime=null;

function _resizeCanvas(){
    if(!weatherCanvas) return;
    const r=weatherCanvas.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const w=Math.round((r.width||window.innerWidth)*dpr);
    const h=Math.round((r.height||window.innerHeight)*dpr);
    if(weatherCanvas.width!==w||weatherCanvas.height!==h){
        weatherCanvas.width=w;weatherCanvas.height=h;
        weatherCanvas.style.width=(r.width||window.innerWidth)+'px';
        weatherCanvas.style.height=(r.height||window.innerHeight)+'px';
        if(dpr!==1) wCtx.scale(dpr,dpr);
    }
}
function _canvasLogicalSize(){
    if(!weatherCanvas) return {W:window.innerWidth,H:window.innerHeight};
    const r=weatherCanvas.getBoundingClientRect();
    return {W:r.width||window.innerWidth,H:r.height||window.innerHeight};
}
function _buildRainParticles(sev){
    const count=sev>=3?120:sev>=2?70:40;
    const {W,H}=_canvasLogicalSize();
    _wParticles=Array.from({length:count},()=>({x:Math.random()*W,y:Math.random()*H,len:sev>=3?22+Math.random()*18:14+Math.random()*12,w:sev>=3?2.5+Math.random()*1.5:1.5+Math.random()*1.5,spd:sev>=3?900+Math.random()*400:600+Math.random()*300,op:.45+Math.random()*.4,drift:-.12}));
}
function _buildSnowParticles(){
    const count=55;
    const {W,H}=_canvasLogicalSize();
    _wParticles=Array.from({length:count},()=>{
        const s=3+Math.random()*5;
        return{x:Math.random()*W,y:Math.random()*H,size:s,spd:30+Math.random()*50,drift:(Math.random()-.5)*25,op:.5+Math.random()*.5,angle:Math.random()*Math.PI*2,spin:(Math.random()-.5)*1.2,rot:Math.random()*Math.PI*2,rotSpd:(Math.random()-.5)*.4,branches:Math.random()>.3?6:4,hasCenter:Math.random()>.5,hasSub:Math.random()>.4,subPos:.4+Math.random()*.3};
    });
}
function _drawSnowflake(x,y,size,p){
    wCtx.save();
    wCtx.translate(x,y);
    wCtx.rotate(p.rot);
    wCtx.strokeStyle='rgba(220,235,255,1)';
    wCtx.lineCap='round';
    wCtx.lineWidth=size>5?1.2:.8;
    const arms=p.branches;
    const step=Math.PI*2/arms;
    for(let i=0;i<arms;i++){
        const a=step*i;
        wCtx.beginPath();
        wCtx.moveTo(0,0);
        wCtx.lineTo(Math.cos(a)*size,Math.sin(a)*size);
        wCtx.stroke();
        if(p.hasSub){
            const mx=Math.cos(a)*size*p.subPos;
            const my=Math.sin(a)*size*p.subPos;
            const sl=size*.35;
            wCtx.beginPath();wCtx.moveTo(mx,my);wCtx.lineTo(mx+Math.cos(a+.78)*sl,my+Math.sin(a+.78)*sl);wCtx.stroke();
            wCtx.beginPath();wCtx.moveTo(mx,my);wCtx.lineTo(mx+Math.cos(a-.78)*sl,my+Math.sin(a-.78)*sl);wCtx.stroke();
        }
    }
    if(p.hasCenter&&size>4){wCtx.beginPath();wCtx.arc(0,0,size*.18,0,Math.PI*2);wCtx.stroke()}
    wCtx.restore();
}
function _drawRain(dt){
    const {W,H}=_canvasLogicalSize();
    wCtx.clearRect(0,0,W+10,H+10);
    for(const p of _wParticles){
        p.y+=p.spd*dt;p.x+=p.drift*p.spd*dt;
        if(p.y>H+p.len){p.y=-p.len;p.x=Math.random()*W}
        wCtx.globalAlpha=p.op;wCtx.strokeStyle='rgba(180,215,255,1)';wCtx.lineWidth=p.w;
        wCtx.beginPath();wCtx.moveTo(p.x,p.y);wCtx.lineTo(p.x+p.drift*p.len*.8,p.y+p.len);wCtx.stroke();
    }
    wCtx.globalAlpha=1;
}
function _drawSnow(dt){
    const {W,H}=_canvasLogicalSize();
    wCtx.clearRect(0,0,W+10,H+10);
    for(const p of _wParticles){
        p.y+=p.spd*dt;p.x+=Math.sin(p.angle)*p.drift*dt;p.angle+=p.spin*dt;
        p.rot+=p.rotSpd*dt;
        if(p.y>H+p.size){p.y=-p.size;p.x=Math.random()*W}
        wCtx.globalAlpha=p.op;
        _drawSnowflake(p.x,p.y,p.size,p);
    }
    wCtx.globalAlpha=1;
}
function _weatherLoop(ts){
    if(!_wStartTime) _wStartTime=ts;
    const dt=Math.min(.05,(ts-(_weatherLoop._last||ts))/1000);
    _weatherLoop._last=ts;
    if(_wMode==='rain') _drawRain(dt);
    else if(_wMode==='snow') _drawSnow(dt);
    _wRafId=requestAnimationFrame(_weatherLoop);
}
function _stopWeather(){
    if(_wRafId){cancelAnimationFrame(_wRafId);_wRafId=null}
    _wMode=null;_wParticles=[];_wStartTime=null;_weatherLoop._last=null;
    if(wCtx&&weatherCanvas) wCtx.clearRect(0,0,weatherCanvas.width,weatherCanvas.height);
}
function toggleRain(active,severity=1){
    if(!active){_stopWeather();return}
    if(_wMode==='rain'&&_wRafId) return;
    _stopWeather();
    if(!_initCanvas()) return;
    requestAnimationFrame(()=>{_resizeCanvas();_wMode='rain';_buildRainParticles(severity);_wRafId=requestAnimationFrame(_weatherLoop)});
}
function toggleSnow(active){
    if(!active){_stopWeather();return}
    if(_wMode==='snow'&&_wRafId) return;
    _stopWeather();
    if(!_initCanvas()) return;
    requestAnimationFrame(()=>{_resizeCanvas();_wMode='snow';_buildSnowParticles();_wRafId=requestAnimationFrame(_weatherLoop)});
}
window.addEventListener('resize',()=>{if(!_wRafId&&!_wMode&&wCtx) _resizeCanvas()});

let lightningInterval=null;
function startLightning(){
    if(lightningInterval) return;
    lightningInterval=setInterval(()=>{if(Math.random()<.25) doLightningFlash()},2000);
}
function stopLightning(){
    if(lightningInterval){clearInterval(lightningInterval);lightningInterval=null}
    els.lightning.style.opacity='0';
}
function doLightningFlash(){
    els.lightning.style.transition='none';els.lightning.style.opacity='1';
    setTimeout(()=>{
        els.lightning.style.transition='opacity .15s';els.lightning.style.opacity='0';
        setTimeout(()=>{if(Math.random()<.5) setTimeout(()=>{els.lightning.style.opacity='.6';setTimeout(()=>{els.lightning.style.opacity='0'},80)},100)},150);
    },60);
}

function updateClock(){
    let now;
    if(state.tz&&state.tz!=='auto'){
        try{now=new Date(new Date().toLocaleString('en-US',{timeZone:state.tz}))}catch{now=new Date()}
    } else {now=new Date()}
    const str=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    if(els.headerTime.textContent!==str) els.headerTime.textContent=str;
}
let _clockInterval=null;
function startClock(){
    updateClock();
    _clockInterval=setInterval(updateClock,1000);
}

async function geocode(query){
    const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en`;
    const res=await fetch(url);const data=await res.json();return data.results||[];
}
async function fetchWeather(lat,lon,tz='auto'){
    const vars=['temperature_2m','relative_humidity_2m','apparent_temperature','is_day','precipitation','weather_code','cloud_cover','wind_speed_10m','wind_direction_10m','wind_gusts_10m','surface_pressure'].join(',');
    const dailyVars=['sunrise','sunset','uv_index_max','precipitation_probability_max'].join(',');
    return (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${vars}&daily=${dailyVars}&timezone=${tz}&forecast_days=1`)).json();
}
function getWindDir(deg){
    const dirs=['S','SSV','SV','VSV','V','VJV','JV','JJV','J','JJZ','JZ','ZJZ','Z','ZSZ','SZ','SSZ'];
    return dirs[Math.round(deg/22.5)%16];
}
function getUvLabel(uv){
    if(uv<=2) return {text:'Nízky',color:'#4ade80'};
    if(uv<=5) return {text:'Stredný',color:'#facc15'};
    if(uv<=7) return {text:'Vysoký',color:'#fb923c'};
    if(uv<=10) return {text:'Veľmi vysoký',color:'#f87171'};
    return {text:'Extrémny',color:'#c084fc'};
}
function timeUntil(targetDate){
    const diff=targetDate.getTime()-Date.now();
    if(diff<0) return null;
    const h=Math.floor(diff/3600000);const m=Math.floor((diff%3600000)/60000);
    if(h>0) return `za ${h}h ${m}m`;
    return `za ${m}m`;
}
async function loadWeather(lat,lon,tz,cityName){
    state.lat=lat;state.lon=lon;state.tz=tz;state.city=cityName;
    Object.keys(tabCache).forEach(k=>delete tabCache[k]);
    els.weatherLoading.classList.remove('hidden');els.weatherData.classList.add('hidden');
    try{
        const data=await fetchWeather(lat,lon,tz);
        const c=data.current;const d=data.daily;const info=WMO[c.weather_code]||WMO[0];
        state.weatherCode=c.weather_code;state.isDay=c.is_day;state.currentData=c;state.dailyData=d;
        const cityTime=c.time?new Date(c.time):new Date();
        const cityHour=cityTime.getHours();state.cityHour=cityHour;
        els.weatherIconBig.textContent=info.emoji;
        els.weatherTemp.textContent=`${Math.round(c.temperature_2m)}°C`;
        els.weatherDesc.textContent=wmoText(c.weather_code);
        els.weatherCity.textContent=cityName||`${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        renderCurrentTab(c,d);
        updateSkyScene(c.weather_code,c.is_day,cityHour);scheduleSkyFreeze();
        if(typeof updateFavicon==='function') updateFavicon();
        if(typeof updateRadarLocation==='function') updateRadarLocation();
        els.weatherLoading.classList.add('hidden');els.weatherData.classList.remove('hidden');
        const defaultView='current';
        switchWeatherTab(defaultView);
    } catch(err){
        console.error('Weather fetch failed:',err);
        els.weatherLoading.innerHTML='<p style="color:#f87171">Počasie sa nepodarilo načítať.</p>';
    }
}
function renderCurrentTab(c,d){
    const windDir=getWindDir(c.wind_direction_10m||0);
    const sunrise=d?.sunrise?.[0]?new Date(d.sunrise[0]):null;
    const sunset=d?.sunset?.[0]?new Date(d.sunset[0]):null;
    const sunriseStr=sunrise?`${String(sunrise.getHours()).padStart(2,'0')}:${String(sunrise.getMinutes()).padStart(2,'0')}`:'—';
    const sunsetStr=sunset?`${String(sunset.getHours()).padStart(2,'0')}:${String(sunset.getMinutes()).padStart(2,'0')}`:'—';
    const sunRelative=sunrise&&sunrise.getTime()>Date.now()?timeUntil(sunrise):sunset&&sunset.getTime()>Date.now()?timeUntil(sunset):null;
    const sunNote=sunrise&&sunrise.getTime()>Date.now()?`(${sunRelative})`:sunset&&sunset.getTime()>Date.now()?`(${sunRelative})`:'';
    const uv=d?.uv_index_max?.[0];const uvInfo=uv!=null?getUvLabel(uv):null;
    const pressure=c.surface_pressure?Math.round(c.surface_pressure):null;
    const nameday=getTodayNameday();
    const adv=getOutfitAdvice(c.temperature_2m,c.apparent_temperature,c.weather_code,c.wind_speed_10m,d?.precipitation_probability_max?.[0]||0);
    const accLine=adv.accessories.length?adv.accessories.map(a=>a.replace(/^[^\s]+\s/,'')).join(', '):'';
    const container=$('currentDetails');
    if(!container) return;
    let html='<div class="grid grid-cols-2 gap-2" style="margin-top:8px">';
    html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:8px 12px"><div class="text-xs" style="color:#6b7fa0">🌡️ Teplota</div><div class="text-sm font-semibold">${Math.round(c.temperature_2m)}°C</div><div class="text-xs" style="color:#6b7fa0">Pocitová: ${Math.round(c.apparent_temperature)}°C</div></div>`;
    html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:8px 12px"><div class="text-xs" style="color:#6b7fa0">💨 Vietor</div><div class="text-sm font-semibold">${Math.round(c.wind_speed_10m)} km/h ${windDir}</div><div class="text-xs" style="color:#6b7fa0">Nárazy: ${Math.round(c.wind_gusts_10m)} km/h</div></div>`;
    html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:8px 12px"><div class="text-xs" style="color:#6b7fa0">💧 Vlhkosť</div><div class="text-sm font-semibold">${c.relative_humidity_2m}%</div></div>`;
    html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:8px 12px"><div class="text-xs" style="color:#6b7fa0">☁️ Oblačnosť</div><div class="text-sm font-semibold">${c.cloud_cover}%</div></div>`;
    if(pressure) html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:8px 12px"><div class="text-xs" style="color:#6b7fa0">📊 Tlak</div><div class="text-sm font-semibold">${pressure} hPa</div></div>`;
    if(uvInfo) html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:8px 12px"><div class="text-xs" style="color:#6b7fa0">☀️ UV</div><div class="text-sm font-semibold" style="color:${uvInfo.color}">${uv?.toFixed(1)} · ${uvInfo.text}</div></div>`;
    html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:8px 12px"><div class="text-xs" style="color:#6b7fa0">🌅 Slnko</div><div class="text-sm font-semibold">↑ ${sunriseStr}  ↓ ${sunsetStr}</div>${sunNote?`<div class="text-xs" style="color:#6b7fa0">${sunNote}</div>`:''}</div>`;
    if(nameday) html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:8px 12px"><div class="text-xs" style="color:#6b7fa0">🎂 Meniny</div><div class="text-sm font-semibold">${nameday}</div></div>`;
    html+='</div>';
    if(accLine) html+=`<div style="margin-top:8px;padding:8px 12px;background:rgba(76,110,245,.08);border:1px solid rgba(76,110,245,.15);border-radius:8px;font-size:12px;color:#8899b0">${accLine}</div>`;
    container.innerHTML=html;
}

const tabCache={};const tabInflight=new Set();const TAB_TTL_MS=10*60*1000;const tabFetchTime={};
function isTabFresh(key){return tabCache[key]===state.city&&tabFetchTime[key]&&(Date.now()-tabFetchTime[key]<TAB_TTL_MS)}
function markTabFresh(key){tabCache[key]=state.city;tabFetchTime[key]=Date.now()}

function switchWeatherTab(tabId){
    document.querySelectorAll('.wtab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tabId));
    document.querySelectorAll('.tab-pane').forEach(p=>p.classList.add('hidden'));
    const paneId='tab'+tabId.charAt(0).toUpperCase()+tabId.slice(1);
    const pane=$(paneId);if(pane) pane.classList.remove('hidden');
    if(!state.lat) return;
    switch(tabId){
        case 'today':loadTabToday();break;
        case '7d':loadTab7d();break;
        case '14d':loadTab14d();break;
        case 'air':loadTabAir();break;
        case 'nice':loadTabNice();break;
        case 'outfit':loadTabOutfit();break;
        case 'traffic':loadTabTraffic();break;
        case 'moon':loadTabMoon();break;
        case 'history':loadTabHistory();break;
    }
}
function tabLoading(id,show){const el=$(id);if(el) el.classList.toggle('hidden',!show)}

const SK_NAMEDAYS={"01-01":"Deň vzniku SR","01-02":"Alexandra, Karina","01-03":"Daniela","01-04":"Drahoslav","01-05":"Andrea","01-06":"Antónia","01-07":"Bohuslava","01-08":"Severín","01-09":"Alexej","01-10":"Dáša","01-11":"Malvína","01-12":"Ernest","01-13":"Rastislav","01-14":"Radovan","01-15":"Dobroslav","01-16":"Kristína","01-17":"Nataša","01-18":"Bohdana","01-19":"Drahomíra, Mario","01-20":"Dalibor","01-21":"Vincent","01-22":"Zora","01-23":"Miloš","01-24":"Timotej","01-25":"Gejza","01-26":"Tamara","01-27":"Bohuš","01-28":"Alfonz","01-29":"Gašpar","01-30":"Ema","01-31":"Emil","02-01":"Tatiana","02-02":"Erik, Erika","02-03":"Blažej","02-04":"Veronika","02-05":"Agáta","02-06":"Dorota","02-07":"Vanda","02-08":"Zoja","02-09":"Zdenko","02-10":"Gabriela","02-11":"Dezider","02-12":"Perla","02-13":"Arpád","02-14":"Valentín","02-15":"Pravoslav","02-16":"Ida, Liana","02-17":"Miloslava","02-18":"Jaromír","02-19":"Vlasta","02-20":"Lívia","02-21":"Eleonóra","02-22":"Etela","02-23":"Roman, Romana","02-24":"Matej","02-25":"Frederik, Frederika","02-26":"Viktor","02-27":"Alexander","02-28":"Zlatica","02-29":"Radomír","03-01":"Albín","03-02":"Anežka","03-03":"Bohumil, Bohumila","03-04":"Kazimír","03-05":"Fridrich","03-06":"Radoslav, Radoslava","03-07":"Tomáš","03-08":"Alan, Alana","03-09":"Františka","03-10":"Branislav, Bruno","03-11":"Angela, Angelika","03-12":"Gregór","03-13":"Vlastimil","03-14":"Matilda","03-15":"Svetlana","03-16":"Boleslav","03-17":"Ľubica","03-18":"Eduard","03-19":"Jozef","03-20":"Víťazoslav","03-21":"Blahoslav","03-22":"Beňadik","03-23":"Adrián","03-24":"Gabriel","03-25":"Marián","03-26":"Emanuel","03-27":"Alena","03-28":"Soňa","03-29":"Miroslav","03-30":"Vieroslava","03-31":"Benjamín","04-01":"Hugo","04-02":"Zita","04-03":"Richard","04-04":"Izidor","04-05":"Miroslava","04-06":"Irena","04-07":"Zoltán","04-08":"Albert","04-09":"Milena","04-10":"Igor","04-11":"Július","04-12":"Estera","04-13":"Aleš","04-14":"Justína","04-15":"Fedor","04-16":"Dana, Danica","04-17":"Rudolf","04-18":"Valér","04-19":"Jela","04-20":"Marcel","04-21":"Ervín","04-22":"Slavomír","04-23":"Vojtech","04-24":"Juraj","04-25":"Marek","04-26":"Jaroslava","04-27":"Jaroslav","04-28":"Jarmila","04-29":"Lea","04-30":"Anastázia","05-01":"Sviatok práce","05-02":"Žigmund","05-03":"Galina, Timea","05-04":"Florián","05-05":"Lesana, Lesia","05-06":"Hermína","05-07":"Monika","05-08":"Deň víťazstva nad fašizmom","05-09":"Roland","05-10":"Viktória","05-11":"Blažena","05-12":"Pankrác","05-13":"Servác","05-14":"Bonifác","05-15":"Žofia","05-16":"Svetozár","05-17":"Gizela","05-18":"Viola","05-19":"Gertrúda","05-20":"Bernard","05-21":"Zina","05-22":"Júlia, Juliana","05-23":"Želmíra","05-24":"Ela","05-25":"Urban","05-26":"Dušan","05-27":"Iveta","05-28":"Viliam","05-29":"Vilma","05-30":"Ferdinand","05-31":"Petronela, Petrana","06-01":"Deň detí","06-02":"Xénia","06-03":"Karolína","06-04":"Lenka","06-05":"Laura","06-06":"Norbert","06-07":"Róbert","06-08":"Medard","06-09":"Stanislava","06-10":"Margaréta","06-11":"Dobroslava","06-12":"Zlatko","06-13":"Anton","06-14":"Vasil","06-15":"Vít","06-16":"Blanka, Bianka","06-17":"Adolf","06-18":"Vratislav","06-19":"Alfréd","06-20":"Valéria","06-21":"Alojz","06-22":"Paulína","06-23":"Sidónia","06-24":"Ján","06-25":"Olívia, Tadeáš","06-26":"Adriána","06-27":"Ladislav, Ladislava","06-28":"Beáta","06-29":"Peter, Pavol, Petra","06-30":"Melánia","07-01":"Diana","07-02":"Berta","07-03":"Miloslav","07-04":"Prokop","07-05":"Cyril, Metod","07-06":"Patrícia","07-07":"Oliver","07-08":"Ivan","07-09":"Lujza","07-10":"Amália","07-11":"Milota","07-12":"Nina","07-13":"Margita","07-14":"Kamil","07-15":"Henrich","07-16":"Drahomír","07-17":"Bohuslav","07-18":"Kamila","07-19":"Dušana","07-20":"Iľja, Eliáš","07-21":"Daniel","07-22":"Magdaléna","07-23":"Oľga","07-24":"Vladimír","07-25":"Jakub, Timur","07-26":"Anna, Hana","07-27":"Božena","07-28":"Krištof","07-29":"Marta","07-30":"Libuša","07-31":"Ignác","08-01":"Božidara","08-02":"Gustáv","08-03":"Jerguš","08-04":"Dominik, Dominika","08-05":"Hortenzia","08-06":"Jozefína","08-07":"Štefánia","08-08":"Oskár","08-09":"Ľubomíra","08-10":"Vavrinec","08-11":"Zuzana","08-12":"Darina","08-13":"Ľubomír","08-14":"Mojmír","08-15":"Marcela","08-16":"Leonard","08-17":"Milica","08-18":"Elena, Helena","08-19":"Lýdia","08-20":"Anabela","08-21":"Jana","08-22":"Tichomír","08-23":"Filip","08-24":"Bartolomej","08-25":"Ľudovít","08-26":"Samuel","08-27":"Silvia","08-28":"Augustín","08-29":"Nikola, Nikolaj","08-30":"Ružena","08-31":"Nora","09-01":"Drahoslava","09-02":"Linda, Melinda","09-03":"Belo","09-04":"Rozália","09-05":"Regina","09-06":"Alica","09-07":"Marianna","09-08":"Miriama","09-09":"Martina","09-10":"Oleg","09-11":"Bystrík","09-12":"Mária","09-13":"Ctibor","09-14":"Ľudomil","09-15":"Jolana","09-16":"Ľudmila","09-17":"Olympia","09-18":"Eugénia","09-19":"Konštantín","09-20":"Ľuboslav, Ľuboslava","09-21":"Matúš","09-22":"Móric","09-23":"Zdenka","09-24":"Ľuboš","09-25":"Vladislav, Vladislava","09-26":"Edita","09-27":"Cyprián","09-28":"Václav","09-29":"Michal, Michaela","09-30":"Jarolím","10-01":"Arnold","10-02":"Levoslav","10-03":"Stela","10-04":"František","10-05":"Viera","10-06":"Natália","10-07":"Eliška","10-08":"Brigita","10-09":"Dionýz","10-10":"Slavomíra","10-11":"Valentína","10-12":"Maximilian","10-13":"Koloman","10-14":"Boris","10-15":"Terézia","10-16":"Vladimíra","10-17":"Hedviga","10-18":"Lukáš","10-19":"Kristián","10-20":"Vendelín","10-21":"Uršuľa","10-22":"Sergej","10-23":"Alojzia","10-24":"Kvetoslava","10-25":"Aurel","10-26":"Demeter","10-27":"Sabína","10-28":"Dobromila","10-29":"Klára","10-30":"Šimon, Simona","10-31":"Aurélia","11-01":"Deň všetkých svätých","11-02":"Dušičky","11-03":"Hubert","11-04":"Karol","11-05":"Imrich","11-06":"Renáta","11-07":"René","11-08":"Bohumír","11-09":"Teodor","11-10":"Tibor","11-11":"Maroš","11-12":"Svätopluk","11-13":"Stanislav","11-14":"Irma","11-15":"Leopold","11-16":"Agnesa","11-17":"Klaudia","11-18":"Eugen","11-19":"Alžbeta","11-20":"Félix","11-21":"Elvíra","11-22":"Cecília","11-23":"Klement","11-24":"Emília","11-25":"Katarína","11-26":"Kornel","11-27":"Milan","11-28":"Henrieta","11-29":"Vratko","11-30":"Andrej, Ondrej","12-01":"Edmund","12-02":"Bibiána","12-03":"Oldrich","12-04":"Barbora","12-05":"Oto","12-06":"Mikuláš","12-07":"Ambróz","12-08":"Marína","12-09":"Izabela","12-10":"Radúz","12-11":"Hilda","12-12":"Otília","12-13":"Lucia","12-14":"Branislava, Bronislava","12-15":"Ivica","12-16":"Albína","12-17":"Kornélia","12-18":"Sláva, Slávka","12-19":"Judita","12-20":"Dagmara","12-21":"Bohdan","12-22":"Adela","12-23":"Nadežda, Nádej","12-24":"Adam, Eva","12-25":"1. sviatok vianočný","12-26":"Štefan","12-27":"Filoména","12-28":"Ivana","12-29":"Milada","12-30":"Dávid","12-31":"Silvester"};
function getTodayNameday(){const d=new Date();const k=`${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;return SK_NAMEDAYS[k]||null}
function groupHours(hours){if(!hours.length) return '';hours.sort((a,b)=>a-b);const ranges=[];let start=hours[0],end=hours[0];for(let i=1;i<hours.length;i++){if(hours[i]===end+1){end=hours[i]}else{ranges.push(start===end?`${start}:00`:`${start}:00–${end+1}:00`);start=hours[i];end=hours[i]}}ranges.push(start===end?`${start}:00`:`${start}:00–${end+1}:00`);return ranges.join(', ')}

async function loadTabToday(){
    if(isTabFresh('today')) return;if(tabInflight.has('today')) return;tabInflight.add('today');
    tabLoading('loadingToday',true);
    const content=$('contentToday');content.innerHTML='';
    try{
        const [hourlyRes,dailyRes]=await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,is_day&timezone=${state.tz}&forecast_days=1`),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset,precipitation_sum,precipitation_probability_max&timezone=${state.tz}&forecast_days=1`)
        ]);
        const hourlyData=await hourlyRes.json();const dailyData=await dailyRes.json();
        const h=hourlyData.hourly;const d=dailyData.daily;
        const today=d.time?.[0];
        const wInfo=WMO[d.weather_code?.[0]]||WMO[0];
        let maxSeverity=0;const severeHours=[];const rainyHours=[];
        if(today&&h?.time){
            for(let i=0;i<h.time.length;i++){
                if(!h.time[i]?.startsWith(today)) continue;
                const info=WMO[h.weather_code?.[i]]||WMO[0];
                if(info.severity>maxSeverity) maxSeverity=info.severity;
                if(info.severity>=3) severeHours.push({hour:new Date(h.time[i]).getHours(),prob:h.precipitation_probability?.[i]??0});
                if((h.precipitation_probability?.[i]??0)>40) rainyHours.push({hour:new Date(h.time[i]).getHours(),prob:h.precipitation_probability[i]});
            }
        }
        let summary='';
        if(maxSeverity===0) summary='☀️ Dnes nič špeciálne — '+wmoText(d.weather_code?.[0])+' počas celého dňa.';
        else if(maxSeverity<=1) summary='🌤️ Pokojný deň — '+wmoText(d.weather_code?.[0])+', žiadne výrazné zmeny.';
        else if(maxSeverity<=2) summary='⚠️ Pozor na zrážky — očakávaj '+wmoText(d.weather_code?.[0]).toLowerCase()+'.';
        else summary='🚨 Výstraha! Očakávajú sa výrazné poveternostné javy!';
        if(severeHours.length>0){
            summary+='\n⛈️ Silné javy: '+groupHours(severeHours.map(h=>h.hour));
            summary+='\n📊 Pravdepodobnosť: '+Math.max(...severeHours.map(h=>h.prob))+'%';
        } else if(rainyHours.length>0){
            summary+='\n🌧️ Dážď pravdepodobný: '+groupHours(rainyHours.map(h=>h.hour));
            summary+='\n📊 Pravdepodobnosť: až '+Math.max(...rainyHours.map(h=>h.prob))+'%';
        }
        const sunrise=d.sunrise?.[0]?new Date(d.sunrise[0]):null;
        const sunset=d.sunset?.[0]?new Date(d.sunset[0]):null;
        const sunriseStr=sunrise?`${String(sunrise.getHours()).padStart(2,'0')}:${String(sunrise.getMinutes()).padStart(2,'0')}`:'?';
        const sunsetStr=sunset?`${String(sunset.getHours()).padStart(2,'0')}:${String(sunset.getMinutes()).padStart(2,'0')}`:'?';
        const nameday=getTodayNameday();
        let html='<div style="padding:4px 0">';
        html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:12px;margin-bottom:10px;font-size:13px;line-height:1.6;white-space:pre-line;color:#e8edf5">${summary}</div>`;
        html+='<div class="grid grid-cols-2 gap-2" style="margin-bottom:10px">';
        html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:10px 14px"><div class="text-xs" style="color:#6b7fa0">🌡️ Teploty</div><div class="text-sm font-semibold">↑ ${Math.round(d.temperature_2m_max?.[0])}°C  ↓ ${Math.round(d.temperature_2m_min?.[0])}°C</div></div>`;
        html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:10px 14px"><div class="text-xs" style="color:#6b7fa0">💨 Vietor</div><div class="text-sm font-semibold">Max: ${Math.round(d.wind_speed_10m_max?.[0])} km/h</div><div class="text-xs" style="color:#6b7fa0">Nárazy: ${Math.round(d.wind_gusts_10m_max?.[0])} km/h</div></div>`;
        html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:10px 14px"><div class="text-xs" style="color:#6b7fa0">🌅 Slnko</div><div class="text-sm font-semibold">↑ ${sunriseStr}  ↓ ${sunsetStr}</div></div>`;
        if(nameday) html+=`<div style="background:#253648;border:1px solid #3b5068;border-radius:10px;padding:10px 14px"><div class="text-xs" style="color:#6b7fa0">🎂 Meniny</div><div class="text-sm font-semibold">${nameday}</div></div>`;
        html+='</div>';
        html+='<div class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:#6b7fa0;margin-top:8px">Hodinová predpoveď</div>';
        html+='</div>';
        content.innerHTML=html;
        const cityHour=state.cityHour!=null?state.cityHour:new Date().getHours();
        for(let i=0;i<h.time.length;i++){
            const hour=new Date(h.time[i]).getHours();if(hour<cityHour) continue;
            const info=WMO[h.weather_code[i]]||WMO[0];
            const row=document.createElement('div');row.className='hourly-row';
            row.innerHTML=`<span class="hourly-time">${String(hour).padStart(2,'0')}:00</span><span class="hourly-icon">${info.emoji}</span><span class="hourly-temp">${Math.round(h.temperature_2m[i])}°C</span><span class="hourly-desc">${wmoText(h.weather_code[i])}</span><span class="hourly-rain">${h.precipitation_probability[i]}%</span><span class="hourly-wind">${Math.round(h.wind_speed_10m[i])}km/h</span>`;
            content.appendChild(row);
        }
        markTabFresh('today');
    } catch(e){console.error(e);content.innerHTML='<div class="empty-state">Načítanie zlyhalo.</div>'}
    tabInflight.delete('today');tabLoading('loadingToday',false);
}

async function loadDailyForecast(days){
    const key=`${days}d`;if(tabCache[key]===state.city) return;
    tabLoading(`loading${days===7?'7d':'14d'}`,true);
    const content=$(`content${days===7?'7d':'14d'}`);content.innerHTML='';
    try{
        const url=`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=${state.tz}&forecast_days=${days}`;
        const data=await(await fetch(url)).json();const d=data.daily;
        for(let i=0;i<d.time.length;i++){
            const date=new Date(d.time[i]);const info=WMO[d.weather_code[i]]||WMO[0];
            const wrapper=document.createElement('div');wrapper.className='daily-wrapper';
            const row=document.createElement('div');row.className='daily-row daily-expandable';
            row.innerHTML=`<span class="daily-day">${i===0?'Dnes':['Ne','Po','Ut','St','Št','Pi','So'][date.getDay()]}</span><span class="daily-date">${date.getDate()}.${date.getMonth()+1}.</span><span class="daily-icon">${info.emoji}</span><span class="daily-desc">${wmoText(d.weather_code[i])}</span><span class="daily-temps">${Math.round(d.temperature_2m_max[i])}° <span>${Math.round(d.temperature_2m_min[i])}°</span></span><span class="daily-rain">${d.precipitation_probability_max[i]}%</span>`;
            const detail=document.createElement('div');detail.className='daily-detail hidden';
            detail.dataset.date=d.time[i];detail.dataset.loaded='0';
            row.addEventListener('click',()=>{
                const wasOpen=!detail.classList.contains('hidden');
                content.querySelectorAll('.daily-detail').forEach(dd=>{dd.classList.add('hidden');dd.closest('.daily-wrapper')?.querySelector('.daily-row')?.classList.remove('daily-open')});
                if(!wasOpen){
                    detail.classList.remove('hidden');row.classList.add('daily-open');
                    if(detail.dataset.loaded==='0') loadDayHourly(detail,detail.dataset.date);
                }
            });
            wrapper.appendChild(row);wrapper.appendChild(detail);content.appendChild(wrapper);
        }
        tabCache[key]=state.city;
    } catch{content.innerHTML='<div class="empty-state">Načítanie zlyhalo.</div>'}
    tabLoading(`loading${days===7?'7d':'14d'}`,false);
}
async function loadDayHourly(container,dateStr){
    container.innerHTML='<div style="text-align:center;padding:8px"><div class="loading-spinner sm" style="margin:0 auto"></div></div>';
    try{
        const url=`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&timezone=${state.tz}&start_date=${dateStr}&end_date=${dateStr}`;
        const data=await(await fetch(url)).json();const h=data.hourly;
        let html='';
        for(let i=0;i<h.time.length;i++){
            const hour=new Date(h.time[i]).getHours();
            const info=WMO[h.weather_code[i]]||WMO[0];
            html+=`<div class="hourly-row hourly-sub"><span class="hourly-time">${String(hour).padStart(2,'0')}:00</span><span class="hourly-icon">${info.emoji}</span><span class="hourly-temp">${Math.round(h.temperature_2m[i])}°C</span><span class="hourly-desc">${wmoText(h.weather_code[i])}</span><span class="hourly-rain">${h.precipitation_probability[i]}%</span><span class="hourly-wind">${Math.round(h.wind_speed_10m[i])}km/h</span></div>`;
        }
        container.innerHTML=html;container.dataset.loaded='1';
    } catch{container.innerHTML='<div class="empty-state">Načítanie zlyhalo.</div>'}
}
async function loadTab7d(){await loadDailyForecast(7)}
async function loadTab14d(){await loadDailyForecast(14)}

const AQI_LEVELS=[
    {max:20,key:'good',label:'Dobrý',color:'#4ade80'},
    {max:40,key:'fair',label:'Prijateľný',color:'#a3e635'},
    {max:60,key:'moderate',label:'Stredný',color:'#facc15'},
    {max:80,key:'poor',label:'Zlý',color:'#fb923c'},
    {max:100,key:'veryPoor',label:'Veľmi zlý',color:'#f87171'},
    {max:999,key:'extremelyPoor',label:'Extrémne zlý',color:'#c084fc'}
];
function getAqiLevel(val){return AQI_LEVELS.find(l=>val<=l.max)||AQI_LEVELS[5]}

async function loadTabAir(){
    if(isTabFresh('air')) return;if(tabInflight.has('air')) return;tabInflight.add('air');
    tabLoading('loadingAir',true);const content=$('contentAir');content.innerHTML='';
    try{
        const data=await(await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${state.lat}&longitude=${state.lon}&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide`)).json();
        const c=data.current;const aqi=c.european_aqi??0;const level=getAqiLevel(aqi);
        content.innerHTML=`<div class="aqi-hero"><div class="aqi-index" style="color:${level.color}">${aqi}</div><div class="aqi-label" style="color:${level.color}">${level.label}</div></div><div class="aqi-grid"><div class="aqi-chip"><div class="aqi-chip-label">PM2.5</div><div class="aqi-chip-value">${c.pm2_5?.toFixed(1)??'—'} μg/m³</div></div><div class="aqi-chip"><div class="aqi-chip-label">PM10</div><div class="aqi-chip-value">${c.pm10?.toFixed(1)??'—'} μg/m³</div></div><div class="aqi-chip"><div class="aqi-chip-label">NO₂</div><div class="aqi-chip-value">${c.nitrogen_dioxide?.toFixed(1)??'—'} μg/m³</div></div><div class="aqi-chip"><div class="aqi-chip-label">O₃</div><div class="aqi-chip-value">${c.ozone?.toFixed(1)??'—'} μg/m³</div></div><div class="aqi-chip"><div class="aqi-chip-label">SO₂</div><div class="aqi-chip-value">${c.sulphur_dioxide?.toFixed(1)??'—'} μg/m³</div></div></div>`;
        markTabFresh('air');
    } catch{content.innerHTML='<div class="empty-state">Načítanie zlyhalo.</div>'}
    tabInflight.delete('air');tabLoading('loadingAir',false);
}

async function loadTabNice(){
    if(isTabFresh('nice')) return;if(tabInflight.has('nice')) return;tabInflight.add('nice');
    tabLoading('loadingNice',true);const content=$('contentNice');content.innerHTML='';
    try{
        const data=await(await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max&timezone=${state.tz}&forecast_days=16`)).json();
        const d=data.daily;const niceDays=[];
        for(let i=0;i<d.time.length;i++){
            const info=WMO[d.weather_code[i]]||WMO[0];
            let score=100;score-=info.severity*20;score-=Math.min(40,d.precipitation_sum[i]*10);score-=Math.max(0,d.wind_speed_10m_max[i]-20)*.5;score+=Math.min(10,(d.temperature_2m_max[i]-10)*.5);
            score=Math.max(0,Math.min(100,Math.round(score)));
            if(score>=50) niceDays.push({i,score,info,code:d.weather_code[i],date:new Date(d.time[i])});
        }
        if(!niceDays.length){content.innerHTML='<div class="empty-state">Žiadne pekné dni v najbližších 16 dňoch.</div>'}
        else{
            niceDays.sort((a,b)=>b.score-a.score);
            for(const day of niceDays.slice(0,8)){
                const color=day.score>=80?'#4ade80':day.score>=65?'#facc15':'#fb923c';
                const row=document.createElement('div');row.className='nice-row';
                row.innerHTML=`<div class="nice-score" style="background:${color}22;border:2px solid ${color};color:${color}">${day.score}</div><div class="nice-info"><div class="nice-date">${['Ne','Po','Ut','St','Št','Pi','So'][day.date.getDay()]} ${day.date.getDate()}.${day.date.getMonth()+1}. ${day.info.emoji}</div><div class="nice-desc">${wmoText(day.code)}</div></div><div class="nice-temps">${Math.round(d.temperature_2m_max[day.i])}° / ${Math.round(d.temperature_2m_min[day.i])}°</div>`;
                content.appendChild(row);
            }
        }
        markTabFresh('nice');
    } catch{content.innerHTML='<div class="empty-state">Načítanie zlyhalo.</div>'}
    tabInflight.delete('nice');tabLoading('loadingNice',false);
}

function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function getOutfitAdvice(temp,feelsLike,code,windSpeed,rain){
    const info=WMO[code]||WMO[0];
    const layers=[],accessories=[];let footwear='',emoji='',tip='';
    if(feelsLike<-10){
        layers.push(pick(['🧥 Hrubá zimná bunda','🧥 Páperová bunda','🧥 Dlhý zimný kabát']));
        layers.push('🧣 Šál + čiapka + rukavice');
        layers.push(pick(['👕 Termobielizeň + hrubý sveter','👕 Fleecová mikina + termo vrstva','👕 Vlnený sveter + spodná vrstva']));
        emoji='🥶';tip=pick(['Dnes radšej čaj do termosky.','Zahrej sa pred odchodom!','Na nose budeš mať červeno.']);
    } else if(feelsLike<0){
        layers.push(pick(['🧥 Zimná bunda','🧥 Prešívaná bunda','🧥 Páperová vesta + mikina']));
        layers.push(pick(['🧣 Šál a čiapka','🧣 Nákrčník + čiapka','🧣 Kapucňa stačí + šál']));
        layers.push(pick(['👕 Sveter','👕 Hrubá mikina','👕 Rolák']));
        emoji='❄️';tip=pick(['Mrzne, ale dá sa prežiť!','Ruky do vreciek.','Ideálne počasie na horúcu čokoládu.']);
    } else if(feelsLike<10){
        layers.push(pick(['🧥 Prechodná bunda','🧥 Bomber bunda','🧥 Kožená bunda','🧥 Softshell']));
        layers.push(pick(['👕 Dlhý rukáv + tenký sveter','👕 Mikina','👕 Flanelová košeľa','👕 Hoodie']));
        emoji='🍂';tip=pick(['Klasické počasie na vrstvenie.','Ráno chladné, poobede OK.','Mikina je tvoj najlepší kamarát.']);
    } else if(feelsLike<18){
        layers.push(pick(['🧥 Ľahká bunda','🧥 Mikina na zips','🧥 Tenká vetrovka','🧥 Košeľa cez tričko']));
        layers.push(pick(['👕 Tričko s dlhým rukávom','👕 Tenká mikina','👕 Polo tričko','👕 Ľanová košeľa']));
        emoji='🌤️';tip=pick(['Príjemne, ale večer pribal vrstvu.','Ideálne na prechádzku.','Ani zima ani teplo — paráda.']);
    } else if(feelsLike<25){
        layers.push(pick(['👕 Tričko','👕 Polo','👕 Ľahká košeľa','👕 Tank top + ľahká košeľa']));
        layers.push(pick(['👖 Ľahké nohavice','👖 Chinos','👖 Plátené nohavice','👖 Rifle']));
        emoji='☀️';tip=pick(['Dnešok bude fajn!','Tričko stačí.','Užívaj slnko!','Dnes sa oplatí ísť von.']);
    } else if(feelsLike<33){
        layers.push(pick(['👕 Ľahké tričko','👕 Tielko','👕 Vzdušná košeľa']));
        layers.push(pick(['🩳 Kraťasy','🩳 Šortky','👖 Ľanové nohavice']));
        emoji='🥵';tip=pick(['Pij veľa vody!','Dnes radšej do tieňa.','Klobúk by nebol na škodu.','Zmrzlina je povinná.']);
    } else {
        layers.push(pick(['👕 Minimum oblečenia','👕 Najľahšie čo máš']));
        layers.push('🩳 Kraťasy / plavky');
        emoji='🔥';tip=pick(['Extrémne teplo — zostaň v chlade!','Hydratácia je základ.','Vyhýbaj sa poludňajšiemu slnku.']);
    }
    if(rain>60){accessories.push(pick(['☂️ Dáždnik je nutnosť!','☂️ Bez dáždnika nechoď!']));footwear=pick(['👢 Nepremokavá obuv','👢 Gumáky','👢 Waterproof topánky'])}
    else if(rain>30){accessories.push(pick(['☂️ Zober dáždnik pre istotu','☂️ Malý skladací dáždnik do tašky']))}
    if(windSpeed>40) accessories.push(pick(['🧣 Poriadne sa zabal, fúka!','💨 Vetrovka nutná!']));
    else if(windSpeed>25) accessories.push(pick(['💨 Vetrovka by sa hodila','💨 Vietor cítiť, mikina nestačí']));
    if([71,73,75,77,85,86].includes(code)){footwear=pick(['👢 Zimná obuv s gripom','👢 Zateplené topánky','👢 Snehule']);accessories.push(pick(['🧤 Rukavice','🧤 Hrubé rukavice']))}
    if(feelsLike>22&&info.severity===0){accessories.push(pick(['🕶️ Slnečné okuliare','🕶️ Okuliare s UV filtrom']));if(feelsLike>26) accessories.push(pick(['🧴 Opaľovací krém','🧴 SPF 30+ na tvár']));if(feelsLike>28) accessories.push(pick(['🧢 Šiltovka / klobúk','👒 Klobúk proti slnku']))}
    if(!footwear){
        if(feelsLike<5) footwear=pick(['👢 Zateplená obuv','👢 Zimné topánky']);
        else if(feelsLike<18) footwear=pick(['👟 Uzavretá obuv','👟 Tenisky','👟 Kotníkové topánky']);
        else footwear=pick(['👟 Tenisky','🩴 Sandále','👟 Ľahká obuv']);
    }
    return {layers,accessories,footwear,emoji,tip,temp:Math.round(temp),feelsLike:Math.round(feelsLike),rain,wind:Math.round(windSpeed)};
}

async function loadTabOutfit(){
    if(isTabFresh('outfit')) return;if(tabInflight.has('outfit')) return;tabInflight.add('outfit');
    tabLoading('loadingOutfit',true);const content=$('contentOutfit');content.innerHTML='';
    try{
        const [currentRes,dailyRes]=await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation&timezone=${state.tz}`),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&daily=precipitation_probability_max&timezone=${state.tz}&forecast_days=1`)
        ]);
        const currentData=await currentRes.json();const dailyData=await dailyRes.json();
        const c=currentData.current;const rainProb=dailyData.daily?.precipitation_probability_max?.[0]??0;
        const adv=getOutfitAdvice(c.temperature_2m,c.apparent_temperature,c.weather_code,c.wind_speed_10m,rainProb);
        let html=`<div class="outfit-section">`;
        html+=`<div style="text-align:center;padding:12px 0 8px"><span style="font-size:36px">${adv.emoji}</span><div class="text-sm font-semibold mt-1">${adv.feelsLike}°C pocitová</div><div class="text-xs" style="color:#6b7fa0">${adv.temp}°C skutočná · 💨 ${adv.wind} km/h · 🌧️ ${adv.rain}%</div></div>`;
        html+='<div class="outfit-title">👕 Oblečenie</div><div class="outfit-items">';adv.layers.forEach(l=>html+=`<span class="outfit-item">${l}</span>`);html+='</div>';
        html+=`<div class="outfit-title">👟 Obuv</div><div class="outfit-items"><span class="outfit-item">${adv.footwear}</span></div>`;
        if(adv.accessories.length){html+='<div class="outfit-title">🎒 Doplnky</div><div class="outfit-items">';adv.accessories.forEach(a=>html+=`<span class="outfit-item">${a}</span>`);html+='</div>'}
        if(adv.tip) html+=`<div class="outfit-tip">💡 ${adv.tip}</div>`;
        html+='</div>';content.innerHTML=html;markTabFresh('outfit');
    } catch{content.innerHTML='<div class="empty-state">Načítanie zlyhalo.</div>'}
    tabInflight.delete('outfit');tabLoading('loadingOutfit',false);
}

async function loadTabTraffic(){
    if(isTabFresh('traffic')) return;if(tabInflight.has('traffic')) return;tabInflight.add('traffic');
    tabLoading('loadingTraffic',true);const content=$('contentTraffic');content.innerHTML='';
    try{
        const [currentData,hourlyData]=await Promise.all([
            (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&current=weather_code,wind_speed_10m,wind_gusts_10m,precipitation&timezone=${state.tz}`)).json(),
            (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&hourly=weather_code&timezone=${state.tz}&forecast_hours=3`)).json()
        ]);
        const c=currentData.current;const h=hourlyData.hourly;const warnings=[];const code=c.weather_code;
        if([66,67].includes(code)) warnings.push({level:'high',icon:'🧊',title:'Riziko poľadovice',desc:'Mrznúci dážď — cesty môžu byť extrémne kĺzavé.'});
        if([71,73,75,85,86].includes(code)) warnings.push({level:'high',icon:'❄️',title:'Sneh na cestách',desc:'Znížená priľnavosť a viditeľnosť.'});
        if([95,96,99].includes(code)) warnings.push({level:'high',icon:'⛈️',title:'Búrka',desc:'Zlá viditeľnosť a možné záplavy.'});
        if([65,82].includes(code)) warnings.push({level:'medium',icon:'🌧️',title:'Silný dážď',desc:'Znížená viditeľnosť a riziko aquaplaningu.'});
        if(c.wind_gusts_10m>60) warnings.push({level:'high',icon:'💨',title:'Nebezpečné nárazy',desc:`Nárazy do ${Math.round(c.wind_gusts_10m)} km/h.`});
        else if(c.wind_speed_10m>40) warnings.push({level:'medium',icon:'💨',title:'Silný vietor',desc:`${Math.round(c.wind_speed_10m)} km/h — opatrnosť na otvorených cestách.`});
        if([45,48].includes(code)) warnings.push({level:'medium',icon:'🌫️',title:'Hmla',desc:'Nízka viditeľnosť — používajte hmlové svetlá.'});
        for(let i=0;i<Math.min(3,h?.time?.length||0);i++){
            const hCode=h.weather_code?.[i];
            if([66,67,71,73,75,95,96,99].includes(hCode)&&!warnings.find(w=>w.title.includes('oľadov')||w.title.includes('Sneh')||w.title.includes('úrka'))){
                warnings.push({level:'low',icon:'⚠️',title:`${wmoText(hCode)} očakávané`,desc:'Podmienky sa môžu zhoršiť.'});break;
            }
        }
        if(!warnings.length){content.innerHTML='<div class="traffic-clear">✅ Žiadne dopravné varovania</div>'}
        else{warnings.forEach(w=>{content.innerHTML+=`<div class="traffic-card ${w.level}"><div class="traffic-title">${w.icon} ${w.title}</div><div class="traffic-desc">${w.desc}</div></div>`})}
        markTabFresh('traffic');
    } catch{content.innerHTML='<div class="empty-state">Načítanie zlyhalo.</div>'}
    tabInflight.delete('traffic');tabLoading('loadingTraffic',false);
}

function getMoonPhase(date=new Date()){
    const known=new Date(2000,0,6,18,14);
    const diff=date.getTime()-known.getTime();
    const synodicMonth=29.53058867;
    const phase=(((diff/86400000)%synodicMonth)+synodicMonth)%synodicMonth;
    const pct=Math.round((phase/synodicMonth)*100);
    let name,emoji;
    if(phase<1.85){name='Nov';emoji='🌑'}
    else if(phase<7.38){name='Dorastajúci kosáčik';emoji='🌒'}
    else if(phase<9.23){name='Prvá štvrť';emoji='🌓'}
    else if(phase<14.77){name='Dorastajúci mesiac';emoji='🌔'}
    else if(phase<16.61){name='Spln';emoji='🌕'}
    else if(phase<22.15){name='Ubúdajúci mesiac';emoji='🌖'}
    else if(phase<23.99){name='Posledná štvrť';emoji='🌗'}
    else if(phase<27.68){name='Ubúdajúci kosáčik';emoji='🌘'}
    else{name='Nov';emoji='🌑'}
    return {name,emoji,phase:pct,synodicDay:Math.round(phase)};
}

async function loadTabMoon(){
    if(isTabFresh('moon')) return;
    tabLoading('loadingMoon',true);const content=$('contentMoon');content.innerHTML='';
    const dayNames=['Ne','Po','Ut','St','Št','Pi','So'];
    let html='<div class="moon-calendar">';
    for(let i=0;i<14;i++){
        const d=new Date();d.setDate(d.getDate()+i);
        const moon=getMoonPhase(d);
        const dn=dayNames[d.getDay()];
        const dateStr=`${d.getDate()}.${d.getMonth()+1}.`;
        html+=`<div class="moon-day-row"><span class="moon-day-date">${dn} ${dateStr}</span><span class="moon-day-emoji">${moon.emoji}</span><span class="moon-day-name">${moon.name}</span><span class="moon-day-phase">Deň ${moon.synodicDay} · ${moon.phase}%</span></div>`;
    }
    html+='</div>';content.innerHTML=html;
    markTabFresh('moon');tabLoading('loadingMoon',false);
}

let historyChart=null;
async function loadTabHistory(){
    if(isTabFresh('history')) return;if(tabInflight.has('history')) return;tabInflight.add('history');
    tabLoading('loadingHistory',true);const content=$('contentHistory');content.innerHTML='';
    try{
        const endDate=new Date();const startDate=new Date();startDate.setDate(startDate.getDate()-7);
        const fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const url=`https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=${state.tz}&past_days=7&forecast_days=1`;
        const data=await(await fetch(url)).json();const d=data.daily;
        const labels=d.time.map(t=>{const dt=new Date(t);return `${dt.getDate()}.${dt.getMonth()+1}.`});
        content.innerHTML='<div class="history-chart-wrap"><canvas id="historyCanvas"></canvas></div>';
        const canvas=$('historyCanvas');
        if(historyChart){historyChart.destroy();historyChart=null}
        if(typeof Chart==='undefined'){content.innerHTML='<div class="empty-state">Graf sa ešte načítava…</div>';tabInflight.delete('history');tabLoading('loadingHistory',false);return}
        historyChart=new Chart(canvas,{
            type:'line',
            data:{
                labels,
                datasets:[
                    {label:'Max °C',data:d.temperature_2m_max,borderColor:'#f87171',backgroundColor:'rgba(248,113,113,.1)',tension:.3,fill:true,pointRadius:3},
                    {label:'Min °C',data:d.temperature_2m_min,borderColor:'#4c6ef5',backgroundColor:'rgba(76,110,245,.1)',tension:.3,fill:true,pointRadius:3}
                ]
            },
            options:{
                responsive:true,maintainAspectRatio:false,
                plugins:{legend:{labels:{color:'#8899b0',font:{family:'Inter',size:11}}}},
                scales:{
                    x:{ticks:{color:'#6b7fa0',font:{family:'Inter',size:10}},grid:{color:'rgba(59,80,104,.2)'}},
                    y:{ticks:{color:'#6b7fa0',font:{family:'Inter',size:10},callback:v=>v+'°'},grid:{color:'rgba(59,80,104,.2)'}}
                }
            }
        });
        markTabFresh('history');
    } catch{content.innerHTML='<div class="empty-state">Načítanie zlyhalo.</div>'}
    tabInflight.delete('history');tabLoading('loadingHistory',false);
}

let radarLayer='rain';

function buildWindyUrl(layer){
    const lat=state.lat||48.15;
    const lon=state.lon||17.11;
    return `https://embed.windy.com/embed2.html?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&detailLat=${lat.toFixed(4)}&detailLon=${lon.toFixed(4)}&zoom=8&level=surface&overlay=${layer}&product=ecmwf&menu=&message=true&marker=&calendar=now&type=map&location=coordinates&metricWind=km%2Fh&metricTemp=%C2%B0C&metricRain=mm&animate=true`;
}

function openRadar(){
    if(!state.lat) return;
    const overlay=$('radarOverlay');if(!overlay) return;
    overlay.classList.remove('hidden');
    document.body.classList.add('radar-active');
    radarLayer='rain';
    document.querySelectorAll('.radar-layer-btn').forEach(b=>b.classList.toggle('active',b.dataset.layer==='rain'));
    const cityLabel=$('radarCityLabel');if(cityLabel) cityLabel.textContent=state.city||'';
    const frame=$('radarFrame');
    if(frame) frame.src=buildWindyUrl(radarLayer);
}

function closeRadar(){
    const frame=$('radarFrame');
    if(frame) frame.src='';
    $('radarOverlay')?.classList.add('hidden');
    document.body.classList.remove('radar-active');
}

function switchRadarLayer(layer){
    radarLayer=layer;
    const frame=$('radarFrame');
    if(frame) frame.src=buildWindyUrl(layer);
    document.querySelectorAll('.radar-layer-btn').forEach(b=>b.classList.toggle('active',b.dataset.layer===layer));
}

function updateRadarLocation(){
    if(!document.body.classList.contains('radar-active')) return;
    const cityLabel=$('radarCityLabel');if(cityLabel) cityLabel.textContent=state.city||'';
    const frame=$('radarFrame');
    if(frame) frame.src=buildWindyUrl(radarLayer);
}

async function handleCitySearch(){
    const query=els.cityInput.value.trim();if(!query) return;
    els.searchBtn.textContent='…';els.cityResults.innerHTML='';els.cityResults.classList.add('hidden');
    try{
        const results=await geocode(query);els.searchBtn.textContent='Hľadaj';
        if(!results.length){els.cityResults.innerHTML='<div class="city-result-item">Žiadne výsledky.</div>';els.cityResults.classList.remove('hidden');return}
        results.slice(0,5).forEach(r=>{
            const item=document.createElement('div');item.className='city-result-item';
            item.innerHTML=`<div>${r.name}</div><div class="sub">${[r.admin1,r.country].filter(Boolean).join(', ')}</div>`;
            item.addEventListener('click',()=>{selectCity(r);els.cityResults.classList.add('hidden')});
            els.cityResults.appendChild(item);
        });
        els.cityResults.classList.remove('hidden');
    } catch{els.searchBtn.textContent='Hľadaj'}
}
function selectCity(result){
    const name=result.name+(result.country?`, ${result.country}`:'');
    loadWeather(result.latitude,result.longitude,result.timezone||'auto',name);
    els.cityInput.value=name;els.cityResults.classList.add('hidden');
}

function showAuthState(loggedIn){
    els.authLogin.classList.toggle('hidden',loggedIn);
    els.authUser.classList.toggle('hidden',!loggedIn);
    els.userConfig.classList.toggle('hidden',!loggedIn);
}
async function checkAuth(){
    const params=new URLSearchParams(window.location.search);
    if(params.get('auth')==='denied'){els.authError.textContent='Prihlásenie zrušené.';els.authError.classList.remove('hidden')}
    else if(params.get('auth')==='error'){els.authError.textContent='Prihlásenie zlyhalo.';els.authError.classList.remove('hidden')}
    if(params.has('auth')) window.history.replaceState({},'','/');
    try{
        const res=await fetch('/auth/me');if(!res.ok){showAuthState(false);return}
        const user=await res.json();state.discordUser=user;
        els.userAvatar.src=user.avatarUrl;els.userName.textContent=user.displayName;els.userTag.textContent=`@${user.username}`;
        showAuthState(true);await loadUserSettings();
    } catch{showAuthState(false)}
}
async function loadUserSettings(){
    try{
        const res=await fetch(`${API_BASE}/me`);const data=res.ok?await res.json():{};
        state.currentUserData=data;populateUserConfig(data);
        if(data.latitude) {loadWeather(data.latitude,data.longitude,data.timezone||'auto',data.city||null);els.cityInput.value=data.city||''}
    } catch(err){console.error('Load settings error:',err);showStatus('Nepodarilo sa načítať nastavenia.','error')}
}
async function handleLogout(){
    try{await fetch('/auth/logout',{method:'POST'})} catch{}
    state.discordUser=null;state.currentUserData=null;showAuthState(false);
}
function populateUserConfig(data){
    setToggle(els.tempToggle,data.units==='fahrenheit'?'fahrenheit':'celsius');
    setToggle(els.windToggle,data.wind_unit||'kmh');
    renderFavourites(data.favorites||[]);
    renderNotifications(data.notifications||[]);
}
function setToggle(container,value){
    if(!container) return;
    container.querySelectorAll('.toggle-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.value===value));
}
function getToggleValue(container){
    if(!container) return null;
    return container.querySelector('.toggle-btn.active')?.dataset.value||null;
}

const NOTIF_TYPES=[
    {value:'daily',label:'📋 Ranný prehľad',desc:'Celý prehľad dňa v nastavený čas',canSchedule:true},
    {value:'severe',label:'⚠️ Výstrahy počasia',desc:'Búrky, silný dážď — typy výstrah',needsSevere:true},
    {value:'weather_change',label:'🔄 Zmena počasia',desc:'Keď sa zmení počasie',needsChanges:true},
    {value:'rain_now',label:'🌧️ Práve prší',desc:'Hneď keď začne pršať',instant:true},
    {value:'storm',label:'⛈️ Búrka sa blíži',desc:'Upozornenie na búrku',instant:true},
    {value:'extreme_temp',label:'🌡️ Extrémna teplota',desc:'Pod 0°C alebo nad 33°C',instant:true},
    {value:'sunrise',label:'🌅 Východ slnka',desc:'X minút pred východom',needsOffset:true},
    {value:'sunset',label:'🌇 Západ slnka',desc:'X minút pred západom',needsOffset:true},
    {value:'moon',label:'🌙 Fáza mesiaca',desc:'Upozornenie na vybranú fázu',needsMoon:true}
];
const CHANGE_OPTIONS=[
    {value:'sunny_to_cloudy',label:'☁️ Zaťahuje sa'},{value:'cloudy_to_sunny',label:'☀️ Vyčasuje sa'},
    {value:'start_rain',label:'🌧️ Začína pršať'},{value:'stop_rain',label:'🌤️ Prestáva pršať'},
    {value:'start_snow',label:'🌨️ Začína snežiť'},{value:'storm_coming',label:'⛈️ Prichádza búrka'},
    {value:'fog_coming',label:'🌫️ Tvorí sa hmla'},{value:'wind_up',label:'💨 Zosilňuje vietor'},
    {value:'temp_drop',label:'🥶 Rýchly pokles teploty'},{value:'temp_rise',label:'🥵 Rýchly nárast teploty'}
];
const SEVERE_OPTIONS=[
    {value:'storm',label:'⛈️ Búrky'},{value:'heavy_rain',label:'🌧️ Silný dážď'},
    {value:'heavy_snow',label:'❄️ Silné sneženie'},{value:'freezing',label:'🧊 Poľadovica'},
    {value:'hail',label:'🧊 Krúpy'},{value:'extreme_wind',label:'💨 Extrémny vietor'}
];
const MOON_PHASE_OPTIONS=[
    {value:'new_moon',label:'🌑 Nov'},{value:'first_quarter',label:'🌓 Prvá štvrť'},
    {value:'full_moon',label:'🌕 Spln'},{value:'last_quarter',label:'🌗 Posledná štvrť'},
    {value:'waxing_crescent',label:'🌒 Dorastajúci kosáčik'},{value:'waning_crescent',label:'🌘 Ubúdajúci kosáčik'}
];

function notifTypeLabel(n){
    const t=NOTIF_TYPES.find(t=>t.value===n.type);
    const base=t?t.label:n.type;
    if(n.event_based&&!n.offset_minutes&&!n.watch_changes?.length&&!n.watch_severe?.length&&!n.watch_moon?.length) return `${base} ⚡`;
    if(n.offset_minutes) return `${base} (${n.offset_minutes}min)`;
    if(n.hour!==null&&n.hour!==undefined){return `${base} @ ${String(n.hour).padStart(2,'0')}:${String(n.minute).padStart(2,'0')}`}
    if(n.watch_changes?.length) return `${base}: ${n.watch_changes.length} zmien`;
    if(n.watch_severe?.length) return `${base}: ${n.watch_severe.length} typov`;
    if(n.watch_moon?.length) return `${base}: ${n.watch_moon.length} fáz`;
    return base;
}
function notifDestLabel(n){
    if(n.destination==='dm') return '💬 DM';
    return '📢 Kanál';
}

const channelNameCache={};
let channelCacheData=null;
async function loadChannels(){
    if(channelCacheData) return channelCacheData;
    try{const res=await fetch('/api/channels');if(!res.ok) return null;channelCacheData=await res.json();return channelCacheData} catch{return null}
}
async function resolveChannelName(channelId){
    if(channelNameCache[channelId]) return channelNameCache[channelId];
    const guilds=channelCacheData||await loadChannels();
    if(guilds){for(const g of guilds){const ch=g.channels?.find(c=>c.id===channelId);if(ch){channelNameCache[channelId]=`#${ch.name}`;return channelNameCache[channelId]}}}
    return `#${channelId}`;
}

function renderNotifications(notifs){
    els.notifList.innerHTML='';
    if(!notifs||!notifs.length){els.notifList.innerHTML='<div class="empty-state">Zatiaľ žiadne notifikácie.</div>';return}
    notifs.forEach(n=>{
        const item=document.createElement('div');item.className='notif-item';
        item.innerHTML=`<div class="notif-status ${n.enabled?'on':'off'}"></div><div class="notif-info"><div class="notif-time">${notifTypeLabel(n)}</div><div class="notif-type notif-ch-${n.id}">${n.destination==='dm'?'💬 DM':'#'+n.channel_id}</div><div class="notif-dest">${notifDestLabel(n)}</div></div><div class="notif-actions"><button class="nimbus-btn-sm" data-id="${n.id}" data-action="edit">✏️</button><button class="nimbus-btn-sm" data-id="${n.id}" data-action="toggle">${n.enabled?'Vyp':'Zap'}</button><button class="nimbus-btn-sm nimbus-btn-danger" data-id="${n.id}" data-action="delete">✕</button></div>`;
        els.notifList.appendChild(item);
        if(n.destination!=='dm'){resolveChannelName(n.channel_id).then(name=>{const el=els.notifList.querySelector(`.notif-ch-${n.id}`);if(el) el.textContent=name})}
    });
    els.notifList.querySelectorAll('[data-action]').forEach(btn=>{
        btn.addEventListener('click',()=>handleNotifAction(btn.dataset.action,btn.dataset.id));
    });
}

function renderFavourites(favs){
    els.favList.innerHTML='';
    if(!favs||!favs.length){els.favList.innerHTML='<div class="empty-state">Žiadne obľúbené mestá.</div>';return}
    favs.forEach((f,i)=>{
        const item=document.createElement('div');item.className='fav-item';
        item.innerHTML=`<div class="fav-name">⭐ ${f.name}</div><div class="fav-coords">${f.latitude?.toFixed(2)}, ${f.longitude?.toFixed(2)}</div><div class="notif-actions"><button class="nimbus-btn-sm" data-idx="${i}" data-action="use">Použiť</button><button class="nimbus-btn-sm nimbus-btn-danger" data-idx="${i}" data-action="remove">✕</button></div>`;
        els.favList.appendChild(item);
    });
    els.favList.querySelectorAll('[data-action]').forEach(btn=>{
        btn.addEventListener('click',()=>handleFavAction(btn.dataset.action,parseInt(btn.dataset.idx)));
    });
}

async function handleFavAction(action,idx){
    if(!state.discordUser) return;
    const favs=state.currentUserData.favorites||[];
    if(action==='use'){
        const fav=favs[idx];if(!fav) return;
        loadWeather(fav.latitude,fav.longitude,fav.timezone||'auto',fav.name);els.cityInput.value=fav.name;
    }
    if(action==='remove'){
        try{await fetch(`${API_BASE}/me/favorites/${idx}`,{method:'DELETE'});state.currentUserData.favorites=favs.filter((_,i)=>i!==idx);renderFavourites(state.currentUserData.favorites)} catch{showStatus('Chyba servera.','error')}
    }
}
async function handleFavSearch(){
    const query=els.favCityInput.value.trim();if(!query) return;
    els.favSearchBtn.textContent='…';els.favCityResults.innerHTML='';els.favCityResults.classList.add('hidden');
    try{
        const results=await geocode(query);els.favSearchBtn.textContent='Hľadaj';
        if(!results.length){els.favCityResults.innerHTML='<div class="city-result-item">Žiadne výsledky.</div>';els.favCityResults.classList.remove('hidden');return}
        results.slice(0,5).forEach(r=>{
            const item=document.createElement('div');item.className='city-result-item';
            item.innerHTML=`<div>${r.name}</div><div class="sub">${[r.admin1,r.country].filter(Boolean).join(', ')}</div>`;
            item.addEventListener('click',()=>saveFavourite(r));
            els.favCityResults.appendChild(item);
        });
        els.favCityResults.classList.remove('hidden');
    } catch{els.favSearchBtn.textContent='Hľadaj'}
}
async function saveFavourite(result){
    if(!state.discordUser) return;
    const favs=state.currentUserData.favorites||[];
    if(favs.length>=10){showStatus('Maximálne 10 obľúbených.','error');return}
    if(favs.some(f=>f.name===result.name&&f.latitude===result.latitude)){showStatus('Mesto už je v obľúbených.','error');return}
    try{
        const res=await fetch(`${API_BASE}/me/favorites`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:result.name,latitude:result.latitude,longitude:result.longitude,timezone:result.timezone})});
        const fav=await res.json();
        if(!state.currentUserData.favorites) state.currentUserData.favorites=[];
        state.currentUserData.favorites.push(fav);renderFavourites(state.currentUserData.favorites);
        els.addFavForm.classList.add('hidden');els.favCityInput.value='';els.favCityResults.classList.add('hidden');
        showStatus(`⭐ ${result.name} pridané!`,'success');
    } catch{showStatus('Chyba servera.','error')}
}

function getSelectedChannel(pickerEl){return pickerEl?.querySelector('.channel-option.selected')?.dataset.id||null}
function getDestValue(destPickerId){return $(destPickerId)?.querySelector('.toggle-btn.active')?.dataset.value||'channel'}

async function buildChannelPicker(containerEl){
    containerEl.innerHTML='<div class="channel-loading">Načítavam kanály…</div>';
    const guilds=await loadChannels();containerEl.innerHTML='';
    if(!guilds||!guilds.length){containerEl.innerHTML='<div class="empty-state">Žiadne spoločné servery.</div>';return}
    const select=document.createElement('div');select.className='channel-select';
    for(const guild of guilds){
        const gh=document.createElement('div');gh.className='channel-guild-header';
        const iconUrl=guild.icon?`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=16`:null;
        gh.innerHTML=iconUrl?`<img src="${iconUrl}" class="channel-guild-icon"> ${guild.name}`:`<span class="channel-guild-icon-fallback">${guild.name[0]}</span> ${guild.name}`;
        select.appendChild(gh);
        for(const ch of guild.channels){
            const opt=document.createElement('div');opt.className='channel-option';opt.dataset.id=ch.id;
            opt.innerHTML=`<span class="channel-hash">#</span> ${ch.name}`;
            opt.addEventListener('click',()=>{select.querySelectorAll('.channel-option').forEach(o=>o.classList.remove('selected'));opt.classList.add('selected')});
            select.appendChild(opt);
        }
    }
    containerEl.appendChild(select);
}

function setupDestToggle(destPickerId,channelPickerId){
    const destPicker=$(destPickerId);const channelPicker=$(channelPickerId);
    if(!destPicker||!channelPicker) return;
    destPicker.addEventListener('click',e=>{
        const btn=e.target.closest('.toggle-btn');if(!btn) return;
        destPicker.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
        if(btn.dataset.value==='dm'){channelPicker.innerHTML='<div class="channel-dm-selected">Notifikácie budú odoslané do DM</div>'}
        else{buildChannelPicker(channelPicker)}
    });
}

let wizardState={type:null,mode:null};
const WIZARD_STEPS=['wizStep1','wizStep2Mode','wizStep2Instant','wizStep2Offset','wizStep2Changes','wizStep2Severe','wizStep2Moon'];

function showWizardStep(stepId){
    WIZARD_STEPS.forEach(id=>{const el=$(id);if(el) el.classList.add('hidden')});
    const el=$(stepId);if(el) el.classList.remove('hidden');
}

function openNotifWizard(){
    wizardState={type:null,mode:'timed'};
    els.notifTypeGrid.innerHTML='';
    NOTIF_TYPES.forEach(t=>{
        const btn=document.createElement('button');btn.className='notif-type-btn';
        btn.innerHTML=`<span class="type-name">${t.label}</span><span class="type-desc">${t.desc}</span>`;
        btn.addEventListener('click',()=>handleWizTypeSelect(t));
        els.notifTypeGrid.appendChild(btn);
    });
    els.changeGrid.innerHTML='';
    CHANGE_OPTIONS.forEach(c=>{
        const btn=document.createElement('button');btn.className='change-btn';btn.textContent=c.label;btn.dataset.value=c.value;
        btn.addEventListener('click',()=>btn.classList.toggle('selected'));
        els.changeGrid.appendChild(btn);
    });
    els.severeGrid.innerHTML='';
    SEVERE_OPTIONS.forEach(c=>{
        const btn=document.createElement('button');btn.className='severe-btn';btn.textContent=c.label;btn.dataset.value=c.value;
        btn.addEventListener('click',()=>btn.classList.toggle('selected'));
        els.severeGrid.appendChild(btn);
    });
    els.moonPhaseGrid.innerHTML='';
    MOON_PHASE_OPTIONS.forEach(c=>{
        const btn=document.createElement('button');btn.className='moon-phase-btn';btn.textContent=c.label;btn.dataset.value=c.value;
        btn.addEventListener('click',()=>btn.classList.toggle('selected'));
        els.moonPhaseGrid.appendChild(btn);
    });
    els.addNotifForm.classList.remove('hidden');showWizardStep('wizStep1');
}

function handleWizTypeSelect(typeDef){
    wizardState.type=typeDef.value;
    if(typeDef.canSchedule){
        els.wizStep2ModeTitle.textContent=`${typeDef.label} — Kedy?`;
        setWizMode('timed');showWizardStep('wizStep2Mode');buildChannelPicker(els.channelPickerMode);
    } else if(typeDef.instant){
        els.wizStep2InstantTitle.textContent=`${typeDef.label} — Kanál`;
        showWizardStep('wizStep2Instant');buildChannelPicker(els.channelPickerInstant);
    } else if(typeDef.needsOffset){
        els.wizStep2OffsetTitle.textContent=`${typeDef.label} — Ako skoro?`;
        setToggle(els.offsetToggle,'0');showWizardStep('wizStep2Offset');buildChannelPicker(els.channelPickerOffset);
    } else if(typeDef.needsChanges){
        els.changeGrid.querySelectorAll('.change-btn').forEach(b=>b.classList.remove('selected'));
        showWizardStep('wizStep2Changes');buildChannelPicker(els.channelPickerChanges);
    } else if(typeDef.needsSevere){
        els.severeGrid.querySelectorAll('.severe-btn').forEach(b=>b.classList.remove('selected'));
        setSevMode('timed');showWizardStep('wizStep2Severe');buildChannelPicker(els.channelPickerSevere);
    } else if(typeDef.needsMoon){
        els.moonPhaseGrid.querySelectorAll('.moon-phase-btn').forEach(b=>b.classList.remove('selected'));
        showWizardStep('wizStep2Moon');buildChannelPicker(els.channelPickerMoon);
    }
}

function setWizMode(mode){
    wizardState.mode=mode;
    els.modeTimedBtn.classList.toggle('active',mode==='timed');els.modeInstantBtn.classList.toggle('active',mode==='instant');
    els.timeInputRow.classList.toggle('hidden-row',mode==='instant');
}
let sevMode='timed';
function setSevMode(mode){
    sevMode=mode;
    els.sevModeTimedBtn.classList.toggle('active',mode==='timed');els.sevModeInstantBtn.classList.toggle('active',mode==='instant');
    els.sevTimeInputRow.classList.toggle('hidden-row',mode==='instant');
}

function closeNotifWizard(){els.addNotifForm.classList.add('hidden');wizardState={type:null,mode:'timed'}}

function parseTime(str){
    const match=str.trim().match(/^(\d{1,2}):(\d{2})$/);
    if(!match) return null;
    const h=parseInt(match[1]),m=parseInt(match[2]);
    if(h>23||m>59) return null;
    return {hour:h,minute:m};
}

async function saveNotifScheduled(){
    if(!state.discordUser) return;
    const dest=getDestValue('destPickerMode');
    const channelId=dest==='dm'?'dm':getSelectedChannel(els.channelPickerMode);
    if(!channelId){showStatus('Vyber kanál.','error');return}
    let hour=null,minute=null,event_based=false;
    if(wizardState.mode==='timed'){
        const t=parseTime(els.notifTime.value);if(!t){showStatus('Neplatný čas. Použi HH:MM','error');return}
        hour=t.hour;minute=t.minute;
    } else {event_based=true}
    await postNotif({channel_id:channelId,type:wizardState.type,hour,minute,event_based,destination:dest});
}
async function saveNotifInstant(){
    const dest=getDestValue('destPickerInstant');
    const channelId=dest==='dm'?'dm':getSelectedChannel(els.channelPickerInstant);
    if(!channelId){showStatus('Vyber kanál.','error');return}
    await postNotif({channel_id:channelId,type:wizardState.type,hour:null,minute:null,event_based:true,destination:dest});
}
async function saveNotifOffset(){
    const dest=getDestValue('destPickerOffset');
    const channelId=dest==='dm'?'dm':getSelectedChannel(els.channelPickerOffset);
    if(!channelId){showStatus('Vyber kanál.','error');return}
    const offset=parseInt(getToggleValue(els.offsetToggle)||'0');
    await postNotif({channel_id:channelId,type:wizardState.type,hour:null,minute:null,event_based:true,offset_minutes:offset,destination:dest});
}
async function saveNotifChanges(){
    const dest=getDestValue('destPickerChanges');
    const channelId=dest==='dm'?'dm':getSelectedChannel(els.channelPickerChanges);
    if(!channelId){showStatus('Vyber kanál.','error');return}
    const selected=[...els.changeGrid.querySelectorAll('.change-btn.selected')].map(b=>b.dataset.value);
    if(!selected.length){showStatus('Vyber aspoň jeden typ zmeny.','error');return}
    await postNotif({channel_id:channelId,type:'weather_change',hour:null,minute:null,event_based:true,watch_changes:selected,destination:dest});
}
async function saveNotifSevere(){
    const dest=getDestValue('destPickerSevere');
    const channelId=dest==='dm'?'dm':getSelectedChannel(els.channelPickerSevere);
    if(!channelId){showStatus('Vyber kanál.','error');return}
    const selected=[...els.severeGrid.querySelectorAll('.severe-btn.selected')].map(b=>b.dataset.value);
    if(!selected.length){showStatus('Vyber aspoň jeden typ výstrahy.','error');return}
    let hour=null,minute=null,event_based=false;
    if(sevMode==='timed'){
        const t=parseTime(els.sevNotifTime.value);if(!t){showStatus('Neplatný čas.','error');return}
        hour=t.hour;minute=t.minute;
    } else {event_based=true}
    await postNotif({channel_id:channelId,type:'severe',hour,minute,event_based,watch_severe:selected,destination:dest});
}
async function saveNotifMoon(){
    const dest=getDestValue('destPickerMoon');
    const channelId=dest==='dm'?'dm':getSelectedChannel(els.channelPickerMoon);
    if(!channelId){showStatus('Vyber kanál.','error');return}
    const selected=[...els.moonPhaseGrid.querySelectorAll('.moon-phase-btn.selected')].map(b=>b.dataset.value);
    if(!selected.length){showStatus('Vyber aspoň jednu fázu.','error');return}
    await postNotif({channel_id:channelId,type:'moon',hour:null,minute:null,event_based:true,watch_moon:selected,destination:dest});
}

async function postNotif(body){
    if(!state.discordUser) return;
    try{
        const res=await fetch(`${API_BASE}/me/notifications`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        const notif=await res.json();
        if(!state.currentUserData.notifications) state.currentUserData.notifications=[];
        state.currentUserData.notifications.push(notif);renderNotifications(state.currentUserData.notifications);
        closeNotifWizard();showStatus('✅ Notifikácia pridaná!','success');
    } catch(err){console.error(err);showStatus('Chyba servera.','error')}
}

let editingNotifId=null;
function openEditNotif(notifId){
    const n=(state.currentUserData.notifications||[]).find(n=>n.id===notifId);
    if(!n) return;
    editingNotifId=notifId;
    const content=els.editNotifContent;content.innerHTML='';
    const t=NOTIF_TYPES.find(t=>t.value===n.type);
    let html=`<div class="text-xs mb-2" style="color:#6b7fa0;">Typ: ${t?t.label:n.type}</div>`;
    html+=`<div class="mb-2"><label class="text-xs block mb-1" style="color:#6b7fa0;">Stav</label><div id="editEnabledToggle" class="toggle-group"><button class="toggle-btn ${n.enabled?'active':''}" data-value="true">Zapnuté</button><button class="toggle-btn ${!n.enabled?'active':''}" data-value="false">Vypnuté</button></div></div>`;
    if(n.hour!==null&&n.hour!==undefined){
        html+=`<div class="mb-2"><label class="text-xs block mb-1" style="color:#6b7fa0;">Čas</label><input type="text" id="editNotifTime" class="nimbus-input text-sm w-full" style="background:#253648;border:1px solid #3b5068;color:#e8edf5;" value="${String(n.hour).padStart(2,'0')}:${String(n.minute).padStart(2,'0')}" maxlength="5"></div>`;
    }
    if(n.watch_changes?.length){html+=`<div class="text-xs mb-1" style="color:#6b7fa0;">Zmeny: ${n.watch_changes.join(', ')}</div>`}
    if(n.watch_severe?.length){html+=`<div class="text-xs mb-1" style="color:#6b7fa0;">Výstrahy: ${n.watch_severe.join(', ')}</div>`}
    if(n.watch_moon?.length){html+=`<div class="text-xs mb-1" style="color:#6b7fa0;">Fázy: ${n.watch_moon.join(', ')}</div>`}
    content.innerHTML=html;
    els.editNotifForm.classList.remove('hidden');
    const enabledToggle=$('editEnabledToggle');
    if(enabledToggle){enabledToggle.addEventListener('click',e=>{const btn=e.target.closest('.toggle-btn');if(!btn) return;enabledToggle.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active')})}
}
async function saveEditNotif(){
    if(!editingNotifId) return;
    const body={};
    const enabledToggle=$('editEnabledToggle');
    if(enabledToggle) body.enabled=getToggleValue(enabledToggle)==='true';
    const timeInput=$('editNotifTime');
    if(timeInput){const t=parseTime(timeInput.value);if(t){body.hour=t.hour;body.minute=t.minute}}
    try{
        const res=await fetch(`${API_BASE}/me/notifications/${editingNotifId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        const updated=await res.json();
        const idx=(state.currentUserData.notifications||[]).findIndex(n=>n.id===editingNotifId);
        if(idx>=0) state.currentUserData.notifications[idx]=updated;
        renderNotifications(state.currentUserData.notifications);
        els.editNotifForm.classList.add('hidden');editingNotifId=null;
        showStatus('✅ Notifikácia upravená!','success');
    } catch{showStatus('Chyba servera.','error')}
}

async function handleNotifAction(action,notifId){
    if(!state.discordUser) return;
    try{
        if(action==='toggle'){
            const res=await fetch(`${API_BASE}/me/notifications/${notifId}`,{method:'PATCH'});
            const updated=await res.json();
            const n=state.currentUserData.notifications.find(n=>n.id===notifId);if(n) n.enabled=updated.enabled;
            renderNotifications(state.currentUserData.notifications);
        }
        if(action==='delete'){
            await fetch(`${API_BASE}/me/notifications/${notifId}`,{method:'DELETE'});
            state.currentUserData.notifications=state.currentUserData.notifications.filter(n=>n.id!==notifId);
            renderNotifications(state.currentUserData.notifications);
        }
        if(action==='edit'){openEditNotif(notifId)}
    } catch(err){console.error('Notif action error:',err);showStatus('Chyba servera.','error')}
}

async function saveSettings(){
    if(!state.discordUser) return;if(els.saveSettingsBtn.disabled) return;
    els.saveSettingsBtn.disabled=true;els.saveSettingsBtn.textContent='💾 Ukladám…';
    const body={
        units:getToggleValue(els.tempToggle)||'celsius',
        wind_unit:getToggleValue(els.windToggle)||'kmh'
    };
    if(state.lat){body.city=state.city;body.latitude=state.lat;body.longitude=state.lon;body.timezone=state.tz}
    try{
        const res=await fetch(`${API_BASE}/me`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        const updated=await res.json();
        state.currentUserData={...updated,notifications:updated.notifications??state.currentUserData?.notifications??[],favorites:updated.favorites??state.currentUserData?.favorites??[]};
        renderNotifications(state.currentUserData.notifications);
        showStatus('✅ Nastavenia uložené!','success');
    } catch{showStatus('Chyba servera.','error')}
    finally{els.saveSettingsBtn.disabled=false;els.saveSettingsBtn.textContent='💾 Uložiť nastavenia'}
}

async function deleteUser(){
    if(!state.discordUser) return;if(!confirm('Vymazať všetky Nimbus dáta? Toto sa nedá vrátiť.')) return;
    try{
        await fetch(`${API_BASE}/me`,{method:'DELETE'});
        await fetch('/auth/logout',{method:'POST'}).catch(()=>{});
        state.discordUser=null;state.currentUserData=null;showAuthState(false);
        showStatus('Dáta vymazané. Odhlásený.','success');
    } catch{showStatus('Chyba servera.','error')}
}

function showStatus(msg,type='success'){
    els.saveStatus.textContent=msg;els.saveStatus.className=`save-status ${type}`;els.saveStatus.classList.remove('hidden');
    setTimeout(()=>els.saveStatus.classList.add('hidden'),3500);
}

function playEntryAnimation(){
    const hour=new Date().getHours();const phase=getSkyPhase(hour);
    if(typeof gsap!=='undefined'){
        gsap.registerPlugin(MotionPathPlugin);
        if(phase==='dawn'||phase==='morning'){
            gsap.fromTo(els.sunContainer,{top:'95%',opacity:0},{top:getSunPosition(hour)?.y+'%'||'30%',opacity:1,duration:3,ease:'power2.out',delay:.5});
        }
        gsap.fromTo('.glass-panel',{y:40,opacity:0},{y:0,opacity:1,duration:.8,ease:'power3.out',delay:.2,clearProps:'all'});
        gsap.fromTo('.wtab',{y:10,opacity:0},{y:0,opacity:1,duration:.4,stagger:.05,ease:'power2.out',delay:.6,clearProps:'all'});
    }
    setTimeout(()=>{
        document.querySelectorAll('.wtab').forEach(el=>{el.style.opacity='';el.style.transform=''});
        const gp=document.querySelector('.glass-panel');if(gp){gp.style.opacity='';gp.style.transform=''}
    },2500);
    if(phase==='day'){
        setTimeout(()=>{const core=document.querySelector('.sun-core');if(!core) return;core.style.transition='box-shadow .3s';core.style.boxShadow='0 0 60px 25px rgba(255,220,0,.9),0 0 120px 50px rgba(255,180,0,.6)';setTimeout(()=>{core.style.boxShadow=''},1500)},600);
    }
    if(phase==='night'||phase==='dusk'){
        const stars=document.querySelectorAll('.star');
        stars.forEach((s,i)=>{s.style.opacity='0';s.style.transition=`opacity .5s ease ${i*.08}s`});
        setTimeout(()=>{els.stars.style.opacity='1';stars.forEach(s=>{s.style.opacity=''})},500);
    }
}

function tryGeolocation(){
    if(!navigator.geolocation) return loadDefaultWeather();
    navigator.geolocation.getCurrentPosition(pos=>{loadWeather(pos.coords.latitude,pos.coords.longitude,'auto','Your Location')},()=>loadDefaultWeather(),{timeout:5000});
}
function loadDefaultWeather(){loadWeather(48.1482,17.1067,'Europe/Bratislava','Bratislava, Slovakia')}

function initEventListeners(){
    $('weatherTabs')?.addEventListener('click',e=>{const btn=e.target.closest('.wtab');if(btn) switchWeatherTab(btn.dataset.tab)});
    els.searchBtn.addEventListener('click',handleCitySearch);
    els.cityInput.addEventListener('keydown',e=>{if(e.key==='Enter') handleCitySearch()});
    document.addEventListener('click',e=>{
        if(!els.cityResults.contains(e.target)&&e.target!==els.cityInput&&e.target!==els.searchBtn) els.cityResults.classList.add('hidden');
        if(!els.favCityResults.contains(e.target)&&e.target!==els.favCityInput&&e.target!==els.favSearchBtn) els.favCityResults.classList.add('hidden');
    });
    els.logoutBtn.addEventListener('click',handleLogout);
    [els.tempToggle,els.windToggle].forEach(group=>{
        group?.addEventListener('click',e=>{const btn=e.target.closest('.toggle-btn');if(!btn) return;group.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active')});
    });
    els.addFavBtn.addEventListener('click',()=>{els.addFavForm.classList.toggle('hidden');els.favCityResults.classList.add('hidden')});
    els.cancelFavBtn.addEventListener('click',()=>{els.addFavForm.classList.add('hidden');els.favCityInput.value='';els.favCityResults.classList.add('hidden')});
    els.favSearchBtn.addEventListener('click',handleFavSearch);
    els.favCityInput.addEventListener('keydown',e=>{if(e.key==='Enter') handleFavSearch()});
    els.addNotifBtn.addEventListener('click',openNotifWizard);
    els.cancelNotifBtn.addEventListener('click',closeNotifWizard);
    els.wizBackBtn2Mode.addEventListener('click',()=>showWizardStep('wizStep1'));
    els.wizBackBtn2Instant.addEventListener('click',()=>showWizardStep('wizStep1'));
    els.wizBackBtn2Offset.addEventListener('click',()=>showWizardStep('wizStep1'));
    els.wizBackBtn2Changes.addEventListener('click',()=>showWizardStep('wizStep1'));
    els.wizBackBtn2Severe.addEventListener('click',()=>showWizardStep('wizStep1'));
    els.wizBackBtn2Moon.addEventListener('click',()=>showWizardStep('wizStep1'));
    els.modeTimedBtn.addEventListener('click',()=>setWizMode('timed'));
    els.modeInstantBtn.addEventListener('click',()=>setWizMode('instant'));
    els.sevModeTimedBtn.addEventListener('click',()=>setSevMode('timed'));
    els.sevModeInstantBtn.addEventListener('click',()=>setSevMode('instant'));
    els.offsetToggle.addEventListener('click',e=>{const btn=e.target.closest('.toggle-btn');if(!btn) return;els.offsetToggle.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active')});
    els.saveNotifBtn.addEventListener('click',saveNotifScheduled);
    els.saveNotifInstantBtn.addEventListener('click',saveNotifInstant);
    els.saveNotifOffsetBtn.addEventListener('click',saveNotifOffset);
    els.saveNotifChangesBtn.addEventListener('click',saveNotifChanges);
    els.saveNotifSevereBtn.addEventListener('click',saveNotifSevere);
    els.saveNotifMoonBtn.addEventListener('click',saveNotifMoon);
    els.saveEditNotifBtn.addEventListener('click',saveEditNotif);
    els.cancelEditNotifBtn.addEventListener('click',()=>{els.editNotifForm.classList.add('hidden');editingNotifId=null});
    els.saveSettingsBtn.addEventListener('click',saveSettings);
    els.deleteUserBtn.addEventListener('click',deleteUser);
    setupDestToggle('destPickerMode','channelPickerMode');
    setupDestToggle('destPickerInstant','channelPickerInstant');
    setupDestToggle('destPickerOffset','channelPickerOffset');
    setupDestToggle('destPickerChanges','channelPickerChanges');
    setupDestToggle('destPickerSevere','channelPickerSevere');
    setupDestToggle('destPickerMoon','channelPickerMoon');
    document.addEventListener('visibilitychange',()=>{
        const paused=document.hidden?'paused':'running';
        document.querySelectorAll('.logo-icon,.weather-icon-big').forEach(el=>{el.style.animationPlayState=paused});
        const sun=document.querySelector('.sun');
        if(sun) sun.querySelectorAll('.sun-ray,.sun-core,.sun-glow').forEach(el=>{el.style.animationPlayState=paused});
        document.querySelectorAll('.cloud').forEach(el=>{el.style.animationPlayState=paused});
        const moon=document.querySelector('.moon');
        if(moon) moon.style.animationPlayState=paused;
    });
    $('radarOpenBtn')?.addEventListener('click',openRadar);
    $('radarCloseBtn')?.addEventListener('click',closeRadar);
    document.querySelectorAll('.radar-layer-btn').forEach(btn=>{
        btn.addEventListener('click',()=>switchRadarLayer(btn.dataset.layer));
    });
    const touchLayer=$('radarTouchLayer');
    if(touchLayer){
        let dragging=false,startX=0,startY=0;
        touchLayer.addEventListener('mousedown',e=>{dragging=false;startX=e.clientX;startY=e.clientY;touchLayer.style.pointerEvents='none';});
        document.addEventListener('mousemove',e=>{if(Math.abs(e.clientX-startX)>3||Math.abs(e.clientY-startY)>3) dragging=true;});
        document.addEventListener('mouseup',()=>{setTimeout(()=>{if(touchLayer) touchLayer.style.pointerEvents='auto'},50);});
        touchLayer.addEventListener('wheel',e=>{touchLayer.style.pointerEvents='none';setTimeout(()=>{if(touchLayer) touchLayer.style.pointerEvents='auto'},100);},{passive:true});
        touchLayer.addEventListener('touchstart',()=>{touchLayer.style.pointerEvents='none';},{passive:true});
        document.addEventListener('touchend',()=>{setTimeout(()=>{if(touchLayer) touchLayer.style.pointerEvents='auto'},300);});
    }
}

function init(){
    EL_IDS.forEach(id=>{els[id]=$(id)});
    const hour=new Date().getHours();
    updateSkyScene(0,hour>=6&&hour<20?1:0,hour);
    startClock();
    let _lastSkyHour=-1;
    setInterval(()=>{
        const h=state.cityHour!=null?state.cityHour:new Date().getHours();
        if(h!==_lastSkyHour){_lastSkyHour=h;updateSkyScene(state.weatherCode,state.isDay,h)}
    },60000);
    function tryEntry(){
        if(typeof gsap!=='undefined') playEntryAnimation();
        else setTimeout(tryEntry,200);
    }
    setTimeout(tryEntry,300);
    initEventListeners();
    checkAuth();
    tryGeolocation();
    if(Math.random()<0.01){const tb=document.querySelector('[data-tab="traffic"]');if(tb) tb.textContent='🚗 Doľava'}
    initFavicon();
}

const FAVICON_SVGS={
    sun:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="7" fill="%23FFD700"/><g stroke="%23FFD700" stroke-width="2" stroke-linecap="round"><line x1="16" y1="2" x2="16" y2="6"/><line x1="16" y1="26" x2="16" y2="30"/><line x1="2" y1="16" x2="6" y2="16"/><line x1="26" y1="16" x2="30" y2="16"/><line x1="6.1" y1="6.1" x2="8.9" y2="8.9"/><line x1="23.1" y1="23.1" x2="25.9" y2="25.9"/><line x1="6.1" y1="25.9" x2="8.9" y2="23.1"/><line x1="23.1" y1="8.9" x2="25.9" y2="6.1"/></g></svg>`,
    moon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M22 4a12 12 0 1 0 0 24A12 12 0 0 1 22 4z" fill="%23e8e4d4"/></svg>`,
    cloud:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M8 24h16a6 6 0 0 0 1-11.9A8 8 0 0 0 9 14a6 6 0 0 0-1 10z" fill="%23b0bec5"/></svg>`,
    rain:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M8 20h16a6 6 0 0 0 1-11.9A8 8 0 0 0 9 10a6 6 0 0 0-1 10z" fill="%2390a4ae"/><line x1="10" y1="24" x2="9" y2="28" stroke="%234fc3f7" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="24" x2="15" y2="30" stroke="%234fc3f7" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="24" x2="21" y2="28" stroke="%234fc3f7" stroke-width="2" stroke-linecap="round"/></svg>`,
    lightning:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M8 18h16a6 6 0 0 0 1-11.9A8 8 0 0 0 9 8a6 6 0 0 0-1 10z" fill="%23616161"/><polygon points="17,18 13,25 16,25 14,32 21,23 17,23 19,18" fill="%23FFD700"/></svg>`
};
function initFavicon(){
    let link=document.querySelector('link[rel="icon"]');
    if(!link){link=document.createElement('link');link.rel='icon';link.type='image/svg+xml';document.head.appendChild(link)}
    updateFavicon();
}
function updateFavicon(){
    const link=document.querySelector('link[rel="icon"]');if(!link) return;
    const code=state.weatherCode;const isDay=state.isDay;const cloudiness=getCloudinessForCode(code);
    let svg;
    if([95,96,99].includes(code)) svg=FAVICON_SVGS.lightning;
    else if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) svg=FAVICON_SVGS.rain;
    else if(cloudiness>=0.8) svg=FAVICON_SVGS.cloud;
    else if(!isDay) svg=FAVICON_SVGS.moon;
    else svg=FAVICON_SVGS.sun;
    link.href='data:image/svg+xml,'+svg;
}

document.addEventListener('DOMContentLoaded',init);
