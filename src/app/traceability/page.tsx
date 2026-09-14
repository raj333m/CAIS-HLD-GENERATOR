'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Grid,
  Search,
  Filter,
  ArrowRight,
  X,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { STANDARD_CAIS_ITEMS, STANDARD_BRANDS, isItemMatchedInText, isBrandMatchedInText, CAISItemDef } from '@/lib/caisCatalog';
import { StatusBadge } from '@/styles/tokens';

export default function TraceabilityPage() {
  const router = useRouter();
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal / Popover state for cell details
  const [activeCell, setActiveCell] = useState<{
    item: CAISItemDef;
    brand: string;
    matchingChanges: any[];
  } | null>(null);

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/changes');
      if (res.ok) {
        const data = await res.json();
        setChanges(data.changes || []);
      }
    } catch (e) {
      console.error('Failed to fetch changes for traceability matrix:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  // Compute unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    STANDARD_CAIS_ITEMS.forEach((item) => set.add(item.category));
    return Array.from(set).sort();
  }, []);

  // Filter items by search & category
  const filteredItems = useMemo(() => {
    return STANDARD_CAIS_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pos.toString().includes(searchTerm) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  // Determine brands columns
  const brandsList = useMemo(() => {
    if (selectedBrand !== 'ALL') return [selectedBrand];
    return STANDARD_BRANDS;
  }, [selectedBrand]);

  // Filter changes payload by status filter if active
  const activeChanges = useMemo(() => {
    if (statusFilter === 'ALL') return changes;
    return changes.filter((c) => c.status === statusFilter);
  }, [changes, statusFilter]);

  // Helper to compute matches for a (item, brand) pair
  const getMatchingChanges = (item: CAISItemDef, brand: string) => {
    return activeChanges.filter((change) => {
      const bureauText = `${change.impactedBureaus || ''} ${change.description || ''} ${change.title || ''}`;
      const itemText = `${change.impactedDataItems || ''} ${change.description || ''} ${change.title || ''}`;

      const brandMatch = isBrandMatchedInText(brand, bureauText);
      const itemMatch = isItemMatchedInText(item, itemText);

      return brandMatch && itemMatch;
    });
  };

  // Overall Statistics
  const totalLinkagesCount = useMemo(() => {
    let total = 0;
    STANDARD_CAIS_ITEMS.forEach((item) => {
      STANDARD_BRANDS.forEach((brand) => {
        const matches = getMatchingChanges(item, brand);
        total += matches.length;
      });
    });
    return total;
  }, [activeChanges]);

  const impactedItemsCount = useMemo(() => {
    return STANDARD_CAIS_ITEMS.filter((item) => {
      return STANDARD_BRANDS.some((brand) => getMatchingChanges(item, brand).length > 0);
    }).length;
  }, [activeChanges]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Grid className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              CAIS Variable & Brand Traceability Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-3xl">
            Live cross-sectional mapping between standard CAIS 44-Field variables and impacted credit bureaus / brand portfolios. Click any non-zero matrix cell to view matching CR audit records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchChanges}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <Link
            href="/changes"
            className="px-4 py-2 rounded-xl bg-[#C0272D] hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            View Change Register <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Statistics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Traceability Linkages
          </div>
          <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{totalLinkagesCount}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Total (Variable × Brand) change mappings across active CRs</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Impacted CAIS Variables
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {impactedItemsCount} <span className="text-sm font-normal text-slate-400">/ 44</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">CAIS Data catalog items modified by logged changes</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Coverage Brands
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{STANDARD_BRANDS.length}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Standard Bureaus & Brand Portfolios tracked</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search CAIS variable name, code, pos..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end text-xs">
          {/* Brand Filter */}
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Brand:</span>
          </div>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Brands ({STANDARD_BRANDS.length})</option>
            {STANDARD_BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-slate-500 ml-2">
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Workflow Status Filter */}
          <div className="flex items-center gap-1.5 text-slate-500 ml-2">
            <span>CR Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All CR Statuses</option>
            <option value="APPROVED">Approved Only</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Main Traceability Grid Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">CAIS 44-Field Cross-Brand Impact Heatmap</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredItems.length} of 44 CAIS Data Items against {brandsList.length} brand portfolios
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700"></span>
              <span>0 (No Changes)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-500/40"></span>
              <span>1 Change</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-500/30 border border-purple-500/50"></span>
              <span>2+ Changes</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            Loading Traceability Matrix...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-2">
            <Grid className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-medium">No CAIS variables match your active filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4 w-12 text-center sticky left-0 z-20 bg-slate-100 dark:bg-slate-900">Pos</th>
                  <th className="py-3 px-4 sticky left-12 z-20 bg-slate-100 dark:bg-slate-900 shadow-r border-r border-slate-200 dark:border-slate-800">
                    CAIS Data Item Variable
                  </th>
                  <th className="py-3 px-3">Category</th>
                  {brandsList.map((brand) => (
                    <th key={brand} className="py-3 px-3 text-center min-w-[120px]">
                      {brand}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
                {filteredItems.map((item) => {
                  return (
                    <tr key={item.pos} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Position */}
                      <td className="py-3 px-4 font-mono text-center font-semibold text-slate-400 sticky left-0 z-10 bg-white dark:bg-slate-950">
                        {item.pos < 10 ? `0${item.pos}` : item.pos}
                      </td>

                      {/* Name & Code */}
                      <td className="py-3 px-4 sticky left-12 z-10 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.code}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {item.category}
                      </td>

                      {/* Brand Cells */}
                      {brandsList.map((brand) => {
                        const matching = getMatchingChanges(item, brand);
                        const count = matching.length;

                        let cellClass =
                          'bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 border border-slate-200/50 dark:border-slate-800/40';
                        if (count === 1) {
                          cellClass =
                            'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 shadow-xs font-bold hover:bg-cyan-500/25 cursor-pointer';
                        } else if (count >= 2) {
                          cellClass =
                            'bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/50 shadow-xs font-bold hover:bg-purple-500/35 cursor-pointer';
                        }

                        return (
                          <td key={brand} className="py-2.5 px-3 text-center">
                            <button
                              disabled={count === 0}
                              onClick={() =>
                                setActiveCell({
                                  item,
                                  brand,
                                  matchingChanges: matching,
                                })
                              }
                              className={`w-full py-1.5 px-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1 ${cellClass}`}
                              title={
                                count > 0
                                  ? `Click to view ${count} CR(s) impacting ${item.name} on ${brand}`
                                  : `No changes impacting ${item.name} on ${brand}`
                              }
                            >
                              <span>{count}</span>
                              {count > 0 && <ExternalLink className="w-3 h-3 opacity-70" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal / Popover listing matching CR references */}
      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="glass-panel bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Traceability Linkages ({activeCell.matchingChanges.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">{activeCell.item.name}</span> ({activeCell.item.code}) ×{' '}
                    <span className="font-semibold text-purple-600 dark:text-purple-300">{activeCell.brand}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCell(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 divide-y divide-slate-200 dark:divide-slate-800">
              {activeCell.matchingChanges.map((change) => (
                <div key={change.id} className="pt-4 first:pt-0 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                          {change.crReference}
                        </span>
                        <StatusBadge status={change.status} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                        {change.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => {
                        setActiveCell(null);
                        router.push(`/document?changeId=${change.id}&mode=review`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                    >
                      <span>View Detail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {change.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <div>
                      <span className="text-slate-500 font-medium">Author:</span> {change.author || 'BA Team'}
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Target Month:</span> {change.targetMonth || 'November 2026'}
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Sections:</span> {change.sectionsUpdated || '1.3, 2.5'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
              <button
                onClick={() => setActiveCell(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
