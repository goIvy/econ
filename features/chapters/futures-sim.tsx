"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, Plus, RotateCcw } from "@/components/ui/icons";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber, useMeasuredWidth } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { SampleChip } from "@/components/ui/lineage";
import { DataKindChip } from "@/components/ui/data-kind";
import { linear, linePath, ticks } from "@/components/charts/scale";
import { runMonteCarlo, SIM_ASSUMPTIONS, type SimulationResult } from "@/lib/calc";
import { DUR, EASE } from "@/lib/animations";
import { moneyCompact, pct } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { HORIZON, PATH_VAR, useScenario } from "@/features/scenario/store";

const RUNS = 1000;
/** Stage timings (ms). */
const T = { starting: 450, running: 2000, settling: 900 };
type Stage = "idle" | "starting" | "running" | "settling" | "complete";
const TRACE = ["--trace-a", "--trace-b", "--trace-d"];

/** The path's trace colour as "r,g,b", read from the live theme for the canvas. */
function traceRgb(el: Element, index: number) {
  const hex = getComputedStyle(el).getPropertyValue(TRACE[index] ?? TRACE[0]).trim().replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
  return Number.isFinite(n) ? `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}` : "212,88,31";
}

/**
 * 1,000 POSSIBLE FUTURES. idle → starting (particles gather at 18) →
 * running (all futures draw forward together) → settling (lines fade into a
 * band) → complete (distribution and odds). Canvas, not 1,000 DOM nodes.
 */
