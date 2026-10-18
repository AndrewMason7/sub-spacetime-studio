import { useState, useRef, useCallback, useEffect } from 'react';
import { SceneModeId, SimulationUniformState } from '../types/workstation';

export interface DirectorTourCallbacks {
  onInitAudio: () => void;
  onSelectMode: (mode: SceneModeId) => void;
  onChangeUniform: (key: keyof SimulationUniformState, val: number) => void;
  onAnimateUniform: (
    key: keyof SimulationUniformState,
    target: number,
    durationMs: number
  ) => void;
}

export interface DirectorTourState {
  isDirectorRunning: boolean;
  tourStatusText: string | null;
  startDirectorTour: () => void;
  stopDirectorTour: () => void;
}

export function useDirectorTour(callbacks: DirectorTourCallbacks): DirectorTourState {
  const { onInitAudio, onSelectMode, onChangeUniform, onAnimateUniform } = callbacks;
  const [isDirectorRunning, setIsDirectorRunning] = useState(false);
  const [tourStatusText, setTourStatusText] = useState<string | null>(null);
  const directorTimerRef = useRef<number[]>([]);

  const stopDirectorTour = useCallback(() => {
    directorTimerRef.current.forEach((id) => clearTimeout(id));
    directorTimerRef.current = [];
    setIsDirectorRunning(false);
    setTourStatusText(null);
  }, []);

  const startDirectorTour = useCallback(() => {
    stopDirectorTour();
    onInitAudio();
    setIsDirectorRunning(true);
    setTourStatusText('STEP 1/4: OBSERVER WORLDLINE EXPANSION (M01)');

    onSelectMode('observer');
    onChangeUniform('observerEntropy', 0.0);

    const schedule = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms);
      directorTimerRef.current.push(id);
    };

    schedule(800, () => onAnimateUniform('observerEntropy', 10.4, 3000));
    schedule(4200, () => onAnimateUniform('manifoldMorph', 1.75, 2200));

    schedule(7200, () => {
      setTourStatusText('STEP 2/4: FK-CRT PHASE TRANSITION AT q = 4.0 (M02)');
      onSelectMode('fkcrt');
      onChangeUniform('clusterParameterQ', 1.8);
    });
    schedule(8200, () => onAnimateUniform('clusterParameterQ', 7.2, 3600));

    schedule(13000, () => {
      setTourStatusText('STEP 3/4: CKS HORIZON & 105-QUBIT WILLOW CODE (M03)');
      onSelectMode('hologram');
      onChangeUniform('bondiMass', 0.6);
    });
    schedule(14000, () => {
      onAnimateUniform('bondiMass', 2.35, 3200);
      onAnimateUniform('boundaryQubitFlux', 2.9, 3200);
    });

    schedule(18500, () => {
      setTourStatusText('STEP 4/4: F032 SIGN-ERROR K3 SHATTER (+1 → -1) (M04)');
      onSelectMode('retraction');
      onChangeUniform('stabilizationSign', 1.0);
    });
    schedule(19800, () => onAnimateUniform('stabilizationSign', -1.0, 2000));
    schedule(24000, () => stopDirectorTour());
  }, [onInitAudio, onSelectMode, onChangeUniform, onAnimateUniform, stopDirectorTour]);

  useEffect(() => {
    return () => {
      directorTimerRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  return {
    isDirectorRunning,
    tourStatusText,
    startDirectorTour,
    stopDirectorTour
  };
}
