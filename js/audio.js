// ---------------------------------------------------------------------------
// Procedural Web Audio: chiptune SFX + the movement-gated walking melody.
// The melody is an original bouncy 8-bit line (not the Namco composition) that
// plays ONLY while the player is walking, like the arcade original.
// ---------------------------------------------------------------------------

// original 16-step melody (square lead) with a triangle bass on even steps
const MELODY = [523, 587, 659, 784, 659, 587, 523, 440, 494, 523, 587, 523, 440, 392, 440, 494];
const BASS   = [131, 0, 165, 0, 196, 0, 165, 0, 147, 0, 131, 0, 110, 0, 123, 0];
const STEP = 0.125; // seconds per melody step

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.walking = false;
    this.noteIx = 0;
    this.nextNote = 0;
  }

  ensure() { // must be called from a user gesture
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.4;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.4;
    return this.muted;
  }

  tone(freq, dur, type = 'square', vol = 0.18, when = 0, slideTo = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  noise(dur, vol = 0.2, when = 0, low = false) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + when;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    let node = src;
    if (low) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 400;
      src.connect(f); node = f;
    }
    node.connect(g); g.connect(this.master);
    src.start(t);
  }

  setWalking(w) { this.walking = w; }

  // melody scheduler with a small lookahead; called every frame
  update() {
    if (!this.ctx || this.muted || !this.walking) return;
    const t = this.ctx.currentTime;
    if (this.nextNote < t) this.nextNote = t;
    while (this.nextNote < t + 0.15) {
      const f = MELODY[this.noteIx];
      this.tone(f, STEP * 0.9, 'square', 0.10, this.nextNote - t);
      const b = BASS[this.noteIx];
      if (b) this.tone(b, STEP * 1.6, 'triangle', 0.14, this.nextNote - t);
      this.noteIx = (this.noteIx + 1) % MELODY.length;
      this.nextNote += STEP;
    }
  }

  // --- SFX -----------------------------------------------------------------
  sfxDig()        { this.tone(this._digAlt ? 620 : 500, 0.05, 'square', 0.12); this._digAlt = !this._digAlt; }
  sfxShot()       { this.tone(900, 0.12, 'sawtooth', 0.15, 0, 200); }
  sfxPump(stage)  { this.tone(260 + stage * 130, 0.14, 'square', 0.2); this.tone(260 + stage * 130, 0.1, 'square', 0.12, 0.05); }
  sfxPop()        { this.noise(0.25, 0.3); this.tone(700, 0.3, 'square', 0.2, 0, 80); }
  sfxWobble()     { this.tone(140, 0.15, 'triangle', 0.25, 0, 110); this.tone(140, 0.15, 'triangle', 0.25, 0.18, 110); this.tone(140, 0.15, 'triangle', 0.25, 0.36, 110); }
  sfxCrush()      { this.noise(0.35, 0.35, 0, true); this.tone(90, 0.3, 'square', 0.25, 0, 40); }
  sfxFire()       { this.noise(0.5, 0.22, 0.5); this.tone(300, 0.5, 'sawtooth', 0.12, 0.5, 90); }
  sfxFruit()      { this.tone(880, 0.1, 'square', 0.2); this.tone(1175, 0.18, 'square', 0.2, 0.1); }
  sfxExtend()     { [660, 880, 1100, 1320].forEach((f, i) => this.tone(f, 0.1, 'square', 0.2, i * 0.08)); }
  sfxDeath()      { [600, 500, 400, 300, 200, 130].forEach((f, i) => this.tone(f, 0.16, 'square', 0.2, i * 0.13)); }
  sfxClear()      { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'square', 0.18, i * 0.11)); }
  sfxStart()      { [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.12, 'square', 0.18, i * 0.1)); }
}
