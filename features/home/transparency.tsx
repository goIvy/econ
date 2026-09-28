"use client";

import { LineageBody, SourceFootnote } from "@/components/ui/lineage";
import { SOURCES } from "@/data/sources";
import type { Lineage, SourceId } from "@/types";

const STRIP: Array<{ id: SourceId; what: string }> = [
  { id: "scorecard-inst", what: "Net price, debt, and earnings by institution and by program" },
  { id: "ipeds-cost", what: "Tuition, fees, room and board; 4- and 6-year graduation rates" },
  { id: "bls-oews", what: "Wages by occupation" },
  { id: "bls-ep", what: "10-year job growth projections" },
  { id: "acs-major", what: "Earnings by college major" },
  { id: "nyfed-grads", what: "Unemployment and underemployment by major" },
  { id: "bea-rpp", what: "Price levels by metro area" },
  { id: "fsa-rates", what: "Federal student loan interest rates" },
  { id: "fred-cpi", what: "Inflation (CPI-U)" },
];

/** Section 9: the footnote, opened up, plus the datasets behind every figure. */
export function Transparency({ specimen }: { specimen: { label: string; value: string; lineage: Lineage } }) {
  return (
    <div className="grid gap-12">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="grid content-start gap-3 self-start rounded-lg border border-rule bg-surface p-5 shadow-2 lg:col-span-5">
          <p className="text-caption font-medium text-muted">{specimen.label}</p>
          <p className="flex items-baseline gap-1.5">
            <span className="tabular text-readout font-semibold">{specimen.value}</span>
            <span className="text-caption text-muted">/yr</span>
            <SourceFootnote metric={specimen.label} lineage={specimen.lineage} n={1} />
          </p>
          <p className="text-caption text-muted">Select the marker to open the footnote, or read the same footnote opened up here.</p>
        </div>
        <div className="rounded-lg border border-rule bg-surface p-5 shadow-3 lg:col-span-7">
          <LineageBody metric={specimen.label} lineage={specimen.lineage} />
        </div>
      </div>

      <div>
        <p className="mb-4 font-display text-h3 font-semibold">Built on public data</p>
        <div className="grid border-t border-rule sm:grid-cols-2 lg:grid-cols-3">
          {STRIP.map((s) => {
            const src = SOURCES[s.id];
            return (
              <div key={s.id} className="grid gap-0.5 border-b border-rule py-4 sm:pr-6">
                <p className="text-small font-semibold text-ink">
                  {src.name}
                  <span className="font-normal text-muted"> · {src.publisher}</span>
                </p>
                <p className="text-caption text-ink-2">{s.what}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
