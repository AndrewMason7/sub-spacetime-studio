/**
 * SUB-SPACETIME STUDIO // SINGLETON STUDIO SOUNDTRACK & FOLEY ENGINE (v8.2)
 *
 * Root Cause of Previous Mute Bug Fixed:
 * - Previously, `useRef(new AudioSynthesizer())` in `main.tsx` evaluated `new AudioSynthesizer()`
 *   on EVERY React render, registering multiple zombie `window.addEventListener('pointerdown')`
 *   handlers and spawning multiple background `HTMLAudioElement` instances that `audioRef.current.setMuted(true)`
 *   could never reach!
 * - `AudioSynthesizer` is now a strict Singleton (`AudioSynthesizer.getInstance()`), tracks all created
 *   `HTMLAudioElement` instances in a global registry, and `setMuted(true)` immediately silences and pauses
 *   every audio element on the page.
 */

declare global {
  interface Window {
    __SPACETIME_AUDIO_SINGLETON__?: AudioSynthesizer;
    __SPACETIME_AUDIO_POOL__?: HTMLAudioElement[];
  }
}

export class AudioSynthesizer {
  private bgMusic: HTMLAudioElement | null = null;
  private swellClips: Record<'ignition' | 'phase' | 'shatter', HTMLAudioElement | null> = {
    ignition: null,
    phase: null,
    shatter: null
  };

  public isMuted: boolean = false;
  public isRunning: boolean = false;
  private targetVolume: number = 0.46;
  private unlockHandler: ((e: Event) => void) | null = null;

  public static getInstance(): AudioSynthesizer {
    if (typeof window !== 'undefined') {
      if (!window.__SPACETIME_AUDIO_SINGLETON__) {
        window.__SPACETIME_AUDIO_SINGLETON__ = new AudioSynthesizer();
      }
      return window.__SPACETIME_AUDIO_SINGLETON__;
    }
    return new AudioSynthesizer();
  }

  constructor() {
    if (typeof window !== 'undefined') {
      if (window.__SPACETIME_AUDIO_SINGLETON__) {
        return window.__SPACETIME_AUDIO_SINGLETON__;
      }
      window.__SPACETIME_AUDIO_SINGLETON__ = this;
      if (!window.__SPACETIME_AUDIO_POOL__) {
        window.__SPACETIME_AUDIO_POOL__ = [];
      }

      this.preloadAudioAssets();

      this.unlockHandler = (e: Event) => {
        if (this.isMuted) return;
        const target = e.target as HTMLElement | null;
        if (target && target.closest('[data-mute-toggle="true"]')) {
          return;
        }
        if (!this.isRunning) {
          this.init();
        }
      };

      window.addEventListener('pointerdown', this.unlockHandler, { passive: true });
      window.addEventListener('keydown', this.unlockHandler, { passive: true });
    }
  }

  private registerAudio(el: HTMLAudioElement): HTMLAudioElement {
    if (typeof window !== 'undefined') {
      if (!window.__SPACETIME_AUDIO_POOL__) {
        window.__SPACETIME_AUDIO_POOL__ = [];
      }
      window.__SPACETIME_AUDIO_POOL__.push(el);
    }
    return el;
  }

  private preloadAudioAssets(): void {
    if (this.bgMusic) return;
    try {
      this.bgMusic = this.registerAudio(new Audio('/audio/cosmic_soundtrack.mp3'));
      this.bgMusic.loop = true;
      this.bgMusic.preload = 'auto';
      this.bgMusic.volume = this.targetVolume;

      this.swellClips.ignition = this.registerAudio(new Audio('/audio/swell_ignition.mp3'));
      this.swellClips.ignition.preload = 'auto';
      this.swellClips.ignition.volume = 0.5;

      this.swellClips.phase = this.registerAudio(new Audio('/audio/swell_phase.mp3'));
      this.swellClips.phase.preload = 'auto';
      this.swellClips.phase.volume = 0.5;

      this.swellClips.shatter = this.registerAudio(new Audio('/audio/swell_shatter.mp3'));
      this.swellClips.shatter.preload = 'auto';
      this.swellClips.shatter.volume = 0.55;
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

    if (muted) {
      this.isRunning = false;
      if (typeof window !== 'undefined' && window.__SPACETIME_AUDIO_POOL__) {
        for (const el of window.__SPACETIME_AUDIO_POOL__) {
          try {
            el.muted = true;
            el.volume = 0;
            el.pause();
          } catch {}
        }
      }
      if (typeof document !== 'undefined') {
        document.querySelectorAll('audio').forEach((el) => {
          try {
            el.muted = true;
            el.volume = 0;
            el.pause();
          } catch {}
        });
      }
    } else {
      if (this.bgMusic) {
        this.bgMusic.muted = false;
        this.bgMusic.volume = this.targetVolume;
      }
      Object.values(this.swellClips).forEach((clip) => {
        if (clip) {
          clip.muted = false;
          clip.volume = 0.5;
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
    this.targetVolume = 0.32 + clamped * 0.28;
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
      clip.volume = type === 'shatter' ? 0.55 : 0.48;
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
      if (this.unlockHandler && typeof window !== 'undefined') {
        window.removeEventListener('pointerdown', this.unlockHandler);
        window.removeEventListener('keydown', this.unlockHandler);
      }
      if (typeof window !== 'undefined' && window.__SPACETIME_AUDIO_POOL__) {
        for (const el of window.__SPACETIME_AUDIO_POOL__) {
          el.pause();
        }
      }
    } catch {}
    this.isRunning = false;
  }
}
