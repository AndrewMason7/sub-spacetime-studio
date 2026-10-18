/**
 * SUB-SPACETIME STUDIO // STUDIO-MASTERED SOUNDTRACK & FOLEY ENGINE (v8.0)
 *
 * Features:
 * - Studio-mastered 24-second 256kbps stereo soundtrack (`/audio/cosmic_soundtrack.mp3`)
 *   with 4-chord progression (Fmaj9#11 -> G6add9 -> Am9 -> Em7add11) & felt piano.
 * - Rock-solid hardware Mute / Unmute state machine:
 *   When muted, immediately pauses all HTMLAudioElements, zeroes volume, sets `.muted = true`,
 *   and guards async `play()` promises so nothing can ever leak sound while muted.
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
      const unlockHandler = (e: Event) => {
        const target = e.target as HTMLElement | null;
        if (target && target.closest('[data-mute-toggle="true"]')) {
          return;
        }
        if (!this.isMuted && !this.isRunning) {
          this.init();
        }
      };
      window.addEventListener('pointerdown', unlockHandler, { passive: true });
      window.addEventListener('keydown', unlockHandler, { passive: true });
    }
  }

  private preloadAudioAssets(): void {
    try {
      this.bgMusic = new Audio('/audio/cosmic_soundtrack.mp3');
      this.bgMusic.loop = true;
      this.bgMusic.preload = 'auto';
      this.bgMusic.volume = this.targetVolume;

      this.swellClips.ignition = new Audio('/audio/swell_ignition.mp3');
      this.swellClips.ignition.preload = 'auto';
      this.swellClips.ignition.volume = 0.52;

      this.swellClips.phase = new Audio('/audio/swell_phase.mp3');
      this.swellClips.phase.preload = 'auto';
      this.swellClips.phase.volume = 0.52;

      this.swellClips.shatter = new Audio('/audio/swell_shatter.mp3');
      this.swellClips.shatter.preload = 'auto';
      this.swellClips.shatter.volume = 0.58;
    } catch {
      // Ignore in non-browser environments
    }
  }

  public init(): void {
    if (this.isMuted) return;
    if (!this.bgMusic) {
      this.preloadAudioAssets();
    }
    if (!this.bgMusic || this.isMuted) return;

    this.bgMusic.muted = false;
    this.bgMusic.volume = this.targetVolume;

    if (this.bgMusic.paused) {
      const playPromise = this.bgMusic.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (this.isMuted && this.bgMusic) {
              this.bgMusic.pause();
              this.bgMusic.muted = true;
              this.bgMusic.volume = 0;
              this.isRunning = false;
            } else {
              this.isRunning = true;
            }
          })
          .catch(() => {});
      }
    } else {
      this.isRunning = true;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (!this.bgMusic) {
      this.preloadAudioAssets();
    }
    if (!this.bgMusic) return;

    if (muted) {
      this.isRunning = false;
      this.bgMusic.muted = true;
      this.bgMusic.volume = 0;
      try {
        this.bgMusic.pause();
      } catch {}
      Object.values(this.swellClips).forEach((clip) => {
        if (clip) {
          clip.muted = true;
          clip.volume = 0;
          try {
            clip.pause();
            clip.currentTime = 0;
          } catch {}
        }
      });
    } else {
      this.bgMusic.muted = false;
      this.bgMusic.volume = this.targetVolume;
      Object.values(this.swellClips).forEach((clip) => {
        if (clip) {
          clip.muted = false;
          clip.volume = 0.52;
        }
      });
      this.init();
    }
  }

  public playTactileTick(_pitchMultiplier = 1.0): void {
    if (this.isMuted) return;
    if (!this.isRunning) {
      this.init();
    }
  }

  public modulateFromPhysics(_mode: string, intensity: number, _criticalCrossed: boolean): void {
    if (this.isMuted) return;
    if (!this.isRunning) {
      this.init();
    }
    if (!this.bgMusic || this.isMuted) return;

    const clamped = Math.max(0, Math.min(1, intensity));
    this.targetVolume = 0.34 + clamped * 0.28;
    this.bgMusic.volume = this.targetVolume;
  }

  public triggerShockwave(type: 'ignition' | 'phase' | 'shatter'): void {
    if (this.isMuted) return;
    if (!this.isRunning) {
      this.init();
    }

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

      clip.muted = false;
      clip.volume = type === 'shatter' ? 0.58 : 0.52;
      clip.currentTime = 0;
      const p = clip.play();
      if (p !== undefined) {
        p.then(() => {
          if (this.isMuted) {
            clip.pause();
            clip.muted = true;
            clip.volume = 0;
          }
        }).catch(() => {});
      }
    } catch {}
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
    } catch {}
    this.isRunning = false;
  }
}
