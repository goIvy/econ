"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, RotateCcw } from "@/components/ui/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber, useMeasuredWidth } from "@/components/motion";
import { Concept } from "@/components/concepts/concept";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { SampleChip } from "@/components/ui/lineage";
import { linear, linePath, ticks } from "@/components/charts/scale";
import {
  adjustForInflation,
  calculateBreakEvenYear,
  compoundSeries,
  cumulativeSeries,
  deferredBalance,
  drawSalary,
  equivalentSalary,
  meanAndMedian,
  opportunityCostOf,
  projectPath,
  rng,
} from "@/lib/calc";
import { crossfade, enterSpring, growWidth, ledgerItem, valueTween } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import type { LessonData } from "./data";

// ------------------------------------------------------------------ framework

/**
 * A scroll-told lesson: step text scrolls past a sticky visual, and the
 * visual changes with the active step. Each visual is also a working tool.
 */
function Lesson({ slug, n, title, steps, visual }: { slug: string; n: number; title: string; steps: React.ReactNode[]; visual: (step: number) => React.ReactNode }) {
  const [step, setStep] = useState(0);
  const refs = useRef<Array<HTMLDivElement | null>>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <section id={slug} aria-labelledby={`${slug}-h`} className="relative scroll-mt-[calc(var(--nav-h)+16px)] border-t border-rule py-14 md:py-20">
      <div className="grid gap-2">
        <p className="tabular text-caption font-semibold text-muted">Lesson {n} of 5</p>
        <h2 id={`${slug}-h`} className="max-w-[28ch] text-h2 font-bold">
          {title}
        </h2>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-12">
        <div className="sticky top-[calc(var(--nav-h)+8px)] z-10 self-start panel p-4 sm:p-5 lg:order-2 lg:col-span-7 lg:top-[calc(var(--nav-h)+32px)]">{visual(step)}</div>
        <div className="grid gap-4 lg:order-1 lg:col-span-5">
          {steps.map((s, i) => (
            <div
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-step={i}
              className="grid min-h-[48svh] content-center lg:min-h-[62svh]"
            >
              {/* Inactive steps recede by color, not opacity, so they keep AA contrast. */}
              <div className={cn("grid gap-3 text-base transition-colors duration-300 lg:text-lede", step === i ? "text-ink-2" : "text-muted")}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Chart({ children, height, label }: { children: (w: number, h: number) => React.ReactNode; height: [number, number]; label: string }) {
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(620);
  const H = W < 480 ? height[0] : height[1];
  return (
    <div ref={ref} className="min-w-0">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={label}>
        {children(W, H)}
      </svg>
    </div>
  );
}

function YAxis({ lo, hi, x0, x1, y, count = 4 }: { lo: number; hi: number; x0: number; x1: number; y: (v: number) => number; count?: number }) {
  return (
    <>
      {ticks(lo, hi, count).map((t) => (
        <g key={t}>
          <line x1={x0} x2={x1} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--rule-strong)" : "var(--rule)"} />
          <text x={x0 - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">
            {moneyCompact(t)}
          </text>
        </g>
      ))}
    </>
  );
}

// ------------------------------------------------------------------ 1. cheaper can win

export function CheaperCanWin({ cheap, pricey }: Pick<LessonData, "cheap" | "pricey">) {
  const [premium, setPremium] = useState(0);
  const reduce = useReducedMotion();
  const base = useMemo(() => {
    const a = projectPath(cheap.inputs, cheap.ctx, { horizonAge: 40 });
    const b0 = projectPath(pricey.inputs, pricey.ctx, { horizonAge: 40 });
    return { a, b0 };
  }, [cheap, pricey]);
  const b = projectPath(pricey.inputs, pricey.ctx, { horizonAge: 40, salaryOverride: base.b0.startingSalary * (1 + premium / 100) });
  const sa = cumulativeSeries(base.a.rows, 40);
  const sb = cumulativeSeries(b.rows, 40);
  const cross = calculateBreakEvenYear(b.rows, base.a.rows, b.graduationAge);
  const A = cheap.ctx.college.shortName;
  const B = pricey.ctx.college.shortName;

  const steps = [
    <>
      <p>
        Two students, two economics-type degrees. {A} costs <strong className="text-ink">{money(base.a.net.netPrice)}</strong> over four years after aid; {B} costs <strong className="text-ink">{money(base.b0.net.netPrice)}</strong>.
      </p>
    </>,
    <>
      <p>
        Starting salaries are close: <strong className="text-ink">{money(base.a.startingSalary)}</strong> for {A} {cheap.ctx.major.name.toLowerCase()} graduates and <strong className="text-ink">{money(base.b0.startingSalary)}</strong> for {B} {pricey.ctx.major.name.toLowerCase()}. A higher price doesn&apos;t guarantee higher pay.
      </p>
    </>,
    <>
      <p>
        Add it up year by year. The cheaper path starts ahead and, with these numbers, stays ahead. That head start is the{" "}
        <Concept id="opportunity-cost">opportunity cost</Concept> of the more expensive choice.
      </p>
      <p>How much more would {B} graduates need to earn to catch up by 40? Drag the premium.</p>
    </>,
  ];

  return (
    <Lesson
      slug="cheaper-can-win"
      n={1}
      title="Why does a cheaper college sometimes outperform an expensive one?"
      steps={steps}
      visual={(step) => (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-small font-semibold text-ink">{step === 0 ? "Net price, 4 years" : step === 1 ? "Starting salary" : "Total money earned minus costs"}</p>
            <SampleChip />
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {step < 2 ? (
              <motion.div key={`bars-${step}`} variants={crossfade} initial="hidden" animate="visible" exit="exit" className="grid gap-3 py-4">
                {[[A, step === 0 ? base.a.net.netPrice : base.a.startingSalary, "var(--trace-d)"], [B, step === 0 ? base.b0.net.netPrice : base.b0.startingSalary, "var(--trace-b)"]].map(([name, v, c]) => {
                  const max = step === 0 ? base.b0.net.netPrice : Math.max(base.a.startingSalary, base.b0.startingSalary);
                  return (
                    <div key={name as string} className="grid gap-1">
                      <span className="flex justify-between text-small">
                        <span className="text-ink-2">{name as string}</span>
                        <span className="tabular font-semibold text-ink">{money(v as number)}</span>
                      </span>
                      <span className="h-6 rounded-sm bg-surface-sunk">
                        <motion.span className="block h-full rounded-sm" style={{ background: c as string }} variants={growWidth} custom={`${((v as number) / max) * 100}%`} initial="hidden" animate="visible" />
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="lines" variants={crossfade} initial="hidden" animate="visible" exit="exit" className="grid gap-3">
                <Chart height={[200, 280]} label={`Total money earned minus costs: ${A} vs ${B}.`}>
                  {(W, H) => {
                    const M = { t: 10, r: 12, b: 22, l: 52 };
                    const all = [...sa, ...sb];
                    const lo = Math.min(0, ...all);
                    const hi = Math.max(...all);
                    const x = linear([18, 40], [M.l, W - M.r]);
                    const y = linear([lo * 1.1, hi * 1.05], [H - M.b, M.t]);
                    const d = (s: number[]) => linePath(s.map((v, i) => [x(18 + i), y(v)]));
                    return (
                      <>
                        <YAxis lo={lo * 1.1} hi={hi} x0={M.l} x1={W - M.r} y={y} />
                        <motion.path initial={false} animate={{ d: d(sa) }} transition={valueTween(reduce)} fill="none" stroke="var(--trace-d)" strokeWidth={2.5} strokeDasharray="2 3" />
                        <motion.path initial={false} animate={{ d: d(sb) }} transition={{ duration: 0.25 }} fill="none" stroke="var(--trace-b)" strokeWidth={2.5} />
                        {[18, 26, 34, 40].map((t) => (
                          <text key={t} x={x(t)} y={H - 4} textAnchor="middle" className="tabular fill-muted text-[11px]">
                            {t}
                          </text>
                        ))}
                      </>
                    );
                  }}
                </Chart>
                <p className="flex flex-wrap gap-x-4 text-caption text-ink-2">
                  <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dotted border-trace-d" aria-hidden />D: {A}</span>
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-trace-b" aria-hidden />B: {B}</span>
                </p>
                <GraduatedSlider label={`${B} salary premium`} value={premium} onChange={setPremium} min={0} max={80} step={1} format={(v) => `+${v}%`} trace="b" size="sm" />
                <p className="text-small text-ink-2" aria-live="polite">
                  {cross ? <>With a {premium}% premium, {B} passes {A} at age <strong className="text-ink">{cross.age.toFixed(1)}</strong>.</> : <>At +{premium}%, {B} still hasn&apos;t caught up by 40.</>}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    />
  );
}

// ------------------------------------------------------------------ 2. opportunity cost

export function OpportunityCostLesson({ opportunity }: Pick<LessonData, "opportunity">) {
  const [rate, setRate] = useState(5);
  const oc = opportunityCostOf(opportunity);
  const grown = compoundSeries(oc.total, rate / 100, 10)[10];
  const parts: Array<{ label: string; value: number; tone: string; from: number }> = [
    { label: "Tuition and living costs", value: oc.directCost, tone: "var(--ink)", from: 0 },
    { label: "Wages not earned while studying", value: oc.foregoneEarnings, tone: "color-mix(in srgb, var(--ink) 55%, var(--surface))", from: 1 },
    { label: `What that could grow to in 10 years at ${rate}%`, value: grown - oc.total, tone: "var(--trace-a)", from: 2 },
  ];
  const max = grown;
  const steps = [
    <p key="0">
      Four years of college at {money(opportunity.costPerYear)} a year is <strong className="text-ink">{money(oc.directCost)}</strong>. That&apos;s the price everyone sees.
    </p>,
    <p key="1">
      But while studying, you aren&apos;t earning. A typical 18-year-old working full-time would earn about <strong className="text-ink">{money(oc.foregoneEarnings)}</strong> over the same four years. Together that&apos;s the <Concept id="opportunity-cost">opportunity cost</Concept>: {money(oc.total)}.
    </p>,
    <>
      <p key="2">
        Money also has a time value. If the same amount were invested, it could keep growing. That&apos;s why economists discount the future (<Concept id="npv">net present value</Concept>).
      </p>
      <p>Change the assumed return.</p>
    </>,
  ];
  return (
    <Lesson
      slug="opportunity-cost"
      n={2}
      title="What are you really giving up?"
      steps={steps}
      visual={(step) => (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-small font-semibold text-ink">The full cost of four years</p>
            <SampleChip />
          </div>
          <div className="flex h-12 overflow-hidden rounded-sm bg-surface-sunk" aria-hidden>
            {parts.map((p) => (
              <motion.span key={p.label} className="h-full" style={{ background: p.tone, boxShadow: "inset -2px 0 0 var(--surface)" }} initial={false} animate={{ width: step >= p.from ? `${(p.value / max) * 100}%` : "0%" }} transition={enterSpring} />
            ))}
          </div>
          <ul className="grid gap-2">
            {parts.map((p) => (
              <AnimatePresence key={p.label} initial={false}>
                {step >= p.from && (
                  <motion.li variants={ledgerItem} initial="hidden" animate="visible" exit="exit" className="flex items-baseline justify-between gap-3 border-b border-rule pb-1.5 text-small">
                    <span className="flex items-center gap-2 text-ink-2">
                      <span className="size-2.5 rounded-[3px]" style={{ background: p.tone }} aria-hidden />
                      {p.label}
                    </span>
                    <span className="tabular font-semibold text-ink">
                      <AnimatedNumber value={p.value} format={money} />
                    </span>
                  </motion.li>
                )}
              </AnimatePresence>
            ))}
          </ul>
          <p className="text-small text-ink-2">
            Total: <strong className="text-ink"><AnimatedNumber value={step === 0 ? oc.directCost : step === 1 ? oc.total : grown} format={money} /></strong>
          </p>
          {step === 2 && <GraduatedSlider label="Assumed yearly return" value={rate} onChange={setRate} min={0} max={10} step={0.5} format={(v) => pct(v, 1)} size="sm" />}
        </div>
      )}
    />
  );
}

// ------------------------------------------------------------------ 3. average salary

export function AverageSalaryLesson({ salary }: Pick<LessonData, "salary">) {
  const base = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 300 }, () => drawSalary(salary.p, r));
  }, [salary]);
  const [stars, setStars] = useState(0);
  const values = [...base, ...Array.from({ length: stars }, (_, i) => 900000 + i * 150000)];
  const { mean, median } = meanAndMedian(values);
  const steps = [
    <p key="0">
      Here are 300 {salary.major.toLowerCase()} graduates, each a dot at their starting salary. Most cluster in the middle; a few earn a lot more. That long right tail is normal for pay.
    </p>,
    <p key="1">
      The <strong className="text-ink">median</strong> is the middle graduate: half earn less, half more. The <strong className="text-ink">average</strong> adds everything up and divides, so a few high earners pull it to the right.
    </p>,
    <>
      <p key="2">Now add a few superstar earners and watch which number moves. The median barely notices; the average jumps. That&apos;s why this site shows medians and ranges, not averages.</p>
    </>,
  ];
  return (
    <Lesson
      slug="average-salary"
      n={3}
      title="Why is average salary misleading?"
      steps={steps}
      visual={(step) => (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-small font-semibold text-ink">Starting salaries, {salary.major}</p>
            <SampleChip />
          </div>
          <Chart height={[180, 240]} label={`300 simulated starting salaries. Median ${money(median)}, average ${money(mean)}.`}>
            {(W, H) => {
              const xmax = stars ? Math.max(...values) * 1.05 : Math.max(...values) * 1.1;
              const x = linear([0, xmax], [16, W - 16]);
              const r = rng(11);
              return (
                <>
                  <line x1={16} x2={W - 16} y1={H - 24} y2={H - 24} stroke="var(--rule-strong)" />
                  {values.map((v, i) => (
                    <motion.circle key={i} initial={false} animate={{ cx: x(v) }} transition={{ duration: 0.4 }} cy={H - 34 - r() * (H - 90)} r={i >= base.length ? 5 : 2.5} fill={i >= base.length ? "var(--trace-c)" : "var(--ink)"} fillOpacity={i >= base.length ? 0.9 : 0.35} />
                  ))}
                  {step >= 1 && (
                    <>
                      <motion.g initial={false} animate={{ x: x(median) }} transition={{ type: "spring", duration: 0.5, bounce: 0 }}>
                        <line x1={0} x2={0} y1={18} y2={H - 24} stroke="var(--ink)" strokeWidth={2} />
                        <text x={x(median) < 150 ? 6 : -6} y={14} textAnchor={x(median) < 150 ? "start" : "end"} stroke="var(--surface)" strokeWidth={4} paintOrder="stroke" className="tabular fill-ink text-[12px] font-semibold">
                          Median {moneyCompact(median)}
                        </text>
                      </motion.g>
                      <motion.g initial={false} animate={{ x: x(mean) }} transition={{ type: "spring", duration: 0.5, bounce: 0 }}>
                        <line x1={0} x2={0} y1={36} y2={H - 24} stroke="var(--trace-c)" strokeWidth={2} strokeDasharray="5 3" />
                        <text x={6} y={30} stroke="var(--surface)" strokeWidth={4} paintOrder="stroke" className="tabular fill-ink text-[12px] font-semibold">
                          Average {moneyCompact(mean)}
                        </text>
                      </motion.g>
                    </>
                  )}
                  {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                    <text key={f} x={x(f * xmax)} y={H - 6} textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"} className="tabular fill-muted text-[11px]">
                      {moneyCompact(f * xmax)}
                    </text>
                  ))}
                </>
              );
            }}
          </Chart>
          {step === 2 && (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setStars((s) => Math.min(5, s + 1))} disabled={stars >= 5} className="flex min-h-10 items-center gap-1.5 rounded-sm border border-rule-strong bg-surface px-3 text-small font-semibold text-ink hover:border-ink disabled:opacity-40">
                <Plus className="size-4" aria-hidden /> Add a superstar earner
              </button>
              {stars > 0 && (
                <button type="button" onClick={() => setStars(0)} className="flex min-h-10 items-center gap-1.5 rounded-sm px-3 text-small text-ink-2 hover:bg-surface-sunk">
                  <RotateCcw className="size-4" aria-hidden /> Reset
                </button>
              )}
            </div>
          )}
          <p className="text-small text-ink-2" aria-live="polite">
            Gap between average and median: <strong className="text-ink">{money(mean - median)}</strong>
          </p>
        </div>
      )}
    />
  );
}

// ------------------------------------------------------------------ 4. debt compounds

export function DebtCompoundsLesson() {
  const [years, setYears] = useState(15);
  const [rate, setRate] = useState(6.53);
  const principal = 30000;
  const series = deferredBalance(principal, rate, years);
  const simple = Array.from({ length: years + 1 }, (_, t) => principal * (1 + (rate / 100) * t));
  const steps = [
    <p key="0">
      Borrow <strong className="text-ink">{money(principal)}</strong> at {pct(rate, 2)}. Each year, interest is charged on the balance.
    </p>,
    <p key="1">
      If you don&apos;t pay the interest, it&apos;s added to what you owe. Next year you pay interest on that interest too. The curve bends upward: that&apos;s compounding.
    </p>,
    <>
      <p key="2">Try a longer pause or a higher rate. The gap between the two lines is interest charged on interest. Unsubsidized federal loans build interest while you&apos;re in school, and it&apos;s added to the balance when repayment starts.</p>
    </>,
  ];
  return (
    <Lesson
      slug="debt-compounds"
      n={4}
      title="How does debt compound?"
      steps={steps}
      visual={(step) => (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-small font-semibold text-ink">Balance if nothing is paid</p>
            <p className="tabular text-h3 font-semibold text-ink">
              <AnimatedNumber value={step === 0 ? principal : series[years]} format={money} />
            </p>
          </div>
          <Chart height={[190, 250]} label={`Balance grows from ${money(principal)} to ${money(series[years])} over ${years} years.`}>
            {(W, H) => {
              const M = { t: 10, r: 12, b: 22, l: 56 };
              const x = linear([0, Math.max(1, years)], [M.l, W - M.r]);
              const hi = Math.max(...series);
              const y = linear([0, hi * 1.08], [H - M.b, M.t]);
              const pts = (s: number[]) => s.map((v, t) => [x(t), y(v)] as [number, number]);
              const gap = `${linePath(pts(series))}${pts(simple).reverse().map(([a, b]) => `L${a.toFixed(1)},${b.toFixed(1)}`).join("")}Z`;
              return (
                <>
                  <YAxis lo={0} hi={hi} x0={M.l} x1={W - M.r} y={y} />
                  {step >= 1 && <motion.path initial={false} animate={{ d: gap }} transition={{ duration: 0.3 }} className="aid-hatch" fill="var(--ink)" fillOpacity={0.12} />}
                  <motion.path initial={false} animate={{ d: linePath(pts(simple)) }} transition={{ duration: 0.3 }} fill="none" stroke="var(--ink-2)" strokeWidth={1.5} strokeDasharray="4 3" />
                  <motion.path initial={false} animate={{ d: linePath(pts(step === 0 ? simple.map(() => principal) : series)) }} transition={{ duration: 0.5 }} fill="none" stroke="var(--ink)" strokeWidth={2.5} />
                  {Array.from({ length: years + 1 }, (_, t) => t).filter((t) => t % Math.max(1, Math.ceil(years / 5)) === 0).map((t) => (
                    <text key={t} x={x(t)} y={H - 4} textAnchor="middle" className="tabular fill-muted text-[11px]">
                      {t}y
                    </text>
                  ))}
                </>
              );
            }}
          </Chart>
          <p className="flex flex-wrap gap-x-4 text-caption text-ink-2">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-ink" aria-hidden />Compounding</span>
            <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-ink-2" aria-hidden />Interest on the original loan only</span>
          </p>
          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <GraduatedSlider label="Years unpaid" value={years} onChange={setYears} min={1} max={25} step={1} format={(v) => `${v}`} size="sm" />
              <GraduatedSlider label="Interest rate" value={rate} onChange={setRate} min={3} max={12} step={0.25} format={(v) => pct(v, 2)} size="sm" />
            </div>
          )}
        </div>
      )}
    />
  );
}

// ------------------------------------------------------------------ 5. purchasing power

export function PurchasingPowerLesson({ cities }: Pick<LessonData, "cities">) {
  const [years, setYears] = useState(10);
  const home = cities[0];
  const steps = [
    <p key="0">
      Take a <strong className="text-ink">$100,000</strong> job offer in {home.name}. Prices there are {Math.round(home.rpp - 100)}% above the national average.
    </p>,
    <p key="1">
      To live the same way somewhere cheaper, you&apos;d need less. The circles show the salary with the same <Concept id="purchasing-power">purchasing power</Concept> in each city.
    </p>,
    <>
      <p key="2">
        Time matters too. With <Concept id="inflation">inflation</Concept>, the same paycheck buys less every year unless it grows. That&apos;s why this site uses <Concept id="real-income">real</Concept> (2024) dollars.
      </p>
    </>,
  ];
  return (
    <Lesson
      slug="purchasing-power"
      n={5}
      title="What can your salary actually buy?"
      steps={steps}
      visual={(step) => {
        const infl = step === 2 ? adjustForInflation(100000, years) / 100000 : 1;
        return (
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-small font-semibold text-ink">{step === 2 ? `$100,000 in ${home.name}, ${years} years from now` : "Same lifestyle, different salary"}</p>
              <SampleChip />
            </div>
            <div className="grid grid-cols-3 items-end gap-2 py-4">
              {cities.map((c, i) => {
                const need = i === 0 || step === 0 ? 100000 : equivalentSalary(100000, home.rpp, c.rpp);
                const show = step === 0 ? i === 0 : true;
                const size = 150 * Math.sqrt((need / 100000) * (i === 0 ? infl : 1));
                return (
                  <div key={c.id} className="grid justify-items-center gap-2 text-center">
                    <div className="grid h-[170px] place-items-end">
                      <motion.div className="grid place-items-center rounded-full border-2" style={{ borderColor: i === 0 ? "var(--trace-a)" : "var(--ink)", background: i === 0 ? "var(--trace-a-tint)" : "color-mix(in srgb, var(--ink) 8%, transparent)" }} initial={false} animate={{ width: show ? size : 0, height: show ? size : 0, opacity: show ? 1 : 0 }} transition={enterSpring}>
                        {show && <span className="tabular text-small font-semibold text-ink">{moneyCompact(i === 0 ? 100000 * infl : need)}</span>}
                      </motion.div>
                    </div>
                    <p className="text-caption text-ink-2">{c.name}</p>
                  </div>
                );
              })}
            </div>
            {step === 2 ? (
              <>
                <GraduatedSlider label="Years from now" value={years} onChange={setYears} min={0} max={30} step={1} format={(v) => `${v}`} size="sm" />
                <p className="text-small text-ink-2" aria-live="polite">
                  At 2.5% inflation, $100,000 in {years} years buys what <strong className="text-ink">{money(100000 * infl)}</strong> buys today.
                </p>
              </>
            ) : (
              <p className="text-caption text-muted">Circle area is the salary needed. Regional price parities, sample data.</p>
            )}
          </div>
        );
      }}
    />
  );
}