export function FuturesSim() {
  const { futures, baselineSeries } = useScenario();
  const f = futures.find((x) => x.index === 0)!;
  const reduce = useReducedMotion();
  const [sim, setSim] = useState<SimulationResult | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(900);
  const H = W < 560 ? 280 : 400;
  const HIST = W < 560 ? 48 : 96;
  const M = { t: 16, r: HIST + 18, b: 28, l: 56 };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const [key, setKey] = useState(f.label);
  if (key !== f.label) {
    // Active path changed: the old futures no longer apply.
    setKey(f.label);
    setSim(null);
    setStage("idle");
  }

  const runCount = useRef(1);
  const run = () => {
    // Rows end at age HORIZON-1, so the final value is the position at exactly 40.
    const s = runMonteCarlo(
      { collegeId: f.sel.collegeId, majorId: f.sel.majorId, residency: f.ctx.college.control === "public" ? f.sel.residency : "resident", living: f.sel.living, yearsToGraduate: 4, funding: { aidPerYear: f.sel.aid, scholarshipsPerYear: 0, familyPerYear: 10000, workPerYear: 3000, savings: 0 } },
      f.ctx,
      { runs: RUNS, horizonAge: HORIZON - 1, seed: (runCount.current += 7919) },
    );
    setSim(s);
    if (reduce) return setStage("complete");
    setStage("starting");
  };

  // Advance through the stages.
  useEffect(() => {
    if (stage === "starting") {
      const t = setTimeout(() => setStage("running"), T.starting);
      return () => clearTimeout(t);
    }
    if (stage === "settling") {
      const t = setTimeout(() => setStage("complete"), T.settling);
      return () => clearTimeout(t);
    }
  }, [stage]);

  const lo = sim ? Math.min(0, sim.finals[Math.floor(RUNS * 0.01)], ...sim.bands.p10, ...baselineSeries) * 1.1 : Math.min(0, ...f.series) * 1.2;
  const hi = sim ? Math.max(sim.finals[Math.floor(RUNS * 0.99)], ...baselineSeries) * 1.05 : Math.max(...f.series, ...baselineSeries) * 1.6;
  const x = linear([18, HORIZON], [M.l, W - M.r]);
  const y = linear([lo, hi], [H - M.b, M.t]);

  // Canvas: particles, then all futures drawing forward, then fading.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!sim || stage === "idle") return;
    const rgb = traceRgb(cv, f.index);
    const pts = (s: Float64Array, upTo: number) => {
      ctx.beginPath();
      ctx.moveTo(x(18), y(0));
      for (let k = 0; k < s.length && sim.ages[k] + 1 <= upTo; k++) ctx.lineTo(x(sim.ages[k] + 1), y(s[k]));
      const last = Math.floor(upTo - 18) - 1;
      if (last >= 0 && last + 1 < s.length && upTo % 1) {
        const a = s[last], b = s[last + 1];
        ctx.lineTo(x(upTo), y(a + (b - a) * (upTo % 1)));
      }
      ctx.stroke();
    };
    const t0 = performance.now();
    const frame = (t: number) => {
      const e = t - t0;
      ctx.clearRect(0, 0, W, H);
      if (stage === "starting") {
        // particles gather at the starting point
        const p = Math.min(1, e / T.starting);
        ctx.fillStyle = `rgba(${rgb},${0.5 * p})`;
        for (let i = 0; i < 140; i++) {
          const ang = (i / 140) * Math.PI * 2;
          const r = (1 - p) * 60 + 3 * Math.sin(i * 12.9);
          ctx.beginPath();
          ctx.arc(x(18) + Math.cos(ang) * r, y(0) + Math.sin(ang) * r, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const p = stage === "running" ? Math.min(1, e / T.running) : 1;
        const eased = 1 - Math.pow(1 - p, 3);
        const fade = stage === "settling" ? 1 - Math.min(1, e / T.settling) * 0.75 : stage === "complete" ? 0.25 : 1;
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(${rgb},${0.06 * fade})`;
        const upTo = 18 + eased * (HORIZON - 18);
        for (const s of sim.runs) pts(s, upTo);
        if (stage === "running" && p >= 1) {
          setStage("settling");
          return;
        }
      }
      if (stage !== "complete") raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, stage, W, H]);

  const done = stage === "complete" && sim;
  const seriesPts = (s: number[]) => {
    const out: Array<[number, number]> = [[x(18), y(0)]];
    s.forEach((v, k) => sim && sim.ages[k] + 1 <= HORIZON && out.push([x(sim.ages[k] + 1), y(v)]));
    return out;
  };
  const band = (a: number[], b: number[]) => `${linePath(seriesPts(b))}${seriesPts(a).reverse().map(([px, py]) => `L${px.toFixed(1)},${py.toFixed(1)}`).join("")}Z`;
  const bins = 26;
  const hist = sim
    ? (() => {
        const counts = new Array(bins).fill(0);
        for (const v of sim.finals) counts[Math.min(bins - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo)) * bins)))]++;
        const max = Math.max(...counts);
        return counts.map((c, i) => ({ share: c / max, y0: y(lo + ((i + 1) / bins) * (hi - lo)), y1: y(lo + (i / bins) * (hi - lo)) }));
      })()
    : [];
  const color = PATH_VAR[f.index];
  const status = stage === "idle" ? "Ready" : stage === "complete" ? "Complete" : stage === "settling" ? "Settling" : "Running";

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="bezel min-w-0 lg:col-span-8">
      <div className="bezel-core grid min-w-0 gap-3 p-4 sm:p-6">
        {/* telemetry strip */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-dashed border-rule-strong pb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
          <p className="flex items-center gap-2 text-ink">
            <span className="size-2 rounded-full" style={{ background: color }} />
            Sim/{f.label}
          </p>
          <p className="tabular flex gap-4">
            <span>
              Runs <data value={RUNS} className="text-ink">{RUNS.toLocaleString()}</data>
            </span>
            <span className="hidden sm:inline">
              Ages <span className="text-ink">18-{HORIZON}</span>
            </span>
            <span>
              Status{" "}
              <output aria-live="polite" className={cn("text-ink", stage !== "idle" && stage !== "complete" && "text-accent-ink")}>
                {status}
              </output>
            </span>
          </p>
        </div>
        <div ref={ref} className="relative min-w-0" style={{ height: H }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 block max-w-full" aria-hidden>
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
            {/* idle: the single projected path, muted */}
            <AnimatePresence>
              {stage === "idle" && (
                <motion.path key="idle" d={linePath(f.series.map((v, i) => [x(18 + i), y(v)]))} fill="none" stroke={color} strokeOpacity={0.45} strokeWidth={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              )}
            </AnimatePresence>
            <path d={linePath(baselineSeries.map((v, i) => [x(18 + i), y(v)]))} fill="none" stroke="var(--trace-c)" strokeWidth={1.5} strokeDasharray="6 4" />
          </svg>
          <canvas ref={canvasRef} className="absolute inset-0 max-w-full" style={{ width: W, height: H }} aria-hidden />
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 block max-w-full" role="img" aria-label={done ? `${RUNS} simulated futures. Median at 40 ${moneyCompact(sim.median)}; middle half ${moneyCompact(sim.q25)} to ${moneyCompact(sim.q75)}; ${pct(sim.recoverWithin10 * 100)} break even within 10 years of graduating.` : "Simulation not run yet."}>
            <AnimatePresence>
              {(stage === "settling" || done) && sim && (
                <motion.g key="dist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.large }}>
                  <path d={band(sim.bands.p10, sim.bands.p90)} fill={color} fillOpacity={0.1} />
                  <path d={band(sim.bands.p25, sim.bands.p75)} fill={color} fillOpacity={0.22} />
                  <motion.path d={linePath(seriesPts(sim.bands.p50))} fill="none" stroke={color} strokeWidth={2.5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: DUR.hero, ease: EASE.smooth }} />
                  {hist.map((h, i) => (
                    <motion.rect key={i} x={W - M.r + 10} y={h.y0 + 0.5} height={Math.max(0, h.y1 - h.y0 - 1)} rx={1.5} fill={color} fillOpacity={0.6} initial={{ width: 0 }} animate={{ width: h.share * (HIST - 4) }} transition={{ duration: DUR.large, ease: EASE.smooth, delay: 0.2 + i * 0.012 }} />
                  ))}
                  <text x={W - M.r + 10} y={M.t + 4} className="fill-muted font-mono text-[10px] tracking-[0.1em]">
                    AT 40
                  </text>
                </motion.g>
              )}
            </AnimatePresence>
          </svg>
          <AnimatePresence>
            {stage === "idle" && (
              <motion.div key="cta" className="absolute inset-0 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: DUR.fast } }}>
                <Button size="lg" onClick={run} className="gap-2 shadow-3 ring-8 ring-surface">
                  <Play className="size-4" aria-hidden /> Run simulation
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-2">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-[2px]" style={{ background: color, opacity: 0.4 }} />Middle 50%</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-[2px]" style={{ background: color, opacity: 0.15 }} />Most futures (80%)</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4" style={{ background: color }} />Typical</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-dashed border-trace-c" />Work from 18</span>
          <SampleChip className="ml-auto" />
        </p>
      </div>
      </div>

      <div className="grid content-start gap-5 lg:col-span-4">
        {done ? (
          <dl className="grid divide-y divide-dashed divide-rule-strong border-y border-rule-strong">
            <Stat code="01" label="Typical outcome by 40" value={sim.median} fmt={moneyCompact} />
            <div className="grid gap-1.5 py-4">
              <dt className="flex gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                <span className="text-accent-ink">02</span>Likely range, middle half
              </dt>
              <dd className="tabular text-h2 font-semibold tracking-[-0.03em] text-ink">
                <data value={sim.q25}>{moneyCompact(sim.q25)}</data> to <data value={sim.q75}>{moneyCompact(sim.q75)}</data>
              </dd>
            </div>
            <Stat code="03" label="Pays off within 10 years" value={sim.recoverWithin10 * 100} fmt={(v) => pct(v)} />
          </dl>
        ) : (
          <div className="grid gap-3 border-y border-dashed border-rule-strong py-5">
            <p className="text-small font-medium text-ink">{stage === "idle" ? "Run the simulation to see:" : "Simulating 1,000 futures…"}</p>
            <ol className="grid gap-2 text-small text-ink-2">
              {["The typical outcome by age 40", "The likely range of outcomes", "The chance college pays for itself within 10 years"].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="tabular font-mono text-[11px] leading-5 text-accent-ink">0{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        )}
        <p className="flex items-center gap-2 text-caption text-muted">
          <DataKindChip kind="simulated" /> Total money earned minus costs, across {RUNS.toLocaleString()} futures.
        </p>
        <AnimatePresence>
          {done && (
            <motion.p key="ex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-small text-ink-2">
              Half of these futures end between {moneyCompact(sim.q25)} and {moneyCompact(sim.q75)} by age 40. In {pct(sim.recoverWithin10 * 100)} of them, college has paid for itself within 10 years of graduating.
            </motion.p>
          )}
        </AnimatePresence>
        {sim && stage === "complete" && (
          <Button variant="secondary" onClick={run} className={cn("justify-self-start gap-2")}>
            <RotateCcw className="size-4" aria-hidden /> Run again
          </Button>
        )}
        <details className="group border-b border-rule pb-4 text-caption text-ink-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-small font-medium text-ink marker:hidden [&::-webkit-details-marker]:hidden">
            What changes in each future?
            <span className="grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-rule transition-transform duration-500 ease-[var(--ease-premium)] group-open:rotate-45">
              <Plus className="size-3.5" aria-hidden />
            </span>
          </summary>
          <ul className="mt-3 grid gap-1.5">
            <li>Starting salary and raises, drawn from this program&apos;s pay range (10th-90th percentile)</li>
            <li>Time to find a first job: about {SIM_ASSUMPTIONS.jobSearchMeanMonths} months on average</li>
            <li>Graduating in 4, 5 or 6 years, from the college&apos;s rates</li>
            <li>Costs and living costs: about ±{Math.round(SIM_ASSUMPTIONS.costSd * 100)}%; debt follows</li>
          </ul>
          {done && <p className="mt-2">By 40, the lowest 10% end below {moneyCompact(sim.downside)} and the highest 10% above {moneyCompact(sim.upside)}.</p>}
          <p className="mt-2 text-muted">{SIM_ASSUMPTIONS.note}</p>
        </details>
      </div>
    </div>
  );
}

function Stat({ code, label, value, fmt }: { code: string; label: string; value: number | null; fmt: (v: number) => string }) {
  return (
    <div className="grid gap-1.5 py-4">
      <dt className="flex gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
        <span className="text-accent-ink">{code}</span>
        {label}
      </dt>
      <dd className="tabular text-[clamp(2rem,3.2vw,2.6rem)] font-semibold leading-none tracking-[-0.04em] text-ink">
        {value == null ? <span className="text-muted">n/a</span> : <data value={value}><AnimatedNumber value={value} format={fmt} /></data>}
      </dd>
    </div>
  );
}
