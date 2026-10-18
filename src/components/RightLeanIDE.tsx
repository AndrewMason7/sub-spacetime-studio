import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { ThemedToken } from 'shiki';
import lean4 from 'shiki/langs/lean4.mjs';
import nord from 'shiki/themes/nord.mjs';
import {
  FileCode,
  CheckCircle2,
  AlertOctagon,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  X,
  Cpu
} from 'lucide-react';
import { LEAN_REPOSITORY_FILES } from '../data/leanRepositoryFiles';
import { TheoremMetadata } from '../types/workstation';
import { resolveActiveAstLine } from '../services/physicsTelemetryService';

const shikiHighlighterPromise = createHighlighterCore({
  themes: [nord],
  langs: [lean4],
  engine: createJavaScriptRegexEngine()
});

interface RightLeanIDEProps {
  meta: TheoremMetadata;
  openFileIds: string[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCloseFileTab: (fileId: string) => void;
  highlightedSliderIdx?: number | null;
}

const MATH_OPERATORS_REGEX = /(∀|∃|↦|→|←|↔|∧|∨|¬|≤|≥|≠|≈|∑|∏|∫|⨅|⨆|⊕|⊗|∈|∉|⊆|‖|⟨|⟩|ℝ≥0∞|ℝ≥0|ℝ|ℕ|ℤ|ℂ|Ω)/g;

export const RightLeanIDE: React.FC<RightLeanIDEProps> = ({
  meta,
  openFileIds,
  activeFileId,
  onSelectFile,
  onCloseFileTab,
  highlightedSliderIdx
}) => {
  const [copied, setCopied] = useState(false);
  const [diagTab, setDiagTab] = useState<'audit' | 'infoview'>('audit');
  const [tokenLines, setTokenLines] = useState<ThemedToken[][] | null>(null);
  const [activeLineIdx, setActiveLineIdx] = useState<number>(11);
  const editorScrollRef = useRef<HTMLDivElement>(null);

  const activeFile =
    LEAN_REPOSITORY_FILES.find((f) => f.id === activeFileId) ||
    LEAN_REPOSITORY_FILES[0];

  useEffect(() => {
    let cancelled = false;
    shikiHighlighterPromise
      .then((hl) => {
        if (cancelled) return;
        const res = hl.codeToTokens(activeFile.code, {
          lang: 'lean4',
          theme: 'nord'
        });
        setTokenLines(res.tokens);
        setActiveLineIdx(Math.min(11, res.tokens.length - 1));
      })
      .catch(() => {
        if (!cancelled) setTokenLines(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeFile.id, activeFile.code]);

  useEffect(() => {
    const targetLine = resolveActiveAstLine(
      activeFile.id,
      highlightedSliderIdx,
      activeFile.linesCount
    );
    if (targetLine === null) return;
    setActiveLineIdx(targetLine);
    if (editorScrollRef.current) {
      const rowEl = editorScrollRef.current.children[targetLine] as HTMLElement | undefined;
      rowEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlightedSliderIdx, activeFile.id, activeFile.linesCount]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const renderTokenWithMathAccent = (content: string, baseColor?: string) => {
    const parts = content.split(MATH_OPERATORS_REGEX);
    if (parts.length === 1) {
      return <span style={{ color: baseColor || '#cbd5e1' }}>{content}</span>;
    }
    return parts.map((part, i) => {
      if (MATH_OPERATORS_REGEX.test(part)) {
        return (
          <span
            key={i}
            style={{
              color: '#fbbf24',
              fontWeight: 700,
              textShadow: '0 0 8px rgba(251, 191, 36, 0.28)'
            }}
          >
            {part}
          </span>
        );
      }
      return (
        <span key={i} style={{ color: baseColor || '#cbd5e1' }}>
          {part}
        </span>
      );
    });
  };

  const renderCodeContent = () => {
    if (tokenLines) {
      return tokenLines.map((lineTokens, idx) => {
        const isCurrent = idx === activeLineIdx;
        return (
          <div
            className={`ide-line-row ${isCurrent ? 'active-line' : ''}`}
            key={idx}
            onClick={() => setActiveLineIdx(idx)}
          >
            <span className="ide-line-num">{idx + 1}</span>
            <span className="ide-line-code">
              {lineTokens.length === 0 ? (
                ' '
              ) : (
                lineTokens.map((tok, tIdx) => (
                  <React.Fragment key={tIdx}>
                    {renderTokenWithMathAccent(tok.content, tok.color)}
                  </React.Fragment>
                ))
              )}
            </span>
          </div>
        );
      });
    }

    const rawLines = activeFile.code.split('\n');
    return rawLines.map((line, idx) => (
      <div
        className={`ide-line-row ${idx === activeLineIdx ? 'active-line' : ''}`}
        key={idx}
        onClick={() => setActiveLineIdx(idx)}
      >
        <span className="ide-line-num">{idx + 1}</span>
        <span className="ide-line-code">{line || ' '}</span>
      </div>
    ));
  };

  const isWithdrawn = activeFile.verificationBadge === 'WITHDRAWN_NOTICE';

  return (
    <aside className="floating-instrument-panel right-lean-workspace">
      <div
        className="ws-pane-header zone-header-ide"
        style={{ borderLeft: `3px solid ${activeFile.badgeColor}` }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={14} strokeWidth={1.5} color={activeFile.badgeColor} />
          <span style={{ color: '#bae6fd' }}>SHIKI AST // LEAN 4 WORKSPACE</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className={`kernel-status-pill ${isWithdrawn ? 'withdrawn' : 'verified'}`}
          >
            <span className="kernel-pill-dot" />
            {isWithdrawn ? '0 LEAN // WITHDRAWN' : 'KERNEL: 0 GOALS'}
          </span>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className="ws-mini-action"
            onClick={handleCopy}
          >
            {copied ? (
              <Check size={14} strokeWidth={1.5} color="#34d399" />
            ) : (
              <Copy size={14} strokeWidth={1.5} />
            )}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </motion.button>
        </div>
      </div>

      <div className="ide-file-tabs">
        <div className="ide-tabs-scroll">
          {openFileIds.map((fid) => {
            const file = LEAN_REPOSITORY_FILES.find((f) => f.id === fid);
            if (!file) return null;
            const isActive = fid === activeFile.id;
            return (
              <div
                key={fid}
                className={`ide-file-tab ${isActive ? 'active' : ''}`}
                style={{
                  borderTopColor: isActive ? file.badgeColor : 'transparent',
                  background: isActive ? `${file.badgeColor}18` : undefined
                }}
                onClick={() => onSelectFile(fid)}
              >
                <FileCode size={14} strokeWidth={1.5} color={file.badgeColor} />
                <span>{file.filename}</span>
                {openFileIds.length > 1 && (
                  <button
                    className="ide-tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFileTab(fid);
                    }}
                  >
                    <X size={11} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ide-breadcrumb">
        <Cpu size={12} strokeWidth={1.5} color="#38bdf8" style={{ flexShrink: 0 }} />
        <span style={{ color: '#7dd3fc' }}>openai-math</span>
        <span>/</span>
        <span className="ide-breadcrumb-path">{activeFile.fullPath}</span>
        <span className="ide-ln-pill">
          LN {activeLineIdx + 1} : {activeFile.linesCount}
        </span>
      </div>

      <div className="ide-editor-scroll" ref={editorScrollRef}>
        {renderCodeContent()}
      </div>

      <div className="ide-diagnostics">
        <div className="ide-diag-tabs">
          <button
            className={`ide-diag-tab ${diagTab === 'audit' ? 'active' : ''}`}
            onClick={() => setDiagTab('audit')}
          >
            <Terminal size={13} strokeWidth={1.5} color="#fbbf24" />
            <span>SCALPEL AUDIT (LEAN VS PDF SCOPE)</span>
          </button>
          <button
            className={`ide-diag-tab ${diagTab === 'infoview' ? 'active' : ''}`}
            onClick={() => setDiagTab('infoview')}
          >
            {isWithdrawn ? (
              <AlertOctagon size={13} strokeWidth={1.5} color="#f43f5e" />
            ) : (
              <CheckCircle2 size={13} strokeWidth={1.5} color="#34d399" />
            )}
            <span>LEAN 4 INFOVIEW GOAL STATE</span>
          </button>
        </div>

        {diagTab === 'audit' ? (
          <div className="ide-diag-body">
            <div style={{ color: '#fde68a', marginBottom: 4 }}>
              <strong style={{ color: '#fbbf24' }}>Primary Source:</strong> {meta.paperRef}
            </div>
            <div style={{ color: '#cbd5e1' }}>{meta.auditScopeNote}</div>
            <table className="diag-table">
              <thead>
                <tr>
                  <th style={{ color: '#38bdf8' }}>ARGON INPUT</th>
                  <th style={{ color: '#c084fc' }}>ARGON OUTPUT</th>
                  <th style={{ color: '#fbbf24' }}>GPU KERNEL PASS</th>
                  <th style={{ color: '#34d399' }}>AUDIT CHECK</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: '#e0f2fe', fontWeight: 600 }}>
                    {meta.argonPipelineStats.inputTokens}
                  </td>
                  <td style={{ color: '#f3e8ff', fontWeight: 600 }}>
                    {meta.argonPipelineStats.outputTokens}
                  </td>
                  <td style={{ color: '#fef3c7', fontWeight: 600 }}>
                    {meta.argonPipelineStats.shaderPasses}
                  </td>
                  <td style={{ color: meta.statusColor, fontWeight: 700 }}>
                    {meta.argonPipelineStats.verificationLatency}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ide-diag-body" style={{ fontFamily: 'var(--font-mono)' }}>
            {isWithdrawn ? (
              <div style={{ color: '#f43f5e' }}>
                <div>▼ Tactic State // CounterProof.lean:{activeLineIdx + 1}:2</div>
                <div style={{ color: '#e2e8f0', margin: '4px 0' }}>
                  m : ℕ, hm : 0 &lt; m ⊢ signedDoublePoints m (-1) = -2 * ↑m ∧ signedDoublePoints m (-1) ≠ 0
                </div>
                <div style={{ color: '#34d399' }}>
                  ✓ Goals accomplished (0 goals remaining) — omega proved I_new = -2m ≠ 0!
                </div>
                <div style={{ color: '#fbbf24', marginTop: 4 }}>
                  ⚠ WARNING: Original manuscript had NO Lean 4 file; +1 sign assumption failed Eliashberg–Murphy cancellation.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ color: '#34d399', marginBottom: 4 }}>
                  ✓ leanprover/lean4:v4.34.1 — All declarations in {activeFile.filename} typechecked.
                </div>
                <div style={{ color: '#cbd5e1' }}>
                  • Universes: u v w • Mathlib4 revision: 4.34.1-patched • Mesh: Blender 5.2 GLB Loaded
                </div>
                <div style={{ color: '#fbbf24', marginTop: 6 }}>
                  ▸ Active Shader Binding: Line {activeLineIdx + 1} synchronized with DAW Uniform Rack.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
