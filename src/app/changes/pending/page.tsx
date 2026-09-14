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
  MessageSquare,
} from 'lucide-react';
import { StatusBadge } from '@/styles/tokens';

export default function PendingApprovalPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const getTargetSectionNumbers = (sectionsUpdatedStr?: string): string[] => {
    if (!sectionsUpdatedStr || sectionsUpdatedStr === 'N/A') return [];
    const parts = sectionsUpdatedStr.split(/[,;]/);
    const nums: string[] = [];
    parts.forEach((p) => {
      const match = p.trim().match(/(\d+\.\d+|\d+\.0|\d+)/);
      if (match) {
        nums.push(match[1]);
      }
    });
    return Array.from(new Set(nums));
  };

  const getChangeReviewSummary = (c: any) => {
    const targetSectionNums = getTargetSectionNumbers(c.sectionsUpdated || c.biImpactedChange);
    const scopedSectionsList = targetSectionNums.length > 0
      ? targetSectionNums
      : ['1.1', '1.2', '1.3', '1.4', '1.5', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '3.1', '3.2', '4.0'];

    const scopedTotalCount = scopedSectionsList.length;

    let reviews: Record<string, any> = c.reviews || {};
    let currentRound = c.currentFeedbackRound || null;

    if (c.reviewComments) {
      try {
        const parsed = JSON.parse(c.reviewComments);
        if (parsed && parsed.reviews) reviews = { ...reviews, ...parsed.reviews };
        if (parsed && parsed.currentFeedbackRound) currentRound = parsed.currentFeedbackRound;
      } catch (e) {}
    }

    const scopedApprovedCount = scopedSectionsList.filter((num) => reviews[num]?.status === 'APPROVED').length;
    const percentage = scopedTotalCount > 0 ? Math.round((scopedApprovedCount / scopedTotalCount) * 100) : 0;

    // Identify sections with reviewer feedback / remarks awaiting BA action
    const feedbackSections: string[] = [];
    scopedSectionsList.forEach((num) => {
      const rev = reviews[num];
      if (rev && (rev.status === 'FEEDBACK_SHARED' || (rev.feedback && !rev.isAddressed))) {
        feedbackSections.push(num);
      }
    });

    if (currentRound && currentRound.sectionRemarks && Array.isArray(currentRound.sectionRemarks)) {
      currentRound.sectionRemarks.forEach((sr: any) => {
        if (sr.sectionNum && !sr.isAddressed && !feedbackSections.includes(sr.sectionNum)) {
          feedbackSections.push(sr.sectionNum);
        }
      });
    }

    const firstFeedbackSection = feedbackSections[0] || null;
    const hasFeedback = feedbackSections.length > 0 || c.status === 'SENT_BACK';

    return {
      scopedTotalCount,
      scopedApprovedCount,
      percentage,
      hasFeedback,
      feedbackCount: feedbackSections.length,
      firstFeedbackSection,
      feedbackSections,
      scopedSectionsList,
    };
  };

  const fetchPendingChanges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/changes');
      if (res.ok) {
        const data = await res.json();
        // Filter changes authored by this BA that are awaiting approval (IN_REVIEW) or requiring revision resubmission (SENT_BACK)
        const pending = (data.changes || []).filter((c: any) => {
          const isAwaitingOrRevision = c.status === 'IN_REVIEW' || c.status === 'SENT_BACK' || c.status === 'DRAFT';
          return isAwaitingOrRevision;
        });

        // Enrich with live section-reviews if available
        const enriched = await Promise.all(
          pending.map(async (c: any) => {
            try {
              const revRes = await fetch(`/api/section-reviews?changeId=${encodeURIComponent(c.id || c.crReference)}`);
              if (revRes.ok) {
                const revData = await revRes.json();
                return {
                  ...c,
                  reviews: revData.reviews || c.reviews || {},
                  currentFeedbackRound: revData.currentFeedbackRound || c.currentFeedbackRound || null,
                };
              }
            } catch (e) {}
            return c;
          })
        );

        setChanges(enriched);
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
                <th className="p-3.5">Approval Progress</th>
                <th className="p-3.5">Status & Remarks</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Loading pending approval queue...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No pending changes awaiting approval.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const summary = getChangeReviewSummary(c);
                  const hasBeenReviewed = Boolean(
                    c.reviewedByName &&
                    c.reviewedByName !== '[Name]' &&
                    c.reviewedByName !== 'Unassigned' &&
                    c.status !== 'IN_REVIEW'
                  );
                  const reviewerName = hasBeenReviewed ? (c.reviewedByName || c.reviewedBy?.name) : (c.reviewedByName || '—');
                  const reviewDate = hasBeenReviewed && c.updatedAt
                    ? new Date(c.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';
                  const creationDateDisplay = c.creationDate || (c.createdAt ? c.createdAt.substring(0, 10) : '2026-09-14');

                  const targetLandingSection = summary.firstFeedbackSection || (summary.scopedSectionsList && summary.scopedSectionsList.length > 0 ? summary.scopedSectionsList[0] : '1.1');
                  const detailUrl = `/document?changeId=${encodeURIComponent(c.id || c.crReference)}&mode=review&section=${targetLandingSection}`;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                        {creationDateDisplay}
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
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

                      {/* 1. Approval Completion Progress */}
                      <td className="p-3.5 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">
                              {summary.scopedApprovedCount} of {summary.scopedTotalCount} approved
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {summary.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                summary.percentage === 100
                                  ? 'bg-emerald-500'
                                  : summary.percentage > 0
                                  ? 'bg-blue-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${summary.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 2. Status & Reviewer Feedback Pending */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          <StatusBadge status={c.status} />
                          {summary.hasFeedback ? (
                            <div className="pt-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-xs">
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                Feedback Pending {summary.firstFeedbackSection ? `(Sec ${summary.firstFeedbackSection})` : ''}
                              </span>
                            </div>
                          ) : (
                            <div className="pt-0.5 text-[10px] text-slate-400 font-mono italic">
                              No pending remarks
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Action Link (Direct to feedback section if present) */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <Link
                          href={detailUrl}
                          title={
                            summary.firstFeedbackSection
                              ? `Open directly on Section ${summary.firstFeedbackSection} to address reviewer feedback`
                              : 'View change package details'
                          }
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all ${
                            summary.hasFeedback
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/20'
                              : 'bg-[#C0272D] hover:bg-red-700 text-white'
                          }`}
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

