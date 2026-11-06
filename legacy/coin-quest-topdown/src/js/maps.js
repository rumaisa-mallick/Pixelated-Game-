/* Realm generation: a torchlit castle, a tangled forest and a sunken sea. */
(function () {
    'use strict';
    const CQ = (window.CQ = window.CQ || {});
    const T = 16;
    const W = 60;
    const H = 44;

    const SOLID = {
        castle: new Set(['#', 't', 'x']),
        forest: new Set(['T', 'b', 'r', 'w']),
        sea: new Set(['w', 'r', 'P'])
    };

    const SLOW = {
        castle: new Set(),
        forest: new Set(),
        sea: new Set(['W'])
    };

    const COIN_CHARS = {
        castle: new Set(['.', ',', 'c']),
        forest: new Set(['.', ',', '*', 'p']),
        sea: new Set(['s', 'S', 'W', 'B'])
    };

    const DESIGNS = {
        castle: {
            name: 'CASTLE',
            desc: 'Torchlit halls of gold',
            theme: 'castle',
            seed: 1337,
            preferred: { x: 30, y: 16 },
            build: buildCastle
        },
        forest: {
            name: 'FOREST',
            desc: 'Mossy paths & fireflies',
            theme: 'forest',
            seed: 4242,
            preferred: { x: 30, y: 22 },
            build: buildForest
        },
        sea: {
            name: 'SEA',
            desc: 'Sunken isles & shells',
            theme: 'sea',
            seed: 9001,
            preferred: { x: 10, y: 11 },
            build: buildSea
        }
    };

    /* ---------------- helpers ---------------- */

    function blank(w, h, ch) {
        return Array.from({ length: h }, function () {
            return Array(w).fill(ch);
        });
    }

    function set(g, x, y, ch) {
        if (y >= 0 && y < H && x >= 0 && x < W && g[y][x] !== undefined) {
            g[y][x] = ch;
        }
    }

    function gate(g, x, y, ch) {
        if (y > 0 && y < H - 1 && x > 0 && x < W - 1) {
            g[y][x] = ch;
        }
    }

    function shuffle(arr, rand) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = rand.int(0, i);
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    function isSolidTile(map, x, y) {
        if (x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
        return map.solid.has(map.g[y][x]);
    }

    /* ---------------- castle ---------------- */

    function buildCastle(rand) {
        const g = blank(W, H, '.');

        for (let x = 0; x < W; x++) {
            g[0][x] = '#';
            g[H - 1][x] = '#';
        }
        for (let y = 0; y < H; y++) {
            g[y][0] = '#';
            g[y][W - 1] = '#';
        }

        const vWalls = [12, 24, 36, 48];
        const hWalls = [10, 21, 32];

        for (const x of vWalls) {
            for (let y = 1; y < H - 1; y++) g[y][x] = '#';
        }
        for (const y of hWalls) {
            for (let x = 1; x < W - 1; x++) g[y][x] = '#';
        }

        // Doorways, kept away from wall intersections.
        for (const x of vWalls) {
            const doors = [];
            let guard = 0;
            while (doors.length < 2 && guard++ < 200) {
                const y = rand.int(3, H - 5);
                if (hWalls.some(function (hy) { return Math.abs(hy - y) < 3; })) continue;
                if (doors.some(function (dy) { return Math.abs(dy - y) < 6; })) continue;
                doors.push(y);
            }
            for (const y0 of doors) {
                for (let d = -1; d <= 1; d++) gate(g, x, y0 + d, '.');
            }
        }

        for (const y of hWalls) {
            const doors = [];
            let guard = 0;
            while (doors.length < 3 && guard++ < 300) {
                const x = rand.int(3, W - 5);
                if (vWalls.some(function (vx) { return Math.abs(vx - x) < 3; })) continue;
                if (doors.some(function (dx) { return Math.abs(dx - x) < 7; })) continue;
                doors.push(x);
            }
            for (const x0 of doors) {
                for (let d = -1; d <= 1; d++) gate(g, x0 + d, y, '.');
            }
        }

        // Red carpet in the central halls.
        for (let y = 12; y <= 19; y++) {
            for (let x = 27; x <= 33; x++) {
                if (g[y][x] === '.') g[y][x] = 'c';
            }
        }
        for (let y = 23; y <= 30; y++) {
            for (let x = 27; x <= 33; x++) {
                if (g[y][x] === '.') g[y][x] = 'c';
            }
        }

        // Rubble.
        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                if (g[y][x] === '.' && rand.chance(0.028)) g[y][x] = ',';
            }
        }

        // Stone pillars near room corners.
        const xRooms = [2, 14, 26, 38, 50];
        const yRooms = [2, 12, 23, 34];
        for (const x0 of xRooms) {
            for (const y0 of yRooms) {
                if (!rand.chance(0.62)) continue;
                const spots = [
                    [x0 + 1, y0 + 1],
                    [x0 + 7, y0 + 1],
                    [x0 + 1, y0 + 6],
                    [x0 + 7, y0 + 6]
                ];
                for (const spot of spots) {
                    if (g[spot[1]][spot[0]] === '.') g[spot[1]][spot[0]] = 'x';
                }
            }
        }

        // Wall torches.
        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                if (g[y][x] !== '#') continue;
                const lit = (
                    '.c,'.includes(g[y][x + 1]) || '.c,'.includes(g[y][x - 1]) ||
                    '.c,'.includes(g[y + 1][x]) || '.c,'.includes(g[y - 1][x])
                );
                if (lit && rand.chance(0.07)) g[y][x] = 't';
            }
        }

        return g;
    }

    /* ---------------- forest ---------------- */

    function buildForest(rand) {
        const g = blank(W, H, '.');

        for (let x = 0; x < W; x++) {
            g[0][x] = 'T';
            g[H - 1][x] = 'T';
        }
        for (let y = 0; y < H; y++) {
            g[y][0] = 'T';
            g[y][W - 1] = 'T';
        }

        // Meadow details.
        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                const r = rand.next();
                if (r < 0.055) g[y][x] = '*';
                else if (r < 0.15) g[y][x] = ',';
            }
        }

        // Ponds.
        const ponds = [
            { x: 15, y: 31, rx: 6, ry: 4 },
            { x: 44, y: 11, rx: 5, ry: 3 },
            { x: 49, y: 37, rx: 4, ry: 3 }
        ];
        for (const pond of ponds) {
            for (let dy = -pond.ry; dy <= pond.ry; dy++) {
                for (let dx = -pond.rx; dx <= pond.rx; dx++) {
                    const d = (dx * dx) / (pond.rx * pond.rx) + (dy * dy) / (pond.ry * pond.ry);
                    if (d <= 1 + (rand.next() - 0.5) * 0.22) {
                        gate(g, pond.x + dx, pond.y + dy, 'w');
                    }
                }
            }
        }

        // Tree clusters, leaving the centre reasonably open.
        for (let i = 0; i < 17; i++) {
            const cx = rand.int(4, W - 5);
            const cy = rand.int(4, H - 5);
            if (Math.abs(cx - 30) < 7 && Math.abs(cy - 22) < 7) continue;
            const rx = rand.int(2, 4);
            const ry = rand.int(2, 4);
            for (let dy = -ry; dy <= ry; dy++) {
                for (let dx = -rx; dx <= rx; dx++) {
                    if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) > 1) continue;
                    const x = cx + dx;
                    const y = cy + dy;
                    if (x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1) continue;
                    if (g[y][x] === 'w') continue;
                    g[y][x] = 'T';
                }
            }
        }

        // Bushes and boulders.
        for (let i = 0; i < 24; i++) {
            const x = rand.int(2, W - 3);
            const y = rand.int(2, H - 3);
            if (g[y][x] === '.' || g[y][x] === ',' || g[y][x] === '*') g[y][x] = 'b';
        }
        for (let i = 0; i < 14; i++) {
            const x = rand.int(2, W - 3);
            const y = rand.int(2, H - 3);
            if (g[y][x] === '.' || g[y][x] === ',' || g[y][x] === '*') g[y][x] = 'r';
        }

        // Two winding paths carve the wood into a navigable cross.
        for (let x = 1; x < W - 1; x++) {
            const y = 22 + Math.round(Math.sin(x * 0.22) * 6 + Math.sin(x * 0.07) * 3);
            for (let d = 0; d <= 1; d++) {
                const yy = y + d;
                if (yy <= 0 || yy >= H - 1) continue;
                if (g[yy][x] === 'w') continue;
                g[yy][x] = 'p';
            }
        }
        for (let y = 1; y < H - 1; y++) {
            const x = 30 + Math.round(Math.sin(y * 0.25) * 5 + Math.cos(y * 0.11) * 2);
            for (let d = 0; d <= 1; d++) {
                const xx = x + d;
                if (xx <= 0 || xx >= W - 1) continue;
                if (g[y][xx] === 'w') continue;
                g[y][xx] = 'p';
            }
        }

        // Clear little grassy glades so pickups are not all on the road.
        for (let i = 0; i < 7; i++) {
            const cx = rand.int(5, W - 6);
            const cy = rand.int(5, H - 6);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const x = cx + dx;
                    const y = cy + dy;
                    if (x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1) continue;
                    if (g[y][x] === 'T' || g[y][x] === 'b' || g[y][x] === 'r') g[y][x] = '.';
                }
            }
        }

        return g;
    }

    /* ---------------- sea ---------------- */

    function buildSea(rand) {
        const g = blank(W, H, 'w');

        const defs = [
            { x: 10, y: 11, rx: 6, ry: 4 },
            { x: 29, y: 8, rx: 6, ry: 4 },
            { x: 46, y: 13, rx: 5, ry: 4 },
            { x: 15, y: 32, rx: 6, ry: 5 },
            { x: 38, y: 32, rx: 7, ry: 4 }
        ];

        const islands = defs.map(function (d) {
            return {
                x: d.x + rand.int(-1, 1),
                y: d.y + rand.int(-1, 1),
                rx: d.rx,
                ry: d.ry
            };
        });

        for (const isle of islands) {
            for (let dy = -isle.ry; dy <= isle.ry; dy++) {
                for (let dx = -isle.rx; dx <= isle.rx; dx++) {
                    const d = (dx * dx) / (isle.rx * isle.rx) + (dy * dy) / (isle.ry * isle.ry);
                    if (d <= 1 + (rand.next() - 0.5) * 0.2) {
                        gate(g, isle.x + dx, isle.y + dy, 's');
                    }
                }
            }
        }

        // Shallow water rim.
        const sand = [];
        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                if (g[y][x] === 's') sand.push([x, y]);
            }
        }
        for (const p of sand) {
            const x = p[0];
            const y = p[1];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx <= 0 || ny <= 0 || nx >= W - 1 || ny >= H - 1) continue;
                    if (g[ny][nx] === 'w') g[ny][nx] = 'W';
                }
            }
        }

        // Plank bridges link the isles into one loop.
        const pairs = [[0, 1], [1, 2], [2, 4], [4, 3], [3, 0]];
        function bridge(a, b) {
            const ax = a.x;
            const ay = a.y;
            const bx = b.x;
            const by = b.y;

            for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
                for (let yy = ay; yy <= ay + 1; yy++) {
                    if (g[yy] && (g[yy][x] === 'w' || g[yy][x] === 'W')) g[yy][x] = 'B';
                }
            }
            for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
                for (let xx = bx; xx <= bx + 1; xx++) {
                    if (g[y] && (g[y][xx] === 'w' || g[y][xx] === 'W')) g[y][xx] = 'B';
                }
            }
        }
        for (const pair of pairs) bridge(islands[pair[0]], islands[pair[1]]);

        // Palms, rocks, shells — kept clear of bridge ends.
        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                if (g[y][x] !== 's') continue;

                let nearBridge = false;
                for (let dy = -2; dy <= 2 && !nearBridge; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                        if (g[ny][nx] === 'B') {
                            nearBridge = true;
                            break;
                        }
                    }
                }
                if (nearBridge) continue;

                const nearSpawn = Math.abs(x - islands[0].x) < 4 && Math.abs(y - islands[0].y) < 4;
                if (nearSpawn) continue;

                const r = rand.next();
                if (r < 0.045) g[y][x] = 'P';
                else if (r < 0.07) g[y][x] = 'r';
                else if (r < 0.13) g[y][x] = 'S';
            }
        }

        return g;
    }

    /* ---------------- connectivity + collectibles ---------------- */

    function components(map) {
        const seen = new Set();
        const comps = [];

        for (let y = 0; y < map.h; y++) {
            for (let x = 0; x < map.w; x++) {
                const key = x + ',' + y;
                if (seen.has(key) || isSolidTile(map, x, y)) continue;

                const queue = [[x, y]];
                const tiles = [];
                seen.add(key);

                while (queue.length) {
                    const cur = queue.pop();
                    const cx = cur[0];
                    const cy = cur[1];
                    tiles.push({ x: cx, y: cy });

                    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    for (const d of nb) {
                        const nx = cx + d[0];
                        const ny = cy + d[1];
                        if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
                        const k = nx + ',' + ny;
                        if (seen.has(k) || isSolidTile(map, nx, ny)) continue;
                        seen.add(k);
                        queue.push([nx, ny]);
                    }
                }

                comps.push(tiles);
            }
        }

        comps.sort(function (a, b) { return b.length - a.length; });
        return comps;
    }

    function placeCollectibles(map, rand) {
        const comps = components(map);
        const region = comps.length ? comps[0] : [];

        if (!region.length) {
            map.spawn = { x: W * T / 2, y: H * T / 2 };
            map.coins = [];
            map.totalPoints = 0;
            return;
        }

        const pref = map.preferred;
        let spawnTile = region[0];
        let bestDist = Infinity;
        for (const tile of region) {
            const d = (tile.x - pref.x) * (tile.x - pref.x) + (tile.y - pref.y) * (tile.y - pref.y);
            if (d < bestDist) {
                bestDist = d;
                spawnTile = tile;
            }
        }

        map.spawn = {
            x: spawnTile.x * T + T / 2,
            y: spawnTile.y * T + T / 2
        };

        const allowed = COIN_CHARS[map.theme];
        const candidates = region.filter(function (t) {
            if (!allowed.has(map.g[t.y][t.x])) return false;
            const dx = t.x - spawnTile.x;
            const dy = t.y - spawnTile.y;
            return Math.abs(dx) + Math.abs(dy) > 4;
        });

        shuffle(candidates, rand);

        const chosen = [];
        const spacing = [3, 2, 1];
        const want = 32;

        for (const gap of spacing) {
            for (const tile of candidates) {
                if (chosen.length >= want) break;
                if (chosen.indexOf(tile) !== -1) continue;
                let ok = true;
                for (const other of chosen) {
                    if (Math.abs(other.x - tile.x) < gap && Math.abs(other.y - tile.y) < gap) {
                        ok = false;
                        break;
                    }
                }
                if (ok) chosen.push(tile);
            }
            if (chosen.length >= want) break;
        }

        const coins = chosen.map(function (tile, i) {
            return {
                x: tile.x * T + T / 2,
                y: tile.y * T + T / 2,
                kind: i % 5 === 4 ? 'gem' : 'gold',
                phase: rand.next() * Math.PI * 2
            };
        });

        map.coins = coins;
        map.totalPoints = coins.reduce(function (sum, c) {
            return sum + (c.kind === 'gem' ? 5 : 1);
        }, 0);
    }

    function finalize(key, design) {
        const rand = CQ.rand(design.seed);
        const g = design.build(rand);

        const map = {
            key: key,
            name: design.name,
            desc: design.desc,
            theme: design.theme,
            w: W,
            h: H,
            g: g,
            preferred: design.preferred,
            solid: SOLID[design.theme],
            slow: SLOW[design.theme]
        };

        placeCollectibles(map, rand);
        map.staticCanvas = CQ.Render.buildMapCanvas(map);
        map.minimapBase = CQ.Render.buildMinimapBase(map);

        return map;
    }

    function create(key) {
        return finalize(key, DESIGNS[key]);
    }

    function createAll() {
        const out = {};
        for (const key of Object.keys(DESIGNS)) {
            out[key] = create(key);
        }
        return out;
    }

    function tileAt(map, worldX, worldY) {
        const tx = Math.floor(worldX / T);
        const ty = Math.floor(worldY / T);
        if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return null;
        return { x: tx, y: ty, ch: map.g[ty][tx] };
    }

    function isSolid(map, worldX, worldY) {
        const tile = tileAt(map, worldX, worldY);
        if (!tile) return true;
        return map.solid.has(tile.ch);
    }

    function isSlow(map, worldX, worldY) {
        const tile = tileAt(map, worldX, worldY);
        if (!tile) return false;
        return map.slow.has(tile.ch);
    }

    CQ.Maps = {
        TILE: T,
        WIDTH: W,
        HEIGHT: H,
        create: create,
        createAll: createAll,
        isSolid: isSolid,
        isSlow: isSlow,
        tileAt: tileAt
    };
})();
