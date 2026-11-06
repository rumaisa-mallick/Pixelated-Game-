/* Tiny WebAudio chiptune blips. No external audio files needed. */
(function () {
    'use strict';
    const CQ = (window.CQ = window.CQ || {});
    const STORE_KEY = 'cq_sound';

    let ctx = null;
    let enabled = true;

    try {
        enabled = localStorage.getItem(STORE_KEY) !== 'off';
    } catch (e) {
        enabled = true;
    }

    function init() {
        if (!enabled) return;
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            try {
                ctx = new AC();
            } catch (e) {
                ctx = null;
                return;
            }
        }
        if (ctx.state === 'suspended') {
            ctx.resume().catch(function () {});
        }
    }

    function tone(freq, dur, type, vol, delay, slideTo) {
        if (!enabled || !ctx) return;
        const t0 = ctx.currentTime + (delay || 0);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, t0);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
        }

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol || 0.04, t0 + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.03);
    }

    function click() {
        tone(520, 0.045, 'square', 0.025, 0);
    }

    function pickup(kind) {
        if (kind === 'gem') {
            tone(784, 0.07, 'square', 0.03, 0);
            tone(1046, 0.07, 'square', 0.03, 0.055);
            tone(1568, 0.12, 'square', 0.028, 0.11);
        } else {
            tone(880, 0.055, 'square', 0.032, 0);
            tone(1320, 0.08, 'square', 0.026, 0.045);
        }
    }

    function complete() {
        const notes = [523, 659, 784, 1046, 1318];
        notes.forEach(function (n, i) {
            tone(n, 0.16, 'triangle', 0.05, i * 0.11);
        });
        tone(1568, 0.4, 'triangle', 0.04, 0.55);
    }

    function pause(isPaused) {
        tone(isPaused ? 392 : 523, 0.09, 'triangle', 0.035, 0, isPaused ? 294 : 784);
    }

    function toggle() {
        enabled = !enabled;
        try {
            localStorage.setItem(STORE_KEY, enabled ? 'on' : 'off');
        } catch (e) {
            /* ignore */
        }
        if (enabled) {
            init();
            click();
        }
        return enabled;
    }

    CQ.Audio = {
        init: init,
        click: click,
        pickup: pickup,
        complete: complete,
        pause: pause,
        toggle: toggle,
        isEnabled: function () { return enabled; }
    };
})();
