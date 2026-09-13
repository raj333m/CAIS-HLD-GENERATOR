'use client';

import React from 'react';
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Shield,
  User,
  XCircle,
  Tag,
  AlertTriangle,
  Layers,
  Building,
  FileCode,
} from 'lucide-react';

export const TOKENS = {
  brand: {
    primary: '#C0272D', // HSBC Red
    primaryHover: '#a81f24',
    secondary: '#2563eb', // Blue
  },
  geometry: {
    chip: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-xs whitespace-nowrap',
    cardMain: 'glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900',
    cardSub: 'p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40',
    tableHeader: 'bg-[#C0272D] text-white font-bold sticky top-0 z-10 shadow-xs',
    keyField: 'inline-block font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/80',
  },
  docTypography: {
    h1: 'text-[16pt] font-bold text-[#C0272D] border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 scroll-mt-24',
    h2: 'text-[13pt] font-bold text-[#202020] dark:text-white',
    h3: 'text-[11.5pt] font-bold italic text-[#202020] dark:text-white',
    h4: 'text-[11pt] font-bold text-[#404040] dark:text-slate-300',
    body: 'text-[11pt] text-[#1A1A1A] dark:text-slate-200 leading-relaxed font-sans',
    caption: 'text-[9pt] italic text-[#606060] dark:text-slate-400',
  },
};

export const STATUS_CONFIG: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  DRAFT: {
    bg: 'bg-slate-500/15 dark:bg-slate-800/80',
    text: 'text-slate-800 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    label: 'Draft',
    icon: FileText,
  },
  IN_REVIEW: {
    bg: 'bg-amber-500/15 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700/60',
    label: 'Under Review',
    icon: Clock,
  },
  UNDER_REVIEW: {
    bg: 'bg-amber-500/15 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700/60',
    label: 'Under Review',
    icon: Clock,
  },
  FEEDBACK_SHARED: {
    bg: 'bg-rose-500/15 dark:bg-rose-950/60',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-700/60',
    label: 'Feedback Shared',
    icon: AlertCircle,
  },
  REVISION_REQUESTED: {
    bg: 'bg-rose-500/15 dark:bg-rose-950/60',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-700/60',
    label: 'Draft (Revision Requested)',
    icon: AlertCircle,
  },
  PENDING: {
    bg: 'bg-slate-500/10 dark:bg-slate-800/60',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    label: 'Pending Review',
    icon: Clock,
  },
  APPROVED: {
    bg: 'bg-emerald-500/15 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700/60',
    label: 'Approved',
    icon: CheckCircle2,
  },
};

export const RULE_CATEGORY_CONFIG: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  'Eligibility & Product Scope': {
    bg: 'bg-blue-500/15 dark:bg-blue-950/60',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700/60',
    icon: Shield,
  },
  'Ownership & Customer Mapping': {
    bg: 'bg-purple-500/15 dark:bg-purple-950/60',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700/60',
    icon: User,
  },
  'Card/Account Type Exclusion': {
    bg: 'bg-slate-500/15 dark:bg-slate-800/80',
    text: 'text-slate-800 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    icon: XCircle,
  },
  'Indicator Check': {
    bg: 'bg-teal-500/15 dark:bg-teal-950/60',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-700/60',
    icon: Tag,
  },
  'Data Integrity / Null Check': {
    bg: 'bg-amber-500/15 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700/60',
    icon: AlertTriangle,
  },
  'Closure & Default Logic': {
    bg: 'bg-red-500/15 dark:bg-red-950/60',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700/60',
    icon: Clock,
  },
  'Product Range Included': {
    bg: 'bg-emerald-500/15 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700/60',
    icon: Layers,
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const IconComponent = config.icon;

  return (
    <span
      className={`${TOKENS.geometry.chip} ${config.bg} ${config.text} ${config.border}`}
    >
      <IconComponent className="w-3 h-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}

export function RuleCategoryChip({ category }: { category: string }) {
  const config = RULE_CATEGORY_CONFIG[category] || {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-300 dark:border-slate-700',
    icon: Tag,
  };
  const IconComponent = config.icon;

  return (
    <span
      className={`${TOKENS.geometry.chip} ${config.bg} ${config.text} ${config.border}`}
    >
      <IconComponent className="w-3 h-3 shrink-0" />
      <span>{category}</span>
    </span>
  );
}

export function BrandChip({ brand }: { brand: string }) {
  return (
    <span
      className={`${TOKENS.geometry.chip} bg-indigo-500/15 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/60`}
    >
      <Building className="w-3 h-3 shrink-0 text-indigo-500" />
      <span>{brand}</span>
    </span>
  );
}

export function VariableChip({ variable }: { variable: string }) {
  return (
    <span
      className={`${TOKENS.geometry.chip} bg-cyan-500/15 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700/60`}
    >
      <FileCode className="w-3 h-3 shrink-0 text-cyan-500" />
      <span>{variable}</span>
    </span>
  );
}
