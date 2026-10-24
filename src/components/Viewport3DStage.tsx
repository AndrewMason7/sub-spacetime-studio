import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import katex from 'katex';
import {
  Grid,
  Compass,
  Camera,
  Box,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  EyeOff,
  Eye,
  PanelLeftClose,
  PanelRightClose,
  Film,
  Square,
  Volume2,
  VolumeX,
  Sigma
} from 'lucide-react';
import {
  CameraPresetId,
  SceneModeId,
  SimulationUniformState,
  TheoremMetadata
} from '../types/workstation';
import { THEOREM_SCENES } from '../data/theoremsCatalog';
import { computeViewportTelemetry } from '../services/physicsTelemetryService';

interface Viewport3DStageProps {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  activeMode: SceneModeId;
  meta: TheoremMetadata;
  uniforms: SimulationUniformState;
  activeCameraPreset?: CameraPresetId | null;
  onCameraPreset: (preset: CameraPresetId) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomPct: number;
  gridVisible: boolean;
  onToggleGrid: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onCaptureFrame: () => void;
  dashboardHidden: boolean;
  onToggleDashboardHidden: () => void;
  sideRacksHidden: boolean;
  onToggleSideRacksHidden: () => void;
  onSelectMode: (mode: SceneModeId) => void;
  isDirectorRunning?: boolean;
  tourActIndex?: number;
  tourProgressPct?: number;
  tourNarration?: string | null;
  onJumpToTourAct?: (actIdx: number) => void;
  onStopDirectorTour?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isMobile?: boolean;
}

const TOUR_ACT_LABELS = [
  'ACT I · M01',
  'ACT II · M02',
  'ACT III · M03',
  'ACT IV · M04',
  'ACT V · M05'
];

