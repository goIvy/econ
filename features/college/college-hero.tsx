"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Slider } from "radix-ui";
import { ViewTransition, useEffect, useRef } from "react";
import { AnimatedNumber, useMeasuredWidth, useSteppedValue } from "@/components/motion";
import { DataKindChip } from "@/components/ui/data-kind";
import { SampleChip } from "@/components/ui/lineage";
import { clamp, linear, linePath, valueAt } from "@/components/charts/scale";
import { EASE, scrubSpring } from "@/lib/animations";
import { moneyCompact, pct } from "@/lib/format";

export interface CollegeHeroProps {
  id: string;
  name: string;
  place: string;
  major: string;
  metrics: { netCost: number; employment: number; salary: number; debt: number; breakEven: number | null };
  series: number[];
  base: number[];
  prev: { id: string; name: string };
  next: { id: string; name: string };
  accent: number;
}

const GLOWS = ["rgba(108,124,255,.28)", "rgba(54,209,180,.22)", "rgba(167,139,250,.26)"];

/**
 * College detail hero: big metrics, a timeline you can scrub right away, and
 * a switcher. Arrows, keys (← →) or a swipe move to the next college; the old
 * one exits left and the new one enters from the right (View Transitions).
 */
export function CollegeHero(p: CollegeHeroProps) {
  const router = useRouter();
  const go = (dir: "next" | "prev") => {
    document.documentElement.dataset.dir = dir;
    router.push(`/college/${dir === "next" ? p.next.id : p.prev.id}`, { scroll: false });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only when nothing interactive has focus: tabs, radios, sliders and lists use arrows themselves.
      const t = e.target as HTMLElement;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (t !== document.body && t.closest("input, textarea, select, button, a, [role], [contenteditable], [tabindex]")) return;
      if (e.key === "ArrowRight") go("next");
      if (e.key === "ArrowLeft") go("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.next.id, p.prev.id]);
  const swipe = useRef<number | null>(null);

  const metrics: Array<{ label: string; value: number | null; fmt: (v: number) => string; kind: "estimated" | "observed" | "projected" }> = [
    { label: "NET COST", value: p.metrics.netCost, fmt: moneyCompact, kind: "estimated" },
    { label: "EXPECTED DEBT", value: p.metrics.debt, fmt: moneyCompact, kind: "estimated" },
    { label: "EARLY-CAREER PAY", value: p.metrics.salary, fmt: moneyCompact, kind: "observed" },
    { label: "EMPLOYMENT", value: p.metrics.employment, fmt: (v) => pct(v), kind: "observed" },
    { label: "BREAK-EVEN", value: p.metrics.breakEven == null ? null : Math.max(0, p.metrics.breakEven - 22), fmt: (v) => `${v.toFixed(1)} yrs`, kind: "projected" },
  ];

  return (
    <section
      className="theme-dark relative isolate overflow-hidden"
      aria-labelledby="college-title"
      onPointerDown={(e) => e.pointerType !== "mouse" && (swipe.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipe.current == null) return;
        const dx = e.clientX - swipe.current;
        swipe.current = null;
        if (Math.abs(dx) > 70) go(dx < 0 ? "next" : "prev");
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 transition-[background-image] duration-[900ms]" style={{ backgroundImage: `radial-gradient(circle at 70% 35%, ${GLOWS[p.accent]}, transparent 50%)` }} />
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-12 pt-8 md:px-8 md:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-small text-ink-2">
              <li>
                <Link href="/explore" className="rounded-xs font-medium hover:text-ink">
                  Explore
                </Link>
              </li>
              <li aria-hidden className="text-muted">/</li>
              <li className="font-medium text-ink">{p.name}</li>
              <li aria-hidden className="text-muted">/</li>
              <li aria-current="page">{p.major}</li>
            </ol>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => go("prev")} className="flex h-10 items-center gap-2 rounded-full border border-rule px-3 text-caption font-semibold text-ink-2 hover:border-rule-strong hover:text-ink" aria-label={`Previous college: ${p.prev.name}`}>
              <ArrowLeft className="size-4" aria-hidden /> <span className="hidden sm:inline">{p.prev.name}</span>
            </button>
            <button type="button" onClick={() => go("next")} className="flex h-10 items-center gap-2 rounded-full border border-rule px-3 text-caption font-semibold text-ink-2 hover:border-rule-strong hover:text-ink" aria-label={`Next college: ${p.next.name}`}>
              <span className="hidden sm:inline">{p.next.name}</span> <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <ViewTransition name="college-hero">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="grid content-start gap-4 lg:col-span-5">
              <ViewTransition name={`college-name-${p.id}`}>
                <h1 id="college-title" className="text-h1 font-extrabold uppercase">
                  {p.name}
                </h1>
              </ViewTransition>
              <p className="text-h3 font-semibold text-accent-2">{p.major.toUpperCase()}</p>
              <p className="text-small text-ink-2">{p.place}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-5">
                {metrics.map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: EASE.smooth }} className={i === 4 ? "col-span-2" : undefined}>
                    <dt className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold tracking-[0.14em] text-muted">
                      {m.label} <DataKindChip kind={m.kind} className="hidden sm:inline-flex" />
                    </dt>
                    <dd className="tabular text-[clamp(1.75rem,2.9vw,2.6rem)] font-extrabold leading-tight tracking-[-0.035em] text-ink">{m.value == null ? "Not by 40" : <AnimatedNumber value={m.value} format={m.fmt} />}
                      {m.label === "BREAK-EVEN" && m.value != null && <span className="block text-caption font-medium tracking-normal text-muted">after graduation, vs. working from 18</span>}</dd>
                  </motion.div>
                ))}
              </dl>
            </div>
            <div className="min-w-0 lg:col-span-7">
              <Timeline series={p.series} base={p.base} be={p.metrics.breakEven} />
            </div>
          </div>
        </ViewTransition>
      </div>
    </section>
  );
}

