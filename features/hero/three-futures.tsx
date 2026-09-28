"use client";

import { AnimatePresence, motion, useInView, useTransform } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber, useMeasuredWidth, usePointerParallax } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { Segmented } from "@/components/ui/segmented";
import { SampleChip } from "@/components/ui/lineage";
import { linear, linePath, valueAt } from "@/components/charts/scale";
import { DUR, EASE, enter, motionSafe, staggerParent } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { HORIZON, PATH_DASH, PATH_TRACE, PATH_VAR, pathNo, useScenario, type Future } from "@/features/scenario/store";

const START = 18;
/** One glow per path; the background crossfades between them. */
const GLOW = [
  "radial-gradient(circle at 55% 40%, rgba(108,124,255,.28), transparent 45%)",
  "radial-gradient(circle at 55% 40%, rgba(54,209,180,.22), transparent 45%)",
  "radial-gradient(circle at 55% 40%, rgba(167,139,250,.26), transparent 45%)",
];
/** Timeline markers and their entrance delays (s). */
const MARKER_DELAYS = [0, 0.15, 0.28, 0.42, 0.58, 0.74];

/**
 * THREE FUTURES. Three life paths leave age 18 together and run to 40.
 * Pick a path to put its numbers up front; rebuild any path with the selector
 * and watch it exit, redraw and re-mark its timeline.
 */
