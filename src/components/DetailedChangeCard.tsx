'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  UserCheck,
  Edit3,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { StatusBadge, BrandChip, VariableChip } from '@/styles/tokens';

export interface CaisChangeEntry {
  id?: string;
  crReference: string;
  title: string;
  status: string;
  businessDriver: string;
  description: string;
  sectionsUpdated?: string;
  beforeText?: string;
  afterText?: string;
  impactedBureaus?: string; // Impacted Brands
  impactedDataItems?: string; // Impacted CAIS Variables
  targetMonth: string;
  reviewedBy?: { name?: string } | null;
  reviewedById?: string | null;
  reviewComments?: string | null;
  approvedAt?: string | Date | null;
  createdAt?: string | Date | null;
  createdBy?: { name?: string } | null;
}

interface DetailedChangeCardProps {
  change: CaisChangeEntry;
  defaultExpanded?: boolean;
  isBaOrAdmin?: boolean;
  onEdit?: (change: CaisChangeEntry) => void;
  onDelete?: (id: string) => void;
}

export default function DetailedChangeCard({
  change,
  defaultExpanded = false,
  isBaOrAdmin = true,
  onEdit,
  onDelete,
}: DetailedChangeCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Parse Tag Chips (e.g. HSBC Cards (51), First Direct (211))
  const parseChips = (str?: string) => {
    if (!str || str === 'N/A') return [];
    return str.split(/[,;]/).map((item) => item.trim()).filter(Boolean);
  };

  const brandChips = parseChips(change.impactedBureaus);
  const variableChips = parseChips(change.impactedDataItems);

  // Helper for bracketed placeholder text style
  const renderTextWithPlaceholderCheck = (text?: string) => {
    if (!text) {
      return <span className="text-slate-400 dark:text-slate-500 italic font-mono text-xs">Not specified</span>;
    }
    const isPlaceholder = text.trim().startsWith('[') && text.trim().endsWith(']');
    if (isPlaceholder) {
      return (
        <span className="text-amber-600/90 dark:text-amber-400/90 italic font-mono text-xs font-medium">
          {text}
        </span>
      );
    }
    return <span>{text}</span>;
  };

  // Reviewed / Approved By Value
  const renderReviewedBy = () => {
    const isApproved = (change.status || '').toUpperCase() === 'APPROVED';
    if (isApproved && (change.reviewedBy?.name || change.reviewedById || change.approvedAt)) {
      const dateStr = change.approvedAt
        ? new Date(change.approvedAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '[Date]';
      return (
        <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          {change.reviewedBy?.name || '[Name]'} — {dateStr}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono text-slate-500 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
        <Clock className="w-3 h-3 text-slate-400" /> Pending review (Status is {change.status === 'DRAFT' ? 'Draft' : change.status || 'Draft'})
      </span>
    );
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
      {/* 1. Collapsed Header Row (Always Visible) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-100/60 dark:bg-slate-900/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/60"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono text-xs font-bold shrink-0 border border-blue-500/20">
            {change.crReference.replace('CAIS-', '')}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span className="font-mono text-blue-600 dark:text-blue-400">{change.crReference}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>{change.title}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{change.targetMonth}</span>
          </div>
          <StatusBadge status={change.status} />
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Body Card Details */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-xs">
          {/* 3. Business / Regulatory Driver */}
          <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4">
            <span className="w-48 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider">
              Business/Regulatory Driver
            </span>
            <div className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {change.businessDriver}
            </div>
          </div>

          {/* 4. Description of Change (Full Width) */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Description of Change
            </span>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal shadow-2xs">
              {change.description}
            </div>
          </div>

          {/* 5. Section(s) Updated */}
          <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4 pt-1">
            <span className="w-48 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider">
              Section(s) Updated
            </span>
            <div className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-500/20 inline-block">
              {change.sectionsUpdated || 'Section 1.3 — Exclusion Rules; Section 2.5 — Report Layout'}
            </div>
          </div>

          {/* 6. Before / After (Side by Side or Stacked Panels) */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Before / After Logic
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Before Panel */}
              <div className="p-3.5 rounded-xl border-l-4 border-l-rose-500 bg-rose-500/5 dark:bg-rose-950/20 border border-slate-200 dark:border-slate-800/80 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Before (Prior Logic)</span>
                </div>
                <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                  {renderTextWithPlaceholderCheck(change.beforeText)}
                </div>
              </div>

              {/* After Panel */}
              <div className="p-3.5 rounded-xl border-l-4 border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 border border-slate-200 dark:border-slate-800/80 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>After (Corrected / New Logic)</span>
                </div>
                <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                  {renderTextWithPlaceholderCheck(change.afterText)}
                </div>
              </div>
            </div>
          </div>

          {/* 7. Impacted Brands (Chips flex row) */}
          <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 pt-1">
            <span className="w-48 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider">
              Impacted Brands
            </span>
            <div className="flex flex-wrap gap-1.5">
              {brandChips.length > 0 ? (
                brandChips.map((brand, idx) => <BrandChip key={idx} brand={brand} />)
              ) : (
                <span className="text-slate-400 text-xs italic">None specified</span>
              )}
            </div>
          </div>

          {/* 8. Impacted CAIS Variables (Chips flex row, distinct color) */}
          <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 pt-1">
            <span className="w-48 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider">
              Impacted CAIS Variables
            </span>
            <div className="flex flex-wrap gap-1.5">
              {variableChips.length > 0 ? (
                variableChips.map((v, idx) => <VariableChip key={idx} variable={v} />)
              ) : (
                <span className="text-slate-400 text-xs italic">None specified</span>
              )}
            </div>
          </div>

          {/* 9. Target Implementation Month */}
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 pt-1">
            <span className="w-48 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider">
              Target Implementation Month
            </span>
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {change.targetMonth}
            </div>
          </div>

          {/* 10. Reviewed / Approved By */}
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="w-48 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider">
              Reviewed / Approved By
            </span>
            <div>{renderReviewedBy()}</div>
          </div>

          {/* BA / Admin Actions: Modify / Delete Entry */}
          {isBaOrAdmin && (onEdit || onDelete) && (
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(change);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Modify / Edit Entry
                </button>
              )}
              {onDelete && change.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(change.id!);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Entry
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
