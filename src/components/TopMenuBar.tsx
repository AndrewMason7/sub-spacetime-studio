import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Search,
  Maximize2,
  Camera,
  RotateCcw,
  Terminal,
  Sliders,
  CheckCircle2,
  Compass,
  Grid,
  EyeOff,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { CameraPresetId, SceneModeId } from '../types/workstation';
import { THEOREM_SCENES } from '../data/theoremsCatalog';

interface TopMenuBarProps {
  activeMode: SceneModeId;
  onSelectMode: (mode: SceneModeId) => void;
  isDirectorRunning: boolean;
  onToggleDirector: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenCommandPalette: () => void;
  onCameraPreset: (preset: CameraPresetId) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetUniforms: () => void;
  onCaptureFrame: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onHideDashboard: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  activeMode,
  onSelectMode,
  isDirectorRunning,
  onToggleDirector,
  isMuted,
  onToggleMute,
  onOpenCommandPalette,
  onCameraPreset,
  onZoomIn,
  onZoomOut,
  onResetUniforms,
  onCaptureFrame,
  gridVisible,
  onToggleGrid,
  autoRotate,
  onToggleAutoRotate,
  onHideDashboard
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const deckRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deckRef.current && !deckRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (name: string) => {
    setOpenMenu((prev) => (prev === name ? null : name));
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    setOpenMenu(null);
  };

