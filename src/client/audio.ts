import type { World } from '../simulation/world';

type SoundKind = 'hit' | 'power' | 'shot' | 'result' | 'start';

export class GameAudio {
  private context: AudioContext | null = null;
  private lastSound = 0;
  private lastTick = -1;
  enabled = localStorage.getItem('orbita-sound') !== 'off';

  unlock() {
    if (!this.enabled || !window.AudioContext) return;
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') void this.context.resume();
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('orbita-sound', this.enabled ? 'on' : 'off');
    if (this.enabled) this.unlock();
    return this.enabled;
  }

  resetRound() { this.lastTick = -1; }

  playEvents(events: World['events'], tick: number) {
    if (tick === this.lastTick) return;
    this.lastTick = tick;
    if (!this.enabled || !events.length) return;
    const types = new Set(events.map(event => event.type));
    if (types.has('hit') || types.has('damage')) this.play('hit');
    else if (types.has('power') || types.has('beam')) this.play('power');
    else if (types.has('shot')) this.play('shot');
  }

  play(kind: SoundKind) {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (kind !== 'result' && kind !== 'start' && now - this.lastSound < 0.085) return;
    this.lastSound = now;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const settings = {
      hit: [130, 58, 0.1, 'triangle'],
      power: [440, 260, 0.18, 'sine'],
      shot: [590, 180, 0.11, 'square'],
      start: [380, 720, 0.2, 'sine'],
      result: [620, 340, 0.35, 'triangle'],
    } as const;
    const [from, to, duration, wave] = settings[kind];
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'hit' ? 0.09 : 0.055, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}
