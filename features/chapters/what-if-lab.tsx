"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber, useMeasuredWidth } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { Segmented } from "@/components/ui/segmented";
import { SampleChip } from "@/components/ui/lineage";
import { linear, linePath, ticks, valueAt } from "@/components/charts/scale";
import { calculateBreakEvenYear, calculateDisposableIncome, cumulativeSeries, impliedGrowth, projectNoCollege, projectPath, type PathContext } from "@/lib/calc";
import { DUR, EASE, markerSettle } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PATH_VAR, pathNo, useScenario } from "@/features/scenario/store";
import type { PathSel } from "@/features/scenario/types";

const END = 40;

interface Inputs {
  scholarship: number;
  salary: number;
  rent: number;
  family: number;
  rate: number;
  years: number;
  growth: number;
  inflation: number;
}

const LABELS: Record<keyof Inputs, { name: string; fmt: (v: number) => string; delta: (d: number) => string }> = {
  scholarship: { name: "scholarship", fmt: moneyCompact, delta: (d) => `${d > 0 ? "+" : "−"}${money(Math.abs(d))} scholarship` },
  salary: { name: "starting salary", fmt: moneyCompact, delta: (d) => `${d > 0 ? "+" : "−"}${money(Math.abs(d))} starting salary` },
  rent: { name: "rent", fmt: money, delta: (d) => `${d > 0 ? "+" : "−"}${money(Math.abs(d))}/mo rent` },
  family: { name: "family contribution", fmt: moneyCompact, delta: (d) => `${d > 0 ? "+" : "−"}${money(Math.abs(d))} family help a year` },
  rate: { name: "interest rate", fmt: (v) => pct(v, 2), delta: (d) => `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(2)} pts interest rate` },
  years: { name: "graduation time", fmt: (v) => `${v} yrs`, delta: (d) => `${d > 0 ? "+" : "−"}${Math.abs(d)} year${Math.abs(d) === 1 ? "" : "s"} to graduate` },
  growth: { name: "salary growth", fmt: (v) => pct(v * 100, 1), delta: (d) => `${d > 0 ? "+" : "−"}${(Math.abs(d) * 100).toFixed(1)} pts salary growth` },
  inflation: { name: "inflation", fmt: (v) => pct(v * 100, 1), delta: (d) => `${d > 0 ? "+" : "−"}${(Math.abs(d) * 100).toFixed(1)} pts inflation` },
};

function evaluate(sel: PathSel, ctx: PathContext, i: Inputs) {
  const residency = ctx.college.control === "public" ? sel.residency : "resident";
  const r = projectPath(
    { collegeId: sel.collegeId, majorId: sel.majorId, residency, living: sel.living, yearsToGraduate: i.years, funding: { aidPerYear: sel.aid, scholarshipsPerYear: i.scholarship, familyPerYear: i.family, workPerYear: 3000, savings: 0 } },
    ctx,
    { horizonAge: END, salaryOverride: i.salary, growthOverride: i.growth, loanRatePct: i.rate, inflation: i.inflation },
  );
  const baseline = projectNoCollege({ horizonAge: END, stateRate: ctx.collegeCity?.stateTaxRate });
  const be = calculateBreakEvenYear(r.rows, baseline, r.graduationAge);
  const disp = calculateDisposableIncome({ salary: i.salary * r.employmentRate, stateRate: ctx.collegeCity?.stateTaxRate ?? 0.045, rentPerMonth: i.rent, rpp: ctx.collegeCity?.rpp.value ?? 100, loanPerYear: r.loan.monthlyPayment * 12 });
  return {
    netCost: r.net.netPrice,
    debt: r.loan.repaymentBalance,
    breakEven: be && be.age > 18 ? be.age : null,
    year10: r.tenYearEarnings,
    disposable: disp.disposable / 12,
    series: cumulativeSeries(r.rows, END),
    base: cumulativeSeries(baseline, END),
  };
}
type Out = ReturnType<typeof evaluate>;

/**
 * WHAT-IF LAB. Eight tactile controls on the active path. When a change
 * settles, a trace shows exactly what moved: the change, then its effect on
 * net cost, break-even, debt and monthly disposable income.
 */
