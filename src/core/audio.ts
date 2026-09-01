type SfxName =
  | 'shoot'
  | 'swing'
  | 'throw'
  | 'aura'
  | 'hit'
  | 'kill'
  | 'hurt'
  | 'levelup'
  | 'chest'
  | 'pickup'
  | 'boon'
  | 'boss'
  | 'tap'
  | 'gameover';

interface SfxSpec {
  type: OscillatorType;
  /** start / end frequency in Hz */
  from: number;
  to: number;
  duration: number;
  gain: number;
  /** optional short noise burst layered on top (impacts, chest breaks) */
  noise?: number;
}

// All sound is synthesised at runtime: no audio files to download, which keeps
// the initial payload tiny — the whole point on a mobile web build.
const SFX: Record<SfxName, SfxSpec> = {
  shoot: { type: 'triangle', from: 760, to: 320, duration: 0.09, gain: 0.16 },
  swing: { type: 'sawtooth', from: 300, to: 120, duration: 0.14, gain: 0.16, noise: 0.1 },
  throw: { type: 'square', from: 200, to: 90, duration: 0.16, gain: 0.15 },
  aura: { type: 'sine', from: 120, to: 90, duration: 0.22, gain: 0.07 },
  hit: { type: 'square', from: 420, to: 220, duration: 0.05, gain: 0.08 },
  kill: { type: 'triangle', from: 260, to: 70, duration: 0.16, gain: 0.14, noise: 0.12 },
  hurt: { type: 'sawtooth', from: 180, to: 60, duration: 0.28, gain: 0.24, noise: 0.18 },
  levelup: { type: 'sine', from: 520, to: 1180, duration: 0.4, gain: 0.2 },
  chest: { type: 'square', from: 180, to: 620, duration: 0.3, gain: 0.2, noise: 0.25 },
  pickup: { type: 'sine', from: 880, to: 1320, duration: 0.07, gain: 0.09 },
  boon: { type: 'sine', from: 400, to: 900, duration: 0.55, gain: 0.22 },
  boss: { type: 'sawtooth', from: 90, to: 40, duration: 0.9, gain: 0.3, noise: 0.3 },
  tap: { type: 'triangle', from: 620, to: 520, duration: 0.05, gain: 0.1 },
  gameover: { type: 'sine', from: 320, to: 70, duration: 1.2, gain: 0.26 },
};

export class AudioBus {
  sfxEnabled = true;
  musicEnabled = true;

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private musicStep = 0;
  /** Rate limit: a survivors game fires hundreds of events a second. */
  private lastPlayed = new Map<SfxName, number>();

  /** Must be called from a user gesture — mobile browsers require it. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
    } catch {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.0;
    this.musicGain.connect(this.master);

    const frames = Math.floor(this.ctx.sampleRate * 0.3);
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    this.noiseBuffer = buffer;
  }

  play(name: SfxName, pitchJitter = 0.06): void {
    if (!this.sfxEnabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const last = this.lastPlayed.get(name) ?? -1;
    if (now - last < 0.035) return;
    this.lastPlayed.set(name, now);

    const spec = SFX[name];
    const jitter = 1 + (Math.random() * 2 - 1) * pitchJitter;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = spec.type;
    osc.frequency.setValueAtTime(spec.from * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, spec.to * jitter), now + spec.duration);
    gain.gain.setValueAtTime(spec.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.duration);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + spec.duration + 0.02);

    if (spec.noise && this.noiseBuffer) {
      const src = this.ctx.createBufferSource();
      const noiseGain = this.ctx.createGain();
      src.buffer = this.noiseBuffer;
      noiseGain.gain.setValueAtTime(spec.noise, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + spec.duration);
      src.connect(noiseGain).connect(this.master);
      src.start(now);
      src.stop(now + spec.duration + 0.02);
    }
  }

  /** A slow modal drone + arpeggio; deliberately sparse so it can loop forever. */
  startMusic(): void {
    if (!this.ctx || !this.musicGain || this.musicTimer !== null) return;
    this.musicGain.gain.setTargetAtTime(this.musicEnabled ? 0.1 : 0, this.ctx.currentTime, 0.6);
    const scale = [0, 3, 5, 7, 10]; // minor pentatonic, safe under any action
    const root = 110;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.musicEnabled) return;
      const now = this.ctx.currentTime;
      const semitone = scale[this.musicStep % scale.length];
      const octave = this.musicStep % 8 < 4 ? 1 : 2;
      this.musicStep++;
      const freq = root * octave * Math.pow(2, semitone / 12);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.5, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
      osc.connect(gain).connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 1.7);
    }, 900);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    }
  }

  setMusicEnabled(on: boolean): void {
    this.musicEnabled = on;
    if (!on) this.stopMusic();
    else this.startMusic();
  }
}

export const audio = new AudioBus();
