import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Layers } from 'lucide-react';
import { SceneModeId, TheoremMetadata } from '../types/workstation';

interface BottomTimelineDockProps {
  activeMode: SceneModeId;
  meta: TheoremMetadata;
  isPaused: boolean;
  onTogglePause: () => void;
  timeScale: number;
  onChangeTimeScale: (scale: number) => void;
  getSimTime: () => number;
  onScrubSimTime: (t: number) => void;
  fps: number;
  onJumpToKeyframe: (pct: number) => void;
  tourStatusText?: string | null;
}

export const BottomTimelineDock: React.FC<BottomTimelineDockProps> = ({
  activeMode,
  meta,
  isPaused,
  onTogglePause,
  timeScale,
  onChangeTimeScale,
  getSimTime,
  onScrubSimTime,
  fps,
  onJumpToKeyframe,
  tourStatusText
}) => {
  const [simTimeDisplay, setSimTimeDisplay] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSimTimeDisplay(getSimTime());
    }, 80);
    return () => clearInterval(id);
  }, [getSimTime]);

  const cycleTime = (simTimeDisplay % 30) / 30;

  return (
    <footer className="ws-timeline-statusbar">
      <div className="ws-transport-cluster">
        <button
          className="ws-transport-btn"
          onClick={onTogglePause}
          title="Play / Pause Simulation Clock (Space)"
        >
          {isPaused ? (
            <Play size={13} strokeWidth={1.5} color="#34d399" />
          ) : (
            <Pause size={13} strokeWidth={1.5} color="#7dd3fc" />
          )}
          <span>{isPaused ? 'PAUSED' : 'SIMULATING'}</span>
        </button>

        <button
          className="ws-transport-btn"
          onClick={() => onScrubSimTime(0)}
          title="Reset Simulation Clock"
        >
          <RotateCcw size={13} strokeWidth={1.5} />
        </button>

        <div className="ws-speed-pills">
          {[0.25, 1.0, 2.0].map((spd) => (
            <button
              key={spd}
              className={`ws-speed-pill ${timeScale === spd ? 'active' : ''}`}
              onClick={() => onChangeTimeScale(spd)}
            >
              {spd}x
            </button>
          ))}
        </div>

        <span className="ws-clock-readout">
          T = {simTimeDisplay.toFixed(2)}s
        </span>
      </div>

      <div className="ws-timeline-track-area">
        <div className="kf-preset-pills">
          <button
            className="kf-preset-btn"
            onClick={() => onJumpToKeyframe(0.0)}
            title="Animate to Initial / Ground State"
          >
            KF1: GROUND
          </button>
          <button
            className="kf-preset-btn critical"
            onClick={() => onJumpToKeyframe(0.5)}
            title="Animate to Critical Phase Threshold"
          >
            KF2: CRITICAL
          </button>
          <button
            className="kf-preset-btn"
            onClick={() => onJumpToKeyframe(0.95)}
            title="Animate to Asymptotic Saturation Limit"
          >
            KF3: SATURATED
          </button>
        </div>

        <div
          className="ws-timeline-bar"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            onJumpToKeyframe(pct);
          }}
        >
          <div
            className="ws-timeline-playhead"
            style={{
              left: `${cycleTime * 100}%`,
              backgroundColor: meta.statusColor
            }}
          />
          <span
            className="ws-kf-diamond"
            style={{ left: '8%' }}
            onClick={(e) => { e.stopPropagation(); onJumpToKeyframe(0.0); }}
          />
          <span
            className="ws-kf-diamond critical"
            style={{ left: '50%' }}
            onClick={(e) => { e.stopPropagation(); onJumpToKeyframe(0.5); }}
          />
          <span
            className="ws-kf-diamond"
            style={{ left: '92%' }}
            onClick={(e) => { e.stopPropagation(); onJumpToKeyframe(0.95); }}
          />
        </div>
      </div>

      <div className="ws-status-right">
        {tourStatusText ? (
          <span className="ws-status-item" style={{ color: '#fbbf24', fontWeight: 700 }}>
            <span>🎬 {tourStatusText}</span>
          </span>
        ) : (
          <span className="ws-status-item">
            <Layers size={13} strokeWidth={1.5} color={meta.statusColor} />
            <span>MODULE: <strong>{activeMode.toUpperCase()}</strong></span>
          </span>
        )}
        <span className="ws-status-item">
          <FastForward size={13} strokeWidth={1.5} color="#34d399" />
          <span>CLOCK: <strong style={{ color: '#34d399' }}>{fps >= 15 ? `${fps.toFixed(1)} FPS` : '60.0 HZ SYNC'}</strong></span>
        </span>
        <span className="ws-status-item" style={{ color: '#7dd3fc' }}>
          <span>VERTEX // <strong>GEMINI-4-ARGON</strong></span>
        </span>
      </div>
    </footer>
  );
};
