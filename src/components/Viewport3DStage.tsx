import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import katex from 'katex';
import {
  Grid,
  Compass,
  Camera,
  Sparkles,
  Box,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  EyeOff,
  Eye,
  PanelLeftClose,
  PanelRightClose
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
}

export const Viewport3DStage: React.FC<Viewport3DStageProps> = ({
  viewportRef,
  activeMode,
  meta,
  uniforms,
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
  onSelectMode
}) => {
  const kPrimaryRef = useRef<HTMLDivElement>(null);
  const kSecondaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [meta, dashboardHidden]);

  const { invariantStr, topologyStr, glbMeshName } = computeViewportTelemetry(
    activeMode,
    uniforms
  );

  return (
    <div className="fullscreen-3d-stage">
      <div id="canvas-viewport" ref={viewportRef} />

      {dashboardHidden ? (
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

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            className="vp-tool-btn zoom-highlight"
            onClick={onZoomIn}
            title="Zoom In (+)"
          >
            <ZoomIn size={14} strokeWidth={1.5} />
            <span>ZOOM IN +</span>
          </motion.button>

          <span className="zoom-pct-readout">{zoomPct}%</span>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            className="vp-tool-btn zoom-highlight"
            onClick={onZoomOut}
            title="Zoom Out (-)"
          >
            <ZoomOut size={14} strokeWidth={1.5} />
            <span>ZOOM OUT −</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            className="vp-tool-btn"
            onClick={() => onCameraPreset('perspective')}
            title="Reset Camera to 100%"
          >
            <RotateCcw size={13} strokeWidth={1.5} />
            <span>RESET</span>
          </motion.button>

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
        </div>
      ) : (
        <div className="center-stage-hud">
          <div className="vp-unified-top-pod">
            <div className="vp-top-left-col">
              <div className="vp-tag-row">
                <span
                  className="vp-status-chip"
                  style={{ color: meta.statusColor }}
                >
                  {meta.statusLabel}
                </span>
                <span className="vp-codename-tag">[{meta.codeName}]</span>
              </div>
              <div className="vp-title-main">{meta.title}</div>
              <div className="vp-subtitle-main">{meta.subtitle}</div>
            </div>

            <div className="vp-top-right-telemetry">
              <div className="vp-axes-gizmo" title="Click axis to align optical gimbal">
                <span className="axis-x" onClick={() => onCameraPreset('right')}>+X</span>
                <span className="axis-y" onClick={() => onCameraPreset('top')}>+Y</span>
                <span className="axis-z" onClick={() => onCameraPreset('front')}>+Z</span>
              </div>
              <div className="vp-telemetry-grid">
                <div className="vp-metric-line">
                  <span>INVARIANT</span>
                  <span style={{ color: meta.statusColor }}>{invariantStr}</span>
                </div>
                <div className="vp-metric-line">
                  <span>TOPOLOGY</span>
                  <span>{topologyStr}</span>
                </div>
                <div className="vp-metric-line">
                  <span>MESH</span>
                  <span style={{ color: '#94a3b8' }}>
                    <Box size={11} strokeWidth={1.5} style={{ display: 'inline', marginRight: 3 }} />
                    {glbMeshName}
                  </span>
                </div>
                <div className="vp-metric-line">
                  <span>OPTICS</span>
                  <span>
                    <Sparkles size={11} strokeWidth={1.5} style={{ display: 'inline', marginRight: 3 }} />
                    ACES + Bloom + CA
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="center-hud-bottom-stack">
            <div className="vp-cad-toolbar primary-user-controls">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.94 }}
                className="vp-tool-btn zoom-highlight"
                onClick={onZoomIn}
                title="Zoom In (+ Key)"
              >
                <ZoomIn size={13} strokeWidth={1.5} />
                <span>ZOOM IN +</span>
              </motion.button>

              <span className="zoom-pct-readout" title="Current Optical Zoom Level">
                {zoomPct}%
              </span>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.94 }}
                className="vp-tool-btn zoom-highlight"
                onClick={onZoomOut}
                title="Zoom Out (- Key)"
              >
                <ZoomOut size={13} strokeWidth={1.5} />
                <span>ZOOM OUT −</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.94 }}
                className="vp-tool-btn"
                onClick={() => onCameraPreset('perspective')}
                title="Reset Camera View (100%)"
              >
                <RotateCcw size={12} strokeWidth={1.5} />
                <span>RESET</span>
              </motion.button>

              <span className="vp-tool-sep" />

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                className={`vp-tool-btn ${sideRacksHidden ? 'active' : ''}`}
                onClick={onToggleSideRacksHidden}
                title="Hide/Show Left & Right Side Panels (Shortcut: Z)"
              >
                {sideRacksHidden ? (
                  <PanelRightClose size={13} strokeWidth={1.5} />
                ) : (
                  <PanelLeftClose size={13} strokeWidth={1.5} />
                )}
                <span>{sideRacksHidden ? 'SHOW PANELS' : 'HIDE PANELS'}</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="vp-tool-btn hide-dash-highlight"
                onClick={onToggleDashboardHidden}
                title="Hide Entire Dashboard HUD for Pure 3D View (Shortcut: H)"
              >
                <EyeOff size={13} strokeWidth={1.5} />
                <span>HIDE DASHBOARD</span>
              </motion.button>
            </div>

            <div className="vp-cad-toolbar">
              {([
                ['perspective', 'PERSP'],
                ['top', '+Y'],
                ['front', '+Z'],
                ['right', '+X'],
                ['closeup', 'MACRO']
              ] as [CameraPresetId, string][]).map(([preset, label]) => (
                <motion.button
                  key={preset}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="vp-tool-btn"
                  onClick={() => onCameraPreset(preset)}
                >
                  {label}
                </motion.button>
              ))}

              <span className="vp-tool-sep" />

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                className={`vp-tool-btn ${gridVisible ? 'active' : ''}`}
                onClick={onToggleGrid}
              >
                <Grid size={13} strokeWidth={1.5} />
                <span>GRID</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                className={`vp-tool-btn ${autoRotate ? 'active' : ''}`}
                onClick={onToggleAutoRotate}
              >
                <Compass size={13} strokeWidth={1.5} />
                <span>ORBIT</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="vp-tool-btn"
                onClick={onCaptureFrame}
              >
                <Camera size={13} strokeWidth={1.5} />
                <span>SNAP</span>
              </motion.button>
            </div>

            <div className="vp-equation-dock">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