export function ThreeFutures() {
  const { futures, active, setActive, baselineSeries } = useScenario();
  const reduce = useReducedMotion();
  const item = motionSafe(enter, reduce);
  const sectionRef = useRef<HTMLElement>(null);
  const parallax = usePointerParallax<HTMLElement>(sectionRef);
  const bgX = useTransform(parallax.x, [-1, 1], [-24, 24]);
  const bgY = useTransform(parallax.y, [-1, 1], [-18, 18]);
  const act = futures.find((f) => f.index === active) ?? futures[0];

  return (
    <section ref={sectionRef} id="futures-hero" aria-labelledby="hero-title" className="theme-dark relative isolate overflow-hidden">
      <GlowLayers active={active} />
      <motion.div aria-hidden style={{ x: bgX, y: bgY }} className="measured-field pointer-events-none absolute -inset-8 -z-10 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,#000_30%,transparent_80%)]" />

      <div className="mx-auto flex min-h-[100svh] max-w-[1280px] flex-col px-4 pt-[calc(var(--nav-h)+28px)] md:px-8 md:pt-[calc(var(--nav-h)+40px)]">
        <motion.div variants={staggerParent(0.08)} initial="hidden" animate="visible" className="relative z-10 grid w-full justify-items-center text-center">
          <motion.p variants={item} className="mb-4 text-caption font-semibold tracking-[0.18em] text-accent-2">
            SEE WHAT COLLEGE IS REALLY WORTH
          </motion.p>
          <motion.h1 id="hero-title" variants={item} className="max-w-[11ch] text-display font-extrabold sm:max-w-[16ch]">
            Your college decision doesn&apos;t end at graduation.
          </motion.h1>
          <motion.p variants={item} className="mt-5 max-w-[34ch] text-lede text-ink-2">
            See where each path could take you.
          </motion.p>
        </motion.div>

        {/* On large screens the paths rise up behind the headline, fading out as they reach it. */}
        <div className="relative mt-6 flex min-h-[300px] flex-1 flex-col md:min-h-[360px] lg:-mt-28">
          <div className="lg:[mask-image:linear-gradient(to_bottom,transparent_0,#000_28%)]">
            <FuturesChart futures={futures} baseline={baselineSeries} active={active} setActive={setActive} parallax={parallax} />
          </div>
          {act && <FloatingCards f={act} parallax={parallax} />}
        </div>

        {act && <MobileCards f={act} />}
        <BuildYourPath />
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ background

function GlowLayers({ active }: { active: number }) {
  // Two stacked layers: paint the hidden one, fade it in, fade the other out.
  const [layers, setLayers] = useState<{ a: string; b: string; top: "a" | "b" }>({ a: GLOW[0], b: GLOW[0], top: "a" });
  const prev = useRef(active);
  useEffect(() => {
    if (prev.current === active) return;
    prev.current = active;
    setLayers((l) => (l.top === "a" ? { ...l, b: GLOW[active], top: "b" } : { ...l, a: GLOW[active], top: "a" }));
  }, [active]);
  return (
    <>
      <div id="hero-bg-a" aria-hidden className="pointer-events-none absolute inset-0 -z-20 transition-opacity duration-[900ms] ease-out" style={{ backgroundImage: layers.a, opacity: layers.top === "a" ? 1 : 0 }} />
      <div id="hero-bg-b" aria-hidden className="pointer-events-none absolute inset-0 -z-20 transition-opacity duration-[900ms] ease-out" style={{ backgroundImage: layers.b, opacity: layers.top === "b" ? 1 : 0 }} />
    </>
  );
}

// ------------------------------------------------------------------ chart

type Parallax = ReturnType<typeof usePointerParallax<HTMLElement>>;

function FuturesChart({ futures, baseline, active, setActive, parallax }: { futures: Future[]; baseline: number[]; active: number; setActive: (i: number) => void; parallax: Parallax }) {
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(1200);
  const inView = useInView(ref, { once: true });
  const H = W < 640 ? 280 : 360;
  const M = { t: 24, r: W < 640 ? 12 : 180, b: 34, l: W < 640 ? 12 : 24 };
  const all = [...futures.flatMap((f) => f.series), ...baseline];
  const lo = Math.min(0, ...all);
  const hi = Math.max(...all);
  const x = linear([START, HORIZON], [M.l, W - M.r]);
  const y = linear([lo * 1.25, hi * 1.06], [H - M.b, M.t]);
  const [hover, setHover] = useState<number | null>(null);
  const focus = hover ?? active;
  const act = futures.find((f) => f.index === active);

  return (
    <div ref={ref} className="relative min-w-0" data-cursor="EXPLORE">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={chartSummary(futures)}>
        {/* ages */}
        <line x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} stroke="var(--rule-strong)" />
        {[18, 22, 26, 30, 34, 38].map((a) => (
          <text key={a} x={x(a)} y={H - 10} textAnchor={a === 18 ? "start" : "middle"} className="tabular fill-muted text-[11px]">
            {a}
          </text>
        ))}
        {/* college band */}
        <rect x={x(18)} y={M.t} width={x(22) - x(18)} height={H - M.t - M.b} fill="var(--ink)" fillOpacity={0.03} />

        {/* work from 18: the reference path */}
        <path d={linePath(baseline.map((v, i) => [x(START + i), y(v)]))} fill="none" stroke="var(--trace-c)" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.7} />

        {futures.map((f) => (
          <ParallaxGroup key={f.index} parallax={parallax} depth={4 + f.index * 4}>
            <AnimatePresence initial={false} custom={f.index}>
              <PathLine key={`${f.sel.collegeId}.${f.sel.majorId}.${f.sel.residency}.${f.sel.aid}`} f={f} x={x} y={y} emphasized={focus === f.index} drawn={inView} />
            </AnimatePresence>
            {/* hit area to pick a path */}
            <path
              d={linePath(f.series.map((v, i) => [x(START + i), y(v)]))}
              fill="none"
              stroke="transparent"
              strokeWidth={18}
              className="cursor-pointer"
              onPointerEnter={() => setHover(f.index)}
              onPointerLeave={() => setHover(null)}
              onClick={() => setActive(f.index)}
            />
          </ParallaxGroup>
        ))}

        {/* timeline markers on the active path */}
        {act && inView && (
          <AnimatePresence mode="wait">
            <Markers key={`${act.index}.${act.sel.collegeId}.${act.sel.majorId}.${act.sel.aid}.${act.sel.residency}`} f={act} x={x} y={y} compact={W < 640} />
          </AnimatePresence>
        )}

        {/* end labels, nudged apart so they never overlap */}
        {W >= 640 &&
          endLabels(futures, baseline, y, H * 0.36).map((l) => (
            <motion.g key={l.key} initial={false} animate={{ y: l.y, opacity: l.index == null || focus === l.index ? 1 : 0.55 }} transition={{ duration: DUR.large, ease: EASE.smooth }}>
              {l.index != null && <circle cx={W - M.r} cy={0} r={4} fill={PATH_VAR[l.index]} />}
              <text x={W - M.r + 10} y={-4} className={l.index == null ? "fill-muted text-[10px] font-bold tracking-[0.1em]" : "fill-ink text-[11px] font-bold tracking-[0.08em]"}>
                {l.title}
              </text>
              <text x={W - M.r + 10} y={10} className="tabular fill-muted text-[11px]">
                {l.sub}
              </text>
            </motion.g>
          ))}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-caption text-muted">Cumulative net value after tuition, living costs, loan payments and taxes. 2024 dollars.</p>
        <SampleChip />
      </div>
    </div>
  );
}

