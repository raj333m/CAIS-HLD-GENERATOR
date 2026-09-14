'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Layers,
  Building2,
  ShieldAlert,
  Users,
  Database,
  Sliders,
} from 'lucide-react';

export default function NewHldWizardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [bureaus, setBureaus] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [changeReference, setChangeReference] = useState(`CAIS-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [description, setDescription] = useState('');
  const [regulatoryDriver, setRegulatoryDriver] = useState('');
  const [requestedBy, setRequestedBy] = useState(user?.name || '');
  const [targetMonth, setTargetMonth] = useState('October 2026');

  // Change Types
  const [selectedChangeTypes, setSelectedChangeTypes] = useState<string[]>([
    'Existing data item amended',
    'Business rule / derivation logic change',
  ]);

  // Data Item Impacts
  const [catalogSearch, setCatalogSearch] = useState('');
  const [dataItemImpacts, setDataItemImpacts] = useState<any[]>([]);
  const [showInlineNewItem, setShowInlineNewItem] = useState(false);
  const [customItemCode, setCustomItemCode] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [customCategory, setCustomCategory] = useState('Account Identification');

  // Bureau Notes
  const [bureauNotes, setBureauNotes] = useState<any[]>([]);

  // Narrative Flow
  const [sourceToBureauFlow, setSourceToBureauFlow] = useState(
    'Source Core Systems -> Data Warehouse Staging -> CAIS Transformation Rules Engine -> Bureau Formatting Batch Generator -> SFTP Transmission.'
  );

  // Non-Functional
  const [dataQualityChecks, setDataQualityChecks] = useState(
    'Automated pre-flight reconciliation rules checking total account counts and aggregate balances against source ledger before submission.'
  );
  const [errorHandling, setErrorHandling] = useState(
    'Rejection files returned by bureaus are parsed automatically and malformed records routed to Data Quality Exception queue.'
  );
  const [auditTrail, setAuditTrail] = useState(
    'Full lineage logged in Data Lake staging including transformation rules version, execution timestamp, and bureau SFTP receipt IDs.'
  );
  const [dataProtection, setDataProtection] = useState(
    'All file payloads encrypted using AES-256 and PGP keys. No unmasked sensitive metadata transmitted over insecure channels.'
  );
  const [consumerImpact, setConsumerImpact] = useState(
    'Ensures accurate reporting of consumer credit profiles and prevents erroneous default or arrears flags on credit agency records.'
  );

  // Testing & Rollout
  const [uatApproach, setUatApproach] = useState(
    'Parallel run against historical monthly CAIS batch data, followed by bureau sandbox validation and formal sign-off.'
  );
  const [implementationDate, setImplementationDate] = useState('2026-10-15');
  const [rollbackApproach, setRollbackApproach] = useState(
    'If file rejection rate >0.5%, revert transformation logic configuration flag to previous release version within 2 hours.'
  );

  // Risk, assumptions, constraints, dependencies
  const [assumptions, setAssumptions] = useState(
    '1. All three credit reference agencies support the specified schema by cut-off date.\n2. Upstream core system feeds delivered on schedule.'
  );
  const [constraints, setConstraints] = useState(
    'Must comply strictly with CAIS guidelines and monthly bureau cut-off dates.'
  );
  const [dependencies, setDependencies] = useState(
    'Core Banking System Release 8.4 deployment.'
  );
  const [risks, setRisks] = useState<any[]>([
    { risk: 'Upstream deployment delay reduces UAT window', impact: 'Medium', mitigation: 'Build transformation rules against simulated staging schema.' },
  ]);
  const [stakeholders, setStakeholders] = useState<any[]>([
    { name: 'Manash R Chanda', team: 'UKBI POD', role: 'UKBI POD Lead' },
    { name: 'Swapnil Kalidas Sankpal', team: 'Technology', role: 'Tech Lead' },
    { name: 'Vishnu Vardhan', team: 'Development', role: 'Senior Developer' },
    { name: 'Aishwarya Raj Singh', team: 'Business Analysis', role: 'Business Analyst' },
    { name: 'Narsimha Chary', team: 'IT Program Management', role: 'UKBI ITPM' },
  ]);

  // Optional As-Is
  const [currentStateNotes, setCurrentStateNotes] = useState(
    'Current CAIS pipeline extracts accounts using baseline specs without the updated rules specified in this change.'
  );

  const changeTypeOptions = [
    'New data item added',
    'Existing data item amended',
    'Data item removed/retired',
    'New account/product type brought into scope',
    'Business rule / derivation logic change',
    'File format or technical/schema change',
    'Bureau-specific variation',
  ];

  useEffect(() => {
    fetch('/api/cais-items')
      .then((res) => res.json())
      .then((data) => setCatalog(data.items || []));

    fetch('/api/bureaus')
      .then((res) => res.json())
      .then((data) => {
        const bList = data.bureaus || [];
        setBureaus(bList);
        // Initialize bureau notes
        setBureauNotes(
          bList.map((b: any) => ({
            bureauId: b.id,
            bureauName: b.name,
            applies: true,
            targetDate: '2026-10-15',
            notes: `Complies with ${b.name} spec version ${b.fileSpecVersion}.`,
          }))
        );
      });
  }, []);

  const toggleChangeType = (ct: string) => {
    if (selectedChangeTypes.includes(ct)) {
      setSelectedChangeTypes(selectedChangeTypes.filter((t) => t !== ct));
    } else {
      setSelectedChangeTypes([...selectedChangeTypes, ct]);
    }
  };

  const addDataItemImpact = (item: any) => {
    if (dataItemImpacts.some((i) => i.dataItemId === item.id)) return;
    setDataItemImpacts([
      ...dataItemImpacts,
      {
        dataItemId: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        currentDefinition: item.currentDefinition || '',
        newDefinition: '',
        sourceSystem: 'Core Banking Engine',
        mappingNotes: '',
        appliesToExperian: true,
        appliesToEquifax: true,
        appliesToTransunion: true,
      },
    ]);
  };

  const removeDataItemImpact = (index: number) => {
    setDataItemImpacts(dataItemImpacts.filter((_, i) => i !== index));
  };

  const handleCreateInlineItem = () => {
    if (!customItemCode || !customItemName) return;
    const newItem = {
      id: undefined,
      customItemName: `${customItemCode.toUpperCase()} - ${customItemName}`,
      itemCode: customItemCode.toUpperCase(),
      itemName: customItemName,
      currentDefinition: 'New Item (Not yet reported)',
      newDefinition: 'Proposed new CAIS reporting definition',
      sourceSystem: 'New Subsystem',
      mappingNotes: '',
      appliesToExperian: true,
      appliesToEquifax: true,
      appliesToTransunion: true,
    };
    setDataItemImpacts([...dataItemImpacts, newItem]);
    setCustomItemCode('');
    setCustomItemName('');
    setShowInlineNewItem(false);
  };

  const handleAddRisk = () => {
    setRisks([...risks, { risk: '', impact: 'Medium', mitigation: '' }]);
  };

  const handleAddStakeholder = () => {
    setStakeholders([...stakeholders, { name: '', team: '', role: '' }]);
  };

  // Draft Auto-Save & Resume State
  const [savedDraft, setSavedDraft] = useState<any>(null);

  useEffect(() => {
    const existing = localStorage.getItem('cais_wizard_draft');
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (parsed && (parsed.title || parsed.changeReference)) {
          setSavedDraft(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveDraftToStorage = () => {
    const draftData = {
      step,
      title,
      changeReference,
      description,
      regulatoryDriver,
      requestedBy,
      targetMonth,
      selectedChangeTypes,
      dataItemImpacts,
      bureauNotes,
      sourceToBureauFlow,
      dataQualityChecks,
      errorHandling,
      auditTrail,
      dataProtection,
      consumerImpact,
      uatApproach,
      implementationDate,
      rollbackApproach,
      assumptions,
      constraints,
      dependencies,
      risks,
      stakeholders,
      currentStateNotes,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' on ' + new Date().toLocaleDateString(),
    };
    localStorage.setItem('cais_wizard_draft', JSON.stringify(draftData));
  };

  const handleResumeDraft = () => {
    if (!savedDraft) return;
    if (savedDraft.step) setStep(savedDraft.step);
    if (savedDraft.title) setTitle(savedDraft.title);
    if (savedDraft.changeReference) setChangeReference(savedDraft.changeReference);
    if (savedDraft.description) setDescription(savedDraft.description);
    if (savedDraft.regulatoryDriver) setRegulatoryDriver(savedDraft.regulatoryDriver);
    if (savedDraft.requestedBy) setRequestedBy(savedDraft.requestedBy);
    if (savedDraft.targetMonth) setTargetMonth(savedDraft.targetMonth);
    if (savedDraft.selectedChangeTypes) setSelectedChangeTypes(savedDraft.selectedChangeTypes);
    if (savedDraft.dataItemImpacts) setDataItemImpacts(savedDraft.dataItemImpacts);
    if (savedDraft.bureauNotes) setBureauNotes(savedDraft.bureauNotes);
    if (savedDraft.sourceToBureauFlow) setSourceToBureauFlow(savedDraft.sourceToBureauFlow);
    if (savedDraft.dataQualityChecks) setDataQualityChecks(savedDraft.dataQualityChecks);
    if (savedDraft.errorHandling) setErrorHandling(savedDraft.errorHandling);
    if (savedDraft.auditTrail) setAuditTrail(savedDraft.auditTrail);
    if (savedDraft.dataProtection) setDataProtection(savedDraft.dataProtection);
    if (savedDraft.consumerImpact) setConsumerImpact(savedDraft.consumerImpact);
    if (savedDraft.uatApproach) setUatApproach(savedDraft.uatApproach);
    if (savedDraft.implementationDate) setImplementationDate(savedDraft.implementationDate);
    if (savedDraft.rollbackApproach) setRollbackApproach(savedDraft.rollbackApproach);
    if (savedDraft.assumptions) setAssumptions(savedDraft.assumptions);
    if (savedDraft.constraints) setConstraints(savedDraft.constraints);
    if (savedDraft.dependencies) setDependencies(savedDraft.dependencies);
    if (savedDraft.risks) setRisks(savedDraft.risks);
    if (savedDraft.stakeholders) setStakeholders(savedDraft.stakeholders);
    if (savedDraft.currentStateNotes) setCurrentStateNotes(savedDraft.currentStateNotes);
    setSavedDraft(null);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('cais_wizard_draft');
    setSavedDraft(null);
  };

  const handleSaveDraftAndExit = () => {
    saveDraftToStorage();
    router.push('/dashboard');
  };

  // Readiness Checklist Audit Rules for Mandatory CAIS Sections
  const readinessCheck = [
    {
      stepNum: 1,
      label: '1. Change Context & Governance',
      passed: Boolean(title.trim() && changeReference.trim() && description.trim() && regulatoryDriver.trim()),
      missing: !title.trim() ? 'Missing Title' : !description.trim() ? 'Missing Description' : !regulatoryDriver.trim() ? 'Missing Regulatory Driver' : '',
    },
    {
      stepNum: 2,
      label: '2. Change Type Category',
      passed: selectedChangeTypes.length > 0,
      missing: 'Select at least 1 change category',
    },
    {
      stepNum: 3,
      label: '3. Data Item Impact Matrix',
      passed: dataItemImpacts.length > 0 && dataItemImpacts.every((i) => i.newDefinition && i.newDefinition.trim() !== ''),
      missing: dataItemImpacts.length === 0 ? 'No impacted data items selected' : 'Specify new definitions for all items',
    },
    {
      stepNum: 4,
      label: '4. Credit Bureau Target Dates',
      passed: bureauNotes.some((b) => b.applies && b.targetDate),
      missing: 'Configure target date for at least 1 bureau',
    },
    {
      stepNum: 5,
      label: '5. Source-to-Bureau Data Flow',
      passed: Boolean(sourceToBureauFlow && sourceToBureauFlow.trim().length > 10),
      missing: 'Provide data flow narrative description',
    },
    {
      stepNum: 6,
      label: '6. Data Quality & Protection Controls',
      passed: Boolean(dataQualityChecks.trim() && dataProtection.trim()),
      missing: 'Specify data quality and protection rules',
    },
  ];

  const allMandatoryPassed = readinessCheck.every((r) => r.passed);

  const handleSubmitWizard = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        title,
        changeReference,
        description,
        regulatoryDriver,
        requestedBy,
        targetMonth,
        changeTypes: selectedChangeTypes,
        dataItemImpacts,
        bureauNotes,
        sourceToBureauFlow,
        dataQualityChecks,
        errorHandling,
        auditTrail,
        dataProtection,
        consumerImpact,
        uatApproach,
        implementationDate,
        rollbackApproach,
        assumptions,
        constraints,
        dependencies,
        risks,
        stakeholders,
        currentStateNotes,
      };

      const res = await fetch('/api/hlds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.hld) {
        localStorage.removeItem('cais_wizard_draft');
        router.push(`/hld/${data.hld.id}`);
      } else {
        setError(data.error || 'Failed to generate HLD document');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    'Context',
    'Change Types',
    'Data Items',
    'Bureaus',
    'Data Flow',
    'Non-Functional',
    'Testing',
    'Risks & Teams',
    'Review & Create',
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Wizard Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <span>New CAIS HLD Wizard</span>
          </h1>
          <p className="text-xs text-slate-400">
            Step {step} of 9: {stepsList[step - 1]}
          </p>
        </div>

        {/* Progress bar pill */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {stepsList.map((name, i) => (
            <div
              key={i}
              onClick={() => setStep(i + 1)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                step === i + 1
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : step > i + 1
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
            >
              {i + 1}. {name}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* Step Contents */}
      <div className="glass-card p-6 rounded-2xl space-y-6 border border-slate-800">
        {/* STEP 1: CHANGE CONTEXT */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Resume Saved Draft Banner */}
            {savedDraft && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 border border-amber-500/30 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-amber-300">Unfinished HLD Draft Found</span>
                      <p className="text-[11px] text-slate-300">
                        Saved: <strong className="text-white">{savedDraft.title || savedDraft.changeReference || 'Untitled Draft'}</strong> (Step {savedDraft.step || 1} • {savedDraft.savedAt || 'Recently'})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResumeDraft}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                    >
                      Resume Draft (Step {savedDraft.step || 1})
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white theme-text-main flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> 1. Change Context & Governance
              </h2>
              <p className="text-xs text-slate-400">Provide the change title, reference number, and business driver.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">HLD Document Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Consumer Duty Payment Holiday Indicator Update"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Change Reference Number *</label>
                <input
                  type="text"
                  value={changeReference}
                  onChange={(e) => setChangeReference(e.target.value)}
                  placeholder="e.g. CAIS-2026-042"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-blue-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Change Description (What & Why) *</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what is changing in plain language and why this update is required..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Regulatory / Business Driver</label>
                <span className="text-[10px] text-slate-400">Common presets:</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  'CAIS Data Standard Update v2024',
                  'FCA Consumer Duty Requirement',
                  'Internal Data Quality Remediation Audit',
                  'Buy-Now-Pay-Later (BNPL) Scope Expansion',
                  'New Product Launch (Mortgage / Loan)',
                ].map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRegulatoryDriver(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-300 transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={regulatoryDriver}
                onChange={(e) => setRegulatoryDriver(e.target.value)}
                placeholder="Enter regulatory driver or select a preset above..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Requested By / Business Owner</label>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  placeholder="e.g. Collections & Risk Committee"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Implementation Month *</label>
                <input
                  type="text"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  placeholder="e.g. October 2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CHANGE TYPES */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white theme-text-main flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" /> 2. Select Change Types
              </h2>
              <p className="text-xs text-slate-400">Select one or more categories that apply to this CAIS change.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {changeTypeOptions.map((ct, i) => {
                const checked = selectedChangeTypes.includes(ct);
                return (
                  <div
                    key={i}
                    onClick={() => toggleChangeType(ct)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      checked
                        ? 'bg-purple-950/40 border-purple-500/50 shadow-md shadow-purple-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-0.5 rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className={`text-sm font-semibold ${checked ? 'text-purple-200' : 'text-slate-200'}`}>
                        {ct}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: DATA ITEM IMPACT */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white theme-text-main flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" /> 3. Data Item Impact Matrix
                </h2>
                <p className="text-xs text-slate-400">Lookup CAIS Data Catalog items or add a new custom field inline.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowInlineNewItem(!showInlineNewItem)}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Data Item</span>
              </button>
            </div>

            {/* Catalog Item Quick Picker */}
            <div className="glass-card p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search CAIS Catalog (e.g. Account Number, Balance, Status Code)..."
                  className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-2 border-t border-slate-800">
                {catalog
                  .filter((item) =>
                    `${item.itemCode} ${item.itemName} ${item.category}`
                      .toLowerCase()
                      .includes(catalogSearch.toLowerCase())
                  )
                  .map((item) => {
                    const isAdded = dataItemImpacts.some((i) => i.dataItemId === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addDataItemImpact(item)}
                        disabled={isAdded}
                        className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
                          isAdded
                            ? 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
                            : 'bg-blue-950/40 text-blue-300 border-blue-500/30 hover:bg-blue-900/50'
                        }`}
                      >
                        <span className="font-mono font-bold text-[10px] text-blue-400">{item.itemCode}</span>
                        <span>{item.itemName}</span>
                        {isAdded && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Inline New Item Form */}
            {showInlineNewItem && (
              <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 space-y-3">
                <div className="text-xs font-bold text-blue-300">Add New Data Item (Inline)</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Item Code (e.g. BNPL_PLAN)"
                    value={customItemCode}
                    onChange={(e) => setCustomItemCode(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Item Name (e.g. BNPL Installment Plan)"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleCreateInlineItem}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
                  >
                    Add to Impact List
                  </button>
                </div>
              </div>
            )}

            {/* Selected Impacted Items List */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Selected Impacted Data Items ({dataItemImpacts.length})
              </div>

              {dataItemImpacts.map((imp, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-blue-400">
                      {imp.itemName || imp.customItemName}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDataItemImpact(idx)}
                      className="p-1 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Current Definition / Format</label>
                      <input
                        type="text"
                        value={imp.currentDefinition}
                        onChange={(e) => {
                          const updated = [...dataItemImpacts];
                          updated[idx].currentDefinition = e.target.value;
                          setDataItemImpacts(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">New / Changed Definition *</label>
                      <input
                        type="text"
                        value={imp.newDefinition}
                        onChange={(e) => {
                          const updated = [...dataItemImpacts];
                          updated[idx].newDefinition = e.target.value;
                          setDataItemImpacts(updated);
                        }}
                        placeholder="Specify new definition or format changes..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Source System Origin</label>
                      <input
                        type="text"
                        value={imp.sourceSystem}
                        onChange={(e) => {
                          const updated = [...dataItemImpacts];
                          updated[idx].sourceSystem = e.target.value;
                          setDataItemImpacts(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Applies to Credit Bureaus</label>
                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={imp.appliesToExperian}
                            onChange={(e) => {
                              const updated = [...dataItemImpacts];
                              updated[idx].appliesToExperian = e.target.checked;
                              setDataItemImpacts(updated);
                            }}
                          /> Experian
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={imp.appliesToEquifax}
                            onChange={(e) => {
                              const updated = [...dataItemImpacts];
                              updated[idx].appliesToEquifax = e.target.checked;
                              setDataItemImpacts(updated);
                            }}
                          /> Equifax
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={imp.appliesToTransunion}
                            onChange={(e) => {
                              const updated = [...dataItemImpacts];
                              updated[idx].appliesToTransunion = e.target.checked;
                              setDataItemImpacts(updated);
                            }}
                          /> TransUnion
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: BUREAU IMPACT */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white theme-text-main flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" /> 4. Credit Bureau Impact Matrix
              </h2>
              <p className="text-xs text-slate-400">Configure target go-live dates and bureau-specific notes.</p>
            </div>

            <div className="space-y-4">
              {bureauNotes.map((bn, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={bn.applies}
                        onChange={(e) => {
                          const updated = [...bureauNotes];
                          updated[idx].applies = e.target.checked;
                          setBureauNotes(updated);
                        }}
                        className="rounded bg-slate-900 border-slate-700 text-blue-500"
                      />
                      <span className="font-bold text-sm text-white">{bn.bureauName}</span>
                    </div>

                    <input
                      type="text"
                      value={bn.targetDate}
                      onChange={(e) => {
                        const updated = [...bureauNotes];
                        updated[idx].targetDate = e.target.value;
                        setBureauNotes(updated);
                      }}
                      placeholder="Target Date e.g. 2026-10-15"
                      className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-blue-300 font-mono"
                    />
                  </div>

                  {bn.applies && (
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Bureau-Specific Notes / Variations</label>
                      <input
                        type="text"
                        value={bn.notes}
                        onChange={(e) => {
                          const updated = [...bureauNotes];
                          updated[idx].notes = e.target.value;
                          setBureauNotes(updated);
                        }}
                        placeholder="e.g. Experian confirmed spec v2024.1 support..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: DATA FLOW */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white theme-text-main flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" /> 5. High-Level Source-to-Bureau Data Flow
              </h2>
              <p className="text-xs text-slate-400">Describe the architectural flow from source databases to bureau transmission.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Narrative Data Flow Description</label>
              <textarea
                rows={4}
                value={sourceToBureauFlow}
                onChange={(e) => setSourceToBureauFlow(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
              <div className="text-xs font-bold text-blue-300">Generated Flow Diagram Specification Placeholder</div>
              <p className="text-xs text-slate-300 italic">
                The auto-generated HLD document will format a structured architectural diagram placeholder detailing source extraction, staging, ETL transformation rules, file generators, and SFTP endpoints.
              </p>
            </div>
          </div>
        )}

        {/* STEP 6: NON-FUNCTIONAL */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" /> 6. Non-Functional & Regulatory Controls
              </h2>
              <p className="text-xs text-slate-400">Define reconciliation, audit trail, error handling, and consumer protection controls.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data Quality Checks & Reconciliation</label>
              <input
                type="text"
                value={dataQualityChecks}
                onChange={(e) => setDataQualityChecks(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Error and Rejection File Handling</label>
              <input
                type="text"
                value={errorHandling}
                onChange={(e) => setErrorHandling(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Audit Trail Requirements</label>
              <input
                type="text"
                value={auditTrail}
                onChange={(e) => setAuditTrail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data Protection & Confidentiality</label>
              <input
                type="text"
                value={dataProtection}
                onChange={(e) => setDataProtection(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Consumer Impact Considerations</label>
              <input
                type="text"
                value={consumerImpact}
                onChange={(e) => setConsumerImpact(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* STEP 7: TESTING & ROLLOUT */}
        {step === 7 && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100">7. Testing & Rollout Strategy</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">UAT / Testing Approach</label>
              <textarea
                rows={2}
                value={uatApproach}
                onChange={(e) => setUatApproach(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Planned Cutover Date</label>
                <input
                  type="date"
                  value={implementationDate}
                  onChange={(e) => setImplementationDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rollback Strategy</label>
                <input
                  type="text"
                  value={rollbackApproach}
                  onChange={(e) => setRollbackApproach(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: RISKS & STAKEHOLDERS */}
        {step === 8 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" /> 8. Assumptions, Risks & Stakeholders
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assumptions</label>
                <textarea
                  rows={3}
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Constraints</label>
                <textarea
                  rows={3}
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dependencies</label>
                <textarea
                  rows={3}
                  value={dependencies}
                  onChange={(e) => setDependencies(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>

            {/* Risk Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-200">Risk Matrix</div>
                <button
                  type="button"
                  onClick={handleAddRisk}
                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Risk
                </button>
              </div>

              {risks.map((r, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    placeholder="Risk Description"
                    value={r.risk}
                    onChange={(e) => {
                      const updated = [...risks];
                      updated[i].risk = e.target.value;
                      setRisks(updated);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                  <select
                    value={r.impact}
                    onChange={(e) => {
                      const updated = [...risks];
                      updated[i].impact = e.target.value;
                      setRisks(updated);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="High">High Impact</option>
                    <option value="Medium">Medium Impact</option>
                    <option value="Low">Low Impact</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Mitigation Strategy"
                    value={r.mitigation}
                    onChange={(e) => {
                      const updated = [...risks];
                      updated[i].mitigation = e.target.value;
                      setRisks(updated);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
              ))}
            </div>

            {/* Stakeholders Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-200">Stakeholder Team Roles</div>
                <button
                  type="button"
                  onClick={handleAddStakeholder}
                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stakeholder
                </button>
              </div>

              {stakeholders.map((s, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    placeholder="Name"
                    value={s.name}
                    onChange={(e) => {
                      const updated = [...stakeholders];
                      updated[i].name = e.target.value;
                      setStakeholders(updated);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Team (e.g. Collections)"
                    value={s.team}
                    onChange={(e) => {
                      const updated = [...stakeholders];
                      updated[i].team = e.target.value;
                      setStakeholders(updated);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    value={s.role}
                    onChange={(e) => {
                      const updated = [...stakeholders];
                      updated[i].role = e.target.value;
                      setStakeholders(updated);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 9: REVIEW & GENERATE */}
        {step === 9 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white theme-text-main">Ready to Generate HLD Document</h2>
              <p className="text-xs text-slate-400">
                Review your mandatory BA sections before generating the standard 18-section High-Level Design document.
              </p>
            </div>

            {/* BA Mandatory Section Review Readiness Audit Box */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-left max-w-xl mx-auto space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> BA Mandatory Review Readiness Audit
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  allMandatoryPassed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {allMandatoryPassed ? '100% Ready' : 'Incomplete Sections'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {readinessCheck.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => !item.passed && setStep(item.stepNum)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      item.passed
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-200 cursor-pointer hover:bg-amber-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0">!</span>
                      )}
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    {item.passed ? (
                      <span className="text-[10px] font-bold text-emerald-400">Complete</span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 underline">Fix in Step {item.stepNum} ({item.missing})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left max-w-xl mx-auto space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Change Ref:</span>
                <span className="font-mono text-blue-400 font-bold">{changeReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Title:</span>
                <span className="text-white font-semibold">{title || 'Untitled HLD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Month:</span>
                <span className="text-slate-200">{targetMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Impacted Data Items:</span>
                <span className="text-slate-200">{dataItemImpacts.length} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Bureaus:</span>
                <span className="text-slate-200">{bureauNotes.filter(b => b.applies).length} Bureaus</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitWizard}
              disabled={loading || !allMandatoryPassed}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assembling HLD Document...' : '✨ Generate Structured HLD Document'}
            </button>
          </div>
        )}

        {/* Wizard Controls Footer Toolbar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {/* Save Draft & Exit Button */}
          <button
            type="button"
            onClick={handleSaveDraftAndExit}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Save draft to local storage and return to dashboard"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Save Draft & Exit</span>
          </button>

          {step < 9 && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
