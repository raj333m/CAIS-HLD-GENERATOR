'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Grid, ArrowRight, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { STANDARD_CAIS_ITEMS, STANDARD_BRANDS, isItemMatchedInChange, isBrandMatchedInChange } from '@/lib/caisCatalog';

interface TraceabilityWidgetProps {
  changes: any[];
}

export default function TraceabilityWidget({ changes }: TraceabilityWidgetProps) {
  // Compute top impacted variables
  const topImpactedItems = useMemo(() => {
    const itemCounts = STANDARD_CAIS_ITEMS.map((item) => {
      let count = 0;
      const brandsSet = new Set<string>();

      changes.forEach((c) => {
        if (isItemMatchedInChange(item, c)) {
          count++;
          STANDARD_BRANDS.forEach((brand) => {
            if (isBrandMatchedInChange(brand, c)) {
              brandsSet.add(brand);
            }
          });
        }
      });

      return {
        item,
        count,
        brands: Array.from(brandsSet),
      };
    });

    return itemCounts
      .filter((i) => i.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [changes]);

  const totalLinkages = useMemo(() => {
    let total = 0;
    STANDARD_CAIS_ITEMS.forEach((item) => {
      STANDARD_BRANDS.forEach((brand) => {
        changes.forEach((c) => {
          if (isBrandMatchedInChange(brand, c) && isItemMatchedInChange(item, c)) {
            total++;
          }
        });
      });
    });
    return total;
  }, [changes]);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              CAIS Variable & Brand Traceability Summary
            </h2>
            <p className="text-xs text-slate-500">
              Cross-sectional mapping across 44 CAIS Data Items and 5 brand portfolios
            </p>
          </div>
        </div>

        <Link
          href="/traceability"
          className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <span>Open Full Matrix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {topImpactedItems.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs">
          No variable linkages calculated for current change set
        </div>
      ) : (
        <div className="space-y-2.5 pt-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
            <span>Top Impacted CAIS Variables</span>
            <span>Active Mappings ({totalLinkages})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topImpactedItems.map(({ item, count, brands }) => (
              <Link
                key={item.pos}
                href={`/traceability?search=${encodeURIComponent(item.code)}`}
                className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-cyan-500/40 transition-all group flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      {item.pos < 10 ? `0${item.pos}` : item.pos}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {brands.map((b) => (
                      <span
                        key={b}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-medium"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs border border-cyan-500/40 shrink-0">
                  {count} CR{count > 1 ? 's' : ''}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
