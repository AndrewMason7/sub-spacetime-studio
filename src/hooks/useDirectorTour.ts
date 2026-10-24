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
  stopDirectorTour: () => void;
}

const ACT_DURATION_MS = 9000;
const TOTAL_ACTS = 5;

/**
 * v9.0 Choreographed 360° Orbital Crane & Multi-Axis Tumbling Director's Cut Tour (Infinite Loop ∞):
 * - Continuously orbits 360° around and tumbles each 3D manifold across X/Y/Z axes so the user
 *   sees the sides, poles, interior cross-sections, and underbelly of every geometry.
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

  const startDirectorTour = useCallback(
    (startAct = 0) => {
      clearTimers();
      const cb = callbacksRef.current;
      cb.onCancelUniformAnimations?.();
      cb.onInitAudio();
      isRunningRef.current = true;

      const clampedStart = Math.max(0, Math.min(TOTAL_ACTS - 1, startAct));
      setIsDirectorRunning(true);
      setTourActIndex(clampedStart);
      cb.onDirectorActiveChange?.(true);

      const tourStartWall = performance.now() - clampedStart * ACT_DURATION_MS;
      const totalTourDuration = TOTAL_ACTS * ACT_DURATION_MS;

      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = performance.now() - tourStartWall;
        const pct = Math.max(0, Math.min(100, (elapsed / totalTourDuration) * 100));
        setTourProgressPct(pct);
      }, 60);

      const scheduleAt = (absMs: number, fn: () => void) => {
        const relMs = absMs - clampedStart * ACT_DURATION_MS;
        if (relMs < -50) return;
        const id = window.setTimeout(() => {
          if (!isRunningRef.current) return;
          fn();
        }, Math.max(0, relMs));
        directorTimerRef.current.push(id);
      };

      // =======================================================================
      // ACT I (0.0s – 9.0s): M01 · OBSERVER HILBERT HOLOGRAM & EINSTEIN SADDLE
      // =======================================================================
      if (clampedStart <= 0) {
        scheduleAt(0, () => {
          const c = callbacksRef.current;
          setTourActIndex(0);
          setTourStatusText('ACT I/V (∞ LOOP) · OBSERVER HILBERT 360° TUMBLE (M01)');
          setTourNarration(
            'Without an internal Observer (S_Ob = 0), a closed universe collapses to dim(𝓗) = 1...'
          );
          c.onSelectMode('observer');
          c.onHighlightSlider(0);
          c.onChangeUniform('observerEntropy', 0.0);
          c.onChangeUniform('wormholeCoupling', 1.0);
          c.onChangeUniform('manifoldMorph', 0.65);
        });
        scheduleAt(1200, () => {
          const c = callbacksRef.current;
          setTourNarration(
            'Injecting Observer Worldline (S_Ob → 10.8): 360° Orbital Sweep of 5 Interlocked Hopf Villarceau Rings!'
          );
          c.onAnimateUniform('observerEntropy', 10.8, 3600);
        });
        scheduleAt(5000, () => {
          const c = callbacksRef.current;
          setTourNarration(
            'Tumbling F348 Einstein 4-Manifold Saddle across X/Y/Z axes: Round S⁴ → Fubini–Study ℂℙ² → ℝℙ⁴'
          );
          c.onHighlightSlider(2);
          c.onAnimateUniform('manifoldMorph', 1.75, 3400);
        });
      }

      // =======================================================================
      // ACT II (9.0s – 18.0s): M02 · FK-CRT CRITICAL PHASE TRANSITION AT q = 4
      // =======================================================================
      if (clampedStart <= 1) {
        scheduleAt(9000, () => {
          const c = callbacksRef.current;
          setTourActIndex(1);
          setTourStatusText('ACT II/V (∞ LOOP) · FK-CRT PHASE TRANSITION AT q = 4.0 (M02)');
          setTourNarration(
            'Subcritical Regime (q = 1.8 ≤ 4.0): Smooth Liouville Quantum Gravity Sphere (d_H = 4.0)...'
          );
          c.onSelectMode('fkcrt');
          c.onHighlightSlider(0);
          c.onChangeUniform('clusterParameterQ', 1.8);
          c.onChangeUniform('excursionRoughness', 1.15);
          c.onChangeUniform('planarEdgesN', 3.2);
        });
        scheduleAt(10800, () => {
          const c = callbacksRef.current;
          setTourNarration(
            'Crossing Critical Threshold q = 4.0 → 7.4: 360° Side & Polar View of Fractal Aldous CRT Spines (d_H = 2)!'
          );
          c.onAnimateUniform('clusterParameterQ', 7.4, 3800);
        });
        scheduleAt(15000, () => {
          const c = callbacksRef.current;
          setTourNarration(
            'Inspecting 3D Bessel Bridge Excursion ||B_t - t B_1||_3 from all angles...'
          );
          c.onHighlightSlider(1);
          c.onAnimateUniform('excursionRoughness', 1.85, 2500);
        });
      }

      // =======================================================================
      // ACT III (18.0s – 27.0s): M03 · CKS HORIZON & 105-QUBIT WILLOW SURFACE CODE
      // =======================================================================
      if (clampedStart <= 2) {
        scheduleAt(18000, () => {
          const c = callbacksRef.current;
          setTourActIndex(2);
          setTourStatusText('ACT III/V (∞ LOOP) · CKS KERR FUNNEL 360° PROFILE (M03)');
          setTourNarration(
            'CKSBondiPenrose.lean: Tilting 3D Carter Funnel to reveal full hyperboloidal gravity well profile...'
          );
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
          c.onAnimateUniform('bondiMass', 2.25, 3800);
          c.onAnimateUniform('boundaryQubitFlux', 2.85, 3800);
          c.onAnimateUniform('kerrSpin', 0.95, 3800);
        });
        scheduleAt(22800, () => {
          const c = callbacksRef.current;
          c.onHighlightSlider(1);
        });
        scheduleAt(25200, () => {
          const c = callbacksRef.current;
          c.onHighlightSlider(2);
        });
      }

      // =======================================================================
      // ACT IV (27.0s – 36.0s): M04 · F032 SIGN-ERROR K3 STABILIZATION SHATTER
      // =======================================================================
      if (clampedStart <= 3) {
        scheduleAt(27000, () => {
          const c = callbacksRef.current;
          setTourActIndex(3);
          setTourStatusText('ACT IV/V (∞ LOOP) · F032 K3 QUINTIC SHATTER (+1 → -1) (M04)');
          setTourNarration(
            'Unverified PDF Draft Assumption (+1 Sign): Smooth Hanson Fermat Quintic Calabi–Yau Slice...'
          );
          c.onSelectMode('retraction');
          c.onHighlightSlider(0);
          c.onChangeUniform('stabilizationSign', 1.0);
          c.onChangeUniform('doublePointCountM', 6.0);
          c.onChangeUniform('calabiYauSlice', 1.57);
        });
        scheduleAt(29000, () => {
          const c = callbacksRef.current;
          setTourNarration(
            'Injecting Cusp Reality (-1 Sign): I_new = -2m ≠ 0 — 360° Tumble of Shattering K3 & Cusp Loci!'
          );
          c.onAnimateUniform('stabilizationSign', -1.0, 2600);
        });
        scheduleAt(32500, () => {
          const c = callbacksRef.current;
          setTourNarration(
            'Lean 4 `omega` catches the sign error in 0.01s — next: a geometry that is exact, not a metaphor...'
          );
          c.onHighlightSlider(0);
        });
      }

      // =======================================================================
      // ACT V (36.0s – 45.0s): M05 · ASSOCIAHEDRON — EXACT 3D, THEN ITS SHADOWS
      // =======================================================================
      if (clampedStart <= 4) {
        scheduleAt(36000, () => {
          const c = callbacksRef.current;
          setTourActIndex(4);
          setTourStatusText('ACT V/V (∞ LOOP) · ASSOCIAHEDRON EXACT 3D → PROJECTED SHADOW (M05)');
          setTourNarration(
            'n = 4: 14 Loday vertices, V14 E21 F9 χ = 2 — embedded isometrically, no projection. Proof: scaffold, unverified.'
          );
          c.onSelectMode('associahedron');
          c.onHighlightSlider(0);
          c.onChangeUniform('associahedronOrder', 4.0);
          c.onChangeUniform('projectionSweep', 0.0);
          c.onChangeUniform('facetResidueFocus', 0.15);
        });
        scheduleAt(38800, () => {
          const c = callbacksRef.current;
          setTourNarration(
            'n = 5: 42 points live in 4D — what you now see is a PROJECTED 3D shadow, one true hull per angle.'
          );
          c.onChangeUniform('associahedronOrder', 5.0);
          c.onHighlightSlider(1);
          c.onAnimateUniform('projectionSweep', 1.0, 3200);
        });
        scheduleAt(42400, () => {
          const c = callbacksRef.current;
          setTourNarration(
            'Back to n = 4: the only order rendered exactly — Seamless Loop restarting at Act I...'
          );
          c.onChangeUniform('associahedronOrder', 4.0);
          c.onHighlightSlider(2);
          c.onAnimateUniform('facetResidueFocus', 0.85, 2200);
        });
      }

      // SEAMLESS INFINITE LOOP: Restart from Act 0 unless the user stopped the tour!
      scheduleAt(45000, () => {
        if (isRunningRef.current) {
          startDirectorTour(0);
        }
      });
    },
    [clearTimers]
  );

  const jumpToTourAct = useCallback(
    (actIdx: number) => {
      startDirectorTour(actIdx);
    },
    [startDirectorTour]
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
    stopDirectorTour
  };
}
