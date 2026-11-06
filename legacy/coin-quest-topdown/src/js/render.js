/* Procedural pixel-art renderer for the three realms. */
(function () {
    'use strict';
    const CQ = (window.CQ = window.CQ || {});
    const T = 16;

    /* ---------------- pixel helpers ---------------- */

    function fill(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    function blob(ctx, cx, cy, rows, color) {
        ctx.fillStyle = color;
        for (let i = 0; i < rows.length; i++) {
            const w = rows[i];
            if (w > 0) {
                ctx.fillRect(Math.round(cx - w / 2), Math.round(cy) + i, w, 1);
            }
        }
    }

    function hash2(x, y) {
        let h = (x * 374761393 + y * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    function neighbor(map, x, y) {
        if (y < 0 || y >= map.h || x < 0 || x >= map.w) return '';
        return map.g[y][x];
    }

    /* ---------------- castle ---------------- */

    function castleFloor(ctx, x, y, px, py) {
        fill(ctx, px, py, T, T, '#3a3746');
        fill(ctx, px, py, T, 1, '#322f3d');
        fill(ctx, px, py, 1, T, '#322f3d');
        fill(ctx, px, py + 15, T, 1, '#454152');
        fill(ctx, px + 15, py, 1, T, '#454152');

        const h = hash2(x, y);
        if (h < 0.2) {
            fill(ctx, px + 3 + (((h * 40) | 0) % 9), py + 4 + (((h * 90) | 0) % 8), 2, 1, '#454152');
        }
        if (h > 0.9) {
            fill(ctx, px + 5, py + 7, 4, 1, '#302d3a');
            fill(ctx, px + 8, py + 8, 1, 2, '#302d3a');
        }
        if ((x + y) % 2 === 0) {
            ctx.globalAlpha = 0.045;
            fill(ctx, px, py, T, T, '#ffffff');
            ctx.globalAlpha = 1;
        }
    }

    function castleCarpet(ctx, x, y, px, py) {
        fill(ctx, px, py, T, T, '#6f1f2c');
        fill(ctx, px + 1, py + 1, 14, 14, '#862838');
        fill(ctx, px + 1, py + 7, 14, 1, '#7a2331');
        fill(ctx, px + 7, py + 1, 1, 14, '#7a2331');

        fill(ctx, px + 7, py + 5, 2, 1, '#c9a24a');
        fill(ctx, px + 6, py + 6, 4, 1, '#c9a24a');
        fill(ctx, px + 7, py + 7, 2, 1, '#c9a24a');

        fill(ctx, px + 2, py + 2, 1, 1, '#b3873b');
        fill(ctx, px + 13, py + 2, 1, 1, '#b3873b');
        fill(ctx, px + 2, py + 13, 1, 1, '#b3873b');
        fill(ctx, px + 13, py + 13, 1, 1, '#b3873b');

        if (hash2(x, y) > 0.82) {
            fill(ctx, px + 3, py + 10, 2, 1, '#6c1d29');
        }
    }

    function castleWall(ctx, map, x, y, px, py) {
        fill(ctx, px, py, T, T, '#4a4559');

        for (let row = 0; row < 4; row++) {
            const yy = py + row * 4;
            fill(ctx, px, yy, T, 1, '#2a2635');
            fill(ctx, px, yy + 1, T, 1, '#57526a');

            const off = row % 2 === 0 ? 0 : 4;
            fill(ctx, px + off, yy + 1, 1, 3, '#2a2635');
            fill(ctx, px + off + 8, yy + 1, 1, 3, '#2a2635');
        }

        const above = neighbor(map, x, y - 1);
        const below = neighbor(map, x, y + 1);
        const upSolid = above === '#' || above === 't';
        const downSolid = below === '#' || below === 't';

        if (!upSolid) {
            fill(ctx, px, py, T, 2, '#6a6482');
            fill(ctx, px, py + 2, T, 1, '#3b3649');
        }
        if (!downSolid) {
            fill(ctx, px, py + 13, T, 3, '#252132');
        }
        if (!upSolid || !downSolid) {
            fill(ctx, px, py, 2, T, '#302c3e');
            fill(ctx, px + 14, py, 2, T, '#302c3e');
        }

        if (hash2(x, y) > 0.94) {
            fill(ctx, px + 4, py + 6, 2, 1, '#39354a');
        }
    }

    function castlePillar(ctx, px, py) {
        fill(ctx, px + 3, py + 13, 10, 3, '#282433');
        fill(ctx, px + 4, py + 12, 8, 2, '#57526a');
        fill(ctx, px + 4, py + 2, 8, 10, '#3a3648');
        fill(ctx, px + 5, py + 3, 6, 9, '#6a6480');
        fill(ctx, px + 5, py + 3, 2, 9, '#857e9c');
        fill(ctx, px + 10, py + 3, 1, 9, '#4c475f');
        fill(ctx, px + 4, py + 1, 8, 2, '#857e9c');
        fill(ctx, px + 5, py + 1, 6, 1, '#a49cbb');
        fill(ctx, px + 3, py + 11, 10, 1, '#282433');
    }

    /* ---------------- forest ---------------- */

    function forestGrass(ctx, x, y, px, py) {
        fill(ctx, px, py, T, T, '#3c672d');
        const h = hash2(x, y);
        if (h < 0.32) {
            fill(ctx, px + 2 + (((h * 50) | 0) % 10), py + 3 + (((h * 70) | 0) % 10), 2, 2, '#487a35');
        }
        if (h > 0.58) {
            fill(ctx, px + 3 + (((h * 31) | 0) % 9), py + 5 + (((h * 61) | 0) % 7), 1, 3, '#315826');
        }
        if (h > 0.95) {
            fill(ctx, px + 11, py + 2, 1, 1, '#6f9a4a');
        }
    }

    function forestPath(ctx, map, x, y, px, py) {
        fill(ctx, px, py, T, T, '#8a6a44');
        const h = hash2(x, y);

        if (h < 0.4) {
            fill(ctx, px + 2 + (((h * 50) | 0) % 10), py + 3 + (((h * 70) | 0) % 10), 2, 1, '#a5835a');
        }
        if (h > 0.7) {
            fill(ctx, px + 3 + (((h * 21) | 0) % 9), py + 8 + (((h * 31) | 0) % 5), 1, 1, '#6c5235');
        }

        const above = neighbor(map, x, y - 1);
        const below = neighbor(map, x, y + 1);
        const left = neighbor(map, x - 1, y);
        const right = neighbor(map, x + 1, y);

        if (above && above !== 'p') fill(ctx, px + (h < 0.5 ? 1 : 9), py, 3, 1, '#4f7a37');
        if (below && below !== 'p') fill(ctx, px + (h < 0.5 ? 6 : 12), py + 15, 3, 1, '#4f7a37');
        if (left && left !== 'p') fill(ctx, px, py + (h < 0.5 ? 2 : 10), 1, 3, '#4f7a37');
        if (right && right !== 'p') fill(ctx, px + 15, py + (h < 0.5 ? 7 : 12), 1, 3, '#4f7a37');
    }

    function forestTree(ctx, x, y, px, py) {
        const h = hash2(x + 3, y + 11);

        fill(ctx, px + 7, py + 9, 3, 7, '#3c2a1b');
        fill(ctx, px + 8, py + 9, 1, 6, '#5a3f28');
        fill(ctx, px + 6, py + 14, 5, 2, '#2c1e13');

        blob(ctx, px + 8, py - 2, [4, 8, 12, 14, 16, 16, 14, 12, 8, 4], '#1f3a16');
        blob(ctx, px + 8, py, [2, 6, 10, 12, 14, 12, 10, 6], '#315826');
        blob(ctx, px + 7, py + 1, [2, 4, 8, 10, 8, 6, 2], '#447a34');

        fill(ctx, px + 4, py + 1, 2, 2, '#5a9444');
        fill(ctx, px + 9, py + 3, 2, 1, '#5a9444');
        fill(ctx, px + 7, py + 6, 1, 2, '#2a4a1d');

        if (h < 0.28) {
            fill(ctx, px + 4, py + 4, 1, 1, '#c94a4a');
            fill(ctx, px + 11, py + 5, 1, 1, '#c94a4a');
        }
    }

    function forestBush(ctx, x, y, px, py) {
        const h = hash2(x + 7, y + 5);
        blob(ctx, px + 8, py + 7, [4, 8, 12, 12, 10, 6], '#24451c');
        blob(ctx, px + 8, py + 8, [2, 6, 10, 8, 4], '#35632a');
        fill(ctx, px + 5, py + 8, 2, 1, '#4f823a');
        if (h < 0.4) {
            fill(ctx, px + 4, py + 10, 1, 1, '#c95555');
            fill(ctx, px + 10, py + 9, 1, 1, '#c95555');
        }
    }

    function forestRock(ctx, x, y, px, py) {
        const h = hash2(x + 13, y + 2);
        blob(ctx, px + 8, py + 7, [6, 10, 12, 12, 10, 6], '#45434d');
        blob(ctx, px + 7, py + 8, [4, 7, 8, 6], '#5c5a66');
        fill(ctx, px + 5, py + 8, 2, 1, '#7a7884');
        if (h < 0.5) fill(ctx, px + 10, py + 7, 2, 1, '#6a6874');
        fill(ctx, px + 4, py + 13, 8, 1, '#315826');
    }

    function forestTallGrass(ctx, x, y, px, py) {
        const h = hash2(x, y);
        const base = '#4c7d38';
        const dark = '#2e5222';
        fill(ctx, px + 3, py + 8 - (((h * 5) | 0) % 3), 1, 6, base);
        fill(ctx, px + 6, py + 6 + (((h * 7) | 0) % 2), 1, 8, dark);
        fill(ctx, px + 9, py + 7, 1, 7, base);
        fill(ctx, px + 12, py + 9 - (((h * 9) | 0) % 2), 1, 5, dark);
        if (h > 0.5) fill(ctx, px + 7, py + 5, 1, 2, '#5f9445');
    }

    function forestFlower(ctx, x, y, px, py) {
        const h = hash2(x + 5, y + 9);
        const petal = h < 0.33 ? '#f4f1d8' : h < 0.66 ? '#eeb2d2' : '#f2d06a';
        fill(ctx, px + 7, py + 8, 1, 6, '#3f6f30');
        fill(ctx, px + 5, py + 10, 2, 1, '#4f8238');
        fill(ctx, px + 7, py + 5, 3, 3, petal);
        fill(ctx, px + 6, py + 6, 5, 1, petal);
        fill(ctx, px + 8, py + 6, 1, 1, '#c9973a');
        fill(ctx, px + 12, py + 12, 1, 2, '#4f8238');
    }

    function forestWater(ctx, x, y, px, py) {
        fill(ctx, px, py, T, T, '#2b5f80');
        const h = hash2(x, y);
        fill(ctx, px + 2 + (((h * 30) | 0) % 9), py + 4 + (((h * 50) | 0) % 8), 4, 1, '#3a769b');
        fill(ctx, px + 4 + (((h * 70) | 0) % 8), py + 10, 3, 1, '#214b66');
        if (h > 0.8) fill(ctx, px + 7, py + 2, 2, 1, '#4d8baf');
    }

    /* ---------------- sea ---------------- */

    function seaDeep(ctx, x, y, px, py) {
        fill(ctx, px, py, T, T, '#1b4666');
        const h = hash2(x, y);
        fill(ctx, px + 2 + (((h * 40) | 0) % 10), py + 4 + (((h * 50) | 0) % 9), 4, 1, '#225478');
        if (h > 0.65) fill(ctx, px + 5 + (((h * 30) | 0) % 7), py + 11, 3, 1, '#173b57');
        if (h > 0.93) fill(ctx, px + 9, py + 2, 2, 1, '#2b6286');
    }

    function seaShallow(ctx, map, x, y, px, py) {
        fill(ctx, px, py, T, T, '#3f8fae');
        const h = hash2(x, y);
        fill(ctx, px + 2 + (((h * 30) | 0) % 9), py + 5 + (((h * 40) | 0) % 7), 5, 1, '#54a7c1');
        fill(ctx, px + 4 + (((h * 50) | 0) % 7), py + 11, 3, 1, '#2f7896');

        const above = neighbor(map, x, y - 1);
        const below = neighbor(map, x, y + 1);
        const left = neighbor(map, x - 1, y);
        const right = neighbor(map, x + 1, y);
        if (above === 's' || above === 'S') fill(ctx, px, py, T, 1, '#d8bd83');
        if (below === 's' || below === 'S') fill(ctx, px, py + 15, T, 1, '#d8bd83');
        if (left === 's' || left === 'S') fill(ctx, px, py, 1, T, '#d8bd83');
        if (right === 's' || right === 'S') fill(ctx, px + 15, py, 1, T, '#d8bd83');
    }

    function seaSand(ctx, x, y, px, py) {
        fill(ctx, px, py, T, T, '#e0c68c');
        const h = hash2(x, y);
        if (h < 0.4) {
            fill(ctx, px + 2 + (((h * 50) | 0) % 10), py + 3 + (((h * 70) | 0) % 10), 2, 1, '#d0b477');
        }
        if (h > 0.75) {
            fill(ctx, px + 4 + (((h * 30) | 0) % 8), py + 8 + (((h * 20) | 0) % 5), 1, 1, '#f0dba8');
        }
    }

    function seaShell(ctx, x, y, px, py) {
        fill(ctx, px + 6, py + 8, 4, 3, '#f2b6c6');
        fill(ctx, px + 5, py + 9, 6, 2, '#e89ab0');
        fill(ctx, px + 7, py + 7, 2, 1, '#ffd6e0');
        fill(ctx, px + 7, py + 9, 1, 1, '#c46e88');
        fill(ctx, px + 9, py + 9, 1, 1, '#c46e88');
    }

    function seaRock(ctx, x, y, px, py) {
        const h = hash2(x + 2, y + 8);
        blob(ctx, px + 8, py + 7, [6, 10, 12, 12, 10, 6], '#4a4751');
        blob(ctx, px + 7, py + 8, [4, 7, 8, 6], '#625f6b');
        fill(ctx, px + 5, py + 8, 2, 1, '#807d88');
        if (h > 0.5) fill(ctx, px + 9, py + 10, 2, 1, '#3a3740');
    }

    function seaPalm(ctx, x, y, px, py) {
        fill(ctx, px + 7, py + 7, 3, 8, '#6d4423');
        fill(ctx, px + 8, py + 7, 1, 8, '#8a5c33');
        fill(ctx, px + 6, py + 14, 5, 1, '#5a371c');

        fill(ctx, px + 1, py + 4, 14, 2, '#2c6a36');
        fill(ctx, px + 3, py + 2, 10, 2, '#3a8543');
        fill(ctx, px + 0, py + 6, 7, 2, '#2c6a36');
        fill(ctx, px + 9, py + 6, 7, 2, '#3a8543');
        fill(ctx, px + 3, py + 1, 4, 1, '#58a85c');
        fill(ctx, px + 10, py + 4, 4, 1, '#58a85c');
        fill(ctx, px + 6, py + 7, 2, 2, '#7a4a24');
    }

    function seaBridge(ctx, map, x, y, px, py) {
        const l = neighbor(map, x - 1, y);
        const r = neighbor(map, x + 1, y);
        const u = neighbor(map, x, y - 1);
        const d = neighbor(map, x, y + 1);

        const horizontal = (l === 'B' || r === 'B') && !(u === 'B' && d === 'B');

        fill(ctx, px, py, T, T, '#7a4f27');
        fill(ctx, px, py, T, 1, '#9d6a36');

        if (horizontal) {
            for (let i = 2; i < 16; i += 4) {
                fill(ctx, px + i, py, 1, 16, '#5e3a1c');
            }
            fill(ctx, px, py, 16, 2, '#3b2512');
            fill(ctx, px, py + 14, 16, 2, '#3b2512');
            fill(ctx, px + 3, py + 2, 1, 1, '#c79754');
            fill(ctx, px + 11, py + 13, 1, 1, '#c79754');
        } else {
            for (let i = 2; i < 16; i += 4) {
                fill(ctx, px, py + i, 16, 1, '#5e3a1c');
            }
            fill(ctx, px, py, 2, 16, '#3b2512');
            fill(ctx, px + 14, py, 2, 16, '#3b2512');
            fill(ctx, px + 2, py + 3, 1, 1, '#c79754');
            fill(ctx, px + 13, py + 11, 1, 1, '#c79754');
        }
    }

    /* ---------------- map composition ---------------- */

    function groundFor(theme, ch) {
        if (theme === 'castle') {
            if (ch === '#' || ch === 't') return 'wall';
            if (ch === 'x') return 'floor';
            if (ch === 'c') return 'carpet';
            return 'floor';
        }
        if (theme === 'forest') {
            if (ch === 'w') return 'water';
            if (ch === 'p') return 'path';
            return 'grass';
        }
        if (ch === 'w') return 'deep';
        if (ch === 'W') return 'shallow';
        if (ch === 'B') return 'deep';
        return 'sand';
    }

    function drawGround(ctx, map, x, y, px, py) {
        const ch = map.g[y][x];
        const ground = groundFor(map.theme, ch);

        if (map.theme === 'castle') {
            if (ground === 'wall') {
                castleWall(ctx, map, x, y, px, py);
            } else if (ground === 'carpet') {
                castleCarpet(ctx, x, y, px, py);
            } else {
                castleFloor(ctx, x, y, px, py);
                if (ch === ',') {
                    fill(ctx, px + 4, py + 6, 2, 1, '#575368');
                    fill(ctx, px + 9, py + 10, 1, 1, '#575368');
                    fill(ctx, px + 11, py + 9, 2, 1, '#4b475c');
                }
            }
            return;
        }

        if (map.theme === 'forest') {
            if (ground === 'water') forestWater(ctx, x, y, px, py);
            else if (ground === 'path') forestPath(ctx, map, x, y, px, py);
            else forestGrass(ctx, x, y, px, py);
            return;
        }

        if (ground === 'deep') seaDeep(ctx, x, y, px, py);
        else if (ground === 'shallow') seaShallow(ctx, map, x, y, px, py);
        else seaSand(ctx, x, y, px, py);
    }

    function drawObject(ctx, map, x, y, px, py) {
        const ch = map.g[y][x];

        if (map.theme === 'castle') {
            if (ch === 't') {
                fill(ctx, px + 6, py + 7, 4, 8, '#2a2634');
                fill(ctx, px + 7, py + 8, 2, 7, '#6b4a2a');
                fill(ctx, px + 5, py + 6, 6, 2, '#8a6a2f');
                fill(ctx, px + 6, py + 5, 4, 1, '#b08a3f');
            } else if (ch === 'x') {
                castlePillar(ctx, px, py);
            }
            return;
        }

        if (map.theme === 'forest') {
            if (ch === 'T') forestTree(ctx, x, y, px, py);
            else if (ch === 'b') forestBush(ctx, x, y, px, py);
            else if (ch === 'r') forestRock(ctx, x, y, px, py);
            else if (ch === ',') forestTallGrass(ctx, x, y, px, py);
            else if (ch === '*') forestFlower(ctx, x, y, px, py);
            return;
        }

        if (ch === 'P') seaPalm(ctx, x, y, px, py);
        else if (ch === 'r') seaRock(ctx, x, y, px, py);
        else if (ch === 'S') seaShell(ctx, x, y, px, py);
        else if (ch === 'B') seaBridge(ctx, map, x, y, px, py);
    }

    function buildMapCanvas(map) {
        const cv = document.createElement('canvas');
        cv.width = map.w * T;
        cv.height = map.h * T;
        const c = cv.getContext('2d');
        c.imageSmoothingEnabled = false;

        for (let y = 0; y < map.h; y++) {
            for (let x = 0; x < map.w; x++) {
                drawGround(c, map, x, y, x * T, y * T);
            }
        }
        for (let y = 0; y < map.h; y++) {
            for (let x = 0; x < map.w; x++) {
                drawObject(c, map, x, y, x * T, y * T);
            }
        }
        return cv;
    }

    /* ---------------- animated tile overlays ---------------- */

    function drawTorch(ctx, px, py, time, seed) {
        const flick = Math.round(Math.sin(time * 9 + seed * 13) * 1 + Math.sin(time * 17 + seed * 7) * 0.5);
        const gx = px + 8;
        const gy = py + 3;

        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 18);
        glow.addColorStop(0, 'rgba(255, 170, 60, 0.22)');
        glow.addColorStop(0.5, 'rgba(255, 130, 40, 0.08)');
        glow.addColorStop(1, 'rgba(255, 120, 30, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(gx - 18, gy - 18, 36, 36);

        fill(ctx, px + 6, py + 4 + flick, 4, 4, '#d84a26');
        fill(ctx, px + 7, py + 2 + flick, 2, 4, '#ff9d2e');
        fill(ctx, px + 7, py + 3 + flick, 2, 2, '#ffe27a');
        fill(ctx, px + 8, py + 1 + flick, 1, 2, '#fff2b0');
    }

    function drawAnimatedTiles(ctx, map, camX, camY, vw, vh, time) {
        const x0 = Math.max(0, Math.floor(camX / T) - 1);
        const y0 = Math.max(0, Math.floor(camY / T) - 1);
        const x1 = Math.min(map.w - 1, Math.ceil((camX + vw) / T) + 1);
        const y1 = Math.min(map.h - 1, Math.ceil((camY + vh) / T) + 1);

        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const ch = map.g[y][x];
                const px = x * T - camX;
                const py = y * T - camY;
                const h = hash2(x, y);

                if (map.theme === 'castle' && ch === 't') {
                    drawTorch(ctx, px, py, time, h);
                } else if (map.theme === 'sea' && (ch === 'w' || ch === 'W')) {
                    const phase = time * 1.4 + h * 6.28;
                    const ox = Math.round(Math.sin(phase) * 3);
                    ctx.fillStyle = ch === 'W' ? 'rgba(220, 250, 255, 0.34)' : 'rgba(150, 215, 245, 0.18)';
                    ctx.fillRect(px + 3 + ox, py + 5, 4, 1);
                    ctx.fillRect(px + 9 - ox, py + 11, 3, 1);
                    if (h > 0.8) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
                        ctx.fillRect(px + 6 - ox, py + 8, 2, 1);
                    }
                } else if (map.theme === 'forest' && ch === 'w') {
                    const phase = time * 1.1 + h * 6.28;
                    ctx.fillStyle = 'rgba(150, 215, 230, 0.18)';
                    ctx.fillRect(px + 4 + Math.round(Math.sin(phase) * 2), py + 6, 3, 1);
                }
            }
        }
    }

    /* ---------------- minimap ---------------- */

    function miniColor(ch, theme) {
        if (theme === 'castle') {
            if (ch === '#' || ch === 't') return '#5a506e';
            if (ch === 'x') return '#7d7395';
            if (ch === 'c') return '#7a2632';
            if (ch === ',') return '#464253';
            return '#2f2c3a';
        }
        if (theme === 'forest') {
            if (ch === 'T' || ch === 'b') return '#1e3a15';
            if (ch === 'r') return '#4a4750';
            if (ch === 'w') return '#245a78';
            if (ch === 'p') return '#8a6a44';
            if (ch === '*' || ch === ',') return '#4d7d37';
            return '#3b662c';
        }
        if (ch === 'w') return '#173e5a';
        if (ch === 'W') return '#3a7f9f';
        if (ch === 's' || ch === 'S') return '#d9bd82';
        if (ch === 'B') return '#8a5a2f';
        if (ch === 'P' || ch === 'r') return '#2f6a3a';
        return '#1d4666';
    }

    function buildMinimapBase(map) {
        const scale = 2;
        const cv = document.createElement('canvas');
        cv.width = map.w * scale;
        cv.height = map.h * scale;
        const c = cv.getContext('2d');
        c.imageSmoothingEnabled = false;

        for (let y = 0; y < map.h; y++) {
            for (let x = 0; x < map.w; x++) {
                c.fillStyle = miniColor(map.g[y][x], map.theme);
                c.fillRect(x * scale, y * scale, scale, scale);
            }
        }

        c.fillStyle = 'rgba(0, 0, 0, 0.18)';
        for (let y = 0; y < map.h; y += 4) {
            c.fillRect(0, y * scale, cv.width, 1);
        }

        return cv;
    }

    CQ.Render = {
        TILE: T,
        buildMapCanvas: buildMapCanvas,
        drawAnimatedTiles: drawAnimatedTiles,
        buildMinimapBase: buildMinimapBase,
        miniColor: miniColor,
        drawTorch: drawTorch
    };
})();
