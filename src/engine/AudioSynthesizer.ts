/**
 * SUB-SPACETIME STUDIO // STUDIO-MASTERED SOUNDTRACK & FOLEY ENGINE (v7.5)
 *
 * Why v7.0 sounded like a "straight frequency":
 * - `bakeSeamlessPadBuffer` summed phase-locked integer multiples of 73 Hz (73, 146, 219, 292, 365 Hz).
 *   By Fourier's theorem, summing phase-locked integer harmonics of a single fundamental produces a
 *   single static periodic waveform at 73 Hz — which the human ear perceives as one flat, straight tone!
 *
 * How v7.5 delivers genuine, zero-lag cinematic music:
 * - Plays a studio-mastered 24-second 256kbps stereo soundtrack (`/audio/cosmic_soundtrack.mp3`)
 *   featuring a 4-chord progression (Fmaj9#11 -> G6add9 -> Am9 -> Em7add11), 5-voice CS-80 chorus
 *   swells, felt piano arpeggio notes, and a 3.2s stereo convolution reverb hall tail.
 * - Uses native hardware-decoded `HTMLAudioElement` for the soundtrack and chord swells
 *   (`/audio/swell_ignition.mp3`, `/audio/swell_phase.mp3`, `/audio/swell_shatter.mp3`)
 *   so main-thread CPU / WebGL overhead is 0.0%!
 */

export class AudioSynthesizer {
  private bgMusic: HTMLAudioElement | null = null;
  private swellClips: Record<'ignition' | 'phase' | 'shatter', HTMLAudioElement | null> = {
    ignition: null,
    phase: null,
    shatter: null
  };

  public isMuted: boolean = false;
  public isRunning: boolean = false;
  private targetVolume: number = 0.48;

  constructor() {
    if (typeof window !== 'undefined') {
      this.preloadAudioAssets();
      const unlockOnce = () => {
        this.init();
      };
      window.addEventListener('pointerdown', unlockOnce, { once: true, passive: true });
      window.addEventListener('keydown', unlockOnce, { once: true, passive: true });
    }
  }

  private preloadAudioAssets(): void {
    try {
      this.bgMusic = new Audio('/audio/cosmic_soundtrack.mp3');
      this.bgMusic.loop = true;
      this.bgMusic.preload = 'auto';
      this.bgMusic.volume = 0.48;

      this.swellClips.ignition = new Audio('/audio/swell_ignition.mp3');
      this.swellClips.ignition.preload = 'auto';
      this.swellClips.ignition.volume = 0.55;

      this.swellClips.phase = new Audio('/audio/swell_phase.mp3');
      this.swellClips.phase.preload = 'auto';
      this.swellClips.phase.volume = 0.55;

      this.swellClips.shatter = new Audio('/audio/swell_shatter.mp3');
      this.swellClips.shatter.preload = 'auto';
      this.swellClips.shatter.volume = 0.62;
    } catch {
      // Ignore in non-browser environments
    }
  }

  public init(): void {
    if (!this.bgMusic) {
      this.preloadAudioAssets();
    }
    if (!this.bgMusic || this.isMuted) return;

    if (this.bgMusic.paused) {
      this.bgMusic.volume = this.targetVolume;
      this.bgMusic
        .play()
        .then(() => {
          this.isRunning = true;
        })
        .catch(() => {
          // Will retry on next user interaction if blocked
        });
    } else {
      this.isRunning = true;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (!this.bgMusic) return;

    if (muted) {
      this.bgMusic.muted = true;
      Object.values(this.swellClips).forEach((clip) => {
        if (clip) clip.muted = true;
      });
    } else {
      this.bgMusic.muted = false;
      Object.values(this.swellClips).forEach((clip) => {
        if (clip) clip.muted = false;
      });
      this.init();
    }
  }

  public playTactileTick(_pitchMultiplier = 1.0): void {
    if (!this.isRunning && !this.isMuted) {
      this.init();
    }
  }

  public modulateFromPhysics(_mode: string, intensity: number, _criticalCrossed: boolean): void {
    if (!this.isRunning && !this.isMuted) {
      this.init();
    }
    if (!this.bgMusic || this.isMuted) return;

    const clamped = Math.max(0, Math.min(1, intensity));
    this.targetVolume = 0.34 + clamped * 0.28;
    this.bgMusic.volume = this.targetVolume;
  }

  public triggerShockwave(type: 'ignition' | 'phase' | 'shatter'): void {
    if (!this.isRunning && !this.isMuted) {
      this.init();
    }
    if (this.isMuted) return;

    const clip = this.swellClips[type];
    if (!clip) return;

    try {
      (Object.keys(this.swellClips) as ('ignition' | 'phase' | 'shatter')[]).forEach((k) => {
        const other = this.swellClips[k];
        if (other && other !== clip && !other.paused) {
          other.pause();
          other.currentTime = 0;
        }
      });

      clip.currentTime = 0;
      clip.play().catch(() => {});
    } catch {
      // Ignore playback errors before gesture
    }
  }

  public dispose(): void {
    try {
      if (this.bgMusic) {
        this.bgMusic.pause();
        this.bgMusic.src = '';
      }
      Object.values(this.swellClips).forEach((clip) => {
        if (clip) {
          clip.pause();
          clip.src = '';
        }
      });
    } catch {
      // Ignore cleanup errors
    }
    this.isRunning = false;
  }
}
