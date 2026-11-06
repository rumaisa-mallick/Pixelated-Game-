/* Gilded Isles — pixel-art world renderer. */
(function () {
  'use strict';
  const G = window.Gilded;
  const T = G.TILE;
  const VW = G.VIEW_W;
  const VH = G.VIEW_H;
  const R = Math.round;

  const P = {
    castle: {
      sky: ['#5f9fd8', '#a9d6f1', '#fae9c4'], sun: '#fff0ae', cloud: '#f9fdff', cloudShade: '#cfe3ee',
      far: '#7998a4', far2: '#9db4b0', mid: '#4e756e', mid2: '#6f9a7d',
      grass: '#4ead56', grassLight: '#86d06d', grassDark: '#2c684a',
      soil: '#5b4136', soilLight: '#7b5946', soilDark: '#38282a',
      stone: '#686b68', stoneLight: '#93988e', stoneDark: '#464b49',
      water: '#2e9dde', waterDeep: '#166a6e', foam: '#c2e5e7',
      gold: '#f0bd54', goldLight: '#ffe79b', rose: '#e872b5', plum: '#574c62',
      spark: '#fff1ad', fog: '#d9eee6'
    },
    forest: {
      sky: ['#6c9dba', '#b5d8dd', '#f8e5bd'], sun: '#ffefb2', cloud: '#f4fbf6', cloudShade: '#c8ded9',
      far: '#5f8278', far2: '#87a28d', mid: '#3f6b5b', mid2: '#648b6b',
      grass: '#4ead56', grassLight: '#9dd97d', grassDark: '#28634a',
      soil: '#5a3e30', soilLight: '#7e5a3f', soilDark: '#32272a',
      stone: '#5d6c5e', stoneLight: '#899384', stoneDark: '#3d4b43',
      water: '#2c90b7', waterDeep: '#18636f', foam: '#b5e3db',
      gold: '#efb953', goldLight: '#ffe58e', rose: '#e872b5', plum: '#4f4f66',
      spark: '#d7ff9d', fog: '#d8eee0'
    },
    sea: {
      sky: ['#5b9fdf', '#a6d9f4', '#ffe7bd'], sun: '#ffefad', cloud: '#f9feff', cloudShade: '#cbe6f3',
      far: '#5e8faf', far2: '#8eafbd', mid: '#2e717c', mid2: '#5d9c91',
      grass: '#6abf78', grassLight: '#b5e28c', grassDark: '#347d63',
      soil: '#b18456', soilLight: '#d7ad77', soilDark: '#755940',
      stone: '#b38b5d', stoneLight: '#e2c08a', stoneDark: '#72573d',
      water: '#2e9dde', waterDeep: '#146a83', foam: '#c4e9ed',
      gold: '#f0bd54', goldLight: '#ffe79b', rose: '#e872b5', plum: '#456071',
      spark: '#fff1ad', fog: '#d7f0eb'
    }
  };

  function px(v) { return Math.round(v); }

  function cloud(ctx, x, y, s, color, shade, alpha) {
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    const r = R;
    G.rect(ctx, x + 5 * s, y + 4 * s, 28 * s, 5 * s, color);
    G.rect(ctx, x + 10 * s, y + 1 * s, 16 * s, 5 * s, color);
    G.rect(ctx, x + 2 * s, y + 7 * s, 38 * s, 4 * s, color);
    G.rect(ctx, x + 8 * s, y + 11 * s, 26 * s, 2 * s, shade);
    G.rect(ctx, x + 45 * s, y + 7 * s, 9 * s, 3 * s, color);
    ctx.globalAlpha = 1;
  }

  function birds(ctx, x, y, t, color) {
    const flap = Math.sin(t * 5) > 0 ? 1 : 0;
    G.rect(ctx, x, y + flap, 2, 1, color);
    G.rect(ctx, x + 2, y + 1 - flap, 2, 1, color);
    G.rect(ctx, x + 4, y + flap, 2, 1, color);
  }

  function hillBand(ctx, offset, base, amp, color, step) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-80, VH + 20);
    for (let x = -80; x <= VW + 80; x += step) {
      const y = base - Math.sin((x + offset) * 0.009) * amp - Math.sin((x + offset) * 0.021 + 1.4) * amp * 0.28;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VW + 80, VH + 20);
    ctx.closePath();
    ctx.fill();
  }

  function island(ctx, x, y, w, h, color, color2) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    G.rect(ctx, x - w, y, w * 2, h * 0.8, color);
    G.rect(ctx, x - w * 0.72, y + h * 0.45, w * 1.44, 2, color2);
  }

  function castleSilhouette(ctx, x, y, scale, color, lit, time) {
    const s = scale;
    G.rect(ctx, x - 30 * s, y - 18 * s, 60 * s, 18 * s, color);
    G.rect(ctx, x - 38 * s, y - 23 * s, 20 * s, 23 * s, color);
    G.rect(ctx, x + 18 * s, y - 23 * s, 20 * s, 23 * s, color);
    G.rect(ctx, x - 33 * s, y - 28 * s, 10 * s, 5 * s, color);
    G.rect(ctx, x + 23 * s, y - 28 * s, 10 * s, 5 * s, color);
    G.rect(ctx, x - 4 * s, y - 36 * s, 8 * s, 18 * s, color);
    G.poly(ctx, [[x - 5 * s, y - 36 * s], [x + 4 * s, y - 36 * s], [x, y - 42 * s]], color);
    G.rect(ctx, x - 2 * s, y - 33 * s, 3 * s, 4 * s, lit);
    G.rect(ctx, x - 27 * s, y - 20 * s, 3 * s, 4 * s, lit);
    G.rect(ctx, x + 19 * s, y - 20 * s, 3 * s, 4 * s, lit);
    const wave = Math.sin(time * 2 + x) * 1;
    G.rect(ctx, x - 1 * s, y - 43 * s, 1 * s, 8 * s, color);
    G.poly(ctx, [[x, y - 43 * s], [x + 10 * s + wave, y - 40 * s], [x, y - 36 * s]], '#b74c47');
  }

  function treeSilhouette(ctx, x, y, h, color, highlight) {
    G.rect(ctx, x - 2, y - h * 0.55, 4, h * 0.55, color);
    const levels = 3;
    for (let i = 0; i < levels; i++) {
      const cy = y - h * (0.45 + i * 0.18);
      const w = h * (0.33 - i * 0.06);
      G.poly(ctx, [[x - w, cy + 10], [x + w, cy + 10], [x, cy - h * 0.22]], color);
      G.rect(ctx, x - w * 0.45, cy + 2, w * 0.3, 2, highlight);
    }
  }

  function lighthouse(ctx, x, y, s, color, lit, time) {
    G.rect(ctx, x - 7 * s, y - 44 * s, 14 * s, 44 * s, color);
    G.rect(ctx, x - 10 * s, y - 46 * s, 20 * s, 5 * s, color);
    G.rect(ctx, x - 4 * s, y - 53 * s, 8 * s, 8 * s, '#fff1ad');
    G.rect(ctx, x - 6 * s, y - 55 * s, 12 * s, 2 * s, color);
    ctx.globalAlpha = 0.25 + Math.sin(time * 3) * 0.08;
    G.rect(ctx, x - 26 * s, y - 50 * s, 20 * s, 2 * s, '#fff1ad');
    ctx.globalAlpha = 1;
  }

  function drawSky(ctx, theme, camX, time, title) {
    const p = P[theme] || P.castle;
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, p.sky[0]);
    g.addColorStop(0.58, p.sky[1]);
    g.addColorStop(1, p.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const sunX = 512 - (camX * 0.018) % 90;
    const sunY = 58;
    ctx.globalAlpha = 0.16;
    G.ellipse(ctx, sunX, sunY, 38, 38, p.sun);
    ctx.globalAlpha = 0.2;
    G.ellipse(ctx, sunX, sunY, 26, 26, p.sun);
    ctx.globalAlpha = 1;
    G.ellipse(ctx, sunX, sunY, 18, 18, p.sun);
    G.rect(ctx, sunX - 14, sunY - 3, 28, 6, '#fff6cf');

    if (title) {
      ctx.globalAlpha = 0.07;
      for (let i = 0; i < 5; i++) {
        G.poly(ctx, [[sunX, sunY], [sunX - 110 + i * 60, 0], [sunX - 70 + i * 60, 0]], '#fff7d1');
      }
      ctx.globalAlpha = 1;
    }

    const drift = camX * 0.075;
    for (let i = 0; i < 5; i++) {
      const base = i * 178 + 80;
      const x = ((base - drift) % 980 + 980) % 980 - 120;
      cloud(ctx, x, 58 + (i % 3) * 27, 0.8 + (i % 2) * 0.22, p.cloud, p.cloudShade, i === 1 ? 0.82 : 0.56);
    }
    const drift2 = camX * 0.13;
    for (let i = 0; i < 4; i++) {
      const x = ((i * 233 + 260 - drift2) % 1100 + 1100) % 1100 - 100;
      cloud(ctx, x, 108 + (i % 2) * 18, 0.48, p.cloud, p.cloudShade, 0.27);
    }

    birds(ctx, 116 - camX * 0.04, 92, time + 1, G.alpha(p.plum, 0.55));
    birds(ctx, 138 - camX * 0.04, 84, time + 1.8, G.alpha(p.plum, 0.45));
    birds(ctx, 470 - camX * 0.06, 116, time + 0.4, G.alpha(p.plum, 0.4));

    // Far layer: coastal hills and silhouette landmarks.
    hillBand(ctx, camX * 0.15 + 70, 213, 34, p.far, 18);
    hillBand(ctx, camX * 0.21 + 280, 234, 26, p.far2, 14);

    const landmarkX = 720 - (camX * 0.24) % 1500;
    if (theme === 'castle') {
      castleSilhouette(ctx, landmarkX, 232, 0.78, G.alpha(p.mid, 0.75), G.alpha(p.gold, 0.7), time);
      treeSilhouette(ctx, landmarkX + 150, 250, 56, G.alpha(p.mid, 0.6), G.alpha(p.mid2, 0.5));
    } else if (theme === 'forest') {
      treeSilhouette(ctx, landmarkX - 80, 245, 86, G.alpha(p.mid, 0.62), G.alpha(p.mid2, 0.62));
      treeSilhouette(ctx, landmarkX + 130, 252, 62, G.alpha(p.mid, 0.56), G.alpha(p.mid2, 0.5));
      treeSilhouette(ctx, landmarkX + 250, 240, 72, G.alpha(p.mid, 0.45), G.alpha(p.mid2, 0.4));
    } else {
      lighthouse(ctx, landmarkX + 80, 250, 0.62, G.alpha(p.mid, 0.72), p.gold, time);
      island(ctx, landmarkX - 200, 248, 45, 12, G.alpha(p.mid, 0.55), p.foam);
    }

    // Mid hills and a thin horizon strip.
    hillBand(ctx, camX * 0.33 + 500, 276, 24, p.mid, 12);
    ctx.globalAlpha = 0.13;
    G.rect(ctx, 0, 279, VW, 2, p.fog);
    ctx.globalAlpha = 1;

    if (theme === 'sea') {
      ctx.globalAlpha = 0.34;
      G.rect(ctx, 0, 282, VW, VH - 282, p.water);
      ctx.globalAlpha = 1;
      for (let i = 0; i < 10; i++) {
        const wx = ((i * 83 - camX * 0.18 + time * 12) % 760 + 760) % 760 - 60;
        const wy = 292 + (i % 4) * 11;
        G.rect(ctx, wx, wy, 18 + (i % 3) * 9, 1, G.alpha(p.foam, 0.3));
      }
    }
  }

  function tileAt(level, x, y) { return G.World.tileAt(level, x, y); }
  function solid(level, x, y) {
    const t = tileAt(level, x, y);
    return t === G.TILES.SOLID || t === G.TILES.BRIDGE;
  }
  function water(level, x, y) { return tileAt(level, x, y) === G.TILES.WATER; }

  function drawSolidTile(ctx, level, x, y, sx, sy, p, time) {
    const t = tileAt(level, x, y);
    const above = solid(level, x, y - 1);
    const below = solid(level, x, y + 1);
    const left = solid(level, x - 1, y);
    const right = solid(level, x + 1, y);
    const n = G.hash(x, y, level.theme === 'castle' ? 3 : level.theme === 'forest' ? 7 : 11);

    if (t === G.TILES.BRIDGE) {
      G.rect(ctx, sx, sy + 3, T, 7, '#4f342c');
      G.rect(ctx, sx, sy + 2, T, 5, '#8c5d3d');
      G.rect(ctx, sx, sy + 2, T, 1, '#c08452');
      G.rect(ctx, sx + 2, sy + 7, T - 4, 1, '#6b4535');
      if (n < 0.5) G.rect(ctx, sx + 3, sy + 9, T - 6, 3, '#3b2930');
      if (x % 4 === 0) {
        G.rect(ctx, sx + 4, sy + 9, 3, 13, '#50352e');
        G.rect(ctx, sx + 5, sy + 9, 1, 12, '#81573e');
      }
      return;
    }

    if (level.theme === 'castle') {
      G.rect(ctx, sx, sy, T, T, p.stoneDark);
      G.rect(ctx, sx, sy + 2, T, T - 2, p.stone);
      G.rect(ctx, sx + 1, sy + 3, T - 2, T - 5, p.stone);
      G.rect(ctx, sx, sy + 6, T, 1, p.stoneDark);
      G.rect(ctx, sx, sy + 12, T, 1, p.stoneDark);
      const off = (y % 2) * 8;
      G.rect(ctx, sx + off, sy + 7, 1, 5, p.stoneDark);
      G.rect(ctx, sx + ((off + 8) % T), sy + 13, 1, 3, p.stoneDark);
      G.rect(ctx, sx + 2, sy + 4, 4, 1, p.stoneLight);
      if (n > 0.75) G.rect(ctx, sx + 10, sy + 14, 3, 1, p.stoneLight);
      if (n < 0.15) {
        G.rect(ctx, sx + 3, sy + 9, 3, 2, p.grassDark);
        G.rect(ctx, sx + 12, sy + 4, 2, 3, p.grassDark);
      }
      if (!above) {
        G.rect(ctx, sx, sy, T, 4, p.grassDark);
        G.rect(ctx, sx, sy, T, 2, p.grass);
        G.rect(ctx, sx + 2, sy - 1, 2, 2, p.grassLight);
        if (n > 0.6) G.rect(ctx, sx + 11, sy - 1, 1, 2, p.grassLight);
      }
    } else if (level.theme === 'forest') {
      G.rect(ctx, sx, sy, T, T, p.soil);
      G.rect(ctx, sx + 2, sy + 3, T - 4, T - 4, p.soil);
      G.rect(ctx, sx, sy + 6, T, 1, p.soilDark);
      G.rect(ctx, sx + 4, sy + 11, 7, 1, p.soilDark);
      if (n < 0.35) G.rect(ctx, sx + 10, sy + 4, 3, 2, p.stoneDark);
      if (n > 0.72) G.rect(ctx, sx + 2, sy + 13, 4, 1, p.soilLight);
      if (!above) {
        G.rect(ctx, sx, sy, T, 5, p.grassDark);
        G.rect(ctx, sx, sy, T, 3, p.grass);
        G.rect(ctx, sx + 1, sy - 1, 2, 2, p.grassLight);
        if (n > 0.48) G.rect(ctx, sx + 7, sy - 2, 1, 3, p.grassLight);
        if (n < 0.25) G.rect(ctx, sx + 12, sy - 1, 1, 2, p.grassLight);
      }
      if (!below) G.rect(ctx, sx, sy + T - 2, T, 2, p.soilDark);
      if (!left) G.rect(ctx, sx, sy, 1, T, p.soilLight);
      if (!right) G.rect(ctx, sx + T - 1, sy, 1, T, p.soilDark);
    } else {
      G.rect(ctx, sx, sy, T, T, p.stoneDark);
      G.rect(ctx, sx + 1, sy + 1, T - 2, T - 2, p.stone);
      G.rect(ctx, sx + 2, sy + 4, T - 4, T - 8, p.soilLight);
      G.rect(ctx, sx, sy + 7, T, 1, p.stoneDark);
      G.rect(ctx, sx + 3, sy + 11, 7, 1, p.stoneDark);
      if (n < 0.3) G.rect(ctx, sx + 11, sy + 5, 2, 2, p.soilLight);
      if (n > 0.78) G.rect(ctx, sx + 4, sy + 13, 2, 1, p.stoneDark);
      if (!above) {
        G.rect(ctx, sx, sy, T, 4, p.soilDark);
        G.rect(ctx, sx, sy, T, 2, p.soilLight);
        G.rect(ctx, sx + 2, sy + 2, T - 4, 1, p.grass);
        if (n > 0.52) G.rect(ctx, sx + 8, sy - 1, 1, 2, p.grassLight);
      }
      if (!left) G.rect(ctx, sx, sy, 1, T, p.stoneDark);
      if (!right) G.rect(ctx, sx + T - 1, sy, 1, T, p.stoneDark);
    }
  }

  function drawPlatformTile(ctx, level, x, y, sx, sy, p, time) {
    const n = G.hash(x, y, level.theme === 'castle' ? 17 : level.theme === 'forest' ? 23 : 29);
    let top = p.stoneLight;
    let body = p.stone;
    let dark = p.stoneDark;
    if (level.theme === 'forest') { top = p.grassLight; body = p.soil; dark = p.soilDark; }
    if (level.theme === 'sea') { top = p.grassLight; body = p.stone; dark = p.stoneDark; }
    G.rect(ctx, sx, sy + 2, T, 5, dark);
    G.rect(ctx, sx + 1, sy + 1, T - 2, 4, body);
    G.rect(ctx, sx, sy, T, 2, top);
    if (n > 0.55) G.rect(ctx, sx + 3, sy + 5, 2, 2, dark);
    if (n < 0.35) G.rect(ctx, sx + 11, sy + 4, 3, 1, top);
    if (x % 2 === 0) G.rect(ctx, sx + 1, sy + 2, 1, 4, G.alpha(top, 0.65));
  }

  function drawWaterTile(ctx, level, x, y, sx, sy, p, time) {
    const t = tileAt(level, x, y);
    const aboveWater = water(level, x, y - 1);
    G.rect(ctx, sx, sy, T, T, p.waterDeep);
    G.rect(ctx, sx, sy + 3, T, T - 3, p.water);
    G.rect(ctx, sx, sy + 9, T, 2, G.alpha(p.waterDeep, 0.6));
    const wave = Math.sin(time * 2.2 + x * 0.44 + y * 0.31);
    G.rect(ctx, sx + 2, sy + 5 + (wave > 0 ? 1 : 0), 5, 1, G.alpha(p.foam, 0.55));
    G.rect(ctx, sx + 10, sy + 12 + (wave < 0 ? 1 : 0), 4, 1, G.alpha(p.foam, 0.4));
    if (!aboveWater) {
      G.rect(ctx, sx, sy, T, 1, p.foam);
      G.rect(ctx, sx + 2, sy + 1, 4, 1, G.alpha(p.foam, 0.72));
      G.rect(ctx, sx + 11, sy + 1, 3, 1, G.alpha(p.foam, 0.58));
    }
  }

  function drawTiles(ctx, level, cam, time) {
    const p = P[level.theme] || P.castle;
    const x0 = Math.max(0, Math.floor(cam.x / T) - 1);
    const x1 = Math.min(level.w, Math.ceil((cam.x + VW) / T) + 1);
    const y0 = Math.max(0, Math.floor(cam.y / T) - 1);
    const y1 = Math.min(level.h, Math.ceil((cam.y + VH) / T) + 1);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const t = tileAt(level, x, y);
        if (t === G.TILES.EMPTY) continue;
        const sx = px(x * T - cam.x);
        const sy = px(y * T - cam.y);
        if (t === G.TILES.WATER) drawWaterTile(ctx, level, x, y, sx, sy, p, time);
        else if (t === G.TILES.PLATFORM) drawPlatformTile(ctx, level, x, y, sx, sy, p, time);
        else if (t === G.TILES.SPIKE) {
          G.rect(ctx, sx, sy, T, T, '#1b2027');
          for (let i = 0; i < 3; i++) {
            G.poly(ctx, [[sx + 2 + i * 4, sy + T], [sx + 4 + i * 4, sy + 5], [sx + 6 + i * 4, sy + T]], p.stoneLight);
          }
        } else drawSolidTile(ctx, level, x, y, sx, sy, p, time);
      }
    }
  }

  function drawDecorItem(ctx, level, d, cam, time) {
    const p = P[level.theme] || P.castle;
    const x = px(d.x - cam.x);
    const y = px(d.y - cam.y);
    if (x < -110 || x > VW + 110) return;
    const sway = Math.sin(time * 1.25 + d.seed * 7) * 1.5;

    if (d.type === 'tree') {
      const h = 54 + d.seed * 28;
      G.rect(ctx, x - 3, y - h * 0.5, 6, h * 0.5, p.soilDark);
      G.rect(ctx, x - 1, y - h * 0.5, 2, h * 0.5, p.soilLight);
      const c = p.mid;
      const c2 = p.mid2;
      G.ellipse(ctx, x - 10 + sway, y - h * 0.66, 14, 10, c);
      G.ellipse(ctx, x + 10 + sway, y - h * 0.7, 15, 11, c);
      G.ellipse(ctx, x + sway, y - h * 0.87, 17, 13, c);
      G.ellipse(ctx, x - 6 + sway, y - h * 0.79, 9, 7, c2);
      G.rect(ctx, x - 16 + sway, y - h * 0.72, 5, 2, p.grassLight);
      if (d.seed > 0.5) G.rect(ctx, x + 9 + sway, y - h * 0.85, 4, 2, p.grass);
    } else if (d.type === 'palm') {
      const h = 50 + d.seed * 20;
      for (let i = 0; i < 6; i++) {
        G.rect(ctx, x - 2 + Math.sin(i * 0.5) * 4, y - h + i * (h / 6), 4, h / 6 + 1, p.soilDark);
      }
      G.rect(ctx, x - 3, y - h, 6, 4, p.soil);
      const f = p.grassDark;
      G.poly(ctx, [[x, y - h], [x - 24 + sway, y - h - 6], [x - 10, y - h + 5]], f);
      G.poly(ctx, [[x, y - h], [x + 24 + sway, y - h - 4], [x + 10, y - h + 6]], f);
      G.poly(ctx, [[x, y - h], [x - 7, y - h - 20], [x + 5, y - h - 16]], p.grass);
      G.poly(ctx, [[x + 2, y - h - 4], [x + 17, y - h - 16], [x + 15, y - h - 3]], p.mid2);
    } else if (d.type === 'bush') {
      G.ellipse(ctx, x, y - 5, 11, 6, p.mid);
      G.ellipse(ctx, x + 7, y - 8, 7, 5, p.mid2);
      G.rect(ctx, x - 11, y - 4, 22, 4, p.grassDark);
      G.rect(ctx, x - 5, y - 9, 3, 2, p.grassLight);
    } else if (d.type === 'mushroom') {
      G.rect(ctx, x - 1, y - 7, 3, 7, '#e5c59e');
      G.ellipse(ctx, x, y - 7, 5, 3, p.rose);
      G.rect(ctx, x - 3, y - 8, 2, 1, '#f8dfdc');
    } else if (d.type === 'flower') {
      G.rect(ctx, x, y - 6, 1, 6, p.grassDark);
      G.rect(ctx, x - 2, y - 8, 2, 2, d.seed > 0.5 ? p.rose : p.goldLight);
      G.rect(ctx, x + 1, y - 7, 2, 2, p.foam);
    } else if (d.type === 'banner') {
      G.rect(ctx, x - 1, y - 42, 2, 42, p.stoneDark);
      const w = 15;
      G.poly(ctx, [[x + 1, y - 38], [x + w, y - 35 + sway], [x + w, y - 18 + sway], [x + 1, y - 22]], '#b74c47');
      G.poly(ctx, [[x + 5, y - 31], [x + 10, y - 29], [x + 7, y - 25], [x + 3, y - 27]], p.goldLight);
    } else if (d.type === 'pillar') {
      G.rect(ctx, x - 5, y - 32, 10, 32, p.stone);
      G.rect(ctx, x - 7, y - 35, 14, 4, p.stoneLight);
      G.rect(ctx, x - 7, y - 4, 14, 4, p.stoneDark);
      G.rect(ctx, x - 4, y - 30, 2, 24, p.stoneLight);
      if (d.seed > 0.47) G.rect(ctx, x + 2, y - 20, 1, 8, p.stoneDark);
    } else if (d.type === 'torch') {
      G.rect(ctx, x - 1, y - 28, 3, 28, p.stoneDark);
      G.rect(ctx, x - 4, y - 30, 9, 4, p.stone);
      const f = Math.sin(time * 9 + d.seed * 4) * 1;
      ctx.globalAlpha = 0.2;
      G.ellipse(ctx, x, y - 34, 12, 9, p.gold);
      ctx.globalAlpha = 1;
      G.poly(ctx, [[x - 4, y - 30], [x + 1 + f, y - 43], [x + 5, y - 30]], p.gold);
      G.poly(ctx, [[x - 2, y - 30], [x + 1 + f, y - 38], [x + 2, y - 30]], p.goldLight);
    } else if (d.type === 'rock') {
      G.rect(ctx, x - 8, y - 8, 16, 8, p.stoneDark);
      G.rect(ctx, x - 6, y - 10, 11, 5, p.stone);
      G.rect(ctx, x - 3, y - 9, 5, 2, p.stoneLight);
    } else if (d.type === 'coral') {
      G.rect(ctx, x - 1, y - 15, 2, 15, p.rose);
      G.rect(ctx, x - 7, y - 14, 7, 2, p.rose);
      G.rect(ctx, x - 7, y - 17, 2, 5, p.rose);
      G.rect(ctx, x + 3, y - 12, 6, 2, '#b74c86');
      G.rect(ctx, x + 6, y - 15, 2, 5, '#b74c86');
      G.rect(ctx, x - 4, y - 4, 2, 2, p.goldLight);
    } else if (d.type === 'shell') {
      G.ellipse(ctx, x, y - 3, 4, 3, p.goldLight);
      G.rect(ctx, x - 2, y - 4, 1, 2, p.rose);
      G.rect(ctx, x + 2, y - 4, 1, 2, p.rose);
    } else if (d.type === 'rubble') {
      G.rect(ctx, x - 5, y - 3, 4, 3, p.stoneDark);
      G.rect(ctx, x + 2, y - 2, 3, 2, p.stone);
      G.rect(ctx, x - 1, y - 4, 3, 2, p.stoneLight);
    } else if (d.type === 'sign') {
      G.rect(ctx, x - 1, y - 25, 2, 25, p.soilDark);
      G.rect(ctx, x - 9, y - 26, 18, 10, p.soilLight);
      G.rect(ctx, x - 7, y - 24, 14, 1, p.soilDark);
      G.rect(ctx, x - 6, y - 21, 10, 1, p.soilDark);
      G.poly(ctx, [[x + 7, y - 27], [x + 13, y - 21], [x + 7, y - 15]], p.gold);
    }
  }

  function drawDecor(ctx, level, cam, time, layer) {
    for (let i = 0; i < level.decor.length; i++) {
      const d = level.decor[i];
      if (d.layer !== layer) continue;
      if (d.type === 'checkpoint') continue;
      drawDecorItem(ctx, level, d, cam, time);
    }
  }

  function drawCoin(ctx, level, c, cam, time) {
    const x = px(c.x - cam.x);
    const y = px(c.y - cam.y + Math.sin(time * 3.2 + c.phase) * 1.6);
    if (x < -20 || x > VW + 20 || y < -20 || y > VH + 20) return;
    const p = P[level.theme] || P.castle;
    if (c.kind === 'cursed') {
      ctx.globalAlpha = 0.2 + Math.sin(time * 4 + c.phase) * 0.05;
      G.ellipse(ctx, x, y, 11, 10, '#d34d82');
      ctx.globalAlpha = 1;
      G.rect(ctx, x - 4, y - 5, 8, 10, '#201626');
      G.rect(ctx, x - 5, y - 4, 10, 8, '#4a2941');
      G.rect(ctx, x - 3, y - 4, 6, 1, '#f0bd54');
      G.rect(ctx, x - 3, y + 4, 6, 1, '#8f2e5a');
      G.rect(ctx, x - 1, y - 7, 2, 2, '#ffe79b');
      G.rect(ctx, x - 2, y - 2, 1, 2, '#ffe79b');
      G.rect(ctx, x + 1, y - 2, 1, 2, '#ffe79b');
      G.rect(ctx, x - 1, y + 1, 2, 1, '#e872b5');
      G.rect(ctx, x + 3, y - 3 + Math.sin(time * 5 + c.phase) * 1.5, 1, 1, '#ffd1a0');
    } else if (c.kind === 'gem') {
      ctx.globalAlpha = 0.18;
      G.ellipse(ctx, x, y, 10, 10, p.foam);
      ctx.globalAlpha = 1;
      G.poly(ctx, [[x, y - 8], [x + 7, y - 1], [x, y + 8], [x - 7, y - 1]], '#2c8eae');
      G.poly(ctx, [[x, y - 6], [x + 4, y - 1], [x, y + 5], [x - 4, y - 1]], '#a8ecdc');
      G.poly(ctx, [[x - 2, y - 4], [x, y - 6], [x + 2, y - 3], [x, y - 1]], p.goldLight);
      G.rect(ctx, x + 1, y + 2, 2, 2, p.foam);
      G.rect(ctx, x - 4, y - 2, 1, 1, '#fff5c7');
    } else {
      ctx.globalAlpha = 0.16;
      G.ellipse(ctx, x, y, 8, 8, p.gold);
      ctx.globalAlpha = 1;
      G.rect(ctx, x - 4, y - 5, 8, 10, '#8a5c2c');
      G.rect(ctx, x - 5, y - 4, 10, 8, p.gold);
      G.rect(ctx, x - 3, y - 4, 6, 1, p.goldLight);
      G.rect(ctx, x - 3, y + 4, 6, 1, '#a8732d');
      G.rect(ctx, x - 1, y - 6, 2, 2, p.goldLight);
      if (c.phase % 1 > 0.5) G.rect(ctx, x + 1, y - 2, 2, 2, p.goldLight);
      G.rect(ctx, x - 1, y + 1, 2, 2, '#d69538');
    }
  }

  function drawGate(ctx, level, cam, time) {
    const g = level.gate;
    if (!g) return;
    const x = px(g.x - cam.x);
    const y = px(g.y - cam.y);
    if (x < -100 || x > VW + 100) return;
    const p = P[level.theme] || P.castle;
    const pulse = 0.5 + Math.sin(time * 2.5) * 0.5;
    ctx.globalAlpha = 0.2 + pulse * 0.15;
    G.ellipse(ctx, x, y - 24, 28, 36, p.gold);
    ctx.globalAlpha = 1;
    G.rect(ctx, x - 17, y - 46, 5, 46, p.stoneDark);
    G.rect(ctx, x + 12, y - 46, 5, 46, p.stoneDark);
    G.rect(ctx, x - 14, y - 46, 28, 3, p.stone);
    G.rect(ctx, x - 11, y - 43, 22, 3, p.stoneLight);
    G.rect(ctx, x - 11, y - 6, 22, 6, p.stoneDark);
    G.rect(ctx, x - 11, y - 30, 22, 3, p.stone);
    G.rect(ctx, x - 2, y - 42, 4, 36, G.alpha(p.gold, 0.75));
    G.rect(ctx, x - 9, y - 25, 18, 2, p.gold);
    G.rect(ctx, x - 7, y - 22, 14, 2, p.goldLight);
    G.poly(ctx, [[x, y - 56], [x + 12, y - 48], [x + 4, y - 44], [x, y - 50], [x - 4, y - 44], [x - 12, y - 48]], p.goldLight);
    G.rect(ctx, x - 1, y - 55, 2, 10, p.rose);
    G.rect(ctx, x - 10, y - 12, 3, 3, p.goldLight);
    G.rect(ctx, x + 7, y - 12, 3, 3, p.goldLight);
  }

  function drawCheckpoint(ctx, level, cp, cam, time) {
    const p = P[level.theme] || P.castle;
    const x = px(cp.x - cam.x);
    const y = px(cp.y - cam.y);
    if (x < -40 || x > VW + 40) return;
    G.rect(ctx, x - 1, y - 31, 3, 31, p.stoneDark);
    if (cp.active) {
      ctx.globalAlpha = 0.25 + Math.sin(time * 4) * 0.08;
      G.ellipse(ctx, x + 4, y - 28, 15, 13, p.gold);
      ctx.globalAlpha = 1;
    }
    const wave = Math.sin(time * 4 + cp.x) * 2;
    G.poly(ctx, [[x + 2, y - 30], [x + 18 + wave, y - 27], [x + 18 + wave, y - 17], [x + 2, y - 20]], cp.active ? p.gold : p.stoneLight);
    G.rect(ctx, x + 6, y - 26, 3, 3, cp.active ? p.rose : p.stoneDark);
    G.rect(ctx, x + 11, y - 25, 3, 3, p.goldLight);
  }

  function drawShrine(ctx, level, s, cam, time) {
    const p = P[level.theme] || P.castle;
    const x = px(s.x - cam.x);
    const y = px(s.y - cam.y);
    if (x < -50 || x > VW + 50) return;
    const lit = !s.used;
    const pulse = 0.5 + Math.sin(time * 3.2 + s.phase) * 0.5;
    ctx.globalAlpha = 0.22;
    G.ellipse(ctx, x, y + 1, 10, 2.5, '#10151c');
    ctx.globalAlpha = 1;
    G.rect(ctx, x - 9, y - 6, 18, 6, p.stoneDark);
    G.rect(ctx, x - 7, y - 9, 14, 4, p.stone);
    G.rect(ctx, x - 8, y - 12, 16, 4, p.stoneLight);
    G.rect(ctx, x - 4, y - 14, 8, 3, p.stone);
    if (lit) {
      ctx.globalAlpha = 0.18 + pulse * 0.14 + (s.ready ? 0.16 : 0);
      G.ellipse(ctx, x, y - 23, s.ready ? 20 : 16, s.ready ? 21 : 17, p.gold);
      ctx.globalAlpha = 1;
      G.rect(ctx, x - 3, y - 17, 6, 3, p.gold);
      G.poly(ctx, [[x - 5, y - 18], [x + 1 + Math.sin(time * 7 + s.phase) * 1.5, y - 31], [x + 6, y - 18]], p.goldLight);
      G.poly(ctx, [[x - 2, y - 18], [x + 1, y - 26], [x + 3, y - 18]], '#fff4c7');
      G.rect(ctx, x - 1, y - 35 + Math.sin(time * 5 + s.phase) * 2, 2, 2, p.goldLight);
      G.rect(ctx, x + 8, y - 21 + Math.cos(time * 4 + s.phase) * 2, 1, 1, p.foam);
      if (s.ready) {
        ctx.globalAlpha = 0.55 + pulse * 0.35;
        G.rect(ctx, x - 12, y - 25 + Math.sin(time * 6 + s.phase) * 3, 1, 2, p.goldLight);
        G.rect(ctx, x + 12, y - 19 + Math.cos(time * 5 + s.phase) * 3, 1, 2, p.goldLight);
        G.rect(ctx, x - 10, y - 38 + Math.cos(time * 4 + s.phase) * 2, 1, 1, '#fff4c7');
        ctx.globalAlpha = 1;
      }
    } else {
      G.rect(ctx, x - 3, y - 16, 6, 2, p.stoneLight);
      G.rect(ctx, x - 2, y - 20 + Math.sin(time * 2 + s.phase) * 1, 1, 4, G.alpha(p.stoneLight, 0.55));
      G.rect(ctx, x + 2, y - 24 + Math.sin(time * 1.7 + s.phase) * 1, 1, 3, G.alpha(p.stoneLight, 0.35));
    }
  }

  function drawWarden(ctx, level, w, cam, time) {
    const p = P[level.theme] || P.castle;
    const bob = Math.sin(time * 3.4 + w.phase) * 2.1;
    const x = px(w.x - cam.x);
    const y = px(w.y - cam.y + bob);
    if (x < -18 || x > VW + 18) {
      const edgeX = x < 0 ? 7 : VW - 7;
      const edgeY = G.clamp(y - 14, 54, VH - 18);
      const dir = x < 0 ? -1 : 1;
      ctx.globalAlpha = 0.45 + Math.sin(time * 6 + w.phase) * 0.16;
      G.poly(ctx, [[edgeX + dir * 5, edgeY], [edgeX - dir * 4, edgeY - 5], [edgeX - dir * 4, edgeY + 5]], '#d34d82');
      G.rect(ctx, edgeX - 3, edgeY - 9, 6, 2, '#f0bd54');
      G.rect(ctx, edgeX - 2, edgeY - 8, 4, 5, '#4a2941');
      ctx.globalAlpha = 1;
      return;
    }
    const facing = w.face || 1;
    ctx.globalAlpha = 0.2 + Math.sin(time * 4 + w.phase) * 0.06;
    G.ellipse(ctx, x, y - 13, 17, 20, '#d34d82');
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) ctx.scale(-1, 1);
    G.poly(ctx, [[-9, -2], [-11, -12], [-7, -23], [-2, -27], [4, -25], [10, -18], [9, -4], [3, 1], [-4, 2]], '#201626');
    G.poly(ctx, [[-6, -4], [-7, -16], [-2, -23], [3, -22], [7, -16], [6, -5], [1, -1], [-2, 0]], '#553348');
    G.poly(ctx, [[-7, -12], [-4, -21], [0, -23], [4, -19], [2, -13], [-2, -10]], p.gold);
    G.rect(ctx, -4, -21, 8, 7, '#f0bd54');
    G.rect(ctx, -3, -20, 6, 4, '#ffe79b');
    G.rect(ctx, -3, -19, 2, 2, '#2a1b2b');
    G.rect(ctx, 1, -19, 2, 2, '#2a1b2b');
    G.rect(ctx, -1, -16, 3, 1, '#8f2e5a');
    G.poly(ctx, [[-6, -23], [-4, -27], [-2, -23], [1, -28], [3, -23], [6, -26], [5, -21], [-5, -21]], '#ffe79b');
    G.rect(ctx, -9, -10, 2, 7, p.goldLight);
    G.rect(ctx, 8, -15, 2, 5, p.goldLight);
    G.rect(ctx, -4, 1, 3, 3, '#8f2e5a');
    G.rect(ctx, 1, 2, 3, 2, '#8f2e5a');
    ctx.restore();
    ctx.globalAlpha = 0.5;
    G.rect(ctx, x - 12, y - 25 + Math.sin(time * 5 + w.phase) * 2, 1, 1, p.goldLight);
    G.rect(ctx, x + 11, y - 9 + Math.cos(time * 4 + w.phase) * 2, 1, 1, '#ffd1a0');
    ctx.globalAlpha = 1;
  }

  function drawEnemy(ctx, level, e, cam, time) {
    if (!e.alive) return;
    const p = P[level.theme] || P.castle;
    const bob = Math.sin(time * 7 + e.phase) * 1.2;
    const x = px(e.x - cam.x);
    const y = px(e.y - cam.y + bob);
    if (x < -30 || x > VW + 30) return;
    ctx.globalAlpha = 0.22;
    G.ellipse(ctx, x + 6, y + 10 - bob, 8, 2, '#10151c');
    ctx.globalAlpha = 1;
    if (e.type === 'beetle') {
      G.rect(ctx, x, y + 1, 13, 8, '#2b2130');
      G.rect(ctx, x + 1, y, 11, 8, p.plum);
      G.rect(ctx, x + 2, y + 1, 9, 5, p.gold);
      G.rect(ctx, x + 4, y + 2, 3, 2, p.goldLight);
      G.rect(ctx, x + 9, y + 2, 2, 2, p.rose);
      G.rect(ctx, x - 2, y + 5, 3, 2, '#2b2130');
      G.rect(ctx, x + 12, y + 5, 3, 2, '#2b2130');
      G.rect(ctx, x + 3, y + 8, 1, 2, '#2b2130');
      G.rect(ctx, x + 9, y + 8, 1, 2, '#2b2130');
      G.rect(ctx, x + 11, y + 3, 1, 2, '#2b2130');
    } else if (e.type === 'slime') {
      G.rect(ctx, x + 1, y + 3, 11, 6, '#2b3e38');
      G.rect(ctx, x, y + 4, 13, 5, p.grassDark);
      G.rect(ctx, x + 1, y + 2, 10, 5, p.grass);
      G.rect(ctx, x + 3, y + 2, 4, 2, p.grassLight);
      G.rect(ctx, x + 3, y + 5, 2, 2, '#20312d');
      G.rect(ctx, x + 8, y + 5, 2, 2, '#20312d');
      G.rect(ctx, x + 10, y + 1, 2, 2, p.rose);
    } else {
      G.rect(ctx, x + 1, y + 2, 11, 7, '#3e2831');
      G.rect(ctx, x + 1, y + 2, 11, 5, p.rose);
      G.rect(ctx, x + 3, y + 1, 7, 3, '#b74c86');
      G.rect(ctx, x + 3, y + 3, 2, 2, '#241c2d');
      G.rect(ctx, x + 8, y + 3, 2, 2, '#241c2d');
      G.rect(ctx, x - 3, y + 3, 4, 3, p.gold);
      G.rect(ctx, x + 12, y + 3, 4, 3, p.gold);
      G.rect(ctx, x + 2, y + 8, 2, 2, '#3e2831');
      G.rect(ctx, x + 9, y + 8, 2, 2, '#3e2831');
    }
  }

  function drawHero(ctx, level, player, cam, time) {
    const p = P[level.theme] || P.castle;
    const x = px(player.x - cam.x);
    const y = px(player.y - cam.y);
    if (x < -30 || x > VW + 30) return;
    const moving = Math.abs(player.vx) > 12;
    const grounded = player.grounded;
    const bob = grounded ? (moving ? Math.sin(time * 18) * 0.8 : Math.sin(time * 3) * 0.5) : 0;
    const swing = moving ? Math.sin(time * 15) : 0;
    const jump = !grounded && player.vy < 0;
    const fall = !grounded && player.vy >= 0;

    ctx.globalAlpha = grounded ? 0.26 : 0.12;
    G.ellipse(ctx, x, y + 1, 8, 2.5, '#0d141b');
    ctx.globalAlpha = 1;

    function r(rx, ry, rw, rh, c) { G.rect(ctx, rx, ry, rw, rh, c); }

    ctx.save();
    ctx.translate(x, Math.round(y + bob));
    if (player.dir < 0) ctx.scale(-1, 1);

    // silhouette
    r(-7, -16, 14, 10, '#241c2d');
    r(-5, -24, 10, 9, '#241c2d');
    r(-5, -9, 4, 8, '#241c2d');
    r(1, -9, 4, 8, '#241c2d');
    r(-7, -5, 5, 5, '#241c2d');
    r(2, -5, 5, 5, '#241c2d');
    r(-8, -14, 3, 6, '#241c2d');
    r(5, -14, 3, 6, '#241c2d');

    // legs and boots
    const lswing = grounded ? swing * 1.5 : 0;
    r(-4 + lswing * 0.4, -9, 3, 5, '#fff1cf');
    r(1 - lswing * 0.4, -9, 3, 5, '#fff1cf');
    r(-5 + lswing, -5, 4, 5, '#5b3d31');
    r(2 - lswing, -5, 4, 5, '#5b3d31');
    r(-4 + lswing, -3, 3, 2, '#8e6246');
    r(3 - lswing, -3, 3, 2, '#8e6246');

    // cloak / tunic
    r(-6, -16, 12, 8, '#2e9dde');
    r(-4, -16, 8, 6, p.cream || '#fff1cf');
    r(-4, -16, 8, 2, '#c6ebf3');
    r(-6, -10, 12, 2, '#217a9f');
    r(-5, -10, 10, 1, p.gold);
    r(-4, -8, 3, 4, '#d8e8da');
    r(1, -8, 3, 4, '#d8e8da');

    // satchel and belt
    r(-7, -12, 4, 5, '#6b4535');
    r(-6, -12, 3, 2, p.gold);
    r(-8, -8, 2, 2, '#f0bd54');

    // arms
    const arm = grounded ? swing * 1.9 : (jump ? -3 : 2);
    r(-8, -14 + arm * 0.2, 2, 6, '#2e9dde');
    r(6, -14 - arm * 0.2, 2, 6, '#2e9dde');
    r(-8, -9 + arm * 0.2, 2, 2, '#f2c79a');
    r(6, -9 - arm * 0.2, 2, 2, '#f2c79a');

    // scarf
    const scarfWave = Math.sin(time * 8) * 1.5 + (moving ? 2 : 0);
    r(-8, -16, 5, 3, '#e872b5');
    r(-11 - scarfWave, -15, 5, 2, '#b74c86');
    r(-13 - scarfWave, -14, 3, 1, '#e872b5');

    // head, hood and face
    r(-4, -23, 8, 8, '#f2c79a');
    r(-5, -24, 10, 4, '#2e9dde');
    r(-4, -25, 8, 2, '#1d6b91');
    r(-3, -24, 6, 1, '#74c8e4');
    r(-3, -20, 5, 4, '#f2c79a');
    r(-2, -20, 1, 2, '#241c2d');
    r(1, -20, 1, 2, '#241c2d');
    r(-1, -17, 2, 1, '#b77861');
    r(2, -18, 2, 1, '#e872b5');
    r(-4, -22, 2, 3, '#5b3c22');
    r(3, -21, 1, 2, '#5b3c22');

    // boots outline highlights
    r(-4 + lswing, -2, 3, 1, '#c58b57');
    r(3 - lswing, -2, 3, 1, '#c58b57');

    // little gold glint
    if (moving) r(7, -13, 1, 1, p.goldLight);
    ctx.restore();
  }

  function drawParticles(ctx, particles, cam) {
    if (!particles) return;
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      if (q.life <= 0) continue;
      const x = px(q.x - cam.x);
      const y = px(q.y - cam.y);
      ctx.globalAlpha = G.clamp(q.life / q.maxLife, 0, 1);
      const s = q.size || 1;
      G.rect(ctx, x, y, s, s, q.color);
    }
    ctx.globalAlpha = 1;
  }

  function ambient(ctx, theme, cam, time) {
    const p = P[theme] || P.castle;
    const n = 34;
    for (let i = 0; i < n; i++) {
      const h = G.hash(i, 4, theme === 'sea' ? 8 : theme === 'forest' ? 12 : 17);
      const h2 = G.hash(i, 9, 5);
      let x = (h * 760 + Math.sin(time * 0.4 + i) * 14 - cam.x * (0.08 + h2 * 0.05)) % 760;
      if (x < 0) x += 760;
      x -= 60;
      const y = 30 + h2 * 250 + Math.sin(time * 0.8 + i * 1.7) * 8;
      let color = p.spark;
      let size = 1;
      let alpha = 0.4;
      if (theme === 'forest') {
        color = i % 3 === 0 ? '#fff1ad' : '#b7f29b';
        alpha = 0.35 + Math.sin(time * 3 + i) * 0.2;
      } else if (theme === 'sea') {
        color = i % 4 === 0 ? p.foam : p.spark;
        alpha = 0.25;
        size = i % 5 === 0 ? 2 : 1;
      } else {
        alpha = 0.22 + Math.sin(time * 2 + i) * 0.12;
      }
      ctx.globalAlpha = Math.max(0, alpha);
      G.rect(ctx, Math.round(x), Math.round(y), size, size, color);
    }
    ctx.globalAlpha = 1;
  }

  function vignette(ctx, title) {
    const g = ctx.createRadialGradient(VW / 2, VH / 2, 120, VW / 2, VH / 2, 380);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.72, 'rgba(7,14,23,0.04)');
    g.addColorStop(1, 'rgba(7,14,23,0.32)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
    ctx.globalAlpha = title ? 0.018 : 0.035;
    for (let y = 0; y < VH; y += 3) G.rect(ctx, 0, y, VW, 1, '#07111c');
    ctx.globalAlpha = 1;
  }

  function drawBackground(ctx, level, cam, time, title) {
    drawSky(ctx, level.theme, cam.x, time, title);
  }

  function drawWorldDecor(ctx, level, cam, time, layer) {
    drawDecor(ctx, level, cam, time, layer);
  }

  function drawTitle(ctx, time, theme, titleLevel) {
    const p = P[theme] || P.castle;
    const cam = { x: 0, y: 0 };
    drawSky(ctx, theme, 0, time, true);

    // Low foreground shapes behind the title cards.
    hillBand(ctx, 620, 294, 12, p.mid, 14);
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 8; i++) {
      const x = ((i * 103 + time * 9) % 760) - 60;
      G.rect(ctx, x, 304 + (i % 3) * 7, 18 + (i % 4) * 7, 1, p.foam);
    }
    ctx.globalAlpha = 1;

    if (theme === 'castle') {
      castleSilhouette(ctx, 548, 302, 0.74, G.alpha(p.mid, 0.8), p.goldLight, time);
      treeSilhouette(ctx, 66, 318, 54, G.alpha(p.mid, 0.8), G.alpha(p.mid2, 0.8));
      G.poly(ctx, [[0, 340], [120, 292], [250, 320], [250, 360], [0, 360]], G.alpha(p.mid, 0.35));
    } else if (theme === 'forest') {
      treeSilhouette(ctx, 94, 342, 92, G.alpha(p.mid, 0.85), G.alpha(p.mid2, 0.85));
      treeSilhouette(ctx, 556, 338, 74, G.alpha(p.mid, 0.8), G.alpha(p.mid2, 0.8));
      G.poly(ctx, [[0, 338], [160, 300], [320, 332], [500, 296], [640, 334], [640, 360], [0, 360]], G.alpha(p.mid, 0.28));
    } else {
      lighthouse(ctx, 566, 302, 0.62, G.alpha(p.mid, 0.85), p.goldLight, time);
      island(ctx, 150, 320, 65, 12, G.alpha(p.mid, 0.45), p.foam);
      G.rect(ctx, 44, 326, 30, 3, G.alpha(p.mid, 0.7));
      G.rect(ctx, 50, 320, 16, 6, G.alpha(p.mid, 0.65));
      G.rect(ctx, 54, 314, 7, 6, G.alpha(p.mid, 0.55));
    }

    // Floating coins and a hero silhouette at the very bottom edge.
    const fake = { vx: 0, vy: 0, grounded: true, dir: 1, x: 0, y: 0 };
    fake.x = 84; fake.y = 344;
    drawHero(ctx, { theme: theme }, fake, cam, time);
    for (let i = 0; i < 4; i++) {
      const c = { x: 152 + i * 34 + Math.sin(time * 0.7 + i) * 6, y: 314 - i * 13 + Math.cos(time * 1.1 + i) * 4, phase: i * 2, kind: 'gold' };
      drawCoin(ctx, { theme: theme }, c, cam, time);
    }
    ambient(ctx, theme, cam, time);
    vignette(ctx, true);
  }

  function curseOverlay(ctx, curse, time) {
    if (!curse) return;
    const pulse = 0.5 + Math.sin(time * 2.8) * 0.5;
    const strength = curse / 3;
    const g = ctx.createRadialGradient(VW / 2, VH / 2, 120, VW / 2, VH / 2, 390);
    g.addColorStop(0, 'rgba(80,10,45,0)');
    g.addColorStop(0.7, 'rgba(100,18,66,' + (0.04 + strength * 0.05).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(126,18,74,' + (0.08 + strength * 0.13 + pulse * strength * 0.04).toFixed(3) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawGame(ctx, level, player, cam, time, particles, warden, curse) {
    ctx.imageSmoothingEnabled = false;
    drawBackground(ctx, level, cam, time, false);
    drawWorldDecor(ctx, level, cam, time, 0);
    drawTiles(ctx, level, cam, time);
    drawWorldDecor(ctx, level, cam, time, 1);
    for (let i = 0; i < level.shrines.length; i++) drawShrine(ctx, level, level.shrines[i], cam, time);
    for (let i = 0; i < level.checkpoints.length; i++) drawCheckpoint(ctx, level, level.checkpoints[i], cam, time);
    const gateDraw = level.gate;
    if (gateDraw) drawGate(ctx, level, cam, time);
    for (let i = 0; i < level.coins.length; i++) if (!level.coins[i].collected) drawCoin(ctx, level, level.coins[i], cam, time);
    for (let i = 0; i < level.enemies.length; i++) drawEnemy(ctx, level, level.enemies[i], cam, time);
    if (warden) drawWarden(ctx, level, warden, cam, time);
    drawHero(ctx, level, player, cam, time);
    drawParticles(ctx, particles, cam);
    ambient(ctx, level.theme, cam, time);
    curseOverlay(ctx, curse || 0, time);
    vignette(ctx, false);
  }

  function drawPreview(canvas, level) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    const sx = w / VW;
    const sy = h / VH;
    ctx.save();
    ctx.scale(sx, sy);
    const camX = G.clamp(level.spawn.x - 96, 0, level.w * T - VW);
    const camY = G.clamp(level.spawn.y - 238, 0, level.h * T - VH);
    const cam = { x: Math.round(camX), y: Math.round(camY) };
    drawBackground(ctx, level, cam, 3.2, false);
    drawWorldDecor(ctx, level, cam, 3.2, 0);
    drawTiles(ctx, level, cam, 3.2);
    drawWorldDecor(ctx, level, cam, 3.2, 1);
    if (level.gate) {
      // Preview the first vista, not the finish line.
    }
    for (let i = 0; i < level.coins.length; i++) {
      const c = level.coins[i];
      if (c.x > cam.x - 30 && c.x < cam.x + VW + 30) drawCoin(ctx, level, c, cam, 3.2);
    }
    drawHero(ctx, level, { x: level.spawn.x + 42, y: level.spawn.y, vx: 0, vy: 0, grounded: true, dir: 1 }, cam, 3.2);
    ambient(ctx, level.theme, cam, 3.2);
    vignette(ctx, false);
    ctx.restore();
  }

  G.Renderer = {
    PALETTES: P,
    drawTitle: drawTitle,
    drawGame: drawGame,
    drawPreview: drawPreview
  };
})();
