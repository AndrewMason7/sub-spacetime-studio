import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Box,
  Sliders,
  FileCode,
  Activity,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Compass,
  X
} from 'lucide-react';
import './styles/workstation.css';
import { THEOREM_SCENES } from './data/theoremsCatalog';
import {
  CameraPresetId,
  SceneModeId,
  SimulationUniformState
} from './types/workstation';
import { QuantumSpacetimeEngine } from './engine/QuantumSpacetimeEngine';
import { AudioSynthesizer } from './engine/AudioSynthesizer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDirectorTour } from './hooks/useDirectorTour';
import { TopMenuBar } from './components/TopMenuBar';
import { LeftParameterDock } from './components/LeftParameterDock';
import { Viewport3DStage } from './components/Viewport3DStage';
import { RightLeanIDE } from './components/RightLeanIDE';
import { BottomTimelineDock } from './components/BottomTimelineDock';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ErrorBoundary } from './components/ErrorBoundary';

const DEFAULT_UNIFORMS: SimulationUniformState = {
  observerEntropy: 8.4,
  wormholeCoupling: 1.0,
  manifoldMorph: 0.65,
  clusterParameterQ: 2.2,
  excursionRoughness: 1.15,
  planarEdgesN: 3.2,
  bondiMass: 1.2,
  boundaryQubitFlux: 1.6,
  kerrSpin: 0.72,
  stabilizationSign: 1.0,
  doublePointCountM: 6.0,
  calabiYauSlice: 1.57,
  associahedronOrder: 4.0,
  projectionSweep: 0.5,
  facetResidueFocus: 0.15
};

const SINGLETON_AUDIO = AudioSynthesizer.getInstance();

const checkMobileEnv = () => {
  if (typeof window === 'undefined') return false;
  const isMobileUA = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isNarrow = window.innerWidth <= 1024;
  return isMobileUA || (isTouch && isNarrow) || window.innerWidth <= 768;
};

