import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import katex from 'katex';
import {
  Sliders,
  FolderTree,
  FileCode,
  BookOpen,
  Activity,
  ChevronRight,
  ChevronDown,
  Zap,
  AlertTriangle
} from 'lucide-react';
import {
  SceneModeId,
  SimulationUniformState,
  TheoremMetadata
} from '../types/workstation';
import { LEAN_REPOSITORY_FILES } from '../data/leanRepositoryFiles';
import {
  computeOscilloscopeSample,
  getQuickActionSpec
} from '../services/physicsTelemetryService';

interface LeftParameterDockProps {
  activeMode: SceneModeId;
  meta: TheoremMetadata;
  uniforms: SimulationUniformState;
  onChangeUniform: (key: keyof SimulationUniformState, val: number) => void;
  onTriggerQuickAction: (mode: SceneModeId) => void;
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onSelectMode: (mode: SceneModeId) => void;
  onHoverOrScrubSlider?: (sliderIdx: number | null) => void;
}

export const LeftParameterDock: React.FC<LeftParameterDockProps> = ({
  activeMode,
  meta,
  uniforms,
  onChangeUniform,
  onTriggerQuickAction,
  activeFileId,
  onSelectFile,
  onSelectMode,
  onHoverOrScrubSlider
}) => {
  const [activeTab, setActiveTab] = useState<'faders' | 'intuition'>('faders');
  const [treeExpanded, setTreeExpanded] = useState(true);
  const [hoveredSlider, setHoveredSlider] = useState<string | null>(null);
  const scopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const sweepXRef = useRef<number>(0);
  const prevYRef = useRef<number>(30);

  useEffect(() => {
    let animId = 0;
    const canvas = scopeCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#020408';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    const renderPhosphorScope = () => {
      const c = scopeCanvasRef.current;
      if (c) {
        const ctx = c.getContext('2d');
        if (ctx) {
          const w = c.width;
          const h = c.height;
          const t = performance.now() * 0.005;

          ctx.fillStyle = 'rgba(2, 5, 10, 0.085)';
          ctx.fillRect(0, 0, w, h);

          ctx.strokeStyle = 'rgba(148, 163, 184, 0.055)';
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          for (let gx = 0; gx <= w; gx += 32) {
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, h);
          }
          for (let gy = 0; gy <= h; gy += 15) {
            ctx.moveTo(0, gy);
            ctx.lineTo(w, gy);
          }
          ctx.stroke();

          ctx.strokeStyle = 'rgba(125, 211, 252, 0.11)';
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          for (let tx = 0; tx <= w; tx += 8) {
            ctx.moveTo(tx, h / 2 - 2);
            ctx.lineTo(tx, h / 2 + 2);
          }
          ctx.stroke();

          const { sample, traceColor } = computeOscilloscopeSample(
            activeMode,
            uniforms,
            t,
            meta.statusColor
          );

          const nextX = (sweepXRef.current + 2.4) % w;
          const nextY = Math.max(5, Math.min(h - 5, (1 - sample) * (h - 10) + 5));

          ctx.save();
          ctx.strokeStyle = traceColor;
          ctx.shadowColor = traceColor;
          ctx.shadowBlur = 8;
          ctx.lineWidth = 1.75;
          ctx.beginPath();
          if (nextX > sweepXRef.current) {
            ctx.moveTo(sweepXRef.current, prevYRef.current);
            ctx.lineTo(nextX, nextY);
          }
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(nextX, nextY, 2.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          sweepXRef.current = nextX;
          prevYRef.current = nextY;
        }
      }
      animId = requestAnimationFrame(renderPhosphorScope);
    };

    animId = requestAnimationFrame(renderPhosphorScope);
    return () => cancelAnimationFrame(animId);
  }, [activeMode, uniforms, meta.statusColor]);

  const { label: quickActionLabel, isDanger } = getQuickActionSpec(
    activeMode,
    uniforms
  );

  return (
    <aside className="floating-instrument-panel left-instrument-rack">
      <div className="ws-pane-header" style={{ padding: '0 6px' }}>
        <div className="rack-mode-pills">
          <button
            className={`rack-mode-pill ${activeTab === 'faders' ? 'active' : ''}`}
            onClick={() => setActiveTab('faders')}
          >
            <Sliders size={12} strokeWidth={1.5} color={meta.statusColor} />
            <span>DAW FADERS</span>
          </button>
          <button
            className={`rack-mode-pill ${activeTab === 'intuition' ? 'active' : ''}`}
            onClick={() => setActiveTab('intuition')}
          >
            <BookOpen size={12} strokeWidth={1.5} color="#fbbf24" />
            <span>INTUITION</span>
          </button>
        </div>
        <span className="rack-module-tag" style={{ color: meta.statusColor }}>
          {meta.badgeNumber.split(' // ')[0]} // {meta.id.toUpperCase()}
        </span>
      </div>

      {activeTab === 'faders' ? (
        <div className="ws-section-block">
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.975 }}
            className={`ws-trigger-btn ${isDanger ? 'crimson' : ''}`}
            style={{ marginBottom: 10 }}
            onClick={() => onTriggerQuickAction(activeMode)}
          >
            {isDanger ? (
              <AlertTriangle size={13} strokeWidth={1.5} />
            ) : (
              <Zap size={13} strokeWidth={1.5} />
            )}
            <span>{quickActionLabel}</span>
          </motion.button>

          {meta.sliders.map((s, sIdx) => {
            const val = uniforms[s.id];
            const pct = Math.max(0, Math.min(100, ((val - s.min) / (s.max - s.min)) * 100));
            const critPct =
              s.criticalValue !== undefined
                ? ((s.criticalValue - s.min) / (s.max - s.min)) * 100
                : null;
            const isHovered = hoveredSlider === s.id;

            return (
              <div
                className={`daw-fader-module ${isHovered ? 'hovered' : ''}`}
                key={s.id}
                onMouseEnter={() => {
                  setHoveredSlider(s.id);
                  onHoverOrScrubSlider?.(sIdx);
                }}
                onMouseLeave={() => {
                  setHoveredSlider(null);
                }}
              >
                <div className="daw-fader-header">
                  <span className="daw-fader-label">{s.label}</span>
                  <div className="daw-readout-group">
                    <span
                      className="daw-symbol-pill"
                      dangerouslySetInnerHTML={{
                        __html: katex.renderToString(s.symbol, {
                          throwOnError: false,
                          displayMode: false
                        })
                      }}
                    />
                    <span
                      className="daw-digital-val"
                      style={{ color: meta.statusColor }}
                    >
                      {val.toFixed(2)}
                      {s.unit ? ` ${s.unit}` : ''}
                    </span>
                  </div>
                </div>

                <div className="daw-track-chassis">
                  <div className="daw-micro-ticks-top" />
                  <div className="daw-micro-ticks-bottom" />

                  {critPct !== null && (
                    <div
                      className="daw-critical-notch"
                      style={{ left: `${critPct}%` }}
                      title={s.criticalLabel || 'Critical Threshold'}
                    />
                  )}

                  <div
                    className="daw-signal-fill"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${meta.statusColor}18 0%, ${meta.statusColor}58 100%)`
                    }}
                  />

                  <div
                    className="daw-fader-cap"
                    style={{
                      left: `${pct}%`,
                      borderColor: isHovered ? '#ffffff' : meta.statusColor,
                      boxShadow: isHovered
                        ? `0 0 12px ${meta.statusColor}`
                        : '0 2px 6px rgba(0,0,0,0.85)'
                    }}
                  >
                    <span className="daw-cap-centerline" style={{ background: meta.statusColor }} />
                  </div>

                  {isHovered && (
                    <div
                      className="daw-floating-tracker"
                      style={{ left: `${pct}%`, color: meta.statusColor }}
                    >
                      {val.toFixed(2)}
                    </div>
                  )}

                  <input
                    type="range"
                    className="daw-range-input"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={val}
                    onChange={(e) => {
                      onHoverOrScrubSlider?.(sIdx);
                      onChangeUniform(s.id, parseFloat(e.target.value));
                    }}
                    onDoubleClick={() => onChangeUniform(s.id, s.defaultValue)}
                    title="Drag to scrub uniform • Double-click to reset to default"
                  />
                </div>

                <div className="daw-scale-labels">
                  <span>{s.min.toFixed(1)}</span>
                  {s.criticalValue !== undefined && (
                    <span style={{ color: '#f43f5e' }}>
                      CRIT: {s.criticalValue.toFixed(1)}
                    </span>
                  )}
                  <span>{s.max.toFixed(1)}</span>
                </div>

                <div className="scrubber-caption">{s.description}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ws-section-block">
          <div
            className="ws-spec-prose"
            style={{
              marginBottom: 10,
              padding: 9,
              borderRadius: 6,
              background: 'rgba(251, 191, 36, 0.06)',
              border: '1px solid rgba(251, 191, 36, 0.2)'
            }}
          >
            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: 4 }}>
              💡 Physical Analogy (الفكرة الحسية قبل المصطلح):
            </strong>
            {meta.realWorldAnalogy}
          </div>
          <div
            className="ws-spec-prose"
            style={{
              padding: 9,
              borderRadius: 6,
              background: 'rgba(125, 211, 252, 0.05)',
              border: '1px solid rgba(125, 211, 252, 0.16)'
            }}
          >
            <strong style={{ color: '#7dd3fc', display: 'block', marginBottom: 4 }}>
              🔬 Formal Mathematical Mechanism:
            </strong>
            {meta.formalSummary}
          </div>
          <button
            className="ws-trigger-btn"
            style={{ marginTop: 10 }}
            onClick={() => setActiveTab('faders')}
          >
            <Sliders size={13} strokeWidth={1.5} />
            <span>RETURN TO DAW UNIFORM FADERS</span>
          </button>
        </div>
      )}

      <div className="ws-pane-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={14} strokeWidth={1.5} color={meta.statusColor} />
          <span>CRT PHOSPHOR SCOPE</span>
        </div>
        <span style={{ color: '#34d399', fontSize: 8.5 }}>60 HZ PERSISTENCE</span>
      </div>
      <div className="ws-section-block">
        <div className="oscilloscope-crt-bezel">
          <canvas
            ref={scopeCanvasRef}
            width={320}
            height={60}
            id="telemetry-scope"
          />
          <div className="crt-scanline-overlay" />
          <div className="crt-corner-readout">
            <span>CH1: Ψ_EFF</span>
            <span>DECAY: τ=18ms</span>
          </div>
        </div>
      </div>

      <div
        className="ws-pane-header clickable"
        onClick={() => setTreeExpanded(!treeExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {treeExpanded ? (
            <ChevronDown size={14} strokeWidth={1.5} />
          ) : (
            <ChevronRight size={14} strokeWidth={1.5} />
          )}
          <FolderTree size={14} strokeWidth={1.5} />
          <span>LEAN 4 REPOSITORY MODULES</span>
        </div>
        <span style={{ color: '#64748b' }}>7 FILES</span>
      </div>

      {treeExpanded && (
        <div className="ws-explorer-tree">
          {LEAN_REPOSITORY_FILES.map((file) => {
            const isSelected = file.id === activeFileId;
            return (
              <button
                key={file.id}
                className={`ws-tree-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelectFile(file.id);
                  if (file.moduleGroup !== activeMode) {
                    onSelectMode(file.moduleGroup);
                  }
                }}
              >
                <FileCode size={14} strokeWidth={1.5} color={file.badgeColor} />
                <span className="ws-tree-filename">{file.filename}</span>
                <span className="ws-tree-loc">{file.linesCount}L</span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
};
