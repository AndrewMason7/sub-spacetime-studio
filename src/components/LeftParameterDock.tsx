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

  const getChannelAccent = (sliderIdx: number): string => {
    if (sliderIdx === 0) return meta.statusColor;
    if (sliderIdx === 1) return '#fbbf24';
    return activeMode === 'fkcrt' || activeMode === 'retraction' ? '#38bdf8' : '#c084fc';
  };

  useEffect(() => {
    let animId = 0;
    const canvas = scopeCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = '#02130b';
        ctx.fillRect(0, 0, w, h);

        const { traceColor } = computeOscilloscopeSample(
          activeMode,
          uniforms,
          0,
          '#10b981'
        );
        ctx.save();
        ctx.strokeStyle = traceColor;
        ctx.shadowColor = traceColor;
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < w; x += 2) {
          const { sample } = computeOscilloscopeSample(
            activeMode,
            uniforms,
            x * 0.045,
            '#10b981'
          );
          const y = Math.max(5, Math.min(h - 5, (1 - sample) * (h - 10) + 5));
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          prevYRef.current = y;
        }
        ctx.stroke();
        ctx.restore();
        sweepXRef.current = 0;
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

          ctx.fillStyle = 'rgba(2, 19, 11, 0.075)';
          ctx.fillRect(0, 0, w, h);

          ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
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

          ctx.strokeStyle = 'rgba(52, 211, 153, 0.18)';
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();

          const { sample } = computeOscilloscopeSample(
            activeMode,
            uniforms,
            t,
            '#34d399'
          );

          const nextX = (sweepXRef.current + 2.4) % w;
          const nextY = Math.max(5, Math.min(h - 5, (1 - sample) * (h - 10) + 5));

          ctx.save();
          ctx.strokeStyle = '#34d399';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 9;
          ctx.lineWidth = 1.85;
          ctx.beginPath();
          if (nextX > sweepXRef.current) {
            ctx.moveTo(sweepXRef.current, prevYRef.current);
            ctx.lineTo(nextX, nextY);
          }
          ctx.stroke();

          ctx.fillStyle = '#ecfdf5';
          ctx.beginPath();
          ctx.arc(nextX, nextY, 2.1, 0, Math.PI * 2);
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
      <div
        className="ws-pane-header zone-header-faders"
        style={{
          padding: '0 8px',
          borderLeft: `3px solid ${meta.statusColor}`
        }}
      >
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
        <span
          className="rack-module-tag"
          style={{
            color: meta.statusColor,
            borderColor: `${meta.statusColor}44`,
            background: `${meta.statusColor}14`
          }}
        >
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
            const chColor = getChannelAccent(sIdx);

            return (
              <div
                className={`daw-fader-module ${isHovered ? 'hovered' : ''}`}
                key={s.id}
                style={{
                  borderLeft: `3px solid ${chColor}`,
                  boxShadow: isHovered
                    ? `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px ${chColor}55`
                    : undefined
                }}
                onMouseEnter={() => {
                  setHoveredSlider(s.id);
                  onHoverOrScrubSlider?.(sIdx);
                }}
                onMouseLeave={() => {
                  setHoveredSlider(null);
                }}
              >
                <div className="daw-fader-header">
                  <span className="daw-fader-label" style={{ color: '#f8fafc' }}>
                    {s.label}
                  </span>
                  <div className="daw-readout-group">
                    <span
                      className="daw-symbol-pill"
                      style={{
                        color: chColor,
                        background: `${chColor}15`,
                        border: `1px solid ${chColor}33`
                      }}
                      dangerouslySetInnerHTML={{
                        __html: katex.renderToString(s.symbol, {
                          throwOnError: false,
                          displayMode: false
                        })
                      }}
                    />
                    <span
                      className="daw-digital-val"
                      style={{
                        color: chColor,
                        borderColor: `${chColor}40`
                      }}
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
                      background: `linear-gradient(90deg, ${chColor}22 0%, ${chColor}75 100%)`
                    }}
                  />

                  <div
                    className="daw-fader-cap"
                    style={{
                      left: `${pct}%`,
                      borderColor: isHovered ? '#ffffff' : chColor,
                      boxShadow: isHovered
                        ? `0 0 12px ${chColor}`
                        : '0 2px 6px rgba(0,0,0,0.85)'
                    }}
                  >
                    <span className="daw-cap-centerline" style={{ background: chColor }} />
                  </div>

                  {isHovered && (
                    <div
                      className="daw-floating-tracker"
                      style={{ left: `${pct}%`, color: chColor }}
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
                    <span style={{ color: '#fb7185', fontWeight: 600 }}>
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
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.28)'
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
              background: 'rgba(56, 189, 248, 0.07)',
              border: '1px solid rgba(56, 189, 248, 0.24)'
            }}
          >
            <strong style={{ color: '#38bdf8', display: 'block', marginBottom: 4 }}>
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

      <div className="ws-pane-header zone-header-scope">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={14} strokeWidth={1.5} color="#34d399" />
          <span style={{ color: '#a7f3d0' }}>CRT PHOSPHOR SCOPE</span>
        </div>
        <span
          style={{
            color: '#34d399',
            fontSize: 8,
            background: 'rgba(16, 185, 129, 0.14)',
            padding: '1px 6px',
            borderRadius: 999,
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          60 HZ RADAR
        </span>
      </div>
      <div className="ws-section-block scope-zone-body">
        <div className="oscilloscope-crt-bezel">
          <canvas
            ref={scopeCanvasRef}
            width={320}
            height={60}
            id="telemetry-scope"
          />
          <div className="crt-scanline-overlay" />
          <div className="crt-corner-readout">
            <span style={{ color: '#6ee7b7' }}>CH1: Ψ_EFF</span>
            <span style={{ color: '#34d399' }}>DECAY: τ=18ms</span>
          </div>
        </div>
      </div>

      <div
        className="ws-pane-header clickable zone-header-repo"
        onClick={() => setTreeExpanded(!treeExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {treeExpanded ? (
            <ChevronDown size={14} strokeWidth={1.5} color="#c084fc" />
          ) : (
            <ChevronRight size={14} strokeWidth={1.5} color="#c084fc" />
          )}
          <FolderTree size={14} strokeWidth={1.5} color="#c084fc" />
          <span style={{ color: '#e9d5ff' }}>LEAN 4 REPOSITORY MODULES</span>
        </div>
        <span
          style={{
            color: '#d8b4fe',
            fontSize: 8,
            background: 'rgba(192, 132, 252, 0.14)',
            padding: '1px 6px',
            borderRadius: 999,
            border: '1px solid rgba(192, 132, 252, 0.3)'
          }}
        >
          7 FILES
        </span>
      </div>

      {treeExpanded && (
        <div className="ws-explorer-tree">
          {LEAN_REPOSITORY_FILES.map((file) => {
            const isSelected = file.id === activeFileId;
            return (
              <button
                key={file.id}
                className={`ws-tree-item ${isSelected ? 'selected' : ''}`}
                style={{
                  borderLeftColor: isSelected ? file.badgeColor : 'transparent',
                  background: isSelected ? `${file.badgeColor}18` : undefined
                }}
                onClick={() => {
                  onSelectFile(file.id);
                  if (file.moduleGroup !== activeMode) {
                    onSelectMode(file.moduleGroup);
                  }
                }}
              >
                <FileCode size={14} strokeWidth={1.5} color={file.badgeColor} />
                <span
                  className="ws-tree-filename"
                  style={{ color: isSelected ? '#ffffff' : '#cbd5e1' }}
                >
                  {file.filename}
                </span>
                <span
                  className="ws-tree-loc"
                  style={{ color: isSelected ? file.badgeColor : '#64748b' }}
                >
                  {file.linesCount}L
                </span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
};
