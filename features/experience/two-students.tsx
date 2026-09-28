"use client";

import { AnimatePresence, animate, motion, useInView, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber, useMeasuredWidth, useSteppedValue } from "@/components/motion";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { clamp, linear, linePath, ticks, valueAt } from "@/components/charts/scale";
import { crossingAge, opportunityCostOf, twoStudents } from "@/lib/calc";
import { markerSettle, scrubSpring, valueTween } from "@/lib/animations";
import { moneyCompact, pct } from "@/lib/format";
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
 * WHAT YOU GIVE UP. Two paths from 18: college, or work right away. When the
 * chart comes into view it plays from 18 to 40 once; tap an age to jump.
 * The gap is what college costs you beyond tuition (opportunity cost); the
 * crossing is break-even. Assumptions sit behind "Adjust assumptions".
 */
export function TwoStudents(defaults: TwoStudentsProps & { debt?: number; pathLabel?: string }) {
  const reduce = useReducedMotion();
  const [cost, setCost] = useState(defaults.costPerYear);
  const [salary, setSalary] = useState(defaults.graduateSalary);
  const [growth, setGrowth] = useState(defaults.graduateGrowth);
  const [wage, setWage] = useState(defaults.workerSalary);
  const [debt, setDebt] = useState(defaults.debt ?? 0);
  const [open, setOpen] = useState(false);

  const inputs = { ...defaults, costPerYear: cost, graduateSalary: salary, graduateGrowth: growth, workerSalary: wage, debt: Math.min(debt, cost * defaults.yearsInCollege), horizonAge: END };
  const rows = twoStudents(inputs);
  const cross = crossingAge(rows);
  const oc = opportunityCostOf(inputs);

  // Play 18 → 40 once when the chart scrolls into view.
  const viewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(viewRef, { once: true, margin: "0px 0px -25% 0px" });
  const target = useMotionValue(reduce ? END : START);
  const age = useSpring(target, scrubSpring);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      target.jump(END);
      age.jump(END);
      return;
    }
    const c = animate(target, END, { duration: 3.2, ease: "linear" });
    return () => c.stop();
  }, [inView, reduce, target, age]);
  const stepped = useSteppedValue(age, 1);
  const shownAge = clamp(stepped, START, END);
  const row = rows[shownAge - START];
  const gap = row.a - row.b;
  const pick = (a: number) => {
    if (reduce) age.jump(a);
    target.set(a);
  };

  return (
    <div ref={viewRef} className="grid gap-5">
      <div className="grid min-w-0 content-start gap-3 rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-caption text-ink-2">
            <Key color="var(--trace-a)" label={defaults.pathLabel ? `College (${defaults.pathLabel})` : "College"} />
            <Key color="var(--trace-c)" dashed label="Work immediately" />
          </div>
          <div className="flex items-center gap-2">
            <SampleChip />
            <SourceFootnote metric="Two-paths teaching model" lineage={defaults.lineage} n={1} />
          </div>
        </div>
        <Chart rows={rows} age={age} cross={cross} reduce={reduce} />
        <dl className="grid grid-cols-3 gap-3 border-t border-rule pt-3" aria-live="polite">
          <Stat label={`College path at ${shownAge}`} value={row.a} />
          <Stat label={`Working path at ${shownAge}`} value={row.b} />
          <Stat label={gap < 0 ? "College is behind by" : "College is ahead by"} value={Math.abs(gap)} strong />
        </dl>
        <AgeRail age={shownAge} onPick={pick} cross={cross} />
      </div>

      <p className="max-w-[48rem] text-small text-ink-2">
        While in school, you&apos;d give up about <strong className="font-semibold text-ink">{moneyCompact(oc.foregoneEarnings)}</strong> in wages on top of <strong className="font-semibold text-ink">{moneyCompact(oc.directCost)}</strong> in costs.{" "}
        {cross ? <>College catches up at about age <strong className="font-semibold text-ink">{cross.toFixed(1)}</strong>.</> : "With these numbers, college doesn't catch up by 40."}{" "}
        <span className="text-muted">Economists call this opportunity cost.</span>
      </p>

      <div className="rounded-md border border-rule bg-surface">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="give-up-assumptions" className="flex w-full items-center justify-between gap-3 p-4 text-left">
          <span className="text-small font-bold text-ink">Adjust assumptions</span>
          <ChevronDown className={cn("size-5 text-ink-2 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        {open && (
          <div id="give-up-assumptions" className="grid gap-4 border-t border-rule p-4 md:grid-cols-2">
            <GraduatedSlider size="sm" label="College cost per year" value={cost} onChange={setCost} min={0} max={80000} step={1000} format={moneyCompact} trace="a" />
            <GraduatedSlider size="sm" label="Starting salary after college" value={salary} onChange={setSalary} min={30000} max={120000} step={1000} format={moneyCompact} trace="a" />
            <GraduatedSlider size="sm" label="Pay if you work right away" value={wage} onChange={setWage} min={20000} max={60000} step={1000} format={moneyCompact} trace="ink" />
            <GraduatedSlider size="sm" label="Yearly raise after college" value={growth} onChange={setGrowth} min={0} max={0.07} step={0.0025} format={(v) => pct(v * 100, 1)} trace="a" />
            <GraduatedSlider size="sm" label="Student debt (repaid over 10 years)" value={Math.min(debt, cost * defaults.yearsInCollege)} onChange={setDebt} min={0} max={Math.max(1000, cost * defaults.yearsInCollege)} step={1000} format={moneyCompact} trace="a" />
            <p className="self-end text-caption text-muted">Teaching model: before taxes; loans at 6.53% over 10 years; the working path gets a {pct(defaults.workerGrowth * 100, 1)} raise each year.</p>
          </div>
        )}
      </div>
    </div>
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
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`Total money earned minus costs from 18 to 40, college vs. working right away. ${cross ? `College catches up at age ${cross.toFixed(1)}.` : "College does not catch up by 40."}`}>
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
