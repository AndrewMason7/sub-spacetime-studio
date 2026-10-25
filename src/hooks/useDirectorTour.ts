import { useState, useRef, useCallback, useEffect } from 'react';
import {
  CameraPresetId,
  SceneModeId,
  SimulationUniformState
} from '../types/workstation';

export interface DirectorTourCallbacks {
  onInitAudio: () => void;
  onSelectMode: (mode: SceneModeId) => void;
  onChangeUniform: (key: keyof SimulationUniformState, val: number) => void;
  onAnimateUniform: (
    key: keyof SimulationUniformState,
    target: number,
    durationMs: number
  ) => void;
  onCancelUniformAnimations?: () => void;
  onCameraPreset: (preset: CameraPresetId) => void;
  onHighlightSlider: (sliderIdx: number | null) => void;
  onDirectorActiveChange?: (active: boolean) => void;
}

export interface DirectorTourState {
  isDirectorRunning: boolean;
  tourActIndex: number;
  tourProgressPct: number;
  tourStatusText: string | null;
  tourNarration: string | null;
  startDirectorTour: (startAct?: number) => void;
  jumpToTourAct: (actIdx: number) => void;
  scrubDirectorTour: (pct: number) => void;
  stopDirectorTour: () => void;
}

const ACT_DURATION_MS = 9000;
const TOTAL_ACTS = 5;
const TOTAL_TOUR_DURATION_MS = TOTAL_ACTS * ACT_DURATION_MS;

const easeOutCubic = (t: number): number => {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
};

const lerpEased = (
  elapsedMs: number,
  startMs: number,
  durationMs: number,
  from: number,
  to: number
): number => {
  if (elapsedMs <= startMs) return from;
  if (elapsedMs >= startMs + durationMs) return to;
  return from + (to - from) * easeOutCubic((elapsedMs - startMs) / durationMs);
};

interface TourSnapshot {
  actIndex: number;
  mode: SceneModeId;
  statusText: string;
  narration: string;
  highlightSlider: number;
  uniforms: Partial<SimulationUniformState>;
}

/**
 * Evaluates the exact deterministic Director's Cut Tour state at any millisecond
 * `tMs` in [0, 45000] so the user can smoothly scrub forward and backward across
 * all 5 acts!
 */
