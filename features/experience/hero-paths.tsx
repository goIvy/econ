"use client";

import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Slider } from "radix-ui";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { AnimatedNumber, MotionText, useFinePointer, useMeasuredWidth, usePointerParallax, useSteppedValue } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import { SampleChip } from "@/components/ui/lineage";
import { NO_COLLEGE, calculateBreakEvenYear, cumulativeSeries, outOfPocketBy, projectNoCollege, projectPath, snapshotAt } from "@/lib/calc";
import { clamp, linear, linePath, ticks, valueAt } from "@/components/charts/scale";
import { crossfade, easeOutExpo, enter, motionSafe, scrubSpring, staggerParent } from "@/lib/animations";
import { moneyCompact } from "@/lib/format";
import type { PathPreset } from "./data";

const START = 18;
const END = 40;
const INTRO_AGE = 29;
/** The y-axis zooms out as time advances; this spring is the "camera". */
const CAMERA = { stiffness: 70, damping: 20, mass: 1 } as const;

type Key = "a" | "b" | "c";
const INK: Record<Key, string> = { a: "var(--trace-a)", b: "var(--trace-b)", c: "var(--trace-c)" };
const DASH: Record<Key, string | undefined> = { a: undefined, b: undefined, c: "6 4" };

/**
 * Hero: three people leave the same point at 18. A time head moves along
 * their cumulative financial value (cursor on desktop, scroll everywhere,
 * or the Age scrubber), so opportunity cost is visible before any click.
 */
