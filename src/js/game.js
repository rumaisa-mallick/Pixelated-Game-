/* Gilded Isles — game loop, physics, input, saves and screen flow. */
(function () {
  'use strict';
  const G = window.Gilded;
  const T = G.TILE;
  const VW = G.VIEW_W;
  const VH = G.VIEW_H;

  const $ = function (id) { return document.getElementById(id); };
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const stage = $('stage');
  const titleScreen = $('screen-title');
  const pauseScreen = $('screen-pause');
  const completeScreen = $('screen-complete');
  const failScreen = $('screen-fail');
  const hud = $('hud');
  const touch = $('touch');
  const toast = $('toast');
  const flashEl = $('flash');
  const rotate = $('rotate');
  const isleIntro = $('isle-intro');
  const introKicker = $('intro-kicker');
  const introName = $('intro-name');
  const cardsRoot = $('realm-cards');

  const hudScore = $('hud-score');
  const hudCoins = $('hud-coins');
  const hudTotal = $('hud-total');
  const hudCombo = $('hud-combo');
  const hudIsle = $('hud-isle');
  const hudTime = $('hud-time');
  const hudHearts = $('hud-hearts');
  const hudProgress = $('hud-progress');
  const hudDot = $('hud-dot');
  const hudCurse = $('hud-curse');
  const cursePips = hudCurse ? Array.prototype.slice.call(hudCurse.querySelectorAll('.curse-pip')) : [];

  let levels = G.World.createAll();
  let levelById = {};
  levels.forEach(function (l) { levelById[l.id] = l; });

  let save = G.Store.load();
  let mode = 'boot';
  let selectedIndex = 0;
  let titleTheme = G.REALMS[0].theme;
  let active = null;
  let activeRealm = null;
  let activeIndex = 0;
  let cardEls = [];

  const player = {
    x: 0, y: 0, vx: 0, vy: 0, dir: 1,
    grounded: false, coyote: 0, invuln: 0, jumpHeld: false
  };
  const camera = { x: 0, y: 0 };
  let particleList = [];
  let time = 0;
  let levelTime = 0;
  let score = 0;
  let coinsGot = 0;
  let gemsGot = 0;
  let totalCoinsThisLevel = 0;
  let cursedGot = 0;
  let totalCursedThisLevel = 0;
  let curse = 0;
  let warden = null;
  let damageTaken = 0;
  let combo = 0;
  let comboTimer = 0;
  let maxCombo = 0;
  let hearts = 3;
  let checkpoint = { x: 0, y: 0 };
  let shake = 0;
  let deathTimer = 0;
  let jumpBuffer = 0;
  let toastTimer = null;
  let introTimer = null;
  let saveTimer = null;
  let levelFinished = false;
  let testMode = /[?&]test=1/.test(location.search);
  let lastFrame = 0;
  let accumulator = 0;

  const keys = Object.create(null);
  const touchInput = { left: false, right: false, jump: false, dash: false };
  const input = { left: false, right: false, jumpHeld: false, sprint: false };
  let padJumpPrev = false;

  const STEP = 1 / 60;
  const GRAVITY = 1430;
  const MOVE_SPEED = 112;
  const SPRINT_SPEED = 166;
  const JUMP_SPEED = 370;
  const MAX_FALL = 590;

  function padScore(n, width) { return G.pad(n, width); }
  function multiplier() {
    if (combo >= 15) return 5;
    if (combo >= 10) return 4;
    if (combo >= 6) return 3;
    if (combo >= 3) return 2;
    return 1;
  }

  function realmFor(id) {
    return G.REALMS.find(function (r) { return r.id === id; }) || null;
  }

  function applyRealmTheme(id) {
    const realm = realmFor(id) || G.REALMS[0];
    if (!stage || !realm) return;
    stage.dataset.realm = realm.id;
    stage.style.setProperty('--realm-accent', realm.accent);
  }

  function showScreen(el) {
    [titleScreen, pauseScreen, completeScreen, failScreen].forEach(function (s) {
      if (s) s.classList.toggle('hidden', s !== el);
    });
  }

  function hideAllScreens() {
    [titleScreen, pauseScreen, completeScreen, failScreen].forEach(function (s) {
      if (s) s.classList.add('hidden');
    });
  }

  function setHudVisible(on) {
    if (hud) hud.classList.toggle('hidden', !on);
  }

  function setTouchVisible(on) {
    if (!touch) return;
    touch.classList.toggle('hidden', !(on && isTouchDevice()));
  }

  function isTouchDevice() { return G.isTouch(); }

  function updateTouchClass() {
    if (!rotate) return;
    const portrait = window.innerHeight > window.innerWidth * 1.14;
    rotate.classList.toggle('show', !!(portrait && isTouchDevice()));
  }

  function fitStage() {
    const pad = Math.min(22, window.innerWidth * 0.018);
    const s = Math.max(0.12, Math.min((window.innerWidth - pad * 2) / VW, (window.innerHeight - pad * 2) / VH));
    stage.style.transform = 'scale(' + s.toFixed(4) + ')';
    updateTouchClass();
  }

  function queueJump() {
    if (mode === 'playing') jumpBuffer = 0.14;
  }

  function flashScreen() {
    if (!flashEl) return;
    flashEl.classList.remove('on');
    void flashEl.offsetWidth;
    flashEl.classList.add('on');
    window.setTimeout(function () { flashEl.classList.remove('on'); }, 85);
  }

  function showToast(text, ms) {
    if (!toast) return;
    if (toastTimer) window.clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.remove('hidden');
    void toast.offsetWidth;
    toast.classList.add('show');
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('show');
      window.setTimeout(function () {
        if (!toast.classList.contains('show')) toast.classList.add('hidden');
      }, 190);
    }, ms || 1450);
  }

  function hideToast() {
    if (!toast) return;
    if (toastTimer) window.clearTimeout(toastTimer);
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }

  function hideIsleIntro() {
    if (!isleIntro) return;
    if (introTimer) window.clearTimeout(introTimer);
    isleIntro.classList.remove('show');
    isleIntro.classList.add('hidden');
    introTimer = null;
  }

  function showIsleIntro(realm, index) {
    if (!isleIntro || !realm) return;
    if (introTimer) window.clearTimeout(introTimer);
    if (introKicker) introKicker.textContent = 'ISLE ' + (['I', 'II', 'III'][index] || String(index + 1));
    if (introName) introName.textContent = realm.name;
    isleIntro.classList.remove('hidden');
    void isleIntro.offsetWidth;
    isleIntro.classList.add('show');
    introTimer = window.setTimeout(function () {
      isleIntro.classList.remove('show');
      introTimer = window.setTimeout(function () {
        if (!isleIntro.classList.contains('show')) isleIntro.classList.add('hidden');
        introTimer = null;
      }, 280);
    }, 2050);
  }

  function updateSoundUI() {
    const muted = !!save.muted;
    ['title-sound', 'btn-sound'].forEach(function (id) {
      const b = $(id);
      if (b) b.classList.toggle('is-muted', muted);
    });
    const ps = $('pause-sound');
    if (ps) ps.textContent = 'SOUND: ' + (muted ? 'OFF' : 'ON');
  }

  function toggleSound() {
    G.Audio.init();
    save.muted = !G.Audio.isEnabled();
    G.Audio.setEnabled(!save.muted);
    if (!save.muted) G.Audio.click();
    queueSave();
    updateSoundUI();
  }

  function queueSave() {
    if (saveTimer) return;
    saveTimer = window.setTimeout(function () {
      saveTimer = null;
      G.Store.save(save);
    }, 220);
  }

  function persistNow() {
    if (saveTimer) {
      window.clearTimeout(saveTimer);
      saveTimer = null;
    }
    G.Store.save(save);
  }

  function updateTitleStats() {
    const tc = $('title-coins');
    if (tc) tc.textContent = String(save.totalCoins || 0);
    let cleared = 0;
    G.REALMS.forEach(function (r) { if (save.cleared && save.cleared[r.id]) cleared++; });
    const tp = $('title-progress');
    if (tp) tp.textContent = cleared + ' / ' + G.REALMS.length + ' ISLES CLEARED';
    updateSoundUI();
  }

  function buildCards() {
    if (!cardsRoot) return;
    cardsRoot.innerHTML = G.REALMS.map(function (r, i) {
      const safeDesc = G.escapeHtml(r.desc).replace(/\n/g, '<br>');
      return '<button class="realm-card" type="button" role="listitem" data-realm="' + r.id + '" data-index="' + i + '" aria-label="Explore ' + G.escapeHtml(r.name) + '">' +
        '<span class="thumb-wrap"><canvas width="328" height="176" aria-hidden="true"></canvas><span class="thumb-num">ISLE ' + padScore(i + 1, 2) + '</span><span class="thumb-gem" aria-hidden="true"></span></span>' +
        '<span class="realm-info"><b class="realm-name">' + G.escapeHtml(r.name) + '</b><span class="realm-desc">' + safeDesc + '</span>' +
        '<span class="realm-meta"><span class="best"></span><span class="medals"></span></span></span>' +
        '<span class="card-sheen" aria-hidden="true"></span>' +
        '</button>';
    }).join('');
    cardEls = Array.prototype.slice.call(cardsRoot.querySelectorAll('.realm-card'));
    cardEls.forEach(function (card, i) {
      card.addEventListener('click', function () { startLevel(G.REALMS[i].id); });
      card.addEventListener('mouseenter', function () { selectCard(i, false); });
      card.addEventListener('focus', function () { selectCard(i, false); });
      card.addEventListener('pointermove', function (e) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.style.removeProperty('--mx');
        card.style.removeProperty('--my');
      });
    });
    updateCards();
    window.requestAnimationFrame(function () {
      cardEls.forEach(function (card, i) {
        const c = card.querySelector('canvas');
        if (c) G.Renderer.drawPreview(c, levelById[G.REALMS[i].id]);
      });
    });
  }

  function updateCards() {
    cardEls.forEach(function (card, i) {
      const r = G.REALMS[i];
      const best = save.bests && save.bests[r.id];
      const cleared = !!(save.cleared && save.cleared[r.id]);
      card.classList.toggle('is-complete', cleared);
      card.classList.toggle('is-selected', i === selectedIndex);
      const b = card.querySelector('.best');
      if (b) {
        b.textContent = best ? 'BEST ' + padScore(best.score, 5) : 'UNEXPLORED';
        b.classList.toggle('unexplored', !best);
      }
      const medals = (save.medals && save.medals[r.id]) || {};
      const medalKeys = [
        { key: 'all', label: 'All coins' },
        { key: 'untouched', label: 'No damage' },
        { key: 'cursed', label: 'All cursed gold' }
      ];
      const medalCount = medalKeys.filter(function (medal) { return !!medals[medal.key]; }).length;
      const medalEl = card.querySelector('.medals');
      if (medalEl) {
        medalEl.innerHTML =
          '<span class="medal-pips" aria-hidden="true">' +
            medalKeys.map(function (medal) {
              return '<i class="medal-pip' + (medals[medal.key] ? ' on' : '') + '" title="' + medal.label + '"></i>';
            }).join('') +
          '</span><span class="medal-tally">' + medalCount + '/3</span>';
        medalEl.classList.toggle('has-medals', medalCount > 0);
        medalEl.setAttribute('aria-label', 'Medals earned: ' + medalCount + ' of 3');
      }
    });
    titleTheme = G.REALMS[selectedIndex] ? G.REALMS[selectedIndex].theme : 'castle';
    updateTitleStats();
  }

  function selectCard(i, focus) {
    if (!G.REALMS[i]) return;
    selectedIndex = i;
    titleTheme = G.REALMS[i].theme;
    applyRealmTheme(G.REALMS[i].id);
    cardEls.forEach(function (card, j) { card.classList.toggle('is-selected', j === i); });
    if (focus && cardEls[i]) cardEls[i].focus();
  }

  function showTitle() {
    mode = 'title';
    active = null;
    activeRealm = null;
    levelFinished = false;
    hideToast();
    hideIsleIntro();
    setHudVisible(false);
    setTouchVisible(false);
    hideAllScreens();
    if (titleScreen) titleScreen.classList.remove('hidden');
    applyRealmTheme(G.REALMS[selectedIndex] ? G.REALMS[selectedIndex].id : G.REALMS[0].id);
    G.Audio.stopMusic();
    updateCards();
    updateSoundUI();
    updateTouchClass();
  }

  function startLevel(id) {
    const realm = realmFor(id);
    if (!realm) return;
    G.Audio.init();
    if (save.muted) G.Audio.setEnabled(false);
    applyRealmTheme(realm.id);
    hideAllScreens();
    hideToast();
    active = G.World.build(id);
    activeRealm = realm;
    activeIndex = G.REALMS.indexOf(realm);
    score = 0;
    coinsGot = 0;
    gemsGot = 0;
    totalCoinsThisLevel = active.totalCoins;
    cursedGot = 0;
    totalCursedThisLevel = active.totalCursed || 0;
    curse = 0;
    warden = null;
    damageTaken = 0;
    combo = 0;
    comboTimer = 0;
    maxCombo = 0;
    hearts = 3;
    levelTime = 0;
    jumpBuffer = 0;
    deathTimer = 0;
    shake = 0;
    levelFinished = false;
    particleList = [];
    checkpoint = { x: active.spawn.x, y: active.spawn.y };
    player.x = active.spawn.x;
    player.y = active.spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.dir = 1;
    player.grounded = false;
    player.coyote = 0;
    player.invuln = 0;
    input.left = false;
    input.right = false;
    input.sprint = false;
    mode = 'playing';
    setHudVisible(true);
    setTouchVisible(true);
    renderHearts();
    updateHUD();
    updateCamera(true);
    G.Audio.startMusic(active.theme);
    showIsleIntro(realm, activeIndex);
    showToast('FIND THE GATE  ·  BEWARE CURSED GOLD', 2100);
    updateTouchClass();
    if (cardEls[activeIndex]) cardEls[activeIndex].classList.add('is-selected');
  }

  function renderHearts() {
    if (!hudHearts) return;
    let out = '';
    for (let i = 0; i < 3; i++) out += '<span class="heart' + (i < hearts ? '' : ' empty') + '">♥</span>';
    hudHearts.innerHTML = out;
  }

  function updateHUD() {
    if (!active) return;
    if (hudScore) hudScore.textContent = padScore(score, 6);
    if (hudCoins) hudCoins.textContent = String(coinsGot);
    if (hudTotal) hudTotal.textContent = String(totalCoinsThisLevel);
    if (hudIsle) hudIsle.textContent = active.name;
    if (hudTime) hudTime.textContent = G.fmtTime(levelTime);
    if (hudCombo) {
      const show = combo >= 3;
      hudCombo.classList.toggle('hidden', !show);
      if (show) hudCombo.textContent = 'x' + multiplier();
    }
    if (hudCurse) {
      hudCurse.classList.toggle('is-full', curse >= 3);
      cursePips.forEach(function (pip, i) { pip.classList.toggle('is-on', i < curse); });
    }
    if (active.shrines) {
      for (let i = 0; i < active.shrines.length; i++) active.shrines[i].ready = curse >= 3;
    }
    const denom = Math.max(1, active.gate ? active.gate.x - active.spawn.x : 1);
    const pct = G.clamp((player.x - active.spawn.x) / denom, 0, 1);
    if (hudProgress) hudProgress.style.width = (pct * 100).toFixed(1) + '%';
    if (hudDot) hudDot.style.left = (pct * 100).toFixed(1) + '%';
  }

  function updateCamera(snap) {
    if (!active) return;
    const look = player.dir > 0 ? 52 : -12;
    const targetX = player.x - 300 + look;
    const targetY = player.y - 252;
    const maxX = Math.max(0, active.w * T - VW);
    const maxY = Math.max(0, active.h * T - VH);
    const tx = G.clamp(targetX, 0, maxX);
    const ty = G.clamp(targetY, 0, maxY);
    if (snap) {
      camera.x = tx;
      camera.y = ty;
    } else {
      const k = 1 - Math.exp(-8 * STEP);
      camera.x += (tx - camera.x) * k;
      camera.y += (ty - camera.y) * k;
    }
  }

  function respawnPlayer() {
    player.x = checkpoint.x;
    player.y = checkpoint.y;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.coyote = 0;
    player.invuln = 1.55;
    curse = 0;
    warden = null;
    combo = 0;
    comboTimer = 0;
    updateCamera(true);
    renderHearts();
    updateHUD();
  }

  function spawnParticles(x, y, color, count, spread, lift, kind) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = spread * (0.35 + Math.random() * 0.8);
      particleList.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - (lift || 0),
        life: 0.35 + Math.random() * 0.45,
        maxLife: 0.8,
        size: kind === 'chunk' ? 2 : 1,
        color: color,
        gravity: kind === 'chunk' ? 360 : (kind === 'dust' ? -30 : 80)
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particleList.length - 1; i >= 0; i--) {
      const q = particleList[i];
      q.life -= dt;
      if (q.life <= 0) {
        particleList.splice(i, 1);
        continue;
      }
      q.vy += q.gravity * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
  }

  function spawnWarden() {
    if (!active || warden) return;
    const side = player.dir >= 0 ? -1 : 1;
    let spawnX = player.x + side * 150;
    const minX = 16;
    const maxX = active.w * T - 16;
    // Never spawn on top of the hero when the chosen side is off the map.
    if (spawnX < minX || spawnX > maxX) spawnX = player.x - side * 150;
    warden = {
      x: G.clamp(spawnX, minX, maxX),
      y: player.y - 2,
      phase: Math.random() * 6.28
    };
    shake = Math.max(shake, 0.2);
    G.Audio.warden();
    showToast('THE HOARD WARDEN AWAKENS  ·  FIND A SHRINE', 2300);
    updateHUD();
  }

  function updateWarden(dt) {
    if (!warden) return;
    const speed = 70 + curse * 16;
    warden.x = G.approach(warden.x, player.x, speed * dt);
    warden.face = player.x >= warden.x ? 1 : -1;
    const targetY = player.y - 12 + Math.sin(time * 2.4 + warden.phase) * 6;
    warden.y = G.approach(warden.y, targetY, 38 * dt);
    warden.x = G.clamp(warden.x, 14, active.w * T - 14);
    warden.y = G.clamp(warden.y, 38, active.h * T - 8);
    if (Math.random() < dt * 8) {
      spawnParticles(warden.x + (Math.random() - 0.5) * 14, warden.y - 10 + Math.random() * 10, '#f0bd54', 1, 18, 8, 'spark');
    }
  }

  function useShrine(s) {
    if (!s || s.used) return;
    const hadCurse = curse > 0;
    s.used = true;
    curse = 0;
    warden = null;
    if (hearts < 3) hearts++;
    score += hadCurse ? 100 : 50;
    G.Audio.shrine();
    shake = Math.max(shake, 0.12);
    const p = G.Renderer.PALETTES[active.theme] || G.Renderer.PALETTES.castle;
    spawnParticles(s.x, s.y - 18, p.goldLight, hadCurse ? 16 : 9, 58, 45, 'spark');
    renderHearts();
    updateHUD();
    showToast(hadCurse ? 'SHRINE CLEANSED  ·  CURSE BROKEN' : 'SHRINE RESTORES A HEART', 1700);
  }

  function handleWardenCollision(prevBottom) {
    if (!warden) return;
    const bx = warden.x;
    const by = warden.y;
    const stomp = player.vy > 70 && prevBottom <= by - 16;
    if (stomp) {
      warden = null;
      curse = 0;
      player.vy = -285;
      player.grounded = false;
      score += 200;
      G.Audio.wardenBanish();
      shake = Math.max(shake, 0.28);
      spawnParticles(bx, by - 12, '#f0bd54', 16, 70, 40, 'chunk');
      spawnParticles(bx, by - 12, '#8f2e5a', 8, 50, 30, 'spark');
      showToast('HOARD WARDEN BANISHED  ·  +200', 1900);
      updateHUD();
      return;
    }
    warden = null;
    curse = 0;
    spawnParticles(bx, by - 12, '#8f2e5a', 12, 64, 30, 'spark');
    showToast('THE WARDEN COLLECTS ITS TOLL  ·  CURSE LIFTED', 1800);
    hurtPlayer('warden');
  }

  function collectCoin(c) {
    if (!c || c.collected || !active) return;
    c.collected = true;
    coinsGot++;
    if (c.kind === 'gem') gemsGot++;
    if (c.kind === 'cursed') {
      cursedGot++;
      curse = Math.min(3, curse + 1);
    }
    const mult = multiplier();
    score += c.value * mult;
    combo = comboTimer > 0 ? combo + 1 : 1;
    if (combo > maxCombo) maxCombo = combo;
    comboTimer = 2.65;
    save.totalCoins = (save.totalCoins || 0) + 1;
    queueSave();
    if (c.kind === 'cursed') G.Audio.cursed();
    else G.Audio.pickup(c.kind === 'gem');
    const palette = G.Renderer.PALETTES[active.theme] || G.Renderer.PALETTES.castle;
    const sparkColor = c.kind === 'gem' ? palette.foam : c.kind === 'cursed' ? '#b84a78' : palette.goldLight;
    spawnParticles(c.x, c.y, sparkColor, c.kind === 'gem' || c.kind === 'cursed' ? 10 : 5, 55, 35, 'spark');
    if (c.kind === 'cursed') {
      spawnParticles(c.x, c.y, palette.goldLight, 4, 34, 24, 'spark');
      if (cursedGot === 1) showToast('CURSED GOLD  ·  3 NOTCHES WAKE THE WARDEN', 1900);
      if (curse >= 3 && !warden) spawnWarden();
    }
    if (coinsGot === totalCoinsThisLevel) {
      showToast('EVERY GLINT CLAIMED  ·  +500', 2100);
    }
    updateHUD();
  }

  function hurtPlayer(kind) {
    if (mode !== 'playing' || player.invuln > 0) return;
    damageTaken++;
    hearts--;
    renderHearts();
    shake = 0.32;
    flashScreen();
    const p = G.Renderer.PALETTES[active.theme] || G.Renderer.PALETTES.castle;
    if (kind === 'water') {
      G.Audio.splash();
      spawnParticles(player.x, player.y - 10, p.foam, 12, 90, 55, 'spark');
    } else {
      G.Audio.hurt();
      spawnParticles(player.x, player.y - 10, p.rose, 9, 70, 35, 'spark');
    }
    if (hearts <= 0) {
      mode = 'dying';
      player.vx = 0;
      player.vy = 0;
      deathTimer = 0.85;
      setTouchVisible(false);
      G.Audio.stopMusic();
      return;
    }
    respawnPlayer();
    showToast(kind === 'water' ? 'THE TIDE SPITS YOU BACK' : kind === 'warden' ? 'THE WARDEN COLLECTS ITS TOLL' : 'MIND THE THORNS', 1200);
  }

  function activateCheckpoint(cp) {
    if (cp.active) return;
    cp.active = true;
    checkpoint = { x: cp.x, y: cp.y };
    G.Audio.checkpoint();
    const p = G.Renderer.PALETTES[active.theme] || G.Renderer.PALETTES.castle;
    spawnParticles(cp.x, cp.y - 24, p.goldLight, 12, 55, 50, 'spark');
    showToast('CHECKPOINT  ·  COURAGE RESTORED', 1300);
  }

  function completeLevel() {
    if (!active || levelFinished || mode !== 'playing') return;
    levelFinished = true;
    mode = 'complete';
    const total = active.totalCoins;
    const all = coinsGot >= total;
    const cursedAll = totalCursedThisLevel > 0 && cursedGot >= totalCursedThisLevel;
    if (all) score += 500;
    if (cursedAll) score += 250;
    const earned = {
      all: all,
      untouched: damageTaken === 0,
      cursed: cursedAll
    };
    save.medals = save.medals || {};
    const prevMedals = save.medals[active.id] || {};
    save.medals[active.id] = {
      all: !!(prevMedals.all || earned.all),
      untouched: !!(prevMedals.untouched || earned.untouched),
      cursed: !!(prevMedals.cursed || earned.cursed)
    };
    const bestBefore = save.bests[active.id];
    const newBest = !bestBefore || score > bestBefore.score || (score === bestBefore.score && levelTime < bestBefore.time);
    const pct = total > 0 ? coinsGot / total : 1;
    const rank = all ? 'S' : pct >= 0.9 ? 'A' : pct >= 0.75 ? 'B' : pct >= 0.5 ? 'C' : 'D';
    if (newBest) {
      save.bests[active.id] = { score: score, time: levelTime, coins: coinsGot, rank: rank };
    }
    save.cleared[active.id] = true;
    persistNow();
    G.Audio.complete();
    setHudVisible(false);
    setTouchVisible(false);
    hideToast();
    hideIsleIntro();
    $('complete-isle').textContent = active.name;
    $('complete-rank').textContent = rank;
    $('res-score').textContent = String(score);
    $('res-coins').textContent = coinsGot + '/' + total;
    $('res-time').textContent = G.fmtTime(levelTime);
    $('res-best').textContent = String(save.bests[active.id].score);
    $('complete-flavor').textContent = all
      ? 'Not a single glint left behind.'
      : cursedAll
        ? 'You broke the curse and claimed its hoard.'
        : pct >= 0.75
          ? 'A very respectable haul.'
          : 'The isle still keeps a few secrets.';
    const medalsEl = $('complete-medals');
    if (medalsEl) {
      const medalList = [
        { id: 'all', label: 'ALL COINS', sub: 'EVERY GLINT', ok: earned.all },
        { id: 'untouched', label: 'UNTOUCHED', sub: 'NO DAMAGE', ok: earned.untouched },
        { id: 'cursed', label: 'CURSEBREAKER', sub: 'ALL CURSED GOLD', ok: earned.cursed }
      ];
      medalsEl.innerHTML = medalList.map(function (m) {
        return '<span class="medal' + (m.ok ? ' earned' : '') + '" data-medal="' + m.id + '">' +
          '<i aria-hidden="true"></i><span class="medal-copy"><b>' + m.label + '</b><small>' + m.sub + '</small></span>' +
        '</span>';
      }).join('');
      medalsEl.classList.toggle('all-earned', earned.all && earned.untouched && earned.cursed);
    }
    const ribbon = $('complete-ribbon');
    ribbon.classList.toggle('hidden', !newBest);
    const next = G.REALMS[activeIndex + 1];
    const nextBtn = $('complete-next');
    if (next) {
      nextBtn.textContent = 'NEXT ISLE';
      nextBtn.dataset.action = 'next';
      nextBtn.disabled = false;
    } else {
      nextBtn.textContent = 'WORLD MAP';
      nextBtn.dataset.action = 'title';
      nextBtn.disabled = false;
    }
    showScreen(completeScreen);
    updateCards();
  }

  function finishFail() {
    if (mode !== 'failed') {
      mode = 'failed';
      setHudVisible(false);
      setTouchVisible(false);
      hideToast();
      hideIsleIntro();
      $('fail-coins').textContent = coinsGot + ' / ' + totalCoinsThisLevel;
      showScreen(failScreen);
      if (G.Audio.isEnabled()) G.Audio.fail();
    }
  }

  function nextLevel() {
    if (!activeRealm) { showTitle(); return; }
    const next = G.REALMS[activeIndex + 1];
    if (next) startLevel(next.id);
    else showTitle();
  }

  function pauseGame() {
    if (mode !== 'playing') return;
    mode = 'paused';
    hideIsleIntro();
    input.left = false;
    input.right = false;
    input.jumpHeld = false;
    jumpBuffer = 0;
    G.Audio.duckMusic(true);
    $('pause-isle').textContent = active.name;
    $('pause-time').textContent = G.fmtTime(levelTime);
    setTouchVisible(false);
    showScreen(pauseScreen);
    updateSoundUI();
    updateTouchClass();
  }

  function resumeGame() {
    if (mode !== 'paused') return;
    mode = 'playing';
    hideAllScreens();
    setHudVisible(true);
    setTouchVisible(true);
    G.Audio.duckMusic(false);
    jumpBuffer = 0;
    accumulator = 0;
    updateTouchClass();
  }

  function restartLevel() {
    if (!activeRealm) return;
    startLevel(activeRealm.id);
  }

  function clearInputs() {
    for (const k in keys) delete keys[k];
    touchInput.left = false;
    touchInput.right = false;
    touchInput.jump = false;
    touchInput.dash = false;
    input.left = false;
    input.right = false;
    input.jumpHeld = false;
    input.sprint = false;
  }

  // ---------------------------------------------------------------- physics

  function solidTile(tx, ty) {
    return G.World.isSolid(active, tx, ty) || G.World.isPlatform(active, tx, ty);
  }

  function wallTile(tx, ty) {
    return G.World.isSolid(active, tx, ty);
  }

  function resolveHorizontal() {
    const top = Math.floor((player.y - 20 + 1) / T);
    const bottom = Math.floor((player.y - 1) / T);
    if (player.vx > 0) {
      const tx = Math.floor((player.x + 5) / T);
      for (let ty = top; ty <= bottom; ty++) {
        if (wallTile(tx, ty)) {
          player.x = tx * T - 5.01;
          player.vx = 0;
          return;
        }
      }
    } else if (player.vx < 0) {
      const tx = Math.floor((player.x - 5) / T);
      for (let ty = top; ty <= bottom; ty++) {
        if (wallTile(tx, ty)) {
          player.x = (tx + 1) * T + 5.01;
          player.vx = 0;
          return;
        }
      }
    }
  }

  function resolveVertical(prevBottom) {
    const left = Math.floor((player.x - 5 + 1) / T);
    const right = Math.floor((player.x + 5 - 1) / T);
    player.grounded = false;
    if (player.vy > 0) {
      const ty = Math.floor(player.y / T);
      for (let tx = left; tx <= right; tx++) {
        const platform = G.World.isPlatform(active, tx, ty);
        // Ledges are one-way: they catch a falling hero, but can be jumped
        // through from below and never block a walk along the ground.
        if (platform && prevBottom > ty * T + 0.5) continue;
        if (solidTile(tx, ty)) {
          player.y = ty * T;
          player.vy = 0;
          player.grounded = true;
          break;
        }
      }
    } else if (player.vy < 0) {
      const ty = Math.floor((player.y - 20) / T);
      for (let tx = left; tx <= right; tx++) {
        if (G.World.isPlatform(active, tx, ty)) continue;
        if (solidTile(tx, ty)) {
          player.y = (ty + 1) * T + 20;
          player.vy = 0;
          break;
        }
      }
    }
    const landed = player.grounded && prevBottom < player.y - 0.5;
    if (landed) {
      shake = Math.max(shake, 0.035);
      G.Audio.land();
      const p = G.Renderer.PALETTES[active.theme] || G.Renderer.PALETTES.castle;
      spawnParticles(player.x, player.y, p.stoneLight, 3, 28, 8, 'dust');
    }
  }

  function hazardAtPoint(x, y) {
    const tx = Math.floor(x / T);
    const ty = Math.floor(y / T);
    return G.World.isWater(active, tx, ty) || G.World.isSpike(active, tx, ty);
  }

  function checkHazards() {
    if (player.invuln > 0 || mode !== 'playing') return;
    if (player.y > active.h * T + 24) { hurtPlayer('water'); return; }
    const points = [
      [player.x, player.y - 3],
      [player.x - 4, player.y - 3],
      [player.x + 4, player.y - 3],
      [player.x, player.y - 12]
    ];
    for (let i = 0; i < points.length; i++) {
      if (hazardAtPoint(points[i][0], points[i][1])) {
        hurtPlayer('water');
        return;
      }
    }
  }

  function updateEnemies(dt) {
    for (let i = 0; i < active.enemies.length; i++) {
      const e = active.enemies[i];
      if (!e.alive) continue;
      e.x += e.vx * dt;
      if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
      if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
      e.dir = e.vx < 0 ? -1 : 1;
    }
  }

  function updatePlaying(dt) {
    if (!active) return;
    if (player.invuln > 0) player.invuln -= dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 1.8);
    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) { comboTimer = 0; combo = 0; }
    }
    levelTime += dt;

    pollInput();
    if (jumpBuffer > 0) jumpBuffer -= dt;

    if (player.grounded) player.coyote = 0.1;
    else if (player.coyote > 0) player.coyote -= dt;

    if (jumpBuffer > 0 && (player.grounded || player.coyote > 0)) {
      player.vy = -JUMP_SPEED;
      player.grounded = false;
      player.coyote = 0;
      jumpBuffer = 0;
      G.Audio.jump();
      const p = G.Renderer.PALETTES[active.theme] || G.Renderer.PALETTES.castle;
      spawnParticles(player.x, player.y, p.stoneLight, 4, 35, 6, 'dust');
    }

    const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const topSpeed = input.sprint ? SPRINT_SPEED : MOVE_SPEED;
    if (move !== 0) {
      player.dir = move;
      const target = move * topSpeed;
      player.vx = G.approach(player.vx, target, (player.grounded ? 1250 : 700) * dt);
    } else {
      player.vx = G.approach(player.vx, 0, (player.grounded ? 1700 : 500) * dt);
    }
    if (!input.jumpHeld && player.vy < -75) player.vy += 1500 * dt;
    player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL);

    const prevBottom = player.y;
    player.x += player.vx * dt;
    resolveHorizontal();
    player.y += player.vy * dt;
    resolveVertical(prevBottom);

    player.x = G.clamp(player.x, 7, active.w * T - 7);
    if (player.y > active.h * T + 24) {
      hurtPlayer('water');
      return;
    }

    updateEnemies(dt);
    updateWarden(dt);

    // Hazards first, then collects, so a careless jump still has consequences.
    checkHazards();
    if (mode !== 'playing') return;

    const body = { x: player.x - 5, y: player.y - 20, w: 10, h: 20 };
    if (warden) {
      const wb = { x: warden.x - 9, y: warden.y - 24, w: 18, h: 26 };
      if (G.aabb(body, wb)) {
        handleWardenCollision(prevBottom);
        if (mode !== 'playing') return;
        updateParticles(dt);
        updateCamera(false);
        updateHUD();
        return;
      }
    }
    for (let i = 0; i < active.coins.length; i++) {
      const c = active.coins[i];
      if (c.collected) continue;
      const dx = c.x - player.x;
      const dy = c.y - (player.y - 10);
      if (dx * dx + dy * dy < 16 * 16) collectCoin(c);
    }

    for (let i = 0; i < active.enemies.length; i++) {
      const e = active.enemies[i];
      if (!e.alive) continue;
      const eb = { x: e.x, y: e.y, w: e.w, h: e.h };
      if (G.aabb(body, eb)) {
        if (player.vy > 70 && prevBottom <= e.y + 6) {
          e.alive = false;
          player.vy = -255;
          player.grounded = false;
          score += 25;
          G.Audio.stomp();
          shake = Math.max(shake, 0.18);
          spawnParticles(e.x + 6, e.y + 4, '#f0bd54', 7, 50, 25, 'chunk');
          updateHUD();
        } else {
          hurtPlayer('enemy');
        }
        break;
      }
    }

    for (let i = 0; i < active.checkpoints.length; i++) {
      const cp = active.checkpoints[i];
      if (!cp.active && Math.abs(player.x - cp.x) < 13 && player.y > cp.y - 30 && player.y < cp.y + 12) {
        activateCheckpoint(cp);
      }
    }

    for (let i = 0; i < active.shrines.length; i++) {
      const shrine = active.shrines[i];
      if (!shrine.used && Math.abs(player.x - shrine.x) < 15 && player.y > shrine.y - 30 && player.y < shrine.y + 10) {
        // Shrines are anti-Warden sanctuaries: they only spend their charge
        // when the curse is full, so passing one early never wastes it.
        if (curse >= 3) {
          useShrine(shrine);
        } else if (curse > 0 && !shrine.hinted) {
          shrine.hinted = true;
          showToast('SHRINE DORMANT  ·  FULL CURSE AWAKENS IT', 1500);
        }
      }
    }

    if (active.gate && G.aabb(body, { x: active.gate.x - 15, y: active.gate.y - 48, w: 30, h: 48 })) {
      completeLevel();
      return;
    }

    updateParticles(dt);
    updateCamera(false);
    updateHUD();
  }

  // ------------------------------------------------------------------ input

  function getPad() {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    for (let i = 0; i < pads.length; i++) if (pads[i]) return pads[i];
    return null;
  }

  function pollInput() {
    const pad = getPad();
    let left = !!(keys['ArrowLeft'] || keys['KeyA'] || touchInput.left);
    let right = !!(keys['ArrowRight'] || keys['KeyD'] || touchInput.right);
    let sprint = !!(keys['ShiftLeft'] || keys['ShiftRight'] || touchInput.dash);
    let jumpKey = !!(keys['Space'] || keys['KeyW'] || keys['ArrowUp'] || touchInput.jump);
    let jumpPad = false;
    if (pad) {
      const ax = pad.axes[0] || 0;
      if (ax < -0.35) left = true;
      if (ax > 0.35) right = true;
      if (pad.buttons[6] && pad.buttons[6].pressed) sprint = true;
      if (pad.buttons[1] && pad.buttons[1].pressed) sprint = true;
      if (pad.buttons[14] && pad.buttons[14].pressed) left = true;
      if (pad.buttons[15] && pad.buttons[15].pressed) right = true;
      jumpPad = !!(pad.buttons[0] && pad.buttons[0].pressed);
      if (jumpPad && !padJumpPrev) queueJump();
      padJumpPrev = jumpPad;
    }
    input.left = left;
    input.right = right;
    input.sprint = sprint;
    input.jumpHeld = !!(jumpKey || jumpPad);
  }

  function onKeyDown(e) {
    const code = e.code;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].indexOf(code) >= 0) e.preventDefault();
    if (e.repeat) {
      if (mode === 'playing') keys[code] = true;
      return;
    }
    keys[code] = true;
    if (code === 'KeyM') { toggleSound(); return; }

    if (mode === 'title') {
      if (code === 'ArrowLeft') { selectCard((selectedIndex + G.REALMS.length - 1) % G.REALMS.length, true); return; }
      if (code === 'ArrowRight') { selectCard((selectedIndex + 1) % G.REALMS.length, true); return; }
      if (code === 'Enter' || code === 'Space') {
        e.preventDefault();
        if (document.activeElement && document.activeElement.id === 'title-sound') {
          toggleSound();
          return;
        }
        startLevel(G.REALMS[selectedIndex].id);
        return;
      }
      return;
    }

    if (mode === 'playing') {
      if (code === 'Escape' || code === 'KeyP') { pauseGame(); return; }
      if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') queueJump();
      return;
    }

    if (mode === 'paused') {
      if (code === 'Escape' || code === 'KeyP' || code === 'Enter' || code === 'Space') { resumeGame(); return; }
      if (code === 'KeyR') { restartLevel(); return; }
      if (code === 'KeyT' || code === 'Backspace') { showTitle(); return; }
      return;
    }

    if (mode === 'complete' || mode === 'failed') {
      if (code === 'Enter' || code === 'Space') {
        if (mode === 'complete') nextLevel();
        else restartLevel();
        return;
      }
      if (code === 'KeyR') { restartLevel(); return; }
      if (code === 'KeyT' || code === 'Escape') { showTitle(); return; }
    }
  }

  function onKeyUp(e) {
    delete keys[e.code];
  }

  function bindTouchButton(btn) {
    const action = btn.getAttribute('data-touch');
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      btn.classList.add('is-pressed');
      touchInput[action] = true;
      if (action === 'jump') queueJump();
      if (btn.setPointerCapture) {
        try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    const release = function (e) {
      if (e) e.preventDefault();
      btn.classList.remove('is-pressed');
      touchInput[action] = false;
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', function (e) {
      if (e.buttons === 0) release(e);
    });
  }

  function bindEvents() {
    window.addEventListener('resize', fitStage);
    window.addEventListener('orientationchange', function () { window.setTimeout(fitStage, 120); });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', function () {
      clearInputs();
      if (!testMode && mode === 'playing') pauseGame();
    });
    document.addEventListener('visibilitychange', function () {
      if (!testMode && document.hidden && mode === 'playing') pauseGame();
    });
    window.addEventListener('pagehide', persistNow);
    window.addEventListener('beforeunload', persistNow);

    const pauseBtn = $('btn-pause');
    if (pauseBtn) pauseBtn.addEventListener('click', function () { pauseGame(); });
    const soundBtn = $('btn-sound');
    if (soundBtn) soundBtn.addEventListener('click', toggleSound);
    const titleSound = $('title-sound');
    if (titleSound) titleSound.addEventListener('click', toggleSound);

    document.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'resume') resumeGame();
      else if (action === 'restart') restartLevel();
      else if (action === 'title') showTitle();
      else if (action === 'sound') toggleSound();
      else if (action === 'next') nextLevel();
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-touch]'), bindTouchButton);
    updateTouchClass();
  }

  // ------------------------------------------------------------------ loop

  function loop(ts) {
    window.requestAnimationFrame(loop);
    if (!lastFrame) lastFrame = ts;
    const raw = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts;
    time += raw;
    accumulator += raw;
    let steps = 0;
    while (accumulator >= STEP && steps < 5) {
      update(STEP);
      accumulator -= STEP;
      steps++;
    }
    if (accumulator > STEP * 4) accumulator = 0;

    if (mode === 'title') {
      G.Renderer.drawTitle(ctx, time, titleTheme, levelById[G.REALMS[selectedIndex].id]);
    } else if (active) {
      let camX = Math.round(camera.x);
      let camY = Math.round(camera.y);
      if (shake > 0) {
        camX += Math.round((Math.random() * 2 - 1) * Math.min(4, shake * 12));
        camY += Math.round((Math.random() * 2 - 1) * Math.min(3, shake * 9));
      }
      G.Renderer.drawGame(ctx, active, player, { x: camX, y: camY }, time, particleList, warden, curse);
    } else {
      ctx.fillStyle = '#0d1725';
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  function update(dt) {
    if (mode === 'playing') {
      updatePlaying(dt);
      return;
    }
    if (mode === 'dying') {
      deathTimer -= dt;
      updateParticles(dt);
      if (deathTimer <= 0) finishFail();
      return;
    }
    if (mode === 'title') return;
    // Pause, complete and failure screens hold their frozen frame.
  }

  // --------------------------------------------------------------- bootstrap

  function boot() {
    G.Audio.setEnabled(!save.muted);
    buildCards();
    bindEvents();
    fitStage();
    updateSoundUI();
    showTitle();
    window.requestAnimationFrame(loop);
  }

  // Small testing/debug surface. It keeps automated checks honest about the
  // same state the player sees, and is not used by the normal UI.
  window.__GILDED__ = {
    start: function (id) { startLevel(id || G.REALMS[0].id); },
    pause: pauseGame,
    resume: resumeGame,
    finish: completeLevel,
    collectAll: function () {
      if (!active) return;
      active.coins.forEach(function (c) { if (!c.collected) collectCoin(c); });
    },
    teleport: function (x, y) {
      if (!active) return;
      player.x = x;
      player.y = y;
      player.vx = 0;
      player.vy = 0;
      player.grounded = false;
      player.invuln = 1.2;
      updateCamera(true);
    },
    invincible: function (seconds) {
      if (active) player.invuln = seconds == null ? 1 : Math.max(0, seconds);
    },
    checkpoints: function () {
      return active ? active.checkpoints.map(function (c) { return { x: c.x, y: c.y, active: c.active }; }) : [];
    },
    shrines: function () {
      return active ? active.shrines.map(function (s) { return { x: s.x, y: s.y, used: s.used }; }) : [];
    },
    cursed: function () {
      return active ? active.coins.filter(function (c) { return c.kind === 'cursed'; }).map(function (c) { return { x: c.x, y: c.y, collected: c.collected }; }) : [];
    },
    setCurse: function (n) {
      if (!active) return;
      curse = G.clamp(n | 0, 0, 3);
      if (curse >= 3 && !warden) spawnWarden();
      updateHUD();
    },
    cleanse: function () {
      if (!active) return;
      curse = 0;
      warden = null;
      updateHUD();
    },
    warden: function () {
      return warden ? { x: Math.round(warden.x), y: Math.round(warden.y) } : null;
    },
    enemies: function () {
      return active ? active.enemies.map(function (e) { return { x: Math.round(e.x), y: Math.round(e.y), alive: e.alive }; }) : [];
    },
    setTest: function (v) { testMode = !!v; },
    state: function () {
      return {
        mode: mode,
        level: active ? active.id : null,
        x: active ? Math.round(player.x) : 0,
        y: active ? Math.round(player.y) : 0,
        score: score,
        coins: coinsGot,
        total: totalCoinsThisLevel,
        gems: gemsGot,
        cursed: cursedGot,
        totalCursed: totalCursedThisLevel,
        curse: curse,
        warden: !!warden,
        damage: damageTaken,
        hearts: hearts,
        time: levelTime,
        maxCombo: maxCombo,
        gate: active && active.gate ? { x: active.gate.x, y: active.gate.y } : null,
        totalLevelCoins: active ? active.totalCoins : 0,
        cleared: SaveCleared()
      };
    }
  };

  function SaveCleared() {
    const out = {};
    G.REALMS.forEach(function (r) { out[r.id] = !!(save.cleared && save.cleared[r.id]); });
    return out;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
