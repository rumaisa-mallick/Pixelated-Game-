/* Coin Quest — game loop, state and HUD glue. */
(function () {
    'use strict';
    const CQ = window.CQ;
    const T = CQ.Maps.TILE;
    const W = 640;
    const H = 480;

    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const stage = document.getElementById('stage');
    const uiLayer = document.getElementById('ui-layer');

    const hud = document.getElementById('hud');
    const hudCoins = document.getElementById('hud-coins');
    const hudScore = document.getElementById('hud-score');
    const hudCombo = document.getElementById('hud-combo');
    const hudRealm = document.getElementById('hud-realm');
    const hudTimer = document.getElementById('hud-timer');
    const minimap = document.getElementById('minimap');
    const mctx = minimap.getContext('2d');

    const screens = {
        title: document.getElementById('title-screen'),
        pause: document.getElementById('pause-screen'),
        complete: document.getElementById('complete-screen')
    };

    const btnSound = document.getElementById('btn-sound');
    const btnSound2 = document.getElementById('btn-sound2');
    const totalCoinsEl = document.getElementById('total-coins');

    const REALM_ORDER = ['castle', 'forest', 'sea'];
    const BEST_KEY = 'cq_bests';
    const TOTAL_KEY = 'cq_total';

    const maps = CQ.Maps.createAll();

    let state = 'title';
    let mapKey = 'castle';
    let titleKey = 'castle';
    let map = maps[mapKey];
    let player = null;
    let coins = [];
    let score = 0;
    let collected = 0;
    let elapsed = 0;
    let titleTime = 0;
    let combo = 0;
    let comboTimer = 0;
    let maxCombo = 0;

    const cam = { x: 0, y: 0, tx: 0, ty: 0 };
    let particles = [];
    let floats = [];
    let ambient = [];

    const keys = new Set();
    let bests = {};
    let totalCoins = 0;
    let last = performance.now();

    /* ---------------- storage ---------------- */

    function loadStorage() {
        try {
            const raw = localStorage.getItem(BEST_KEY);
            bests = raw ? JSON.parse(raw) : {};
            if (!bests || typeof bests !== 'object') bests = {};
        } catch (e) {
            bests = {};
        }
        try {
            totalCoins = parseInt(localStorage.getItem(TOTAL_KEY) || '0', 10) || 0;
        } catch (e) {
            totalCoins = 0;
        }
        totalCoinsEl.textContent = String(totalCoins);
    }

    function saveBests() {
        try {
            localStorage.setItem(BEST_KEY, JSON.stringify(bests));
        } catch (e) {
            /* ignore */
        }
    }

    function saveTotal() {
        try {
            localStorage.setItem(TOTAL_KEY, String(totalCoins));
        } catch (e) {
            /* ignore */
        }
        totalCoinsEl.textContent = String(totalCoins);
    }

    /* ---------------- ui helpers ---------------- */

    function fitUI() {
        const scale = stage.clientWidth / 640;
        uiLayer.style.transform = 'scale(' + scale + ')';
    }

    function showScreen(name) {
        Object.keys(screens).forEach(function (key) {
            screens[key].classList.toggle('hidden', key !== name);
        });
    }

    function fmt(t) {
        const secs = Math.floor(t);
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function clamp(v, a, b) {
        return Math.max(a, Math.min(b, v));
    }

    function comboMultiplier() {
        return Math.min(combo, 5);
    }

    function updateHud() {
        hudCoins.textContent = collected + '/' + coins.length;
        hudScore.textContent = String(score);
        hudRealm.textContent = map.name;
        hudTimer.textContent = fmt(elapsed);

        const mult = comboMultiplier();
        if (mult > 1) {
            hudCombo.textContent = 'x' + mult;
            hudCombo.classList.remove('hidden');
        } else {
            hudCombo.classList.add('hidden');
        }
    }

    function updateTabs() {
        document.querySelectorAll('.map-tab').forEach(function (tab) {
            tab.classList.toggle('is-active', tab.dataset.map === mapKey);
        });
    }

    function refreshBestLabels() {
        document.querySelectorAll('[data-best]').forEach(function (el) {
            const b = bests[el.dataset.best];
            el.textContent = b && b.score ? 'BEST ' + b.score + ' PTS' : 'UNEXPLORED';
        });
    }

    function syncSoundUI() {
        const on = CQ.Audio.isEnabled();
        btnSound.textContent = on ? 'SFX' : 'MUTE';
        btnSound.classList.toggle('is-muted', !on);
        btnSound2.textContent = 'SOUND: ' + (on ? 'ON' : 'OFF');
    }

    function toggleSound() {
        CQ.Audio.toggle();
        syncSoundUI();
    }

    /* ---------------- map / realm state ---------------- */

    function cameraLimits() {
        return {
            maxX: Math.max(0, map.w * T - W),
            maxY: Math.max(0, map.h * T - H)
        };
    }

    function snapCamera() {
        const lim = cameraLimits();
        const x = clamp(player.x - W / 2, 0, lim.maxX);
        const y = clamp(player.y - H / 2, 0, lim.maxY);
        cam.x = x;
        cam.y = y;
        cam.tx = x;
        cam.ty = y;
    }

    function loadMap(key) {
        mapKey = key;
        titleKey = key;
        map = maps[key];
        player = new CQ.Player(map);
        coins = map.coins.map(function (c) { return new CQ.Coin(c); });
        score = 0;
        collected = 0;
        elapsed = 0;
        combo = 0;
        comboTimer = 0;
        maxCombo = 0;
        particles = [];
        floats = [];
        ambient = [];
        snapCamera();
        updateTabs();
        updateHud();
    }

    function startMap(key) {
        loadMap(key);
        state = 'playing';
        hud.classList.remove('hidden');
        showScreen(null);
        CQ.Audio.init();
        CQ.Audio.click();
    }

    function initTitle() {
        state = 'title';
        mapKey = titleKey;
        map = maps[mapKey];
        player = null;
        coins = map.coins.map(function (c) { return new CQ.Coin(c); });
        score = 0;
        collected = 0;
        elapsed = 0;
        combo = 0;
        comboTimer = 0;
        maxCombo = 0;
        particles = [];
        floats = [];
        ambient = [];
        titleTime = 0;

        const lim = cameraLimits();
        cam.x = lim.maxX / 2;
        cam.y = lim.maxY / 2;
        cam.tx = cam.x;
        cam.ty = cam.y;

        hud.classList.add('hidden');
        showScreen('title');
        refreshBestLabels();
    }

    function setTitleBackdrop(key) {
        titleKey = key;
        mapKey = key;
        map = maps[key];
        player = null;
        coins = map.coins.map(function (c) { return new CQ.Coin(c); });
        particles = [];
        floats = [];
        ambient = [];
        updateTabs();
    }

    function pauseGame() {
        if (state !== 'playing') return;
        state = 'paused';
        showScreen('pause');
        CQ.Audio.pause(true);
    }

    function resumeGame() {
        if (state !== 'paused') return;
        state = 'playing';
        showScreen(null);
        CQ.Audio.pause(false);
    }

    function toTitle() {
        titleKey = mapKey;
        initTitle();
        CQ.Audio.click();
    }

    function nextRealm() {
        const idx = REALM_ORDER.indexOf(mapKey);
        return REALM_ORDER[(idx + 1) % REALM_ORDER.length];
    }

    /* ---------------- effects ---------------- */

    function addParticle(p) {
        p.max = p.max || p.life;
        particles.push(p);
    }

    function spawnDust(p) {
        const palette = {
            castle: '#7a738c',
            forest: '#7a9a52',
            sea: '#e3cf96'
        };
        addParticle({
            x: p.x + (Math.random() - 0.5) * 6,
            y: p.y + 2 + (Math.random() - 0.5) * 3,
            vx: (Math.random() - 0.5) * 22,
            vy: -8 - Math.random() * 12,
            g: 22,
            life: 0.32 + Math.random() * 0.18,
            size: Math.random() < 0.4 ? 2 : 1,
            color: palette[map.theme],
            layer: 'back',
            drag: 1.5
        });
    }

    function collectCoin(coin) {
        coin.collected = true;
        collected += 1;

        combo = comboTimer > 0 ? combo + 1 : 1;
        comboTimer = 3.2;
        if (combo > maxCombo) maxCombo = combo;

        const mult = comboMultiplier();
        const points = coin.value * mult;
        score += points;

        const isGem = coin.kind === 'gem';
        const hex = isGem ? '#7ef4ee' : '#ffd86b';

        floats.push({
            x: coin.x,
            y: coin.y - 10,
            text: '+' + points + (mult > 1 ? ' x' + mult : ''),
            color: hex,
            life: mult > 1 ? 1 : 0.85,
            max: mult > 1 ? 1 : 0.85
        });

        const n = isGem ? 14 : 8;
        for (let i = 0; i < n; i++) {
            addParticle({
                x: coin.x,
                y: coin.y,
                vx: (Math.random() - 0.5) * 110,
                vy: -25 - Math.random() * 80,
                g: 190,
                life: 0.4 + Math.random() * 0.35,
                size: Math.random() < 0.5 ? 2 : 1,
                color: isGem && Math.random() < 0.5 ? '#b7ffff' : hex,
                layer: 'front',
                drag: 1.1
            });
        }

        CQ.Audio.pickup(coin.kind);
        totalCoins += 1;
        saveTotal();
        updateHud();
    }

    function spawnConfetti() {
        const colors = ['#ffd86b', '#63e3dd', '#e14b5a', '#9cff8a', '#ffffff', '#c596ff'];
        for (let i = 0; i < 70; i++) {
            addParticle({
                x: player ? player.x : cam.x + W / 2,
                y: player ? player.y - 20 : cam.y + H / 2,
                vx: (Math.random() - 0.5) * 280,
                vy: -80 - Math.random() * 200,
                g: 360,
                life: 1.2 + Math.random() * 1.1,
                size: Math.random() < 0.5 ? 3 : 2,
                color: colors[(Math.random() * colors.length) | 0],
                layer: 'front',
                drag: 0.35
            });
        }
    }

    function completeRealm() {
        state = 'complete';

        const prev = bests[mapKey] || { score: 0, time: 0 };
        const oldScore = prev.score || 0;
        const oldTime = prev.time || 0;

        const bestScore = Math.max(oldScore, score);
        const bestTime = oldTime > 0 ? Math.min(oldTime, elapsed) : elapsed;
        const newBest = score > oldScore;
        const fastest = !oldTime || elapsed < oldTime;

        bests[mapKey] = { score: bestScore, time: bestTime };
        saveBests();
        refreshBestLabels();

        document.getElementById('res-score').textContent = String(score);
        document.getElementById('res-time').textContent = fmt(elapsed);
        document.getElementById('res-coins').textContent = collected + '/' + coins.length;
        document.getElementById('res-best').textContent = bestScore + ' PTS';
        document.getElementById('res-combo').textContent = 'x' + Math.max(1, maxCombo);
        document.getElementById('complete-realm').textContent = map.name;

        const nb = document.getElementById('new-best');
        if (newBest) nb.textContent = 'NEW BEST!';
        else if (fastest) nb.textContent = 'FASTEST CLEAR!';
        else nb.textContent = '';
        nb.classList.toggle('hidden', !nb.textContent);

        CQ.Audio.complete();
        spawnConfetti();
        showScreen('complete');
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            p.vy += p.g * dt;
            const drag = p.drag ? Math.max(0, 1 - p.drag * dt) : 1;
            p.vx *= drag;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }

        for (let i = floats.length - 1; i >= 0; i--) {
            const f = floats[i];
            f.life -= dt;
            f.y -= 18 * dt;
            if (f.life <= 0) floats.splice(i, 1);
        }
    }

    function updateAmbient(dt, active) {
        if (!active) return;

        const max = map.theme === 'forest' ? 26 : map.theme === 'sea' ? 20 : 16;

        if (ambient.length < max && Math.random() < dt * 14) {
            const x = cam.x + Math.random() * W;
            const y = cam.y + Math.random() * H;
            let p;

            if (map.theme === 'forest') {
                p = {
                    x: x, y: y,
                    vx: (Math.random() - 0.5) * 9,
                    vy: (Math.random() - 0.5) * 9,
                    life: 2 + Math.random() * 2,
                    color: '#d9f27a',
                    type: 'firefly',
                    phase: Math.random() * 6.28
                };
            } else if (map.theme === 'sea') {
                p = {
                    x: x, y: y,
                    vx: 0,
                    vy: -3 - Math.random() * 4,
                    life: 1.2 + Math.random() * 1.6,
                    size: Math.random() < 0.5 ? 2 : 1,
                    color: '#9ce8ff',
                    type: 'bubble'
                };
            } else {
                p = {
                    x: x, y: y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: -5 - Math.random() * 7,
                    life: 2 + Math.random() * 2,
                    size: Math.random() < 0.3 ? 2 : 1,
                    color: '#9a8a6a',
                    type: 'dust'
                };
            }
            p.max = p.life;
            ambient.push(p);
        }

        for (let i = ambient.length - 1; i >= 0; i--) {
            const p = ambient[i];
            p.life -= dt;
            if (p.life <= 0) {
                ambient.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.type === 'firefly') {
                p.x += Math.sin(p.life * 3 + p.phase) * dt * 9;
                p.y += Math.cos(p.life * 2 + p.phase) * dt * 7;
            }
            if (p.x < cam.x - 30 || p.x > cam.x + W + 30 || p.y < cam.y - 30 || p.y > cam.y + H + 30) {
                ambient.splice(i, 1);
            }
        }
    }

    /* ---------------- updates ---------------- */

    function readInput() {
        return {
            up: keys.has('ArrowUp') || keys.has('KeyW'),
            down: keys.has('ArrowDown') || keys.has('KeyS'),
            left: keys.has('ArrowLeft') || keys.has('KeyA'),
            right: keys.has('ArrowRight') || keys.has('KeyD'),
            sprint: keys.has('ShiftLeft') || keys.has('ShiftRight')
        };
    }

    function updatePlaying(dt) {
        elapsed += dt;

        if (comboTimer > 0) {
            comboTimer -= dt;
            if (comboTimer <= 0) {
                comboTimer = 0;
                combo = 0;
            }
        }

        player.update(dt, readInput(), map, spawnDust);

        for (const coin of coins) {
            if (coin.collected) continue;
            const dist = coin.update(dt, player);
            if (dist < 12) collectCoin(coin);
        }

        updateParticles(dt);
        updateAmbient(dt, true);
        updateHud();

        if (coins.length && collected === coins.length) {
            completeRealm();
        }
    }

    function updateTitle(dt) {
        titleTime += dt;
        updateAmbient(dt, true);
    }

    function updateCamera(dt) {
        const lim = cameraLimits();

        if (state === 'title') {
            const t = titleTime * 0.055;
            cam.tx = lim.maxX * (0.5 + 0.42 * Math.sin(t * 1.7));
            cam.ty = lim.maxY * (0.5 + 0.42 * Math.cos(t * 1.1));
        } else if (state === 'playing' && player) {
            cam.tx = clamp(player.x - W / 2, 0, lim.maxX);
            cam.ty = clamp(player.y - H / 2, 0, lim.maxY);
        }

        const k = Math.min(1, dt * (state === 'title' ? 1.8 : 8));
        cam.x += (cam.tx - cam.x) * k;
        cam.y += (cam.ty - cam.y) * k;
    }

    /* ---------------- rendering ---------------- */

    function drawParticleLayer(layer) {
        for (const p of particles) {
            if (p.layer !== layer) continue;
            const alpha = Math.max(0, Math.min(1, p.life / p.max));
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    function drawFloats() {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '7px "Press Start 2P", monospace';

        for (const f of floats) {
            const alpha = Math.max(0, Math.min(1, f.life / f.max));
            const x = Math.round(f.x - cam.x);
            const y = Math.round(f.y - cam.y);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#000000';
            ctx.fillText(f.text, x + 1, y + 1);
            ctx.fillStyle = f.color;
            ctx.fillText(f.text, x, y);
        }
        ctx.globalAlpha = 1;
    }

    function drawAmbient(time) {
        for (const p of ambient) {
            const x = Math.round(p.x - cam.x);
            const y = Math.round(p.y - cam.y);
            const lifeRatio = Math.max(0, Math.min(1, p.life / p.max));
            const fade = Math.min(1, lifeRatio * 2);

            if (p.type === 'firefly') {
                const blink = 0.35 + 0.65 * Math.abs(Math.sin(time * 2 + p.phase));
                ctx.globalAlpha = fade * blink;
                ctx.fillStyle = p.color;
                ctx.fillRect(x, y, 1, 1);
                ctx.globalAlpha = fade * blink * 0.18;
                ctx.fillRect(x - 2, y - 2, 5, 5);
            } else if (p.type === 'bubble') {
                ctx.globalAlpha = fade * 0.55;
                ctx.fillStyle = p.color;
                ctx.fillRect(x, y, p.size, p.size);
            } else {
                ctx.globalAlpha = fade * 0.35;
                ctx.fillStyle = p.color;
                ctx.fillRect(x, y, p.size, p.size);
            }
        }
        ctx.globalAlpha = 1;
    }

    function drawMinimap(time) {
        mctx.imageSmoothingEnabled = false;
        mctx.clearRect(0, 0, minimap.width, minimap.height);
        mctx.drawImage(map.minimapBase, 0, 0);

        for (const coin of coins) {
            if (coin.collected) continue;
            const mx = Math.round(coin.x / T) * 2;
            const my = Math.round(coin.y / T) * 2;
            mctx.fillStyle = coin.kind === 'gem' ? '#68f5ee' : '#ffd35e';
            mctx.fillRect(mx - 1, my - 1, 2, 2);
        }

        if (player && state !== 'title') {
            const px = Math.round(player.x / T) * 2;
            const py = Math.round(player.y / T) * 2;
            const blink = Math.floor(time * 3) % 2 === 0;
            mctx.fillStyle = blink ? '#ffffff' : '#ffd35e';
            mctx.fillRect(px - 1, py - 1, 3, 3);
        }

        mctx.strokeStyle = 'rgba(255, 235, 190, 0.35)';
        mctx.lineWidth = 1;
        mctx.strokeRect(
            Math.round((cam.x / T) * 2) + 0.5,
            Math.round((cam.y / T) * 2) + 0.5,
            Math.round((W / T) * 2) - 1,
            Math.round((H / T) * 2) - 1
        );
    }

    function render(time) {
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#050409';
        ctx.fillRect(0, 0, W, H);

        const cx = Math.round(cam.x);
        const cy = Math.round(cam.y);

        if (map.staticCanvas) {
            ctx.drawImage(map.staticCanvas, cx, cy, W, H, 0, 0, W, H);
        }

        CQ.Render.drawAnimatedTiles(ctx, map, cx, cy, W, H, time);
        drawParticleLayer('back');

        for (const coin of coins) {
            if (coin.collected) continue;
            if (
                coin.x < cx - 20 || coin.x > cx + W + 20 ||
                coin.y < cy - 24 || coin.y > cy + H + 24
            ) continue;
            coin.draw(ctx, cx, cy, time);
        }

        if (state !== 'title' && player) {
            player.draw(ctx, cx, cy);
        }

        drawParticleLayer('front');
        drawFloats();
        drawAmbient(time);

        if (state !== 'title') {
            drawMinimap(time);
        }
    }

    /* ---------------- main loop ---------------- */

    function loop(now) {
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;

        if (state === 'playing') updatePlaying(dt);
        else if (state === 'title') updateTitle(dt);
        else if (state === 'complete') {
            updateParticles(dt);
            updateAmbient(dt, true);
        }

        updateCamera(dt);
        render(now / 1000);
        requestAnimationFrame(loop);
    }

    /* ---------------- previews ---------------- */

    function drawPreviews() {
        document.querySelectorAll('.realm-card').forEach(function (card) {
            const key = card.dataset.map;
            const src = maps[key].staticCanvas;
            const cv = card.querySelector('.realm-preview');
            const c = cv.getContext('2d');
            c.imageSmoothingEnabled = false;

            const scale = Math.max(cv.width / src.width, cv.height / src.height);
            const sw = cv.width / scale;
            const sh = cv.height / scale;
            const sx = (src.width - sw) / 2;
            const sy = (src.height - sh) / 2;

            c.drawImage(src, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
        });
    }

    /* ---------------- events ---------------- */

    function bindEvents() {
        window.addEventListener('resize', fitUI);
        if (window.ResizeObserver) {
            new ResizeObserver(fitUI).observe(stage);
        }

        window.addEventListener('keydown', function (e) {
            const code = e.code;

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(code) !== -1) {
                e.preventDefault();
            }

            keys.add(code);
            CQ.Audio.init();

            if (e.repeat) return;

            if (code === 'Escape') {
                if (state === 'playing') pauseGame();
                else if (state === 'paused') resumeGame();
                return;
            }

            if (code === 'KeyM') {
                toggleSound();
                return;
            }

            if (code === 'KeyP') {
                if (state === 'playing') pauseGame();
                else if (state === 'paused') resumeGame();
                return;
            }

            if (code === 'Enter') {
                if (state === 'title') startMap(titleKey);
                else if (state === 'paused') resumeGame();
                else if (state === 'complete') startMap(nextRealm());
            }
        });

        window.addEventListener('keyup', function (e) {
            keys.delete(e.code);
        });

        window.addEventListener('blur', function () {
            keys.clear();
            if (state === 'playing') pauseGame();
        });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden && state === 'playing') pauseGame();
        });

        window.addEventListener('pointerdown', function () {
            CQ.Audio.init();
        }, { once: true });

        document.querySelectorAll('.map-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                const key = tab.dataset.map;
                if (state === 'playing' && key === mapKey) return;
                startMap(key);
            });
        });

        document.querySelectorAll('.realm-card').forEach(function (card) {
            const key = card.dataset.map;
            card.addEventListener('mouseenter', function () {
                if (state === 'title') setTitleBackdrop(key);
            });
            card.addEventListener('focus', function () {
                if (state === 'title') setTitleBackdrop(key);
            });
            card.addEventListener('click', function () {
                startMap(key);
            });
        });

        document.getElementById('btn-pause').addEventListener('click', pauseGame);
        document.getElementById('btn-sound').addEventListener('click', toggleSound);
        document.getElementById('btn-resume').addEventListener('click', resumeGame);
        document.getElementById('btn-restart').addEventListener('click', function () { startMap(mapKey); });
        document.getElementById('btn-quit').addEventListener('click', toTitle);
        document.getElementById('btn-sound2').addEventListener('click', toggleSound);
        document.getElementById('btn-next').addEventListener('click', function () { startMap(nextRealm()); });
        document.getElementById('btn-retry').addEventListener('click', function () { startMap(mapKey); });
        document.getElementById('btn-all').addEventListener('click', toTitle);

        document.querySelectorAll('.touch-pad button').forEach(function (btn) {
            const code = btn.dataset.key;
            function down(e) {
                e.preventDefault();
                keys.add(code);
                CQ.Audio.init();
            }
            function up(e) {
                e.preventDefault();
                keys.delete(code);
            }
            btn.addEventListener('pointerdown', down);
            btn.addEventListener('pointerup', up);
            btn.addEventListener('pointerleave', up);
            btn.addEventListener('pointercancel', up);
        });
    }

    /* ---------------- debug hooks (harmless, handy for tinkering) ---------------- */

    window.CQGame = {
        snapshot: function () {
            return {
                state: state,
                mapKey: mapKey,
                score: score,
                collected: collected,
                total: coins.length,
                time: elapsed,
                combo: combo,
                maxCombo: maxCombo,
                player: player ? { x: player.x, y: player.y } : null
            };
        },
        warp: function (x, y) {
            if (!player) return;
            player.x = x;
            player.y = y;
            snapCamera();
        }
    };

    /* ---------------- boot ---------------- */

    loadStorage();
    drawPreviews();
    refreshBestLabels();
    initTitle();
    syncSoundUI();
    bindEvents();
    fitUI();
    updateTabs();

    requestAnimationFrame(function (now) {
        last = now;
        requestAnimationFrame(loop);
    });
})();
