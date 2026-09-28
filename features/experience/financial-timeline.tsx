"use client";

import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform, type AnimationPlaybackControls, type MotionValue } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { Slider } from "radix-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber, useMeasuredWidth, useSteppedValue } from "@/components/motion";
import { SampleChip } from "@/components/ui/lineage";
import { Button } from "@/components/ui/button";
import { areaPath, clamp, linear, linePath, ticks, valueAt } from "@/components/charts/scale";
import { calculateBreakEvenYear, cumulativeSeries, debtAt, milestonesFor, projectNoCollege, projectPath, snapshotAt, type Milestone } from "@/lib/calc";
import { ledgerItem, scrubSpring } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { PathPicker } from "./path-picker";
import type { PathPreset } from "./data";

const START = 18;
const END = 40;
const INK: Record<string, string> = { a: "var(--trace-a)", b: "var(--trace-b)", d: "var(--trace-d)" };

/**
 * The flagship: one path laid out from 18 to 40. Scrub the age (or press
 * play) and every metric and chart reads the model at that moment.
 */
export function FinancialTimeline({ presets }: { presets: PathPreset[] }) {
  const reduce = useReducedMotion();
  const [key, setKey] = useState<PathPreset["key"]>("a");
  const preset = presets.find((p) => p.key === key)!;
  const { result, baseline, milestones, net, base, be } = useMemo(() => {
    const result = projectPath(preset.inputs, preset.ctx, { horizonAge: END });
    const baseline = projectNoCollege({ horizonAge: END, stateRate: preset.ctx.careerCity?.stateTaxRate });
    return {
      result,
      baseline,
      milestones: milestonesFor(result, baseline, END),
      net: cumulativeSeries(result.rows, END),
      base: cumulativeSeries(baseline, END),
      be: calculateBreakEvenYear(result.rows, baseline, result.graduationAge),
    };
  }, [preset]);

  const target = useMotionValue(22);
  const age = useSpring(target, scrubSpring);
  const shown = clamp(useSteppedValue(age, 0.1), START, END);
  const snap = snapshotAt(result, baseline, shown);
  const active = [...milestones].reverse().find((m) => m.age <= shown + 0.05) ?? milestones[0];

  const [playing, setPlaying] = useState(false);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const stop = () => {
    controls.current?.stop();
    setPlaying(false);
  };
  const play = () => {
    if (playing) return stop();
    const from = target.get() >= END - 0.1 ? START : target.get();
    target.jump(from);
    age.jump(from);
    setPlaying(true);
    controls.current = animate(target, END, { duration: reduce ? 0 : (END - from) * 0.28, ease: "linear", onComplete: () => setPlaying(false) });
  };
  useEffect(() => () => controls.current?.stop(), []);
  const jump = (a: number) => {
    stop();
    target.set(a);
  };

  const color = INK[key];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PathPicker presets={presets} value={key} onChange={(k) => { stop(); setKey(k); }} label="Timeline path" />
        <SampleChip />
      </div>

      <div className="grid gap-6 rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6">
        {/* the rail */}
        <div className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={active.label + active.age} variants={ledgerItem} initial="hidden" animate="visible" exit="exit" className="grid gap-0.5">
                <p className="text-caption font-medium text-muted">Age {formatAge(active.age)}</p>
                <p className="text-h3 font-[650] text-ink">{active.label}</p>
                <p className="text-small text-ink-2">{active.detail}</p>
              </motion.div>
            </AnimatePresence>
            <Button variant="secondary" onClick={play} aria-pressed={playing} className="gap-2">
              {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              {playing ? "Pause" : "Play 18 → 40"}
            </Button>
          </div>
          <Rail milestones={milestones} age={age} shown={shown} onScrub={(v) => { stop(); target.set(v); }} onJump={jump} color={color} />
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-rule py-4 lg:grid-cols-4">
          <Metric label="Salary this year" value={snap.salary} note={snap.phase === "college" ? "In college" : "Before tax"} />
          <Metric label="Debt remaining" value={snap.remainingDebt} note={result.loan.principal > 0 ? `${moneyCompact(result.loan.monthlyPayment)}/mo for 10 years` : "No loans"} />
          <Metric label="Earned since graduating" value={snap.cumulativeEarnings} note="Expected, before tax" />
          <Metric label="Net financial position" value={snap.netPosition} note={`No-college path: ${moneyCompact(snap.baselinePosition)}`} strong />
        </dl>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <p className="mb-2 text-small font-semibold text-ink">Net position vs. working from 18</p>
            <NetChart net={net} base={base} age={age} color={color} be={be?.age ?? null} />
          </div>
          <div className="grid min-w-0 gap-6 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            <div className="min-w-0">
              <p className="mb-2 text-small font-semibold text-ink">Debt balance</p>
              <DebtChart balanceAt={(a) => debtAt(result, a)} age={age} />
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-small font-semibold text-ink">Salary by year</p>
              <SalaryBars rows={result.rows} employment={result.employmentRate} shown={shown} color={color} />
            </div>
          </div>
        </div>
        <p className="text-caption text-muted">
          {preset.label}: {preset.inputs.residency === "resident" ? "in-state" : "out-of-state"}, on campus, {money(preset.inputs.funding.aidPerYear)} a year in grants, {money(preset.inputs.funding.familyPerYear)} from family. The rest is borrowed at the federal rate. 2024 dollars.
        </p>
      </div>
    </div>
  );
}

