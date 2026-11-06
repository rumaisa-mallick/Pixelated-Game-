/* Gilded Isles — a tiny WebAudio chiptune engine. */
(function () {
  'use strict';
  const G = window.Gilded;

  const THEMES = {
    castle: { bpm: 146, melody: [64, 67, 71, 74, 71, 67, 64, 62], bass: [40, 40, 45, 45, 43, 43, 38, 38], wave: 'square' },
    forest: { bpm: 122, melody: [67, 71, 74, 79, 77, 74, 71, 69], bass: [43, 43, 50, 50, 48, 48, 45, 45], wave: 'triangle' },
    sea: { bpm: 132, melody: [62, 66, 69, 74, 72, 69, 66, 64], bass: [38, 38, 45, 45, 43, 43, 40, 40], wave: 'sine' }
  };

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  const Audio = {
    ctx: null,
    master: null,
    music: null,
    sfx: null,
    enabled: true,
    theme: null,
    timer: null,
    nextNote: 0,
    step: 0,

    init: function () {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(function () {});
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.8 : 0;
      this.master.connect(this.ctx.destination);

      this.music = this.ctx.createGain();
      this.music.gain.value = 0.14;
      this.music.connect(this.master);

      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.75;
      this.sfx.connect(this.master);
    },

    isEnabled: function () { return this.enabled; },

    setEnabled: function (on) {
      this.enabled = !!on;
      if (this.ctx) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.linearRampToValueAtTime(on ? 0.8 : 0, this.ctx.currentTime + 0.08);
      }
      return this.enabled;
    },

    toggle: function () {
      const on = this.setEnabled(!this.enabled);
      if (on) this.click();
      return on;
    },

    tone: function (freq, dur, type, vol, slide, when, node) {
      if (!this.ctx) return;
      const t = when || this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(Math.max(30, freq), t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol || 0.03), t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(node || this.sfx);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },

    noise: function (dur, vol, cutoff, when) {
      if (!this.ctx) return;
      const t = when || this.ctx.currentTime;
      const frames = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff || 1400, t);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol || 0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfx);
      src.start(t);
    },

    click: function () { this.tone(520, 0.045, 'square', 0.025, 0.8); },
    jump: function () { this.tone(230, 0.13, 'square', 0.04, 2.6); },
    land: function () { this.noise(0.055, 0.025, 700); },
    pickup: function (gem) {
      if (gem) {
        [660, 880, 1320].forEach((f, i) => this.tone(f, 0.1, 'triangle', 0.035, 1.1, this.ctx ? this.ctx.currentTime + i * 0.055 : 0));
      } else {
        this.tone(760, 0.055, 'square', 0.026, 1.45);
        this.tone(1120, 0.06, 'triangle', 0.018, 1.05, this.ctx ? this.ctx.currentTime + 0.035 : 0);
      }
    },
    cursed: function () {
      this.tone(155, 0.16, 'sawtooth', 0.028, 1.55);
      this.tone(233, 0.2, 'triangle', 0.018, 1.2, this.ctx ? this.ctx.currentTime + 0.04 : 0);
    },
    warden: function () {
      this.tone(92, 0.45, 'sawtooth', 0.045, 0.72);
      this.tone(138, 0.34, 'square', 0.02, 0.9, this.ctx ? this.ctx.currentTime + 0.08 : 0);
      this.noise(0.24, 0.026, 520);
    },
    wardenBanish: function () {
      const now = this.ctx ? this.ctx.currentTime : 0;
      [392, 523, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.035, 1.05, now + i * 0.06));
      this.noise(0.2, 0.035, 1800);
    },
    shrine: function () {
      const now = this.ctx ? this.ctx.currentTime : 0;
      [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.032, 1.02, now + i * 0.065));
    },
    stomp: function () {
      this.tone(170, 0.1, 'square', 0.035, 0.5);
      this.noise(0.08, 0.035, 1000);
    },
    hurt: function () {
      this.tone(190, 0.2, 'sawtooth', 0.045, 0.35);
      this.noise(0.12, 0.03, 600);
    },
    splash: function () {
      this.noise(0.22, 0.05, 1800);
      this.tone(260, 0.18, 'sine', 0.025, 0.25);
    },
    checkpoint: function () {
      [523, 659, 784].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.035, 1.0, this.ctx ? this.ctx.currentTime + i * 0.08 : 0));
    },
    gate: function () {
      [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'square', 0.032, 1.02, this.ctx ? this.ctx.currentTime + i * 0.09 : 0));
    },
    complete: function () {
      this.stopMusic();
      const now = this.ctx ? this.ctx.currentTime : 0;
      [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.04, 1.0, now + i * 0.11));
      this.tone(262, 0.5, 'sine', 0.025, 0.5, now + 0.12);
    },
    fail: function () {
      this.stopMusic();
      const now = this.ctx ? this.ctx.currentTime : 0;
      [330, 277, 220, 165].forEach((f, i) => this.tone(f, 0.22, 'square', 0.03, 0.8, now + i * 0.16));
    },

    startMusic: function (theme) {
      this.init();
      if (!this.ctx || !THEMES[theme]) return;
      this.stopMusic();
      this.theme = theme;
      this.step = 0;
      this.nextNote = this.ctx.currentTime + 0.05;
      if (this.music) this.music.gain.setTargetAtTime(0.14, this.ctx.currentTime, 0.15);
      const self = this;
      this.timer = setInterval(function () { self.schedule(); }, 38);
      this.schedule();
    },

    schedule: function () {
      if (!this.ctx || !this.theme) return;
      const theme = THEMES[this.theme];
      const beat = 60 / theme.bpm / 2;
      while (this.nextNote < this.ctx.currentTime + 0.18) {
        const i = this.step % theme.melody.length;
        const melody = midi(theme.melody[i]);
        const bass = midi(theme.bass[i]);
        const t = this.nextNote;
        if (i % 2 === 0) this.tone(melody, beat * 1.35, theme.wave, 0.024, 1.0, t, this.music);
        this.tone(bass, beat * 1.65, 'triangle', 0.022, 1.0, t, this.music);
        if (i % 4 === 0) this.noise(0.025, 0.006, 2200, t);
        if (i === 4) this.tone(melody * 2, beat * 1.2, 'sine', 0.011, 1.0, t, this.music);
        this.nextNote += beat;
        this.step++;
      }
    },

    stopMusic: function () {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      this.theme = null;
      if (this.music && this.ctx) this.music.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    },

    duckMusic: function (on) {
      if (!this.ctx || !this.music) return;
      this.music.gain.setTargetAtTime(on ? 0.035 : 0.14, this.ctx.currentTime, 0.08);
    }
  };

  G.Audio = Audio;
})();
