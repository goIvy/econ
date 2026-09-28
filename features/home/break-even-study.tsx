"use client";

import { useState } from "react";
import { TraceChart } from "@/components/charts/trace-chart";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { Readout } from "@/components/ui/readout";
import { SampleChip } from "@/components/ui/lineage";
import { Segmented } from "@/components/ui/segmented";
import { lineage } from "@/data/sources";
import { money, moneyCompact } from "@/lib/format";

type Study = {
  series: Array<{ age: number; cumulative: number }>;
  baseline: Array<{ age: number; cumulative: number }>;
  breakEven: number | null;
  netPrice: number;
  debt: number;
  opportunityCost: number;
};

const MODEL = lineage("cvl-model", 2024, "Calculated from the stated assumptions", { note: "Estimate in 2024 dollars." });
const BASE = lineage("acs-major", 2023, "Workers aged 18–45 whose highest credential is a high-school diploma", { sampleSize: 40000 });

export function BreakEvenStudy({ levels, out, label, state }: { levels: number[]; out: Record<string, Study>; label: string; state: string }) {
  const [residency, setResidency] = useState<"resident" | "nonresident">("resident");
  const [aidIdx, setAidIdx] = useState(3);
  const aid = levels[aidIdx];
  const s = out[`${residency}:${aid}`];

  const interp = (age: number) => {
    const i = Math.max(0, s.series.findIndex((p) => p.age > age) - 1);
    const a = s.series[i], b = s.series[i + 1] ?? a;
    return a.cumulative + (b.age === a.age ? 0 : ((age - a.age) / (b.age - a.age)) * (b.cumulative - a.cumulative));
  };

  const summary = s.breakEven
    ? `${label} for a${residency === "resident" ? "n in-state" : "n out-of-state"} student with ${money(aid)} a year in grants. Cumulative value dips during college, then climbs. Based on these assumptions it passes the no-degree path around age ${s.breakEven.toFixed(1)}.`
    : `With these assumptions, ${label} doesn't pass the no-degree path by age 40.`;

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="grid content-start gap-6 lg:col-span-4">
        <Segmented
          label={`Residency (${state})`}
          value={residency}
          onChange={setResidency}
          options={[
            { value: "resident", label: "In-state" },
            { value: "nonresident", label: "Out-of-state" },
          ]}
        />
        <GraduatedSlider label="Grants per year" value={aidIdx} onChange={setAidIdx} min={0} max={levels.length - 1} step={1} ticks={levels.length - 1} format={(i) => moneyCompact(levels[i])} />
        <dl className="grid grid-cols-2 gap-5 border-t border-rule pt-5">
          <Readout label="Break-even age" value={s.breakEven} format={(n) => n.toFixed(1)} lineage={MODEL} footnote={1} estimate explain="Approximately how long it takes for the extra earnings from this path to recover its higher cost." />
          <Readout label="Estimated debt" value={s.debt} format={money} lineage={MODEL} footnote={2} />
          <Readout label="Net cost, 4 years" value={s.netPrice} format={money} lineage={MODEL} footnote={3} />
          <Readout
            label="Earnings given up"
            value={s.opportunityCost}
            format={money}
            lineage={BASE}
            footnote={4}
            explain="Opportunity cost: the after-tax pay a typical high-school graduate earns from 18 to 22, which a full-time student gives up."
          />
        </dl>
      </div>
      <div className="rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6 lg:col-span-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-small font-semibold text-ink">{label}</p>
          <SampleChip />
        </div>
        <TraceChart
          title={`Break-even for ${label}`}
          series={[
            { id: "path", trace: "a", label, points: s.series.map((p) => ({ x: p.age, y: p.cumulative })) },
            { id: "base", trace: "baseline", label: "Working from 18, no degree", points: s.baseline.map((p) => ({ x: p.age, y: p.cumulative })) },
          ]}
          marker={s.breakEven ? { x: s.breakEven, y: interp(s.breakEven), label: `Break-even ≈ age ${s.breakEven.toFixed(1)}` } : null}
          band={{ from: 18, to: 22, label: "College" }}
          summary={summary}
          height={340}
        />
      </div>
    </div>
  );
}