function endLabels(futures: Future[], baseline: number[], y: (v: number) => number, minY = 0) {
  const items = [
    ...futures.map((f) => ({ key: `lbl-${f.index}`, index: f.index as number | null, title: `PATH ${pathNo(f.index)}`, sub: `${moneyCompact(f.series[f.series.length - 1])} by 40`, y: y(f.series[f.series.length - 1]) })),
    { key: "lbl-work", index: null, title: "WORK FROM 18", sub: `${moneyCompact(baseline[baseline.length - 1])} by 40`, y: y(baseline[baseline.length - 1]) },
  ].sort((a, b) => a.y - b.y);
  if (items.length) items[0].y = Math.max(items[0].y, minY);
  for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 32) items[i].y = items[i - 1].y + 32;
  return items;
}

function ParallaxGroup({ parallax, depth, children }: { parallax: Parallax; depth: number; children: React.ReactNode }) {
  const ty = useTransform(parallax.y, [-1, 1], [-depth, depth]);
  return <motion.g style={{ y: ty }}>{children}</motion.g>;
}

/** A path's life: enters by drawing left to right, exits by fading, shifting and compressing. */
function PathLine({ f, x, y, emphasized, drawn }: { f: Future; x: (v: number) => number; y: (v: number) => number; emphasized: boolean; drawn: boolean }) {
  const reduce = useReducedMotion();
  const d = linePath(f.series.map((v, i) => [x(START + i), y(v)]));
  const origin = `${x(START)}px ${y(0)}px`;
  return (
    <motion.g
      style={{ transformOrigin: origin }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, scaleY: 1, transition: { duration: DUR.large, ease: EASE.smooth } }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -18, scaleY: 0.92, transition: { duration: DUR.exit, ease: EASE.exit } }}
    >
      {/* soft underglow on the emphasized path */}
      <motion.path d={d} fill="none" stroke={PATH_VAR[f.index]} strokeWidth={10} strokeLinecap="round" initial={false} animate={{ opacity: emphasized ? 0.16 : 0 }} transition={{ duration: 0.3 }} />
      <motion.path
        d={d}
        fill="none"
        stroke={PATH_VAR[f.index]}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={PATH_DASH[f.index]}
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: drawn || reduce ? 1 : 0, strokeWidth: emphasized ? 3 : 2, opacity: emphasized ? 1 : 0.5 }}
        transition={{ pathLength: { duration: reduce ? 0 : DUR.hero * 1.4, ease: EASE.smooth, delay: 0.1 + f.index * 0.12 }, default: { duration: 0.3 } }}
      />
    </motion.g>
  );
}

function Markers({ f, x, y, compact }: { f: Future; x: (v: number) => number; y: (v: number) => number; compact: boolean }) {
  const g = f.result.graduationAge;
  const pts: Array<{ age: number; label: string }> = [
    { age: START, label: "College" },
    { age: g, label: "Graduation" },
    { age: g + 1, label: "First job" },
    { age: 28, label: "Year 10" },
    ...(f.result.loan.principal > 0 ? [{ age: g + f.result.loan.payoffYears, label: "Debt payoff" }] : []),
    { age: 38, label: "Year 20" },
  ].sort((a, b) => a.age - b.age);
  return (
    <motion.g initial="hidden" animate="visible" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
      {pts.map((p, i) => {
        const cx = x(p.age);
        const cy = y(valueAt(f.series, START, p.age));
        const above = i % 2 === 0;
        return (
          <motion.g
            key={p.label}
            variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: DUR.standard, ease: EASE.smooth, delay: MARKER_DELAYS[Math.min(i, MARKER_DELAYS.length - 1)] + (i >= MARKER_DELAYS.length ? 0.16 : 0) } } }}
          >
            <line x1={cx} x2={cx} y1={cy} y2={cy + (above ? -22 : 22)} stroke="var(--rule-strong)" />
            <circle cx={cx} cy={cy} r={4.5} fill="var(--paper)" stroke={PATH_VAR[f.index]} strokeWidth={2} />
            {!compact && (
              <text x={cx} y={cy + (above ? -28 : 36)} textAnchor={i === 0 ? "start" : "middle"} dx={i === 0 ? -4 : 0} stroke="var(--paper)" strokeWidth={4} paintOrder="stroke" className="fill-ink text-[10px] font-bold tracking-[0.1em]">
                {p.label.toUpperCase()}
              </text>
            )}
          </motion.g>
        );
      })}
    </motion.g>
  );
}

