/* Gilded Isles — tiny helpers, deterministic RNG and save storage. */
(function () {
  'use strict';
  const G = (window.Gilded = window.Gilded || {});

  G.TILE = 16;
  G.VIEW_W = 640;
  G.VIEW_H = 360;

  G.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  G.lerp = function (a, b, t) { return a + (b - a) * t; };
  G.approach = function (v, target, delta) {
    if (v < target) return Math.min(v + delta, target);
    return Math.max(v - delta, target);
  };
  G.smooth = function (t) { return t * t * (3 - 2 * t); };
  G.aabb = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };
  G.fmtTime = function (seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  G.pad = function (n, width) {
    let out = String(Math.max(0, Math.floor(n)));
    while (out.length < width) out = '0' + out;
    return out;
  };
  G.choose = function (rng, arr) { return arr[Math.floor(rng() * arr.length)]; };

  G.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  G.hash = function (x, y, seed) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  G.rect = function (ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  G.ellipse = function (ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
    ctx.fill();
  };

  G.poly = function (ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fill();
  };

  G.alpha = function (hex, alpha) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(function (c) { return c + c; }).join('') : h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  };

  G.Store = {
    key: 'gilded-isles-save-v1',
    load: function () {
      const fallback = { bests: {}, totalCoins: 0, muted: false, cleared: {}, medals: {} };
      try {
        const raw = localStorage.getItem(this.key);
        if (!raw) return fallback;
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return fallback;
        return {
          bests: data.bests && typeof data.bests === 'object' ? data.bests : {},
          totalCoins: Number(data.totalCoins) || 0,
          muted: !!data.muted,
          cleared: data.cleared && typeof data.cleared === 'object' ? data.cleared : {},
          medals: data.medals && typeof data.medals === 'object' ? data.medals : {}
        };
      } catch (e) {
        return fallback;
      }
    },
    save: function (data) {
      try { localStorage.setItem(this.key, JSON.stringify(data)); } catch (e) { /* private mode */ }
    }
  };

  G.isTouch = function () {
    return (navigator.maxTouchPoints || 0) > 0 && window.matchMedia('(pointer: coarse)').matches;
  };

  G.escapeHtml = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
})();
