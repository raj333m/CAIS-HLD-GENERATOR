'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DetailedChangeCard from '@/components/DetailedChangeCard';
import {
  Search,
  Filter,
  PlusCircle,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  FileText,
  ShieldCheck,
  Building2,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function ChangesRegisterPage() {
  const { user } = useAuth();
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bureauFilter, setBureauFilter] = useState('');
  const [selectedChange, setSelectedChange] = useState<any>(null);

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (bureauFilter) params.append('bureau', bureauFilter);

      const res = await fetch(`/api/changes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setChanges(data.changes || []);
        if (data.changes && data.changes.length > 0 && !selectedChange) {
          setSelectedChange(data.changes[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, [search, statusFilter, bureauFilter]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Lock className="w-3 h-3" /> Approved & Locked
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'SENT_BACK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" /> Sent Back
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" /> Draft Intake
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            CAIS Change Register Audit Log
          </h1>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Change Ref, Title, or Driver..."
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
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="SENT_BACK">Sent Back</option>
            </select>

            <select
              value={bureauFilter}
              onChange={(e) => setBureauFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Credit Bureaus</option>
              <option value="Experian">Experian</option>
              <option value="Equifax">Equifax</option>
              <option value="TransUnion">TransUnion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Container: Master Change Log Table & Detailed Change Entries Stack */}
      <div className="space-y-8">
        {/* Master Change Log Table */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" /> Master Change Log Table
            </h2>
            <span className="text-[11px] font-mono text-slate-500">{changes.length} Total Logged Changes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Ref</th>
                  <th className="p-3">Change Title & Driver</th>
                  <th className="p-3">Impacted Brands</th>
                  <th className="p-3">Target Month</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Loading Change Register...
                    </td>
                  </tr>
                ) : changes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No changes match current filter choices.
                    </td>
                  </tr>
                ) : (
                  changes.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedChange(c)}
                      className={`cursor-pointer transition-colors ${
                        selectedChange?.id === c.id
                          ? 'bg-blue-500/10 border-l-4 border-l-blue-500 dark:bg-blue-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {c.crReference}
                      </td>
                      <td className="p-3 space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{c.title}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{c.businessDriver}</div>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300">
                        {c.impactedBureaus}
                      </td>
                      <td className="p-3 text-xs font-mono text-slate-800 dark:text-slate-200">
                        {c.targetMonth}
                      </td>
                      <td className="p-3 whitespace-nowrap">{statusBadge(c.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Change Entries Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" /> Detailed Change Entries
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
    </div>
  );
}