export function WhatIfLab() {
  const { futures, active } = useScenario();
  const f = futures.find((x) => x.index === active) ?? futures[0];
  const defaults = useMemo<Inputs>(() => {
    const start = f.result.startingSalary;
    const mid = f.ctx.outcome.midCareerMedian.value ?? f.ctx.major.midCareerMedian.value ?? start;
    return { scholarship: 0, salary: Math.round(start / 1000) * 1000, rent: Math.round((f.ctx.collegeCity?.rent1br.value ?? 1500) / 50) * 50, family: 10000, rate: 6.53, years: 4, growth: Math.round(impliedGrowth(start, mid) * 1000) / 1000, inflation: 0 };
  }, [f]);
  const [inputs, setInputs] = useState<Inputs>(defaults);
  const [resetKey, setResetKey] = useState(f.label);
  if (resetKey !== f.label) {
    // The active path changed in the hero: start from its defaults.
    setResetKey(f.label);
    setInputs(defaults);
  }
  const out = useMemo(() => evaluate(f.sel, f.ctx, inputs), [f, inputs]);
  const start = useMemo(() => evaluate(f.sel, f.ctx, defaults), [f, defaults]);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setInputs((s) => ({ ...s, [k]: v }));

  // Change trace: when inputs settle, compare to the last settled state.
  const settled = useRef<{ inputs: Inputs; out: Out }>({ inputs: defaults, out: start });
  const [trace, setTrace] = useState<{ id: number; title: string; rows: Array<[string, string, number]> } | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const prev = settled.current;
      const changed = (Object.keys(inputs) as Array<keyof Inputs>).filter((k) => Math.abs(inputs[k] - prev.inputs[k]) > 1e-9);
      if (!changed.length) return;
      const k = changed[0];
      const beDelta = out.breakEven != null && prev.out.breakEven != null ? out.breakEven - prev.out.breakEven : null;
      setTrace({
        id: Date.now(),
        title: changed.length === 1 ? LABELS[k].delta(inputs[k] - prev.inputs[k]) : `${changed.length} assumptions changed`,
        rows: [
          ["Net cost", signedMoney(out.netCost - prev.out.netCost), out.netCost - prev.out.netCost],
          ["Break-even", beDelta == null ? (out.breakEven == null ? "not by 40" : `now ${out.breakEven.toFixed(1)}`) : `${beDelta > 0 ? "+" : "−"}${Math.abs(beDelta).toFixed(1)} years`, beDelta ?? 0],
          ["Debt", signedMoney(out.debt - prev.out.debt), out.debt - prev.out.debt],
          ["Disposable income", `${signedMoney(out.disposable - prev.out.disposable)}/mo`, -(out.disposable - prev.out.disposable)],
        ],
      });
      settled.current = { inputs, out };
    }, 450);
    return () => clearTimeout(t);
  }, [inputs, out]);

  const reset = () => {
    setInputs(defaults);
    settled.current = { inputs: defaults, out: start };
    setTrace(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="grid content-start gap-6 lg:col-span-5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-caption font-bold tracking-[0.12em] text-ink">
            <span className="size-2 rounded-full" style={{ background: PATH_VAR[f.index] }} />
            PATH {pathNo(f.index)} <span className="font-medium tracking-normal text-muted">{f.label}</span>
          </p>
          <Button variant="quiet" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="size-4" aria-hidden /> Reset
          </Button>
        </div>
        <GraduatedSlider size="lg" label="Scholarship per year" value={inputs.scholarship} onChange={(v) => set("scholarship", v)} min={0} max={40000} step={1000} format={moneyCompact} trace="a" />
        <GraduatedSlider size="lg" label="Starting salary" value={inputs.salary} onChange={(v) => set("salary", v)} min={30000} max={150000} step={1000} format={moneyCompact} trace="a" />
        <div className="grid gap-6 sm:grid-cols-2">
          <GraduatedSlider label="Rent after college (monthly)" value={inputs.rent} onChange={(v) => set("rent", v)} min={500} max={3500} step={50} format={money} />
          <GraduatedSlider label="Family help per year (less debt)" value={inputs.family} onChange={(v) => set("family", v)} min={0} max={30000} step={1000} format={moneyCompact} />
          <GraduatedSlider label="Loan interest rate" value={inputs.rate} onChange={(v) => set("rate", v)} min={3} max={10} step={0.25} format={(v) => pct(v, 2)} />
          <GraduatedSlider label="Salary growth per year" value={inputs.growth} onChange={(v) => set("growth", v)} min={0} max={0.07} step={0.0025} format={(v) => pct(v * 100, 1)} />
          <GraduatedSlider label="Inflation" value={inputs.inflation} onChange={(v) => set("inflation", v)} min={0} max={0.06} step={0.005} format={(v) => pct(v * 100, 1)} description="Fixed loan payments shrink in real terms." />
          <Segmented label="Graduation time" value={String(inputs.years) as "3" | "4" | "5" | "6"} onChange={(v) => set("years", Number(v))} options={["3", "4", "5", "6"].map((y) => ({ value: y as "3" | "4" | "5" | "6", label: `${y} yrs` }))} />
        </div>
      </div>

      <div className="z-10 grid min-w-0 content-start gap-4 self-start rounded-lg border border-rule bg-surface p-4 shadow-3 max-lg:sticky max-lg:top-[calc(var(--nav-h)+8px)] sm:p-6 lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:col-span-7">
        <div className="flex items-center justify-between gap-2">
          <p className="text-small font-semibold text-ink">Cumulative net value vs. working from 18</p>
          <SampleChip />
        </div>
        <Chart now={out.series} start={start.series} base={out.base} be={out.breakEven} color={PATH_VAR[f.index]} />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rule pt-4 sm:grid-cols-4">
          <Out label="Break-even" value={out.breakEven} fmt={(v) => `Age ${v.toFixed(1)}`} />
          <Out label="Debt at graduation" value={out.debt} fmt={moneyCompact} />
          <Out label="Year-10 earnings" value={out.year10} fmt={moneyCompact} />
          <Out label="Disposable income" value={out.disposable} fmt={(v) => `${moneyCompact(v)}/mo`} />
        </dl>
        <div className="min-h-[132px]" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {trace ? (
              <motion.div key={trace.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: DUR.fast } }} className="grid gap-2 rounded-md bg-surface-sunk p-3">
                <p className="text-small font-bold text-ink">{trace.title}</p>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {trace.rows.map(([label, text, dir], i) => (
                    <motion.li key={label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.1, duration: DUR.standard, ease: EASE.smooth }} className="flex items-baseline justify-between gap-2 text-caption">
                      <span className="text-muted">{label}</span>
                      <span className={cn("tabular font-bold", Math.abs(dir) < 1e-6 ? "text-ink-2" : dir < 0 ? "text-gain" : "text-risk")}>{text}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ) : (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-md bg-surface-sunk p-3 text-small text-ink-2">
                Change one assumption. When you let go, this shows exactly what moved and by how much. Disposable income is the first year after college: after taxes, rent, {money(20400)} of core costs at average prices, and loan payments.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function signedMoney(d: number) {
  if (Math.abs(d) < 0.5) return "no change";
  return `${d > 0 ? "+" : "−"}${money(Math.abs(d))}`;
}

function Out({ label, value, fmt }: { label: string; value: number | null; fmt: (v: number) => string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-caption text-muted">{label}</dt>
      <dd className="text-h3 font-bold text-ink">{value == null ? "Not by 40" : <AnimatedNumber value={value} format={fmt} />}</dd>
    </div>
  );
}

function Chart({ now, start, base, be, color }: { now: number[]; start: number[]; base: number[]; be: number | null; color: string }) {
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(640);
  const H = W < 480 ? 180 : 280;
  const M = { t: 12, r: 12, b: 24, l: 52 };
  const all = [...now, ...start, ...base];
  const lo = Math.min(0, ...all) * 1.1;
  const hi = Math.max(...all) * 1.05;
  const x = linear([18, END], [M.l, W - M.r]);
  const y = linear([lo, hi], [H - M.b, M.t]);
  const d = (s: number[]) => linePath(s.map((v, i) => [x(18 + i), y(v)]));
  const MORPH = { duration: 0.25, ease: EASE.smooth };
  return (
    <div ref={ref} className="min-w-0" data-cursor="EXPLORE">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`Cumulative net value by age for this scenario. ${be ? `Break-even at ${be.toFixed(1)}.` : "No break-even by 40."}`}>
        {ticks(lo, hi, 4).map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--rule-strong)" : "var(--rule)"} />
            <text x={M.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">
              {moneyCompact(t)}
            </text>
          </g>
        ))}
        {[18, 22, 26, 30, 35, 40].map((t) => (
          <text key={t} x={x(t)} y={H - 6} textAnchor="middle" className="tabular fill-muted text-[11px]">
            {t}
          </text>
        ))}
        <motion.path initial={false} animate={{ d: d(base) }} transition={MORPH} fill="none" stroke="var(--trace-c)" strokeWidth={1.75} strokeDasharray="6 4" />
        <motion.path initial={false} animate={{ d: d(start) }} transition={MORPH} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={2} />
        <motion.path initial={false} animate={{ d: d(now) }} transition={MORPH} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
        <AnimatePresence>
          {be != null && (
            <motion.g key="be" initial={{ opacity: 0, x: x(be), y: y(valueAt(base, 18, be)) }} animate={{ opacity: 1, x: x(be), y: y(valueAt(base, 18, be)) }} exit={{ opacity: 0 }} transition={MORPH}>
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
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-dashed border-trace-c" aria-hidden />Work from 18</span>
      </p>
    </div>
  );
}
