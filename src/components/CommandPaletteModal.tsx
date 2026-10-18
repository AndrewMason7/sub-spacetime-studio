import React, { useState, useEffect, useRef } from 'react';
import { Search, FileCode, Orbit, Zap, AlertTriangle, CornerDownLeft } from 'lucide-react';
import { THEOREM_SCENES } from '../data/theoremsCatalog';
import { LEAN_REPOSITORY_FILES } from '../data/leanRepositoryFiles';
import { SceneModeId } from '../types/workstation';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: SceneModeId) => void;
  onOpenLeanFile: (fileId: string) => void;
  onTriggerQuickAction: (mode: SceneModeId) => void;
}

interface PaletteActionItem {
  id: string;
  group: string;
  code?: string;
  title: string;
  color: string;
  iconType: 'orbit' | 'alert' | 'zap' | 'file';
  rightMeta?: string;
  execute: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  onOpenLeanFile,
  onTriggerQuickAction
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const items: PaletteActionItem[] = [];

  Object.values(THEOREM_SCENES).forEach((s) => {
    if (
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.shortTitle.toLowerCase().includes(q) ||
      s.codeName.toLowerCase().includes(q)
    ) {
      items.push({
        id: `scene-${s.id}`,
        group: '3D QUANTUM GRAVITY SIMULATION MODULES',
        code: s.codeName,
        title: s.title,
        color: s.statusColor,
        iconType: s.id === 'retraction' ? 'alert' : 'orbit',
        execute: () => {
          onSelectMode(s.id);
          onClose();
        }
      });
    }
  });

  const triggers: PaletteActionItem[] = [
    {
      id: 'trig-observer',
      group: 'INSTANT PHYSICS PHASE TRIGGERS',
      title: 'Toggle Observer Worldline Collapse / Expansion (S_Ob ↔ 0)',
      color: '#7dd3fc',
      iconType: 'zap',
      execute: () => {
        onSelectMode('observer');
        onTriggerQuickAction('observer');
        onClose();
      }
    },
    {
      id: 'trig-fkcrt',
      group: 'INSTANT PHYSICS PHASE TRIGGERS',
      title: 'Cross Critical Phase Threshold q = 4.0 (Sphere → Brownian CRT)',
      color: '#c084fc',
      iconType: 'zap',
      execute: () => {
        onSelectMode('fkcrt');
        onTriggerQuickAction('fkcrt');
        onClose();
      }
    },
    {
      id: 'trig-retraction',
      group: 'INSTANT PHYSICS PHASE TRIGGERS',
      title: 'Execute F032 Sign-Error Shatter (+1 → -1 Cusp Singularity)',
      color: '#f43f5e',
      iconType: 'alert',
      execute: () => {
        onSelectMode('retraction');
        onTriggerQuickAction('retraction');
        onClose();
      }
    }
  ];

  triggers.forEach((t) => {
    if (!q || t.title.toLowerCase().includes(q)) {
      items.push(t);
    }
  });

  LEAN_REPOSITORY_FILES.forEach((f) => {
    if (
      !q ||
      f.filename.toLowerCase().includes(q) ||
      f.fullPath.toLowerCase().includes(q)
    ) {
      items.push({
        id: `file-${f.id}`,
        group: 'LEAN 4 FORMAL REPOSITORY FILES (openai/math & walls-theorems)',
        code: f.filename,
        title: f.fullPath,
        color: f.badgeColor,
        iconType: 'file',
        rightMeta: `${f.linesCount} LOC`,
        execute: () => {
          onOpenLeanFile(f.id);
          onClose();
        }
      });
    }
  });

  const safeIdx = Math.max(0, Math.min(selectedIndex, Math.max(0, items.length - 1)));

  return (
    <div className="ws-modal-backdrop" onClick={onClose}>
      <div className="ws-cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ws-cmd-input-row">
          <Search size={14} strokeWidth={1.5} color="#7dd3fc" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search theorems (F211, F260, F348, F032), Lean 4 AST, or use ↑/↓ arrows..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onClose();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((i) => (items.length ? (i + 1) % items.length : 0));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((i) =>
                  items.length ? (i - 1 + items.length) % items.length : 0
                );
              } else if (e.key === 'Enter' && items[safeIdx]) {
                e.preventDefault();
                items[safeIdx].execute();
              }
            }}
          />
          <kbd onClick={onClose} style={{ cursor: 'pointer' }}>ESC</kbd>
        </div>

        <div className="ws-cmd-results">
          {items.map((item, idx) => {
            const showGroupHeader =
              idx === 0 || items[idx - 1].group !== item.group;
            const isSelected = idx === safeIdx;

            return (
              <React.Fragment key={item.id}>
                {showGroupHeader && (
                  <div className="ws-cmd-group-title">{item.group}</div>
                )}
                <button
                  className={`ws-cmd-item ${isSelected ? 'selected' : ''}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={item.execute}
                >
                  <div className="ws-cmd-item-left">
                    {item.iconType === 'alert' && (
                      <AlertTriangle size={14} strokeWidth={1.5} color={item.color} />
                    )}
                    {item.iconType === 'orbit' && (
                      <Orbit size={14} strokeWidth={1.5} color={item.color} />
                    )}
                    {item.iconType === 'zap' && (
                      <Zap size={14} strokeWidth={1.5} color={item.color} />
                    )}
                    {item.iconType === 'file' && (
                      <FileCode size={14} strokeWidth={1.5} color={item.color} />
                    )}
                    {item.code && (
                      <span className="ws-cmd-item-code" style={{ color: item.color }}>
                        {item.code}
                      </span>
                    )}
                    <span className="ws-cmd-item-title">{item.title}</span>
                  </div>
                  {item.rightMeta ? (
                    <span style={{ fontSize: '9px', color: '#64748b' }}>
                      {item.rightMeta}
                    </span>
                  ) : (
                    <CornerDownLeft size={13} strokeWidth={1.5} color="#64748b" />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