function Timeline({ series, base, be }: { series: number[]; base: number[]; be: number | null }) {
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(640);
  const H = W < 480 ? 220 : 300;
  const M = { t: 16, r: 12, b: 26, l: 52 };
  const all = [...series, ...base];
  const lo = Math.min(0, ...all) * 1.15;
  const hi = Math.max(...all) * 1.05;
  const x = linear([18, 40], [M.l, W - M.r]);
  const y = linear([lo, hi], [H - M.b, M.t]);
  const target = useMotionValue(26);
  const age = useSpring(target, scrubSpring);
  const shown = clamp(useSteppedValue(age, 0.1), 18, 40);
  const hx = useTransform(age, (a) => x(a));
  const hy = useTransform(age, (a) => y(valueAt(series, 18, a)));
  const clipW = useTransform(age, (a) => Math.max(0, x(a) - M.l));
  const d = (s: number[]) => linePath(s.map((v, i) => [x(18 + i), y(v)]));
  return (
    <div className="grid gap-3 rounded-lg border border-rule bg-surface p-4 shadow-3 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-small font-semibold text-ink">Total money earned minus costs, vs. working from 18</p>
        <SampleChip />
      </div>
      <div ref={ref} className="min-w-0" data-cursor="SCRUB">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`Total money earned minus costs from 18 to 40. ${be ? `Break-even at ${be.toFixed(1)}.` : "No break-even by 40."}`}>
          <defs>
            <clipPath id="ch-clip">
              <motion.rect x={M.l} y={0} height={H} style={{ width: clipW }} />
            </clipPath>
          </defs>
          <line x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} stroke="var(--rule-strong)" />
          <text x={M.l - 8} y={y(0)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px]">$0</text>
          <text x={M.l - 8} y={y(hi / 1.05)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">{moneyCompact(hi / 1.05)}</text>
          <path d={d(base)} fill="none" stroke="var(--trace-c)" strokeWidth={1.5} strokeDasharray="6 4" />
          <path d={d(series)} fill="none" stroke="var(--trace-a)" strokeOpacity={0.25} strokeWidth={2} />
          <g clipPath="url(#ch-clip)">
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: EASE.smooth }} d={d(series)} fill="none" stroke="var(--trace-a)" strokeWidth={3} />
          </g>
          {be && (
            <g transform={`translate(${x(be)},${y(valueAt(base, 18, be))})`}>
              <circle r={7} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
              <circle r={2.5} fill="var(--ink)" />
            </g>
          )}
          <motion.line style={{ x: hx }} x1={0} x2={0} y1={M.t} y2={H - M.b} stroke="var(--ink)" strokeOpacity={0.4} />
          <motion.circle style={{ x: hx, y: hy }} r={6} fill="var(--trace-a)" stroke="var(--surface)" strokeWidth={2} />
          {[18, 22, 26, 30, 35, 40].map((t) => (
            <text key={t} x={x(t)} y={H - 6} textAnchor="middle" className="tabular fill-muted text-[11px]">{t}</text>
          ))}
        </svg>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-caption text-muted">Age</span>
        <Slider.Root value={[shown]} min={18} max={40} step={0.1} onValueChange={([v]) => target.set(v)} className="relative flex h-8 grow touch-none select-none items-center" aria-label="Age">
          <Slider.Track className="relative h-1.5 grow rounded-full bg-surface-sunk">
            <Slider.Range className="absolute h-full rounded-full bg-accent" />
          </Slider.Track>
          <Slider.Thumb aria-label="Age" aria-valuetext={`Age ${shown.toFixed(1)}`} className="block size-6 rounded-full border-[3px] border-surface bg-accent shadow-3" />
        </Slider.Root>
        <span className="tabular w-24 text-right text-small font-bold text-ink">
          <AnimatedNumber value={valueAt(series, 18, shown)} format={moneyCompact} />
        </span>
      </div>
    </div>
  );
}
