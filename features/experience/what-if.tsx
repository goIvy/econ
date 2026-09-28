"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { AnimatedNumber, useMeasuredWidth } from "@/components/motion";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { Segmented } from "@/components/ui/segmented";
import { SampleChip } from "@/components/ui/lineage";
import { Button } from "@/components/ui/button";
import { linear, linePath, ticks, valueAt } from "@/components/charts/scale";
import { cumulativeSeries, evaluate, marginal, type Scenario } from "@/lib/calc";
import { ledgerItem, markerSettle } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { LivingArrangement } from "@/types";
import { PathPicker } from "./path-picker";
import type { PathPreset } from "./data";

const START = 18;
const END = 45;
const INK: Record<string, string> = { a: "var(--trace-a)", b: "var(--trace-b)", d: "var(--trace-d)" };
type Control = "scholarship" | "salary" | "living" | "years" | "path";
const LIVING_LABEL: Record<LivingArrangement, string> = { campus: "on campus", "off-campus": "in an apartment", home: "at home" };
/** Morph speed for drag-driven chart changes: fast enough to feel direct. */
const MORPH = { duration: 0.22, ease: [0.16, 1, 0.3, 1] } as const;

/**
 * The What-If Lab: big tactile controls, a chart that reshapes as you drag,
 * and one sentence saying what the last change did (marginal analysis).
 */
