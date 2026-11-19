import { GameSettings, ZoneId } from './types';

export type MusicMood =
  | 'menu'
  | 'jungle'
  | 'camp'
  | 'river'
  | 'cave'
  | 'ruins'
  | 'temple'
  | 'chaos'
  | 'combat'
  | 'boss'
  | 'victory'
  | 'defeat';

export interface ZoneAudioContext {
  zoneId: ZoneId;
  mood: MusicMood;
  combatIntensity: number; // 0..1
  inChaos: boolean;
  isBoss: boolean;
}

export type SfxKind =
  | 'attack'
  | 'light_attack'
  | 'heavy'
  | 'heavy_attack'
  | 'hit'
  | 'heavy_hit'
  | 'dodge'
  | 'dodge_whoosh'
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
  | 'ui_hover'
  | 'ui_click';

interface StemMixTargets {
  jungle: number;
  temple: number;
  combat: number;
  theme: number;
  ambienceCutoff: number;
  ambienceQ: number;
  ambienceScale: number;
  jungleDroneFreq: number;
  templeDroneFreq: number;
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;

  // Multi-stem dynamic crossfade buses
  private jungleBus: GainNode | null = null;
  private templeBus: GainNode | null = null;
  private combatBus: GainNode | null = null;
  private themeBus: GainNode | null = null;

  // Dynamic soundscape shaping
  private ambienceFilter: BiquadFilterNode | null = null;
  private ambienceSubFilter: BiquadFilterNode | null = null;
  private ambienceSubGain: GainNode | null = null;
  private ambienceNode: AudioBufferSourceNode | null = null;
  private sfxNoiseBuffer: AudioBuffer | null = null;

  // Sustained background pads/drones
  private jungleDroneOsc: OscillatorNode | null = null;
  private jungleDroneFifthOsc: OscillatorNode | null = null;
  private jungleDroneFilter: BiquadFilterNode | null = null;
  private junglePadGain: GainNode | null = null;
  private templeDroneOsc: OscillatorNode | null = null;
  private templeDroneHarmOsc: OscillatorNode | null = null;
  private templeDroneFilter: BiquadFilterNode | null = null;
  private templePadGain: GainNode | null = null;

  private musicInterval: number | null = null;
  private currentMood: MusicMood = 'menu';
  private currentZoneId: ZoneId = 'arrival';
  private combatIntensity = 0;
  private inChaos = false;
  private isBoss = false;
  private isPaused = false;
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
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -10;
    this.masterCompressor.knee.value = 12;
    this.masterCompressor.ratio.value = 6;
    this.masterCompressor.attack.value = 0.005;
    this.masterCompressor.release.value = 0.15;

    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.ambienceGain = this.ctx.createGain();

    this.jungleBus = this.ctx.createGain();
    this.templeBus = this.ctx.createGain();
    this.combatBus = this.ctx.createGain();
    this.themeBus = this.ctx.createGain();

    this.jungleBus.gain.value = 0.7;
    this.templeBus.gain.value = 0.2;
    this.combatBus.gain.value = 0;
    this.themeBus.gain.value = 0.85;

    this.jungleBus.connect(this.musicGain);
    this.templeBus.connect(this.musicGain);
    this.combatBus.connect(this.musicGain);
    this.themeBus.connect(this.musicGain);

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.ambienceGain.connect(this.masterGain);
    this.masterGain.connect(this.masterCompressor);
    this.masterCompressor.connect(this.ctx.destination);

