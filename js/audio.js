export const audio = {
  ctx: null,
  musicOn: false,
  sfxOn: false,
  master: null,
  padGain: null,
  oscA: null,
  oscB: null,
  started: false,

  init({ music, sfx }) {
    this.musicOn = !!music;
    this.sfxOn = !!sfx;
  },

  unlock() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      if (!this.master) {
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
      }
      this.ensureMusic();
    } catch {
      /* autoplay / context errors must never block the game */
    }
  },

  setMusic(on) {
    this.musicOn = on;
    this.ensureMusic();
  },

  setSfx(on) {
    this.sfxOn = on;
  },

  ensureMusic() {
    try {
      if (!this.ctx || !this.master) return;
      if (!this.padGain) {
        this.padGain = this.ctx.createGain();
        this.padGain.gain.value = 0;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 420;
        this.oscA = this.ctx.createOscillator();
        this.oscB = this.ctx.createOscillator();
        this.oscA.type = "sine";
        this.oscB.type = "sine";
        this.oscA.frequency.value = 110;
        this.oscB.frequency.value = 164.81;
        this.oscA.connect(filter);
        this.oscB.connect(filter);
        filter.connect(this.padGain);
        this.padGain.connect(this.master);
        this.oscA.start();
        this.oscB.start();
        this.started = true;
      }
      const now = this.ctx.currentTime;
      this.padGain.gain.cancelScheduledValues(now);
      this.padGain.gain.linearRampToValueAtTime(this.musicOn ? 0.045 : 0, now + 0.25);
    } catch {
      /* ignore audio setup failures */
    }
  },

  beep(freq, dur, type, gain) {
    if (!this.sfxOn || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  },

  flap() {
    this.beep(620, 0.08, "triangle", 0.07);
    this.beep(880, 0.05, "sine", 0.04);
  },

  land() {
    this.beep(140, 0.1, "sine", 0.08);
  },

  die() {
    if (!this.sfxOn || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(240, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.28);
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 0.32);
  },

  win() {
    this.beep(392, 0.12, "sine", 0.06);
    setTimeout(() => this.beep(523, 0.16, "sine", 0.06), 90);
  },
};
