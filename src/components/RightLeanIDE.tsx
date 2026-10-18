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
import { THEOREM_SCENES } from '../data/theoremsCatalog';
import {
  SceneModeId,
  SimulationUniformState,
  TheoremMetadata
} from '../types/workstation';
import { resolveActiveAstFocus } from '../services/physicsTelemetryService';

const shikiHighlighterPromise = createHighlighterCore({
  themes: [nord],
  langs: [lean4],
  engine: createJavaScriptRegexEngine()
});

interface RightLeanIDEProps {
  meta: TheoremMetadata;
  uniforms: SimulationUniformState;
  openFileIds: string[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onSelectMode?: (mode: SceneModeId, targetFileId?: string) => void;
  onCloseFileTab: (fileId: string) => void;
  highlightedSliderIdx?: number | null;
}

const MATH_OPERATORS_SPLIT_REGEX = /(∀|∃|↦|→|←|↔|∧|∨|¬|≤|≥|≠|≈|∑|∏|∫|⨅|⨆|⊕|⊗|∈|∉|⊆|‖|⟨|⟩|ℝ≥0∞|ℝ≥0|ℝ|ℕ|ℤ|ℂ|Ω)/g;
const IS_MATH_OPERATOR_REGEX = /^(∀|∃|↦|→|←|↔|∧|∨|¬|≤|≥|≠|≈|∑|∏|∫|⨅|⨆|⊕|⊗|∈|∉|⊆|‖|⟨|⟩|ℝ≥0∞|ℝ≥0|ℝ|ℕ|ℤ|ℂ|Ω)$/;

export const RightLeanIDE: React.FC<RightLeanIDEProps> = ({
  meta,
  uniforms,
  openFileIds,
  activeFileId,
  onSelectFile,
  onSelectMode,
  onCloseFileTab,
  highlightedSliderIdx
}) => {
  const [copied, setCopied] = useState(false);
  const [diagTab, setDiagTab] = useState<'audit' | 'infoview'>('audit');
  const [tokenLines, setTokenLines] = useState<ThemedToken[][] | null>(null);
  const [manualLineIdx, setManualLineIdx] = useState<number | null>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const lastScrolledLineRef = useRef<number>(-1);

  const activeFile =
    LEAN_REPOSITORY_FILES.find((f) => f.id === activeFileId) ||
    LEAN_REPOSITORY_FILES[0];

  const fileMeta = THEOREM_SCENES[activeFile.moduleGroup] || meta;
  const actualLinesCount = tokenLines
    ? tokenLines.length
    : activeFile.code.split('\n').length;

  const astFocus = resolveActiveAstFocus(
    activeFile.id,
    highlightedSliderIdx,
    uniforms,
    actualLinesCount
  );

  // Reset manual click override whenever file or slider/physics focus changes
  useEffect(() => {
    setManualLineIdx(null);
  }, [activeFile.id, highlightedSliderIdx, astFocus.lineIdx, astFocus.symbolToken]);

  const activeLineIdx = manualLineIdx ?? astFocus.lineIdx;
  const activeEndLineIdx = manualLineIdx ?? astFocus.endLineIdx;

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
      })
      .catch(() => {
        if (!cancelled) setTokenLines(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeFile.id, activeFile.code]);

  // Smoothly auto-scroll the editor whenever the target AST line changes
  useEffect(() => {
    if (!editorScrollRef.current) return;
    if (lastScrolledLineRef.current === activeLineIdx && manualLineIdx === null) return;
    lastScrolledLineRef.current = activeLineIdx;
    const rowEl = editorScrollRef.current.children[activeLineIdx] as HTMLElement | undefined;
    rowEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeLineIdx, activeFile.id, tokenLines, manualLineIdx]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const renderTokenWithMathAccent = (
    content: string,
    baseColor?: string,
    isTargetLine?: boolean
  ): React.ReactNode => {
    const targetSym = astFocus.symbolToken;
    const hasTargetSym =
      Boolean(isTargetLine && targetSym && content.includes(targetSym));

    if (hasTargetSym && targetSym) {
      const idx = content.indexOf(targetSym);
      const before = content.slice(0, idx);
      const match = content.slice(idx, idx + targetSym.length);
      const after = content.slice(idx + targetSym.length);
      return (
        <>
          {before && renderTokenWithMathAccent(before, baseColor, false)}
          <span className="ide-token-focus-pulse">{match}</span>
          {after && renderTokenWithMathAccent(after, baseColor, false)}
        </>
      );
    }

    const parts = content.split(MATH_OPERATORS_SPLIT_REGEX);
    if (parts.length === 1) {
      return <span style={{ color: baseColor || '#cbd5e1' }}>{content}</span>;
    }
    return parts.map((part, i) => {
      if (IS_MATH_OPERATOR_REGEX.test(part)) {
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
        const isPrimary = idx === activeLineIdx;
        const isInBlock = idx >= activeLineIdx && idx <= activeEndLineIdx;
        return (
          <div
            className={`ide-line-row ${isPrimary ? 'active-line' : isInBlock ? 'active-block-line' : ''}`}
            key={idx}
            onClick={() => setManualLineIdx(idx)}
          >
            <span className="ide-line-num">
              {isPrimary ? `▸${idx + 1}` : idx + 1}
            </span>
            <span className="ide-line-code">
              {lineTokens.length === 0 ? (
                ' '
              ) : (
                lineTokens.map((tok, tIdx) => (
                  <React.Fragment key={tIdx}>
                    {renderTokenWithMathAccent(tok.content, tok.color, isInBlock)}
                  </React.Fragment>
                ))
              )}
            </span>
          </div>
        );
      });
    }

    const rawLines = activeFile.code.split('\n');
    return rawLines.map((line, idx) => {
      const isPrimary = idx === activeLineIdx;
      const isInBlock = idx >= activeLineIdx && idx <= activeEndLineIdx;
      return (
        <div
          className={`ide-line-row ${isPrimary ? 'active-line' : isInBlock ? 'active-block-line' : ''}`}
          key={idx}
          onClick={() => setManualLineIdx(idx)}
        >
          <span className="ide-line-num">
            {isPrimary ? `▸${idx + 1}` : idx + 1}
          </span>
          <span className="ide-line-code">{line || ' '}</span>
        </div>
      );
    });
  };

  const badgeType = activeFile.verificationBadge;
  const isWithdrawn = badgeType === 'WITHDRAWN_NOTICE';
  const isAuditDoc = badgeType === 'AUDIT_MARKDOWN';
  const isComparator = badgeType === 'COMPARATOR_CHALLENGE';

  const statusPillLabel = isWithdrawn
    ? '0 LEAN // WITHDRAWN'
    : isAuditDoc
      ? 'AUDIT SPEC // MD'
      : isComparator
        ? 'LEAN 4 // COMPARATOR'
        : 'KERNEL: 0 GOALS';

  return (
    <aside className="floating-instrument-panel right-lean-workspace">
      {/* SAPPHIRE IDE HEADER ZONE */}
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
            {statusPillLabel}
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

      {/* Multi-Tab Code Editor Bar */}
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
                onClick={() => {
                  onSelectFile(fid);
                  onSelectMode?.(file.moduleGroup, fid);
                }}
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

      {/* Breadcrumb Path Bar + Live Token Pointer */}
      <div className="ide-breadcrumb">
        <Cpu size={12} strokeWidth={1.5} color="#38bdf8" style={{ flexShrink: 0 }} />
        <span className="ide-breadcrumb-path" title={activeFile.fullPath}>
          {activeFile.filename}
        </span>
        <span
          className="ide-ast-token-badge"
          title={astFocus.phaseNote}
        >
          AST ▸ {astFocus.symbolToken}
        </span>
        <span className="ide-ln-pill">
          LN {activeLineIdx + 1}
          {activeEndLineIdx > activeLineIdx ? `–${activeEndLineIdx + 1}` : ''} / {actualLinesCount}
        </span>
      </div>

      {/* Shiki Dark-Slate Token Viewport */}
      <div className="ide-editor-scroll" ref={editorScrollRef}>
        {renderCodeContent()}
      </div>

      {/* WARM AMBER / GOLD SCALPEL AUDIT TERMINAL ZONE */}
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
            <div style={{ color: '#fde68a', marginBottom: 3 }}>
              <strong style={{ color: '#fbbf24' }}>AST Pointer (LN {activeLineIdx + 1}):</strong>{' '}
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{astFocus.symbolToken}</span> —{' '}
              <span style={{ color: '#e2e8f0' }}>{astFocus.phaseNote}</span>
            </div>
            <div style={{ color: '#cbd5e1' }}>{fileMeta.auditScopeNote}</div>
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
                    {fileMeta.argonPipelineStats.inputTokens}
                  </td>
                  <td style={{ color: '#f3e8ff', fontWeight: 600 }}>
                    {fileMeta.argonPipelineStats.outputTokens}
                  </td>
                  <td style={{ color: '#fef3c7', fontWeight: 600 }}>
                    {fileMeta.argonPipelineStats.shaderPasses}
                  </td>
                  <td style={{ color: fileMeta.statusColor, fontWeight: 700 }}>
                    {fileMeta.argonPipelineStats.verificationLatency}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ide-diag-body" style={{ fontFamily: 'var(--font-mono)' }}>
            {isWithdrawn ? (
              <div style={{ color: '#f43f5e' }}>
                <div>
                  ▼ Tactic State // CounterProof.lean:{activeLineIdx + 1}:2 [{astFocus.symbolToken}]
                </div>
                <div style={{ color: '#e2e8f0', margin: '4px 0' }}>
                  m : ℕ, hm : 0 &lt; m ⊢ signedDoublePoints m (-1) = -2 * ↑m ∧ signedDoublePoints m (-1) ≠ 0
                </div>
                <div style={{ color: '#34d399' }}>
                  ✓ Goals accomplished (0 goals remaining) — omega proved I_new = -2m ≠ 0!
                </div>
                <div style={{ color: '#fbbf24', marginTop: 4 }}>
                  ▸ {astFocus.phaseNote}
                </div>
              </div>
            ) : isAuditDoc ? (
              <div>
                <div style={{ color: '#fbbf24', marginBottom: 4 }}>
                  ✓ Post-Audit Reference Specification — {activeFile.filename} loaded.
                </div>
                <div style={{ color: '#cbd5e1' }}>
                  • 16 Proven Mathematical & Physical Walls • Strict Scalpel Separation Verified
                </div>
                <div style={{ color: '#38bdf8', marginTop: 6 }}>
                  ▸ Active Wall Pointer (LN {activeLineIdx + 1}): {astFocus.symbolToken} — {astFocus.phaseNote}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ color: '#34d399', marginBottom: 4 }}>
                  ✓ leanprover/lean4:v4.34.1 — {isComparator ? 'Comparator Challenge AST' : 'Zero-Sorry Proof'} in {activeFile.filename} typechecked.
                </div>
                <div style={{ color: '#cbd5e1' }}>
                  • Universes: u v w • Mathlib4 revision: 4.34.1-patched • Symbol: <strong style={{ color: '#38bdf8' }}>{astFocus.symbolToken}</strong>
                </div>
                <div style={{ color: '#fbbf24', marginTop: 6 }}>
                  ▸ Live AST Binding (LN {activeLineIdx + 1}): {astFocus.phaseNote}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
