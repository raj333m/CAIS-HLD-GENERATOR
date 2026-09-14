'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DetailedChangeCard from '@/components/DetailedChangeCard';
import {
  Search,
  Filter,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  ArrowRight,
  Eye,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function ChangesRegisterPage() {
  const { user } = useAuth();
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedChange, setSelectedChange] = useState<any>(null);
  const [sectionReviews, setSectionReviews] = useState<Record<string, any>>({});

  const fetchSectionReviews = async () => {
    try {
      const res = await fetch('/api/section-reviews');
      const data = await res.json();
      if (data.reviews) {
        setSectionReviews(data.reviews);
      }
    } catch (e) {
      console.error('Failed to fetch section reviews:', e);
    }
  };

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/changes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Filter submitted changes only for Reviewer Audit Logs (IN_REVIEW, SENT_BACK / REVISION_REQUESTED, APPROVED)
        const rawChanges = data.changes || [];
        const submittedOnly = rawChanges.filter((c: any) => c.status !== 'DRAFT');
        setChanges(submittedOnly);
        if (submittedOnly.length > 0 && !selectedChange) {
          setSelectedChange(submittedOnly[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectionReviews();
    fetchChanges();
  }, [search, statusFilter]);

  const getApprovedCount = () => {
    return Object.values(sectionReviews).filter((r: any) => r.status === 'APPROVED').length;
  };

  const approvedCount = getApprovedCount();
  const totalSections = 14;
  const progressPercent = Math.round((approvedCount / totalSections) * 100);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Lock className="w-3 h-3 text-emerald-500" /> Approved & Locked
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
            <Clock className="w-3 h-3 text-purple-500" /> In Review
          </span>
        );
      case 'SENT_BACK':
      case 'REVISION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-500" /> Draft (Revision Requested)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/20 text-slate-600 dark:text-slate-300 border border-slate-500/30">
            <Clock className="w-3 h-3" /> Submitted
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm bg-white dark:bg-slate-900">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C0272D]" /> CAIS Changes Audit Logs 2026
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reviewer Audit Log showing submitted change proposals, version progression, and section approval progress.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Change Ref, Title, or BA..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Submitted Statuses</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="SENT_BACK">Draft (Revision Requested)</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Audit Log Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 font-mono">
            <Layers className="w-4 h-4 text-purple-500" /> Submitted Changes Register ({changes.length})
          </h2>
          <span className="text-[11px] font-mono text-slate-500">Only submitted changes displayed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#C0272D] text-white uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3 w-28">Creation Date</th>
                <th className="p-3 w-32">Change Number</th>
                <th className="p-3 min-w-[220px]">Change Title</th>
                <th className="p-3 w-40">BA Name</th>
                <th className="p-3 w-20 text-center">Version</th>
                <th className="p-3 min-w-[180px]">Completion Progress Bar</th>
                <th className="p-3 w-28 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading submitted change register...
                  </td>
                </tr>
              ) : changes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No submitted changes found matching current filter choices.
                  </td>
                </tr>
              ) : (
                changes.map((c) => {
                  const itemProgress = c.status === 'APPROVED' ? 100 : progressPercent;
                  const itemApprovedCount = c.status === 'APPROVED' ? 14 : approvedCount;
                  const createdDateDisplay = c.creationDate || (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '2026-09-12');
                  const baAuthorName = c.requestedBy || c.createdBy?.name || 'Business Analyst (Author)';

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        selectedChange?.id === c.id ? 'bg-blue-500/5 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300 font-semibold whitespace-nowrap">
                        {createdDateDisplay}
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {c.crReference}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{c.title}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{c.businessDriver}</div>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                        {baAuthorName}
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                          v{c.versionNumber || 1}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-600 dark:text-slate-300 font-semibold">
                              {itemApprovedCount}/{totalSections} sections approved
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{itemProgress}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                itemProgress === 100
                                  ? 'bg-emerald-500'
                                  : itemProgress > 0
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${itemProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Link
                          href={`/changes/${c.id}/review`}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 transition-all shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> View in Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Change Entries Stack */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> Detailed Change Specifications
            </h2>
            <p className="text-xs text-slate-500">
              Append-only register of detailed Change Request specifications.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {changes.length} Entries Stacked
          </span>
        </div>

        <div className="space-y-4">
          {changes.map((c, idx) => (
            <DetailedChangeCard key={c.id || idx} change={c} defaultExpanded={idx === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
