'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Sparkles,
  Save,
  Send,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

export default function NewChangeIntakePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [crReference, setCrReference] = useState(`CAIS-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [changeType, setChangeType] = useState('Existing data item amended');
  const [businessDriver, setBusinessDriver] = useState('');
  const [description, setDescription] = useState('');
  const [targetMonth, setTargetMonth] = useState('November 2026');

  // Logic Specification
  const [beforeText, setBeforeText] = useState('');
  const [afterText, setAfterText] = useState('');

  // Impacted Bureaus & Sections
  const [selectedBureaus, setSelectedBureaus] = useState<string[]>(['Experian', 'Equifax', 'TransUnion']);
  const [sectionsUpdated, setSectionsUpdated] = useState<string>('1.3, 2.2');

  // Risks
  const [riskText, setRiskText] = useState('Potential legacy SAS pipeline execution timeout during batch window');
  const [mitigationText, setMitigationText] = useState('Run pre-cutover parallel dry run on staging DB');

  // Form State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState('Draft unsaved');
  const [createdDraftId, setCreatedDraftId] = useState<string | null>(null);

  const isFormValid =
    title.trim().length > 0 &&
    crReference.trim().length > 0 &&
    businessDriver.trim().length > 0 &&
    selectedBureaus.length > 0;

  const autoSaveDraftToBackend = async () => {
    if (!title.trim() && !crReference.trim()) return;
    try {
      const payload = {
        title: title.trim() || 'Draft CAIS Change Intake',
        crReference: crReference.trim() || 'CAIS-2026-DRAFT',
        status: 'DRAFT',
        changeType,
        businessDriver: businessDriver || 'Draft change requirement',
        description: description || '',
        beforeText: beforeText || '',
        afterText: afterText || '',
        sectionsUpdated: sectionsUpdated || '1.3',
        impactedBureaus: selectedBureaus,
        targetMonth: targetMonth || 'November 2026',
        projectId: 'proj-alpha',
        userId: user?.id,
        risks: [
          {
            risk: riskText,
            impact: 'Medium',
            mitigation: mitigationText,
          },
        ],
      };

      if (createdDraftId) {
        await fetch(`/api/changes/${encodeURIComponent(createdDraftId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setAutoSaveStatus('Draft auto-saved to Change Register');
      } else {
        const res = await fetch('/api/changes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          const newId = data.change?.id || (data.changes && data.changes[0]?.id);
          if (newId) {
            setCreatedDraftId(newId);
          }
          setAutoSaveStatus('Draft auto-saved to Change Register');
        }
      }
    } catch (e) {
      console.error('Auto save error:', e);
    }
  };

  // Auto-save draft effect
  useEffect(() => {
    if (title.trim() || crReference.trim()) {
      const timer = setTimeout(() => {
        autoSaveDraftToBackend();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [title, crReference, changeType, businessDriver, description, beforeText, afterText, selectedBureaus, sectionsUpdated, targetMonth]);

  const handleToggleBureau = (bureau: string) => {
    if (selectedBureaus.includes(bureau)) {
      setSelectedBureaus(selectedBureaus.filter((b) => b !== bureau));
    } else {
      setSelectedBureaus([...selectedBureaus, bureau]);
    }
  };

  const handleSubmitIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMsg('Please complete all mandatory fields marked with an asterisk (*).');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const url = createdDraftId ? `/api/changes/${encodeURIComponent(createdDraftId)}` : '/api/changes';
      const method = createdDraftId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          crReference,
          status: 'IN_REVIEW',
          projectId: 'proj-alpha',
          changeType,
          businessDriver,
          description,
          beforeText,
          afterText,
          sectionsUpdated,
          impactedBureaus: selectedBureaus,
          targetMonth,
          userId: user?.id,
          risks: [
            {
              risk: riskText,
              impact: 'Medium',
              mitigation: mitigationText,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const finalId = data.change?.id || createdDraftId;
        router.push(`/changes/${finalId}/review`);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to submit change intake');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'An error occurred submitting intake');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Change Register
        </button>

        <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" /> {autoSaveStatus}
        </div>
      </div>

      {/* Main Intake Card */}
      <form onSubmit={handleSubmitIntake} className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-md">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              GUIDED INTAKE WIZARD
            </span>
            <span className="text-xs text-rose-500 font-semibold">* Required Sections</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Log New CAIS Change & Update Living Sections
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Fill in the change specification. Upon Reviewer approval, this change will append to Section 3 (Change Register) and update living design sections 1, 2, or Appendix in place.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Change Overview & Identifiers */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800/60 pb-1">
            1. Basic Change Identifiers & Classification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Change Reference ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={crReference}
                onChange={(e) => setCrReference(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Change Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Consumer Duty Payment Holiday Indicator & Forbearance Update"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Change Type Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={changeType}
                onChange={(e) => setChangeType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Existing data item amended">Existing data item amended</option>
                <option value="New data item added">New data item added</option>
                <option value="New account/product type">New account/product type</option>
                <option value="Business rule logic update">Business rule logic update</option>
                <option value="File format / technical specification">File format / technical specification</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Monthly Implementation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Business & Regulatory Driver <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. FCA Consumer Duty Regulatory Mandate & CAIS Monthly Guidelines v2.4"
              value={businessDriver}
              onChange={(e) => setBusinessDriver(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Section 2: Bureaus & Living Document Mapping */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800/60 pb-1">
            2. Impacted Credit Reference Agencies & Living Document Sections
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Impacted Credit Bureaus <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {['Experian', 'Equifax', 'TransUnion'].map((bureau) => {
                const checked = selectedBureaus.includes(bureau);
                return (
                  <button
                    type="button"
                    key={bureau}
                    onClick={() => handleToggleBureau(bureau)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                      checked
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> {bureau}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Living Sections to Update (e.g. 1.3, 2.2, 2.5, APPENDIX)
            </label>
            <input
              type="text"
              value={sectionsUpdated}
              onChange={(e) => setSectionsUpdated(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Section 3: Before vs After Logic Specifications */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800/60 pb-1">
            3. Detailed Logic Specifications (Before vs After)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Before (Current Processing Logic)
              </label>
              <textarea
                rows={5}
                placeholder="Describe current state logic or exclusion rule..."
                value={beforeText}
                onChange={(e) => setBeforeText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                After (Proposed Amendment Logic)
              </label>
              <textarea
                rows={5}
                placeholder="Describe new state logic or calculation..."
                value={afterText}
                onChange={(e) => setAfterText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Risk & Mitigation Controls */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800/60 pb-1">
            4. Impact Assessment & Risk Mitigations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operational / Systems Risk
              </label>
              <input
                type="text"
                value={riskText}
                onChange={(e) => setRiskText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mitigation Strategy & Audit Control
              </label>
              <input
                type="text"
                value={mitigationText}
                onChange={(e) => setMitigationText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bottom Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            {loading ? 'Submitting Change Intake...' : 'Submit Change Intake for Review'}
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