function evaluateTourSnapshot(tMs: number): TourSnapshot {
  const t = Math.max(0, Math.min(TOTAL_TOUR_DURATION_MS, tMs));

  // ACT I (0.0s – 9.0s): M01 · OBSERVER HILBERT HOLOGRAM & EINSTEIN SADDLE
  if (t < 9000) {
    const narration =
      t < 1200
        ? 'Without an internal Observer (S_Ob = 0), a closed universe collapses to dim(𝓗) = 1...'
        : t < 5000
          ? 'Injecting Observer Worldline (S_Ob → 10.8): 360° Orbital Sweep of 5 Interlocked Hopf Villarceau Rings!'
          : 'Tumbling F348 Einstein 4-Manifold Saddle across X/Y/Z axes: Round S⁴ → Fubini–Study ℂℙ² → ℝℙ⁴';

    return {
      actIndex: 0,
      mode: 'observer',
      statusText: 'ACT I/V (∞ LOOP) · OBSERVER HILBERT 360° TUMBLE (M01)',
      narration,
      highlightSlider: t < 5000 ? 0 : 2,
      uniforms: {
        observerEntropy: lerpEased(t, 1200, 3600, 0.0, 10.8),
        wormholeCoupling: 1.0,
        manifoldMorph: lerpEased(t, 5000, 3400, 0.65, 1.75)
      }
    };
  }

  // ACT II (9.0s – 18.0s): M02 · FK-CRT CRITICAL PHASE TRANSITION AT q = 4
  if (t < 18000) {
    const narration =
      t < 10800
        ? 'Subcritical Regime (q = 1.8 ≤ 4.0): Smooth Liouville Quantum Gravity Sphere (d_H = 4.0)...'
        : t < 15000
          ? 'Crossing Critical Threshold q = 4.0 → 7.4: 360° Side & Polar View of Fractal Aldous CRT Spines (d_H = 2)!'
          : 'Inspecting 3D Bessel Bridge Excursion ||B_t - t B_1||_3 from all angles...';

    return {
      actIndex: 1,
      mode: 'fkcrt',
      statusText: 'ACT II/V (∞ LOOP) · FK-CRT PHASE TRANSITION AT q = 4.0 (M02)',
      narration,
      highlightSlider: t < 15000 ? 0 : 1,
      uniforms: {
        clusterParameterQ: lerpEased(t, 10800, 3800, 1.8, 7.4),
        excursionRoughness: lerpEased(t, 15000, 2500, 1.15, 1.85),
        planarEdgesN: 3.2
      }
    };
  }

  // ACT III (18.0s – 27.0s): M03 · CKS HORIZON & 105-QUBIT WILLOW SURFACE CODE
  if (t < 27000) {
    const narration =
      t < 20000
        ? 'CKSBondiPenrose.lean: Tilting 3D Carter Funnel to reveal full hyperboloidal gravity well profile...'
        : '360° Crane Orbit around Kerr Ergosphere, Lense–Thirring Torus & Precessing 3M Photon Geodesic!';

    return {
      actIndex: 2,
      mode: 'hologram',
      statusText: 'ACT III/V (∞ LOOP) · CKS KERR FUNNEL 360° PROFILE (M03)',
      narration,
      highlightSlider: t < 22800 ? 0 : t < 25200 ? 1 : 2,
      uniforms: {
        bondiMass: lerpEased(t, 20000, 3800, 0.85, 2.25),
        boundaryQubitFlux: lerpEased(t, 20000, 3800, 1.6, 2.85),
        kerrSpin: lerpEased(t, 20000, 3800, 0.72, 0.95)
      }
    };
  }

  // ACT IV (27.0s – 36.0s): M04 · F032 SIGN-ERROR K3 STABILIZATION SHATTER
  if (t < 36000) {
    const narration =
      t < 29000
        ? 'Unverified PDF Draft Assumption (+1 Sign): Smooth Hanson Fermat Quintic Calabi–Yau Slice...'
        : t < 32500
          ? 'Injecting Cusp Reality (-1 Sign): I_new = -2m ≠ 0 — 360° Tumble of Shattering K3 & Cusp Loci!'
          : 'Lean 4 `omega` catches the sign error in 0.01s — next: a geometry that is exact, not a metaphor...';

    return {
      actIndex: 3,
      mode: 'retraction',
      statusText: 'ACT IV/V (∞ LOOP) · F032 K3 QUINTIC SHATTER (+1 → -1) (M04)',
      narration,
      highlightSlider: 0,
      uniforms: {
        stabilizationSign: lerpEased(t, 29000, 2600, 1.0, -1.0),
        doublePointCountM: 6.0,
        calabiYauSlice: 1.57
      }
    };
  }

  // ACT V (36.0s – 45.0s): M05 · ASSOCIAHEDRON — EXACT 3D LODAY CRYSTAL (n = 4)
  const narration =
    t < 39000
      ? 'n = 4: 14 Loday vertices, V14 E21 F9 χ = 2 — embedded isometrically in 3D, zero projection.'
      : t < 42400
        ? 'Sweeping ABHY Canonical-Form Pole Sheen (Ω → 0.92): each facet of the 3D crystal is a φ³ scattering pole!'
        : '360° Multi-Axis Tumble of the exact 14-vertex Loday polytope — Seamless Loop restarting at Act I...';

  const associahedronOrder = 4.0;
  const projectionSweep = lerpEased(t, 36000, 9000, 0.0, 1.0);
  const facetResidueFocus =
    t < 39000
      ? lerpEased(t, 36000, 2800, 0.15, 0.45)
      : t < 42400
        ? lerpEased(t, 39000, 3200, 0.45, 0.92)
        : lerpEased(t, 42400, 2400, 0.92, 0.18);
  const highlightSlider = t < 39000 ? 0 : 2;

  return {
    actIndex: 4,
    mode: 'associahedron',
    statusText: 'ACT V/V (∞ LOOP) · ASSOCIAHEDRON EXACT 3D LODAY CRYSTAL (M05)',
    narration,
    highlightSlider,
    uniforms: {
      associahedronOrder,
      projectionSweep,
      facetResidueFocus
    }
  };
}

/**
 * v9.0 Choreographed 360° Orbital Crane & Multi-Axis Tumbling Director's Cut Tour (Infinite Loop ∞):
 * - Continuously orbits 360° around and tumbles each 3D manifold across X/Y/Z axes so the user
 *   sees the sides, poles, interior cross-sections, and underbelly of every geometry.
 * - Supports full interactive timeline scrubbing forward and backward across [0%, 100%].
 * - Automatically loops back to Act I after Act V until explicitly stopped by the user.
 */