const formatAge = (a: number) => (Number.isInteger(a) ? `${a}` : a.toFixed(1));

function Metric({ label, value, note, strong }: { label: string; value: number; note: string; strong?: boolean }) {
  return (
    <div className="grid content-start gap-0.5">
      <dt className="text-caption text-muted">{label}</dt>
      <dd className={cn("font-semibold tracking-[-0.01em] text-ink", strong ? "text-h2" : "text-h3")}>
        <AnimatedNumber value={value} format={money} />
      </dd>
      <dd className="text-caption text-muted">{note}</dd>
    </div>
  );
}

function Rail({ milestones, age, shown, onScrub, onJump, color }: { milestones: Milestone[]; age: MotionValue<number>; shown: number; onScrub: (v: number) => void; onJump: (a: number) => void; color: string }) {
  const pos = (a: number) => `${((a - START) / (END - START)) * 100}%`;
  const fill = useTransform(age, (a) => `${((clamp(a, START, END) - START) / (END - START)) * 100}%`);
  return (
    <div className="grid gap-1 pt-2">
      <div className="relative h-12">
        {/* ticks */}
        <div aria-hidden className="absolute inset-x-0 top-5 h-2" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--rule-strong) 0 1px, transparent 1px calc(100% / 22))" }} />
        <div aria-hidden className="absolute inset-x-0 top-[26px] h-1 rounded-full bg-surface-sunk" />
        <motion.div aria-hidden className="absolute left-0 top-[26px] h-1 rounded-full" style={{ width: fill, background: color }} />
        {milestones.map((m) => (
          <button
            key={m.label + m.age}
            type="button"
            onClick={() => onJump(m.age)}
            className="group absolute top-[22px] z-10 grid -translate-x-1/2 justify-items-center"
            style={{ left: pos(m.age) }}
            aria-label={`Jump to age ${formatAge(m.age)}: ${m.label}`}
          >
            <span className={cn("block size-3 rounded-full border-2 transition-colors", shown >= m.age ? "border-ink bg-ink" : "border-rule-strong bg-surface group-hover:border-ink")} />
          </button>
        ))}
        <Slider.Root value={[shown]} min={START} max={END} step={0.1} onValueChange={([v]) => onScrub(v)} className="absolute inset-x-0 top-[14px] flex h-6 touch-none select-none items-center" aria-label="Age">
          <Slider.Track className="relative h-6 grow" />
          <Slider.Thumb aria-valuetext={`Age ${shown.toFixed(1)}`} className="relative block size-7 cursor-grab rounded-full border-[3px] border-surface shadow-3 transition-transform hover:scale-105 active:scale-95 active:cursor-grabbing" style={{ background: color }}>
            <span className="tabular absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xs bg-ink px-2 py-0.5 text-caption font-semibold text-on-ink">{Math.floor(shown)}</span>
          </Slider.Thumb>
        </Slider.Root>
      </div>
      <div aria-hidden className="relative h-4 text-caption text-muted">
        {[18, 22, 26, 30, 35, 40].map((a) => (
          <span key={a} className="tabular absolute -translate-x-1/2" style={{ left: pos(a) }}>
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}

function NetChart({ net, base, age, color, be }: { net: number[]; base: number[]; age: MotionValue<number>; color: string; be: number | null }) {
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(640);
  const H = W < 480 ? 200 : 260;
  const M = { t: 10, r: 10, b: 24, l: 52 };
  const lo = Math.min(0, ...net, ...base);
  const hi = Math.max(...net, ...base);
  const x = linear([START, END], [M.l, W - M.r]);
  const y = linear([lo * 1.1, hi * 1.05], [H - M.b, M.t]);
  const pts = (s: number[]) => s.map((v, i) => [x(START + i), y(v)] as [number, number]);
  const cx = useTransform(age, (a) => x(clamp(a, START, END)));
  const cy = useTransform(age, (a) => y(valueAt(net, START, clamp(a, START, END))));
  const by = useTransform(age, (a) => y(valueAt(base, START, clamp(a, START, END))));
  const clipW = useTransform(age, (a) => Math.max(0, x(clamp(a, START, END)) - M.l));
  return (
    <div ref={ref} className="min-w-0">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`Net financial position by age for this path compared with working from 18.${be ? ` Break-even at ${be.toFixed(1)}.` : ""}`}>
        <defs>
          <clipPath id="tl-clip">
            <motion.rect x={M.l} y={0} height={H} style={{ width: clipW }} />
          </clipPath>
        </defs>
        {ticks(lo * 1.1, hi, 4).map((t) => (
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
        <g clipPath="url(#tl-clip)">
          <motion.path initial={false} animate={{ d: areaPath(pts(net), y(0)) }} transition={{ duration: 0.4 }} fill={color} fillOpacity={0.08} />
        </g>
        <path d={linePath(pts(base))} fill="none" stroke="var(--trace-c)" strokeWidth={1.75} strokeDasharray="6 4" />
        <motion.path initial={false} animate={{ d: linePath(pts(net)) }} transition={{ duration: 0.4 }} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        {be != null && (
          <g transform={`translate(${x(be)},${y(valueAt(base, START, be))})`}>
            <circle r={5.5} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.75} />
            <circle r={2} fill="var(--ink)" />
          </g>
        )}
        <motion.line style={{ x: cx }} x1={0} x2={0} y1={M.t} y2={H - M.b} stroke="var(--ink)" strokeOpacity={0.4} />
        <motion.circle style={{ x: cx, y: by }} r={4.5} fill="var(--trace-c)" stroke="var(--surface)" strokeWidth={2} />
        <motion.circle style={{ x: cx, y: cy }} r={6} fill={color} stroke="var(--surface)" strokeWidth={2} />
      </svg>
      <p className="mt-1 flex flex-wrap gap-x-4 text-caption text-ink-2">
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4" style={{ background: color }} aria-hidden />This path</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-dashed border-trace-c" aria-hidden />C: working from 18</span>
        {be != null && <span>Break-even ≈ {be.toFixed(1)}</span>}
      </p>
    </div>
  );
}

function DebtChart({ balanceAt, age }: { balanceAt: (a: number) => number; age: MotionValue<number> }) {
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(360);
  const H = 110;
  const M = { t: 8, r: 8, b: 20, l: 44 };
  const samples = Array.from({ length: (END - START) * 4 + 1 }, (_, i) => START + i / 4);
  const vals = samples.map(balanceAt);
  const hi = Math.max(1, ...vals);
  const x = linear([START, END], [M.l, W - M.r]);
  const y = linear([0, hi * 1.1], [H - M.b, M.t]);
  const pts = samples.map((a, i) => [x(a), y(vals[i])] as [number, number]);
  const cx = useTransform(age, (a) => x(clamp(a, START, END)));
  const cy = useTransform(age, (a) => y(balanceAt(clamp(a, START, END))));
  return (
    <div ref={ref} className="min-w-0">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`Loan balance by age, peaking at ${money(hi)}.`}>
        <line x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} stroke="var(--rule-strong)" />
        <text x={M.l - 6} y={y(hi)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">
          {moneyCompact(hi)}
        </text>
        <text x={M.l - 6} y={y(0)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">
          $0
        </text>
        <motion.path initial={false} animate={{ d: areaPath(pts, y(0)) }} transition={{ duration: 0.4 }} fill="var(--ink)" fillOpacity={0.12} />
        <motion.path initial={false} animate={{ d: linePath(pts) }} transition={{ duration: 0.4 }} fill="none" stroke="var(--ink)" strokeWidth={1.75} />
        <motion.line style={{ x: cx }} x1={0} x2={0} y1={M.t} y2={H - M.b} stroke="var(--ink)" strokeOpacity={0.3} />
        <motion.circle style={{ x: cx, y: cy }} r={4.5} fill="var(--ink)" stroke="var(--surface)" strokeWidth={2} />
        {[18, 29, 40].map((t) => (
          <text key={t} x={x(t)} y={H - 4} textAnchor="middle" className="tabular fill-muted text-[11px]">
            {t}
          </text>
        ))}
      </svg>
    </div>
  );
}

function SalaryBars({ rows, employment, shown, color }: { rows: Array<{ age: number; phase: string; earnings: number }>; employment: number; shown: number; color: string }) {
  const career = rows.filter((r) => r.phase === "career" && r.age < END);
  const max = Math.max(1, ...career.map((r) => r.earnings / employment));
  return (
    <div className="flex h-[110px] items-end gap-[2px]" role="img" aria-label={`Salary grows from ${money((career[0]?.earnings ?? 0) / employment)} to ${money((career.at(-1)?.earnings ?? 0) / employment)} by 40.`}>
      {rows.filter((r) => r.age < END).map((r) => {
        const s = r.phase === "career" ? r.earnings / employment : 0;
        const on = Math.floor(shown) === r.age;
        return (
          <motion.span
            key={r.age}
            className="block flex-1 rounded-t-[3px]"
            initial={false}
            animate={{ height: `${Math.max(2, (s / max) * 100)}%`, opacity: r.age <= shown ? 1 : 0.35 }}
            transition={{ duration: 0.3 }}
            style={{ background: on ? color : r.phase === "career" ? "color-mix(in srgb, var(--ink) 55%, var(--surface))" : "var(--rule)" }}
          />
        );
      })}
    </div>
  );
}
