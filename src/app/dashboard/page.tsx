'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  Calendar,
  UserCheck,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { StatusBadge } from '@/styles/tokens';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/changes');
      if (res.ok) {
        const data = await res.json();
        setChanges(data.changes || []);
      }
    } catch (e) {
      console.error('Failed to fetch changes for dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  // Helper to determine Pending With state
  const getPendingWith = (status: string) => {
    if (status === 'IN_REVIEW') return 'Reviewer';
    if (status === 'DRAFT' || status === 'REVISION_REQUESTED') return 'BA';
    return '—';
  };

  // Status counts
  const totalLogged = changes.length;
  const countDraft = changes.filter(
    (c) => c.status === 'DRAFT' || c.status === 'REVISION_REQUESTED'
  ).length;
  const countInReview = changes.filter((c) => c.status === 'IN_REVIEW').length;
  const countApproved = changes.filter((c) => c.status === 'APPROVED').length;

  const pendingOnBA = countDraft;
  const pendingOnReviewer = countInReview;

  // Sorting: Pending on Reviewer & Pending on BA first, then others
  const filteredChanges = changes
    .filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.crReference.toLowerCase().includes(search.toLowerCase()) ||
        (c.businessDriver && c.businessDriver.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const priority: Record<string, number> = {
        IN_REVIEW: 1,
        REVISION_REQUESTED: 2,
        DRAFT: 3,
        APPROVED: 4,
        REJECTED: 5,
      };
      return (priority[a.status] || 9) - (priority[b.status] || 9);
    });



  const [hldReviewProgress, setHldReviewProgress] = useState<{ approved: number; feedback: number; status: string }>({ approved: 0, feedback: 0, status: 'DRAFT' });

  useEffect(() => {
    fetch('/api/section-reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews) {
          const reviews = data.reviews;
          const nums = ['1.1', '1.2', '1.3', '1.4', '1.5', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '3.0', '4.0'];
          const appCount = nums.filter((n) => reviews[n]?.status === 'APPROVED').length;
          const fbCount = nums.filter((n) => reviews[n]?.status === 'FEEDBACK_SHARED').length;
          let status = 'DRAFT';
          if (appCount === 14) status = 'APPROVED';
          else if (appCount > 0 || fbCount > 0) status = 'UNDER_REVIEW';
          setHldReviewProgress({ approved: appCount, feedback: fbCount, status });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            CAIS Change Activity Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consolidated HLD Status: <span className="font-bold text-slate-700 dark:text-slate-200">{hldReviewProgress.approved}/14 Sections Approved</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-bold shadow-xs">
            <span>HLD Status:</span>
            <StatusBadge status={hldReviewProgress.status} />
          </div>
          <Link
            href="/document"
            className="px-4 py-2 rounded-xl bg-[#C0272D] hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            View HLD Document <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Row of Stat Tiles Across Top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Logged */}
        <div className="glass-card p-5 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Logged</span>
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalLogged}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">All registered changes</div>
        </div>

        {/* Count in Draft */}
        <div className="glass-card p-5 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Draft / Rework</span>
            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{countDraft}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Being edited by BA</div>
        </div>

        {/* Count In Review */}
        <div className="glass-card p-5 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">In Review</span>
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-300">{countInReview}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Awaiting review decision</div>
        </div>

        {/* Count Approved */}
        <div className="glass-card p-5 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{countApproved}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Merged into Living HLD</div>
        </div>

        {/* Pending Action Owner Split Tile */}
        <div className="glass-card p-5 rounded-2xl space-y-2 border border-indigo-500/30 bg-indigo-500/5">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Action</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pendingOnBA}</span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1">on BA</span>
            </div>
            <div className="text-slate-400 font-light">/</div>
            <div>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-300">{pendingOnReviewer}</span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1">on Reviewer</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {pendingOnReviewer > 0 ? `${pendingOnReviewer} awaiting review decision` : 'No reviewer bottlenecks'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search change reference, title..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="REVISION_REQUESTED">Revision Requested</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>
      </div>

      {/* Action Table: Changes List */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">CAIS Change Workflow Status</h2>
            <p className="text-xs text-slate-500">Sorted to prioritize items requiring active BA or Reviewer action</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">{filteredChanges.length} entries</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading change activity table...</div>
        ) : filteredChanges.length === 0 ? (
          <div className="text-center py-12 space-y-2 text-slate-500">
            <FileText className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-medium">No matching changes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">CR Reference</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Target Month</th>
                  <th className="py-3.5 px-4 text-center">Pending With</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredChanges.map((change) => {
                  const pendingOwner = getPendingWith(change.status);

                  return (
                    <tr
                      key={change.id}
                      onClick={() => router.push(`/changes/${change.id}/review`)}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {change.crReference}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate group-hover:text-blue-500 transition-colors">
                        {change.title}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={change.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {change.targetMonth || 'November 2026'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {pendingOwner === 'BA' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            BA
                          </span>
                        )}
                        {pendingOwner === 'Reviewer' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                            Reviewer
                          </span>
                        )}
                        {pendingOwner === '—' && (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-500 font-medium text-xs">
                          <span>View Detail</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