    this.unlocked = true;
    this.createSfxNoiseBuffer();
    this.applyVolumes();
    this.startAmbienceLoop();
    this.startDrones();
    this.updateMixTargets(true);
    this.startMusicLoop();
  }

  private createSfxNoiseBuffer(): void {
    if (!this.ctx || this.sfxNoiseBuffer) return;
    const len = Math.floor(this.ctx.sampleRate * 0.65);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.68 * b0 + 0.32 * white;
      data[i] = b0 * 1.45;
    }
    this.sfxNoiseBuffer = buffer;
  }

  public setBackgroundSuspended(hidden: boolean): void {
    if (!this.ctx || !this.unlocked) return;
    if (hidden) {
      if (this.ctx.state === 'running') {
        void this.ctx.suspend();
      }
    } else if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public applySettings(settings: GameSettings): void {
    this.volumes.master = settings.masterVolume;
    this.volumes.music = settings.musicVolume;
    this.volumes.sfx = settings.sfxVolume;
    this.volumes.ambience = settings.ambienceVolume;
    this.applyVolumes();
  }

  public setPaused(paused: boolean): void {
    if (this.isPaused === paused) return;
    this.isPaused = paused;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain || !this.ambienceGain) return;
    const t = this.ctx.currentTime;
    const pauseDuck = this.isPaused ? 0.35 : 1;
    this.masterGain.gain.setTargetAtTime(this.volumes.master, t, 0.05);
    this.musicGain.gain.setTargetAtTime(this.volumes.music * 0.38 * pauseDuck, t, 0.14);
    this.sfxGain.gain.setTargetAtTime(this.volumes.sfx * 0.62, t, 0.05);
    this.ambienceGain.gain.setTargetAtTime(this.volumes.ambience * 0.28 * pauseDuck, t, 0.18);
  }

  public setMood(mood: MusicMood): void {
    const inferredCombat =
      mood === 'boss' ? 1 : mood === 'chaos' ? 0.85 : mood === 'combat' ? 0.72 : 0;
    if (
      this.currentMood === mood &&
      Math.abs(this.combatIntensity - inferredCombat) < 0.02
    ) {
      return;
    }
    this.currentMood = mood;
    this.combatIntensity = inferredCombat;
    this.inChaos = mood === 'chaos';
    this.isBoss = mood === 'boss';
    this.updateMixTargets(false);
  }

  public setZoneAudioContext(context: ZoneAudioContext): void {
    const clampedCombat = Math.max(0, Math.min(1, context.combatIntensity));
    const changed =
      this.currentZoneId !== context.zoneId ||
      this.currentMood !== context.mood ||
      Math.abs(this.combatIntensity - clampedCombat) > 0.025 ||
      this.inChaos !== context.inChaos ||
      this.isBoss !== context.isBoss;

    if (!changed) return;

    this.currentZoneId = context.zoneId;
    this.currentMood = context.mood;
    this.combatIntensity = clampedCombat;
    this.inChaos = context.inChaos;
    this.isBoss = context.isBoss;
    this.updateMixTargets(false);
  }

  private computeStemTargets(): StemMixTargets {
    const mood = this.currentMood;
    const zoneId = this.currentZoneId;

    // Special full-screen themes (menu / victory / defeat)
    if (mood === 'menu' || mood === 'victory' || mood === 'defeat') {
      return {
        jungle: mood === 'menu' ? 0.35 : 0.05,
        temple: mood === 'menu' ? 0.25 : 0.1,
        combat: 0,
        theme: 0.9,
        ambienceCutoff: mood === 'defeat' ? 240 : 410,
        ambienceQ: 0.75,
        ambienceScale: mood === 'menu' ? 0.7 : 0.25,
        jungleDroneFreq: 196, // G3
        templeDroneFreq: 146.83, // D3
      };
    }

    const isTempleZone =
      mood === 'temple' ||
      mood === 'ruins' ||
      mood === 'cave' ||
      zoneId === 'forgotten_temple' ||
      zoneId === 'ancient_ruins' ||
      zoneId === 'hidden_cave' ||
      zoneId === 'secret_sanctuary';

    const isRiver = mood === 'river' || zoneId === 'river';
    const isCamp = mood === 'camp' || zoneId === 'camp';

    // Base exploration weights
    let jungleTarget = isTempleZone ? 0.14 : 0.92;
    let templeTarget = isTempleZone ? 0.92 : 0.1;

    if (zoneId === 'ancient_ruins') {
      // Transition zone blending jungle canopy + ancient stonework
      jungleTarget = 0.48;
      templeTarget = 0.72;
    } else if (zoneId === 'chaos_zone' || zoneId === 'boss_arena') {
      jungleTarget = 0.08;
      templeTarget = 0.55;
    }

    // Combat intensity smoothly elevates combat stem & ducks exploration stems
    const combatLevel = this.isBoss
      ? Math.max(0.88, this.combatIntensity)
      : this.inChaos
        ? Math.max(0.75, this.combatIntensity)
        : this.combatIntensity;

    const exploreDuck = 1 - combatLevel * 0.65;
    jungleTarget *= exploreDuck;
    templeTarget *= exploreDuck;

    // Zone-specific ambient soundscape filter profile
    let ambienceCutoff = 380;
    let ambienceQ = 0.75;
    let ambienceScale = 0.85;
    let jungleDroneFreq = 196; // G3
    let templeDroneFreq = 146.83; // D3

    if (isRiver) {
      ambienceCutoff = 840;
      ambienceQ = 0.55;
      ambienceScale = 1.15;
      jungleDroneFreq = 220; // A3
    } else if (isCamp) {
      ambienceCutoff = 280;
      ambienceQ = 0.85;
      ambienceScale = 0.62;
      jungleDroneFreq = 196;
    } else if (zoneId === 'hidden_cave') {
      ambienceCutoff = 210;
      ambienceQ = 1.65;
      ambienceScale = 0.72;
      templeDroneFreq = 130.81; // C3
    } else if (isTempleZone) {
      ambienceCutoff = 250;
      ambienceQ = 1.3;
      ambienceScale = 0.68;
      templeDroneFreq = zoneId === 'secret_sanctuary' ? 164.81 : 146.83; // E3 / D3
    } else if (this.inChaos || zoneId === 'chaos_zone') {
      ambienceCutoff = 520;
      ambienceQ = 1.15;
      ambienceScale = 0.95;
      templeDroneFreq = 138.59; // C#3
    } else if (this.isBoss || zoneId === 'boss_arena') {
      ambienceCutoff = 320;
      ambienceQ = 1.1;
      ambienceScale = 0.8;
      templeDroneFreq = 110; // A2
    }

    return {
      jungle: jungleTarget,
      temple: templeTarget,
      combat: combatLevel,
      theme: 0,
      ambienceCutoff,
      ambienceQ,
      ambienceScale,
      jungleDroneFreq,
      templeDroneFreq,
    };
  }

  private updateMixTargets(immediate: boolean): void {
    if (!this.ctx || !this.jungleBus || !this.templeBus || !this.combatBus || !this.themeBus) return;
    const targets = this.computeStemTargets();
    const t = this.ctx.currentTime;
    const tau = immediate ? 0.03 : 0.85;
    const combatTau = immediate ? 0.03 : this.combatIntensity > 0.2 ? 0.45 : 1.05;

    this.jungleBus.gain.setTargetAtTime(targets.jungle, t, tau);
    this.templeBus.gain.setTargetAtTime(targets.temple, t, tau);
    this.combatBus.gain.setTargetAtTime(targets.combat, t, combatTau);
    this.themeBus.gain.setTargetAtTime(targets.theme, t, tau);

    if (this.ambienceFilter) {
      this.ambienceFilter.frequency.setTargetAtTime(targets.ambienceCutoff, t, tau);
      this.ambienceFilter.Q.setTargetAtTime(targets.ambienceQ, t, tau);
    }
    if (this.ambienceSubFilter && this.ambienceSubGain) {
      const riverBoost = this.currentZoneId === 'river' || this.currentMood === 'river' ? 0.42 : 0.08;
      this.ambienceSubFilter.frequency.setTargetAtTime(
        this.currentZoneId === 'river' ? 1450 : 980,
        t,
        tau
      );
      this.ambienceSubGain.gain.setTargetAtTime(riverBoost * targets.ambienceScale, t, tau);
    }
    if (this.jungleDroneOsc && this.jungleDroneFifthOsc) {
      this.jungleDroneOsc.frequency.setTargetAtTime(targets.jungleDroneFreq * 0.5, t, 0.9);
      this.jungleDroneFifthOsc.frequency.setTargetAtTime(targets.jungleDroneFreq * 0.75, t, 0.9);
    }
    if (this.templeDroneOsc && this.templeDroneHarmOsc) {
      this.templeDroneOsc.frequency.setTargetAtTime(targets.templeDroneFreq * 0.5, t, 1.0);
      this.templeDroneHarmOsc.frequency.setTargetAtTime(targets.templeDroneFreq * 0.749, t, 1.0);
    }
  }

  private startDrones(): void {
    if (!this.ctx || !this.jungleBus || !this.templeBus || this.jungleDroneOsc) return;

    // Warm Jungle Pad (low-passed triangle root + sine fifth)
    this.jungleDroneFilter = this.ctx.createBiquadFilter();
    this.jungleDroneFilter.type = 'lowpass';
    this.jungleDroneFilter.frequency.value = 320;

    const jPadGain = this.ctx.createGain();
    jPadGain.gain.value = 0.085;
    this.junglePadGain = jPadGain;

    this.jungleDroneOsc = this.ctx.createOscillator();
    this.jungleDroneOsc.type = 'triangle';
    this.jungleDroneOsc.frequency.value = 98;

    this.jungleDroneFifthOsc = this.ctx.createOscillator();
    this.jungleDroneFifthOsc.type = 'sine';
    this.jungleDroneFifthOsc.frequency.value = 146.83;

    this.jungleDroneOsc.connect(this.jungleDroneFilter);
    this.jungleDroneFifthOsc.connect(this.jungleDroneFilter);
    this.jungleDroneFilter.connect(jPadGain);
    jPadGain.connect(this.jungleBus);

    this.jungleDroneOsc.start();
    this.jungleDroneFifthOsc.start();

    // Resonant Temple Drone (ceremonial sine + mellow sawtooth through deep lowpass)
    this.templeDroneFilter = this.ctx.createBiquadFilter();
    this.templeDroneFilter.type = 'lowpass';
    this.templeDroneFilter.frequency.value = 240;

    const tPadGain = this.ctx.createGain();
    tPadGain.gain.value = 0.095;
    this.templePadGain = tPadGain;

    this.templeDroneOsc = this.ctx.createOscillator();
    this.templeDroneOsc.type = 'sine';
    this.templeDroneOsc.frequency.value = 73.42;

    this.templeDroneHarmOsc = this.ctx.createOscillator();
    this.templeDroneHarmOsc.type = 'sawtooth';
    this.templeDroneHarmOsc.frequency.value = 110;

    this.templeDroneOsc.connect(this.templeDroneFilter);
    this.templeDroneHarmOsc.connect(this.templeDroneFilter);
    this.templeDroneFilter.connect(tPadGain);
    tPadGain.connect(this.templeBus);

    this.templeDroneOsc.start();
    this.templeDroneHarmOsc.start();
  }

  private playVoice(
    bus: GainNode,
    freq: number,
    duration: number,
    type: OscillatorType,
    peakGain: number,
    cutoff: number,
    attack = 0.03
  ): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);

    gain.gain.setValueAtTime(0.0008, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(bus);

    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    osc.start(now);
    osc.stop(now + duration + 0.04);
  }

  private startMusicLoop(): void {
    if (this.musicInterval !== null) window.clearInterval(this.musicInterval);
    this.musicInterval = window.setInterval(() => {
      if (
        !this.ctx ||
        !this.jungleBus ||
        !this.templeBus ||
        !this.combatBus ||
        !this.themeBus ||
        this.ctx.state !== 'running'
      ) {
        return;
      }

      this.stepIdx = (this.stepIdx + 1) % 32;
      const now = this.ctx.currentTime;

      // 1. Special Themes (Menu / Victory / Defeat)
      if (this.currentMood === 'menu' || this.currentMood === 'victory' || this.currentMood === 'defeat') {
        const themeNotes =
          this.currentMood === 'victory'
            ? [261.63, 329.63, 392, 523.25, 659.25, 523.25]
            : this.currentMood === 'defeat'
              ? [146.83, 155.56, 174.61, 130.81]
              : [220, 261.63, 329.63, 392, 440, 523.25];

        if (this.stepIdx % 4 === 0) {
          const note = themeNotes[(this.stepIdx / 4) % themeNotes.length];
          this.playVoice(
            this.themeBus,
            note,
            this.currentMood === 'defeat' ? 1.15 : 0.9,
            'triangle',
            0.12,
            this.currentMood === 'defeat' ? 520 : 950,
            0.05
          );
        }
        return;
      }

      // 2. Jungle Soundscape Stem (emerald pentatonic marimba/flute + subtle wildlife chirps)
      const isRiver = this.currentZoneId === 'river' || this.currentMood === 'river';
      const jungleScale = isRiver
        ? [246.94, 293.66, 329.63, 369.99, 440, 493.88] // B minor / D major pentatonic shimmer
        : [196, 220, 261.63, 293.66, 329.63, 392]; // G major pentatonic

      if (this.stepIdx % 4 === 0 || (isRiver && this.stepIdx % 6 === 2)) {
        const patternIdx = (this.stepIdx * 3 + (isRiver ? 1 : 0)) % jungleScale.length;
        const freq = jungleScale[patternIdx];
        this.playVoice(this.jungleBus, freq, 0.72, 'triangle', 0.1, isRiver ? 1150 : 880, 0.03);
      }

      // Subtle procedural jungle bird call / water droplet accent on sparse steps
      if (this.stepIdx === 7 || this.stepIdx === 23) {
        if (this.currentZoneId !== 'hidden_cave' && this.currentZoneId !== 'boss_arena' && this.ambienceGain) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const baseFreq = isRiver ? 1320 : 1680 + (this.stepIdx === 23 ? 240 : 0);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(
            isRiver ? 740 : baseFreq * 1.28,
            now + 0.11
          );
          gain.gain.setValueAtTime(0.0008, now);
          gain.gain.linearRampToValueAtTime(isRiver ? 0.035 : 0.028, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.18);
          osc.connect(gain);
          gain.connect(this.ambienceGain);
          osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
          };
          osc.start(now);
          osc.stop(now + 0.2);
        }
      }

      // 3. Temple Exploration Stem (resonant Dorian/Phrygian stone bells & mystic harmonics)
      const templeScale =
        this.currentZoneId === 'secret_sanctuary'
          ? [164.81, 196, 246.94, 293.66, 329.63, 440]
          : this.currentZoneId === 'hidden_cave'
            ? [130.81, 155.56, 196, 233.08, 293.66]
            : [146.83, 174.61, 220, 261.63, 329.63, 349.23];

      if (this.stepIdx % 6 === 0) {
        const note = templeScale[(this.stepIdx / 6 + 1) % templeScale.length];
        // Bell fundamental + crystalline harmonic partial
        this.playVoice(this.templeBus, note, 1.35, 'sine', 0.11, 1250, 0.015);
        this.playVoice(this.templeBus, note * 2, 0.85, 'triangle', 0.045, 1600, 0.01);
      }

      // 4. Combat Intensity Stem (scales smoothly with combatIntensity 0..1)
      if (this.combatIntensity > 0.06 || this.inChaos || this.isBoss) {
        const intensity = this.isBoss ? 1 : Math.max(this.combatIntensity, this.inChaos ? 0.75 : 0);
        const combatScale = this.isBoss
          ? [110, 116.54, 146.83, 164.81, 174.61, 220] // Boss A Phrygian
          : this.inChaos
            ? [138.59, 146.83, 185, 207.65, 277.18] // Chaos tritone tension
            : [146.83, 164.81, 174.61, 220, 261.63]; // Combat D minor

        // Driving ostinato synth
        const stepStride = intensity > 0.65 ? 2 : 4;
        if (this.stepIdx % stepStride === 0) {
          const note = combatScale[(this.stepIdx * 3) % combatScale.length];
          const cutoff = 650 + intensity * 1150;
          this.playVoice(
            this.combatBus,
            note,
            0.34,
            intensity > 0.55 ? 'sawtooth' : 'triangle',
            0.09 + intensity * 0.07,
            cutoff,
            0.018
          );
        }

        // Sub bass pulse & war drums
        if (this.stepIdx % 2 === 0 && (intensity > 0.32 || this.stepIdx % 4 === 0)) {
          const drumOsc = this.ctx.createOscillator();
          const drumGain = this.ctx.createGain();
          const isAccent = this.stepIdx % 4 === 0;
          drumOsc.type = 'sine';
          drumOsc.frequency.setValueAtTime(isAccent ? 118 : 82, now);
          drumOsc.frequency.exponentialRampToValueAtTime(34, now + 0.14);
          const vol = (isAccent ? 0.24 : 0.14) * (0.45 + intensity * 0.55);
          drumGain.gain.setValueAtTime(vol, now);
          drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          drumOsc.connect(drumGain);
          drumGain.connect(this.combatBus);
          drumOsc.onended = () => {
            drumOsc.disconnect();
            drumGain.disconnect();
          };
          drumOsc.start(now);
          drumOsc.stop(now + 0.17);
        }
      }
    }, 240);
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
      data[i] *= 1.85;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 380;
    filter.Q.value = 0.75;
    this.ambienceFilter = filter;

    // Secondary high-frequency water/canopy shimmer path
    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'bandpass';
    subFilter.frequency.value = 1100;
    subFilter.Q.value = 0.9;
    this.ambienceSubFilter = subFilter;

    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.08;
    this.ambienceSubGain = subGain;

    noise.connect(filter);
    filter.connect(this.ambienceGain);

    noise.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.ambienceGain);

    noise.start();
    this.ambienceNode = noise;
  }

  public playSfx(kind: SfxKind, variant = 0): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;
    if (!this.sfxNoiseBuffer) {
      this.createSfxNoiseBuffer();
    }
    const baseTime = this.ctx.currentTime;

    const tone = (
      freqStart: number,
      freqEnd: number,
      duration: number,
      type: OscillatorType = 'triangle',
      vol = 0.25,
      delay = 0,
      filterCutoffStart?: number,
      filterCutoffEnd?: number
    ) => {
      if (!this.ctx || !this.sfxGain) return;
      const startAt = baseTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, startAt);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), startAt + duration);

      gain.gain.setValueAtTime(0.0008, startAt);
      gain.gain.linearRampToValueAtTime(vol, startAt + Math.min(0.015, duration * 0.25));
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

      let filter: BiquadFilterNode | null = null;
      if (filterCutoffStart !== undefined) {
        filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterCutoffStart, startAt);
        filter.frequency.exponentialRampToValueAtTime(
          Math.max(60, filterCutoffEnd ?? filterCutoffStart),
          startAt + duration
        );
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }
      gain.connect(this.sfxGain);
      osc.onended = () => {
        osc.disconnect();
        filter?.disconnect();
        gain.disconnect();
      };
      osc.start(startAt);
      osc.stop(startAt + duration + 0.025);
    };

    const noiseLayer = (
      cutoffStart: number,
      cutoffPeak: number,
      cutoffEnd: number,
      q: number,
      duration: number,
      vol: number,
      delay = 0,
      filterType: BiquadFilterType = 'bandpass'
    ) => {
      if (!this.ctx || !this.sfxGain || !this.sfxNoiseBuffer) return;
      const startAt = baseTime + delay;
      const src = this.ctx.createBufferSource();
      src.buffer = this.sfxNoiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.Q.setValueAtTime(q, startAt);
      filter.frequency.setValueAtTime(cutoffStart, startAt);
      filter.frequency.exponentialRampToValueAtTime(Math.max(60, cutoffPeak), startAt + duration * 0.35);
      filter.frequency.exponentialRampToValueAtTime(Math.max(60, cutoffEnd), startAt + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0008, startAt);
      gain.gain.linearRampToValueAtTime(vol, startAt + Math.min(0.02, duration * 0.3));
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      src.onended = () => {
        src.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
      src.start(startAt);
      src.stop(startAt + duration + 0.02);
    };

    switch (kind) {
      case 'step':
        tone(110, 60, 0.06, 'sine', 0.08);
        break;
      case 'jump':
        tone(220, 460, 0.16, 'sine', 0.2);
        noiseLayer(420, 1100, 650, 1.1, 0.09, 0.08);
        break;
      case 'land':
        tone(120, 45, 0.12, 'triangle', 0.18);
        noiseLayer(320, 220, 90, 0.9, 0.1, 0.1, 0, 'lowpass');
        break;
      case 'dodge':
      case 'dodge_whoosh':
        // Agile push-off + smooth directional air rush
        tone(180, 68, 0.085, 'sine', 0.18);
        noiseLayer(520, 2250, 440, 1.55, 0.21, 0.26, 0.01);
        tone(490, 185, 0.17, 'sine', 0.14, 0.02);
        break;
      case 'attack':
      case 'light_attack': {
        // Fast slash whoosh + crisp edge transient with combo pitch step
        const pitchMult = [1.0, 1.12, 1.24][Math.abs(variant) % 3];
        noiseLayer(1150 * pitchMult, 3550 * pitchMult, 820, 1.75, 0.115, 0.27);
        tone(840 * pitchMult, 240 * pitchMult, 0.095, 'triangle', 0.17);
        tone(290 * pitchMult, 110, 0.085, 'sine', 0.12);
        break;
      }
      case 'heavy':
      case 'heavy_attack':
        // Weighty wind-up + deep resonant cleave + sub-bass punch
        noiseLayer(260, 880, 520, 1.4, 0.11, 0.15, 0);
        noiseLayer(980, 1450, 210, 1.05, 0.26, 0.34, 0.06);
        tone(245, 58, 0.27, 'sawtooth', 0.22, 0.06, 1150, 240);
        tone(168, 42, 0.29, 'sine', 0.28, 0.06);
        break;
      case 'hit':
        tone(210, 58, 0.12, 'triangle', 0.23);
        noiseLayer(1450, 920, 380, 1.2, 0.075, 0.19);
        break;
      case 'heavy_hit':
        tone(155, 38, 0.23, 'sawtooth', 0.26, 0, 900, 175);
        tone(122, 34, 0.24, 'sine', 0.3);
        noiseLayer(1650, 780, 260, 0.95, 0.135, 0.25);
        tone(640, 440, 0.16, 'triangle', 0.09, 0.01);
        break;
      case 'shockwave':
        tone(340, 55, 0.45, 'sawtooth', 0.34);
        tone(680, 120, 0.38, 'sine', 0.24);
        noiseLayer(900, 380, 110, 0.85, 0.32, 0.24);
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
      case 'ui_hover':
        tone(660, 740, 0.045, 'sine', 0.055);
        break;
      case 'ui_click':
        tone(520, 880, 0.085, 'triangle', 0.14);
        tone(1040, 1320, 0.06, 'sine', 0.07, 0.015);
        break;
    }
  }

  public dispose(): void {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    const stopNode = (node: { stop: () => void; disconnect: () => void } | null) => {
      if (!node) return;
      try {
        node.stop();
      } catch {
        // Ignore already stopped audio nodes
      }
      try {
        node.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    };
    const disconnectNode = (node: AudioNode | null) => {
      if (!node) return;
      try {
        node.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    };

    stopNode(this.ambienceNode);
    stopNode(this.jungleDroneOsc);
    stopNode(this.jungleDroneFifthOsc);
    stopNode(this.templeDroneOsc);
    stopNode(this.templeDroneHarmOsc);

    disconnectNode(this.jungleDroneFilter);
    disconnectNode(this.junglePadGain);
    disconnectNode(this.templeDroneFilter);
    disconnectNode(this.templePadGain);
    disconnectNode(this.ambienceFilter);
    disconnectNode(this.ambienceSubFilter);
    disconnectNode(this.ambienceSubGain);
    disconnectNode(this.jungleBus);
    disconnectNode(this.templeBus);
    disconnectNode(this.combatBus);
    disconnectNode(this.themeBus);
    disconnectNode(this.musicGain);
    disconnectNode(this.sfxGain);
    disconnectNode(this.ambienceGain);
    disconnectNode(this.masterGain);
    disconnectNode(this.masterCompressor);

    this.ambienceNode = null;
    this.jungleDroneOsc = null;
    this.jungleDroneFifthOsc = null;
    this.jungleDroneFilter = null;
    this.junglePadGain = null;
    this.templeDroneOsc = null;
    this.templeDroneHarmOsc = null;
    this.templeDroneFilter = null;
    this.templePadGain = null;
    this.ambienceFilter = null;
    this.ambienceSubFilter = null;
    this.ambienceSubGain = null;
    this.jungleBus = null;
    this.templeBus = null;
    this.combatBus = null;
    this.themeBus = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.ambienceGain = null;
    this.masterGain = null;
    this.masterCompressor = null;
    this.sfxNoiseBuffer = null;

    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.unlocked = false;
  }
}
