'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DetailedChangeCard from '@/components/DetailedChangeCard';
import {
  FileText,
  Download,
  Edit3,
  History,
  ChevronRight,
  ChevronDown,
  Sparkles,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  X,
  Save,
  Eye,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  MessageSquare,
  Maximize2,
  GripVertical,
} from 'lucide-react';
import { RuleCategoryChip, StatusBadge, RULE_CATEGORY_CONFIG, TOKENS } from '@/styles/tokens';

function RuleTableBlock({
  rows,
  selectedCategory,
  subHeading,
}: {
  rows: Array<{ num: number; category: string; condition: string; keyFields: string }>;
  selectedCategory: string;
  subHeading?: string;
}) {
  const filteredRows =
    selectedCategory === 'ALL'
      ? rows
      : rows.filter((r) => r.category === selectedCategory);

  if (filteredRows.length === 0) {
    return (
      <div className="my-3 p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50/50 dark:bg-slate-900/30">
        No rules matching "{selectedCategory}" in this rule table.
      </div>
    );
  }

  return (
    <div className="my-5 space-y-3">
      {/* Table Toolbar Header */}
      <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-t-xl border border-slate-200 dark:border-slate-700 text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-200 font-mono text-[11px] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          {subHeading || 'SECTION 1.3 RULE TABLE'} ({rows.length} Rules Logged)
        </span>
      </div>

      {/* Desktop 4-Column Table */}
      <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-b-xl shadow-xs">
        <table className="w-full text-left border-collapse font-sans text-[11pt]">
          <thead className="bg-[#C0272D] text-white font-bold sticky top-0 z-10">
            <tr>
              <th className="p-3 border-b border-red-700 w-12 text-center font-mono">#</th>
              <th className="p-3 border-b border-red-700 min-w-[210px] w-56">Category</th>
              <th className="p-3 border-b border-red-700">Condition</th>
              <th className="p-3 border-b border-red-700 min-w-[190px] w-64">Key Field(s)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredRows.map((r, rIdx) => {
              const isAlt = rIdx % 2 === 1;
              const isHighlighted = selectedCategory !== 'ALL' && r.category === selectedCategory;
              return (
                <tr
                  key={r.num || rIdx}
                  className={`transition-colors ${
                    isHighlighted
                      ? 'bg-amber-500/10 dark:bg-amber-950/30'
                      : isAlt
                      ? 'bg-[#F9F9F9] dark:bg-slate-900/60'
                      : 'bg-white dark:bg-slate-950'
                  }`}
                >
                  <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 align-top">
                    {r.num}
                  </td>
                  <td className="p-3 align-top">
                    <RuleCategoryChip category={r.category} />
                  </td>
                  <td className="p-3 text-slate-900 dark:text-slate-100 leading-relaxed align-top font-sans">
                    {r.condition}
                  </td>
                  <td className="p-3 align-top font-mono text-xs">
                    {r.keyFields ? (
                      <span className="inline-block font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-200 dark:border-slate-700/80 leading-normal">
                        {r.keyFields}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Mini-Cards */}
      <div className="block md:hidden space-y-3">
        {filteredRows.map((r, rIdx) => (
          <div
            key={r.num || rIdx}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Rule #{r.num}
              </span>
              <RuleCategoryChip category={r.category} />
            </div>
            <p className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
              {r.condition}
            </p>
            {r.keyFields && (
              <div className="pt-1">
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 inline-block">
                  Key Field(s): {r.keyFields}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Reusable Table Editor supporting dynamic Add/Delete Rows, Add/Delete Columns, and Cell Text Editing
function InteractiveBlockTable({
  sectionId,
  subSectionId,
  blockIndex,
  initialPayload,
  isBaOrAdmin,
  onSaveTable,
}: {
  sectionId: string;
  subSectionId: string;
  blockIndex: number;
  initialPayload: { headers: string[]; rows: string[][] };
  isBaOrAdmin: boolean;
  onSaveTable: (
    sectionId: string,
    subSectionId: string,
    blockIndex: number,
    newPayload: { headers: string[]; rows: string[][] }
  ) => Promise<void>;
}) {
  const [headers, setHeaders] = useState<string[]>(initialPayload?.headers || ['Header 1', 'Header 2']);
  const [rows, setRows] = useState<string[][]>(initialPayload?.rows || []);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialPayload?.headers) setHeaders(initialPayload.headers);
    if (initialPayload?.rows) setRows(initialPayload.rows);
  }, [initialPayload]);

  const handleAddRow = () => {
    const newRow = Array(headers.length).fill('');
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (rIdx: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, idx) => idx !== rIdx));
  };

  const handleAddColumn = () => {
    const newHeaderName = `Column ${headers.length + 1}`;
    setHeaders([...headers, newHeaderName]);
    setRows(rows.map((r) => [...r, '']));
  };

  const handleDeleteColumn = (cIdx: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, idx) => idx !== cIdx));
    setRows(rows.map((r) => r.filter((_, idx) => idx !== cIdx)));
  };

  const handleHeaderChange = (cIdx: number, value: string) => {
    const nextHeaders = [...headers];
    nextHeaders[cIdx] = value;
    setHeaders(nextHeaders);
  };

  const handleCellChange = (rIdx: number, cIdx: number, value: string) => {
    const nextRows = rows.map((r, rowIdx) => {
      if (rowIdx === rIdx) {
        const nextRow = [...r];
        nextRow[cIdx] = value;
        return nextRow;
      }
      return r;
    });
    setRows(nextRows);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveTable(sectionId, subSectionId, blockIndex, { headers, rows });
      setSaveNotice('Table saved successfully!');
      setTimeout(() => setSaveNotice(null), 3000);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save table:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="my-6 space-y-2 group">
      {/* Table Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-t-xl border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-200 font-mono text-[11px]">
            TABLE STRUCTURE ({headers.length} Columns × {rows.length} Rows)
          </span>
          {saveNotice && (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] animate-pulse">
              ✓ {saveNotice}
            </span>
          )}
        </div>

        {isBaOrAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Column
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save Table'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeaders(initialPayload?.headers || []);
                    setRows(initialPayload?.rows || []);
                    setIsEditing(false);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold text-xs"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Table (Rows & Columns)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Table View & Inputs */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-b-xl shadow-xs">
        <table className="w-full text-left text-[11pt] border-collapse">
          <thead className="bg-[#C0272D] text-white font-bold text-[11pt]">
            <tr>
              {headers.map((h: string, cIdx: number) => {
                const lowerH = (h || '').toLowerCase().trim();
                const isShort = lowerH === 'owner' || lowerH === '#' || lowerH === 's no.' || lowerH === 's no' || lowerH === 'status' || lowerH === 'version';
                const isMedium = lowerH.includes('dependency') || lowerH.includes('bureau') || lowerH.includes('step name') || lowerH.includes('category');
                return (
                  <th
                    key={cIdx}
                    className={`p-3 border-b border-red-700 relative text-left align-top ${
                      isShort ? 'w-24 min-w-[75px]' : isMedium ? 'min-w-[120px]' : 'min-w-[150px]'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={h}
                          onChange={(e) => handleHeaderChange(cIdx, e.target.value)}
                          className="w-full bg-red-900/80 text-white px-2 py-1 rounded border border-red-400 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-white"
                          placeholder="Column Title"
                        />
                        {headers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(cIdx)}
                            className="p-1 rounded hover:bg-red-800 text-white hover:text-red-200 transition-colors shrink-0"
                            title="Delete column"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span>{h}</span>
                    )}
                  </th>
                );
              })}
              {isEditing && (
                <th className="p-3 border-b border-red-700 w-16 text-center">
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="p-1 rounded bg-red-800 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1"
                    title="Add column"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
            {rows.map((r: string[], rIdx: number) => {
              const isAlt = rIdx % 2 === 1;
              return (
                <tr
                  key={rIdx}
                  className={isAlt ? 'bg-[#F2F2F2] dark:bg-slate-900/60' : 'bg-white dark:bg-slate-950'}
                >
                  {r.map((cell: string, cIdx: number) => (
                    <td key={cIdx} className="p-3 text-slate-900 dark:text-slate-200 border-r last:border-r-0 border-slate-200 dark:border-slate-800 break-words align-top">
                      {isEditing ? (
                        <input
                          type="text"
                          value={cell || ''}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          className="w-full p-1.5 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-sans"
                        />
                      ) : (
                        <span>{cell}</span>
                      )}
                    </td>
                  ))}
                  {isEditing && (
                    <td className="p-3 text-center w-16 border-slate-200 dark:border-slate-800">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(rIdx)}
                          className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" /> Add Row
          </button>
          <button
            type="button"
            onClick={handleAddColumn}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-500" /> Add Column
          </button>
        </div>
      )}
    </div>
  );
}

export default function LivingDocumentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSectionNum, setActiveSectionNum] = useState('1.1');
  const [selectedRuleCategory, setSelectedRuleCategory] = useState<string>('ALL');

  // Attachments State & Upload Receipts
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadReceiptModal, setUploadReceiptModal] = useState<{ isOpen: boolean; attachment: any } | null>(null);

  const fetchAttachments = async () => {
    try {
      const res = await fetch('/api/attachments');
      const data = await res.json();
      if (data.attachments) {
        setAttachments(data.attachments);
      }
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    }
  };

  // Section Reviews Governance State & Feedback Rounds
  const [sectionReviews, setSectionReviews] = useState<Record<string, {
    sectionNum: string;
    status: 'APPROVED' | 'FEEDBACK_SHARED' | 'PENDING';
    feedback?: string;
    reviewerName?: string;
    timestamp?: string;
    isAddressed?: boolean;
  }>>({});
  const [isReviewerMode, setIsReviewerMode] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    sectionNum: string;
    sectionTitle: string;
    feedbackText: string;
  } | null>(null);

  // Structured Feedback Rounds & Addressed Remarks State
  const [currentFeedbackRound, setCurrentFeedbackRound] = useState<any>(null);
  const [feedbackRoundsHistory, setFeedbackRoundsHistory] = useState<any[]>([]);
  const [addressedRemarks, setAddressedRemarks] = useState<Record<string, boolean>>({});
  const [showSendBackModal, setShowSendBackModal] = useState(false);
  const [overallSendBackReason, setOverallSendBackReason] = useState('');
  const [showRevisionHistoryModal, setShowRevisionHistoryModal] = useState(false);
  const [expandedRemarks, setExpandedRemarks] = useState<Record<string, boolean>>({});

  const fetchSectionReviews = async () => {
    try {
      const res = await fetch('/api/section-reviews');
      const data = await res.json();
      if (data.reviews) {
        setSectionReviews(data.reviews);
      }
      if (data.currentFeedbackRound) {
        setCurrentFeedbackRound(data.currentFeedbackRound);
      }
      if (data.feedbackRoundsHistory) {
        setFeedbackRoundsHistory(data.feedbackRoundsHistory);
      }
      if (data.addressedRemarks) {
        setAddressedRemarks(data.addressedRemarks);
      }
    } catch (err) {
      console.error('Failed to fetch section reviews:', err);
    }
  };

  useEffect(() => {
    fetchAttachments();
    fetchSectionReviews();
  }, []);

  useEffect(() => {
    if (user?.role === 'REVIEWER' || user?.role === 'ADMIN') {
      setIsReviewerMode(true);
    }
  }, [user]);

  const handleApproveSection = async (sectionNum: string) => {
    try {
      const res = await fetch('/api/section-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionNum,
          action: 'APPROVE',
          reviewerName: user?.name || 'Reviewer / Lead',
        }),
      });
      const data = await res.json();
      if (data.allReviews) {
        setSectionReviews(data.allReviews);
        setDraftSavedNotice(`Section ${sectionNum} approved by Reviewer!`);
        setTimeout(() => setDraftSavedNotice(null), 3000);
      }
    } catch (err) {
      console.error('Approve section error:', err);
    }
  };

  const handleOpenFeedbackModal = (sectionNum: string, sectionTitle: string) => {
    const existing = sectionReviews[sectionNum];
    setFeedbackModal({
      isOpen: true,
      sectionNum,
      sectionTitle,
      feedbackText: existing?.feedback || '',
    });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackModal || !feedbackModal.feedbackText.trim()) return;
    try {
      const res = await fetch('/api/section-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionNum: feedbackModal.sectionNum,
          action: 'SHARE_FEEDBACK',
          feedback: feedbackModal.feedbackText,
          reviewerName: user?.name || 'Reviewer / Lead',
        }),
      });
      const data = await res.json();
      if (data.allReviews) {
        setSectionReviews(data.allReviews);
        setFeedbackModal(null);
        setDraftSavedNotice(`Feedback submitted to BA for Section ${feedbackModal.sectionNum}! Status: Under Review.`);
        setTimeout(() => setDraftSavedNotice(null), 4000);
      }
    } catch (err) {
      console.error('Submit feedback error:', err);
    }
  };

  const handleConfirmSendBack = async () => {
    if (!overallSendBackReason.trim()) return;
    try {
      const sectionRemarksList = Object.entries(sectionReviews)
        .filter(([_, r]) => r.status === 'FEEDBACK_SHARED' && r.feedback)
        .map(([num, r]) => ({
          sectionNum: num,
          remarkText: r.feedback || '',
        }));

      const res = await fetch('/api/section-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_BACK_ROUND',
          overallReason: overallSendBackReason,
          sectionRemarks: sectionRemarksList,
          reviewerName: user?.name || 'Reviewer / Lead',
          reviewerRole: user?.role || 'Reviewer',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSectionReviews(data.allReviews);
        setCurrentFeedbackRound(data.currentFeedbackRound);
        setFeedbackRoundsHistory(data.feedbackRoundsHistory);
        setShowSendBackModal(false);
        setOverallSendBackReason('');
        setDraftSavedNotice('Document sent back to BA with feedback round recorded. Status: Draft (Revision Requested).');
        setTimeout(() => setDraftSavedNotice(null), 4000);
      }
    } catch (err) {
      console.error('Send back error:', err);
    }
  };

  const handleToggleAddressed = async (sectionNum: string) => {
    try {
      const res = await fetch('/api/section-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_ADDRESSED',
          sectionNum,
        }),
      });
      const data = await res.json();
      if (data.addressedRemarks) {
        setAddressedRemarks(data.addressedRemarks);
      }
    } catch (err) {
      console.error('Toggle addressed error:', err);
    }
  };

  const toggleExpandRemark = (sectionNum: string) => {
    setExpandedRemarks((prev) => ({ ...prev, [sectionNum]: !prev[sectionNum] }));
  };

  const reviewableSectionNums = ['1.1', '1.2', '1.3', '1.4', '1.5', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '3.0', '4.0'];
  const approvedSectionCount = reviewableSectionNums.filter((num) => sectionReviews[num]?.status === 'APPROVED').length;
  const feedbackSharedCount = reviewableSectionNums.filter((num) => sectionReviews[num]?.status === 'FEEDBACK_SHARED').length;

  let computedHldStatus = 'DRAFT';
  if (approvedSectionCount === reviewableSectionNums.length) {
    computedHldStatus = 'APPROVED';
  } else if (currentFeedbackRound || feedbackSharedCount > 0) {
    computedHldStatus = 'DRAFT_REVISION_REQUESTED';
  } else if (approvedSectionCount > 0) {
    computedHldStatus = 'UNDER_REVIEW';
  }

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    const allowedExtensions = ['csv', 'xls', 'xlsx', 'doc', 'docx', 'pdf'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(ext)) {
      setUploadError(`Invalid file format .${ext}. Only .csv, .xls, .xlsx, .doc, .docx, and .pdf files are allowed.`);
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileDataUrl = reader.result as string;

        const response = await fetch('/api/attachments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: ext,
            fileSize: file.size,
            fileDataUrl,
            uploadedBy: user?.name || 'Current User',
          }),
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || 'Failed to upload file');
        }

        // Open receipt confirmation modal prompt
        setUploadReceiptModal({
          isOpen: true,
          attachment: resData.attachment,
        });

        // Refresh attachments list
        fetchAttachments();
      };

      reader.onerror = () => {
        setUploadError('Failed to read file contents.');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attached reference file?')) return;
    try {
      const res = await fetch(`/api/attachments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAttachments();
      }
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  };

  // Edit SubSections Modal State
  const [editingSection, setEditingSection] = useState<any>(null);
  const [editingSubSections, setEditingSubSections] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Workflow Action Bar & Modal States
  const [draftSavedNotice, setDraftSavedNotice] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingChange, setSubmittingChange] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<{ src: string; caption: string } | null>(null);

  // Submit Modal Metadata State
  const [submitForm, setSubmitForm] = useState({
    crReference: 'CAIS-2026-004',
    title: 'Updated CAIS Reporting Specifications & Exclusions',
    businessDriver: 'FCA Consumer Duty / CAIS Data Standard v2026.1',
    changeType: 'Existing data item amended',
    impactedBrands: 'HSBC Cards (51), First Direct Cards (211)',
    impactedVariables: '17. Original Default Balance, 42. Default Satisfaction Date',
    targetMonth: 'December 2026',
    description: 'Updated narrative specifications and exclusion logic across Retail and Cards staging streams.',
    sectionsUpdated: 'Section 1.3 — Exclusion Rules Applied Post-Staging (All Brands); Section 2.5 — CAIS Variables 17 and 42',
    beforeText: '[Describe prior logic before change]',
    afterText: '[Describe corrected logic once implemented]',
  });

  // Interactive Document Information Tables State & Dynamic Column Handlers
  const [partyCols, setPartyCols] = useState(['Name', 'Role']);
  const [involvedParties, setInvolvedParties] = useState<any[]>([
    { id: '1', Name: '[Name]', Role: 'Design Manager / POD Lead' },
    { id: '2', Name: '[Name]', Role: 'Technical Lead' },
    { id: '3', Name: '[Name]', Role: 'Senior Developer' },
    { id: '4', Name: '[Name]', Role: 'IT Project Manager' },
    { id: '5', Name: '[Name]', Role: 'Business Analyst' },
  ]);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);

  const [revisionCols, setRevisionCols] = useState(['Version', 'Date', 'Updated By', 'Reason for Issue']);
  const [revisionHistory, setRevisionHistory] = useState<any[]>([
    { id: '1', Version: '0.1', Date: '[Date]', 'Updated By': '[Name]', 'Reason for Issue': 'Initial consolidated HLD created' },
  ]);
  const [editingRevisionId, setEditingRevisionId] = useState<string | null>(null);

  const [reviewerCols, setReviewerCols] = useState(['Reviewer', 'Role or Business Unit', 'Date']);
  const [reviewedBy, setReviewedBy] = useState<any[]>([
    { id: '1', Reviewer: '[Name]', 'Role or Business Unit': 'Product Owner — Risk CRA', Date: '[Date]' },
    { id: '2', Reviewer: '[Name]', 'Role or Business Unit': 'CBM Lead UK', Date: '[Date]' },
    { id: '3', Reviewer: '[Name]', 'Role or Business Unit': 'Technical Lead', Date: '[Date]' },
  ]);
  const [editingReviewerId, setEditingReviewerId] = useState<string | null>(null);

  // Editable Cover Metadata State
  const [coverDetails, setCoverDetails] = useState({
    title: 'CRA CAIS Reporting High Level Design',
    subtitle: 'High Level Design — Consolidated Document',
    author: '[Author Name]',
    date: '[DD Month YYYY]',
    version: '[x.x]',
  });
  const [editingCover, setEditingCover] = useState(false);

  // Editable and Reorderable Table of Contents State
  const [tocItems, setTocItems] = useState<any[]>([
    { num: 'doc-info', title: 'Document Information', key: 'doc-info' },
    { num: '1.0', title: '1 Requirements and Data', isHeader: true, key: 'header-1' },
    { num: '1.1', title: '1.1 Business Overview and Requirements Summary', key: 'sec-1-1' },
    { num: '1.2', title: '1.2 Data Requirements', key: 'sec-1-2' },
    { num: '1.3', title: '1.3 Data Analysis', key: 'sec-1-3' },
    { num: '1.4', title: '1.4 SOX Impacts', key: 'sec-1-4' },
    { num: '1.5', title: '1.5 Analysis Risks and Assumptions', key: 'sec-1-5' },
    { num: '2.0', title: '2 Approach, Modelling and Mappings', isHeader: true, key: 'header-2' },
    { num: '2.1', title: '2.1 Approach Summary and Overview Diagram', key: 'sec-2-1' },
    { num: '2.2', title: '2.2 Logical Modelling', key: 'sec-2-2' },
    { num: '2.3', title: '2.3 Physical Model', key: 'sec-2-3' },
    { num: '2.4', title: '2.4 Mapping Spreadsheet', key: 'sec-2-4' },
    { num: '2.5', title: '2.5 Report Layout', key: 'sec-2-5' },
    { num: '2.6', title: '2.6 Data Examples', key: 'sec-2-6' },
    { num: '2.7', title: '2.7 Test Approach', key: 'sec-2-7' },
    { num: '3.0', title: '3 CAIS Change Register', isHeader: true, key: 'cais-register' },
    { num: '4.0', title: '4 Appendix', isHeader: true, key: 'attachments' },
  ]);

  const [editingTocNum, setEditingTocNum] = useState<string | null>(null);
  const [editingTocTitle, setEditingTocTitle] = useState('');
  const [editingTocIsHeader, setEditingTocIsHeader] = useState(false);
  const [draggedTocIndex, setDraggedTocIndex] = useState<number | null>(null);

  // Syncing TOC reordering & updates with section numbers & content reader positioning
  const resequenceAndSyncToc = (newItems: any[]) => {
    let currentMainSec = 0;
    let subSecCount = 1;

    const resequenced = newItems.map((item) => {
      if (item.num === 'doc-info' || item.key === 'doc-info') return item;

      if (item.isHeader) {
        currentMainSec++;
        subSecCount = 1;

        let rawTitle = item.cleanTitle || item.title || '';
        let cleanTitle = rawTitle
          .replace(/^(\d+\.\d+|\d+\.0|\d+)\s*/, '')
          .replace(/^Header\s*\d+:?\s*/i, '');

        let newNum = `${currentMainSec}.0`;
        let newTitle = `${currentMainSec} ${cleanTitle}`;

        if (item.key === 'cais-register' || cleanTitle.toLowerCase() === 'cais change register') {
          newNum = `${currentMainSec}.0`;
          newTitle = `${currentMainSec} CAIS Change Register`;
          cleanTitle = 'CAIS Change Register';
        } else if (item.key === 'attachments' || cleanTitle.toLowerCase().includes('attached') || item.key === 'appendix' || cleanTitle.toLowerCase() === 'appendix') {
          newNum = `${currentMainSec}.0`;
          newTitle = `${currentMainSec} Attached Reference Files & Governance`;
          cleanTitle = 'Attached Reference Files & Governance';
        }

        return {
          ...item,
          num: newNum,
          title: newTitle,
          cleanTitle,
          isHeader: true,
          key: item.key || item.num,
        };
      }

      // Non-header sub-sections (Work Items):
      if (currentMainSec === 0) currentMainSec = 1;
      let rawTitle = item.cleanTitle || item.title || '';
      let cleanTitle = rawTitle.replace(/^(\d+\.\d+|\d+\.0|\d+)\s*/, '');
      const newNum = `${currentMainSec}.${subSecCount}`;
      const newTitle = `${newNum} ${cleanTitle}`;
      subSecCount++;

      return {
        ...item,
        num: newNum,
        title: newTitle,
        cleanTitle: cleanTitle,
        isHeader: false,
        key: item.key || item.num,
      };
    });

    setTocItems(resequenced);
  };

  const handleToggleCategoryLevel = (index: number) => {
    const newItems = [...tocItems];
    newItems[index] = {
      ...newItems[index],
      isHeader: !newItems[index].isHeader,
    };
    resequenceAndSyncToc(newItems);
  };

  // Reorder handlers: Move Up / Down and HTML5 Drag & Drop
  const handleMoveToc = (index: number, direction: 'up' | 'down') => {
    const newItems = [...tocItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    resequenceAndSyncToc(newItems);
  };

  const handleTocDragStart = (e: React.DragEvent, index: number) => {
    setDraggedTocIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTocDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTocDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedTocIndex === null || draggedTocIndex === dropIndex) return;
    const newItems = [...tocItems];
    const [moved] = newItems.splice(draggedTocIndex, 1);
    newItems.splice(dropIndex, 0, moved);
    setDraggedTocIndex(null);
    resequenceAndSyncToc(newItems);
  };

  // TOC CRUD Handlers (Add, Modify, Delete, Convert)
  const handleAddTocSection = () => {
    const isHeading = window.confirm('Click OK to create a new Main Heading (Category), or Cancel to create a Work Item (Sub-section).');
    const defaultTitle = isHeading ? 'New Category Heading' : 'New Work Item';
    const newTitle = prompt(`Enter title for new ${isHeading ? 'Heading' : 'Work Item'}:`, defaultTitle);
    if (!newTitle) return;

    const newItems = [...tocItems];
    newItems.push({
      num: 'temp',
      title: newTitle,
      cleanTitle: newTitle,
      isHeader: isHeading,
      key: `custom-${Date.now()}`,
    });

    resequenceAndSyncToc(newItems);
  };

  const handleStartEditToc = (item: any) => {
    setEditingTocNum(item.num);
    setEditingTocTitle(item.title);
    setEditingTocIsHeader(!!item.isHeader);
  };

  const handleSaveEditToc = (num: string) => {
    const newItems = tocItems.map((i) =>
      i.num === num ? { ...i, title: editingTocTitle, isHeader: editingTocIsHeader } : i
    );
    setEditingTocNum(null);
    resequenceAndSyncToc(newItems);
  };

  const handleDeleteTocItem = (num: string) => {
    if (!window.confirm(`Are you sure you want to remove section item ${num} from Table of Contents?`)) return;
    const newItems = tocItems.filter((i) => i.num !== num);
    resequenceAndSyncToc(newItems);
    setSections((prev) => prev.filter((s) => s.sectionNumber !== num));
  };

  const isBaOrAdmin = user?.role === 'BA' || user?.role === 'ADMIN';

  // Handlers for Involved Parties
  const handleAddPartyRow = () => {
    const newId = String(Date.now());
    const newRow: any = { id: newId };
    partyCols.forEach((col) => {
      newRow[col] = '[Value]';
    });
    setInvolvedParties([...involvedParties, newRow]);
    setEditingPartyId(newId);
  };

  const handleAddPartyCol = () => {
    const colName = prompt('Enter new column name for Involved Parties table:', `Column ${partyCols.length + 1}`) || `Column ${partyCols.length + 1}`;
    if (partyCols.includes(colName)) return;
    setPartyCols([...partyCols, colName]);
    setInvolvedParties(involvedParties.map((p) => ({ ...p, [colName]: '[Value]' })));
  };

  const handleDeletePartyCol = (cIdx: number) => {
    if (partyCols.length <= 1) return;
    const colToDelete = partyCols[cIdx];
    setPartyCols(partyCols.filter((_, idx) => idx !== cIdx));
    setInvolvedParties(
      involvedParties.map((p) => {
        const copy = { ...p };
        delete copy[colToDelete];
        return copy;
      })
    );
  };

  const handleDeleteParty = (id: string) => {
    setInvolvedParties(involvedParties.filter((p) => p.id !== id));
  };
  const handleUpdateParty = (id: string, colName: string, value: string) => {
    setInvolvedParties(involvedParties.map((p) => (p.id === id ? { ...p, [colName]: value } : p)));
  };

  // Handlers for Revision History
  const handleAddRevisionRow = () => {
    const newId = String(Date.now());
    const newRow: any = { id: newId, Version: '0.2', Date: '[Date]', 'Updated By': '[Name]', 'Reason for Issue': 'Updated document specifications' };
    revisionCols.forEach((col) => {
      if (!newRow[col]) {
        if (col.toLowerCase().includes('date')) newRow[col] = '[Date]';
        else if (col.toLowerCase().includes('name') || col.toLowerCase().includes('by')) newRow[col] = '[Name]';
        else newRow[col] = '[Value]';
      }
    });
    setRevisionHistory([...revisionHistory, newRow]);
    setEditingRevisionId(newId);
  };

  const handleAddRevisionCol = () => {
    const colName = prompt('Enter new column name for Revision History table:', `Column ${revisionCols.length + 1}`) || `Column ${revisionCols.length + 1}`;
    if (revisionCols.includes(colName)) return;
    setRevisionCols([...revisionCols, colName]);
    setRevisionHistory(revisionHistory.map((r) => ({ ...r, [colName]: colName.toLowerCase().includes('date') ? '[Date]' : '[Value]' })));
  };

  const handleDeleteRevisionCol = (cIdx: number) => {
    if (revisionCols.length <= 1) return;
    const colToDelete = revisionCols[cIdx];
    setRevisionCols(revisionCols.filter((_, idx) => idx !== cIdx));
    setRevisionHistory(
      revisionHistory.map((r) => {
        const copy = { ...r };
        delete copy[colToDelete];
        return copy;
      })
    );
  };

  const handleDeleteRevision = (id: string) => {
    setRevisionHistory(revisionHistory.filter((r) => r.id !== id));
  };
  const handleUpdateRevision = (id: string, colName: string, value: string) => {
    setRevisionHistory(revisionHistory.map((r) => (r.id === id ? { ...r, [colName]: value } : r)));
  };

  // Handlers for Reviewed By
  const handleAddReviewerRow = () => {
    const newId = String(Date.now());
    const newRow: any = { id: newId, Reviewer: '[Name]', 'Role or Business Unit': 'Reviewer / Lead Role', Date: '[Date]' };
    reviewerCols.forEach((col) => {
      if (!newRow[col]) {
        if (col.toLowerCase().includes('date')) newRow[col] = '[Date]';
        else if (col.toLowerCase().includes('name') || col.toLowerCase().includes('reviewer')) newRow[col] = '[Name]';
        else newRow[col] = '[Value]';
      }
    });
    setReviewedBy([...reviewedBy, newRow]);
    setEditingReviewerId(newId);
  };

  const handleAddReviewerCol = () => {
    const colName = prompt('Enter new column name for Reviewed By table:', `Column ${reviewerCols.length + 1}`) || `Column ${reviewerCols.length + 1}`;
    if (reviewerCols.includes(colName)) return;
    setReviewerCols([...reviewerCols, colName]);
    setReviewedBy(reviewedBy.map((r) => ({ ...r, [colName]: colName.toLowerCase().includes('date') ? '[Date]' : '[Value]' })));
  };

  const handleDeleteReviewerCol = (cIdx: number) => {
    if (reviewerCols.length <= 1) return;
    const colToDelete = reviewerCols[cIdx];
    setReviewerCols(reviewerCols.filter((_, idx) => idx !== cIdx));
    setReviewedBy(
      reviewedBy.map((r) => {
        const copy = { ...r };
        delete copy[colToDelete];
        return copy;
      })
    );
  };

  const handleDeleteReviewer = (id: string) => {
    setReviewedBy(reviewedBy.filter((r) => r.id !== id));
  };
  const handleUpdateReviewer = (id: string, colName: string, value: string) => {
    setReviewedBy(reviewedBy.map((r) => (r.id === id ? { ...r, [colName]: value } : r)));
  };

  // Section 3 CAIS Changes & Batch Intake State
  const [caisChanges, setCaisChanges] = useState<any[]>([]);
  const [showBatchChangeModal, setShowBatchChangeModal] = useState(false);
  const [submittingBatch, setSubmittingBatch] = useState(false);
  const [batchChangesList, setBatchChangesList] = useState<any[]>([
    {
      crReference: 'CAIS-2026-004',
      title: 'Updated CAIS Reporting Specifications & Exclusion Alignment',
      businessDriver: 'FCA Consumer Duty / CAIS Data Standard v2026.1',
      changeType: 'Existing data item amended, Business rule change',
      impactedBrands: 'HSBC Cards 51, First Direct Cards 211',
      impactedDataItems: 'CURRENT_BAL, ACC_STATUS, SPEC_INST_FLAG',
      targetMonth: 'December 2026',
      description: 'Updated narrative specifications and exclusion logic across Retail and Cards staging streams.',
      beforeText: 'Prior month snapshot comparison held stale balance.',
      afterText: 'Staging deletion rules execute before snapshot load.',
      status: 'DRAFT',
    },
  ]);

  const handleAddBatchItem = () => {
    const nextNum = caisChanges.length + batchChangesList.length + 1;
    const refStr = `CAIS-2026-00${nextNum}`;
    setBatchChangesList([
      ...batchChangesList,
      {
        crReference: refStr,
        title: 'New CAIS Change Specification Entry',
        businessDriver: 'CAIS Regulatory Requirement / Internal Remediation',
        changeType: 'Existing data item amended',
        impactedBrands: 'HSBC Retail 85, First Direct Retail 211',
        impactedDataItems: 'ACC_STATUS, DEFAULT_BAL',
        targetMonth: 'December 2026',
        description: 'Detail narrative description of proposed change.',
        beforeText: 'Baseline processing logic before change.',
        afterText: 'Proposed processing logic after change.',
        status: 'DRAFT',
      },
    ]);
  };

  const handleRemoveBatchItem = (index: number) => {
    if (batchChangesList.length <= 1) return;
    setBatchChangesList(batchChangesList.filter((_, idx) => idx !== index));
  };

  const handleBatchItemChange = (index: number, field: string, value: string) => {
    const list = [...batchChangesList];
    list[index][field] = value;
    setBatchChangesList(list);
  };

  const handleSaveBatchChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBatch(true);
    try {
      const res = await fetch('/api/changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes: batchChangesList,
          userId: user?.id,
        }),
      });

      if (res.ok) {
        setShowBatchChangeModal(false);
        setDraftSavedNotice(`${batchChangesList.length} change entries added successfully to Section 3 CAIS Change Register!`);
        fetchChanges();
        setTimeout(() => setDraftSavedNotice(null), 4000);
      }
    } catch (err) {
      console.error('Failed to add batch changes:', err);
    } finally {
      setSubmittingBatch(false);
    }
  };

  // Modify / Edit & Delete Change Entry State & Handlers
  const [showEditChangeModal, setShowEditChangeModal] = useState(false);
  const [editingChange, setEditingChange] = useState<any>(null);
  const [savingEditChange, setSavingEditChange] = useState(false);

  const handleOpenEditChangeModal = (c: any) => {
    setEditingChange({
      id: c.id,
      crReference: c.crReference || '',
      title: c.title || '',
      status: c.status || 'DRAFT',
      changeType: c.changeType || 'Existing data item amended',
      businessDriver: c.businessDriver || '',
      description: c.description || '',
      sectionsUpdated: c.sectionsUpdated || '',
      beforeText: c.beforeText || '',
      afterText: c.afterText || '',
      impactedBureaus: c.impactedBureaus || '',
      impactedDataItems: c.impactedDataItems || '',
      targetMonth: c.targetMonth || 'December 2026',
    });
    setShowEditChangeModal(true);
  };

  const handleSaveEditChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChange?.id) return;
    setSavingEditChange(true);
    try {
      const res = await fetch(`/api/changes/${editingChange.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingChange),
      });

      if (res.ok) {
        setShowEditChangeModal(false);
        setEditingChange(null);
        setDraftSavedNotice(`Change entry ${editingChange.crReference} modified successfully!`);
        fetchChanges();
        setTimeout(() => setDraftSavedNotice(null), 4000);
      }
    } catch (err) {
      console.error('Failed to update change:', err);
    } finally {
      setSavingEditChange(false);
    }
  };

  const handleDeleteChange = async (id: string) => {
    const c = caisChanges.find((item) => item.id === id);
    const ref = c ? c.crReference : 'this change entry';
    if (!window.confirm(`Are you sure you want to delete ${ref} from the CAIS Change Register?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/changes/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDraftSavedNotice(`Change entry ${ref} deleted successfully.`);
        fetchChanges();
        setTimeout(() => setDraftSavedNotice(null), 4000);
      }
    } catch (err) {
      console.error('Failed to delete change entry:', err);
    }
  };

  const fetchChanges = async () => {
    try {
      const res = await fetch('/api/changes');
      if (res.ok) {
        const data = await res.json();
        setCaisChanges(data.changes || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sections');
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
      }
      await fetchChanges();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleTocClick = (sectionNum: string) => {
    setActiveSectionNum(sectionNum);
    let targetId = `sec-${sectionNum.replace(/\./g, '-')}`;
    if (sectionNum === '1.0') targetId = 'sec-1-0';
    if (sectionNum === '2.0') targetId = 'sec-2-0';
    if (sectionNum === '3.0') targetId = 'sec-3-0';
    if (sectionNum.toUpperCase() === 'APPENDIX') targetId = 'sec-APPENDIX';
    const element = document.getElementById(targetId) || document.getElementById(`sec-${sectionNum.replace(/\./g, '-')}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Open Edit Modal for a Section
  const handleOpenEditModal = (sec: any) => {
    setEditingSection(sec);
    const parsedSubSections = (sec.subSections || []).map((sub: any) => ({
      id: sub.id,
      heading: sub.heading || '',
      displayOrder: sub.displayOrder,
      blocksText: parseBlocksToText(sub.contentBlocks),
    }));
    setEditingSubSections(parsedSubSections);
  };

  // Helper to serialize blocks to editable text
  const parseBlocksToText = (blocksJsonStr: string) => {
    try {
      const blocks = typeof blocksJsonStr === 'string' ? JSON.parse(blocksJsonStr) : blocksJsonStr || [];
      const lines: string[] = [];
      for (const b of blocks) {
        if (b.type === 'paragraph') {
          lines.push(b.payload.text);
        } else if (b.type === 'bullets') {
          for (const item of b.payload.items || []) {
            lines.push(`• ${item}`);
          }
        } else if (b.type === 'table') {
          lines.push(`TABLE: ${JSON.stringify(b.payload)}`);
        } else if (b.type === 'rule-table') {
          lines.push(`RULE_TABLE: ${JSON.stringify(b.payload)}`);
        }
      }
      return lines.join('\n\n');
    } catch (e) {
      return String(blocksJsonStr);
    }
  };

  // Helper to parse edited text back into block structure
  const parseTextToBlocks = (text: string) => {
    const rawParagraphs = text.split(/\n\n+/);
    const blocks: any[] = [];

    for (const rawP of rawParagraphs) {
      const trimmed = rawP.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('TABLE:')) {
        try {
          const tablePayload = JSON.parse(trimmed.replace(/^TABLE:\s*/, ''));
          blocks.push({ type: 'table', payload: tablePayload });
          continue;
        } catch (e) {
          // fallback to paragraph if table json parse fails
        }
      }

      if (trimmed.startsWith('RULE_TABLE:')) {
        try {
          const tablePayload = JSON.parse(trimmed.replace(/^RULE_TABLE:\s*/, ''));
          blocks.push({ type: 'rule-table', payload: tablePayload });
          continue;
        } catch (e) {
          // fallback
        }
      }

      const lines = trimmed.split('\n').map((l) => l.trim());
      const isBulletBlock = lines.every((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'));

      if (isBulletBlock) {
        const items = lines.map((l) => l.replace(/^[•\-\*]\s*/, ''));
        blocks.push({ type: 'bullets', payload: { items } });
      } else {
        blocks.push({ type: 'paragraph', payload: { text: trimmed } });
      }
    }

    return blocks.length > 0 ? blocks : [{ type: 'paragraph', payload: { text } }];
  };

  // Move Sub-heading Up
  const handleMoveSubUp = (index: number) => {
    if (index === 0) return;
    const list = [...editingSubSections];
    const temp = list[index - 1];
    list[index - 1] = list[index];
    list[index] = temp;
    setEditingSubSections(list);
  };

  // Move Sub-heading Down
  const handleMoveSubDown = (index: number) => {
    if (index === editingSubSections.length - 1) return;
    const list = [...editingSubSections];
    const temp = list[index + 1];
    list[index + 1] = list[index];
    list[index] = temp;
    setEditingSubSections(list);
  };

  // Add Brand New Sub-Heading
  const handleAddSubHeading = () => {
    setEditingSubSections([
      ...editingSubSections,
      {
        id: null,
        heading: 'New Sub-Heading Label',
        displayOrder: editingSubSections.length + 1,
        blocksText: 'Enter sub-section paragraph content or bullet items...',
      },
    ]);
  };

  // Delete Sub-Heading Block
  const handleDeleteSubHeading = (index: number) => {
    if (editingSubSections.length <= 1) return;
    const list = editingSubSections.filter((_, idx) => idx !== index);
    setEditingSubSections(list);
  };

  // Save Section Edits back to Server (Save as Draft or inline edit)
  const handleSaveSectionEdits = async () => {
    if (!editingSection) return;
    setSaving(true);
    try {
      const payloadSubSections = editingSubSections.map((sub, idx) => ({
        id: sub.id,
        heading: sub.heading.trim() || null,
        displayOrder: idx + 1,
        contentBlocks: parseTextToBlocks(sub.blocksText),
      }));

      const res = await fetch(`/api/sections/${editingSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subSections: payloadSubSections,
          userId: user?.id,
        }),
      });

      if (res.ok) {
        setEditingSection(null);
        fetchSections();
        setDraftSavedNotice('Section edits saved successfully as Draft.');
        setTimeout(() => setDraftSavedNotice(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Action Bar: Save as Draft
  const handleSaveAsDraft = () => {
    setDraftSavedNotice('Draft saved locally. Your in-progress edits will be preserved.');
    setTimeout(() => setDraftSavedNotice(null), 4000);
  };

  // Action Bar: Submit Change Package to Reviewer Queue
  const handleSubmitChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingChange(true);
    try {
      const res = await fetch('/api/changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: submitForm.title,
          crReference: submitForm.crReference,
          businessDriver: submitForm.businessDriver,
          changeType: submitForm.changeType,
          impactedBureaus: submitForm.impactedBrands,
          impactedDataItems: submitForm.impactedVariables,
          targetMonth: submitForm.targetMonth,
          description: submitForm.description,
          sectionsUpdated: submitForm.sectionsUpdated,
          beforeText: submitForm.beforeText,
          afterText: submitForm.afterText,
          userId: user?.id,
        }),
      });

      if (res.ok) {
        setShowSubmitModal(false);
        setDraftSavedNotice(`Change package ${submitForm.crReference} submitted successfully! Status: In Review.`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to submit change:', err);
    } finally {
      setSubmittingChange(false);
    }
  };

  // Save edited Table Block back to database & update state
  const handleSaveTableBlock = async (
    sectionId: string,
    subSectionId: string,
    blockIndex: number,
    newTablePayload: { headers: string[]; rows: string[][] }
  ) => {
    const targetSection = sections.find((s) => s.id === sectionId);
    if (!targetSection) return;

    const updatedSubSections = targetSection.subSections.map((sub: any) => {
      if (sub.id !== subSectionId) return sub;

      let blocks = typeof sub.contentBlocks === 'string' ? JSON.parse(sub.contentBlocks) : [...(sub.contentBlocks || [])];
      if (blocks[blockIndex]) {
        blocks[blockIndex] = {
          ...blocks[blockIndex],
          payload: newTablePayload,
        };
      }
      return {
        ...sub,
        contentBlocks: blocks,
      };
    });

    setSections((prevSections) =>
      prevSections.map((s) => (s.id === sectionId ? { ...s, subSections: updatedSubSections } : s))
    );

    const payloadSubSections = updatedSubSections.map((sub: any, idx: number) => ({
      id: sub.id,
      heading: sub.heading || null,
      displayOrder: idx + 1,
      contentBlocks: typeof sub.contentBlocks === 'string' ? JSON.parse(sub.contentBlocks) : sub.contentBlocks,
    }));

    const res = await fetch(`/api/sections/${sectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subSections: payloadSubSections,
        userId: user?.id,
      }),
    });

    if (res.ok) {
      setDraftSavedNotice('Table structure & content saved successfully!');
      setTimeout(() => setDraftSavedNotice(null), 3000);
    }
  };

  // Render SubSection Blocks (Skipping diagram blocks completely)
  const renderSubSectionBlocks = (blocksJsonStr: string, sectionId?: string, subSectionId?: string, subHeading?: string) => {
    try {
      const blocks = typeof blocksJsonStr === 'string' ? JSON.parse(blocksJsonStr) : blocksJsonStr || [];
      return blocks.map((block: any, idx: number) => {
        if (block.type === 'paragraph') {
          return (
            <p key={idx} className="text-[11pt] text-slate-800 dark:text-slate-200 leading-relaxed font-sans mb-3">
              {block.payload.text}
            </p>
          );
        }
        if (block.type === 'bullets') {
          return (
            <ul key={idx} className="space-y-1.5 my-2 pl-4 list-disc">
              {(block.payload.items || []).map((item: string, iIdx: number) => (
                <li key={iIdx} className="text-[11pt] text-slate-800 dark:text-slate-200 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'rule-table') {
          return (
            <RuleTableBlock
              key={idx}
              rows={block.payload?.rows || []}
              selectedCategory={selectedRuleCategory}
              subHeading={subHeading}
            />
          );
        }
        if (block.type === 'table') {
          return (
            <InteractiveBlockTable
              key={idx}
              sectionId={sectionId || ''}
              subSectionId={subSectionId || ''}
              blockIndex={idx}
              initialPayload={block.payload}
              isBaOrAdmin={isBaOrAdmin}
              onSaveTable={handleSaveTableBlock}
            />
          );
        }
        if (block.type === 'diagram') {
          const key = block.payload.imageKey || 'conceptual';
          const imgSrc = `/diagrams/${key}.png`;
          const captionStr = block.payload.caption || 'CAIS Process Flow Diagram';

          return (
            <div key={idx} className="my-8 space-y-3">
              <div
                onClick={() => setEnlargedImage({ src: imgSrc, caption: captionStr })}
                className="group relative cursor-pointer bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-md w-full transition-all hover:shadow-xl hover:border-blue-400 overflow-visible"
                title="Click to enlarge diagram"
              >
                <div className="absolute top-3 right-3 z-10 opacity-80 group-hover:opacity-100 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-xs shadow-md">
                  <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Click to Enlarge</span>
                </div>
                <img
                  src={imgSrc}
                  alt={captionStr}
                  className="w-full h-auto object-contain mx-auto transition-transform group-hover:scale-[1.002]"
                />
              </div>
              {block.payload.caption && (
                <p className="text-[9.5pt] italic text-[#606060] dark:text-slate-400 text-center max-w-3xl mx-auto font-sans">
                  {block.payload.caption}
                </p>
              )}
            </div>
          );
        }
        return null;
      });
    } catch (e) {
      return <p className="text-[11pt] text-slate-800 dark:text-slate-200">{blocksJsonStr}</p>;
    }
  };

  const tocList = [
    { num: 'doc-info', title: 'Document Information' },
    { num: '1.0', title: '1 Requirements and Data', isHeader: true },
    { num: '1.1', title: '1.1 Business Overview and Requirements Summary' },
    { num: '1.2', title: '1.2 Data Requirements' },
    { num: '1.3', title: '1.3 Data Analysis' },
    { num: '1.4', title: '1.4 SOX Impacts' },
    { num: '1.5', title: '1.5 Analysis Risks and Assumptions' },
    { num: '2.0', title: '2 Approach, Modelling and Mappings', isHeader: true },
    { num: '2.1', title: '2.1 Approach Summary and Overview Diagram' },
    { num: '2.2', title: '2.2 Logical Modelling' },
    { num: '2.3', title: '2.3 Physical Model' },
    { num: '2.4', title: '2.4 Mapping Spreadsheet' },
    { num: '2.5', title: '2.5 Report Layout' },
    { num: '2.6', title: '2.6 Data Examples' },
    { num: '2.7', title: '2.7 Test Approach' },
    { num: '3.0', title: '3 CAIS Change Register', isHeader: true },
    { num: 'APPENDIX', title: 'Appendix', isHeader: true },
  ];

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-400 text-sm">
        Loading Consolidated Living HLD Document...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 font-sans relative">
      {/* Draft Notification Toast */}
      {draftSavedNotice && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{draftSavedNotice}</span>
        </div>
      )}

      {/* PAGE HEADER: 9pt Calibri regular #606060 with 1pt red bottom rule */}
      <div className="border-b border-[#C0272D] pb-2 flex items-center justify-between">
        <span className="text-[9pt] text-[#606060] dark:text-slate-400 font-sans tracking-wide">
          Data Engineering | Data Services
        </span>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/docx"
            download
            className="px-3 py-1.5 rounded-lg bg-[#C0272D] hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export Word (.docx)
          </a>
          <a
            href="/api/export/pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs border border-slate-700"
            title="Download document as PDF"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" /> Export PDF (.pdf)
          </a>
        </div>
      </div>

      {/* OVERALL HLD GOVERNANCE STATUS BANNER */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            computedHldStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
            computedHldStatus === 'UNDER_REVIEW' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
            'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {computedHldStatus === 'APPROVED' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Overall HLD Document Status:</h2>
              <StatusBadge status={computedHldStatus} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {computedHldStatus === 'APPROVED'
                ? 'All 14 document sections have been reviewed and approved by the Reviewer/Lead.'
                : computedHldStatus === 'UNDER_REVIEW'
                ? `${approvedSectionCount} of 14 sections approved. Reviewer feedback or pending approvals exist.`
                : 'Document is in Draft state. Submit for review once initial drafting is complete.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsReviewerMode(!isReviewerMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              isReviewerMode
                ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isReviewerMode ? 'Reviewer Governance Mode Active' : 'Switch to Reviewer View'}
          </button>
        </div>
      </div>

      {/* COVER PAGE */}
      <div className="glass-card p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div className="pt-4 space-y-2 flex-1">
            {editingCover ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Document Title</label>
                  <input
                    type="text"
                    value={coverDetails.title}
                    onChange={(e) => setCoverDetails({ ...coverDetails, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={coverDetails.subtitle}
                    onChange={(e) => setCoverDetails({ ...coverDetails, subtitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-[24pt] leading-tight font-bold text-[#1A1A1A] dark:text-white">
                  {coverDetails.title}
                </h1>
                <p className="text-[12pt] text-[#404040] dark:text-slate-300">
                  {coverDetails.subtitle}
                </p>
              </>
            )}
          </div>

          {isBaOrAdmin && (
            <button
              onClick={() => setEditingCover(!editingCover)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
              title="Edit document cover metadata"
            >
              {editingCover ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Done Editing
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" /> Edit Cover Details
                </>
              )}
            </button>
          )}
        </div>

        <div className="space-y-2 text-[11pt] text-[#1A1A1A] dark:text-slate-200 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {editingCover ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Author</label>
                <input
                  type="text"
                  value={coverDetails.author}
                  onChange={(e) => setCoverDetails({ ...coverDetails, author: e.target.value })}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Date</label>
                <input
                  type="date"
                  value={
                    coverDetails.date && coverDetails.date !== '[DD Month YYYY]' && coverDetails.date !== '[Date]'
                      ? (coverDetails.date.includes('/')
                          ? coverDetails.date.split('/').reverse().join('-')
                          : coverDetails.date)
                      : ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setCoverDetails({ ...coverDetails, date: '[DD Month YYYY]' });
                    } else {
                      const [yyyy, mm, dd] = val.split('-');
                      setCoverDetails({ ...coverDetails, date: `${dd}/${mm}/${yyyy}` });
                    }
                  }}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Version</label>
                <input
                  type="text"
                  value={coverDetails.version}
                  onChange={(e) => setCoverDetails({ ...coverDetails, version: e.target.value })}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div><strong className="font-semibold text-slate-700 dark:text-slate-300">Author:</strong> {coverDetails.author}</div>
              <div><strong className="font-semibold text-slate-700 dark:text-slate-300">Date:</strong> {coverDetails.date}</div>
              <div><strong className="font-semibold text-slate-700 dark:text-slate-300">Version:</strong> {coverDetails.version}</div>
            </div>
          )}
        </div>

        <p className="text-[10pt] italic text-[#404040] dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-800">
          This document is maintained as a single consolidated High-Level Design covering the UK CAIS (Credit Account Information Sharing) monthly regulatory reporting process to Experian, Equifax and TransUnion. Sections 1 and 2 describe the current-state requirements, data, approach, modelling and mappings, and are kept up to date in place as changes are implemented. Section 3 (CAIS Change Register) is a running, append-only log of every individual change made to this reporting process over time.
        </p>

        <div className="pt-8 border-t border-[#C0272D]">
          <p className="text-[9pt] italic text-[#808080] dark:text-slate-400">
            Restricted — for internal company use only. Replace bracketed placeholders before circulating.
          </p>
        </div>
      </div>

      {/* DOCUMENT INFORMATION PAGE */}
      <div id="sec-doc-info" className="glass-card p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm bg-white dark:bg-slate-900 scroll-mt-24">
        <h1 className="text-[16pt] font-bold text-[#C0272D] border-b border-slate-200 dark:border-slate-800 pb-2">
          Document Information
        </h1>

        {/* Involved Parties Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13pt] font-bold text-[#202020] dark:text-white">
              Involved Parties
            </h2>
            {isBaOrAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddPartyRow}
                  className="px-3 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
                <button
                  onClick={handleAddPartyCol}
                  className="px-3 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Column
                </button>
              </div>
            )}
          </div>
          <table className="w-full text-left text-[11pt] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-[#C0272D] text-white font-bold text-[11pt]">
              <tr>
                {partyCols.map((col, cIdx) => (
                  <th key={cIdx} className="p-3">
                    <div className="flex items-center justify-between gap-1">
                      <span>{col}</span>
                      {isBaOrAdmin && partyCols.length > 1 && (
                        <button
                          onClick={() => handleDeletePartyCol(cIdx)}
                          className="p-1 rounded hover:bg-red-800 text-white hover:text-red-200 transition-colors"
                          title="Delete column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                {isBaOrAdmin && <th className="p-3 w-2/12 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {involvedParties.map((p, idx) => {
                const isEditing = editingPartyId === p.id;
                const isAlt = idx % 2 === 1;

                return (
                  <tr
                    key={p.id}
                    className={isAlt ? 'bg-[#F2F2F2] dark:bg-slate-900/60' : 'bg-white dark:bg-slate-950'}
                  >
                    {partyCols.map((col, cIdx) => (
                      <td key={cIdx} className="p-3">
                        {isEditing ? (
                          col.toLowerCase().includes('date') ? (
                            <input
                              type="date"
                              value={
                                p[col] && p[col] !== '[Date]' && p[col].includes('/')
                                  ? p[col].split('/').reverse().join('-')
                                  : p[col] && p[col] !== '[Date]' && p[col].includes('-')
                                  ? p[col]
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                  handleUpdateParty(p.id, col, '[Date]');
                                } else {
                                  const [yyyy, mm, dd] = val.split('-');
                                  handleUpdateParty(p.id, col, `${dd}/${mm}/${yyyy}`);
                                }
                              }}
                              className="w-full p-1 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono"
                            />
                          ) : (
                            <input
                              type="text"
                              value={p[col] || ''}
                              onChange={(e) => handleUpdateParty(p.id, col, e.target.value)}
                              className="w-full p-1 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                            />
                          )
                        ) : (
                          <span className="text-slate-900 dark:text-slate-200 font-sans">{p[col] || ''}</span>
                        )}
                      </td>
                    ))}
                    {isBaOrAdmin && (
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <button
                            onClick={() => setEditingPartyId(null)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingPartyId(p.id)}
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                              title="Edit party details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteParty(p.id)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800"
                              title="Delete party row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Revision History Table */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13pt] font-bold text-[#202020] dark:text-white">
              Revision History
            </h2>
            {isBaOrAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddRevisionRow}
                  className="px-3 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
                <button
                  onClick={handleAddRevisionCol}
                  className="px-3 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Column
                </button>
              </div>
            )}
          </div>
          <p className="text-[11pt] text-[#1A1A1A] dark:text-slate-300">
            This tracks revisions to the document as a whole (structure, ownership, scope). Individual CAIS changes are logged in Section 3 — CAIS Change Register, not here.
          </p>
          <table className="w-full text-left text-[11pt] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-[#C0272D] text-white font-bold text-[11pt]">
              <tr>
                {revisionCols.map((col, cIdx) => (
                  <th key={cIdx} className="p-3">
                    <div className="flex items-center justify-between gap-1">
                      <span>{col}</span>
                      {isBaOrAdmin && revisionCols.length > 1 && (
                        <button
                          onClick={() => handleDeleteRevisionCol(cIdx)}
                          className="p-1 rounded hover:bg-red-800 text-white hover:text-red-200 transition-colors"
                          title="Delete column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                {isBaOrAdmin && <th className="p-3 w-24 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {revisionHistory.map((r, idx) => {
                const isEditing = editingRevisionId === r.id;
                const isAlt = idx % 2 === 1;

                return (
                  <tr
                    key={r.id}
                    className={isAlt ? 'bg-[#F2F2F2] dark:bg-slate-900/60' : 'bg-white dark:bg-slate-950'}
                  >
                    {revisionCols.map((col, cIdx) => (
                      <td key={cIdx} className="p-3">
                        {isEditing ? (
                          col.toLowerCase().includes('date') ? (
                            <input
                              type="date"
                              value={
                                r[col] && r[col] !== '[Date]' && r[col].includes('/')
                                  ? r[col].split('/').reverse().join('-')
                                  : r[col] && r[col] !== '[Date]' && r[col].includes('-')
                                  ? r[col]
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                  handleUpdateRevision(r.id, col, '[Date]');
                                } else {
                                  const [yyyy, mm, dd] = val.split('-');
                                  handleUpdateRevision(r.id, col, `${dd}/${mm}/${yyyy}`);
                                }
                              }}
                              className="w-full p-1 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono"
                            />
                          ) : (
                            <input
                              type="text"
                              value={r[col] || ''}
                              onChange={(e) => handleUpdateRevision(r.id, col, e.target.value)}
                              className="w-full p-1 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                            />
                          )
                        ) : (
                          <span className="text-slate-800 dark:text-slate-200">{r[col] || ''}</span>
                        )}
                      </td>
                    ))}
                    {isBaOrAdmin && (
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <button
                            onClick={() => setEditingRevisionId(null)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingRevisionId(r.id)}
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                              title="Edit revision entry"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRevision(r.id)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800"
                              title="Delete revision entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Reviewed By Table */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13pt] font-bold text-[#202020] dark:text-white">
              Reviewed By
            </h2>
            {isBaOrAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddReviewerRow}
                  className="px-3 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
                <button
                  onClick={handleAddReviewerCol}
                  className="px-3 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Column
                </button>
              </div>
            )}
          </div>
          <table className="w-full text-left text-[11pt] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-[#C0272D] text-white font-bold text-[11pt]">
              <tr>
                {reviewerCols.map((col, cIdx) => (
                  <th key={cIdx} className="p-3">
                    <div className="flex items-center justify-between gap-1">
                      <span>{col}</span>
                      {isBaOrAdmin && reviewerCols.length > 1 && (
                        <button
                          onClick={() => handleDeleteReviewerCol(cIdx)}
                          className="p-1 rounded hover:bg-red-800 text-white hover:text-red-200 transition-colors"
                          title="Delete column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                {isBaOrAdmin && <th className="p-3 w-2/12 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {reviewedBy.map((r, idx) => {
                const isEditing = editingReviewerId === r.id;
                const isAlt = idx % 2 === 1;

                return (
                  <tr
                    key={r.id}
                    className={isAlt ? 'bg-[#F2F2F2] dark:bg-slate-900/60' : 'bg-white dark:bg-slate-950'}
                  >
                    {reviewerCols.map((col, cIdx) => (
                      <td key={cIdx} className="p-3">
                        {isEditing ? (
                          col.toLowerCase().includes('date') ? (
                            <input
                              type="date"
                              value={
                                r[col] && r[col] !== '[Date]' && r[col].includes('/')
                                  ? r[col].split('/').reverse().join('-')
                                  : r[col] && r[col] !== '[Date]' && r[col].includes('-')
                                  ? r[col]
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                  handleUpdateReviewer(r.id, col, '[Date]');
                                } else {
                                  const [yyyy, mm, dd] = val.split('-');
                                  handleUpdateReviewer(r.id, col, `${dd}/${mm}/${yyyy}`);
                                }
                              }}
                              className="w-full p-1 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono"
                            />
                          ) : (
                            <input
                              type="text"
                              value={r[col] || ''}
                              onChange={(e) => handleUpdateReviewer(r.id, col, e.target.value)}
                              className="w-full p-1 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                            />
                          )
                        ) : (
                          <span className="text-slate-800 dark:text-slate-200">{r[col] || ''}</span>
                        )}
                      </td>
                    ))}
                    {isBaOrAdmin && (
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <button
                            onClick={() => setEditingReviewerId(null)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingReviewerId(r.id)}
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                              title="Edit reviewer row"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReviewer(r.id)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800"
                              title="Delete reviewer row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE OF CONTENTS PAGE */}
      <div id="sec-toc" className="glass-card p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h1 className="text-[16pt] font-bold text-[#C0272D]">
            Table of Contents
          </h1>

          {isBaOrAdmin && (
            <button
              type="button"
              onClick={handleAddTocSection}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Add TOC Section
            </button>
          )}
        </div>

        <div className="space-y-1.5 py-2">
          {tocItems.map((item, idx) => (
            <div
              key={item.num}
              draggable={isBaOrAdmin}
              onDragStart={(e) => handleTocDragStart(e, idx)}
              onDragOver={(e) => handleTocDragOver(e, idx)}
              onDrop={(e) => handleTocDrop(e, idx)}
              className={`group flex items-center justify-between p-2 rounded-xl transition-all border ${
                draggedTocIndex === idx ? 'opacity-40 border-blue-500 border-dashed bg-blue-50/50' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isBaOrAdmin && (
                  <span
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                    title="Drag to reorder category/section position"
                  >
                    <GripVertical className="w-4 h-4" />
                  </span>
                )}

                {editingTocNum === item.num ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="text"
                      value={editingTocTitle}
                      onChange={(e) => setEditingTocTitle(e.target.value)}
                      className="flex-1 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-500 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                    <select
                      value={editingTocIsHeader ? 'heading' : 'work-item'}
                      onChange={(e) => setEditingTocIsHeader(e.target.value === 'heading')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0"
                    >
                      <option value="heading">Heading (Category)</option>
                      <option value="work-item">Work Item (Sub-section)</option>
                    </select>
                  </div>
                ) : (
                  <button
                    onClick={() => handleTocClick(item.num)}
                    className={`text-left text-[11pt] transition-all truncate flex-1 ${
                      item.isHeader
                        ? 'font-bold text-[#1A1A1A] dark:text-white hover:text-[#C0272D]'
                        : 'pl-2 text-slate-700 dark:text-slate-300 hover:text-[#C0272D]'
                    }`}
                  >
                    <span>{item.title}</span>
                  </button>
                )}
              </div>

              {/* Controls: Move Up/Down, Convert Heading ↔ Work Item, Edit, Delete */}
              <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 shrink-0 ml-2">
                {editingTocNum === item.num ? (
                  <button
                    type="button"
                    onClick={() => handleSaveEditToc(item.num)}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Save
                  </button>
                ) : (
                  <>
                    {item.num !== 'doc-info' && (
                      <button
                        type="button"
                        onClick={() => handleToggleCategoryLevel(idx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border shrink-0 flex items-center gap-1 shadow-xs ${
                          item.isHeader
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                        }`}
                        title={
                          item.isHeader
                            ? 'Convert this Heading into a Work Item (Sub-section)'
                            : 'Convert this Work Item into a Main Heading'
                        }
                      >
                        {item.isHeader ? (
                          <>
                            <span className="px-1 py-0.5 rounded bg-amber-500/20 text-[10px]">Heading</span>
                            <span className="text-[10px] font-normal">→ Convert to Work Item</span>
                          </>
                        ) : (
                          <>
                            <span className="px-1 py-0.5 rounded bg-indigo-500/20 text-[10px]">Work Item</span>
                            <span className="text-[10px] font-normal">→ Convert to Heading</span>
                          </>
                        )}
                      </button>
                    )}
                    {isBaOrAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMoveToc(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-800"
                          title="Move section position up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveToc(idx, 'down')}
                          disabled={idx === tocItems.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-800"
                          title="Move section position down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditToc(item)}
                          className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                          title="Modify section title"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!item.isHeader && item.num !== 'doc-info' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTocItem(item.num)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800"
                            title="Delete section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                    <ChevronRight className="w-4 h-4 opacity-40 ml-1" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-[#F2F2F2] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 space-y-1 text-[10pt] italic text-[#1A1A1A] dark:text-slate-200">
          <p>
            <strong className="not-italic font-bold text-[#1A1A1A] dark:text-white">NOTE: </strong>
            This template is used for all levels of CAIS change — major projects and small enhancements alike. Sections 1 (Requirements and Data) and 2 (Approach, Modelling and Mappings) are the living, current-state reference design: when a change modifies a requirement, a rule, a data item, or an aspect of the approach or modelling, the relevant sub-section is updated in place so the document always reflects current-state truth. Section 3 (CAIS Change Register) is the append-only historical record of every change ever made — newest first — and is never overwritten.
          </p>
        </div>
      </div>

      {/* MAIN DOCUMENT BODY: SECTIONS 1, 2, 3, APPENDIX */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Floating Outline Sidebar */}
        <div className="lg:col-span-1 glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 h-[calc(100vh-8.5rem)] sticky top-20 hidden lg:flex flex-col shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
          <div className="text-[10pt] font-bold text-[#606060] dark:text-slate-400 uppercase tracking-wider mb-2 px-1 shrink-0">
            Document Navigation
          </div>

          <div className="space-y-1 overflow-y-auto pr-1.5 flex-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 pb-12">
            {tocItems.map((sec) => {
              const hasRemark = sectionReviews[sec.num]?.status === 'FEEDBACK_SHARED';
              return (
                <button
                  key={sec.num}
                  onClick={() => handleTocClick(sec.num)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                    sec.isHeader ? 'font-bold text-[#C0272D] pt-2' : 'pl-4 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${activeSectionNum === sec.num ? 'bg-red-50 text-[#C0272D] dark:bg-red-950/40 font-bold' : ''}`}
                >
                  <span className="truncate">{sec.title}</span>
                  {hasRemark && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse ml-1" title="Section has open reviewer remark" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Sections Content Reader & Editor (Ordered dynamically by Table of Contents) */}
        <div className="lg:col-span-3 space-y-8">
          {/* Top-of-Page Revision Alert Banner for BA (Draft Revision Requested) */}
          {(currentFeedbackRound || computedHldStatus === 'DRAFT_REVISION_REQUESTED') && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3 shadow-md font-sans animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 flex-wrap gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  Revision Requested by {currentFeedbackRound?.reviewerName || 'Reviewer / Lead'} ({currentFeedbackRound?.reviewerRole || 'Reviewer'}) — {currentFeedbackRound?.timestamp || 'Recently'}
                </span>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300">
                  Status: Draft (Revision Requested)
                </span>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-100 font-sans">
                "{currentFeedbackRound?.overallReason || 'Overall revision requested. Please address section remarks below before resubmitting.'}"
              </p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-500/20 flex-wrap gap-2">
                <span className="font-semibold text-amber-800 dark:text-amber-300 font-mono">
                  {feedbackSharedCount} remarks across {feedbackSharedCount} sections
                </span>
                {reviewableSectionNums.find(num => sectionReviews[num]?.status === 'FEEDBACK_SHARED') && (
                  <button
                    type="button"
                    onClick={() => handleTocClick(reviewableSectionNums.find(num => sectionReviews[num]?.status === 'FEEDBACK_SHARED') || '1.1')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Jump to First Flagged Section ({reviewableSectionNums.find(num => sectionReviews[num]?.status === 'FEEDBACK_SHARED')})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Revision History Log Panel (Collapsed by default, Read-only Audit Trail) */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setShowRevisionHistoryModal(!showRevisionHistoryModal)}
                className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono hover:text-[#C0272D] transition-colors cursor-pointer"
              >
                <History className="w-4 h-4 text-purple-500" />
                <span>Revision History Log ({feedbackRoundsHistory.length} Rounds Recorded)</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showRevisionHistoryModal ? 'rotate-180' : ''}`} />
              </button>
              <span className="text-[10px] font-mono text-slate-500">Read-Only Audit Trail</span>
            </div>

            {showRevisionHistoryModal && (
              <div className="space-y-3 text-xs animate-in fade-in duration-200">
                {feedbackRoundsHistory.length === 0 ? (
                  <p className="text-slate-500 italic text-xs">No prior feedback rounds recorded. Initial draft processing in progress.</p>
                ) : (
                  feedbackRoundsHistory.map((round: any, rIdx: number) => (
                    <div key={rIdx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 flex-wrap gap-1">
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                          Round {round.roundNumber} — Sent back by {round.reviewerName} ({round.reviewerRole})
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{round.timestamp}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 font-semibold block text-[10px]">Overall Reason:</span>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                          "{round.overallReason}"
                        </p>
                      </div>
                      {round.sectionRemarks && round.sectionRemarks.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1">
                          <span className="text-slate-500 font-semibold block text-[10px]">Section Remarks ({round.sectionRemarks.length}):</span>
                          <div className="space-y-1 pl-2">
                            {round.sectionRemarks.map((sr: any, sIdx: number) => (
                              <div key={sIdx} className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                                • <strong>{sr.sectionNum}:</strong> "{sr.remarkText}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {tocItems.map((item) => {
            if (item.num === 'doc-info') return null;

            const isCaisRegister =
              item.key === 'cais-register' ||
              item.cleanTitle?.toLowerCase().includes('cais change register') ||
              item.title.toLowerCase().includes('cais change register');

            const isAttachments =
              item.key === 'attachments' ||
              item.cleanTitle?.toLowerCase().includes('attached') ||
              item.title.toLowerCase().includes('attached') ||
              item.key === 'appendix' ||
              item.title.toLowerCase().includes('appendix');

            if (isCaisRegister) {
              return (
                <div
                  key={item.key || item.num}
                  id={`sec-${item.num.replace(/\./g, '-')}`}
                  className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 scroll-mt-24 shadow-xs bg-white dark:bg-slate-900"
                >
                  <h1 className="text-[16pt] font-bold text-[#C0272D] border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
                    {item.title}
                  </h1>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <p className="text-[11pt] text-slate-800 dark:text-slate-200 leading-relaxed">
                      This section is an append-only historical register of all approved CAIS changes for this CRA Consolidated Master HLD document. The latest changes appear at the top. Earlier entries are never overwritten or deleted.
                    </p>

                    {isBaOrAdmin && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowSubmitModal(true)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-400" /> Log Single Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBatchChangeModal(true)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all transform hover:scale-[1.02]"
                        >
                          <Plus className="w-4 h-4" /> Add Multiple Changes
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Master Change Log Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-[13pt] font-bold text-[#202020] dark:text-white">
                        Master Change Log
                      </h2>
                      <span className="text-xs font-mono text-slate-500">{caisChanges.length} Entries Logged</span>
                    </div>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                      <table className="w-full text-left text-[11pt] border-collapse">
                        <thead className="bg-[#C0272D] text-white font-bold">
                          <tr>
                            <th className="p-3 border-b border-red-700">CR Reference</th>
                            <th className="p-3 border-b border-red-700">Title</th>
                            <th className="p-3 border-b border-red-700">Change Type</th>
                            <th className="p-3 border-b border-red-700">Impacted Brands</th>
                            <th className="p-3 border-b border-red-700">Target Month</th>
                            <th className="p-3 border-b border-red-700">Status</th>
                            {isBaOrAdmin && <th className="p-3 border-b border-red-700 text-center">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                          {caisChanges.map((c, idx) => (
                            <tr key={c.id || idx} className={idx % 2 === 1 ? 'bg-[#F2F2F2] dark:bg-slate-900/60' : 'bg-white dark:bg-slate-950'}>
                              <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{c.crReference}</td>
                              <td className="p-3 font-semibold text-slate-900 dark:text-slate-200">{c.title}</td>
                              <td className="p-3 text-xs text-slate-700 dark:text-slate-300">{c.changeType}</td>
                              <td className="p-3 text-xs text-slate-700 dark:text-slate-300">{c.impactedBureaus}</td>
                              <td className="p-3 text-xs font-mono text-slate-800 dark:text-slate-200">{c.targetMonth}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  c.status === 'IN_REVIEW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                  'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                              {isBaOrAdmin && (
                                <td className="p-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditChangeModal(c)}
                                      className="px-2.5 py-1 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                                      title="Modify / Edit this change entry"
                                    >
                                      <Edit3 className="w-3 h-3" /> Modify
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteChange(c.id)}
                                      className="px-2.5 py-1 rounded bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                                      title="Delete this change entry"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Detailed Change Entries */}
                  <div className="space-y-6 pt-4">
                    <h2 className="text-[13pt] font-bold text-[#202020] dark:text-white">
                      Detailed Change Entries
                    </h2>
                    <div className="space-y-4">
                      {caisChanges.map((c, idx) => (
                        <DetailedChangeCard
                          key={c.id || idx}
                          change={c}
                          defaultExpanded={idx === 0}
                          isBaOrAdmin={isBaOrAdmin}
                          onEdit={handleOpenEditChangeModal}
                          onDelete={handleDeleteChange}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            if (isAttachments) {
              return (
                <div
                  key={item.key || item.num}
                  id={`sec-${item.num.replace(/\./g, '-')}`}
                  className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 scroll-mt-24 shadow-xs bg-white dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h1 className="text-[16pt] font-bold text-[#C0272D] scroll-mt-24">
                      4 Appendix
                    </h1>
                    <StatusBadge status={sectionReviews['4.0']?.status || 'PENDING'} />
                  </div>

                  {/* Reviewer Governance Controls for Section 4 */}
                  {isReviewerMode && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApproveSection('4.0')}
                        disabled={sectionReviews['4.0']?.status === 'APPROVED'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border ${
                          sectionReviews['4.0']?.status === 'APPROVED'
                            ? 'bg-emerald-600 text-white border-emerald-500 opacity-90 cursor-default'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                        title="Approve Appendix section"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{sectionReviews['4.0']?.status === 'APPROVED' ? 'Approved' : 'Approve Section'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenFeedbackModal('4.0', '4 Appendix')}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                        title="Share feedback with BA for Appendix section"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                        <span>Share Feedback</span>
                      </button>
                    </div>
                  )}

                  {/* Reviewer Feedback Callout Banner for BA Visibility */}
                  {sectionReviews['4.0']?.status === 'FEEDBACK_SHARED' && sectionReviews['4.0']?.feedback && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs text-rose-900 dark:text-rose-200 shadow-xs animate-in fade-in duration-300">
                      <div className="flex items-center justify-between border-b border-rose-500/20 pb-1.5">
                        <span className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-500" /> Reviewer Feedback Shared by {sectionReviews['4.0']?.reviewerName || 'Reviewer / Lead'}
                        </span>
                        <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400">{sectionReviews['4.0']?.timestamp}</span>
                      </div>
                      <p className="leading-relaxed text-[11pt] font-sans text-slate-800 dark:text-slate-200">
                        "{sectionReviews['4.0']?.feedback}"
                      </p>
                    </div>
                  )}

                  <div className="space-y-8 text-[11pt] text-slate-800 dark:text-slate-200">
                    {/* A.1 Glossary */}
                    <div className="space-y-3">
                      <h2 className="text-[13pt] font-bold text-[#202020] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        4.1 Glossary
                      </h2>
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                        <table className="w-full text-left border-collapse font-sans text-[11pt]">
                          <thead className="bg-[#C0272D] text-white font-bold">
                            <tr>
                              <th className="p-3 border-b border-red-700 w-56 font-bold">Term</th>
                              <th className="p-3 border-b border-red-700 font-bold">Definition</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                            <tr className="bg-white dark:bg-slate-950">
                              <td className="p-3 font-bold text-slate-900 dark:text-white font-mono text-[10.5pt] align-top">CAIS</td>
                              <td className="p-3 text-slate-800 dark:text-slate-200 leading-relaxed align-top">Credit Account Information Sharing — the UK reciprocal data-sharing scheme under which lenders submit account-level performance data to credit reference agencies on a monthly basis.</td>
                            </tr>
                            <tr className="bg-[#F9F9F9] dark:bg-slate-900/60">
                              <td className="p-3 font-bold text-slate-900 dark:text-white font-mono text-[10.5pt] align-top">CRA</td>
                              <td className="p-3 text-slate-800 dark:text-slate-200 leading-relaxed align-top">Credit Reference Agency — in the UK, principally Experian, Equifax, and TransUnion.</td>
                            </tr>
                            <tr className="bg-white dark:bg-slate-950">
                              <td className="p-3 font-bold text-slate-900 dark:text-white font-mono text-[10.5pt] align-top">CADS</td>
                              <td className="p-3 text-slate-800 dark:text-slate-200 leading-relaxed align-top">Credit Analysis and Decisioning System — the SAS-based processing that derives the six CU-owned calculated variables.</td>
                            </tr>
                            <tr className="bg-[#F9F9F9] dark:bg-slate-900/60">
                              <td className="p-3 font-bold text-slate-900 dark:text-white font-mono text-[10.5pt] align-top">BI</td>
                              <td className="p-3 text-slate-800 dark:text-slate-200 leading-relaxed align-top">Business Intelligence (UK BI Data Warehouse team) — owns staging, validation and file-generation for the CAIS pipeline.</td>
                            </tr>
                            <tr className="bg-white dark:bg-slate-950">
                              <td className="p-3 font-bold text-slate-900 dark:text-white font-mono text-[10.5pt] align-top">CU Team</td>
                              <td className="p-3 text-slate-800 dark:text-slate-200 leading-relaxed align-top">Central Utility Team — owns exclusions, debt-sale treatment, and the six CU-derived calculated variables.</td>
                            </tr>
                            <tr className="bg-[#F9F9F9] dark:bg-slate-900/60">
                              <td className="p-3 font-bold text-slate-900 dark:text-white font-mono text-[10.5pt] align-top">Forbearance</td>
                              <td className="p-3 text-slate-800 dark:text-slate-200 leading-relaxed align-top">A temporary arrangement (such as a payment holiday) that varies a customer's contractual repayment obligations, typically in response to financial difficulty.</td>
                            </tr>
                            <tr className="bg-white dark:bg-slate-950">
                              <td className="p-3 font-bold text-slate-900 dark:text-white font-mono text-[10.5pt] align-top">Debt Sale</td>
                              <td className="p-3 text-slate-800 dark:text-slate-200 leading-relaxed align-top">The sale of a defaulted account's outstanding debt to a third-party collection agency; reported to bureaus as a Debt Sale record, typically with a Delete marker.</td>
                            </tr>
                            <tr className="bg-[#F9F9F9] dark:bg-slate-900/60">
                              <td className="p-3 font-bold text-slate-900 dark:text-white font-mono text-[10.5pt] align-top">Positive Data Sharing Indicator</td>
                              <td className="p-3 text-slate-800 dark:text-slate-200 leading-relaxed align-top">A flag controlling whether a given account's data is eligible for reciprocal (positive) reporting to the bureaus, as distinct from default-only reporting.</td>
                            </tr>
                            <tr className="bg-white dark:bg-slate-950">
                              <td className="p-3 font-bold text-slate-900 dark:text-white font-mono text-[10.5pt] align-top">PDS1 / Gleam</td>
                              <td className="p-3 text-slate-800 dark:text-slate-200 leading-relaxed align-top">The two product hierarchy codes (938 and 937 respectively) used to classify Retail Banking products as eligible for CRA reporting.</td>
                            </tr>
                            <tr className="bg-[#F9F9F9] dark:bg-slate-900/60">
                              <td className="p-3 font-bold text-slate-900 dark:text-white font-mono text-[10.5pt] align-top">Connect:Direct</td>
                              <td className="p-3 text-slate-800 dark:text-slate-200 leading-relaxed align-top">The secure file-transfer mechanism used by the Transmission team to deliver CAIS extract files to the bureaus.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* A.2 Operational Support and Escalation */}
                    <div className="space-y-3 pt-2">
                      <h2 className="text-[13pt] font-bold text-[#202020] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        4.2 Operational Support and Escalation
                      </h2>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        The following mailboxes provide first-line support for issues identified with the CAIS reporting process, and are monitored daily:
                      </p>
                      <ul className="list-disc pl-6 space-y-1.5 text-slate-800 dark:text-slate-200 leading-relaxed">
                        <li>BI data issues: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-mono text-slate-800 dark:text-slate-200">[bi.support mailbox]</code></li>
                        <li>CU data quality issues: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-mono text-slate-800 dark:text-slate-200">[dataquality.cut mailbox]</code></li>
                      </ul>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed pt-1">
                        Where an issue cannot be resolved at first line, or where a regulatory deadline is at risk (see Section 1.5, Analysis Risks and Assumptions), escalation should be raised to the Product Owner (Risk CRA) and, if a bureau-facing deadline is affected, to the Transmission team in parallel so that the bureau can be informed of any anticipated delay.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            if (item.isHeader) {
              return (
                <div key={item.key || item.num} id={`sec-${item.num.replace(/\./g, '-')}`} className="scroll-mt-24 pt-4">
                  <h1 className="text-[16pt] font-bold text-[#C0272D] border-b border-slate-200 dark:border-slate-800 pb-2 mb-2 scroll-mt-24">
                    {item.title}
                  </h1>
                </div>
              );
            }

            // Standard sub-section card matching sectionNumber or title
            const targetCleanTitle = (item.cleanTitle || item.title.replace(/^(\d+\.\d+|\d+\.0|\d+)\s*/, '')).trim().toLowerCase();
            const secData = sections.find(
              (s) => s.sectionNumber === item.num || s.title.replace(/^(\d+\.\d+|\d+\.0|\d+)\s*/, '').trim().toLowerCase() === targetCleanTitle
            ) || {
              id: item.num,
              sectionNumber: item.num,
              title: item.title,
              subSections: [],
            };

            const sectionReview = sectionReviews[item.num];

            return (
              <div
                key={secData.id || item.num}
                id={`sec-${item.num.replace(/\./g, '-')}`}
                className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 scroll-mt-24 shadow-xs bg-white dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-[13pt] font-bold text-[#202020] dark:text-white">
                      {item.title}
                    </h2>
                    <StatusBadge status={sectionReview?.status || 'PENDING'} />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Reviewer Governance Controls */}
                    {isReviewerMode && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApproveSection(item.num)}
                          disabled={sectionReview?.status === 'APPROVED'}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border ${
                            sectionReview?.status === 'APPROVED'
                              ? 'bg-emerald-600 text-white border-emerald-500 opacity-90 cursor-default'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                          title="Approve this section"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{sectionReview?.status === 'APPROVED' ? 'Approved' : 'Approve Section'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenFeedbackModal(item.num, item.title)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                          title="Share feedback with BA for this section"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                          <span>Share Feedback</span>
                        </button>
                      </>
                    )}

                    {isBaOrAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(secData)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Sub-Headings
                      </button>
                    )}
                  </div>
                </div>

                {/* Reviewer Feedback Callout Banner for BA Visibility */}
                {sectionReview?.status === 'FEEDBACK_SHARED' && sectionReview.feedback && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs text-rose-900 dark:text-rose-200 shadow-xs animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-rose-500/20 pb-1.5">
                      <span className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-500" /> Reviewer Feedback Shared by {sectionReview.reviewerName || 'Reviewer / Lead'}
                      </span>
                      <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400">{sectionReview.timestamp}</span>
                    </div>
                    <p className="leading-relaxed text-[11pt] font-sans text-slate-800 dark:text-slate-200">
                      "{sectionReview.feedback}"
                    </p>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold italic">
                      Action Required: Please update this section content accordingly. Section will remain Under Review until approved.
                    </div>
                  </div>
                )}

                {(item.num === '1.3' || secData.sectionNumber === '1.3') && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Filter Rules by Category Across All Brand Tables
                      </span>
                      {selectedRuleCategory !== 'ALL' && (
                        <button
                          type="button"
                          onClick={() => setSelectedRuleCategory('ALL')}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          Reset Filter (Show All Rules)
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {[
                        'ALL',
                        'Eligibility & Product Scope',
                        'Ownership & Customer Mapping',
                        'Card/Account Type Exclusion',
                        'Indicator Check',
                        'Data Integrity / Null Check',
                        'Closure & Default Logic',
                        'Product Range Included',
                      ].map((cat) => {
                        const isActive = selectedRuleCategory === cat;
                        if (cat === 'ALL') {
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedRuleCategory('ALL')}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                isActive
                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              All Rules
                            </button>
                          );
                        }
                        const style = RULE_CATEGORY_CONFIG[cat] || {
                          bg: 'bg-slate-100 dark:bg-slate-800',
                          text: 'text-slate-800 dark:text-slate-200',
                          border: 'border-slate-300 dark:border-slate-700',
                        };
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedRuleCategory(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                              isActive
                                ? `${style.bg} ${style.text} ${style.border} ring-2 ring-blue-500 shadow-xs scale-[1.03]`
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {secData.subSections?.map((sub: any) => (
                    <div key={sub.id} className="space-y-2">
                      {sub.heading && (
                        <h3 className="text-[11.5pt] font-bold italic text-[#202020] dark:text-white pt-2">
                          {sub.heading}
                        </h3>
                      )}
                      <div>
                        {renderSubSectionBlocks(sub.contentBlocks, secData.id, sub.id, sub.heading)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PERSISTENT BOTTOM WORKFLOW ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-3.5 px-6 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Reviewer Mode: Left-aligned Live Progress Readout & Right-aligned Action Buttons */}
          {isReviewerMode ? (
            <>
              {/* Left: Progress Readout */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{approvedSectionCount} of 14 sections approved</span>
                </span>
              </div>

              {/* Right: Tier 2 Action Buttons (Send Back & Approve Change) */}
              <div className="flex items-center gap-4">
                {/* Send Back for Revision: Always enabled during review */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeSectionNum) {
                      handleOpenFeedbackModal(activeSectionNum, 'Overall Document Review');
                    } else {
                      handleOpenFeedbackModal('1.1', 'Overall Document Review');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                  <span>Send Back for Revision</span>
                </button>

                {/* Approve Change: Strictly gated until all 14 sections are approved */}
                <button
                  type="button"
                  onClick={() => {
                    if (approvedSectionCount === 14) {
                      setShowSubmitModal(true);
                    }
                  }}
                  disabled={approvedSectionCount < 14}
                  title={
                    approvedSectionCount < 14
                      ? `Approve all 14 sections below to enable change approval (${approvedSectionCount}/14 completed)`
                      : 'All 14 sections approved! Click to finalize HLD change approval.'
                  }
                  className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    approvedSectionCount < 14
                      ? 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed opacity-60 shadow-none'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer shadow-lg shadow-emerald-500/20 transform hover:scale-[1.02]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {approvedSectionCount < 14
                      ? `Approve Change (${approvedSectionCount}/14)`
                      : 'Approve Change'}
                  </span>
                </button>
              </div>
            </>
          ) : (
            /* BA Mode: Save as Draft and Submit HLD side-by-side with clear spacing */
            <div className="w-full flex items-center justify-end gap-4">
              {/* Secondary Outline: Save as Draft */}
              <button
                type="button"
                onClick={handleSaveAsDraft}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-blue-400" />
                <span>Save as Draft</span>
              </button>

              {/* Primary Filled: Submit HLD */}
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-5 py-2 rounded-xl bg-[#C0272D] hover:bg-[#a01f24] text-white text-xs font-bold shadow-lg shadow-red-500/20 flex items-center gap-1.5 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit HLD</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STRUCTURED SUB-SECTION TREE EDITOR MODAL */}
      {editingSection && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-500" /> Structured Sub-Heading Tree Editor — Section {editingSection.sectionNumber}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Add, edit, or reorder sub-headings within {editingSection.title}.
                </p>
              </div>
              <button onClick={() => setEditingSection(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {editingSubSections.map((sub, index) => (
                <div key={index} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        Sub-Heading {index + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Sub-heading Title (leave blank for opening intro paragraphs)"
                        value={sub.heading || ''}
                        onChange={(e) => {
                          const list = [...editingSubSections];
                          list[index].heading = e.target.value;
                          setEditingSubSections(list);
                        }}
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveSubUp(index)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white disabled:opacity-30 text-slate-700 dark:text-slate-300 text-xs"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSubDown(index)}
                        disabled={index === editingSubSections.length - 1}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white disabled:opacity-30 text-slate-700 dark:text-slate-300 text-xs"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubHeading(index)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-500 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={sub.blocksText}
                    onChange={(e) => {
                      const list = [...editingSubSections];
                      list[index].blocksText = e.target.value;
                      setEditingSubSections(list);
                    }}
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 shrink-0">
              <button
                type="button"
                onClick={handleAddSubHeading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Sub-Heading Block
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveSectionEdits}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" /> Document Export Preview
                </h3>
                <p className="text-xs text-slate-500">Sanity check formatting and section structure prior to submission.</p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-sans">
              <div className="border-b border-[#C0272D] pb-2 font-mono text-[#606060] dark:text-slate-400 text-[9pt]">
                Data Engineering | Data Services — Preview Render
              </div>
              <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-white">CRA CAIS Reporting High Level Design</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Sections 1 and 2 describe current-state reference design, while Section 3 logs append-only historical audit entries.
              </p>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-mono text-purple-600 font-bold">1.3 Data Analysis</span>
                <p className="text-slate-700 dark:text-slate-300">
                  Standing Exclusion Rule & Card-specific treatment rules apply prior to CADS snapshot load.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT METADATA CAPTURE MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitChange}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-500" /> Submit Change Package for Review
                </h3>
                <p className="text-xs text-slate-500">Capture change metadata required for the Section 3 Audit Log.</p>
              </div>
              <button type="button" onClick={() => setShowSubmitModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CR Reference *</label>
                  <input
                    type="text"
                    required
                    value={submitForm.crReference}
                    onChange={(e) => setSubmitForm({ ...submitForm, crReference: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Implementation Month *</label>
                  <input
                    type="date"
                    required
                    value={
                      submitForm.targetMonth && submitForm.targetMonth.includes('/')
                        ? submitForm.targetMonth.split('/').reverse().join('-')
                        : submitForm.targetMonth && submitForm.targetMonth.includes('-')
                        ? submitForm.targetMonth
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const [yyyy, mm, dd] = val.split('-');
                        setSubmitForm({ ...submitForm, targetMonth: `${dd}/${mm}/${yyyy}` });
                      } else {
                        setSubmitForm({ ...submitForm, targetMonth: '' });
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Change Title *</label>
                <input
                  type="text"
                  required
                  value={submitForm.title}
                  onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Business / Regulatory Driver *</label>
                <input
                  type="text"
                  required
                  value={submitForm.businessDriver}
                  onChange={(e) => setSubmitForm({ ...submitForm, businessDriver: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Change Type *</label>
                  <select
                    value={submitForm.changeType}
                    onChange={(e) => setSubmitForm({ ...submitForm, changeType: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="New data item added">New data item added</option>
                    <option value="Existing data item amended">Existing data item amended</option>
                    <option value="New account/product type">New account/product type</option>
                    <option value="Business rule">Business rule</option>
                    <option value="File format">File format</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Impacted Brands *</label>
                  <input
                    type="text"
                    required
                    value={submitForm.impactedBrands}
                    onChange={(e) => setSubmitForm({ ...submitForm, impactedBrands: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Impacted CAIS Variables</label>
                <input
                  type="text"
                  value={submitForm.impactedVariables}
                  onChange={(e) => setSubmitForm({ ...submitForm, impactedVariables: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Section(s) Updated *</label>
                <input
                  type="text"
                  required
                  value={submitForm.sectionsUpdated}
                  onChange={(e) => setSubmitForm({ ...submitForm, sectionsUpdated: e.target.value })}
                  placeholder="e.g. Section 1.3 — Exclusion Rules; Section 2.5 — Variable 17"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description of Change *</label>
                <textarea
                  rows={2}
                  required
                  value={submitForm.description}
                  onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Before (Prior Logic) *</label>
                  <textarea
                    rows={2}
                    required
                    value={submitForm.beforeText}
                    onChange={(e) => setSubmitForm({ ...submitForm, beforeText: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">After (Corrected / New Logic) *</label>
                  <textarea
                    rows={2}
                    required
                    value={submitForm.afterText}
                    onChange={(e) => setSubmitForm({ ...submitForm, afterText: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingChange}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20"
              >
                {submittingChange ? 'Submitting...' : 'Submit to Reviewer Queue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BATCH MULTIPLE CHANGES INTAKE MODAL */}
      {showBatchChangeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBatchChanges}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-500" /> Section 3 Change Register — Log Multiple Changes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure one or more change entries to append directly into Section 3 of this CRA Consolidated HLD document.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchChangeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {batchChangesList.map((item, index) => (
                <div
                  key={index}
                  className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Change Entry #{index + 1}
                    </span>
                    {batchChangesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBatchItem(index)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-500 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Change Item
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CR Reference *</label>
                      <input
                        type="text"
                        required
                        value={item.crReference || ''}
                        onChange={(e) => handleBatchItemChange(index, 'crReference', e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Month *</label>
                      <input
                        type="text"
                        required
                        value={item.targetMonth || ''}
                        onChange={(e) => handleBatchItemChange(index, 'targetMonth', e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status *</label>
                      <select
                        value={item.status || 'DRAFT'}
                        onChange={(e) => handleBatchItemChange(index, 'status', e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="IN_REVIEW">IN_REVIEW</option>
                        <option value="APPROVED">APPROVED</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Change Title *</label>
                    <input
                      type="text"
                      required
                      value={item.title || ''}
                      onChange={(e) => handleBatchItemChange(index, 'title', e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Driver *</label>
                      <input
                        type="text"
                        required
                        value={item.businessDriver || ''}
                        onChange={(e) => handleBatchItemChange(index, 'businessDriver', e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Change Type *</label>
                      <input
                        type="text"
                        required
                        value={item.changeType || ''}
                        onChange={(e) => handleBatchItemChange(index, 'changeType', e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Impacted Brands / Bureaus</label>
                      <input
                        type="text"
                        value={item.impactedBrands || ''}
                        onChange={(e) => handleBatchItemChange(index, 'impactedBrands', e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Impacted CAIS Fields</label>
                      <input
                        type="text"
                        value={item.impactedVariables || ''}
                        onChange={(e) => handleBatchItemChange(index, 'impactedVariables', e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Before Logic Baseline</label>
                      <textarea
                        rows={2}
                        value={item.beforeText || ''}
                        onChange={(e) => handleBatchItemChange(index, 'beforeText', e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">After Logic Proposed</label>
                      <textarea
                        rows={2}
                        value={item.afterText || ''}
                        onChange={(e) => handleBatchItemChange(index, 'afterText', e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description of Change & Scope</label>
                    <textarea
                      rows={2}
                      value={item.description || ''}
                      onChange={(e) => handleBatchItemChange(index, 'description', e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 shrink-0">
              <button
                type="button"
                onClick={handleAddBatchItem}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-blue-500" /> Add Another Change Item
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchChangeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBatch}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20"
                >
                  {submittingBatch ? 'Submitting...' : 'Save All Changes to Register'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* EDIT / MODIFY CHANGE ENTRY MODAL */}
      {showEditChangeModal && editingChange && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditChange}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-500" /> Modify Change Register Entry — {editingChange.crReference}
                </h3>
                <p className="text-xs text-slate-500">Edit fields and updates for this Change Request entry.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditChangeModal(false);
                  setEditingChange(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CR Reference *</label>
                  <input
                    type="text"
                    required
                    value={editingChange.crReference}
                    onChange={(e) => setEditingChange({ ...editingChange, crReference: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Month *</label>
                  <input
                    type="text"
                    required
                    value={editingChange.targetMonth}
                    onChange={(e) => setEditingChange({ ...editingChange, targetMonth: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status *</label>
                  <select
                    value={editingChange.status}
                    onChange={(e) => setEditingChange({ ...editingChange, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="SENT_BACK">Draft (Revision Requested)</option>
                    <option value="APPROVED">Approved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Change Title *</label>
                <input
                  type="text"
                  required
                  value={editingChange.title}
                  onChange={(e) => setEditingChange({ ...editingChange, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Business / Regulatory Driver *</label>
                <input
                  type="text"
                  required
                  value={editingChange.businessDriver}
                  onChange={(e) => setEditingChange({ ...editingChange, businessDriver: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Impacted Brands *</label>
                  <input
                    type="text"
                    required
                    value={editingChange.impactedBureaus}
                    onChange={(e) => setEditingChange({ ...editingChange, impactedBureaus: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Impacted CAIS Variables</label>
                  <input
                    type="text"
                    value={editingChange.impactedDataItems}
                    onChange={(e) => setEditingChange({ ...editingChange, impactedDataItems: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Section(s) Updated *</label>
                <input
                  type="text"
                  required
                  value={editingChange.sectionsUpdated}
                  onChange={(e) => setEditingChange({ ...editingChange, sectionsUpdated: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description of Change *</label>
                <textarea
                  rows={3}
                  required
                  value={editingChange.description}
                  onChange={(e) => setEditingChange({ ...editingChange, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Before Logic *</label>
                  <textarea
                    rows={3}
                    required
                    value={editingChange.beforeText}
                    onChange={(e) => setEditingChange({ ...editingChange, beforeText: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">After Logic *</label>
                  <textarea
                    rows={3}
                    required
                    value={editingChange.afterText}
                    onChange={(e) => setEditingChange({ ...editingChange, afterText: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowEditChangeModal(false);
                  setEditingChange(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEditChange}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20"
              >
                {savingEditChange ? 'Saving Modifications...' : 'Save Modifications'}
              </button>
            </div>
          </form>
        </div>
      )}


      {/* ENLARGED DIAGRAM LIGHTBOX MODAL */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setEnlargedImage(null)}
        >
          <div
            className="relative bg-white p-4 sm:p-6 rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <span className="text-xs font-bold text-slate-700 font-sans tracking-wide">
                {enlargedImage.caption}
              </span>
              <button
                onClick={() => setEnlargedImage(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center py-4 bg-slate-50 rounded-2xl my-2">
              <img
                src={enlargedImage.src}
                alt={enlargedImage.caption}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="text-center shrink-0 pt-2">
              <span className="text-[10px] text-slate-500 font-sans">
                Click anywhere outside or use the close button to exit lightbox view
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Share Feedback Modal */}
      {feedbackModal && feedbackModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 font-sans text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-500" /> Share Reviewer Feedback — Section {feedbackModal.sectionNum}
              </h2>
              <button
                onClick={() => setFeedbackModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Section Title: <span className="text-white font-bold">{feedbackModal.sectionTitle}</span>
              </label>
              <textarea
                rows={4}
                value={feedbackModal.feedbackText}
                onChange={(e) => setFeedbackModal({ ...feedbackModal, feedbackText: e.target.value })}
                placeholder="Enter section feedback, required edits, or technical governance notes for the BA..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500 placeholder-slate-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={!feedbackModal.feedbackText.trim()}
                className="px-4 py-2 rounded-xl bg-[#C0272D] hover:bg-[#a01f24] disabled:opacity-50 text-white text-xs font-bold shadow-md"
              >
                Submit Feedback to BA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE FOOTER: Centered 8pt Calibri regular #808080 with 1pt red top rule */}
      <div className="border-t border-[#C0272D] pt-3 text-center text-[8pt] text-[#808080] dark:text-slate-400 font-sans">
        RESTRICTED — Internal Use Only &nbsp;&nbsp;&nbsp;&nbsp; Page 1 of 1
      </div>
    </div>
  );
}