export function WhatIfLab({ presets }: { presets: PathPreset[] }) {
  const [key, setKey] = useState<PathPreset["key"]>("a");
  const preset = presets.find((p) => p.key === key)!;
  const defaultSalary = preset.ctx.outcome.earlyCareer.value?.p50 ?? preset.ctx.major.earlyCareer.value?.p50 ?? 60000;
  const [scholarship, setScholarship] = useState(0);
  const [salary, setSalary] = useState(defaultSalary);
  const [living, setLiving] = useState<LivingArrangement>("campus");
  const [years, setYears] = useState(4);
  const [last, setLast] = useState<Control>("scholarship");

  const scenario = (over: Partial<{ scholarship: number; salary: number; living: LivingArrangement; years: number }> = {}): Scenario => ({
    inputs: {
      ...preset.inputs,
      living: over.living ?? living,
      yearsToGraduate: over.years ?? years,
      funding: { ...preset.inputs.funding, scholarshipsPerYear: over.scholarship ?? scholarship },
    },
    opts: { horizonAge: END, salaryOverride: over.salary ?? salary },
  });
  const current = scenario();
  // The React compiler memoizes these; each is a few projections (well under a millisecond).
  const now = evaluate(current, preset.ctx);
  const start = evaluate({ inputs: preset.inputs, opts: { horizonAge: END, salaryOverride: defaultSalary } }, preset.ctx);

  const insight = (() => {
    const ctx = preset.ctx;
    if (last === "scholarship") {
      const d = scholarship + 10000 <= 60000 ? 10000 : -10000;
      return { kind: last, d, m: marginal(current, scenario({ scholarship: scholarship + d }), ctx) };
    }
    if (last === "salary") {
      const d = salary + 10000 <= 150000 ? 10000 : -10000;
      return { kind: last, d, m: marginal(current, scenario({ salary: salary + d }), ctx) };
    }
    if (last === "living") {
      const alt: LivingArrangement = living === "home" ? "campus" : "home";
      return { kind: last, alt, m: marginal(current, scenario({ living: alt }), ctx) };
    }
    if (last === "years") {
      const alt = years < 6 ? years + 1 : years - 1;
      return { kind: last, alt, m: marginal(current, scenario({ years: alt }), ctx) };
    }
    return { kind: last, m: null };
  })();

  const reset = () => {
    setScholarship(0);
    setSalary(defaultSalary);
    setLiving("campus");
    setYears(4);
    setLast("scholarship");
  };
  const color = INK[key];
  const r = now.result;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PathPicker
          presets={presets}
          value={key}
          onChange={(k) => {
            setKey(k);
            const p = presets.find((x) => x.key === k)!;
            setSalary(p.ctx.outcome.earlyCareer.value?.p50 ?? p.ctx.major.earlyCareer.value?.p50 ?? 60000);
            setLast("path");
          }}
          label="What-If path"
        />
        <Button variant="quiet" onClick={reset} className="gap-2">
          <RotateCcw className="size-4" aria-hidden /> Reset
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
        {/* output: sticky on phones so the chart stays in view while dragging */}
        <div className="z-10 grid min-w-0 content-start gap-3 self-start rounded-lg border border-rule bg-surface p-4 shadow-2 max-lg:sticky max-lg:top-[calc(var(--nav-h)+8px)] sm:p-5 lg:order-2 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <p className="text-small font-semibold text-ink">Cumulative net value vs. working from 18</p>
            <SampleChip />
          </div>
          <Chart now={cumulativeSeries(r.rows, END)} start={cumulativeSeries(start.result.rows, END)} base={cumulativeSeries(now.baseline, END)} be={now.breakEven} color={color} />
          <dl className="grid grid-cols-3 gap-3 border-t border-rule pt-3 lg:grid-cols-4">
            <Out label="Net price, all years" value={r.net.netPrice} />
            <Out label="Borrowed" value={r.net.borrowing} />
            <Out label="Monthly payment" value={r.loan.monthlyPayment} className="max-lg:hidden" />
            <div className="grid gap-0.5">
              <dt className="text-caption text-muted">Break-even</dt>
              <dd className="tabular text-base font-semibold text-ink sm:text-h3">{now.breakEven ? `Age ${now.breakEven.toFixed(1)}` : `Not by ${END}`}</dd>
            </div>
          </dl>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={JSON.stringify([insight.kind, Math.round((insight.m?.breakEvenShift ?? 0) * 10)])} variants={ledgerItem} initial="hidden" animate="visible" exit="exit" className="min-h-[3rem] rounded-md bg-surface-sunk px-3 py-2 text-small text-ink-2" aria-live="polite">
              {sentence(insight, { scholarship, living, years })}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="grid content-start gap-7 lg:order-1 lg:col-span-5">
          <GraduatedSlider size="lg" label="Scholarship per year" value={scholarship} onChange={(v) => { setScholarship(v); setLast("scholarship"); }} min={0} max={60000} step={1000} format={moneyCompact} trace={key} />
          <GraduatedSlider size="lg" label="Starting salary" value={salary} onChange={(v) => { setSalary(v); setLast("salary"); }} min={40000} max={150000} step={1000} format={moneyCompact} trace={key} description={`This program's median: ${money(defaultSalary)}`} />
          <Segmented
            label="Living arrangement"
            value={living}
            onChange={(v) => { setLiving(v); setLast("living"); }}
            options={[
              { value: "campus", label: "Campus" },
              { value: "off-campus", label: "Apartment" },
              { value: "home", label: "Home" },
            ]}
          />
          <Segmented
            label="Years to graduate"
            value={String(years) as "3" | "4" | "5" | "6"}
            onChange={(v) => { setYears(Number(v)); setLast("years"); }}
            options={["3", "4", "5", "6"].map((y) => ({ value: y as "3" | "4" | "5" | "6", label: `${y} years` }))}
          />
        </div>
      </div>
    </div>
  );
}

type Insight = { kind: Control; d?: number; alt?: LivingArrangement | number; m: ReturnType<typeof marginal> | null };

