"use client";

import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform, type AnimationPlaybackControls, type MotionValue } from "framer-motion";
import { Pause, Play, RotateCcw } from "@/components/ui/icons";
import { Slider } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber, useMeasuredWidth, useSteppedValue } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { SampleChip } from "@/components/ui/lineage";
import { DataKindChip } from "@/components/ui/data-kind";
import { breakEvenYears } from "@/features/scenario/facts";
import { clamp, linear, linePath, ticks, valueAt } from "@/components/charts/scale";
import { snapshotAt } from "@/lib/calc";
import { DUR, EASE, scrubSpring } from "@/lib/animations";
import { moneyCompact } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { HORIZON, PATH_DASH, PATH_VAR, pathNo, useScenario, type Future } from "@/features/scenario/store";

const START = 18;
/** Play runs 18 → 40 in ten seconds. */
const PLAY_SECONDS = 10;

/**
 * BREAK-EVEN EXPLORER. Paths 01 and 02 against working from 18. Scrub the
 * age or press play; every figure reads the model at that moment, and each
 * break-even marker lands when the timeline reaches it.
 */
export function BreakEvenExplorer() {
  const { futures, baseline, baselineSeries, shown: count } = useScenario();
  const pair = futures.filter((f) => f.index < Math.min(2, count));
  const mine = pair[0];
  const beYears = breakEvenYears(mine);
  const gradIdx = Math.max(0, Math.round(mine.result.graduationAge) - START);
  const headStart = Math.max(0, (baselineSeries[gradIdx] ?? 0) - (mine.series[gradIdx] ?? 0));
  const reduce = useReducedMotion();
  const target = useMotionValue(22);
  const age = useSpring(target, scrubSpring);
  const shown = clamp(useSteppedValue(age, 0.1), START, HORIZON);
  const [playing, setPlaying] = useState(false);
  const ctl = useRef<AnimationPlaybackControls | null>(null);

  const stop = () => {
    ctl.current?.stop();
    setPlaying(false);
  };
  const play = () => {
    if (playing) return stop();
    const from = target.get() >= HORIZON - 0.1 ? START : target.get();
    target.jump(from);
    age.jump(from);
    setPlaying(true);
    ctl.current = animate(target, HORIZON, { duration: reduce ? 0 : ((HORIZON - from) / (HORIZON - START)) * PLAY_SECONDS, ease: "linear", onComplete: () => setPlaying(false) });
  };
  useEffect(() => () => ctl.current?.stop(), []);

  return (
    <div className="grid gap-6">
      <div className="grid gap-2" aria-live="polite">
        <p className="text-small font-semibold text-ink-2">Estimated break-even for {mine.ctx.college.shortName} {mine.ctx.major.name}</p>
        <p className="text-[clamp(2.25rem,5.5vw,4.25rem)] font-semibold leading-none tracking-[-0.045em] text-ink">{beYears == null ? "Not by age 40" : `${beYears.toFixed(1)} years after graduation`}</p>
        <p className="max-w-[48rem] text-small text-ink-2">
          By graduation, someone who started working at 18 is about <strong className="font-semibold text-ink">{moneyCompact(headStart)}</strong> ahead of you, counting their pay and your costs.{" "}
          {beYears == null ? "With these numbers, your higher pay doesn't close that gap by age 40." : `Your higher pay closes that gap about ${beYears.toFixed(1)} years after graduation.`}{" "}
          <span className="text-muted">Economists call the part you give up opportunity cost.</span>
        </p>
        <p className="flex items-center gap-2 text-caption text-muted">
          <DataKindChip kind="projected" /> After taxes and loan payments, in 2024 dollars.
        </p>
      </div>
      <div className="grid gap-6 panel p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-caption text-ink-2">
            {pair.map((f) => (
              <span key={f.index} className="flex items-center gap-2">
                <svg width="24" height="8" aria-hidden>
                  <line x1="1" x2="23" y1="4" y2="4" stroke={PATH_VAR[f.index]} strokeWidth="3" strokeDasharray={PATH_DASH[f.index]} />
                </svg>
                <span className="font-bold tracking-[0.08em]">{f.index === 0 ? "YOUR PATH" : `PATH ${pathNo(f.index)}`}</span> {f.label}
              </span>
            ))}
            <span className="flex items-center gap-2">
              <svg width="24" height="8" aria-hidden>
                <line x1="1" x2="23" y1="4" y2="4" stroke="var(--trace-c)" strokeWidth="2" strokeDasharray="6 4" />
              </svg>
              Work from 18
            </span>
          </div>
          <SampleChip />
        </div>

        <Chart pair={pair} base={baselineSeries} age={age} />

        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex gap-2">
            <Button onClick={play} aria-pressed={playing} className="gap-2">
              {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              {playing ? "Pause" : "Play my future"}
            </Button>
            <Button variant="quiet" onClick={() => { stop(); target.set(START); }} aria-label="Back to 18">
              <RotateCcw className="size-4" aria-hidden />
            </Button>
          </div>
          <Scrubber value={shown} onChange={(v) => { stop(); target.set(v); }} />
        </div>
      </div>

      <div className={cn("grid gap-4", pair.length > 1 && "md:grid-cols-2")}>
        {pair.map((f) => (
          <Readouts key={f.index} f={f} age={shown} baseline={baseline} />
        ))}
      </div>
    </div>
  );
}

function Scrubber({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pos = (a: number) => `${((a - START) / (HORIZON - START)) * 100}%`;
  return (
    <div className="grid gap-1" data-cursor="SCRUB">
      <Slider.Root value={[value]} min={START} max={HORIZON} step={0.1} onValueChange={([v]) => onChange(v)} className="relative flex h-10 touch-none select-none items-center" aria-label="Age">
        <Slider.Track className="relative h-1.5 grow rounded-full bg-surface-sunk">
          <Slider.Range className="absolute h-full rounded-full bg-accent" />
        </Slider.Track>
        <Slider.Thumb aria-label="Age" aria-valuetext={`Age ${value.toFixed(1)}`} className="relative block size-7 cursor-grab rounded-full border-[3px] border-surface bg-accent shadow-3 transition-transform hover:scale-105 active:scale-95 active:cursor-grabbing">
          <span className="tabular absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xs bg-ink px-2 py-0.5 text-caption font-bold text-on-ink">{Math.floor(value)}</span>
        </Slider.Thumb>
      </Slider.Root>
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

function Chart({ pair, base, age }: { pair: Future[]; base: number[]; age: MotionValue<number> }) {
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(900);
  const H = W < 560 ? 260 : 380;
  const M = { t: 24, r: 16, b: 28, l: W < 560 ? 46 : 60 };
  const all = [...pair.flatMap((f) => f.series), ...base];
  const lo = Math.min(0, ...all) * 1.2;
  const hi = Math.max(...all) * 1.06;
  const x = linear([START, HORIZON], [M.l, W - M.r]);
  const y = linear([lo, hi], [H - M.b, M.t]);
  const clipW = useTransform(age, (a) => Math.max(0, x(clamp(a, START, HORIZON)) - M.l + 2));
  const headX = useTransform(age, (a) => x(clamp(a, START, HORIZON)));
  const d = (s: number[]) => linePath(s.map((v, i) => [x(START + i), y(v)]));
  return (
    <div ref={ref} className="min-w-0" data-cursor="SCRUB">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`Total money earned minus costs, by age. ${pair.map((f) => `${f.label}: ${f.breakEven ? `break-even at ${f.breakEven.toFixed(1)}` : "no break-even by 40"}`).join(". ")}.`}>
        <defs>
          <clipPath id="be-clip">
            <motion.rect x={M.l - 2} y={0} height={H} style={{ width: clipW }} />
          </clipPath>
        </defs>
        {ticks(lo, hi, W < 560 ? 4 : 5).map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--rule-strong)" : "var(--rule)"} />
            <text x={M.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">
              {moneyCompact(t)}
            </text>
          </g>
        ))}
        <rect x={x(18)} y={M.t} width={x(22) - x(18)} height={H - M.t - M.b} fill="var(--ink)" fillOpacity={0.035} />
        {/* faint future, inked past */}
        <path d={d(base)} fill="none" stroke="var(--trace-c)" strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="6 4" />
        {pair.map((f) => (
          <motion.path key={`g${f.index}`} initial={false} animate={{ d: d(f.series) }} transition={{ duration: 0.6, ease: EASE.smooth }} fill="none" stroke={PATH_VAR[f.index]} strokeOpacity={0.2} strokeWidth={2} />
        ))}
        <g clipPath="url(#be-clip)">
          <path d={d(base)} fill="none" stroke="var(--trace-c)" strokeWidth={2} strokeDasharray="6 4" />
          {pair.map((f) => (
            <motion.path key={`p${f.index}`} initial={false} animate={{ d: d(f.series) }} transition={{ duration: 0.6, ease: EASE.smooth }} fill="none" stroke={PATH_VAR[f.index]} strokeWidth={3} strokeLinejoin="round" strokeDasharray={PATH_DASH[f.index]} />
          ))}
        </g>
        {pair.map((f, i) => f.breakEven && <BreakEvenMarker key={`be${f.index}`} f={f} i={i} age={age} x={x(f.breakEven)} y={y(valueAt(base, START, f.breakEven))} W={W} />)}
        <motion.line style={{ x: headX }} x1={0} x2={0} y1={M.t} y2={H - M.b} stroke="var(--ink)" strokeOpacity={0.45} />
        <HeadDot age={age} series={base} x={x} y={y} color="var(--trace-c)" r={4.5} />
        {pair.map((f) => (
          <HeadDot key={`h${f.index}`} age={age} series={f.series} x={x} y={y} color={PATH_VAR[f.index]} r={6} />
        ))}
        {[18, 22, 26, 30, 35, 40].map((t) => (
          <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="tabular fill-muted text-[11px]">
            {t}
          </text>
        ))}
      </svg>
    </div>
  );
}

function HeadDot({ age, series, x, y, color, r }: { age: MotionValue<number>; series: number[]; x: (v: number) => number; y: (v: number) => number; color: string; r: number }) {
  const cx = useTransform(age, (a) => x(clamp(a, START, HORIZON)));
  const cy = useTransform(age, (a) => y(valueAt(series, START, clamp(a, START, HORIZON))));
  return <motion.circle style={{ x: cx, y: cy }} r={r} fill={color} stroke="var(--surface)" strokeWidth={2} />;
}

/** Lands when the timeline reaches it: one ring pulse, then the label. No confetti. */
function BreakEvenMarker({ f, i, age, x, y, W }: { f: Future; i: number; age: MotionValue<number>; x: number; y: number; W: number }) {
  const reached = useSteppedValue(useTransform(age, (a): number => (a >= (f.breakEven ?? 99) ? 1 : 0)), 1) === 1;
  const left = x > W - 190;
  return (
    <g transform={`translate(${x},${y})`}>
      <AnimatePresence>
        {reached && (
          <motion.g key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: DUR.fast } }}>
            <motion.circle r={10} fill="none" stroke={PATH_VAR[f.index]} strokeWidth={2} initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 3.2, opacity: 0 }} transition={{ duration: 0.9, ease: EASE.smooth }} />
            <motion.g initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ duration: 0.5, ease: EASE.spring }}>
              <circle r={9} fill="var(--surface)" stroke={PATH_VAR[f.index]} strokeWidth={3} />
              <circle r={3.5} fill="var(--ink)" />
            </motion.g>
            <motion.g initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: DUR.standard, ease: EASE.smooth }} transform={`translate(${left ? -170 : 14}, ${i === 0 ? -64 : 18})`}>
              <rect width={156} height={44} rx={10} fill="var(--ink)" />
              <text x={12} y={18} className="fill-on-ink text-[10px] font-mono font-medium uppercase tracking-[0.08em]">
                BREAK-EVEN · {f.index === 0 ? "YOUR PATH" : `PATH ${pathNo(f.index)}`}
              </text>
              <text x={12} y={35} className="tabular fill-on-ink text-[14px] font-semibold">
                AGE {f.breakEven!.toFixed(1)}
              </text>
            </motion.g>
          </motion.g>
        )}
      </AnimatePresence>
      {!reached && <circle r={4} fill="none" stroke={PATH_VAR[f.index]} strokeOpacity={0.5} strokeDasharray="2 2" />}
    </g>
  );
}

