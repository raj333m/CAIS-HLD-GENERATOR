'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Clock,
  AlertCircle,
  FileText,
  Eye,
  CheckCircle2,
  ArrowRight,
  Filter,
  Search,
  Layers,
} from 'lucide-react';
import { StatusBadge } from '@/styles/tokens';

export default function PendingApprovalPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPendingChanges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/changes');
      if (res.ok) {
        const data = await res.json();
        // Filter changes authored by this BA that are NOT Approved (i.e. IN_REVIEW or DRAFT/SENT_BACK)
        const pending = (data.changes || []).filter((c: any) => {
          const isNotApproved = c.status !== 'APPROVED';
          // If in production multi-user, filter by createdById if available
          return isNotApproved;
        });
        setChanges(pending);
      }
    } catch (e) {
      console.error('Failed to fetch pending changes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingChanges();
  }, []);

  const filtered = changes.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(s) ||
      c.crReference?.toLowerCase().includes(s) ||
      c.businessDriver?.toLowerCase().includes(s) ||
      c.hldProjectName?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending for Approval Queue
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Pending for Approval
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track all authored Change Requests awaiting Reviewer approval or requiring revision resubmission across your HLD projects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/document"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Layers className="w-4 h-4" /> Go to Consolidated HLD
          </Link>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Change Ref, Title, or HLD Project..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Showing {filtered.length} pending change(s)
        </div>
      </div>

      {/* Primary Table (Part B Spec) */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Creation Date</th>
                <th className="p-3.5">Reviewer Name</th>
                <th className="p-3.5">Review Date</th>
                <th className="p-3.5">Change Title & Project</th>
                <th className="p-3.5">Version</th>
                <th className="p-3.5">Change Number</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading pending approval queue...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No pending changes awaiting approval.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const reviewerName = c.reviewedByName || c.reviewedBy?.name || '—';
                  const reviewDate = c.reviewedByName && c.updatedAt
                    ? new Date(c.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';
                  const creationDateDisplay = c.creationDate || (c.createdAt ? c.createdAt.substring(0, 10) : '2026-09-14');

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                        {creationDateDisplay}
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-slate-200 font-medium">
                        {reviewerName}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {reviewDate}
                      </td>
                      <td className="p-3.5 space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">{c.title}</div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono font-medium">
                            {c.hldProjectName || 'UK CAIS Regulatory Reporting'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        v{c.versionNumber || c.version || 1}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {c.crReference}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/changes/${c.id}/review`}
                          className="px-3.5 py-1.5 rounded-xl bg-[#C0272D] hover:bg-red-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all"
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
    </div>
  );
}
