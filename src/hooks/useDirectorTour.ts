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
const TOTAL_ACTS = 4;

export function useDirectorTour(callbacks: DirectorTourCallbacks): DirectorTourState {
  const {
    onInitAudio,
    onSelectMode,
    onChangeUniform,
    onAnimateUniform,
    onHighlightSlider,
    onDirectorActiveChange
  } = callbacks;

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
    isRunningRef.current = false;
    clearTimers();
    setIsDirectorRunning(false);
    setTourStatusText(null);
    setTourNarration(null);
    setTourProgressPct(0);
    onHighlightSlider(null);
    onDirectorActiveChange?.(false);
  }, [clearTimers, onHighlightSlider, onDirectorActiveChange]);

  const startDirectorTour = useCallback(
    (startAct = 0) => {
      clearTimers();
      onInitAudio();
      isRunningRef.current = true;

      const clampedStart = Math.max(0, Math.min(TOTAL_ACTS - 1, startAct));
      setIsDirectorRunning(true);
      setTourActIndex(clampedStart);
      onDirectorActiveChange?.(true);

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

      if (clampedStart <= 0) {
        scheduleAt(0, () => {
          setTourActIndex(0);
          setTourStatusText('ACT I/IV (∞ LOOP) · OBSERVER HILBERT 360° TUMBLE (M01)');
          setTourNarration(
            'Without an internal Observer (S_Ob = 0), a closed universe collapses to dim(𝓗) = 1...'
          );
          onSelectMode('observer');
          onHighlightSlider(0);
          onChangeUniform('observerEntropy', 0.0);
        });
        scheduleAt(1200, () => {
          setTourNarration(
            'Injecting Observer Worldline (S_Ob → 10.8): 360° Orbital Sweep of 5 Interlocked Hopf Villarceau Rings!'
          );
          onAnimateUniform('observerEntropy', 10.8, 3600);
        });
        scheduleAt(5000, () => {
          setTourNarration(
            'Tumbling F348 Einstein 4-Manifold Saddle across X/Y/Z axes: Round S⁴ → Fubini–Study ℂℙ² → ℝℙ⁴'
          );
          onHighlightSlider(2);
          onAnimateUniform('manifoldMorph', 1.75, 3400);
        });
      }

      if (clampedStart <= 1) {
        scheduleAt(9000, () => {
          setTourActIndex(1);
          setTourStatusText('ACT II/IV (∞ LOOP) · FK-CRT PHASE TRANSITION AT q = 4.0 (M02)');
          setTourNarration(
            'Subcritical Regime (q = 1.8 ≤ 4.0): Smooth Liouville Quantum Gravity Sphere (d_H = 4.0)...'
          );
          onSelectMode('fkcrt');
          onHighlightSlider(0);
          onChangeUniform('clusterParameterQ', 1.8);
        });
        scheduleAt(10800, () => {
          setTourNarration(
            'Crossing Critical Threshold q = 4.0 → 7.4: 360° Side & Polar View of Fractal Aldous CRT Spines (d_H = 2)!'
          );
          onAnimateUniform('clusterParameterQ', 7.4, 3800);
        });
        scheduleAt(15000, () => {
          setTourNarration(
            'Inspecting 3D Bessel Bridge Excursion ||B_t - t B_1||_3 from all angles...'
          );
          onHighlightSlider(1);
          onAnimateUniform('excursionRoughness', 1.85, 2500);
        });
      }

      if (clampedStart <= 2) {
        scheduleAt(18000, () => {
          setTourActIndex(2);
          setTourStatusText('ACT III/IV (∞ LOOP) · CKS KERR FUNNEL 360° PROFILE (M03)');
          setTourNarration(
            'CKSBondiPenrose.lean: Tilting 3D Carter Funnel to reveal full hyperboloidal gravity well profile...'
          );
          onSelectMode('hologram');
          onHighlightSlider(0);
          onChangeUniform('bondiMass', 0.85);
        });
        scheduleAt(20000, () => {
          setTourNarration(
            '360° Crane Orbit around Kerr Ergosphere, Lense–Thirring Torus & Precessing 3M Photon Geodesic!'
          );
          onHighlightSlider(2);
          onAnimateUniform('bondiMass', 2.25, 3800);
          onAnimateUniform('boundaryQubitFlux', 2.85, 3800);
          onAnimateUniform('kerrSpin', 0.95, 3800);
        });
      }

      if (clampedStart <= 3) {
        scheduleAt(27000, () => {
          setTourActIndex(3);
          setTourStatusText('ACT IV/IV (∞ LOOP) · F032 K3 QUINTIC SHATTER (+1 → -1) (M04)');
          setTourNarration(
            'Unverified PDF Draft Assumption (+1 Sign): Smooth Hanson Fermat Quintic Calabi–Yau Slice...'
          );
          onSelectMode('retraction');
          onHighlightSlider(0);
          onChangeUniform('stabilizationSign', 1.0);
        });
        scheduleAt(29000, () => {
          setTourNarration(
            'Injecting Cusp Reality (-1 Sign): I_new = -2m ≠ 0 — 360° Tumble of Shattering K3 & Cusp Loci!'
          );
          onAnimateUniform('stabilizationSign', -1.0, 2600);
        });
        scheduleAt(32500, () => {
          setTourNarration(
            'Lean 4 `omega` catches the sign error in 0.01s — Seamless Loop restarting at Act I...'
          );
          onHighlightSlider(1);
        });
      }

      scheduleAt(36000, () => {
        if (isRunningRef.current) {
          startDirectorTour(0);
        }
      });
    },
    [
      clearTimers,
      onInitAudio,
      onSelectMode,
      onHighlightSlider,
      onChangeUniform,
      onAnimateUniform,
      onDirectorActiveChange
    ]
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
