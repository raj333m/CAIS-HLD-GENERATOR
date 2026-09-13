'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  FileText,
  Building2,
  Lock,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight,
  Home,
  CheckSquare,
  Square,
  HelpCircle,
} from 'lucide-react';

export default function ReviewChangePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [change, setChange] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);

  // Per-section Review & Approval State (Tier 1)
  const [sectionApprovals, setSectionApprovals] = useState<Record<string, boolean>>({});
  const [sectionRemarks, setSectionRemarks] = useState<Record<string, string>>({});
  const [openRemarkInputs, setOpenRemarkInputs] = useState<Record<string, boolean>>({});

  const isReviewerOrAdmin = user?.role === 'REVIEWER' || user?.role === 'ADMIN';

  const fetchChange = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/changes`);
      if (res.ok) {
        const data = await res.json();
        const found = (data.changes || []).find((c: any) => c.id === id);
        if (found) {
          setChange(found);
          setReviewComments(found.reviewComments || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChange();
  }, [id]);

  // Extract list of sub-sections included in this specific Change Request
  const getCrSections = (): string[] => {
    if (!change?.sectionsUpdated) return ['Section 1.3 — Exclusion Rules', 'Section 2.5 — Variable Layout'];
    const raw = change.sectionsUpdated;
    if (raw.includes(';')) {
      return raw.split(';').map((s: string) => s.trim()).filter(Boolean);
    } else if (raw.includes(',')) {
      return raw.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [raw.trim()];
  };

  const crSections = getCrSections();
  const totalSectionsCount = crSections.length;
  const approvedSectionsCount = crSections.filter((sec) => !!sectionApprovals[sec]).length;
  const allSectionsApproved = totalSectionsCount > 0 && approvedSectionsCount === totalSectionsCount;

  const toggleSectionApproval = (sec: string) => {
    setSectionApprovals((prev) => ({
      ...prev,
      [sec]: !prev[sec],
    }));
  };

  const toggleRemarkInput = (sec: string) => {
    setOpenRemarkInputs((prev) => ({
      ...prev,
      [sec]: !prev[sec],
    }));
  };

  const handleSectionRemarkChange = (sec: string, text: string) => {
    setSectionRemarks((prev) => ({
      ...prev,
      [sec]: text,
    }));
  };

  const handleReviewAction = async (newStatus: 'APPROVED' | 'SENT_BACK') => {
    if (newStatus === 'APPROVED' && !allSectionsApproved) {
      return; // Strictly gated
    }

    setSubmitting(true);
    try {
      // Create section update dictionary for target living sections
      const updatedSectionContent: Record<string, string> = {};
      if (change?.sectionsUpdated && change?.afterText) {
        const secList = change.sectionsUpdated.split(',').map((s: string) => s.trim());
        secList.forEach((secNum: string) => {
          updatedSectionContent[secNum] = `[UPDATED via ${change.crReference} - ${change.title}]\n\n${change.afterText}\n\n(Living Current State maintained as of ${new Date().toLocaleDateString()})`;
        });
      }

      // Compile combined section remarks into overall review comments
      const compiledRemarks = Object.entries(sectionRemarks)
        .filter(([_, r]) => r.trim().length > 0)
        .map(([sec, r]) => `[${sec}]: ${r}`)
        .join('\n');
      
      const fullComments = reviewComments
        ? `${reviewComments}\n\nSection Remarks:\n${compiledRemarks}`
        : compiledRemarks;

      const res = await fetch(`/api/changes/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reviewComments: fullComments,
          reviewerId: user?.id,
          updatedSectionContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChange(data.change);
        setActionDone(newStatus);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-400 text-sm">
        Loading Change Review Portal...
      </div>
    );
  }

  if (!change) {
    return (
      <div className="text-center py-24 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <div className="text-lg font-bold text-slate-900 dark:text-white">Change Entry Not Found</div>
        <Link href="/changes" className="text-xs text-blue-600 hover:underline">
          Return to Change Register
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <Link
          href="/dashboard"
          className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Home className="w-4 h-4 text-blue-500" />
          <span>Home (Dashboard)</span>
        </Link>
      </div>

      {/* Main Review Panel */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-md bg-white dark:bg-slate-900">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                {change.crReference}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                change.status === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : change.status === 'SENT_BACK'
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
              }`}>
                {change.status === 'SENT_BACK' ? 'Draft (Revision Requested)' : change.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{change.title}</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Submitted by <strong className="text-slate-900 dark:text-white">{change.createdBy?.name || 'BA Author'}</strong> for target implementation in <strong className="text-slate-900 dark:text-white">{change.targetMonth}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/api/export/docx"
              download
              className="px-3.5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20 transition-all"
            >
              Export Preview Docx
            </Link>
          </div>
        </div>

        {actionDone && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            actionDone === 'APPROVED'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}>
            {actionDone === 'APPROVED' ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Change approved successfully! Target living sections ({change.sectionsUpdated}) have been updated in-place and version snapshots recorded.</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>Change sent back to BA author for revision with reviewer comments.</span>
              </>
            )}
          </div>
        )}

        {/* Change Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">Change Category:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{change.changeType}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Impacted Brands:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {change.impactedBureaus || 'HSBC Retail 85, HSBC Cards 51, M&S Loans - 947, First Direct 211'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Impacted Products:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {change.impactedProducts || 'Cards, Mortgages, Loans, Unsecured Loans'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Regulatory Driver:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{change.businessDriver}</span>
          </div>
        </div>

        {/* Change Narrative */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Change Narrative & Scope
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {change.description || 'This change updates exclusion rules and reporting conventions for settled accounts.'}
          </p>
        </div>

        {/* PER-SECTION REVIEW CARDS & TIER 1 CONTROLS */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4" /> Sub-Sections Included in this Change ({crSections.length})
            </h3>
            {isReviewerOrAdmin && (
              <span className="text-[11px] text-slate-400 font-mono">
                Tier 1 Controls: Approve sections individually
              </span>
            )}
          </div>

          <div className="space-y-3">
            {crSections.map((secName, secIdx) => {
              const isApproved = !!sectionApprovals[secName];
              const showRemarkInput = !!openRemarkInputs[secName];
              const secRemark = sectionRemarks[secName] || '';

              return (
                <div
                  key={secIdx}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isApproved
                      ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                        {secName}
                      </span>
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Approved
                        </span>
                      )}
                    </div>

                    {/* TIER 1 CONTROLS: Rendered strictly for Reviewer/Lead/Admin */}
                    {isReviewerOrAdmin && (
                      <div className="flex items-center gap-2">
                        {/* Leave Remark Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleRemarkInput(secName)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3 text-slate-500" />
                          <span>{showRemarkInput ? 'Hide Remark' : 'Leave Remark'}</span>
                        </button>

                        {/* Approve Section Checkbox / Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleSectionApproval(secName)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                            isApproved
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          {isApproved ? (
                            <CheckSquare className="w-3.5 h-3.5" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                          <span>{isApproved ? 'Section Approved' : 'Approve Section'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Section Remark Input Box */}
                  {showRemarkInput && isReviewerOrAdmin && (
                    <div className="pt-2 animate-in fade-in duration-200">
                      <textarea
                        rows={2}
                        placeholder={`Enter specific reviewer remarks or required edits for ${secName}...`}
                        value={secRemark}
                        onChange={(e) => handleSectionRemarkChange(secName, e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-sans"
                      />
                    </div>
                  )}

                  {/* Display saved section remark if present */}
                  {secRemark && !showRemarkInput && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Remark:</strong> "{secRemark}"</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side-by-Side Logic Diff Comparison */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Proposed Logic Specification Diffs
            </h3>
            <span className="text-[11px] text-slate-500">Comparing Current State vs Proposed State</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Column */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">
                  BEFORE (Current Living State)
                </span>
                <span className="text-[10px] text-rose-500 font-mono">Living Baseline</span>
              </div>
              <pre className="text-xs font-mono text-rose-900 dark:text-rose-200 whitespace-pre-wrap leading-relaxed">
                {change.beforeText || 'Default legacy business rules applied.'}
              </pre>
            </div>

            {/* After Column */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  AFTER (Proposed Update)
                </span>
                <span className="text-[10px] text-emerald-500 font-mono">To Be Applied On Approval</span>
              </div>
              <pre className="text-xs font-mono text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed">
                {change.afterText || 'Updated business logic specifications.'}
              </pre>
            </div>
          </div>
        </div>

        {/* Overall Reviewer Notes Panel */}
        {isReviewerOrAdmin && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Overall Reviewer Governance Notes & Compliance Comments
            </label>
            <textarea
              rows={3}
              placeholder="Leave overall summary comments for the author or audit record..."
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* BA Role Read-only Notice */}
        {!isReviewerOrAdmin && (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Viewing as BA Author. Section approvals and change sign-off controls are reserved for Reviewer / Lead roles.</span>
            </span>
            <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold">Role: BA</span>
          </div>
        )}
      </div>

      {/* TIER 2 CONTROLS: STICKY ACTION BAR FOR REVIEWER / LEAD */}
      {isReviewerOrAdmin && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-3.5 px-6 shadow-2xl">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left: Live Progress Readout */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{approvedSectionsCount} of {totalSectionsCount} sections approved</span>
              </span>
            </div>

            {/* Right: Tier 2 Action Buttons */}
            <div className="flex items-center gap-4">
              {/* Send Back for Revision: Always enabled during review */}
              <button
                type="button"
                onClick={() => handleReviewAction('SENT_BACK')}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                <span>{submitting ? 'Processing...' : 'Send Back for Revision'}</span>
              </button>

              {/* Approve Change: Disabled until 100% of sections are individually approved */}
              <button
                type="button"
                onClick={() => handleReviewAction('APPROVED')}
                disabled={submitting || !allSectionsApproved}
                title={
                  !allSectionsApproved
                    ? `Approve all ${totalSectionsCount} sections below to enable change approval (${approvedSectionsCount}/${totalSectionsCount} approved)`
                    : 'All sections approved! Click to finalize change approval.'
                }
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  !allSectionsApproved
                    ? 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed opacity-60 shadow-none'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer shadow-lg shadow-emerald-500/20 transform hover:scale-[1.02]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {!allSectionsApproved
                    ? `Approve Change (${approvedSectionsCount}/${totalSectionsCount})`
                    : submitting
                    ? 'Applying Approval...'
                    : 'Approve Change'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
