import { useEffect } from 'react';
import { SceneModeId } from '../types/workstation';

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
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
  const {
    onToggleCommandPalette,
    onSelectMode,
    onToggleDashboardHidden,
    onToggleSideRacksHidden,
    onZoomIn,
    onZoomOut,
    onResetUniforms,
    onTogglePause,
    onToggleGrid,
    onToggleAutoRotate
  } = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggleCommandPalette();
        return;
      }
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === '1') onSelectMode('observer');
      else if (e.key === '2') onSelectMode('fkcrt');
      else if (e.key === '3') onSelectMode('hologram');
      else if (e.key === '4') onSelectMode('retraction');
      else if (e.key.toLowerCase() === 'h') onToggleDashboardHidden();
      else if (e.key.toLowerCase() === 'z') onToggleSideRacksHidden();
      else if (e.key === '+' || e.key === '=') onZoomIn();
      else if (e.key === '-' || e.key === '_') onZoomOut();
      else if (e.key.toLowerCase() === 'r') onResetUniforms();
      else if (e.key === ' ') {
        e.preventDefault();
        onTogglePause();
      } else if (e.key.toLowerCase() === 'g') onToggleGrid();
      else if (e.key.toLowerCase() === 'o') onToggleAutoRotate();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    onToggleCommandPalette,
    onSelectMode,
    onToggleDashboardHidden,
    onToggleSideRacksHidden,
    onZoomIn,
    onZoomOut,
    onResetUniforms,
    onTogglePause,
    onToggleGrid,
    onToggleAutoRotate
  ]);
}