function chartSummary(futures: Future[]) {
  return `Three possible futures from age 18 to 40. ${futures.map((f) => `Path ${pathNo(f.index)}, ${f.label}: ${moneyCompact(f.series[f.series.length - 1])} by 40${f.breakEven ? `, passes working from 18 at age ${f.breakEven.toFixed(1)}` : ""}.`).join(" ")}`;
}

// ------------------------------------------------------------------ floating cards

function metrics(f: Future) {
  return [
    { label: "TOTAL COST", value: f.result.net.netPrice, fmt: money, note: "4 years, after aid" },
    { label: "STARTING SALARY", value: f.result.startingSalary, fmt: money, note: "Median, this program" },
    { label: "10-YEAR EARNINGS", value: f.result.tenYearEarnings, fmt: moneyCompact, note: "After graduating" },
    { label: "BREAK-EVEN", value: f.breakEven ? f.breakEven - f.result.graduationAge : null, fmt: (v: number) => `${v.toFixed(1)} YEARS`, note: f.breakEven ? "After graduating, vs. work" : "Not by 40" },
  ];
}

/* Cards float as a 2×2 cluster in the open space above where the paths begin. */
const CARD_SPOTS = ["", "translate-y-2", "", "translate-y-2"];

function FloatingCards({ f, parallax }: { f: Future; parallax: Parallax }) {
  return (
    <div className="pointer-events-none absolute left-0 top-[11%] hidden w-[392px] grid-cols-2 gap-2.5 xl:grid" aria-hidden>
      {metrics(f).map((m, i) => (
        <FloatCard key={m.label} i={i} parallax={parallax} className={CARD_SPOTS[i]} color={PATH_VAR[f.index]} {...m} />
      ))}
    </div>
  );
}

function FloatCard({ i, parallax, className, label, value, fmt, note, color }: { i: number; parallax: Parallax; className: string; label: string; value: number | null; fmt: (v: number) => string; note: string; color: string }) {
  const depth = 8 + (i % 2) * 6; // 8–14px
  const tx = useTransform(parallax.x, [-1, 1], [-depth, depth]);
  const ty = useTransform(parallax.y, [-1, 1], [-depth * 0.7, depth * 0.7]);
  return (
    <motion.div style={{ x: tx, y: ty }} className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.08, duration: DUR.large }}>
      <div className="glass float-gentle grid gap-0.5 rounded-md border border-rule px-3.5 py-2.5 shadow-3" style={{ animationDelay: `${i * -1.3}s` }}>
        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-muted">
          <span className="size-1.5 rounded-full" style={{ background: color }} />
          {label}
        </p>
        <p className="text-[1.45rem] font-bold leading-tight tracking-[-0.03em] text-ink">{value == null ? "—" : <AnimatedNumber value={value} format={fmt} />}</p>
        <p className="text-[0.75rem] text-muted">{note}</p>
      </div>
    </motion.div>
  );
}

