import { useEffect, useRef } from 'react';
import { CameraPresetId, SceneModeId } from '../types/workstation';

export interface KeyboardShortcutHandlers {
  onToggleCommandPalette: () => void;
  onSelectMode: (mode: SceneModeId) => void;
  onToggleDashboardHidden: () => void;
  onToggleSideRacksHidden: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetUniforms: () => void;
  onTogglePause: () => void;
  onToggleGrid: () => void;
  onToggleAutoRotate: () => void;
  onToggleMute: () => void;
  onCaptureFrame: () => void;
  onCameraPreset: (preset: CameraPresetId) => void;
}

/**
 * Global keyboard shortcut hook for Sub-Spacetime Studio (`⌘K`, `⌘P`, `1-4`, `Num 0/7/1/3/.`, `H`, `Z`, `M`, `+/-`, `R`, `Space`, `G`, `O`)
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const h = handlersRef.current;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        h.onToggleCommandPalette();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        h.onCaptureFrame();
        return;
      }

      // Do not fire single-key shortcuts when command palette modal is open or user is typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        document.querySelector('.ws-modal-backdrop')
      ) {
        return;
      }

      // Guard against hijacking OS/browser modifier combinations (Cmd+R, Cmd+Z, Cmd+H, Cmd+1..4, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // Numpad camera preset shortcuts advertised in Optics menu
      if (e.code === 'Numpad0') {
        e.preventDefault();
        h.onCameraPreset('perspective');
        return;
      }
      if (e.code === 'Numpad7') {
        e.preventDefault();
        h.onCameraPreset('top');
        return;
      }
      if (e.code === 'Numpad1') {
        e.preventDefault();
        h.onCameraPreset('front');
        return;
      }
      if (e.code === 'Numpad3') {
        e.preventDefault();
        h.onCameraPreset('right');
        return;
      }
      if (e.code === 'NumpadDecimal' || e.code === 'NumpadPeriod') {
        e.preventDefault();
        h.onCameraPreset('closeup');
        return;
      }

      if (e.key === '1') h.onSelectMode('observer');
      else if (e.key === '2') h.onSelectMode('fkcrt');
      else if (e.key === '3') h.onSelectMode('hologram');
      else if (e.key === '4') h.onSelectMode('retraction');
      else if (e.key === '5') h.onSelectMode('associahedron');
      else if (e.key.toLowerCase() === 'h') h.onToggleDashboardHidden();
      else if (e.key.toLowerCase() === 'z') h.onToggleSideRacksHidden();
      else if (e.key.toLowerCase() === 'm') h.onToggleMute();
      else if (e.key === '+' || e.key === '=') h.onZoomIn();
      else if (e.key === '-' || e.key === '_') h.onZoomOut();
      else if (e.key.toLowerCase() === 'r') h.onResetUniforms();
      else if (e.key === ' ') {
        e.preventDefault();
        h.onTogglePause();
      } else if (e.key.toLowerCase() === 'g') h.onToggleGrid();
      else if (e.key.toLowerCase() === 'o') h.onToggleAutoRotate();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