export const Viewport3DStage: React.FC<Viewport3DStageProps> = ({
  viewportRef,
  activeMode,
  meta,
  uniforms,
  activeCameraPreset = 'perspective',
  onCameraPreset,
  onZoomIn,
  onZoomOut,
  zoomPct,
  gridVisible,
  onToggleGrid,
  autoRotate,
  onToggleAutoRotate,
  onCaptureFrame,
  dashboardHidden,
  onToggleDashboardHidden,
  sideRacksHidden,
  onToggleSideRacksHidden,
  onSelectMode,
  isDirectorRunning = false,
  tourActIndex = 0,
  tourProgressPct = 0,
  tourNarration = null,
  onJumpToTourAct,
  onStopDirectorTour,
  isMuted = false,
  onToggleMute,
  isMobile = false
}) => {
  const [showFormulaOverlay, setShowFormulaOverlay] = useState(false);
  const kPrimaryRef = useRef<HTMLDivElement>(null);
  const kSecondaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFormulaOverlay) return;
    if (kPrimaryRef.current) {
      katex.render(meta.latexPrimary, kPrimaryRef.current, {
        displayMode: false,
        throwOnError: false
      });
    }
    if (kSecondaryRef.current) {
      katex.render(meta.latexSecondary, kSecondaryRef.current, {
        displayMode: false,
        throwOnError: false
      });
    }
  }, [meta, dashboardHidden, showFormulaOverlay]);

  const { invariantStr, topologyStr, glbMeshName } = computeViewportTelemetry(
    activeMode,
    uniforms
  );

  return (
    <div className="fullscreen-3d-stage">
      {/* FULL-BLEED 100VW × 100VH WEBGL2 CANVAS */}
      <div id="canvas-viewport" ref={viewportRef} />

      {!isMobile && dashboardHidden ? (
        <div className="pure-3d-floating-dock">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="pure-3d-restore-btn"
            onClick={onToggleDashboardHidden}
            title="Show Full Instrument Dashboard (Shortcut: H)"
          >
            <Eye size={14} strokeWidth={1.5} color="#7dd3fc" />
            <span>SHOW DASHBOARD</span>
          </motion.button>

          <span className="vp-tool-sep" />

          <button
            type="button"
            className="vp-tool-btn zoom-highlight"
            onClick={onZoomIn}
            title="Zoom In (+)"
          >
            <ZoomIn size={13} strokeWidth={1.5} />
            <span>+</span>
          </button>

          <span className="zoom-pct-readout">{zoomPct}%</span>

          <button
            type="button"
            className="vp-tool-btn zoom-highlight"
            onClick={onZoomOut}
            title="Zoom Out (-)"
          >
            <ZoomOut size={13} strokeWidth={1.5} />
            <span>−</span>
          </button>

          <button
            type="button"
            className="vp-tool-btn"
            onClick={() => onCameraPreset('perspective')}
            title="Reset Camera to 100%"
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            <span>RESET</span>
          </button>

          <span className="vp-tool-sep" />

          {(Object.keys(THEOREM_SCENES) as SceneModeId[]).map((mId, idx) => (
            <button
              key={mId}
              className={`vp-tool-btn ${activeMode === mId ? 'active' : ''}`}
              onClick={() => onSelectMode(mId)}
            >
              M0{idx + 1}
            </button>
          ))}

          <span className="vp-tool-sep" />

          <button
            type="button"
            className="vp-tool-btn"
            data-mute-toggle="true"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleMute?.();
            }}
            style={{ color: isMuted ? '#fda4af' : '#6ee7b7' }}
          >
            {isMuted ? (
              <VolumeX size={13} strokeWidth={1.5} color="#f43f5e" />
            ) : (
              <Volume2 size={13} strokeWidth={1.5} color="#34d399" />
            )}
            <span>{isMuted ? 'MUTED' : 'AUDIO'}</span>
          </button>
        </div>
      ) : (
        <div className="center-stage-hud">
          {/* =================================================================
              ULTRA-SLIM TOP HUD STRIP (OR TOP-DOCKED DIRECTOR'S CUT BAR)
              Leaves 90% of the vertical center viewport completely unobstructed!
             ================================================================= */}
          <AnimatePresence mode="wait">
            {isDirectorRunning ? (
              <motion.div
                key="director-top-strip"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="director-cut-hud-banner"
              >
                <div className="director-banner-top">
                  <div className="director-badge">
                    <Film size={12} strokeWidth={1.5} color="#fbbf24" />
                    <span>DIRECTOR&apos;S CUT · 360° ∞ LOOP</span>
                  </div>

                  {!isMobile && (
                    <div className="director-act-pills">
                      {TOUR_ACT_LABELS.map((label, idx) => (
                        <button
                          key={label}
                          className={`director-act-btn ${tourActIndex === idx ? 'active' : ''}`}
                          onClick={() => onJumpToTourAct?.(idx)}
                          title={`Jump to ${label}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    style={{
                      fontSize: 9,
                      color: meta.statusColor,
                      fontWeight: 700,
                      marginLeft: 'auto',
                      marginRight: 6
                    }}
                  >
                    {invariantStr}
                  </span>

                  <button
                    className="director-stop-btn"
                    onClick={onStopDirectorTour}
                    title="Exit Director Tour"
                  >
                    <Square size={10} strokeWidth={1.5} />
                    <span>EXIT</span>
                  </button>
                </div>

                {tourNarration && (
                  <div className="director-narration-line">{tourNarration}</div>
                )}

                <div className="director-progress-track">
                  <div
                    className="director-progress-fill"
                    style={{
                      width: `${tourProgressPct}%`,
                      background: `linear-gradient(90deg, #38bdf8, ${meta.statusColor})`
                    }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`slim-hud-${activeMode}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="vp-slim-top-strip"
              >
                <div className="vp-slim-left">
                  <span
                    className="vp-status-dot"
                    style={{
                      backgroundColor: meta.statusColor,
                      boxShadow: `0 0 8px ${meta.statusColor}`
                    }}
                  />
                  <span className="vp-slim-codename">{meta.badgeNumber}</span>
                  <span className="vp-slim-sep">·</span>
                  <span className="vp-slim-title">{meta.title}</span>
                </div>

                {!isMobile && (
                  <div className="vp-slim-right">
                    <span
                      className="vp-slim-pill"
                      style={{ color: meta.statusColor, borderColor: `${meta.statusColor}44` }}
                    >
                      {invariantStr}
                    </span>
                    <span className="vp-slim-pill">{topologyStr}</span>
                    <span className="vp-slim-pill muted-pill">
                      <Box size={10} strokeWidth={1.5} />
                      <span>{glbMeshName.split(' ')[0]}</span>
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* =================================================================
              SINGLE-LINE ULTRA-COMPACT BOTTOM MICRO-DOCK PILL
              Zero stacked toolbars! Everything in one sleek 28px instrument pill.
             ================================================================= */}
          <div className="center-hud-bottom-stack">
            <AnimatePresence>
              {showFormulaOverlay && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="vp-equation-dock"
                >
                  <div className="vp-eq-block">
                    <span className="vp-eq-label">
                      PRIMARY GOVERNING OPERATOR // DIFFERENTIAL & QUANTUM LAW
                    </span>
                    <div ref={kPrimaryRef} />
                  </div>
                  <div className="vp-eq-block" style={{ textAlign: 'right' }}>
                    <span className="vp-eq-label">
                      FORMAL REDUCTION // BOUNDARY CONDITION
                    </span>
                    <div ref={kSecondaryRef} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isMobile && (
              <div className="vp-cad-toolbar unified-single-bar">
                <button
                  type="button"
                  className="vp-tool-btn zoom-highlight"
                  onClick={onZoomIn}
                  title="Zoom In (+ Key)"
                >
                  <ZoomIn size={12} strokeWidth={1.5} />
                  <span>+</span>
                </button>

                <span className="zoom-pct-readout" title="Current Optical Zoom Level">
                  {zoomPct}%
                </span>

                <button
                  type="button"
                  className="vp-tool-btn zoom-highlight"
                  onClick={onZoomOut}
                  title="Zoom Out (- Key)"
                >
                  <ZoomOut size={12} strokeWidth={1.5} />
                  <span>−</span>
                </button>

                <button
                  type="button"
                  className="vp-tool-btn"
                  onClick={() => onCameraPreset('perspective')}
                  title="Reset Camera View (100%)"
                >
                  <RotateCcw size={11} strokeWidth={1.5} />
                </button>

                <span className="vp-tool-sep" />

                {([
                  ['perspective', 'PERSP'],
                  ['top', '+Y'],
                  ['front', '+Z'],
                  ['right', '+X'],
                  ['closeup', 'MACRO']
                ] as [CameraPresetId, string][]).map(([preset, label]) => (
                  <button
                    type="button"
                    key={preset}
                    className={`vp-tool-btn ${activeCameraPreset === preset ? 'active' : ''}`}
                    onClick={() => onCameraPreset(preset)}
                  >
                    {label}
                  </button>
                ))}

                <span className="vp-tool-sep" />

                <button
                  type="button"
                  className={`vp-tool-btn ${gridVisible ? 'active' : ''}`}
                  onClick={onToggleGrid}
                  title="Toggle Coordinate Floor Grid (G)"
                >
                  <Grid size={12} strokeWidth={1.5} />
                  <span className="vp-btn-label">GRID</span>
                </button>

                <button
                  type="button"
                  className={`vp-tool-btn ${autoRotate ? 'active' : ''}`}
                  onClick={onToggleAutoRotate}
                  title="Toggle Orbital Gimbal Rotation (O)"
                >
                  <Compass size={12} strokeWidth={1.5} />
                  <span className="vp-btn-label">ORBIT</span>
                </button>

                <button
                  type="button"
                  className={`vp-tool-btn ${showFormulaOverlay ? 'active' : ''}`}
                  onClick={() => setShowFormulaOverlay((v) => !v)}
                  title="Show / Hide Floating LaTeX Formula Overlay"
                >
                  <Sigma size={12} strokeWidth={1.5} />
                  <span className="vp-btn-label">EQ</span>
                </button>

                <button
                  type="button"
                  className="vp-tool-btn"
                  onClick={onCaptureFrame}
                  title="Capture PNG Frame (⌘P)"
                >
                  <Camera size={12} strokeWidth={1.5} />
                </button>

                <span className="vp-tool-sep" />

                <button
                  type="button"
                  className={`vp-tool-btn ${sideRacksHidden ? 'active' : ''}`}
                  onClick={onToggleSideRacksHidden}
                  title="Hide/Show Left & Right Side Panels (Shortcut: Z)"
                >
                  {sideRacksHidden ? (
                    <PanelRightClose size={12} strokeWidth={1.5} />
                  ) : (
                    <PanelLeftClose size={12} strokeWidth={1.5} />
                  )}
                  <span className="vp-btn-label">{sideRacksHidden ? 'PANELS+' : 'PANELS'}</span>
                </button>

                <button
                  type="button"
                  className="vp-tool-btn hide-dash-highlight"
                  onClick={onToggleDashboardHidden}
                  title="Hide Entire Dashboard HUD for Pure 3D View (Shortcut: H)"
                >
                  <EyeOff size={12} strokeWidth={1.5} />
                  <span className="vp-btn-label">PURE 3D</span>
                </button>

                <button
                  type="button"
                  className="vp-tool-btn"
                  data-mute-toggle="true"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleMute?.();
                  }}
                  title="Mute / Unmute Studio Audio (Shortcut: M)"
                  style={{
                    color: isMuted ? '#fda4af' : '#6ee7b7',
                    background: isMuted ? 'rgba(244, 63, 94, 0.15)' : 'rgba(52, 211, 153, 0.12)'
                  }}
                >
                  {isMuted ? (
                    <VolumeX size={12} strokeWidth={1.5} color="#f43f5e" />
                  ) : (
                    <Volume2 size={12} strokeWidth={1.5} color="#34d399" />
                  )}
                  <span className="vp-btn-label">{isMuted ? 'MUTED' : 'MUTE'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
