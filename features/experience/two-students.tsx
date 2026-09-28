"use client";

import { AnimatePresence, motion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useState } from "react";
import { AnimatedNumber, ScrollScene, scrollSceneTo, useMeasuredWidth, useScrollScene, useSteppedValue } from "@/components/motion";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { clamp, linear, linePath, ticks, valueAt } from "@/components/charts/scale";
import { crossingAge, opportunityCostOf, twoStudents } from "@/lib/calc";
import { ledgerItem, markerSettle, scrubSpring, valueTween } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Lineage } from "@/types";

const START = 18;
const END = 40;
const STOPS = [18, 19, 20, 21, 22, 25, 30, 35];

export interface TwoStudentsProps {
  costPerYear: number;
  yearsInCollege: number;
  graduateSalary: number;
  graduateGrowth: number;
  workerSalary: number;
  workerGrowth: number;
  lineage: Lineage;
}

/**
 * Opportunity cost, taught by scrolling through two lives. Student A goes to
 * college; Student B works from 18. The gap between them is the opportunity
 * cost; the crossing is break-even. Sliders move the crossing live.
 */
export function TwoStudents(defaults: TwoStudentsProps) {
  const { ref, progress, reduce } = useScrollScene();
  const [cost, setCost] = useState(defaults.costPerYear);
  const [salary, setSalary] = useState(defaults.graduateSalary);
  const [growth, setGrowth] = useState(defaults.graduateGrowth);
  const [wage, setWage] = useState(defaults.workerSalary);
  const [debt, setDebt] = useState(0);
  const [controlsOpen, setControlsOpen] = useState(false);

  const inputs = { ...defaults, costPerYear: cost, graduateSalary: salary, graduateGrowth: growth, workerSalary: wage, debt: Math.min(debt, cost * defaults.yearsInCollege), horizonAge: END };
  const rows = twoStudents(inputs);
  const cross = crossingAge(rows);
  const oc = opportunityCostOf(inputs);

  const ageTarget = useTransform(progress, (p) => clamp(START + p * 1.08 * (END - START), START, END));
  const age = useSpring(ageTarget, scrubSpring);
  const stepped = useSteppedValue(age, 1);
  const shownAge = reduce ? END : clamp(stepped, START, END);
  const row = rows[shownAge - START];
  const gap = row.a - row.b;
  const controls = (
    <>
      <GraduatedSlider size="sm" label="College cost per year" value={cost} onChange={setCost} min={0} max={80000} step={1000} format={moneyCompact} trace="a" />
      <GraduatedSlider size="sm" label="Starting salary after college" value={salary} onChange={setSalary} min={30000} max={120000} step={1000} format={moneyCompact} trace="a" />
      <GraduatedSlider size="sm" label="Alternative wage (working from 18)" value={wage} onChange={setWage} min={20000} max={60000} step={1000} format={moneyCompact} trace="ink" />
      <GraduatedSlider size="sm" label="Salary growth after college" value={growth} onChange={setGrowth} min={0} max={0.07} step={0.0025} format={(v) => pct(v * 100, 1)} trace="a" />
      <GraduatedSlider size="sm" label="Student debt (borrowed, repaid over 10 years)" value={Math.min(debt, cost * defaults.yearsInCollege)} onChange={setDebt} min={0} max={Math.max(1000, cost * defaults.yearsInCollege)} step={1000} format={moneyCompact} trace="a" />
    </>
  );
  const phase = shownAge < START + defaults.yearsInCollege ? "college" : cross != null && shownAge >= cross ? "after" : "catching";

  return (
    <ScrollScene sceneRef={ref} reduce={reduce} length={3.4} label="Opportunity cost: two students">
      <div className="mx-auto grid w-full max-w-[1200px] gap-5 px-4 py-4 md:px-8 lg:grid-cols-12 lg:gap-10 xl:px-12">
        <div className="order-2 grid min-w-0 content-start gap-3 lg:order-1 lg:col-span-4 lg:gap-4">
          <AgeRail age={shownAge} onPick={(a) => scrollSceneTo(ref.current, (a - START) / (1.08 * (END - START)), reduce)} cross={cross} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={phase} variants={ledgerItem} initial="hidden" animate="visible" exit="exit" className="min-h-[3.75rem] text-small text-ink-2 lg:min-h-[4.5rem] lg:text-base" aria-live="polite">
              {phase === "college" && (
                <>
                  Age {shownAge}. A is in college, paying <strong className="font-semibold text-ink">{money(cost)}</strong> a year. B is working and has earned <strong className="font-semibold text-ink">{money(row.b)}</strong>. The gap between them is the opportunity cost so far.
                </>
              )}
              {phase === "catching" && (
                <>
                  Age {shownAge}. A graduated and earns more each year, so the gap is closing. {cross ? <>The lines cross at <strong className="font-semibold text-ink">{cross.toFixed(1)}</strong>.</> : "With these assumptions, A never catches up by 40."}
                </>
              )}
              {phase === "after" && (
                <>
                  Age {shownAge}. A passed B at {cross!.toFixed(1)}: break-even. Everything above B&apos;s line from here is the return on the degree.
                </>
              )}
            </motion.p>
          </AnimatePresence>
          <button type="button" onClick={() => setControlsOpen(true)} className="h-11 rounded-sm border border-rule-strong bg-surface px-4 text-small font-semibold text-ink lg:hidden">
            Change cost, salary and raises
          </button>
          <div className="hidden gap-3 rounded-md border border-rule bg-surface p-3 sm:p-4 lg:grid">{controls}</div>
          <BottomSheet open={controlsOpen} onOpenChange={setControlsOpen} title="Assumptions">
            <div className="grid gap-4">{controls}</div>
          </BottomSheet>
        </div>

        <div className="order-1 grid min-w-0 content-start gap-3 rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-5 lg:order-2 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-caption text-ink-2">
              <Key color="var(--trace-a)" label="A: college" />
              <Key color="var(--trace-c)" dashed label="B: works from 18" />
            </div>
            <div className="flex items-center gap-2">
              <SampleChip />
              <SourceFootnote metric="Two-students teaching model" lineage={defaults.lineage} n={1} />
            </div>
          </div>
          <Chart rows={rows} age={age} cross={cross} reduce={reduce} />
          <dl className="grid grid-cols-3 gap-3 border-t border-rule pt-3">
            <Stat label={`A at ${shownAge}`} value={row.a} />
            <Stat label={`B at ${shownAge}`} value={row.b} />
            <Stat label={gap < 0 ? "A is behind by" : "A is ahead by"} value={Math.abs(gap)} strong />
          </dl>
          <p className="hidden text-caption text-muted sm:block">
            Opportunity cost of college here: {money(oc.directCost)} in costs plus {money(oc.foregoneEarnings)} in wages not earned = {money(oc.total)}. Teaching model: before taxes; borrowed money is repaid at 6.53% over 10 years; B&apos;s raise {pct(defaults.workerGrowth * 100, 1)} a year.
          </p>
        </div>
      </div>
    </ScrollScene>
  );
}

