"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
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
const RGB = ["108,124,255", "22,164,140", "146,119,242"];

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
    const rgb = RGB[f.index] ?? RGB[0];
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

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="grid min-w-0 gap-3 rounded-lg border border-rule bg-surface p-4 shadow-3 sm:p-6 lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-caption font-bold tracking-[0.12em] text-ink">
            <span className="size-2 rounded-full" style={{ background: color }} />
            YOUR PATH <span className="font-medium tracking-normal text-muted">{f.label}</span>
          </p>
          <p className="text-caption font-bold tracking-[0.14em] text-muted" aria-live="polite">
            {stage === "idle" ? "READY" : stage === "complete" ? `${RUNS.toLocaleString()} FUTURES` : "SIMULATING…"}
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
                  <text x={W - M.r + 10} y={M.t + 4} className="fill-muted text-[10px] font-bold tracking-[0.12em]">
                    AT 40
                  </text>
                </motion.g>
              )}
            </AnimatePresence>
          </svg>
          <AnimatePresence>
            {stage === "idle" && (
              <motion.div key="cta" className="absolute inset-0 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: DUR.fast } }}>
                <Button size="lg" onClick={run} className="gap-2 shadow-3">
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

      <div className="grid content-start gap-5 lg:col-span-4">
        {done ? (
          <dl className="grid gap-4">
            <Stat label="Typical outcome by 40" value={sim.median} fmt={moneyCompact} big />
            <div className="grid gap-1">
              <dt className="text-caption font-semibold text-ink-2">Likely range (middle half)</dt>
              <dd className="tabular text-h2 font-bold text-ink">{`${moneyCompact(sim.q25)} – ${moneyCompact(sim.q75)}`}</dd>
            </div>
            <Stat label="Chance of breaking even within 10 years" value={sim.recoverWithin10 * 100} fmt={(v) => pct(v)} big />
          </dl>
        ) : (
          <div className="grid gap-3 rounded-md border border-dashed border-rule-strong p-5">
            <p className="text-small font-semibold text-ink">{stage === "idle" ? "Press Run simulation to see:" : "Simulating 1,000 futures…"}</p>
            <ul className="grid gap-1.5 text-small text-ink-2">
              <li>· The typical outcome by age 40</li>
              <li>· The likely range of outcomes</li>
              <li>· The chance college pays for itself within 10 years</li>
            </ul>
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
        <details className="group rounded-md border border-rule bg-surface p-4 text-caption text-ink-2">
          <summary className="cursor-pointer list-none font-semibold text-ink marker:hidden">
            What changes in each future? <span className="text-muted group-open:hidden">Show</span>
          </summary>
          <ul className="mt-3 grid gap-1.5">
            <li>Starting salary and raises, drawn from this program&apos;s pay range (10th–90th percentile)</li>
            <li>Time to find a first job: about {SIM_ASSUMPTIONS.jobSearchMeanMonths} months on average</li>
            <li>Graduating in 4, 5 or 6 years, from the college&apos;s rates</li>
            <li>Costs and living costs: about ±{Math.round(SIM_ASSUMPTIONS.costSd * 100)}%; debt follows</li>
          </ul>
          {done && <p className="mt-2">Lowest 10%: {moneyCompact(sim.downside)} · Highest 10%: {moneyCompact(sim.upside)} by 40.</p>}
          <p className="mt-2 text-muted">{SIM_ASSUMPTIONS.note}</p>
        </details>
      </div>
    </div>
  );
}

function Stat({ label, value, fmt, big }: { label: string; value: number | null; fmt: (v: number) => string; big?: boolean }) {
  return (
    <div className="grid gap-1">
      <dt className="text-caption font-semibold text-ink-2">{label}</dt>
      <dd className={cn("font-bold text-ink", big ? "text-h2" : "text-h3")}>{value == null ? <span className="text-muted">—</span> : <AnimatedNumber value={value} format={fmt} />}</dd>
    </div>
  );
}