function sentence(i: Insight, s: { scholarship: number; living: LivingArrangement; years: number }): string {
  if (!i.m) return "Each path has its own costs and outcomes. Drag any control to see what it changes.";
  const shift = i.m.breakEvenShift;
  const move = shift == null ? null : Math.abs(shift) < 0.05 ? "barely moves break-even" : `${shift < 0 ? "brings break-even" : "pushes break-even"} about ${Math.abs(shift).toFixed(1)} years ${shift < 0 ? "earlier" : "later"}`;
  const never = i.m.after == null ? " With that change, this path doesn't catch up by 45." : i.m.before == null ? " That change is enough for this path to catch up by 45." : "";
  switch (i.kind) {
    case "scholarship": {
      const more = (i.d ?? 0) > 0;
      return `${more ? "An additional" : "Losing"} $10,000 a year in scholarships ${move ?? "changes the outcome"} and ${more ? "cuts" : "adds"} ${money(Math.abs(i.m.borrowingChange))} ${more ? "from" : "to"} borrowing.${never}`;
    }
    case "salary":
      return `A starting salary $10,000 ${(i.d ?? 0) > 0 ? "higher" : "lower"} ${move ?? "changes the outcome"}.${never}`;
    case "living":
      return `Living ${LIVING_LABEL[i.alt as LivingArrangement]} instead of ${LIVING_LABEL[s.living]} would ${i.m.netPriceChange < 0 ? "save" : "cost"} ${money(Math.abs(i.m.netPriceChange))} over ${s.years} years and ${move ?? "change the outcome"}.${never}`;
    case "years":
      return `Taking ${i.alt} years instead of ${s.years} ${i.m.netPriceChange > 0 ? "adds" : "saves"} ${money(Math.abs(i.m.netPriceChange))} in costs and ${move ?? "changes the outcome"}.${never}`;
    default:
      return "";
  }
}

function Out({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={cn("grid gap-0.5", className)}>
      <dt className="text-caption text-muted">{label}</dt>
      <dd className="text-base font-semibold text-ink sm:text-h3">
        <AnimatedNumber value={value} format={moneyCompact} />
      </dd>
    </div>
  );
}

function Chart({ now, start, base, be, color }: { now: number[]; start: number[]; base: number[]; be: number | null; color: string }) {
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(640);
  const H = W < 480 ? 170 : 280;
  const M = { t: 12, r: 12, b: 24, l: 52 };
  const lo = Math.min(0, ...now, ...start, ...base);
  const hi = Math.max(...now, ...start, ...base);
  const x = linear([START, END], [M.l, W - M.r]);
  const y = linear([lo * 1.1, hi * 1.05], [H - M.b, M.t]);
  const d = (s: number[]) => linePath(s.map((v, i) => [x(START + i), y(v)]));
  return (
    <div ref={ref} className="min-w-0">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`Cumulative net value by age for this scenario. ${be ? `Break-even at ${be.toFixed(1)}.` : "No break-even by 45."}`}>
        {ticks(lo * 1.1, hi, 4).map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--rule-strong)" : "var(--rule)"} />
            <text x={M.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">
              {moneyCompact(t)}
            </text>
          </g>
        ))}
        {[18, 22, 26, 30, 35, 40, 45].map((t) => (
          <text key={t} x={x(t)} y={H - 6} textAnchor="middle" className="tabular fill-muted text-[11px]">
            {t}
          </text>
        ))}
        <motion.path initial={false} animate={{ d: d(base) }} transition={MORPH} fill="none" stroke="var(--trace-c)" strokeWidth={1.75} strokeDasharray="6 4" />
        <motion.path initial={false} animate={{ d: d(start) }} transition={MORPH} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={2} />
        <motion.path initial={false} animate={{ d: d(now) }} transition={MORPH} fill="none" stroke={color} strokeWidth={2.75} strokeLinejoin="round" />
        <AnimatePresence>
          {be != null && (
            <motion.g key="be" initial={{ opacity: 0, x: x(be), y: y(valueAt(base, START, be)) }} animate={{ opacity: 1, x: x(be), y: y(valueAt(base, START, be)) }} exit={{ opacity: 0 }} transition={MORPH}>
              <motion.g variants={markerSettle} initial="hidden" animate="visible" custom={0}>
                <circle r={7} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
                <circle r={2.5} fill="var(--ink)" />
              </motion.g>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-2">
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4" style={{ background: color }} aria-hidden />Your scenario</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 opacity-30" style={{ background: color }} aria-hidden />Where you started</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-dashed border-trace-c" aria-hidden />C: working from 18</span>
      </p>
    </div>
  );
}
