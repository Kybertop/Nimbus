const Sky = (() => {
    const GRADS = {
        storm:'linear-gradient(180deg,#1a1a2e 0%,#2a2a40 40%,#3a3a50 100%)',
        snow:'linear-gradient(180deg,#607080 0%,#7e8e9c 40%,#98a8b4 70%,#b0bcc6 100%)',
        rain_light:'linear-gradient(180deg,#4a6078 0%,#6488a0 35%,#7ea0b4 65%,#94b2c4 100%)',
        rain:'linear-gradient(180deg,#405060 0%,#5a7080 35%,#708898 65%,#889ca8 100%)',
        rain_heavy:'linear-gradient(180deg,#2a3846 0%,#405868 35%,#566e80 65%,#6c8292 100%)',
        fog:'linear-gradient(180deg,#8090a0 0%,#96a4b2 35%,#aab6c0 65%,#bec8d0 100%)',
        overcast:'linear-gradient(180deg,#4e6480 0%,#6a7e98 35%,#8294a8 65%,#95a5b6 100%)',
        night_storm:'linear-gradient(180deg,#0a0a18 0%,#141428 35%,#1e1e35 65%,#252540 100%)',
        night_rain:'linear-gradient(180deg,#0c1020 0%,#182038 35%,#223050 60%,#2a3858 100%)',
        night_rain_heavy:'linear-gradient(180deg,#06081a 0%,#10182a 35%,#1a2440 60%,#222c4c 100%)',
        night_rain_light:'linear-gradient(180deg,#121a30 0%,#1e2848 35%,#2c3860 60%,#364468 100%)',
        night_snow:'linear-gradient(180deg,#151828 0%,#222840 35%,#303852 60%,#3a4260 100%)',
        night_fog:'linear-gradient(180deg,#2a3448 0%,#384258 35%,#485268 60%,#586278 100%)',
        night_overcast:'linear-gradient(180deg,#0e1428 0%,#1a2238 60%,#263050 100%)',
        dawn:'linear-gradient(180deg,#2a2050 0%,#5a3868 22%,#a85870 48%,#d08868 70%,#e8b478 90%)',
        morning:'linear-gradient(180deg,#1a60a0 0%,#2e80c0 30%,#4a9cd4 60%,#6ab4e0 85%)',
        day:'linear-gradient(180deg,#1558a0 0%,#1e72b8 22%,#2e8cd0 48%,#48a4dc 70%,#62b8e6 90%)',
        evening:'linear-gradient(180deg,#1a5890 0%,#2870a0 18%,#b07040 48%,#d08838 68%,#e0a048 88%)',
        dusk:'linear-gradient(180deg,#181830 0%,#282040 25%,#5a3850 52%,#904858 76%,#b06858 95%)',
        night:'linear-gradient(180deg,#080e20 0%,#101830 32%,#182040 65%,#202848 100%)',
    };

    const HORIZONS = {
        dawn:'linear-gradient(0deg,rgba(240,180,100,0.25),transparent)',
        morning:'linear-gradient(0deg,rgba(150,200,240,0.1),transparent)',
        day:'linear-gradient(0deg,rgba(150,200,240,0.1),transparent)',
        evening:'linear-gradient(0deg,rgba(255,140,50,0.2),transparent)',
        dusk:'linear-gradient(0deg,rgba(160,80,60,0.2),transparent)',
        night:'linear-gradient(0deg,rgba(20,30,60,0.15),transparent)',
    };

    let canvas, ctx, stars = [], particles = [], lightning = {next:0,opacity:0};
    let rafId = null, lastTs = 0;
    let currentCode = 0, currentHour = 12, currentPhase = 'day';
    let container;

    function phase(h) {
        if (h>=5&&h<7) return 'dawn';
        if (h>=7&&h<10) return 'morning';
        if (h>=10&&h<16) return 'day';
        if (h>=16&&h<19) return 'evening';
        if (h>=19&&h<21) return 'dusk';
        return 'night';
    }

    function sunPos(h) {
        if (h<6||h>20) return null;
        const p=(h-6)/14;
        return {x:15+p*70, y:60-Math.sin(p*Math.PI)*45};
    }

    function moonPos(h) {
        let p;
        if (h>=19) p=(h-19)/11;
        else if (h<6) p=(h+5)/11;
        else return null;
        return {x:20+p*60, y:55-Math.sin(p*Math.PI)*40};
    }

    function getMoonPhase(date) {
        const d = date||new Date();
        const jd = Math.floor(365.25*(d.getFullYear()+4716))+Math.floor(30.6001*(d.getMonth()<2?d.getMonth()+14:d.getMonth()+2))+d.getDate()-1524.5;
        const p = (((jd-2451549.5)/29.53059)%1+1)%1;
        const illum = Math.round((1-Math.cos(p*2*Math.PI))*50);
        const waxing = p<0.5;
        return {illum, waxing};
    }

    function init() {
        container = document.getElementById('skyScene');
        if (!container) return;
        container.innerHTML = '';

        const gradDiv = document.createElement('div');
        gradDiv.className = 'sky-gradient';
        gradDiv.id = 'skyGrad';
        container.appendChild(gradDiv);

        const horizonDiv = document.createElement('div');
        horizonDiv.className = 'sky-horizon';
        horizonDiv.id = 'skyHorizon';
        container.appendChild(horizonDiv);

        canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
        container.appendChild(canvas);
        ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };
        resize();
        let resizeT;
        window.addEventListener('resize', () => {
            clearTimeout(resizeT);
            resizeT = setTimeout(resize, 120);
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) pause();
            else resume();
        });

        stars = Array.from({length:35}, () => ({
            x:Math.random(), y:Math.random()*0.6,
            r:0.4+Math.random()*1.2,
            speed:1.5+Math.random()*3,
            offset:Math.random()*Math.PI*2,
        }));

        rafId = requestAnimationFrame(render);
    }

    function render(ts) {
        const dt = Math.min((ts-lastTs)/1000, 0.05);
        lastTs = ts;
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const ph = currentPhase;
        const showStars = ph==='night'||ph==='dusk';
        const code = currentCode;
        const isDrizzle = [51,53].includes(code);
        const isRainLight = [61,80].includes(code);
        const isRainHeavy = [65,82].includes(code);
        const isRain = [51,53,55,61,63,65,66,67,80,81,82].includes(code);
        const isSnow = [71,73,75,77,85,86].includes(code);
        const isSnowHeavy = [75,86].includes(code);
        const isStorm = [95,96,99].includes(code);
        const isFog = [45,48].includes(code);

        if (!showStars && !isRain && !isStorm && !isSnow && !isFog && lightning.opacity <= 0) {
            rafId = null;
            return;
        }

        if (showStars) {
            const t = ts/1000;
            stars.forEach(s => {
                const a = 0.3+0.7*(0.5+0.5*Math.sin(t/s.speed+s.offset));
                const bright = ph==='night'?a:a*0.4;
                ctx.beginPath();
                ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2);
                ctx.fillStyle = `rgba(220,230,255,${bright})`;
                ctx.fill();
            });
        }

        if (isRain||isStorm) {
            const wind = isStorm?0.08:isRainHeavy?0.06:isRainLight?0.04:isDrizzle?0.02:0.05;
            let alpha, lenMult, widthMult, speedMult;
            if (isStorm) { alpha = 0.8; lenMult = 24; widthMult = 1.5; speedMult = 2.4; }
            else if (isRainHeavy) { alpha = 0.75; lenMult = 20; widthMult = 1.2; speedMult = 2.0; }
            else if (isRainLight) { alpha = 0.6; lenMult = 12; widthMult = 0.85; speedMult = 1.4; }
            else if (isDrizzle) { alpha = 0.65; lenMult = 7; widthMult = 0.9; speedMult = 1.3; }
            else { alpha = 0.68; lenMult = 16; widthMult = 1.0; speedMult = 1.7; }
            ctx.strokeStyle = `rgba(200,220,240,${alpha})`;
            ctx.lineCap = 'round';
            particles.forEach(p => {
                p.y += p.speed*dt*speedMult;
                p.x += wind*dt;
                if (p.y>1) {p.y=0;p.x=Math.random();}
                if (p.x>1) p.x=0;
                const len = p.size*lenMult;
                ctx.lineWidth = p.size*widthMult;
                ctx.beginPath();
                ctx.moveTo(p.x*W, p.y*H);
                ctx.lineTo(p.x*W+wind*len*3, p.y*H+len);
                ctx.stroke();
            });
        }

        if (isSnow) {
            const t = ts/1000;
            const fallSpeed = isSnowHeavy ? 0.9 : 0.5;
            particles.forEach(p => {
                p.y += p.speed*dt*fallSpeed;
                p.wobble += dt*1.5;
                p.x += Math.sin(p.wobble)*0.0008+p.drift*dt*0.1;
                if (p.y>1) {p.y=-0.02;p.x=Math.random();}
                if (p.x>1) p.x=0;
                if (p.x<0) p.x=1;
                const a = 0.4+0.3*Math.sin(t+p.wobble);
                ctx.beginPath();
                ctx.arc(p.x*W, p.y*H, p.size, 0, Math.PI*2);
                ctx.fillStyle = `rgba(240,245,255,${a})`;
                ctx.fill();
            });
        }

        if (isStorm) {
            if (ts > lightning.next) {
                if (Math.random()<0.3) {
                    lightning.opacity = 0.6+Math.random()*0.3;
                    lightning.next = ts+80+Math.random()*120;
                } else {
                    lightning.next = ts+1500+Math.random()*3000;
                }
            }
            if (lightning.opacity > 0) {
                ctx.fillStyle = `rgba(200,210,255,${lightning.opacity})`;
                ctx.fillRect(0, 0, W, H);
                lightning.opacity *= 0.85;
                if (lightning.opacity < 0.01) lightning.opacity = 0;
            }
        }

        if (isFog) {
            const grd = ctx.createLinearGradient(0, 0, 0, H);
            grd.addColorStop(0, 'rgba(200,210,220,0.15)');
            grd.addColorStop(0.4, 'rgba(200,210,220,0.3)');
            grd.addColorStop(1, 'rgba(200,210,220,0.45)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, W, H);
        }

        rafId = requestAnimationFrame(render);
    }

    function update(code, hour) {
        currentCode = code;
        currentHour = hour;
        currentPhase = phase(hour);

        const isDrizzle = [51,53].includes(code);
        const isRainLight = [61,80].includes(code);
        const isRainHeavy = [65,82].includes(code);
        const isRain = [51,53,55,61,63,65,66,67,80,81,82].includes(code);
        const isSnow = [71,73,75,77,85,86].includes(code);
        const isSnowHeavy = [75,86].includes(code);
        const isStorm = [95,96,99].includes(code);
        const isFog = [45,48].includes(code);
        const isOvc = code === 3;
        const severity = isStorm?3:(isRain||isSnow)?2:(isOvc||isFog)?1:0;
        const ph = currentPhase;

        let gradKey;
        const isNight = ph==='night'||ph==='dusk';
        if (isStorm) gradKey = isNight?'night_storm':'storm';
        else if (isSnow) gradKey = isNight?'night_snow':'snow';
        else if (isRainHeavy) gradKey = isNight?'night_rain_heavy':'rain_heavy';
        else if (isRainLight||isDrizzle) gradKey = isNight?'night_rain_light':'rain_light';
        else if (isRain) gradKey = isNight?'night_rain':'rain';
        else if (isFog) gradKey = isNight?'night_fog':'fog';
        else if (isOvc) gradKey = isNight?'night_overcast':'overcast';
        else gradKey = ph;

        const gradStr = GRADS[gradKey]||GRADS.day;
        const gradEl = document.getElementById('skyGrad');
        if (gradEl) gradEl.style.background = gradStr;

        const hexes = gradStr.match(/#[0-9a-fA-F]{6}/g) || [];
        const bottomC = hexes[hexes.length-1] || '#152040';
        document.documentElement.style.backgroundColor = bottomC;
        document.body.style.background = bottomC;

        const horizEl = document.getElementById('skyHorizon');
        if (horizEl) horizEl.style.background = HORIZONS[ph]||HORIZONS.day;

        const pCount = isStorm?90:isRainHeavy?65:isRainLight?40:isDrizzle?30:isRain?50:isSnowHeavy?55:isSnow?30:isFog?40:0;
        if (pCount !== particles.length) {
            particles = Array.from({length:pCount}, () => ({
                x:Math.random(), y:Math.random(),
                speed: isSnow?(isSnowHeavy?0.5+Math.random()*0.5:0.2+Math.random()*0.4):isStorm?1.4+Math.random()*0.8:isRainHeavy?1.1+Math.random()*0.6:isRainLight?0.5+Math.random()*0.4:isDrizzle?0.4+Math.random()*0.3:0.7+Math.random()*0.6,
                size: isSnow?(isSnowHeavy?1.5+Math.random()*2.5:1+Math.random()*2.5):isStorm?2.2+Math.random()*1.3:isRainHeavy?1.8+Math.random()*1.0:isRainLight?1.1+Math.random()*0.6:isDrizzle?1.1+Math.random()*0.5:1.3+Math.random()*0.9,
                drift: isSnow?(Math.random()-0.5)*(isSnowHeavy?0.5:0.3):isFog?(Math.random()-0.5)*0.02:0,
                wobble: Math.random()*Math.PI*2,
            }));
        }

        const showSun = (ph==='day'||ph==='morning'||ph==='evening'||ph==='dawn')&&!isStorm&&!isOvc&&!isFog&&!isRain&&!isSnow;
        const showMoon = (ph==='night'||ph==='dusk')&&!isStorm&&!isOvc&&!isFog&&!isRain&&!isSnow;
        const celestialOpacity = code===2?0.8:code===1?0.95:1;
        const cloudCount = isStorm?5:isOvc||isRain||isSnow?4:code===2?2:code<=1?0:1;
        container.querySelectorAll('.sky-sun,.sky-moon,.cloud-layer').forEach(el => el.remove());

        if (showSun) {
            const sp = sunPos(hour);
            if (sp) {
                const el = document.createElement('div');
                el.className = 'sky-sun';
                el.style.cssText = `left:${sp.x}%;top:${sp.y}%;transform:translate(-50%,-50%);opacity:${celestialOpacity}`;
                el.innerHTML = `
                    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:40vmin;height:40vmin;border-radius:50%;background:radial-gradient(circle,rgba(250,232,190,0.18) 0%,rgba(242,218,160,0.06) 35%,transparent 65%)"></div>
                    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(255,238,190,0.42) 0%,rgba(252,225,160,0.22) 18%,rgba(248,212,135,0.08) 38%,rgba(242,200,115,0.02) 55%,transparent 72%)"></div>
                    <div style="position:relative;width:56px;height:56px;border-radius:50%;background:radial-gradient(circle at 44% 40%,#fff9f0,#f8e6c0 40%,#ecd498 70%,#dfc280);filter:blur(1.5px);box-shadow:0 0 18px 8px rgba(248,228,175,0.45),0 0 40px 16px rgba(242,215,148,0.22),0 0 70px 28px rgba(235,200,125,0.08)"></div>
                    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-35deg);width:220px;height:1.5px;border-radius:1px;background:linear-gradient(90deg,transparent 5%,rgba(255,240,210,0.06) 25%,rgba(255,242,218,0.12) 42%,rgba(255,244,222,0.14) 50%,rgba(255,242,218,0.12) 58%,rgba(255,240,210,0.06) 75%,transparent 95%);animation:flareA 8s ease-in-out infinite"></div>
                    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(58deg);width:160px;height:1px;border-radius:1px;background:linear-gradient(90deg,transparent 10%,rgba(255,240,212,0.04) 30%,rgba(255,242,216,0.09) 46%,rgba(255,243,220,0.11) 54%,rgba(255,240,212,0.04) 70%,transparent 90%);animation:flareB 11s ease-in-out infinite"></div>
                    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-75deg);width:110px;height:0.8px;border-radius:1px;background:linear-gradient(90deg,transparent 15%,rgba(255,242,218,0.03) 35%,rgba(255,243,220,0.07) 48%,rgba(255,243,220,0.07) 52%,rgba(255,242,218,0.03) 65%,transparent 85%);animation:flareC 14s ease-in-out infinite"></div>
                `;
                container.appendChild(el);
            }
        }

        if (showMoon) {
            const mp = moonPos(hour);
            if (mp) {
                const moon = getMoonPhase();
                const glowStrength = Math.max(0.08, moon.illum/100*0.35);
                const r = 28, s = r/12, dark = '#1a2030';
                const frac = Math.max(0,Math.min(100,moon.illum))/100;
                let svgContent;

                if (frac < 0.01) {
                    svgContent = `<circle cx="${r}" cy="${r}" r="${r}" fill="${dark}"/>`;
                } else if (frac > 0.99) {
                    svgContent = `<circle cx="${r}" cy="${r}" r="${r}" fill="#e8e2d0"/><circle cx="${10*s}" cy="${8*s}" r="${3.5*s}" fill="#c8c0a0" opacity="0.45"/><circle cx="${16*s}" cy="${6*s}" r="${2.2*s}" fill="#bab298" opacity="0.4"/><circle cx="${7*s}" cy="${15*s}" r="${2.8*s}" fill="#c0b89c" opacity="0.35"/><circle cx="${17*s}" cy="${15*s}" r="${2*s}" fill="#b8b090" opacity="0.3"/><circle cx="${12*s}" cy="${11*s}" r="${1.6*s}" fill="#b0a888" opacity="0.28"/>`;
                } else {
                    const f = frac*2-1, bulge = Math.max(0.1,Math.abs(f)*r);
                    const lp = moon.waxing
                        ? `M ${r},0 A ${r},${r} 0 0,0 ${r},${r*2} A ${bulge},${r} 0 0,${f>=0?0:1} ${r},0 Z`
                        : `M ${r},0 A ${r},${r} 0 0,1 ${r},${r*2} A ${bulge},${r} 0 0,${f>=0?1:0} ${r},0 Z`;
                    svgContent = `<defs><clipPath id="bgmc"><path d="${lp}"/></clipPath></defs><circle cx="${r}" cy="${r}" r="${r}" fill="${dark}"/><g clip-path="url(#bgmc)"><circle cx="${r}" cy="${r}" r="${r}" fill="#e8e2d0"/><circle cx="${10*s}" cy="${8*s}" r="${3.5*s}" fill="#c8c0a0" opacity="0.45"/><circle cx="${16*s}" cy="${6*s}" r="${2.2*s}" fill="#bab298" opacity="0.4"/><circle cx="${7*s}" cy="${15*s}" r="${2.8*s}" fill="#c0b89c" opacity="0.35"/><circle cx="${17*s}" cy="${15*s}" r="${2*s}" fill="#b8b090" opacity="0.3"/><circle cx="${12*s}" cy="${11*s}" r="${1.6*s}" fill="#b0a888" opacity="0.28"/></g>`;
                }

                const sz = r*2;
                const glowSize = 15+moon.illum/100*25;
                const el = document.createElement('div');
                el.className = 'sky-moon';
                el.style.cssText = `left:${mp.x}%;top:${mp.y}%;transform:translate(-50%,-50%);opacity:${0.88*celestialOpacity}`;
                el.innerHTML = `
                    <div style="position:relative;width:${sz+60}px;height:${sz+60}px;display:flex;align-items:center;justify-content:center">
                        <div style="position:absolute;inset:-10px;border-radius:50%;background:radial-gradient(circle,rgba(220,215,190,${glowStrength*1.2}) 0%,rgba(210,205,180,${glowStrength*0.5}) 35%,rgba(200,195,170,${glowStrength*0.15}) 55%,transparent 70%);animation:moonGlow 5s ease-in-out infinite"></div>
                        <div style="position:relative;filter:drop-shadow(0 0 ${glowSize}px rgba(215,210,185,${glowStrength*0.5})) drop-shadow(0 0 ${glowSize*0.4}px rgba(220,215,195,${glowStrength*0.3}))">
                            <svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>
                        </div>
                    </div>
                `;
                container.appendChild(el);
            }
        }

        function generateCloudStrip(w, h, col) {
            const pad = 40;
            const cw = w, ch = h + pad * 2;
            const c = document.createElement('canvas');
            c.width = cw; c.height = ch;
            const ctx = c.getContext('2d');
            const numClouds = 2 + Math.floor(Math.random() * 2);

            ctx.fillStyle = col;
            for (let i = 0; i < numClouds; i++) {
                const cx = cw * 0.12 + Math.random() * cw * 0.76;
                const cy = ch * 0.48;
                const rw = 55 + Math.random() * 110;
                const rh = 16 + Math.random() * 26;
                const flatness = 0.3 + Math.random() * 0.5;
                const density = 50 + Math.floor(Math.random() * 50);
                const circleMin = 6 + Math.random() * 4;
                const circleMax = 10 + Math.random() * 10;

                for (let n = 0; n < density; n++) {
                    const a = Math.random() * Math.PI * 2;
                    const d = Math.random();
                    const px = cx + Math.cos(a) * d * rw;
                    const py = cy + Math.sin(a) * d * rh * flatness;
                    const pr = circleMin + (1 - d) * circleMax + Math.random() * 4;
                    ctx.beginPath();
                    ctx.arc(px, py, pr, 0, Math.PI * 2);
                    ctx.fill();
                }

                const bumps = 1 + Math.floor(Math.random() * 4);
                for (let b = 0; b < bumps; b++) {
                    const bx = cx + (Math.random() - 0.5) * rw * 1.5;
                    const by = cy - rh * 0.5 - Math.random() * rh;
                    const br = 10 + Math.random() * 18;
                    const bd = 15 + Math.floor(Math.random() * 15);
                    for (let n = 0; n < bd; n++) {
                        const a = Math.random() * Math.PI * 2;
                        const d = Math.random();
                        const px = bx + Math.cos(a) * d * br;
                        const py = by + Math.sin(a) * d * br * 0.7;
                        const pr = 4 + (1 - d) * 8 + Math.random() * 3;
                        ctx.beginPath();
                        ctx.arc(px, py, pr, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            const c2 = document.createElement('canvas');
            c2.width = cw; c2.height = ch;
            const ctx2 = c2.getContext('2d');
            ctx2.drawImage(c, 0, 0);

            ctx2.globalCompositeOperation = 'destination-out';
            const fade = 100;
            let g = ctx2.createLinearGradient(0, 0, fade, 0);
            g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx2.fillStyle = g; ctx2.fillRect(0, 0, fade, ch);
            g = ctx2.createLinearGradient(cw - fade, 0, cw, 0);
            g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
            ctx2.fillStyle = g; ctx2.fillRect(cw - fade, 0, fade, ch);
            g = ctx2.createLinearGradient(0, 0, 0, pad);
            g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx2.fillStyle = g; ctx2.fillRect(0, 0, cw, pad);
            g = ctx2.createLinearGradient(0, ch - pad, 0, ch);
            g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
            ctx2.fillStyle = g; ctx2.fillRect(0, ch - pad, cw, pad);
            ctx2.globalCompositeOperation = 'source-over';
            return c2.toDataURL();
        }

        const cloudVis = severity >= 3 ? 0.75 : severity >= 2 ? 0.55 : severity >= 1 ? 0.4 : cloudCount > 0 ? 0.3 : 0;
        let cCol;
        if (severity >= 3) cCol = 'rgba(105,110,125,0.7)';
        else if (severity >= 2) cCol = 'rgba(175,185,205,0.55)';
        else if (severity >= 1) cCol = 'rgba(215,225,240,0.45)';
        else cCol = 'rgba(240,246,255,0.4)';

        if (cloudVis > 0) {
            [{w:1300,h:200,dur:50,y:'0%'},{w:1000,h:180,dur:38,y:'8%'},{w:1600,h:220,dur:65,y:'3%'},{w:850,h:160,dur:30,y:'16%'}].forEach((s,i) => {
                const tex = generateCloudStrip(s.w, s.h, cCol);
                const outer = document.createElement('div');
                outer.className = 'cloud-layer';
                outer.style.cssText = `position:absolute;top:${s.y};left:0;right:0;height:${s.h+80}px;overflow:hidden;opacity:${cloudVis};pointer-events:none`;
                const inner = document.createElement('div');
                inner.className = 'cloud-layer-inner';
                inner.style.cssText = `position:absolute;top:0;left:0;height:100%;width:calc(100% + ${s.w}px);background:url(${tex}) repeat-x;background-size:${s.w}px ${s.h+80}px;animation:cloudSlide${i} ${s.dur}s linear infinite;will-change:transform;transform:translateZ(0);filter:blur(8px);-webkit-filter:blur(8px)`;
                outer.appendChild(inner);
                container.appendChild(outer);
            });
        }

        if (!rafId && !document.hidden) { lastTs = 0; rafId = requestAnimationFrame(render); }
    }

    function pause() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
    function resume() { if (!rafId) { lastTs = 0; rafId = requestAnimationFrame(render); } }

    return { init, update, sunPos, moonPos, getMoonPhase, pause, resume };
})();