function Chart({ rows, age, cross, reduce }: { rows: Array<{ age: number; a: number; b: number }>; age: MotionValue<number>; cross: number | null; reduce: boolean }) {
  const [wrapRef, W] = useMeasuredWidth<HTMLDivElement>(700);
  const H = W < 520 ? 230 : 330;
  const M = { t: 16, r: 12, b: 26, l: W < 520 ? 44 : 56 };
  const lo = Math.min(0, ...rows.map((r) => r.a));
  const hi = Math.max(...rows.map((r) => Math.max(r.a, r.b)));
  const x = linear([START, END], [M.l, W - M.r]);
  const y = linear([lo * 1.1, hi * 1.05], [H - M.b, M.t]);
  const a = rows.map((r) => r.a);
  const b = rows.map((r) => r.b);
  const dA = linePath(rows.map((r) => [x(r.age), y(r.a)]));
  const dB = linePath(rows.map((r) => [x(r.age), y(r.b)]));
  const tr = valueTween(reduce);
  const clipW = useTransform(age, (h) => Math.max(0, x(h) - M.l + 2));
  const headX = useTransform(age, (h) => x(h));
  const headAY = useTransform(age, (h) => y(valueAt(a, START, h)));
  const headBY = useTransform(age, (h) => y(valueAt(b, START, h)));
  const crossShown = useTransform(age, (h) => (cross != null && h >= cross - 0.05 ? 1 : 0));

  // Gap shading: one quad per year, tinted by who is ahead.
  const quads = rows.slice(0, -1).map((r, i) => {
    const n = rows[i + 1];
    const ahead = (r.a + n.a) / 2 >= (r.b + n.b) / 2;
    return { d: `M${x(r.age)},${y(r.a)}L${x(n.age)},${y(n.a)}L${x(n.age)},${y(n.b)}L${x(r.age)},${y(r.b)}Z`, ahead };
  });

  return (
    <div ref={wrapRef} className="min-w-0">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`Cumulative money for two students from 18 to 40. ${cross ? `Student A catches up at age ${cross.toFixed(1)}.` : "Student A does not catch up by 40."}`}>
        <defs>
          <clipPath id="ts-clip">
            <motion.rect x={M.l - 2} y={0} height={H} style={{ width: clipW }} />
          </clipPath>
        </defs>
        {ticks(lo * 1.1, hi, W < 520 ? 4 : 5).map((t) => (
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
        <g clipPath="url(#ts-clip)">
          {quads.map((q, i) => (
            <motion.path key={i} initial={false} animate={{ d: q.d }} transition={tr} fill={q.ahead ? "var(--trace-a)" : "var(--trace-c)"} fillOpacity={0.1} />
          ))}
          <motion.path initial={false} animate={{ d: dB }} transition={tr} fill="none" stroke="var(--trace-c)" strokeWidth={2} strokeDasharray="6 4" />
          <motion.path initial={false} animate={{ d: dA }} transition={tr} fill="none" stroke="var(--trace-a)" strokeWidth={2.5} strokeLinejoin="round" />
        </g>
        <AnimatePresence>
          {cross != null && (
            <motion.g key="cross" style={{ opacity: crossShown }}>
              <motion.g initial={false} animate={{ x: x(cross), y: y(valueAt(b, START, cross)) }} transition={tr}>
                <motion.g variants={markerSettle} initial="hidden" animate="visible" custom={0}>
                  <circle r={7} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
                  <circle r={2.5} fill="var(--ink)" />
                </motion.g>
                <g transform={`translate(${x(cross) > W - 170 ? -158 : 12}, -34)`}>
                  <rect width={146} height={24} rx={6} fill="var(--ink)" />
                  <text x={10} y={16} className="tabular fill-on-ink text-[11px] font-semibold">
                    Break-even ≈ age {cross.toFixed(1)}
                  </text>
                </g>
              </motion.g>
            </motion.g>
          )}
        </AnimatePresence>
        {(
          <>
            <motion.line style={{ x: headX }} x1={0} x2={0} y1={M.t} y2={H - M.b} stroke="var(--ink)" strokeOpacity={0.35} />
            <motion.circle style={{ x: headX, y: headBY }} r={5} fill="var(--trace-c)" stroke="var(--surface)" strokeWidth={2} />
            <motion.circle style={{ x: headX, y: headAY }} r={6} fill="var(--trace-a)" stroke="var(--surface)" strokeWidth={2} />
          </>
        )}
      </svg>
    </div>
  );
}

function AgeRail({ age, onPick, cross }: { age: number; onPick: (a: number) => void; cross: number | null }) {
  return (
    <ol className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible" aria-label="Jump to an age">
      {STOPS.map((s) => {
        const on = age >= s && (STOPS[STOPS.indexOf(s) + 1] == null || age < STOPS[STOPS.indexOf(s) + 1]);
        return (
          <li key={s}>
            <button
              type="button"
              onClick={() => onPick(s)}
              aria-current={on ? "step" : undefined}
              className={cn(
                "tabular h-9 min-w-11 shrink-0 rounded-full border px-3 text-small font-semibold transition-colors",
                on ? "border-ink bg-ink text-on-ink" : age > s ? "border-rule-strong bg-surface text-ink" : "border-rule bg-transparent text-muted hover:border-rule-strong hover:text-ink",
              )}
            >
              {s}
            </button>
          </li>
        );
      })}
      {cross != null && <li className="sr-only">Break-even at age {cross.toFixed(1)}</li>}
    </ol>
  );
}

function Key({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg width="22" height="8" aria-hidden>
        <line x1="1" x2="21" y1="4" y2="4" stroke={color} strokeWidth="2.5" strokeDasharray={dashed ? "5 3" : undefined} />
      </svg>
      {label}
    </span>
  );
}

function Stat({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-caption text-muted">{label}</dt>
      <dd className={strong ? "text-base font-semibold text-ink sm:text-h3" : "text-small font-semibold text-ink sm:text-base"}>
        <AnimatedNumber value={value} format={moneyCompact} />
      </dd>
    </div>
  );
}