const WorkstationApp: React.FC = () => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<QuantumSpacetimeEngine | null>(null);
  const audioRef = useRef<AudioSynthesizer>(SINGLETON_AUDIO);
  const animTokenMapRef = useRef<Record<string, number>>({});

  const [isMobile, setIsMobile] = useState(checkMobileEnv);
  const [activeMode, setActiveMode] = useState<SceneModeId>('observer');
  const [uniforms, setUniforms] = useState<SimulationUniformState>(DEFAULT_UNIFORMS);
  const [openFileIds, setOpenFileIds] = useState<string[]>([
    'einstein-four-classification',
    'fkcrt-lean',
    'cks-bondi-penrose',
    'f032-withdrawal-notice',
    'associahedron-lean'
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('einstein-four-classification');
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraPresetId | null>('perspective');

  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1.0);
  const [gridVisible, setGridVisible] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [sideRacksHidden, setSideRacksHidden] = useState(false);
  const [dashboardHidden, setDashboardHidden] = useState(false);
  const [zoomPct, setZoomPct] = useState(100);
  const [highlightedSliderIdx, setHighlightedSliderIdx] = useState<number | null>(null);
  const [fps, setFps] = useState(60.0);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'stage' | 'params' | 'ide' | 'scope'>('stage');

  useEffect(() => {
    const handleDeviceResize = () => {
      setIsMobile(checkMobileEnv());
    };
    window.addEventListener('resize', handleDeviceResize);
    window.addEventListener('orientationchange', handleDeviceResize);
    return () => {
      window.removeEventListener('resize', handleDeviceResize);
      window.removeEventListener('orientationchange', handleDeviceResize);
    };
  }, []);

  useEffect(() => {
    if (!viewportRef.current) return;
    const engine = new QuantumSpacetimeEngine(viewportRef.current);
      (window as unknown as Record<string, unknown>).__engine = engine;
    engineRef.current = engine;

    let animId = 0;
    let lastUiSyncTime = 0;
    let prevFps = 60.0;
    let prevZoom = 100;

    const loop = (now: number) => {
      engine.update();
      if (now - lastUiSyncTime >= 250) {
        lastUiSyncTime = now;
        const currentFps = Math.round(engine.fps * 10) / 10;
        const currentZoom = engine.getZoomPercentage();
        if (Math.abs(currentFps - prevFps) >= 0.3) {
          prevFps = currentFps;
          setFps(currentFps);
        }
        if (currentZoom !== prevZoom) {
          prevZoom = currentZoom;
          setZoomPct(currentZoom);
        }
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const handleResize = () => engine.onResize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      engine.dispose();
      audioRef.current.dispose();
    };
  }, []);

  const cancelAllUniformAnimations = useCallback(() => {
    for (const key of Object.keys(DEFAULT_UNIFORMS)) {
      animTokenMapRef.current[key] = (animTokenMapRef.current[key] || 0) + 1;
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      audioRef.current.setMuted(next);
      return next;
    });
  }, []);

  const handleCameraPreset = useCallback((preset: CameraPresetId) => {
    setActiveCameraPreset(preset);
    engineRef.current?.setCameraPreset(preset);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!engineRef.current) return;
    audioRef.current.playTactileTick(1.2);
    const nextPct = engineRef.current.zoomByFactor(0.76);
    setZoomPct(nextPct);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!engineRef.current) return;
    audioRef.current.playTactileTick(0.85);
    const nextPct = engineRef.current.zoomByFactor(1.32);
    setZoomPct(nextPct);
  }, []);

  const handleOpenLeanFile = useCallback((fileId: string) => {
    setOpenFileIds((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
    setActiveFileId(fileId);
  }, []);

  const handleCloseFileTab = useCallback(
    (fileId: string) => {
      setOpenFileIds((prev) => {
        const filtered = prev.filter((id) => id !== fileId);
        if (activeFileId === fileId && filtered.length > 0) {
          setActiveFileId(filtered[filtered.length - 1]);
        }
        return filtered;
      });
    },
    [activeFileId]
  );

  const handleSelectMode = useCallback(
    (mode: SceneModeId, targetFileId?: string) => {
      audioRef.current.init();
      setActiveMode(mode);
      engineRef.current?.setMode(mode);
      const fileToOpen = targetFileId || THEOREM_SCENES[mode].defaultFileId;
      handleOpenLeanFile(fileToOpen);
      audioRef.current.triggerShockwave(mode === 'retraction' ? 'shatter' : 'phase');
    },
    [handleOpenLeanFile]
  );

  const handleChangeUniform = useCallback(
    (key: keyof SimulationUniformState, val: number) => {
      audioRef.current.init();
      setUniforms((prev) => {
        const oldVal = prev[key];
        const next = { ...prev, [key]: val };
        if (engineRef.current) {
          engineRef.current.state[key] = val;
        }
        if (key === 'observerEntropy' && oldVal < 0.2 && val >= 0.2) {
          engineRef.current?.triggerShockwave();
          audioRef.current.triggerShockwave('ignition');
        } else if (
          key === 'clusterParameterQ' &&
          ((oldVal <= 4.0 && val > 4.0) || (oldVal > 4.0 && val <= 4.0))
        ) {
          engineRef.current?.triggerShockwave();
          audioRef.current.triggerShockwave('phase');
        } else if (
          key === 'stabilizationSign' &&
          ((oldVal >= 0.0 && val < 0.0) || (oldVal < 0.0 && val >= 0.0))
        ) {
          engineRef.current?.triggerShockwave();
          audioRef.current.triggerShockwave('shatter');
        }

        if (
          key === 'observerEntropy' ||
          key === 'wormholeCoupling' ||
          key === 'manifoldMorph'
        ) {
          audioRef.current.modulateFromPhysics(
            'observer',
            next.observerEntropy / 12.0,
            next.observerEntropy > 0.2
          );
        } else if (
          key === 'clusterParameterQ' ||
          key === 'excursionRoughness' ||
          key === 'planarEdgesN'
        ) {
          audioRef.current.modulateFromPhysics(
            'fkcrt',
            (next.clusterParameterQ - 0.5) / 7.5,
            next.clusterParameterQ > 4.0
          );
        } else if (
          key === 'bondiMass' ||
          key === 'boundaryQubitFlux' ||
          key === 'kerrSpin'
        ) {
          audioRef.current.modulateFromPhysics(
            'hologram',
            next.bondiMass / 2.5,
            false
          );
        } else if (
          key === 'associahedronOrder' ||
          key === 'projectionSweep' ||
          key === 'facetResidueFocus'
        ) {
          audioRef.current.modulateFromPhysics(
            'associahedron',
            Math.min(1, next.projectionSweep),
            next.associahedronOrder >= 5
          );
        } else if (
          key === 'stabilizationSign' ||
          key === 'doublePointCountM' ||
          key === 'calabiYauSlice'
        ) {
          audioRef.current.modulateFromPhysics(
            'retraction',
            Math.abs(next.stabilizationSign),
            next.stabilizationSign < 0
          );
        }

        return next;
      });
    },
    []
  );

  const animateUniform = useCallback(
    (key: keyof SimulationUniformState, target: number, durationMs: number) => {
      const token = (animTokenMapRef.current[key] || 0) + 1;
      animTokenMapRef.current[key] = token;
      const start = engineRef.current ? engineRef.current.state[key] : DEFAULT_UNIFORMS[key];
      const startTime = performance.now();
      const step = (now: number) => {
        if (animTokenMapRef.current[key] !== token) return;
        const t = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = start + (target - start) * eased;
        handleChangeUniform(key, current);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    [handleChangeUniform]
  );

  const handleTriggerQuickAction = useCallback(
    (mode: SceneModeId) => {
      audioRef.current.init();
      setHighlightedSliderIdx(0);
      const s = engineRef.current?.state || uniforms;
      if (mode === 'observer') {
        animateUniform('observerEntropy', s.observerEntropy < 2.0 ? 9.6 : 0.0, 1300);
      } else if (mode === 'fkcrt') {
        animateUniform('clusterParameterQ', s.clusterParameterQ <= 4.0 ? 6.8 : 2.0, 1200);
      } else if (mode === 'hologram') {
        const expand = s.bondiMass < 1.8;
        animateUniform('bondiMass', expand ? 2.25 : 0.85, 1100);
        animateUniform('boundaryQubitFlux', expand ? 2.85 : 1.35, 1100);
      } else if (mode === 'retraction') {
        animateUniform('stabilizationSign', s.stabilizationSign >= 0 ? -1.0 : 1.0, 900);
      } else if (mode === 'associahedron') {
        const n = Math.round(s.associahedronOrder);
        animateUniform('associahedronOrder', n < 6 ? n + 1 : 4, 700);
      }
    },
    [animateUniform, uniforms]
  );

  const {
    isDirectorRunning,
    tourActIndex,
    tourProgressPct,
    tourStatusText,
    tourNarration,
    startDirectorTour,
    jumpToTourAct,
    scrubDirectorTour,
    stopDirectorTour
  } = useDirectorTour({
    onInitAudio: () => audioRef.current.init(),
    onSelectMode: handleSelectMode,
    onChangeUniform: handleChangeUniform,
    onAnimateUniform: animateUniform,
    onCancelUniformAnimations: cancelAllUniformAnimations,
    onCameraPreset: handleCameraPreset,
    onHighlightSlider: setHighlightedSliderIdx,
    onDirectorActiveChange: (active) => engineRef.current?.setDirectorTourMode(active)
  });

  const handleUserSelectMode = useCallback(
    (mode: SceneModeId, targetFileId?: string) => {
      stopDirectorTour();
      handleSelectMode(mode, targetFileId);
    },
    [stopDirectorTour, handleSelectMode]
  );

  const handleResetUniforms = useCallback(() => {
    stopDirectorTour();
    cancelAllUniformAnimations();
    setUniforms(DEFAULT_UNIFORMS);
    if (engineRef.current) {
      engineRef.current.state = { ...DEFAULT_UNIFORMS };
    }
  }, [stopDirectorTour, cancelAllUniformAnimations]);

  const handleTogglePause = useCallback(() => {
    setIsPaused((p) => {
      const next = !p;
      if (engineRef.current) engineRef.current.isPaused = next;
      return next;
    });
  }, []);

  const handleToggleGrid = useCallback(() => {
    setGridVisible((g) => {
      const next = !g;
      engineRef.current?.setGridVisible(next);
      return next;
    });
  }, []);

  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate((o) => {
      const next = !o;
      engineRef.current?.setAutoRotate(next);
      return next;
    });
  }, []);

  const handleCaptureFrame = useCallback(() => {
    if (!engineRef.current) return;
    const url = engineRef.current.captureSnapshotDataUrl();
    const a = document.createElement('a');
    a.href = url;
    a.download = `sub-spacetime-${activeMode}-${Date.now()}.png`;
    a.click();
  }, [activeMode]);

  useKeyboardShortcuts({
    onToggleCommandPalette: () => setCmdOpen((v) => !v),
    onSelectMode: handleUserSelectMode,
    onToggleDashboardHidden: () => setDashboardHidden((d) => !d),
    onToggleSideRacksHidden: () => setSideRacksHidden((z) => !z),
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onResetUniforms: handleResetUniforms,
    onTogglePause: handleTogglePause,
    onToggleGrid: handleToggleGrid,
    onToggleAutoRotate: handleToggleAutoRotate,
    onToggleMute: handleToggleMute,
    onCaptureFrame: handleCaptureFrame,
    onCameraPreset: handleCameraPreset
  });

  const handleJumpToKeyframe = useCallback(
    (pct: number) => {
      stopDirectorTour();
      setHighlightedSliderIdx(0);
      if (activeMode === 'observer') {
        animateUniform('observerEntropy', pct * 12.0, 750);
      } else if (activeMode === 'fkcrt') {
        animateUniform('clusterParameterQ', 0.5 + pct * 7.5, 750);
      } else if (activeMode === 'hologram') {
        animateUniform('bondiMass', 0.25 + pct * 2.25, 750);
      } else if (activeMode === 'retraction') {
        animateUniform('stabilizationSign', 1.0 - pct * 2.0, 750);
      } else if (activeMode === 'associahedron') {
        animateUniform('projectionSweep', pct, 750);
        animateUniform('facetResidueFocus', (pct * 3) % 1, 750);
      }
    },
    [activeMode, animateUniform, stopDirectorTour]
  );

  const getSimTime = useCallback(() => engineRef.current?.getSimTime() || 0, []);
  const handleScrubSimTime = useCallback((t: number) => engineRef.current?.setSimTime(t), []);

  const meta = THEOREM_SCENES[activeMode];

  return (
    <div
      className={`spatial-instrument-shell ${
        isMobile ? 'is-mobile-device' : ''
      } ${sideRacksHidden ? 'zen-theater-active' : ''} ${
        dashboardHidden ? 'pure-3d-active' : ''
      }`}
    >
      <Viewport3DStage
        viewportRef={viewportRef}
        activeMode={activeMode}
        meta={meta}
        uniforms={uniforms}
        activeCameraPreset={activeCameraPreset}
        onCameraPreset={handleCameraPreset}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        zoomPct={zoomPct}
        gridVisible={gridVisible}
        onToggleGrid={handleToggleGrid}
        autoRotate={autoRotate}
        onToggleAutoRotate={handleToggleAutoRotate}
        onCaptureFrame={handleCaptureFrame}
        dashboardHidden={dashboardHidden}
        onToggleDashboardHidden={() => setDashboardHidden((d) => !d)}
        sideRacksHidden={sideRacksHidden}
        onToggleSideRacksHidden={() => setSideRacksHidden((s) => !s)}
        onSelectMode={handleUserSelectMode}
        isDirectorRunning={isDirectorRunning}
        tourActIndex={tourActIndex}
        tourProgressPct={tourProgressPct}
        tourNarration={tourNarration}
        onJumpToTourAct={jumpToTourAct}
        onScrubDirectorTour={scrubDirectorTour}
        onStopDirectorTour={stopDirectorTour}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isMobile={isMobile}
      />

      {/* MOBILE-ONLY TOP BAR & NAVIGATION */}
      {isMobile && (
        <header className="mobile-top-bar">
          <div className="mobile-top-brand">
            <span className="mobile-brand-title">SUB-SPACETIME</span>
            <span
              className="mobile-brand-tag"
              style={{
                color: meta.statusColor,
                borderColor: `${meta.statusColor}44`,
                background: `${meta.statusColor}18`
              }}
            >
              {meta.badgeNumber.split(' ')[0] || 'M01'}
            </span>
          </div>

          <div className="mobile-module-selector">
            {(Object.keys(THEOREM_SCENES) as SceneModeId[]).map((mId, idx) => (
              <button
                key={mId}
                type="button"
                className={`mobile-mod-btn ${activeMode === mId ? 'active' : ''}`}
                onClick={() => handleUserSelectMode(mId)}
                style={{
                  '--mod-accent': THEOREM_SCENES[mId].statusColor
                } as React.CSSProperties}
              >
                <span
                  className="mobile-mod-dot"
                  style={{ backgroundColor: THEOREM_SCENES[mId].statusColor }}
                />
                <span>M0{idx + 1}</span>
              </button>
            ))}
          </div>

          <div className="mobile-top-actions">
            <button
              type="button"
              className={`mobile-top-tour-btn ${isDirectorRunning ? 'running' : ''}`}
              onClick={() => {
                if (isDirectorRunning) {
                  stopDirectorTour();
                } else {
                  startDirectorTour(0);
                }
              }}
              title={isDirectorRunning ? 'Stop Tour' : 'Start 360° Director Tour'}
            >
              {isDirectorRunning ? (
                <>
                  <Square size={11} strokeWidth={2} />
                  <span>STOP</span>
                </>
              ) : (
                <>
                  <Play size={11} strokeWidth={2} fill="currentColor" />
                  <span>TOUR</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="mobile-top-icon-btn"
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              style={{
                color: isMuted ? '#fda4af' : '#6ee7b7'
              }}
            >
              {isMuted ? <VolumeX size={13} strokeWidth={1.8} /> : <Volume2 size={13} strokeWidth={1.8} />}
            </button>
          </div>
        </header>
      )}

      {/* MOBILE FLOATING STAGE QUICK CONTROLS (Active when on 3D Stage) */}
      {isMobile && mobileActiveTab === 'stage' && (
        <div className="mobile-stage-floating-hud">
          <div className="mobile-stage-title-pill">
            <span
              className="mobile-status-glow"
              style={{ backgroundColor: meta.statusColor, color: meta.statusColor }}
            />
            <span className="mobile-stage-name">{meta.shortTitle}</span>
            <span className="mobile-stage-invariant">
              {meta.badgeNumber.split(' // ')[1] || meta.subtitle}
            </span>
          </div>

          <div className="mobile-stage-cam-controls">
            <button
              type="button"
              onClick={() => handleCameraPreset('perspective')}
              className="mobile-stage-tool-btn"
              title="Reset Camera Preset"
            >
              <RotateCcw size={12} strokeWidth={1.8} />
              <span>Reset</span>
            </button>
            <div className="mobile-stage-tool-divider" />
            <button
              type="button"
              onClick={handleZoomIn}
              className="mobile-stage-tool-btn"
              title="Zoom In"
            >
              <ZoomIn size={12} strokeWidth={1.8} />
              <span>+</span>
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="mobile-stage-tool-btn"
              title="Zoom Out"
            >
              <ZoomOut size={12} strokeWidth={1.8} />
              <span>−</span>
            </button>
            <div className="mobile-stage-tool-divider" />
            <button
              type="button"
              onClick={handleToggleAutoRotate}
              className={`mobile-stage-tool-btn ${autoRotate ? 'active' : ''}`}
              title="Toggle Auto Rotation"
            >
              <Compass size={12} strokeWidth={1.8} />
              <span>{autoRotate ? 'Orbit' : 'Static'}</span>
            </button>
            <button
              type="button"
              onClick={handleTogglePause}
              className={`mobile-stage-tool-btn ${isPaused ? 'paused' : ''}`}
              title="Toggle Pause / Live Clock"
            >
              {isPaused ? <Play size={12} strokeWidth={1.8} /> : <Pause size={12} strokeWidth={1.8} />}
              <span>{isPaused ? 'Paused' : 'Live'}</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE SLIDING BOTTOM SHEET (For Parameters, Lean 4 IDE, or Telemetry) */}
      {isMobile && mobileActiveTab !== 'stage' && (
        <div
          className="mobile-bottom-sheet-backdrop"
          onClick={() => setMobileActiveTab('stage')}
        >
          <div
            className="mobile-bottom-sheet-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="mobile-sheet-drag-handle"
              onClick={() => setMobileActiveTab('stage')}
            />

            <div className="mobile-sheet-header">
              <div className="mobile-sheet-title-group">
                <span
                  className="mobile-sheet-badge"
                  style={{
                    color: meta.statusColor
                  }}
                >
                  {mobileActiveTab === 'params'
                    ? 'PHYSICS INSTRUMENT RACK'
                    : mobileActiveTab === 'ide'
                    ? 'FORMAL LEAN 4 VERIFICATION'
                    : 'TEKTRONIX CRT TELEMETRY'}
                </span>
                <h3 className="mobile-sheet-title">
                  {mobileActiveTab === 'params'
                    ? `${meta.badgeNumber} · Differential Sliders`
                    : mobileActiveTab === 'ide'
                    ? 'Lean 4 Formal Proof Inspector'
                    : 'Real-Time CRT Waveform & Vault'}
                </h3>
              </div>
              <button
                type="button"
                className="mobile-sheet-close-btn"
                onClick={() => setMobileActiveTab('stage')}
                aria-label="Close sheet"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div className="mobile-sheet-body">
              {mobileActiveTab === 'params' && (
                <LeftParameterDock
                  activeMode={activeMode}
                  meta={meta}
                  uniforms={uniforms}
                  onChangeUniform={handleChangeUniform}
                  onTriggerQuickAction={handleTriggerQuickAction}
                  activeFileId={activeFileId}
                  onSelectFile={handleOpenLeanFile}
                  onSelectMode={handleUserSelectMode}
                  onHoverOrScrubSlider={setHighlightedSliderIdx}
                  highlightedSliderIdx={highlightedSliderIdx}
                />
              )}

              {mobileActiveTab === 'ide' && (
                <RightLeanIDE
                  meta={meta}
                  uniforms={uniforms}
                  openFileIds={openFileIds}
                  activeFileId={activeFileId}
                  onSelectFile={handleOpenLeanFile}
                  onSelectMode={handleUserSelectMode}
                  onCloseFileTab={handleCloseFileTab}
                  highlightedSliderIdx={highlightedSliderIdx}
                />
              )}

              {mobileActiveTab === 'scope' && (
                <LeftParameterDock
                  activeMode={activeMode}
                  meta={meta}
                  uniforms={uniforms}
                  onChangeUniform={handleChangeUniform}
                  onTriggerQuickAction={handleTriggerQuickAction}
                  activeFileId={activeFileId}
                  onSelectFile={handleOpenLeanFile}
                  onSelectMode={handleUserSelectMode}
                  onHoverOrScrubSlider={setHighlightedSliderIdx}
                  highlightedSliderIdx={highlightedSliderIdx}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE PINNED BOTTOM NAVIGATION BAR */}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          <button
            type="button"
            className={`mobile-nav-tab ${mobileActiveTab === 'stage' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab('stage')}
          >
            <Box size={18} strokeWidth={mobileActiveTab === 'stage' ? 2.2 : 1.7} />
            <span>3D Stage</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-tab ${mobileActiveTab === 'params' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab((prev) => (prev === 'params' ? 'stage' : 'params'))}
          >
            <Sliders size={18} strokeWidth={mobileActiveTab === 'params' ? 2.2 : 1.7} />
            <span>Parameters</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-tab ${mobileActiveTab === 'ide' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab((prev) => (prev === 'ide' ? 'stage' : 'ide'))}
          >
            <FileCode size={18} strokeWidth={mobileActiveTab === 'ide' ? 2.2 : 1.7} />
            <span>Lean 4 Proof</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-tab ${mobileActiveTab === 'scope' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab((prev) => (prev === 'scope' ? 'stage' : 'scope'))}
          >
            <Activity size={18} strokeWidth={mobileActiveTab === 'scope' ? 2.2 : 1.7} />
            <span>Telemetry</span>
          </button>
        </nav>
      )}

      {!isMobile && !dashboardHidden && (
        <TopMenuBar
          activeMode={activeMode}
          onSelectMode={handleUserSelectMode}
          isDirectorRunning={isDirectorRunning}
          onToggleDirector={() =>
            isDirectorRunning ? stopDirectorTour() : startDirectorTour(0)
          }
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenCommandPalette={() => setCmdOpen(true)}
          onCameraPreset={handleCameraPreset}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetUniforms={handleResetUniforms}
          onCaptureFrame={handleCaptureFrame}
          gridVisible={gridVisible}
          onToggleGrid={handleToggleGrid}
          autoRotate={autoRotate}
          onToggleAutoRotate={handleToggleAutoRotate}
          onHideDashboard={() => setDashboardHidden(true)}
        />
      )}

      {!isMobile && !dashboardHidden && !sideRacksHidden && (
        <LeftParameterDock
          activeMode={activeMode}
          meta={meta}
          uniforms={uniforms}
          onChangeUniform={handleChangeUniform}
          onTriggerQuickAction={handleTriggerQuickAction}
          activeFileId={activeFileId}
          onSelectFile={handleOpenLeanFile}
          onSelectMode={handleUserSelectMode}
          onHoverOrScrubSlider={setHighlightedSliderIdx}
          highlightedSliderIdx={highlightedSliderIdx}
        />
      )}

      {!isMobile && !dashboardHidden && !sideRacksHidden && (
        <RightLeanIDE
          meta={meta}
          uniforms={uniforms}
          openFileIds={openFileIds}
          activeFileId={activeFileId}
          onSelectFile={handleOpenLeanFile}
          onSelectMode={handleUserSelectMode}
          onCloseFileTab={handleCloseFileTab}
          highlightedSliderIdx={highlightedSliderIdx}
        />
      )}

      {!isMobile && !dashboardHidden && (
        <BottomTimelineDock
          activeMode={activeMode}
          meta={meta}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          timeScale={timeScale}
          onChangeTimeScale={(spd) => {
            setTimeScale(spd);
            if (engineRef.current) engineRef.current.timeScale = spd;
          }}
          getSimTime={getSimTime}
          onScrubSimTime={handleScrubSimTime}
          fps={fps}
          onJumpToKeyframe={handleJumpToKeyframe}
          tourStatusText={tourStatusText}
        />
      )}

      <CommandPaletteModal
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onSelectMode={handleUserSelectMode}
        onOpenLeanFile={handleOpenLeanFile}
        onTriggerQuickAction={handleTriggerQuickAction}
      />
    </div>
  );
};

const rootEl = document.getElementById('app')!;
createRoot(rootEl).render(
  <ErrorBoundary>
    <WorkstationApp />
  </ErrorBoundary>
);
