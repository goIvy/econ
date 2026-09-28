"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber, useMeasuredWidth } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { SampleChip } from "@/components/ui/lineage";
import { linear, linePath, ticks } from "@/components/charts/scale";
import { runMonteCarlo, SIM_ASSUMPTIONS, type SimulationResult } from "@/lib/calc";
import { crossfade, growWidth, ledgerItem, traceDraw } from "@/lib/animations";
import { moneyCompact, pct } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { PathPicker } from "./path-picker";
import type { PathPreset } from "./data";

const END = 40;
const RUNS = 1000;
/** How long the futures take to pour in (user-started demonstration). */
const POUR_MS = 1600;
const RGB: Record<string, string> = { a: "36,86,200", b: "0,127,104", d: "122,79,181" };
const INK: Record<string, string> = { a: "var(--trace-a)", b: "var(--trace-b)", d: "var(--trace-d)" };

type Phase = "idle" | "pouring" | "settled";

/**
 * 1,000 Possible Futures. Each faint line is one future with its own
 * starting salary, job search, graduation time and cost surprises. They
 * pour onto the chart, then settle into a band and a distribution.
 */
export function PossibleFutures({ presets }: { presets: PathPreset[] }) {
  const reduce = useReducedMotion();
  const [key, setKey] = useState<PathPreset["key"]>("a");
  const preset = presets.find((p) => p.key === key)!;
  const [sim, setSim] = useState<SimulationResult | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [drawn, setDrawn] = useState(0);
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(760);
  const H = W < 520 ? 260 : 360;
  const HIST_W = W < 520 ? 56 : 110;
  const M = { t: 12, r: HIST_W + 16, b: 26, l: 56 };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);

  const run = () => {
    // Rows run through the end of age END-1, so the last value is the position at exactly 40.
    const s = runMonteCarlo(preset.inputs, preset.ctx, { runs: RUNS, horizonAge: END - 1, seed: 20240918 + Math.floor(Math.random() * 1e6) });
    setSim(s);
    setDrawn(0);
    setPhase(reduce ? "settled" : "pouring");
  };
  const clear = () => {
    setSim(null);
    setPhase("idle");
  };

  // scales
  const all = sim ? [sim.bands.p10, sim.bands.p90, sim.baseline].flat() : [0, 1];
  const lo = sim ? Math.min(0, sim.finals[Math.floor(RUNS * 0.01)], ...all) : -150000;
  const hi = sim ? Math.max(sim.finals[Math.floor(RUNS * 0.99)], ...all) : 1500000;
  const x = linear([18, END], [M.l, W - M.r]);
  const y = linear([lo * 1.1, hi * 1.05], [H - M.b, M.t]);

  // Pour the futures onto the canvas, a few per frame.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !sim) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    const settled = phase === "settled";
    ctx.strokeStyle = `rgba(${RGB[key]},${settled ? 0.035 : 0.07})`;
    const drawRun = (s: Float64Array) => {
      ctx.beginPath();
      for (let k = 0; k < sim.ages.length && sim.ages[k] + 1 <= END; k++) {
        const px = x(sim.ages[k] + 1);
        const py = y(s[k]);
        if (k === 0) {
          ctx.moveTo(x(18), y(0));
          ctx.lineTo(px, py);
        } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };
    if (phase !== "pouring") {
      for (const s of sim.runs) drawRun(s);
      return;
    }
    let i = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const target = Math.min(RUNS, Math.ceil(((t - t0) / POUR_MS) * RUNS));
      for (; i < target; i++) drawRun(sim.runs[i]);
      setDrawn(i);
      if (i < RUNS) raf.current = requestAnimationFrame(tick);
      else setPhase("settled");
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, phase, W, H, key]);

  // Histogram of outcomes at 40 (the distribution the futures settle into).
  const bins = 24;
  const hist = (() => {
    if (!sim) return [];
    const [a, b] = [lo * 1.1, hi * 1.05];
    const counts = new Array(bins).fill(0);
    for (const v of sim.finals) counts[Math.min(bins - 1, Math.max(0, Math.floor(((v - a) / (b - a)) * bins)))]++;
    const max = Math.max(...counts);
    return counts.map((c, i) => ({ c, share: c / max, y0: y(a + ((i + 1) / bins) * (b - a)), y1: y(a + (i / bins) * (b - a)) }));
  })();

  const band = sim ? areaPathBand(sim, x, y) : "";
  const median = sim ? linePath(seriesPts(sim, sim.bands.p50, x, y)) : "";
  const base = sim ? linePath(seriesPts(sim, sim.baseline, x, y)) : "";
  const settled = phase === "settled" && sim;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PathPicker presets={presets} value={key} onChange={(k) => { setKey(k); clear(); }} label="Simulation path" />
        <SampleChip />
      </div>

      <div className="grid gap-6 rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6 lg:grid-cols-12">
        <div className="grid min-w-0 content-start gap-3 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-small font-semibold text-ink">Cumulative net value, age 18 to 40</p>
            <p className="tabular text-caption text-muted" aria-live="polite">
              {phase === "pouring" ? `${drawn} of ${RUNS} futures` : sim ? `${RUNS} futures` : "Not run yet"}
            </p>
          </div>
          <div ref={ref} className="relative min-w-0" style={{ height: H }}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 block max-w-full" aria-hidden>
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
            </svg>
            <canvas ref={canvasRef} className="absolute inset-0 max-w-full" style={{ width: W, height: H }} aria-hidden />
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 block max-w-full" role="img" aria-label={sim ? `${RUNS} simulated futures. Median at 40: ${moneyCompact(sim.median)}. 10th to 90th percentile: ${moneyCompact(sim.downside)} to ${moneyCompact(sim.upside)}. ${pct(sim.recoverWithin10 * 100)} pass the no-college path within 10 years of graduating.` : "No simulation run yet."}>
              <AnimatePresence>
                {settled && (
                  <motion.g key={`s-${sim.median}`} initial="hidden" animate="visible" exit="hidden">
                    <motion.path d={band} variants={crossfade} fill={INK[key]} fillOpacity={0.14} />
                    <motion.path d={base} variants={crossfade} fill="none" stroke="var(--trace-c)" strokeWidth={1.75} strokeDasharray="6 4" />
                    <motion.path d={median} variants={traceDraw} custom={0} fill="none" stroke={INK[key]} strokeWidth={2.5} />
                    {hist.map((h, i) => (
                      <motion.rect key={i} x={W - M.r + 10} y={h.y0 + 0.5} height={Math.max(0, h.y1 - h.y0 - 1)} rx={1.5} fill={INK[key]} fillOpacity={0.55} variants={growWidth} custom={h.share * (HIST_W - 4)} />
                    ))}
                    <text x={W - M.r + 10} y={M.t + 4} className="fill-muted text-[11px]">
                      At 40
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </svg>
            <AnimatePresence>
              {phase === "idle" && (
                <motion.div key="cta" variants={crossfade} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 grid place-items-center">
                  <div className="grid justify-items-center gap-3 rounded-md border border-rule bg-surface/95 p-5 text-center shadow-2">
                    <p className="max-w-[26ch] text-small text-ink-2">One path, a thousand ways it could go.</p>
                    <Button onClick={run} size="lg" className="gap-2">
                      <Play className="size-4" aria-hidden /> Run simulation
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-2">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-[2px]" style={{ background: INK[key], opacity: 0.25 }} aria-hidden />10th–90th percentile</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4" style={{ background: INK[key] }} aria-hidden />Median future</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-dashed border-trace-c" aria-hidden />C: working from 18</span>
          </p>
        </div>

        <div className="grid content-start gap-5 lg:col-span-4">
          <dl className="grid grid-cols-2 gap-4">
            <Stat label="Median outcome at 40" value={sim && settled ? sim.median : null} strong />
            <Stat label="Chance of recovering college cost within 10 years" value={sim && settled ? sim.recoverWithin10 * 100 : null} fmt={(v) => pct(v)} />
            <Stat label="Downside (10th percentile)" value={sim && settled ? sim.downside : null} />
            <Stat label="Upside (90th percentile)" value={sim && settled ? sim.upside : null} />
          </dl>
          <AnimatePresence>
            {settled && (
              <motion.p key="exp" variants={ledgerItem} initial="hidden" animate="visible" exit="exit" className="text-small text-ink-2">
                In {pct(sim.recoverWithin10 * 100)} of futures this path passes the no-college path within 10 years of graduating; in {pct(sim.neverRecover * 100)} it hasn&apos;t by 40. That spread is the risk.
              </motion.p>
            )}
          </AnimatePresence>
          <div className="grid gap-2 border-t border-rule pt-4">
            <p className="text-caption font-semibold text-ink">What varies in each future</p>
            <ul className="grid gap-1.5 text-caption text-ink-2">
              <li>Starting salary: log-normal fitted to this program&apos;s 10th, 50th and 90th percentiles</li>
              <li>Job search: about {SIM_ASSUMPTIONS.jobSearchMeanMonths} months on average, up to a year</li>
              <li>Graduation time: 4, 5 or 6 years, from the college&apos;s 4- and 6-year rates</li>
              <li>Costs: tuition and living costs vary about ±{Math.round(SIM_ASSUMPTIONS.costSd * 100)}%</li>
            </ul>
            <p className="text-caption text-muted">{SIM_ASSUMPTIONS.note}</p>
          </div>
          {sim && (
            <Button variant="secondary" onClick={run} disabled={phase === "pouring"} className="justify-self-start gap-2">
              <RotateCcw className="size-4" aria-hidden /> Run again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Year-end values as points: row k is the value at the end of age ages[k], starting from 0 at 18. */
function seriesPts(sim: SimulationResult, s: number[], x: (v: number) => number, y: (v: number) => number): Array<[number, number]> {
  const out: Array<[number, number]> = [[x(18), y(0)]];
  s.forEach((v, k) => {
    if (sim.ages[k] + 1 <= END) out.push([x(sim.ages[k] + 1), y(v)]);
  });
  return out;
}

function areaPathBand(sim: SimulationResult, x: (v: number) => number, y: (v: number) => number) {
  const top = seriesPts(sim, sim.bands.p90, x, y);
  const bottom = seriesPts(sim, sim.bands.p10, x, y).reverse();
  return `${linePath(top)}${bottom.map(([px, py]) => `L${px.toFixed(1)},${py.toFixed(1)}`).join("")}Z`;
}

function Stat({ label, value, fmt = moneyCompact, strong }: { label: string; value: number | null; fmt?: (v: number) => string; strong?: boolean }) {
  return (
    <div className="grid content-start gap-1">
      <dt className="text-caption text-muted">{label}</dt>
      <dd className={strong ? "text-h2 font-semibold tracking-[-0.02em] text-ink" : "text-h3 font-semibold text-ink"}>{value == null ? <span className="text-muted">—</span> : <AnimatedNumber value={value} format={fmt} />}</dd>
    </div>
  );
}
