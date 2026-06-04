export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  resume() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  play(name) {
    if (!this.enabled || !this.ctx) return;
    try {
      switch (name) {
        case 'shoot':           this._shoot(); break;
        case 'enemyShoot':      this._enemyShoot(); break;
        case 'explosion':       this._explosion(0.4, 800); break;
        case 'explosionLarge':  this._explosion(0.8, 400); break;
        case 'itemPickup':      this._itemPickup(); break;
        case 'bossAlarm':       this._bossAlarm(); break;
        case 'bossHit':         this._bossHit(); break;
        case 'phaseTransition': this._phaseTransition(); break;
        case 'gameOver':        this._gameOver(); break;
        case 'stageClear':      this._stageClear(); break;
      }
    } catch (_) {}
  }

  _now() { return this.ctx.currentTime; }

  _shoot() {
    const t = this._now();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.08);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.start(t); osc.stop(t + 0.08);
  }

  _enemyShoot() {
    const t = this._now();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.1);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t); osc.stop(t + 0.1);
  }

  _explosion(duration, cutoff) {
    const t = this._now();
    const bufSize = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    filter.type = 'lowpass'; filter.frequency.value = cutoff;
    src.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.start(t); src.stop(t + duration);
  }

  _itemPickup() {
    const t = this._now();
    const notes = [523, 784];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.type = 'square'; osc.frequency.value = freq;
      const st = t + i * 0.08;
      gain.gain.setValueAtTime(0.1, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.08);
      osc.start(st); osc.stop(st + 0.08);
    });
  }

  _bossAlarm() {
    const t = this._now();
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();
    lfo.connect(lfoGain); lfoGain.connect(gain.gain);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'triangle'; osc.frequency.value = 55;
    lfo.type = 'sine'; lfo.frequency.value = 4;
    lfoGain.gain.value = 0.15;
    gain.gain.value = 0.15;
    lfo.start(t); osc.start(t); lfo.stop(t + 1.0); osc.stop(t + 1.0);
  }

  _bossHit() {
    const t = this._now();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t); osc.stop(t + 0.05);
  }

  _phaseTransition() {
    const t = this._now();
    [262, 330, 392, 523].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.type = 'square'; osc.frequency.value = freq;
      const st = t + i * 0.1;
      gain.gain.setValueAtTime(0.1, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.1);
      osc.start(st); osc.stop(st + 0.1);
    });
  }

  _gameOver() {
    const t = this._now();
    [523, 392, 330, 262].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.type = 'triangle'; osc.frequency.value = freq;
      const st = t + i * 0.2;
      gain.gain.setValueAtTime(0.12, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
      osc.start(st); osc.stop(st + 0.2);
    });
  }

  _stageClear() {
    const t = this._now();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.type = 'square'; osc.frequency.value = freq;
      const st = t + i * 0.12;
      gain.gain.setValueAtTime(0.12, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.15);
      osc.start(st); osc.stop(st + 0.15);
    });
  }
}
