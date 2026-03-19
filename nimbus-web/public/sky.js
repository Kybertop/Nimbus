const Sky = (() => {
    const GRADS = {
        dawn:    'linear-gradient(180deg, #1a1a4e 0%, #4a2060 20%, #c0506a 45%, #f0905a 65%, #ffd080 85%, #ffe8a0 100%)',
        morning: 'linear-gradient(180deg, #1a6abf 0%, #4da8e8 30%, #7dc8f8 60%, #aadcf8 80%, #d0eefa 100%)',
        day:     'linear-gradient(180deg, #1565c0 0%, #1e88e5 25%, #42a5f5 55%, #90caf9 80%, #bbdefb 100%)',
        evening: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 20%, #e65100 55%, #ff8f00 75%, #ffca28 100%)',
        dusk:    'linear-gradient(180deg, #0d0d30 0%, #1a1040 25%, #6a2050 50%, #c05040 70%, #e08050 100%)',
        night:   'linear-gradient(180deg, #020410 0%, #060820 30%, #0a0d30 60%, #0f1540 100%)',
        overcast_day:   'linear-gradient(180deg, #2e3440 0%, #3d4555 30%, #5a6275 60%, #7a8290 85%, #9aa0a8 100%)',
        overcast_night: 'linear-gradient(180deg, #0a0c14 0%, #101420 30%, #181c28 60%, #202430 100%)',
        rain_day:       'linear-gradient(180deg, #1a2030 0%, #252e40 25%, #364050 55%, #4a5560 80%, #5e6a72 100%)',
        rain_night:     'linear-gradient(180deg, #060810 0%, #0c1018 25%, #121620 55%, #181c26 100%)',
        snow_day:       'linear-gradient(180deg, #3a4050 0%, #505868 30%, #6e7888 60%, #909aa4 85%, #b8c0c8 100%)',
        snow_night:     'linear-gradient(180deg, #0c0e14 0%, #141820 30%, #1c2030 60%, #242830 100%)',
        storm:          'linear-gradient(180deg, #080810 0%, #10101e 20%, #1a1826 40%, #222030 65%, #2e2a30 100%)',
    };

    let starsCtx, starsCanvas, stars = [];
    let wCanvas, wCtx, particles = [], wMode = null, wRaf = null, wStart = null;
    let lightningTimer = null;

    function phase(h) {
        if (h >= 5 && h < 7) return 'dawn';
        if (h >= 7 && h < 10) return 'morning';
        if (h >= 10 && h < 16) return 'day';
        if (h >= 16 && h < 19) return 'evening';
        if (h >= 19 && h < 21) return 'dusk';
        return 'night';
    }

    function sunPos(h) {
        if (h < 6 || h > 20) return null;
        const p = (h - 6) / 14;
        return { x: 10 + p * 80, y: 65 - Math.sin(p * Math.PI) * 50 };
    }

    function moonPos(h) {
        let p;
        if (h >= 20) p = (h - 20) / 10;
        else if (h <= 6) p = (4 + h) / 10;
        else return null;
        return { x: 10 + p * 80, y: 65 - Math.sin(p * Math.PI) * 45 };
    }

    function initStars() {
        starsCanvas = document.getElementById('starsCanvas');
        if (!starsCanvas) return;
        starsCtx = starsCanvas.getContext('2d');
        const rect = starsCanvas.getBoundingClientRect();
        starsCanvas.width = rect.width;
        starsCanvas.height = rect.height;
        stars = Array.from({ length: 80 }, () => ({
            x: Math.random() * starsCanvas.width,
            y: Math.random() * starsCanvas.height * 0.7,
            r: 0.5 + Math.random() * 1.5,
            a: 0.3 + Math.random() * 0.7,
            twinkle: 2 + Math.random() * 4,
            offset: Math.random() * Math.PI * 2,
        }));
    }

    function drawStars(show) {
        if (!starsCtx) return;
        starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
        if (!show) return;
        const t = Date.now() / 1000;
        stars.forEach(s => {
            const a = s.a * (0.5 + 0.5 * Math.sin(t / s.twinkle + s.offset));
            starsCtx.beginPath();
            starsCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            starsCtx.fillStyle = `rgba(220,225,255,${a})`;
            starsCtx.fill();
        });
    }

    function update(code, isDay, hour) {
        const ph = phase(hour);
        const isRain = [51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code);
        const isSnow = [71,73,75,77,85,86].includes(code);
        const isStorm = [95,96,99].includes(code);
        const isOvc = [3,45,48].includes(code);
        const sev = (WMO_DATA[code] || {}).severity || 0;

        let grad;
        if (isStorm) grad = GRADS.storm;
        else if (isSnow) grad = isDay ? GRADS.snow_day : GRADS.snow_night;
        else if (isRain) grad = isDay ? GRADS.rain_day : GRADS.rain_night;
        else if (isOvc) grad = isDay ? GRADS.overcast_day : GRADS.overcast_night;
        else grad = GRADS[ph];

        document.getElementById('skyGradient').style.background = grad;

        const showStars = ph === 'night' || ph === 'dusk';
        drawStars(showStars);

        const sp = sunPos(hour);
        const sunEl = document.getElementById('sunWrap');
        if (sp && isDay && sev < 3) {
            gsap.to(sunEl, { left: sp.x + '%', top: sp.y + '%', opacity: 1, duration: 2, ease: 'power2.out' });
            sunEl.style.transform = 'translate(-50%, -50%)';
        } else {
            gsap.to(sunEl, { opacity: 0, duration: 1 });
        }

        const mp = moonPos(hour);
        const moonEl = document.getElementById('moonWrap');
        if (mp && !isDay) {
            gsap.to(moonEl, { left: mp.x + '%', top: mp.y + '%', opacity: 1, duration: 2, ease: 'power2.out' });
            moonEl.style.transform = 'translate(-50%, -50%)';
        } else {
            gsap.to(moonEl, { opacity: 0, duration: 1 });
        }

        const clouds = document.querySelectorAll('.cloud');
        const cloudLevel = isOvc || sev >= 1 ? 0.85 : code === 2 ? 0.4 : code <= 1 ? 0 : 0.7;
        clouds.forEach((c, i) => {
            const op = Math.max(0, cloudLevel - 0.1 * i);
            if (op > 0) {
                gsap.to(c, { opacity: op, duration: 1.5 });
                if (!c._moving) {
                    c._moving = true;
                    const startX = -200 - i * 40;
                    const endX = window.innerWidth + 200;
                    const dur = 40 + i * 15;
                    gsap.fromTo(c, { x: startX }, { x: endX, duration: dur, repeat: -1, ease: 'none' });
                }
                if (sev >= 2) {
                    c.querySelector('.cloud-body').style.background = sev >= 3
                        ? 'linear-gradient(180deg, #5a5a6a 0%, #3a3a4a 100%)'
                        : 'linear-gradient(180deg, #8a9aaa 0%, #6a7a8a 100%)';
                } else {
                    c.querySelector('.cloud-body').style.background = '';
                }
            } else {
                gsap.to(c, { opacity: 0, duration: 1 });
            }
        });

        toggleWeatherFx(isRain || isStorm ? 'rain' : isSnow ? 'snow' : null, sev);
        isStorm ? startLightning() : stopLightning();
    }

    function toggleWeatherFx(mode, sev) {
        if (mode === wMode && wRaf) return;
        stopWeatherFx();
        if (!mode) return;
        wCanvas = document.getElementById('weatherCanvas');
        if (!wCanvas) return;
        wCtx = wCanvas.getContext('2d');
        const rect = wCanvas.getBoundingClientRect();
        wCanvas.width = rect.width;
        wCanvas.height = rect.height;
        wMode = mode;
        const W = wCanvas.width, H = wCanvas.height;

        if (mode === 'rain') {
            const count = sev >= 3 ? 100 : sev >= 2 ? 60 : 35;
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * W, y: Math.random() * H,
                len: sev >= 3 ? 20 + Math.random() * 16 : 12 + Math.random() * 10,
                w: sev >= 3 ? 2 + Math.random() * 1.5 : 1.2 + Math.random() * 1,
                spd: sev >= 3 ? 800 + Math.random() * 400 : 500 + Math.random() * 300,
                op: 0.35 + Math.random() * 0.35, drift: -0.1,
            }));
        } else {
            particles = Array.from({ length: 50 }, () => ({
                x: Math.random() * W, y: Math.random() * H,
                size: 2 + Math.random() * 5, spd: 30 + Math.random() * 50,
                drift: (Math.random() - 0.5) * 25, op: 0.5 + Math.random() * 0.4,
                angle: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 1.2,
            }));
        }
        wStart = null;
        wRaf = requestAnimationFrame(weatherLoop);
    }

    let _lastTs = null;
    function weatherLoop(ts) {
        if (!wStart) wStart = ts;
        const dt = Math.min(0.05, (ts - (_lastTs || ts)) / 1000);
        _lastTs = ts;
        const W = wCanvas.width, H = wCanvas.height;
        wCtx.clearRect(0, 0, W, H);

        if (wMode === 'rain') {
            for (const p of particles) {
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
        } else if (wMode === 'snow') {
            for (const p of particles) {
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
        }
        wCtx.globalAlpha = 1;

        if (ts - wStart < 12000) wRaf = requestAnimationFrame(weatherLoop);
        else wRaf = null;
    }

    function stopWeatherFx() {
        if (wRaf) { cancelAnimationFrame(wRaf); wRaf = null; }
        wMode = null;
        particles = [];
        _lastTs = null;
        if (wCtx && wCanvas) wCtx.clearRect(0, 0, wCanvas.width, wCanvas.height);
    }

    function startLightning() {
        if (lightningTimer) return;
        const el = document.getElementById('lightning');
        lightningTimer = setInterval(() => {
            if (Math.random() < 0.3) {
                gsap.timeline()
                    .to(el, { opacity: 0.8, duration: 0.05 })
                    .to(el, { opacity: 0, duration: 0.12 })
                    .to(el, { opacity: Math.random() * 0.5, duration: 0.04, delay: 0.08 })
                    .to(el, { opacity: 0, duration: 0.1 });
            }
        }, 2500);
    }

    function stopLightning() {
        if (lightningTimer) { clearInterval(lightningTimer); lightningTimer = null; }
        gsap.to(document.getElementById('lightning'), { opacity: 0, duration: 0.3 });
    }

    function init() {
        initStars();
        const h = new Date().getHours();
        update(0, h >= 6 && h < 20 ? 1 : 0, h);
        gsap.from('.nimbus-card', { y: 30, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.3 });
    }

    return { init, update, drawStars };
})();