  return (
    <header className="floating-command-deck" ref={deckRef}>
      <div className="deck-pill-pod">
        <div
          className="ws-window-dots"
          title="Native Fullscreen Toggle"
          onClick={handleFullscreen}
        >
          <span className="dot-close" />
          <span className="dot-min" />
          <span className="dot-max" />
        </div>

        <div className="ws-logo-mark">Ψ</div>
        <div className="ws-brand-stack">
          <span className="ws-app-name">SUB-SPACETIME</span>
          <span className="ws-version-tag">CLASSIFIED // v7.2</span>
        </div>

        <div className="deck-divider" />

        <div className="ws-menu-item-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className={`ws-menu-trigger ${openMenu === 'instrument' ? 'open' : ''}`}
            onClick={() => toggleMenu('instrument')}
          >
            Instrument
          </motion.button>
          <AnimatePresence>
            {openMenu === 'instrument' && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.14 }}
                className="ws-dropdown"
              >
                <button onClick={() => { onResetUniforms(); setOpenMenu(null); }}>
                  <RotateCcw size={14} strokeWidth={1.5} />
                  <span>Reset Telemetry Uniforms</span>
                  <kbd>R</kbd>
                </button>
                <button onClick={() => { onCaptureFrame(); setOpenMenu(null); }}>
                  <Camera size={14} strokeWidth={1.5} />
                  <span>Export ACES Filmic Frame (.PNG)</span>
                  <kbd>⌘P</kbd>
                </button>
                <div className="ws-dropdown-divider" />
                <button onClick={() => { onHideDashboard(); setOpenMenu(null); }}>
                  <EyeOff size={14} strokeWidth={1.5} />
                  <span>Hide Entire Dashboard (Pure 3D View)</span>
                  <kbd>H</kbd>
                </button>
                <button onClick={handleFullscreen}>
                  <Maximize2 size={14} strokeWidth={1.5} />
                  <span>Toggle Fullscreen Display</span>
                  <kbd>F11</kbd>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ws-menu-item-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className={`ws-menu-trigger ${openMenu === 'optics' ? 'open' : ''}`}
            onClick={() => toggleMenu('optics')}
          >
            Optics
          </motion.button>
          <AnimatePresence>
            {openMenu === 'optics' && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.14 }}
                className="ws-dropdown"
              >
                <button onClick={() => { onZoomIn(); setOpenMenu(null); }}>
                  <ZoomIn size={14} strokeWidth={1.5} />
                  <span>Zoom In (+25%)</span>
                  <kbd>+</kbd>
                </button>
                <button onClick={() => { onZoomOut(); setOpenMenu(null); }}>
                  <ZoomOut size={14} strokeWidth={1.5} />
                  <span>Zoom Out (-25%)</span>
                  <kbd>-</kbd>
                </button>
                <div className="ws-dropdown-divider" />
                <button onClick={() => { onCameraPreset('perspective'); setOpenMenu(null); }}>
                  <Compass size={14} strokeWidth={1.5} />
                  <span>Camera: Isometric Perspective (100%)</span>
                  <kbd>Num 0</kbd>
                </button>
                <button onClick={() => { onCameraPreset('top'); setOpenMenu(null); }}>
                  <Compass size={14} strokeWidth={1.5} />
                  <span>Camera: Orthogonal Zenith (+Y)</span>
                  <kbd>Num 7</kbd>
                </button>
                <button onClick={() => { onCameraPreset('front'); setOpenMenu(null); }}>
                  <Compass size={14} strokeWidth={1.5} />
                  <span>Camera: Orthogonal Meridian (+Z)</span>
                  <kbd>Num 1</kbd>
                </button>
                <button onClick={() => { onCameraPreset('closeup'); setOpenMenu(null); }}>
                  <Compass size={14} strokeWidth={1.5} />
                  <span>Camera: Singularity Macro</span>
                  <kbd>Num .</kbd>
                </button>
                <div className="ws-dropdown-divider" />
                <button onClick={() => { onToggleGrid(); setOpenMenu(null); }}>
                  <Grid size={14} strokeWidth={1.5} />
                  <span>{gridVisible ? '✓ ' : ''}Reference Horizon Grid</span>
                  <kbd>G</kbd>
                </button>
                <button onClick={() => { onToggleAutoRotate(); setOpenMenu(null); }}>
                  <Sliders size={14} strokeWidth={1.5} />
                  <span>{autoRotate ? '✓ ' : ''}Gimbal Orbital Tracking</span>
                  <kbd>O</kbd>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ws-menu-item-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className={`ws-menu-trigger ${openMenu === 'kernel' ? 'open' : ''}`}
            onClick={() => toggleMenu('kernel')}
          >
            Kernel
          </motion.button>
          <AnimatePresence>
            {openMenu === 'kernel' && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.14 }}
                className="ws-dropdown"
              >
                <button onClick={() => { onOpenCommandPalette(); setOpenMenu(null); }}>
                  <Terminal size={14} strokeWidth={1.5} />
                  <span>Open Raycast AST Command Palette...</span>
                  <kbd>⌘K</kbd>
                </button>
                <div className="ws-dropdown-divider" />
                <button disabled>
                  <CheckCircle2 size={14} strokeWidth={1.5} color="#34d399" />
                  <span>leanprover/lean4:v4.34.1 + Shiki AST</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="deck-pill-pod module-selector-pod">
        {(Object.keys(THEOREM_SCENES) as SceneModeId[]).map((mId, idx) => {
          const sc = THEOREM_SCENES[mId];
          const isActive = activeMode === mId;
          return (
            <motion.button
              key={mId}
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className={`deck-module-pill ${isActive ? 'active' : ''}`}
              style={
                {
                  '--pill-accent': sc.statusColor
                } as React.CSSProperties
              }
              onClick={() => onSelectMode(mId)}
            >
              <span
                className="pill-led-dot"
                style={{
                  backgroundColor: sc.statusColor,
                  boxShadow: isActive ? `0 0 8px ${sc.statusColor}` : 'none'
                }}
              />
              <span className="pill-idx">M0{idx + 1}</span>
              <span className="pill-label">{sc.shortTitle}</span>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="raycast-palette-pill"
        onClick={onOpenCommandPalette}
      >
        <Search size={13} strokeWidth={1.5} color="#7dd3fc" />
        <span className="raycast-placeholder">Search Lean 4 AST, GLB...</span>
        <kbd className="raycast-kbd">⌘K</kbd>
      </motion.button>

      <div className="deck-pill-pod">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className="ws-btn"
          onClick={onZoomIn}
          title="Zoom In 3D Viewport (+)"
        >
          <ZoomIn size={13} strokeWidth={1.5} color="#7dd3fc" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className="ws-btn"
          onClick={onZoomOut}
          title="Zoom Out 3D Viewport (-)"
        >
          <ZoomOut size={13} strokeWidth={1.5} color="#7dd3fc" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          className="ws-btn"
          onClick={onHideDashboard}
          title="Hide Entire Dashboard HUD for Pure 3D View (Shortcut: H)"
        >
          <EyeOff size={13} strokeWidth={1.5} color="#fbbf24" />
          <span>HIDE DASHBOARD</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className={`ws-btn ws-btn-primary ${isDirectorRunning ? 'active-sequence' : ''}`}
          onClick={onToggleDirector}
        >
          {isDirectorRunning ? (
            <Square size={13} strokeWidth={1.5} />
          ) : (
            <Play size={13} strokeWidth={1.5} />
          )}
          <span>{isDirectorRunning ? 'STOP' : 'TOUR'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          className="ws-btn"
          onClick={onToggleMute}
          title="Toggle Quantum Harmonic Audio"
          style={{
            borderColor: isMuted ? 'rgba(244, 63, 94, 0.35)' : 'rgba(52, 211, 153, 0.45)',
            color: isMuted ? '#fda4af' : '#6ee7b7'
          }}
        >
          {isMuted ? (
            <>
              <VolumeX size={13} strokeWidth={1.5} color="#f43f5e" />
              <span>MUTED</span>
            </>
          ) : (
            <>
              <Volume2 size={13} strokeWidth={1.5} color="#34d399" />
              <span>AUDIO</span>
            </>
          )}
        </motion.button>
      </div>
    </header>
  );
};
