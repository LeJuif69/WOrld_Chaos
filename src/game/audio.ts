import { GameSettings } from './types';

type MusicMood = 'menu' | 'jungle' | 'camp' | 'river' | 'cave' | 'ruins' | 'chaos' | 'combat' | 'boss' | 'victory' | 'defeat';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private musicInterval: number | null = null;
  private ambienceNode: AudioNode | null = null;
  private currentMood: MusicMood = 'menu';
  private stepIdx = 0;
  private unlocked = false;

  private volumes = {
    master: 0.75,
    music: 0.55,
    sfx: 0.85,
    ambience: 0.6,
  };

  public unlock(): void {
    if (this.unlocked && this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.ambienceGain = this.ctx.createGain();

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.ambienceGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.applyVolumes();
    this.unlocked = true;
    this.startMusicLoop();
    this.startAmbienceLoop();
  }

  public applySettings(settings: GameSettings): void {
    this.volumes.master = settings.masterVolume;
    this.volumes.music = settings.musicVolume;
    this.volumes.sfx = settings.sfxVolume;
    this.volumes.ambience = settings.ambienceVolume;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain || !this.ambienceGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.volumes.master, t, 0.05);
    this.musicGain.gain.setTargetAtTime(this.volumes.music * 0.35, t, 0.08);
    this.sfxGain.gain.setTargetAtTime(this.volumes.sfx * 0.6, t, 0.05);
    this.ambienceGain.gain.setTargetAtTime(this.volumes.ambience * 0.25, t, 0.1);
  }

  public setMood(mood: MusicMood): void {
    this.currentMood = mood;
  }

  private startMusicLoop(): void {
    if (this.musicInterval !== null) window.clearInterval(this.musicInterval);
    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.ctx.state !== 'running') return;
      this.stepIdx = (this.stepIdx + 1) % 16;
      const now = this.ctx.currentTime;

      const scales: Record<MusicMood, number[]> = {
        menu: [220, 261.63, 329.63, 392, 440, 523.25],
        jungle: [196, 220, 261.63, 293.66, 329.63, 392],
        camp: [261.63, 293.66, 329.63, 392, 440, 523.25],
        river: [246.94, 293.66, 329.63, 369.99, 440, 493.88],
        cave: [146.83, 174.61, 220, 261.63, 329.63],
        ruins: [174.61, 207.65, 261.63, 311.13, 349.23],
        chaos: [138.59, 164.81, 196, 233.08, 277.18],
        combat: [146.83, 164.81, 196, 220, 293.66],
        boss: [110, 123.47, 146.83, 164.81, 207.65, 220],
        victory: [261.63, 329.63, 392, 523.25, 659.25],
        defeat: [146.83, 155.56, 174.61, 207.65],
      };

      const notes = scales[this.currentMood];
      const isIntense = this.currentMood === 'combat' || this.currentMood === 'boss' || this.currentMood === 'chaos';

      if (this.stepIdx % (isIntense ? 2 : 4) === 0) {
        const freq = notes[(this.stepIdx * 3) % notes.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isIntense ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isIntense ? 1100 : 850, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(isIntense ? 0.14 : 0.11, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isIntense ? 0.35 : 0.75));

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.8);
      }

      if (isIntense && this.stepIdx % 2 === 0) {
        const drumOsc = this.ctx.createOscillator();
        const drumGain = this.ctx.createGain();
        drumOsc.type = 'sine';
        drumOsc.frequency.setValueAtTime(this.stepIdx % 4 === 0 ? 110 : 75, now);
        drumOsc.frequency.exponentialRampToValueAtTime(35, now + 0.14);
        drumGain.gain.setValueAtTime(0.24, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        drumOsc.connect(drumGain);
        drumGain.connect(this.musicGain);
        drumOsc.start(now);
        drumOsc.stop(now + 0.17);
      }
    }, 260);
  }

  private startAmbienceLoop(): void {
    if (!this.ctx || !this.ambienceGain || this.ambienceNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 1.8;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 380;
    filter.Q.value = 0.7;

    noise.connect(filter);
    filter.connect(this.ambienceGain);
    noise.start();
    this.ambienceNode = noise;
  }

  public playSfx(
    kind:
      | 'attack'
      | 'heavy'
      | 'hit'
      | 'dodge'
      | 'jump'
      | 'land'
      | 'shockwave'
      | 'gravity'
      | 'shield'
      | 'pickup'
      | 'puzzle'
      | 'save'
      | 'chaos_warn'
      | 'meteor'
      | 'boss_roar'
      | 'step'
  ): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const tone = (
      freqStart: number,
      freqEnd: number,
      duration: number,
      type: OscillatorType = 'triangle',
      vol = 0.25
    ) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    };

    switch (kind) {
      case 'step':
        tone(110, 60, 0.06, 'sine', 0.08);
        break;
      case 'jump':
        tone(220, 460, 0.16, 'sine', 0.2);
        break;
      case 'land':
        tone(120, 45, 0.12, 'triangle', 0.18);
        break;
      case 'dodge':
        tone(420, 140, 0.18, 'sine', 0.22);
        break;
      case 'attack':
        tone(540, 190, 0.13, 'sawtooth', 0.18);
        break;
      case 'heavy':
        tone(280, 70, 0.28, 'sawtooth', 0.28);
        break;
      case 'hit':
        tone(180, 55, 0.14, 'square', 0.22);
        break;
      case 'shockwave':
        tone(340, 55, 0.45, 'sawtooth', 0.34);
        tone(680, 120, 0.38, 'sine', 0.24);
        break;
      case 'gravity':
        tone(260, 620, 0.45, 'sine', 0.24);
        tone(390, 780, 0.5, 'triangle', 0.16);
        break;
      case 'shield':
        tone(320, 480, 0.35, 'triangle', 0.25);
        break;
      case 'pickup':
        tone(523.25, 783.99, 0.2, 'sine', 0.22);
        break;
      case 'puzzle':
        tone(440, 880, 0.4, 'triangle', 0.26);
        break;
      case 'save':
        tone(392, 587.33, 0.35, 'sine', 0.25);
        break;
      case 'chaos_warn':
        tone(240, 180, 0.42, 'sawtooth', 0.3);
        break;
      case 'meteor':
        tone(140, 32, 0.5, 'sawtooth', 0.35);
        break;
      case 'boss_roar':
        tone(110, 42, 0.7, 'sawtooth', 0.38);
        break;
    }
  }

  public dispose(): void {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.unlocked = false;
  }
}
