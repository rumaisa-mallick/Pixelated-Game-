/* Tiny deterministic RNG so every realm looks the same on every visit. */
(function () {
    'use strict';
    const CQ = (window.CQ = window.CQ || {});

    function mulberry32(a) {
        return function () {
            a |= 0;
            a = (a + 0x6d2b79f5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    CQ.rand = function (seed) {
        const next = mulberry32(seed);
        return {
            next: next,
            int: function (min, max) {
                return min + Math.floor(next() * (max - min + 1));
            },
            pick: function (arr) {
                return arr[Math.floor(next() * arr.length)];
            },
            chance: function (p) {
                return next() < p;
            }
        };
    };
})();
