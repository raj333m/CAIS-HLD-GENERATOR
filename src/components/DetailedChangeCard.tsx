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
import DiffViewer from '@/components/DiffViewer';

export interface CaisChangeEntry {
  id?: string;
  crReference: string;
  title: string;
  status: string;
  businessDriver?: string;
  impactedProducts?: string;
  description: string;
  sectionsUpdated?: string;
  biImpactedChange?: string;
  beforeText?: string;
  afterText?: string;
  impactedBureaus?: string; // Impacted Brands
  impactedDataItems?: string; // Impacted CAIS Variables
  targetMonth: string;
  creationDate?: string | null;
  submissionDate?: string | null;
  approvalDate?: string | null;
  versionNumber?: number;
  reviewedByName?: string | null;
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

  // 3-Date Model & Reviewed By Display
  const createdDateStr = change.creationDate || (change.createdAt ? new Date(change.createdAt).toISOString().split('T')[0] : '2026-09-12');
  const submittedDateStr = change.submissionDate || (change.status !== 'DRAFT' ? '2026-09-12' : null);
  const approvedDateStr = change.approvalDate || (change.approvedAt ? new Date(change.approvedAt).toISOString().split('T')[0] : null);
  const reviewerName = change.reviewedByName || change.reviewedBy?.name || 'Reviewer / Lead';

  return (
    <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
      {/* 1. Collapsed Header Row */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-100/60 dark:bg-slate-900/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/60"
      >
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span className="font-mono text-blue-600 dark:text-blue-400">{change.crReference}</span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                v{change.versionNumber || 1}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>{change.title}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Target: {change.targetMonth}</span>
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
          {/* 3-Date Lifecycle Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Creation Date</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{createdDateStr}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Submission Date</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {submittedDateStr || <span className="text-slate-400 italic">Not submitted</span>}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Approval Date</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {approvedDateStr || <span className="text-slate-400 italic">Pending approval</span>}
              </span>
            </div>
          </div>

          {/* Impacted Products */}
          <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4">
            <span className="w-48 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider">
              Impacted Products
            </span>
            <div className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {change.impactedProducts || change.businessDriver || 'Not specified'}
            </div>
          </div>

          {/* Description of Change */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Description of Change
            </span>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal shadow-2xs">
              {change.description}
            </div>
          </div>

          {/* BI Impacted Change */}
          <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4 pt-1">
            <span className="w-48 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider">
              BI Impacted Change
            </span>
            <div className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-500/20 inline-block">
              {change.biImpactedChange || change.sectionsUpdated || 'Staging, Snap'}
            </div>
          </div>

          {/* Before / After Logic Diff */}
          <DiffViewer beforeText={change.beforeText} afterText={change.afterText} />

          {/* Impacted Brands */}
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

          {/* Impacted CAIS Variables */}
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

          {/* Reviewed / Approved By */}
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="w-48 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider">
              Reviewed By (Reviewer Name)
            </span>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>{reviewerName}</span>
              {approvedDateStr && <span className="text-slate-400 font-mono text-[11px]">({approvedDateStr})</span>}
            </div>
          </div>

          {/* BA / Admin Actions */}
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
              {onDelete && (change.id || change.crReference) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete((change.id || change.crReference)!);
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
