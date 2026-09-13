'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DataFlowDiagram from '@/components/DataFlowDiagram';
import {
  FileText,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  MessageSquare,
  History,
  Edit3,
  ChevronRight,
  Clock,
  Building2,
  ShieldAlert,
  X,
} from 'lucide-react';

export default function HldViewerEditorPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [hld, setHld] = useState<any>(null);
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 17 Stable Sections for TOC Navigation
  const sectionsList = [
    { id: 'section-1-document-control', key: 'docControl', title: '1. Document Control' },
    { id: 'section-2-executive-summary', key: 'execSummary', title: '2. Executive Summary' },
    { id: 'section-3-regulatory-driver', key: 'regulatoryDriver', title: '3. Regulatory & Business Driver' },
    { id: 'section-4-scope', key: 'scope', title: '4. Scope Definition' },
    { id: 'section-5-change-types', key: 'changeTypeSummary', title: '5. Change Type & Overview' },
    { id: 'section-6-stakeholders', key: 'stakeholders', title: '6. Stakeholders & Roles' },
    { id: 'section-7-current-state', key: 'currentState', title: '7. Current State (As-Is Process)' },
    { id: 'section-8-proposed-solution', key: 'proposedSolution', title: '8. Proposed Solution (To-Be Process)' },
    { id: 'section-9-data-flow', key: 'dataFlow', title: '9. Source-to-Bureau Data Flow' },
    { id: 'section-10-data-item-impacts', key: 'dataItemImpacts', title: '10. Data Item Impact Summary' },
    { id: 'section-11-bureau-considerations', key: 'bureauNotes', title: '11. Bureau-Specific Considerations' },
    { id: 'section-12-non-functional', key: 'nonFunctional', title: '12. Non-Functional & Regulatory' },
    { id: 'section-13-testing-rollout', key: 'testingAndRollout', title: '13. Testing & UAT Approach' },
    { id: 'section-14-assumptions-constraints', key: 'assumptionsConstraintsDependencies', title: '14. Assumptions & Dependencies' },
    { id: 'section-15-risks', key: 'risks', title: '15. Risks & Mitigations' },
    { id: 'section-16-glossary', key: 'glossary', title: '16. Glossary of Terms' },
    { id: 'section-17-appendix', key: 'appendix', title: '17. Appendix & References' },
  ];

  const [activeSectionId, setActiveSectionId] = useState('section-1-document-control');

  // Editing state
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Commentary & History state
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reviewCommentsInput, setReviewCommentsInput] = useState('');
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null); // 'APPROVE' | 'SEND_BACK'
  const [showReadinessModal, setShowReadinessModal] = useState(false);

  const getReadinessAudit = () => {
    if (!hld || !content) return [];
    return [
      {
        sectionId: 'section-1-document-control',
        title: '1. Document Control & Context',
        passed: Boolean(hld.title && hld.changeReference && hld.targetMonth),
        missing: 'Document Title or Change Reference incomplete',
      },
      {
        sectionId: 'section-2-executive-summary',
        title: '2. Executive Summary',
        passed: Boolean(content.execSummary || hld.description),
        missing: 'Executive summary is empty',
      },
      {
        sectionId: 'section-3-regulatory-driver',
        title: '3. Regulatory Driver',
        passed: Boolean(hld.regulatoryDriver && hld.regulatoryDriver.trim()),
        missing: 'Regulatory or business driver required',
      },
      {
        sectionId: 'section-10-data-item-impacts',
        title: '10. Data Item Impact Matrix',
        passed: Boolean(hld.dataItemImpacts && hld.dataItemImpacts.length > 0),
        missing: 'At least 1 impacted data item must be defined',
      },
      {
        sectionId: 'section-11-bureau-considerations',
        title: '11. Bureau Considerations',
        passed: Boolean(hld.bureauNotes && hld.bureauNotes.length > 0),
        missing: 'At least 1 credit bureau specification configured',
      },
      {
        sectionId: 'section-12-non-functional',
        title: '12. Non-Functional Controls',
        passed: Boolean(content.nonFunctional?.dataQuality || content.nonFunctional?.dataProtection),
        missing: 'Reconciliation & Data Quality controls required',
      },
    ];
  };

  const handleAttemptSubmitReview = () => {
    const audit = getReadinessAudit();
    const allPassed = audit.every((item) => item.passed);
    if (!allPassed) {
      setShowReadinessModal(true);
    } else {
      handleStatusChange('IN_REVIEW');
    }
  };

  const fetchHld = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hlds/${id}`);
      if (res.ok) {
        const data = await res.json();
        setHld(data.hld);
        try {
          setContent(JSON.parse(data.hld.content));
        } catch (e) {
          setContent({});
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchHld();
  }, [id]);

  // Scroll-Spy Observer: Highlight active section in TOC as user scrolls
  useEffect(() => {
    if (!hld) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: 0.1 }
    );

    sectionsList.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [hld]);

  // Scroll to section on TOC Click
  const handleTocClick = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSaveContent = async (updatedContentObj: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/hlds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: updatedContentObj,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHld(data.hld);
        setContent(JSON.parse(data.hld.content));
        setEditingSectionKey(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (targetStatus: 'IN_REVIEW' | 'APPROVED' | 'DRAFT', comments?: string) => {
    try {
      const res = await fetch(`/api/hlds/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          reviewComments: comments || reviewCommentsInput,
        }),
      });

      if (res.ok) {
        setShowReviewModal(null);
        setReviewCommentsInput('');
        fetchHld();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/hlds/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment, sectionId: activeSectionId }),
      });
      if (res.ok) {
        setNewComment('');
        fetchHld();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClone = async () => {
    try {
      const res = await fetch(`/api/hlds/${id}/clone`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.hld) {
          router.push(`/hld/${data.hld.id}`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 text-sm">Loading HLD document...</div>;
  }

  if (!hld || !content) {
    return <div className="text-center py-20 text-slate-400">HLD Document not found</div>;
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">APPROVED</span>;
      case 'IN_REVIEW':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">IN REVIEW</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-600 dark:text-slate-300 border border-slate-500/30">DRAFT</span>;
    }
  };

  // Derive source system name for diagram
  const primarySourceSystem = hld.dataItemImpacts?.[0]?.sourceSystem || 'Core Banking Engine (Flexcube)';

  // Calculate dynamic grid column span for main document viewer to eliminate dead empty space
  const isDrawerOpen = showComments || showHistory;

  return (
    <div className="space-y-8">
      {/* Top Document Action Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-40 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              {hld.changeReference}
            </span>
            {statusBadge(hld.status)}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">v{hld.version}.0</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{hld.title}</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Submit for Review (BA Role) */}
          {hld.status === 'DRAFT' && (
            <button
              onClick={handleAttemptSubmitReview}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Submit for Review
            </button>
          )}

          {/* Approve / Send Back (Reviewer or Admin Role) */}
          {hld.status === 'IN_REVIEW' && (user?.role === 'REVIEWER' || user?.role === 'ADMIN') && (
            <>
              <button
                onClick={() => setShowReviewModal('APPROVE')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve HLD
              </button>
              <button
                onClick={() => setShowReviewModal('SEND_BACK')}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Send Back
              </button>
            </>
          )}

          {/* Clone HLD */}
          <button
            onClick={handleClone}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Copy className="w-3.5 h-3.5 text-amber-500" /> Clone HLD
          </button>

          {/* Export to Word */}
          <a
            href={`/api/hlds/${hld.id}/export/docx`}
            download
            className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Word Export (.docx)
          </a>

          {/* Comments Toggle */}
          <button
            onClick={() => {
              setShowComments(!showComments);
              if (showHistory) setShowHistory(false);
            }}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all ${
              showComments
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
            title="Toggle comments panel"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[10px] font-bold">{hld.comments?.length || 0}</span>
          </button>

          {/* Audit History Toggle */}
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              if (showComments) setShowComments(false);
            }}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all ${
              showHistory
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
            title="View audit trail & version history"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {showReviewModal === 'APPROVE' ? 'Approve HLD Document' : 'Send Back HLD for Revision'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {showReviewModal === 'APPROVE'
                ? 'Approving marks this design ready for development and official Word document export.'
                : 'Provide revision notes for the BA author to address.'}
            </p>

            <textarea
              rows={3}
              value={reviewCommentsInput}
              onChange={(e) => setReviewCommentsInput(e.target.value)}
              placeholder="Reviewer comments or approval notes..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowReviewModal(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleStatusChange(showReviewModal === 'APPROVE' ? 'APPROVED' : 'DRAFT')
                }
                className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold ${
                  showReviewModal === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                Confirm {showReviewModal === 'APPROVE' ? 'Approval' : 'Send Back'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Readiness Modal */}
      {showReadinessModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" /> HLD Review Readiness Audit
              </h3>
              <button onClick={() => setShowReadinessModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Before submitting an HLD to Lead BAs / Compliance Reviewers, all mandatory CAIS design sections must be complete. Click any highlighted section below to jump to it and complete missing fields:
            </p>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 text-xs">
              {getReadinessAudit().map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (!item.passed) {
                      setShowReadinessModal(false);
                      handleTocClick(item.sectionId);
                    }
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    item.passed
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200 cursor-pointer hover:bg-amber-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0">!</span>
                    )}
                    <span className="font-semibold">{item.title}</span>
                  </div>
                  {item.passed ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Complete</span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 underline">Jump to Section →</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowReadinessModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Close & Complete Sections
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Layout (Dynamic columns eliminating wasted empty side panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Table of Contents Navigation */}
        <div className="lg:col-span-1 space-y-2 glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit sticky top-36 hidden lg:block shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Table of Contents
          </div>
          <div className="space-y-1 max-h-[72vh] overflow-y-auto pr-1">
            {sectionsList.map((sec) => (
              <button
                key={sec.id}
                onClick={() => handleTocClick(sec.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                  activeSectionId === sec.id
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="truncate">{sec.title}</span>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${activeSectionId === sec.id ? 'opacity-100' : 'opacity-40'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Center: Document Reader & Editor Panel (Takes 100% full width when drawer is closed) */}
        <div className={isDrawerOpen ? 'lg:col-span-2 space-y-10' : 'lg:col-span-3 space-y-10'}>
          
          {/* SECTION 1: DOCUMENT CONTROL (Completely Rebuilt Self-Contained Metadata Cards - Fixed Issue 1 & Issue 2) */}
          <div id="section-1-document-control" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              1. Document Control
            </h2>

            {/* Document Title Card (Spans 100% full width) */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1.5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                DOCUMENT TITLE
              </span>
              <div className="text-lg font-bold text-slate-900 dark:text-white leading-snug break-words">
                {hld.title}
              </div>
            </div>

            {/* Bounded Metadata Cards Grid (Prevents text overlap completely) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              
              {/* Change Reference */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1.5 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  CHANGE REFERENCE
                </span>
                <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-300 break-all">
                  {hld.changeReference}
                </div>
              </div>

              {/* Status */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1.5 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  STATUS
                </span>
                <div className="pt-0.5">{statusBadge(hld.status)}</div>
              </div>

              {/* Author */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1.5 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  AUTHOR / BA
                </span>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                  {hld.createdBy?.name || '[Name]'}
                </div>
              </div>

              {/* Reviewer */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1.5 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  REVIEWER
                </span>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                  {hld.reviewedBy?.name || '[Name]'}
                </div>
              </div>

              {/* Target Month */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1.5 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  TARGET MONTH
                </span>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                  {hld.targetMonth}
                </div>
              </div>

              {/* Document Version */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1.5 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  VERSION
                </span>
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  v{hld.version}.0
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: EXECUTIVE SUMMARY */}
          <div id="section-2-executive-summary" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-36">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-blue-600 dark:text-blue-400">2. Executive Summary</h2>
              <button
                onClick={() => {
                  setEditingSectionKey('execSummary');
                  setEditText(content.execSummary || hld.description);
                }}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>

            {editingSectionKey === 'execSummary' ? (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-blue-500 text-xs text-slate-900 dark:text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveContent({ ...content, execSummary: editText })}
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                  >
                    Save Changes
                  </button>
                  <button onClick={() => setEditingSectionKey(null)} className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {content.execSummary || hld.description}
              </p>
            )}
          </div>

          {/* SECTION 3: REGULATORY DRIVER */}
          <div id="section-3-regulatory-driver" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              3. Regulatory & Business Driver
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {hld.regulatoryDriver}
            </p>
          </div>

          {/* SECTION 4: SCOPE */}
          <div id="section-4-scope" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              4. Scope Definition
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider">In-Scope</div>
                <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">{content.scope?.inScope}</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider">Out-of-Scope</div>
                <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">{content.scope?.outOfScope}</div>
              </div>
            </div>
          </div>

          {/* SECTION 5: CHANGE TYPE & OVERVIEW */}
          <div id="section-5-change-types" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              5. Change Type & Overview
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {content.changeTypeSummary}
            </p>
          </div>

          {/* SECTION 6: STAKEHOLDERS */}
          <div id="section-6-stakeholders" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              6. Stakeholders & Roles
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Business Team</th>
                    <th className="p-3.5">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {hld.stakeholders?.map((st: any) => (
                    <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-white">{st.name}</td>
                      <td className="p-3.5">{st.team}</td>
                      <td className="p-3.5">{st.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 7: CURRENT STATE */}
          <div id="section-7-current-state" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              7. Current State (As-Is CAIS Process)
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{content.currentState}</p>
          </div>

          {/* SECTION 8: PROPOSED SOLUTION */}
          <div id="section-8-proposed-solution" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              8. Proposed Solution (To-Be Process)
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{content.proposedSolution}</p>
          </div>

          {/* SECTION 9: DATA FLOW (Rendered Diagram Component) */}
          <div id="section-9-data-flow" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              9. High-Level Source-to-Bureau Data Flow
            </h2>

            {/* Rendered Data Flow Diagram */}
            <DataFlowDiagram
              sourceSystem={primarySourceSystem}
              narrative={content.dataFlow?.narrative || hld.sourceToBureauFlow}
            />
          </div>

          {/* SECTION 10: DATA ITEM IMPACT SUMMARY */}
          <div id="section-10-data-item-impacts" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              10. Data Item Impact Summary Table
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="p-3.5">CAIS Item</th>
                    <th className="p-3.5">Current Definition</th>
                    <th className="p-3.5">New Definition</th>
                    <th className="p-3.5">Source System</th>
                    <th className="p-3.5">Bureaus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {hld.dataItemImpacts?.map((imp: any) => (
                    <tr key={imp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-3.5 font-bold text-blue-600 dark:text-blue-300">{imp.dataItem?.itemName || imp.customItemName}</td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400">{imp.currentDefinition}</td>
                      <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">{imp.newDefinition}</td>
                      <td className="p-3.5">{imp.sourceSystem}</td>
                      <td className="p-3.5">
                        <div className="flex gap-1 text-[10px]">
                          {imp.appliesToExperian && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">EXP</span>}
                          {imp.appliesToEquifax && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">EQF</span>}
                          {imp.appliesToTransunion && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">TU</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 11: BUREAU CONSIDERATIONS */}
          <div id="section-11-bureau-considerations" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              11. Bureau-Specific Considerations
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="p-3.5">Bureau</th>
                    <th className="p-3.5">File Spec</th>
                    <th className="p-3.5">Target Go-Live</th>
                    <th className="p-3.5">Bureau Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {hld.bureauNotes?.map((bn: any) => (
                    <tr key={bn.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{bn.bureau.name}</td>
                      <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">{bn.bureau.fileSpecVersion}</td>
                      <td className="p-3.5 text-blue-600 dark:text-blue-300">{bn.targetDate}</td>
                      <td className="p-3.5">{bn.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 12: NON-FUNCTIONAL */}
          <div id="section-12-non-functional" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              12. Non-Functional & Regulatory Considerations
            </h2>
            <div className="space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
              <div><strong className="text-slate-900 dark:text-white">Reconciliation:</strong> {content.nonFunctional?.dataQuality}</div>
              <div><strong className="text-slate-900 dark:text-white">Error Handling:</strong> {content.nonFunctional?.errorHandling}</div>
              <div><strong className="text-slate-900 dark:text-white">Audit Trail:</strong> {content.nonFunctional?.auditTrail}</div>
              <div><strong className="text-slate-900 dark:text-white">Data Protection:</strong> {content.nonFunctional?.dataProtection}</div>
              <div><strong className="text-slate-900 dark:text-white">Consumer Impact:</strong> {content.nonFunctional?.consumerImpact}</div>
            </div>
          </div>

          {/* SECTION 13: TESTING & ROLLOUT */}
          <div id="section-13-testing-rollout" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              13. Testing & UAT Approach
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{content.testingAndRollout?.uatApproach}</p>
          </div>

          {/* SECTION 14: ASSUMPTIONS & DEPENDENCIES */}
          <div id="section-14-assumptions-constraints" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              14. Assumptions, Constraints & Dependencies
            </h2>
            <div className="space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
              <div><strong className="text-slate-900 dark:text-white">Assumptions:</strong> {content.assumptionsConstraintsDependencies?.assumptions}</div>
              <div><strong className="text-slate-900 dark:text-white">Constraints:</strong> {content.assumptionsConstraintsDependencies?.constraints}</div>
              <div><strong className="text-slate-900 dark:text-white">Dependencies:</strong> {content.assumptionsConstraintsDependencies?.dependencies}</div>
            </div>
          </div>

          {/* SECTION 15: RISKS */}
          <div id="section-15-risks" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              15. Risks & Mitigations
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="p-3.5">Risk Description</th>
                    <th className="p-3.5">Impact</th>
                    <th className="p-3.5">Mitigation Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {hld.risks?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-3.5 text-slate-900 dark:text-white font-medium">{r.risk}</td>
                      <td className="p-3.5 font-bold text-amber-600 dark:text-amber-400">{r.impact}</td>
                      <td className="p-3.5">{r.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 16: GLOSSARY */}
          <div id="section-16-glossary" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              16. CAIS & Regulatory Glossary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {content.glossary?.map((item: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-blue-600 dark:text-blue-300">{item.term}</div>
                  <div className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.definition}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 17: APPENDIX */}
          <div id="section-17-appendix" className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs scroll-mt-36">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              17. Appendix & References
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {content.appendix || 'Refer to CAIS Data Reporting Guidelines and bureau-specific file specification manuals for technical field layouts.'}
            </p>
          </div>

        </div>

        {/* Right Side Commentary / History Drawer (Appears only when toggled) */}
        {isDrawerOpen && (
          <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 h-fit sticky top-36 shadow-lg">
            {showComments && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider">
                    Reviewer Comments
                  </div>
                  <button onClick={() => setShowComments(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {hld.comments?.map((c: any) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs shadow-sm">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-bold text-blue-600 dark:text-blue-300">{c.user?.name}</span>
                        <span className="text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-normal">{c.text}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a review comment..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddComment}
                    className="w-full py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 shadow-sm"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            )}

            {showHistory && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider">
                    Version Audit Log
                  </div>
                  <button onClick={() => setShowHistory(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  {hld.versions?.map((v: any) => (
                    <div key={v.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                      <div className="flex justify-between font-bold">
                        <span className="text-blue-600 dark:text-blue-400">Version {v.versionNumber}.0</span>
                        <span className="text-slate-400">{new Date(v.editedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">Edited by: {v.editedBy?.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