/** At the scrubbed age: how far ahead of (or behind) working from 18, plus pay and debt left. */
function Readouts({ f, age, baseline }: { f: Future; age: number; baseline: Parameters<typeof snapshotAt>[1] }) {
  const s = snapshotAt(f.result, baseline, age);
  const gap = s.netPosition - s.baselinePosition;
  const ahead = gap >= 0;
  return (
    <div className="grid gap-4 panel p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-caption font-mono font-medium uppercase tracking-[0.08em] text-ink">
          <span className="size-2 shrink-0 rounded-full" style={{ background: PATH_VAR[f.index] }} />
          {f.index === 0 ? "YOUR PATH" : `PATH ${pathNo(f.index)}`} <span className="truncate font-medium tracking-normal text-muted">{f.label}</span>
        </p>
        <span className="tabular shrink-0 text-caption font-semibold text-ink-2">At age {Math.floor(age)}</span>
      </div>
      <div className="grid gap-1">
        <p className="text-caption text-muted">Compared with working from 18</p>
        <p className={cn("tabular text-h2 font-semibold tracking-[-0.03em]", ahead ? "text-gain" : "text-ink")}>
          {ahead ? "Ahead by " : "Behind by "}
          <AnimatedNumber value={Math.abs(gap)} format={moneyCompact} />
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 border-t border-rule pt-3">
        <div className="grid gap-0.5">
          <dt className="text-caption text-muted">Yearly pay</dt>
          <dd className="tabular text-base font-bold text-ink">{s.salary > 0 ? <AnimatedNumber value={s.salary} format={moneyCompact} /> : "In school"}</dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-caption text-muted">Loan left to repay</dt>
          <dd className="tabular text-base font-bold text-ink">
            <AnimatedNumber value={s.remainingDebt} format={moneyCompact} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
