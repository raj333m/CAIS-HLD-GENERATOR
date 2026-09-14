'use client';

import React, { useState, useMemo } from 'react';
import { FileDiff, Columns, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export interface DiffViewerProps {
  beforeText?: string;
  afterText?: string;
  defaultMode?: 'diff' | 'side-by-side';
}

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export function computeWordDiff(oldText?: string, newText?: string): DiffPart[] {
  const cleanOld = oldText || '';
  const cleanNew = newText || '';

  if (!cleanOld && !cleanNew) return [];
  if (!cleanOld) return [{ value: cleanNew, added: true }];
  if (!cleanNew) return [{ value: cleanOld, removed: true }];

  const oldWords = cleanOld.split(/(\s+)/).filter(Boolean);
  const newWords = cleanNew.split(/(\s+)/).filter(Boolean);

  const n = oldWords.length;
  const m = newWords.length;

  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = n;
  let j = m;
  const rawParts: DiffPart[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      rawParts.push({ value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawParts.push({ value: newWords[j - 1], added: true });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawParts.push({ value: oldWords[i - 1], removed: true });
      i--;
    }
  }

  rawParts.reverse();

  const merged: DiffPart[] = [];
  for (const part of rawParts) {
    if (merged.length > 0) {
      const last = merged[merged.length - 1];
      if (Boolean(last.added) === Boolean(part.added) && Boolean(last.removed) === Boolean(part.removed)) {
        last.value += part.value;
        continue;
      }
    }
    merged.push({ ...part });
  }

  return merged;
}

export default function DiffViewer({
  beforeText = '',
  afterText = '',
  defaultMode = 'diff',
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'diff' | 'side-by-side'>(defaultMode);

  const diffParts = useMemo(() => {
    return computeWordDiff(beforeText, afterText);
  }, [beforeText, afterText]);

  const renderTextCheck = (text?: string) => {
    if (!text || !text.trim()) {
      return <span className="text-slate-400 dark:text-slate-500 italic font-mono text-xs">Not specified</span>;
    }
    return <span>{text}</span>;
  };

  const hasAdded = diffParts.some((p) => p.added);
  const hasRemoved = diffParts.some((p) => p.removed);

  return (
    <div className="space-y-2 pt-1 font-sans">
      {/* Header Bar with Mode Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileDiff className="w-3.5 h-3.5 text-purple-500" /> Before / After Logic Comparison
        </span>

        {/* Mode Toggle Button Group */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setViewMode('diff')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
              viewMode === 'diff'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileDiff className="w-3 h-3" />
            <span>Diff View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
              viewMode === 'side-by-side'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Columns className="w-3 h-3" />
            <span>Side-by-side</span>
          </button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'diff' ? (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
          <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
            {diffParts.length === 0 ? (
              <span className="text-slate-400 italic font-mono">No logic specified for before/after comparison.</span>
            ) : (
              diffParts.map((part, idx) => {
                if (part.added) {
                  return (
                    <mark
                      key={idx}
                      className="bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-semibold border-b-2 border-emerald-500 px-1 py-0.5 rounded mx-0.5 no-underline inline"
                    >
                      {part.value}
                    </mark>
                  );
                }
                if (part.removed) {
                  return (
                    <del
                      key={idx}
                      className="bg-rose-500/25 text-rose-800 dark:text-rose-300 line-through border-b-2 border-rose-500 px-1 py-0.5 rounded mx-0.5 inline opacity-90 font-medium"
                    >
                      {part.value}
                    </del>
                  );
                }
                return <span key={idx}>{part.value}</span>;
              })
            )}
          </div>

          {/* Diff Legend Footer */}
          <div className="flex items-center gap-4 text-[10px] font-mono pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Added to After Logic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="font-semibold text-rose-600 dark:text-rose-400 line-through">Removed from Before Logic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              <span>Unchanged Logic Baseline</span>
            </div>
          </div>
        </div>
      ) : (
        /* Side-by-side View Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Before Panel */}
          <div className="p-3.5 rounded-xl border-l-4 border-l-rose-500 bg-rose-500/5 dark:bg-rose-950/20 border border-slate-200 dark:border-slate-800/80 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Before (Prior Logic)</span>
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
              {renderTextCheck(beforeText)}
            </div>
          </div>

          {/* After Panel */}
          <div className="p-3.5 rounded-xl border-l-4 border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 border border-slate-200 dark:border-slate-800/80 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>After (Corrected / New Logic)</span>
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
              {renderTextCheck(afterText)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