export function HeroPaths({ pub, priv }: { pub: PathPreset; priv: PathPreset }) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const item = motionSafe(enter, reduce);

  const model = useMemo(() => {
    const a = projectPath(pub.inputs, pub.ctx, { horizonAge: END });
    const b = projectPath(priv.inputs, priv.ctx, { horizonAge: END });
    const c = projectNoCollege({ horizonAge: END, stateRate: pub.ctx.collegeCity?.stateTaxRate });
    const series: Record<Key, number[]> = { a: cumulativeSeries(a.rows, END), b: cumulativeSeries(b.rows, END), c: cumulativeSeries(c, END) };
    const crossings = [
      { id: "ac", label: "A passes C", be: calculateBreakEvenYear(a.rows, c, a.graduationAge) },
      { id: "bc", label: "B passes C", be: calculateBreakEvenYear(b.rows, c, b.graduationAge) },
    ].flatMap((x) => (x.be && x.be.age > START && x.be.age < END ? [{ id: x.id, label: x.label, age: x.be.age }] : []));
    return { a, b, c, series, crossings };
  }, [pub, priv]);

  const [wrapRef, W] = useMeasuredWidth<HTMLDivElement>(640);
  const H = W < 520 ? 300 : 400;
  const M = { t: 30, r: 16, b: 30, l: W < 520 ? 46 : 58 };
  const all = [...model.series.a, ...model.series.b, ...model.series.c];
  const lo = Math.min(0, ...all) * 1.3;
  const x = linear([START, END], [M.l, W - M.r]);
  /** Highest value reached by any path up to age h: the top of the camera. */
  const reach = (h: number) => {
    let m = 120000;
    for (const k of ["a", "b", "c"] as Key[]) for (let a = START; a <= h; a++) m = Math.max(m, valueAt(model.series[k], START, a));
    for (const k of ["a", "b", "c"] as Key[]) m = Math.max(m, valueAt(model.series[k], START, h));
    return m * 1.15;
  };
  const yOf = (hi: number) => linear([lo, hi], [H - M.b, M.t]);

  // ---- time head: intro → scroll / cursor / scrubber
  const target = useMotionValue(START);
  const head = useSpring(target, scrubSpring);
  const hiTarget = useTransform(head, reach);
  const yHi = useSpring(hiTarget, CAMERA);
  const sectionRef = useRef<HTMLElement>(null);
  const [introDone, setIntroDone] = useState(false);
  const pointerActive = useRef(false);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });

  useEffect(() => {
    if (reduce) {
      target.jump(END);
      head.jump(END);
      yHi.jump(reach(END));
      return;
    }
    const c = animate(target, INTRO_AGE, { duration: 1.6, ease: easeOutExpo, delay: 0.35, onComplete: () => setIntroDone(true) });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, target, head, yHi]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!introDone || reduce || pointerActive.current) return;
    target.set(clamp(INTRO_AGE + p * 1.8 * (END - INTRO_AGE), START, END));
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const onPointer = (e: React.PointerEvent) => {
    if (!fine || reduce) return;
    const r = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    pointerActive.current = true;
    setIntroDone(true);
    target.set(clamp(x.invert(px), START, END));
  };

  const age = useSteppedValue(head, 1);
  const shownAge = clamp(age, START, END);
  const snapA = snapshotAt(model.a, model.c, shownAge);
  const snapB = snapshotAt(model.b, model.c, shownAge);
  const cRow = model.c.find((r) => r.age === shownAge) ?? model.c[model.c.length - 1];

  const clipW = useTransform(head, (h) => Math.max(0, x(h) - M.l + 1));
  const headX = useTransform(head, (h) => x(h));
  const parallax = usePointerParallax<HTMLElement>(sectionRef);
  const fieldX = useTransform(parallax.x, [-1, 1], [-8, 8]);
  const fieldY = useTransform(parallax.y, [-1, 1], [-6, 6]);

  const hiStep = useSteppedValue(yHi, 25000);
  const yTicks = ticks(lo, Math.max(hiStep, 150000), W < 520 ? 4 : 5).filter((t) => t >= lo);
  const paths = {
    a: useTransform(yHi, (hi) => pathFor(model.series.a, x, yOf(hi))),
    b: useTransform(yHi, (hi) => pathFor(model.series.b, x, yOf(hi))),
    c: useTransform(yHi, (hi) => pathFor(model.series.c, x, yOf(hi))),
  };
  const readouts: Array<{ key: Key; title: string; short: string; sub: string; rows: Array<[string, number]> }> = [
    { key: "a", title: pub.kind, short: "Public", sub: pub.label, rows: [["College paid", outOfPocketBy(model.a, shownAge)], ["Debt owed", snapA.remainingDebt], ["Salary", snapA.salary], ["Net position", snapA.netPosition]] },
    { key: "b", title: priv.kind, short: "Private", sub: priv.label, rows: [["College paid", outOfPocketBy(model.b, shownAge)], ["Debt owed", snapB.remainingDebt], ["Salary", snapB.salary], ["Net position", snapB.netPosition]] },
    { key: "c", title: "Work immediately", short: "Work", sub: "High-school diploma", rows: [["College paid", 0], ["Debt owed", 0], ["Salary", shownAge > START ? cRow.earnings / NO_COLLEGE.employmentRate : 0], ["Net position", snapA.baselinePosition]] },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden"
      aria-labelledby="hero-title"
    >
      <motion.div aria-hidden style={{ x: fieldX, y: fieldY }} className="measured-field field-fade pointer-events-none absolute -inset-4 -z-10" />

      <motion.div
        variants={staggerParent(0.06)}
        initial="hidden"
        animate="visible"
        className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-14 pt-8 md:px-8 md:pt-12 lg:grid-cols-12 lg:gap-10 lg:pb-20 xl:px-12"
      >
        <div className="grid content-start gap-6 lg:col-span-5 lg:pt-10">
          <motion.h1 id="hero-title" variants={item} className="text-display font-[750] tracking-[-0.03em]">
            Explore the Economics of Your Future.
          </motion.h1>
          <motion.p variants={item} className="text-lede text-ink-2">
            Three people start at 18. One goes to a public university, one to a private one, one straight to work. Move through time and watch what each choice costs, owes and earns.
          </motion.p>
          <motion.div variants={item} className="flex flex-wrap gap-3">
            <ButtonLink href="/get-started" size="lg">
              Build your path
            </ButtonLink>
            <ButtonLink href="/compare" size="lg" variant="secondary">
              Compare colleges
            </ButtonLink>
          </motion.div>
          <motion.p variants={item} className="measure border-t border-rule pt-5 text-small text-ink-2">
            The gap between the lines in the first years is opportunity cost: tuition paid plus the wages not earned while studying.
          </motion.p>
        </div>

        <motion.div variants={item} className="grid min-w-0 gap-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-small font-semibold text-ink">Cumulative net value, 2024 dollars</p>
            <SampleChip />
          </div>
          <div ref={wrapRef} className="relative" onPointerMove={onPointer} onPointerLeave={() => (pointerActive.current = false)}>
            <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full touch-pan-y select-none" role="img" aria-label={heroSummary(pub.label, priv.label, model)}>
              <defs>
                <clipPath id="hero-clip">
                  <motion.rect x={M.l - 1} y={M.t - 4} height={H - M.t - M.b + 8} style={{ width: clipW }} />
                </clipPath>
                <clipPath id="hero-plot">
                  <rect x={M.l - 12} y={M.t - 4} width={W - M.l - M.r + 24} height={H - M.t - M.b + 8} />
                </clipPath>
              </defs>
              <AnimatePresence initial={false}>
                {yTicks.map((t) => (
                  <Tick key={t} value={t} yHi={yHi} yOf={yOf} x1={M.l} x2={W - M.r} />
                ))}
              </AnimatePresence>
              {[18, 22, 26, 30, 35, 40].map((t) => (
                <text key={t} x={x(t)} y={H - 10} textAnchor="middle" className="tabular fill-muted text-[11px]">
                  {t}
                </text>
              ))}
              <rect x={x(START)} y={M.t} width={x(START + 4) - x(START)} height={H - M.t - M.b} fill="var(--ink)" fillOpacity={0.035} />
              <text x={x(START) + 8} y={M.t + 14} className="fill-muted text-[11px]">
                College
              </text>

              {/* faint full-length guides, then the inked paths revealed up to the head */}
              <g clipPath="url(#hero-plot)">
                {(["c", "b", "a"] as Key[]).map((k) => (
                  <motion.path key={`g-${k}`} d={paths[k]} fill="none" stroke={INK[k]} strokeOpacity={0.14} strokeWidth={1.5} strokeDasharray={DASH[k]} />
                ))}
              </g>
              <g clipPath="url(#hero-clip)">
                {(["c", "b", "a"] as Key[]).map((k) => (
                  <motion.path key={k} d={paths[k]} fill="none" stroke={INK[k]} strokeWidth={k === "c" ? 2 : 2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={DASH[k]} />
                ))}
              </g>

              {model.crossings.map((cx) => (
                <Crossing key={cx.id} head={head} yHi={yHi} yOf={yOf} age={cx.age} label={cx.label} cx={x(cx.age)} value={valueAt(model.series.c, START, cx.age)} />
              ))}

              <motion.line style={{ x: headX }} x1={0} x2={0} y1={M.t - 6} y2={H - M.b} stroke="var(--ink)" strokeOpacity={0.5} />
              <motion.g style={{ x: headX }}>
                <rect x={-26} y={4} width={52} height={20} rx={10} fill="var(--ink)" />
                <text x={0} y={18} textAnchor="middle" className="tabular fill-on-ink text-[11px] font-semibold">
                  <MotionTspan value={head} format={(v) => `Age ${Math.floor(v)}`} />
                </text>
              </motion.g>
              {(["c", "b", "a"] as Key[]).map((k) => (
                <HeadDot key={`d-${k}`} k={k} head={head} yHi={yHi} yOf={yOf} series={model.series[k]} x={x} />
              ))}
            </svg>
          </div>

          <HeadScrubber head={head} onChange={(v) => { pointerActive.current = true; setIntroDone(true); target.set(v); }} />

          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-rule bg-rule">
            {readouts.map((r) => (
              <div key={r.key} className="grid content-start gap-2 bg-surface p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-on-ink" style={{ background: INK[r.key] }} aria-hidden>
                    {r.key.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-caption font-semibold text-ink">
                      <span className="sm:hidden">{r.short}</span>
                      <span className="hidden sm:inline">{r.title}</span>
                    </p>
                    <p className="hidden truncate text-caption text-muted sm:block">{r.sub}</p>
                  </div>
                </div>
                {r.rows.map(([label, v]) => (
                  <div key={label} className="grid gap-0.5">
                    <dt className="text-[0.75rem] text-muted">{label}</dt>
                    <dd className={label === "Net position" ? "text-small font-semibold text-ink sm:text-base" : "text-small text-ink-2"}>
                      <AnimatedNumber value={v} format={moneyCompact} />
                    </dd>
                  </div>
                ))}
              </div>
            ))}
          </dl>
          <p className="text-caption text-muted" aria-live="polite">
            At age {shownAge}. College paid excludes loans, which appear as debt and are repaid from salary. Salaries before tax; net position after tax.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

function pathFor(series: number[], x: (v: number) => number, y: (v: number) => number): string {
  return linePath(series.map((v, i) => [x(START + i), y(v)]));
}

function HeadDot({ k, head, yHi, yOf, series, x }: { k: Key; head: MotionValue<number>; yHi: MotionValue<number>; yOf: (hi: number) => (v: number) => number; series: number[]; x: (v: number) => number }) {
  const cx = useTransform(head, (h) => x(h));
  const cy = useTransform([head, yHi], ([h, hi]: number[]) => yOf(hi)(valueAt(series, START, h)));
  return (
    <motion.g style={{ x: cx, y: cy }} aria-hidden>
      <circle r={10} fill={INK[k]} stroke="var(--paper)" strokeWidth={2} />
      <text textAnchor="middle" dy="0.35em" className="fill-on-ink text-[10px] font-bold">
        {k.toUpperCase()}
      </text>
    </motion.g>
  );
}

function Crossing({ head, yHi, yOf, age, label, cx, value }: { head: MotionValue<number>; yHi: MotionValue<number>; yOf: (hi: number) => (v: number) => number; age: number; label: string; cx: number; value: number }) {
  const opacity = useTransform(head, [age - 0.4, age + 0.2], [0, 1]);
  const cy = useTransform(yHi, (hi) => yOf(hi)(value));
  return (
    <motion.g style={{ opacity, y: cy }}>
      <circle cx={cx} cy={0} r={6} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.75} />
      <circle cx={cx} cy={0} r={2} fill="var(--ink)" />
      <text x={cx - 10} y={-12} textAnchor="end" className="tabular fill-ink text-[11px] font-semibold">
        {label} at {age.toFixed(1)}
      </text>
    </motion.g>
  );
}

function Tick({ value, yHi, yOf, x1, x2 }: { value: number; yHi: MotionValue<number>; yOf: (hi: number) => (v: number) => number; x1: number; x2: number }) {
  const y = useTransform(yHi, (hi) => yOf(hi)(value));
  return (
    <motion.g style={{ y }} variants={crossfade} initial="hidden" animate="visible" exit="exit">
      <line x1={x1} x2={x2} y1={0} y2={0} stroke={value === 0 ? "var(--rule-strong)" : "var(--rule)"} strokeWidth={value === 0 ? 1.25 : 1} />
      <text x={x1 - 10} y={0} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">
        {moneyCompact(value)}
      </text>
    </motion.g>
  );
}

function MotionTspan({ value, format }: { value: MotionValue<number>; format: (v: number) => string }) {
  const t = useTransform(value, format);
  return <motion.tspan>{t}</motion.tspan>;
}

function HeadScrubber({ head, onChange }: { head: MotionValue<number>; onChange: (v: number) => void }) {
  const v = useSteppedValue(head, 0.5);
  return (
    <div className="flex items-center gap-3">
      <span className="text-caption font-medium text-muted" id="hero-age-label">
        Age
      </span>
      <Slider.Root value={[clamp(v, START, END)]} min={START} max={END} step={0.5} onValueChange={([n]) => onChange(n)} className="relative flex h-8 grow touch-none select-none items-center" aria-labelledby="hero-age-label">
        <Slider.Track className="relative h-1.5 grow rounded-full bg-surface-sunk">
          <Slider.Range className="absolute h-full rounded-full bg-ink" />
        </Slider.Track>
        <Slider.Thumb aria-label="Age" aria-valuetext={`Age ${Math.floor(v)}`} className="block size-5 rounded-full border-2 border-on-ink bg-ink shadow-2 transition-transform hover:scale-110" />
      </Slider.Root>
      <MotionText value={head} format={(n) => `${Math.floor(n)}`} className="w-6 text-right text-small font-semibold text-ink" />
    </div>
  );
}

function heroSummary(a: string, b: string, m: { series: Record<Key, number[]>; crossings: Array<{ label: string; age: number }> }) {
  const end = (k: Key) => moneyCompact(m.series[k][m.series[k].length - 1]);
  return `Cumulative net value from age 18 to 40. Path A, ${a}: ${end("a")} by 40. Path B, ${b}: ${end("b")}. Path C, working from 18: ${end("c")}. ${m.crossings.map((c) => `${c.label} at age ${c.age.toFixed(1)}`).join(". ")}.`;
}