function MobileCards({ f }: { f: Future }) {
  return (
    <dl tabIndex={0} className="-mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 xl:hidden" aria-label={`Path ${pathNo(f.index)} key numbers (scrolls sideways)`}>
      {metrics(f).map((m) => (
        <div key={m.label} className="grid min-w-[170px] shrink-0 snap-start gap-1 rounded-md border border-rule bg-surface px-4 py-3">
          <dt className="text-[10px] font-bold tracking-[0.14em] text-muted">{m.label}</dt>
          <dd className="text-h3 font-bold text-ink">{m.value == null ? "—" : <AnimatedNumber value={m.value} format={m.fmt} />}</dd>
          <dd className="text-caption text-muted">{m.note}</dd>
        </div>
      ))}
    </dl>
  );
}

// ------------------------------------------------------------------ selector

function BuildYourPath() {
  const { paths, active, setActive, setPath, colleges, majors, loading, error, futures } = useScenario();
  const sel = paths[active];
  const college = colleges.find((c) => c.id === sel.collegeId)!;
  const collegeOpts = useMemo(() => colleges.map((c) => ({ value: c.id, label: c.shortName, meta: c.state, keywords: [c.name] })), [colleges]);
  const majorOpts = college.majorIds.map((id) => ({ value: id, label: majors.find((m) => m.id === id)?.name ?? id })).sort((a, b) => a.label.localeCompare(b.label));

  const pickCollege = (id: string) => {
    const c = colleges.find((x) => x.id === id)!;
    const majorId = c.majorIds.includes(sel.majorId) ? sel.majorId : c.majorIds[0];
    void setPath(active, { collegeId: id, majorId });
  };

  return (
    <div className="glass relative z-10 mb-6 mt-5 grid gap-4 rounded-lg border border-rule p-4 shadow-3 md:mb-10 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small font-semibold text-ink">Build your path</p>
        <div role="tablist" aria-label="Choose a path to edit" className="flex gap-1.5">
          {paths.map((p, i) => {
            const f = futures.find((x) => x.index === i);
            return (
              <button
                key={i}
                role="tab"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className={cn("relative flex min-h-10 items-center gap-2 rounded-full border px-3 text-caption font-semibold transition-colors", active === i ? "border-ink text-ink" : "border-rule text-muted hover:text-ink")}
              >
                {active === i && <motion.span layoutId="path-tab" className="absolute inset-0 rounded-full bg-surface" transition={{ duration: 0.3, ease: EASE.smooth }} />}
                <span className="relative size-2 rounded-full" style={{ background: PATH_VAR[i] }} />
                <span className="relative tracking-[0.08em]">PATH {pathNo(i)}</span>
                <span className="relative hidden font-normal text-muted md:inline">{f?.ctx.college.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1.2fr_1fr_1.3fr] xl:items-end">
        <Combobox label="College" value={sel.collegeId} onChange={pickCollege} options={collegeOpts} searchPlaceholder="Search 120 colleges" />
        <Combobox label="Major" value={sel.majorId} onChange={(v) => void setPath(active, { majorId: v })} options={majorOpts} searchPlaceholder="Search majors" />
        {college.control === "public" ? (
          <Segmented
            label="Residency"
            value={sel.residency}
            onChange={(v) => void setPath(active, { residency: v })}
            options={[
              { value: "resident", label: `In-state (${college.state})` },
              { value: "nonresident", label: "Out-of-state" },
            ]}
          />
        ) : (
          <div className="grid gap-2">
            <p className="text-caption font-medium text-muted">Residency</p>
            <p className="flex h-11 items-center rounded-sm border border-rule px-3 text-small text-ink-2">Private: one tuition for everyone</p>
          </div>
        )}
        <GraduatedSlider label="Grant aid per year" value={sel.aid} onChange={(v) => void setPath(active, { aid: v })} min={0} max={50000} step={1000} format={moneyCompact} trace={PATH_TRACE[active]} size="sm" />
      </div>
      <div className="flex min-h-5 flex-wrap items-center justify-between gap-3" aria-live="polite">
        {loading != null ? (
          <p className="flex items-center gap-2 text-caption text-muted">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> Loading path data…
          </p>
        ) : error ? (
          <p className="text-caption text-risk">{error}</p>
        ) : (
          <p className="text-caption text-muted">Change anything: the path redraws, and every section below follows it.</p>
        )}
        <ButtonLink href="#true-cost" variant="tertiary" className="text-caption">
          Explore this path
        </ButtonLink>
      </div>
    </div>
  );
}
