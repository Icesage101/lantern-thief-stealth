// All sound in Lantern Thief is synthesized live with WebAudio — no audio
// files, no network. Footsteps tick as the thief and the guards walk;
// a rising sting marks the alarm, a chime marks loot, a fanfare the win.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this._stepTimer = 0;
  }

  // Browsers need a user gesture before audio starts; call on first input.
  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise(dur, vol, when = 0, lowpass = 1200) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t0);
  }

  // A soft footstep; `sneak` makes it barely audible, `near` guards are louder.
  step(sneak, vol = 1) {
    this._noise(0.07, (sneak ? 0.03 : 0.10) * vol, 0, sneak ? 500 : 900);
  }

  // A guard's heavy boot, volume scaled by how close the guard is.
  guardStep(distanceTiles) {
    const vol = Math.max(0, 1 - distanceTiles / 9);
    if (vol <= 0.02) return;
    this._noise(0.09, 0.16 * vol, 0, 420);
  }

  pickup() {
    this._tone(880, 0.12, 'sine', 0.16);
    this._tone(1318, 0.18, 'sine', 0.14, 0.07);
  }

  lantern() {
    [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.22, 'triangle', 0.14, i * 0.09));
  }

  suspicious() {
    this._tone(330, 0.16, 'square', 0.07, 0, 392);
  }

  alarm() {
    this._tone(220, 0.5, 'sawtooth', 0.12, 0, 440);
    this._tone(233, 0.5, 'sawtooth', 0.10, 0.12, 466);
  }

  caught() {
    this._tone(196, 0.35, 'sawtooth', 0.14, 0, 98);
    this._tone(147, 0.5, 'sawtooth', 0.14, 0.18, 73);
  }

  levelClear() {
    [392, 523, 659, 784].forEach((f, i) => this._tone(f, 0.25, 'triangle', 0.15, i * 0.11));
  }

  gameWin() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this._tone(f, 0.3, 'triangle', 0.15, i * 0.13));
  }
}
