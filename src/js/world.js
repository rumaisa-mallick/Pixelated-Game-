/* Gilded Isles — themed level definitions and seeded level generation. */
(function () {
  'use strict';
  const G = window.Gilded;
  const T = G.TILE;

  G.REALMS = [
    {
      id: 'castle',
      name: 'CROWN KEEP',
      desc: 'Torchlit towers &\na king’s ransom',
      flavor: 'The old keep still glitters.',
      theme: 'castle',
      seed: 0xc0ffee,
      width: 236,
      accent: '#f0bd54'
    },
    {
      id: 'forest',
      name: 'MOSSWOOD',
      desc: 'Firefly paths &\nsunken roots',
      flavor: 'The wood keeps its own ledger.',
      theme: 'forest',
      seed: 0xbadd09,
      width: 244,
      accent: '#9be2c2'
    },
    {
      id: 'sea',
      name: 'TIDEGLASS',
      desc: 'Salt cliffs &\na drowned hoard',
      flavor: 'Every wave leaves a coin.',
      theme: 'sea',
      seed: 0x5ea5ea,
      width: 248,
      accent: '#35abce'
    }
  ];

  G.TILES = { EMPTY: 0, SOLID: 1, WATER: 2, SPIKE: 3, BRIDGE: 4, PLATFORM: 5 };
  const H = 24;
  const BASE_TOP = 18;
  const START_TOP = 18;
  const WATER_TOP = H - 5;

  function idx(x, y, w) { return y * w + x; }

  function setTile(level, x, y, tile) {
    if (x < 0 || x >= level.w || y < 0 || y >= level.h) return;
    level.tiles[idx(x, y, level.w)] = tile;
  }

  function tileAt(level, x, y) {
    if (x < 0 || x >= level.w) return G.TILES.SOLID;
    if (y < 0 || y >= level.h) return G.TILES.EMPTY;
    return level.tiles[idx(x, y, level.w)];
  }

  function fillGround(level, x0, x1, top) {
    for (let x = x0; x < x1; x++) {
      for (let y = top; y < level.h; y++) setTile(level, x, y, G.TILES.SOLID);
    }
  }

  function fillWater(level, x0, x1) {
    for (let x = x0; x < x1; x++) {
      for (let y = WATER_TOP; y < level.h; y++) {
        // A low bridge can occupy the water's top row; keep its planks intact.
        if (tileAt(level, x, y) !== G.TILES.BRIDGE) setTile(level, x, y, G.TILES.WATER);
      }
    }
  }

  function addPlatform(level, x0, x1, top) {
    for (let x = x0; x < x1; x++) setTile(level, x, top, G.TILES.PLATFORM);
  }

  function addBridge(level, x0, x1, top) {
    for (let x = x0; x < x1; x++) setTile(level, x, top, G.TILES.BRIDGE);
    // A darker, broken edge every few planks is purely visual; collision stays solid.
  }

  function addCoin(level, x, y, kind) {
    level.coins.push({
      x: x,
      y: y,
      kind: kind || 'gold',
      value: kind === 'gem' ? 50 : kind === 'cursed' ? 75 : 10,
      phase: (level.coins.length * 2.17) % (Math.PI * 2),
      collected: false
    });
  }

  function groundCoinY(top) { return top * T - 11; }

  function build(levelId) {
    const realm = G.REALMS.find(function (r) { return r.id === levelId; });
    if (!realm) throw new Error('Unknown isle: ' + levelId);

    const rng = G.rng(realm.seed);
    const level = {
      id: realm.id,
      name: realm.name,
      desc: realm.desc,
      flavor: realm.flavor,
      theme: realm.theme,
      accent: realm.accent,
      w: realm.width,
      h: H,
      tiles: new Uint8Array(realm.width * H),
      sections: [],
      gaps: [],
      coins: [],
      enemies: [],
      checkpoints: [],
      shrines: [],
      decor: [],
      gate: null,
      spawn: null,
      totalCoins: 0,
      totalGems: 0,
      totalCursed: 0
    };

    let x = 0;
    let top = START_TOP;
    const startLen = 14;
    fillGround(level, 0, startLen, top);
    level.sections.push({ x0: 0, x1: startLen, top: top, kind: 'start' });
    x = startLen;

    // Build alternating walkable shelves and water-cut gaps. Every shelf is
    // reachable from the previous one; floating platforms only hold bonuses.
    while (x < level.w - 28) {
      const sectionRoll = rng();

      if (sectionRoll < 0.15 && x + 10 < level.w - 20) {
        const len = 6 + Math.floor(rng() * 4);
        addBridge(level, x, x + len, top);
        fillWater(level, x, x + len);
        level.sections.push({ x0: x, x1: x + len, top: top, kind: 'bridge' });
        x += len;
        continue;
      }

      const gapLen = 2 + (rng() < 0.38 ? 1 : 0);
      const gapStart = x;
      fillWater(level, gapStart, gapStart + gapLen);
      level.gaps.push({ x0: gapStart, x1: gapStart + gapLen, prevTop: top, nextTop: top });
      x += gapLen;

      let nextTop = top;
      const heightRoll = rng();
      if (heightRoll < 0.28) nextTop -= 1;
      else if (heightRoll > 0.74) nextTop += 1;
      nextTop = G.clamp(nextTop, 15, 19);
      // A three-tile gap onto a higher shelf is a very tight jump; keep the
      // long gaps for same-height or downhill landings so the route stays fair.
      if (gapLen >= 3 && nextTop < top) nextTop = top;

      let len = 8 + Math.floor(rng() * 9);
      if (x + len > level.w - 20) len = Math.max(5, level.w - 20 - x);
      if (len < 4) break;

      top = nextTop;
      fillGround(level, x, x + len, top);
      const section = {
        x0: x,
        x1: x + len,
        top: top,
        prevTop: level.gaps[level.gaps.length - 1].prevTop,
        kind: rng() < 0.2 ? 'step' : 'ground'
      };
      level.gaps[level.gaps.length - 1].nextTop = top;
      level.sections.push(section);
      x += len;
    }

    // Finish with a generous flat landing for the gate.
    if (level.sections[level.sections.length - 1].x1 < level.w) {
      const last = level.sections[level.sections.length - 1];
      fillGround(level, last.x1, level.w, last.top);
      last.x1 = level.w;
      last.kind = 'end';
      top = last.top;
    } else {
      top = level.sections[level.sections.length - 1].top;
    }

    // Put a few reachable floating ledges above some shelves.
    for (let i = 1; i < level.sections.length - 1; i++) {
      const s = level.sections[i];
      if (s.kind === 'bridge' || s.x1 - s.x0 < 9 || rng() > 0.58) continue;
      const pw = 3 + Math.floor(rng() * 3);
      const px = s.x0 + 2 + Math.floor(rng() * Math.max(1, (s.x1 - s.x0) - pw - 3));
      const py = s.top - 2;
      if (py < 9) continue;
      addPlatform(level, px, px + pw, py);
      s.platform = { x0: px, x1: px + pw, top: py };
    }

    // Coin trails on the main path.
    for (let i = 1; i < level.sections.length - 1; i++) {
      const s = level.sections[i];
      if (s.kind === 'bridge') {
        for (let xc = s.x0 + 1; xc < s.x1; xc += 2) {
          if (rng() < 0.56) addCoin(level, xc * T + T / 2, groundCoinY(s.top));
        }
        continue;
      }
      const step = rng() < 0.35 ? 2 : 3;
      for (let xc = s.x0 + 2; xc < s.x1 - 1; xc += step) {
        if (rng() < 0.7) addCoin(level, xc * T + T / 2, groundCoinY(s.top));
      }
    }

    // Gems sit on the optional ledges, so a 100% haul takes a little nerve.
    let gemCount = 0;
    for (let i = 1; i < level.sections.length - 1 && gemCount < 6; i++) {
      const s = level.sections[i];
      if (!s.platform) continue;
      if (gemCount < 6 && rng() < 0.56) {
        addCoin(level, (s.platform.x0 + s.platform.x1) * T / 2, s.platform.top * T - 20, 'gem');
        s.hasGem = true;
        gemCount++;
      }
    }
    // Guarantee six gems by finding any remaining ledges, then add a final
    // ground-level gem on a distant shelf if the seed was stingy.
    for (let i = 1; i < level.sections.length - 1 && gemCount < 6; i++) {
      const s = level.sections[i];
      if (!s.platform || s.hasGem) continue;
      addCoin(level, (s.platform.x0 + s.platform.x1) * T / 2, s.platform.top * T - 20, 'gem');
      s.hasGem = true;
      gemCount++;
    }
    for (let i = 2; i < level.sections.length - 1 && gemCount < 6; i++) {
      const s = level.sections[i];
      addCoin(level, (s.x0 + s.x1) * T / 2, groundCoinY(s.top), 'gem');
      gemCount++;
    }

    // Bonus coins and platform treats.
    for (let i = 1; i < level.sections.length - 1; i++) {
      const s = level.sections[i];
      if (!s.platform) continue;
      for (let j = 0; j < 3; j++) {
        const px = (s.platform.x0 + 0.5 + j * (s.platform.x1 - s.platform.x0 - 1) / 2) * T;
        addCoin(level, px, s.platform.top * T - 12);
      }
    }

    // Arcs over the water gaps reward a confident jump.
    for (let i = 0; i < level.gaps.length; i++) {
      const gap = level.gaps[i];
      const base = Math.min(gap.prevTop, gap.nextTop);
      for (let j = 0; j < 3; j++) {
        const t = 0.3 + j * 0.2;
        const gx = (gap.x0 + (gap.x1 - gap.x0) * t) * T;
        const gy = base * T - 15 - Math.sin(Math.PI * t) * 20;
        addCoin(level, gx, gy);
      }
    }

    // Checkpoints at roughly a third and two thirds of the route.
    const checkpointTargets = [0.34, 0.67];
    const eligible = level.sections.filter(function (s, i) {
      return i > 0 && i < level.sections.length - 1 && s.kind !== 'bridge' && s.x1 - s.x0 >= 8;
    });
    for (let i = 0; i < checkpointTargets.length; i++) {
      let best = null;
      let bestDist = Infinity;
      for (let j = 0; j < eligible.length; j++) {
        const s = eligible[j];
        const t = ((s.x0 + s.x1) / 2) / level.w;
        const d = Math.abs(t - checkpointTargets[i]);
        if (d < bestDist) { bestDist = d; best = s; }
      }
      if (best) {
        const cpx = (best.x0 + best.x1) * T / 2;
        if (!level.checkpoints.some(function (c) { return Math.abs(c.x - cpx) < 100; })) {
          level.checkpoints.push({ x: cpx, y: best.top * T, active: false, section: best });
        }
      }
    }

    // Shrines are safe little pockets of the old world. They are placed away
    // from checkpoints so cleansing the curse is always a deliberate detour.
    const shrineTargets = [0.2, 0.5, 0.8];
    for (let i = 0; i < shrineTargets.length; i++) {
      let best = null;
      let bestDist = Infinity;
      for (let j = 0; j < eligible.length; j++) {
        const s = eligible[j];
        const cx = (s.x0 + s.x1) * T / 2;
        if (level.checkpoints.some(function (c) { return Math.abs(c.x - cx) < 64; })) continue;
        if (level.shrines.some(function (sh) { return Math.abs(sh.x - cx) < 80; })) continue;
        const t = ((s.x0 + s.x1) / 2) / level.w;
        const d = Math.abs(t - shrineTargets[i]);
        if (d < bestDist) { bestDist = d; best = s; }
      }
      if (best) {
        level.shrines.push({
          x: (best.x0 + best.x1) * T / 2,
          y: best.top * T,
          used: false,
          phase: rng() * 6.28,
          section: best
        });
      }
    }

    // A handful of the ordinary coins are actually cursed gold. They pay far
    // more, but every one adds a notch to the curse meter. Spread them through
    // the route and keep them clear of the shrines so the temptation is real.
    const cursedTargets = [0.13, 0.36, 0.59, 0.82];
    const cursedPicks = [];
    for (let i = 0; i < cursedTargets.length; i++) {
      let best = null;
      let bestDist = Infinity;
      for (let j = 0; j < level.coins.length; j++) {
        const c = level.coins[j];
        if (c.kind !== 'gold' || cursedPicks.indexOf(c) >= 0) continue;
        if (level.shrines.some(function (sh) { return Math.abs(sh.x - c.x) < 30; })) continue;
        const t = c.x / (level.w * T);
        const d = Math.abs(t - cursedTargets[i]);
        if (d < bestDist) { bestDist = d; best = c; }
      }
      if (best) {
        best.kind = 'cursed';
        best.value = 75;
        cursedPicks.push(best);
      }
    }
    level.totalCursed = level.coins.filter(function (c) { return c.kind === 'cursed'; }).length;

    // Spawn near the start; gate on the last solid shelf.
    const startSection = level.sections[0];
    level.spawn = { x: startSection.x0 * T + 3.2 * T, y: startSection.top * T };
    const endSection = level.sections[level.sections.length - 1];
    const gateX = Math.min(level.w - 3.5, endSection.x1 - 4.5) * T;
    level.gate = { x: gateX, y: endSection.top * T, w: 30, h: 48, opened: false };
    level.endSection = endSection;

    // Ground patrols. They walk a known flat stretch, so no level geometry is
    // required for them at runtime.
    const enemySections = level.sections.filter(function (s, i) {
      return i > 1 && i < level.sections.length - 1 && s.kind !== 'bridge' && s.x1 - s.x0 >= 9;
    });
    const enemyCount = 5 + Math.floor(rng() * 3);
    for (let i = 0; i < enemyCount && enemySections.length; i++) {
      const s = enemySections[Math.floor(rng() * enemySections.length)];
      const min = s.x0 * T + 20;
      const max = s.x1 * T - 20;
      if (max - min < 28) continue;
      const ex = min + (max - min) * (0.2 + rng() * 0.6);
      const type = level.theme === 'castle' ? 'beetle' : level.theme === 'forest' ? 'slime' : 'crab';
      level.enemies.push({
        type: type,
        x: ex,
        y: s.top * T - 9,
        w: 13,
        h: 9,
        minX: min,
        maxX: max,
        vx: (rng() < 0.5 ? -1 : 1) * (18 + rng() * 12),
        dir: rng() < 0.5 ? -1 : 1,
        phase: rng() * 6.28,
        alive: true,
        squash: 0
      });
    }

    // A little scenery. The renderer draws these in world space behind the
    // collision tiles, so they never hide the player or a coin.
    for (let i = 0; i < level.sections.length; i++) {
      const s = level.sections[i];
      if (s.kind === 'bridge') continue;
      const y = s.top * T;
      const span = s.x1 - s.x0;
      const back = 1 + Math.floor(rng() * 3);
      for (let j = 0; j < back; j++) {
        const dx = (s.x0 + 0.5 + rng() * Math.max(1, span - 1)) * T;
        let type;
        if (level.theme === 'castle') type = rng() < 0.45 ? 'banner' : rng() < 0.5 ? 'pillar' : 'torch';
        else if (level.theme === 'forest') type = rng() < 0.55 ? 'tree' : rng() < 0.6 ? 'bush' : 'mushroom';
        else type = rng() < 0.5 ? 'palm' : rng() < 0.5 ? 'rock' : 'coral';
        level.decor.push({ type: type, x: dx, y: y, layer: 0, seed: rng(), flip: rng() < 0.5 });
      }
      const front = 1 + Math.floor(rng() * 2);
      for (let j = 0; j < front; j++) {
        const dx = (s.x0 + 0.5 + rng() * Math.max(1, span - 1)) * T;
        level.decor.push({
          type: level.theme === 'castle' ? 'rubble' : level.theme === 'forest' ? 'flower' : 'shell',
          x: dx,
          y: y,
          layer: 1,
          seed: rng(),
          flip: rng() < 0.5
        });
      }
    }

    // A few guiding signs at the start and beside checkpoints.
    level.decor.push({ type: 'sign', x: level.spawn.x + 50, y: startSection.top * T, layer: 1, seed: 1, flip: false });
    for (let i = 0; i < level.checkpoints.length; i++) {
      level.decor.push({ type: 'checkpoint', x: level.checkpoints[i].x, y: level.checkpoints[i].y, layer: 1, seed: i, flip: false });
    }

    level.totalCoins = level.coins.length;
    level.totalGems = level.coins.filter(function (c) { return c.kind === 'gem'; }).length;
    level.spawnY = level.spawn.y;
    return level;
  }

  G.World = {
    build: build,
    tileAt: tileAt,
    isSolid: function (level, x, y) {
      const t = tileAt(level, x, y);
      return t === G.TILES.SOLID || t === G.TILES.BRIDGE;
    },
    isWater: function (level, x, y) { return tileAt(level, x, y) === G.TILES.WATER; },
    isSpike: function (level, x, y) { return tileAt(level, x, y) === G.TILES.SPIKE; },
    isPlatform: function (level, x, y) { return tileAt(level, x, y) === G.TILES.PLATFORM; },
    createAll: function () {
      return G.REALMS.map(function (realm) { return build(realm.id); });
    }
  };
})();