export function useDirectorTour(callbacks: DirectorTourCallbacks): DirectorTourState {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const [isDirectorRunning, setIsDirectorRunning] = useState(false);
  const [tourActIndex, setTourActIndex] = useState(0);
  const [tourProgressPct, setTourProgressPct] = useState(0);
  const [tourStatusText, setTourStatusText] = useState<string | null>(null);
  const [tourNarration, setTourNarration] = useState<string | null>(null);

  const directorTimerRef = useRef<number[]>([]);
  const progressIntervalRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const lastModeRef = useRef<SceneModeId | null>(null);

  const clearTimers = useCallback(() => {
    directorTimerRef.current.forEach((id) => clearTimeout(id));
    directorTimerRef.current = [];
    if (progressIntervalRef.current !== null) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const stopDirectorTour = useCallback(() => {
    if (!isRunningRef.current && !isDirectorRunning) return;
    isRunningRef.current = false;
    lastModeRef.current = null;
    clearTimers();
    callbacksRef.current.onCancelUniformAnimations?.();
    setIsDirectorRunning(false);
    setTourActIndex(0);
    setTourStatusText(null);
    setTourNarration(null);
    setTourProgressPct(0);
    callbacksRef.current.onHighlightSlider(null);
    callbacksRef.current.onDirectorActiveChange?.(false);
  }, [clearTimers, isDirectorRunning]);

  const startDirectorTourFromMs = useCallback(
    (startElapsedMs = 0) => {
      clearTimers();
      const cb = callbacksRef.current;
      cb.onCancelUniformAnimations?.();
      cb.onInitAudio();
      isRunningRef.current = true;

      const clampedStartMs = Math.max(0, Math.min(TOTAL_TOUR_DURATION_MS - 10, startElapsedMs));
      const snap = evaluateTourSnapshot(clampedStartMs);

      setIsDirectorRunning(true);
      setTourActIndex(snap.actIndex);
      setTourStatusText(snap.statusText);
      setTourNarration(snap.narration);
      setTourProgressPct((clampedStartMs / TOTAL_TOUR_DURATION_MS) * 100);
      cb.onDirectorActiveChange?.(true);

      if (lastModeRef.current !== snap.mode) {
        lastModeRef.current = snap.mode;
        cb.onSelectMode(snap.mode);
      }
      cb.onHighlightSlider(snap.highlightSlider);
      for (const [key, val] of Object.entries(snap.uniforms)) {
        if (typeof val === 'number') {
          cb.onChangeUniform(key as keyof SimulationUniformState, val);
        }
      }

      const tourStartWall = performance.now() - clampedStartMs;

      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = performance.now() - tourStartWall;
        const pct = Math.max(0, Math.min(100, (elapsed / TOTAL_TOUR_DURATION_MS) * 100));
        setTourProgressPct(pct);
      }, 50);

      const scheduleAt = (absMs: number, fn: () => void) => {
        const relMs = absMs - clampedStartMs;
        if (relMs <= 0) return;
        const id = window.setTimeout(() => {
          if (!isRunningRef.current) return;
          fn();
        }, relMs);
        directorTimerRef.current.push(id);
      };

      const scheduleTween = (
        startMs: number,
        durationMs: number,
        key: keyof SimulationUniformState,
        fromVal: number,
        toVal: number
      ) => {
        const endMs = startMs + durationMs;
        if (clampedStartMs >= endMs) return;
        if (clampedStartMs > startMs) {
          const remainingMs = endMs - clampedStartMs;
          const id = window.setTimeout(() => {
            if (!isRunningRef.current) return;
            callbacksRef.current.onAnimateUniform(key, toVal, remainingMs);
          }, 0);
          directorTimerRef.current.push(id);
        } else {
          scheduleAt(startMs, () => {
            callbacksRef.current.onChangeUniform(key, fromVal);
            callbacksRef.current.onAnimateUniform(key, toVal, durationMs);
          });
        }
      };

      // =======================================================================
      // ACT I (0.0s – 9.0s): M01 · OBSERVER HILBERT HOLOGRAM & EINSTEIN SADDLE
      // =======================================================================
      scheduleAt(0, () => {
        const c = callbacksRef.current;
        setTourActIndex(0);
        setTourStatusText('ACT I/V (∞ LOOP) · OBSERVER HILBERT 360° TUMBLE (M01)');
        setTourNarration(
          'Without an internal Observer (S_Ob = 0), a closed universe collapses to dim(𝓗) = 1...'
        );
        lastModeRef.current = 'observer';
        c.onSelectMode('observer');
        c.onHighlightSlider(0);
        c.onChangeUniform('observerEntropy', 0.0);
        c.onChangeUniform('wormholeCoupling', 1.0);
        c.onChangeUniform('manifoldMorph', 0.65);
      });
      scheduleAt(1200, () => {
        setTourNarration(
          'Injecting Observer Worldline (S_Ob → 10.8): 360° Orbital Sweep of 5 Interlocked Hopf Villarceau Rings!'
        );
      });
      scheduleTween(1200, 3600, 'observerEntropy', 0.0, 10.8);
      scheduleAt(5000, () => {
        const c = callbacksRef.current;
        setTourNarration(
          'Tumbling F348 Einstein 4-Manifold Saddle across X/Y/Z axes: Round S⁴ → Fubini–Study ℂℙ² → ℝℙ⁴'
        );
        c.onHighlightSlider(2);
      });
      scheduleTween(5000, 3400, 'manifoldMorph', 0.65, 1.75);

      // =======================================================================
      // ACT II (9.0s – 18.0s): M02 · FK-CRT CRITICAL PHASE TRANSITION AT q = 4
      // =======================================================================
      scheduleAt(9000, () => {
        const c = callbacksRef.current;
        setTourActIndex(1);
        setTourStatusText('ACT II/V (∞ LOOP) · FK-CRT PHASE TRANSITION AT q = 4.0 (M02)');
        setTourNarration(
          'Subcritical Regime (q = 1.8 ≤ 4.0): Smooth Liouville Quantum Gravity Sphere (d_H = 4.0)...'
        );
        lastModeRef.current = 'fkcrt';
        c.onSelectMode('fkcrt');
        c.onHighlightSlider(0);
        c.onChangeUniform('clusterParameterQ', 1.8);
        c.onChangeUniform('excursionRoughness', 1.15);
        c.onChangeUniform('planarEdgesN', 3.2);
      });
      scheduleAt(10800, () => {
        setTourNarration(
          'Crossing Critical Threshold q = 4.0 → 7.4: 360° Side & Polar View of Fractal Aldous CRT Spines (d_H = 2)!'
        );
      });
      scheduleTween(10800, 3800, 'clusterParameterQ', 1.8, 7.4);
      scheduleAt(15000, () => {
        const c = callbacksRef.current;
        setTourNarration(
          'Inspecting 3D Bessel Bridge Excursion ||B_t - t B_1||_3 from all angles...'
        );
        c.onHighlightSlider(1);
      });
      scheduleTween(15000, 2500, 'excursionRoughness', 1.15, 1.85);

      // =======================================================================
      // ACT III (18.0s – 27.0s): M03 · CKS HORIZON & 105-QUBIT WILLOW SURFACE CODE
      // =======================================================================
      scheduleAt(18000, () => {
        const c = callbacksRef.current;
        setTourActIndex(2);
        setTourStatusText('ACT III/V (∞ LOOP) · CKS KERR FUNNEL 360° PROFILE (M03)');
        setTourNarration(
          'CKSBondiPenrose.lean: Tilting 3D Carter Funnel to reveal full hyperboloidal gravity well profile...'
        );
        lastModeRef.current = 'hologram';
        c.onSelectMode('hologram');
        c.onHighlightSlider(0);
        c.onChangeUniform('bondiMass', 0.85);
        c.onChangeUniform('boundaryQubitFlux', 1.6);
        c.onChangeUniform('kerrSpin', 0.72);
      });
      scheduleAt(20000, () => {
        const c = callbacksRef.current;
        setTourNarration(
          '360° Crane Orbit around Kerr Ergosphere, Lense–Thirring Torus & Precessing 3M Photon Geodesic!'
        );
        c.onHighlightSlider(0);
      });
      scheduleTween(20000, 3800, 'bondiMass', 0.85, 2.25);
      scheduleTween(20000, 3800, 'boundaryQubitFlux', 1.6, 2.85);
      scheduleTween(20000, 3800, 'kerrSpin', 0.72, 0.95);
      scheduleAt(22800, () => {
        callbacksRef.current.onHighlightSlider(1);
      });
      scheduleAt(25200, () => {
        callbacksRef.current.onHighlightSlider(2);
      });

      // =======================================================================
      // ACT IV (27.0s – 36.0s): M04 · F032 SIGN-ERROR K3 STABILIZATION SHATTER
      // =======================================================================
      scheduleAt(27000, () => {
        const c = callbacksRef.current;
        setTourActIndex(3);
        setTourStatusText('ACT IV/V (∞ LOOP) · F032 K3 QUINTIC SHATTER (+1 → -1) (M04)');
        setTourNarration(
          'Unverified PDF Draft Assumption (+1 Sign): Smooth Hanson Fermat Quintic Calabi–Yau Slice...'
        );
        lastModeRef.current = 'retraction';
        c.onSelectMode('retraction');
        c.onHighlightSlider(0);
        c.onChangeUniform('stabilizationSign', 1.0);
        c.onChangeUniform('doublePointCountM', 6.0);
        c.onChangeUniform('calabiYauSlice', 1.57);
      });
      scheduleAt(29000, () => {
        setTourNarration(
          'Injecting Cusp Reality (-1 Sign): I_new = -2m ≠ 0 — 360° Tumble of Shattering K3 & Cusp Loci!'
        );
      });
      scheduleTween(29000, 2600, 'stabilizationSign', 1.0, -1.0);
      scheduleAt(32500, () => {
        const c = callbacksRef.current;
        setTourNarration(
          'Lean 4 `omega` catches the sign error in 0.01s — next: a geometry that is exact, not a metaphor...'
        );
        c.onHighlightSlider(0);
      });

      // =======================================================================
      // ACT V (36.0s – 45.0s): M05 · ASSOCIAHEDRON — EXACT 3D LODAY CRYSTAL (n = 4)
      // =======================================================================
      scheduleAt(36000, () => {
        const c = callbacksRef.current;
        setTourActIndex(4);
        setTourStatusText('ACT V/V (∞ LOOP) · ASSOCIAHEDRON EXACT 3D LODAY CRYSTAL (M05)');
        setTourNarration(
          'n = 4: 14 Loday vertices, V14 E21 F9 χ = 2 — embedded isometrically in 3D, zero projection.'
        );
        lastModeRef.current = 'associahedron';
        c.onSelectMode('associahedron');
        c.onHighlightSlider(0);
        c.onChangeUniform('associahedronOrder', 4.0);
        c.onChangeUniform('projectionSweep', 0.0);
        c.onChangeUniform('facetResidueFocus', 0.15);
      });
      scheduleTween(36000, 9000, 'projectionSweep', 0.0, 1.0);
      scheduleTween(36000, 2800, 'facetResidueFocus', 0.15, 0.45);
      scheduleAt(39000, () => {
        const c = callbacksRef.current;
        setTourNarration(
          'Sweeping ABHY Canonical-Form Pole Sheen (Ω → 0.92): each facet of the 3D crystal is a φ³ scattering pole!'
        );
        c.onHighlightSlider(2);
      });
      scheduleTween(39000, 3200, 'facetResidueFocus', 0.45, 0.92);
      scheduleAt(42400, () => {
        const c = callbacksRef.current;
        setTourNarration(
          '360° Multi-Axis Tumble of the exact 14-vertex Loday polytope — Seamless Loop restarting at Act I...'
        );
        c.onHighlightSlider(2);
      });
      scheduleTween(42400, 2400, 'facetResidueFocus', 0.92, 0.18);

      // SEAMLESS INFINITE LOOP: Restart from Act 0 unless the user stopped the tour!
      scheduleAt(TOTAL_TOUR_DURATION_MS, () => {
        if (isRunningRef.current) {
          lastModeRef.current = null;
          startDirectorTourFromMs(0);
        }
      });
    },
    [clearTimers]
  );

  const startDirectorTour = useCallback(
    (startAct = 0) => {
      const clampedStart = Math.max(0, Math.min(TOTAL_ACTS - 1, startAct));
      lastModeRef.current = null;
      startDirectorTourFromMs(clampedStart * ACT_DURATION_MS);
    },
    [startDirectorTourFromMs]
  );

  const jumpToTourAct = useCallback(
    (actIdx: number) => {
      startDirectorTour(actIdx);
    },
    [startDirectorTour]
  );

  const scrubDirectorTour = useCallback(
    (pct: number) => {
      const clampedPct = Math.max(0, Math.min(100, pct));
      const targetMs = (clampedPct / 100) * (TOTAL_TOUR_DURATION_MS - 10);
      startDirectorTourFromMs(targetMs);
    },
    [startDirectorTourFromMs]
  );

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return {
    isDirectorRunning,
    tourActIndex,
    tourProgressPct,
    tourStatusText,
    tourNarration,
    startDirectorTour,
    jumpToTourAct,
    scrubDirectorTour,
    stopDirectorTour
  };
}
