"use client";

import { motion, useInView } from "framer-motion";
import { UserRound } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useMemo, useRef, useState } from "react";
import { useMeasuredWidth } from "@/components/motion";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { Segmented } from "@/components/ui/segmented";
import { crossfade, microSpring, revealViewport, traceDraw, valueTween } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { MajorRowData } from "./data";

const H = 310;
const PAD = { l: 16, r: 16, t: 78, b: 40 };
/** The graduate rides a track above the labels, with a stem down to the curve. */
const TRACK_Y = 6;
const X_MAX = 200000;

/** Standard normal CDF (Abramowitz–Stegun) to turn a salary into a percentile. */
function normCdf(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/**
 * Salary distribution explorer. A graduate marker walks the curve: hover,
 * drag (touch too), arrow keys or the percentile buttons move it, and the
 * readout says where that salary falls. Lognormal fitted to five published
 * percentiles, labeled as such.
 */
export function SalaryDistribution({ majors }: { majors: MajorRowData[] }) {
  const [id, setId] = useState(majors[0].id);
  const m = majors.find((x) => x.id === id)!;
  const [salary, setSalary] = useState(m.early.p50);
  const [dragging, setDragging] = useState(false);
  const reduce = useReducedMotion();
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(720);
  const viewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(viewRef, revealViewport);

  const mu = Math.log(m.early.p50);
  const sigma = Math.log(m.early.p90 / m.early.p50) / 1.2816;
  const innerW = width - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const sx = (v: number) => PAD.l + (v / X_MAX) * innerW;
  const pdf = (v: number) => {
    const z = (Math.log(v) - mu) / sigma;
    return Math.exp((-z * z) / 2) / (v * sigma * Math.sqrt(2 * Math.PI));
  };

  const { d, area, peak } = useMemo(() => {
    const pts: Array<[number, number]> = [];
    let peak = 0;
    for (let i = 1; i <= 160; i++) {
      const v = (i / 160) * X_MAX;
      const y = pdf(v);
      peak = Math.max(peak, y);
      pts.push([v, y]);
    }
    const sy = (y: number) => PAD.t + innerH - (y / peak) * innerH * 0.92;
    const d = pts.map(([v, y], i) => `${i ? "L" : "M"}${sx(v).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
    const area = `${d} L${sx(X_MAX).toFixed(1)},${PAD.t + innerH} L${sx(pts[0][0]).toFixed(1)},${PAD.t + innerH} Z`;
    return { d, area, peak };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mu, sigma, width]);
  const sy = (v: number) => PAD.t + innerH - (pdf(v) / peak) * innerH * 0.92;

  const pctile = Math.max(1, Math.min(99, Math.round(normCdf((Math.log(salary) - mu) / sigma) * 100)));
  const percentiles: Array<[string, number]> = [["10th", m.early.p10], ["25th", m.early.p25], ["Median", m.early.p50], ["75th", m.early.p75], ["90th", m.early.p90]];

  const fromPointer = (e: React.PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * width;
    setSalary(Math.round(Math.min(X_MAX * 0.98, Math.max(12000, ((px - PAD.l) / innerW) * X_MAX)) / 500) * 500);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setSalary((s) => Math.min(X_MAX * 0.98, Math.max(12000, s + (e.key === "ArrowRight" ? 2500 : -2500))));
    }
  };

  const options = majors.slice(0, 5).map((x) => ({ value: x.id, label: x.name.replace("Mechanical Engineering", "Mech. Eng.").replace("Computer Science", "Comp. Sci.") }));
  const markerX = sx(salary);
  const markerY = sy(salary);
  const markerTr = dragging || reduce ? { duration: 0 } : ({ type: "spring", stiffness: 260, damping: 30 } as const);

  return (
    <div className="rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <Segmented
          label="Major"
          value={id}
          onChange={(v) => {
            setId(v);
            setSalary(majors.find((x) => x.id === v)!.early.p50);
          }}
          options={options}
          size="sm"
          wrap
          className="w-full md:w-auto md:min-w-[34rem]"
        />
        <div className="flex items-center gap-2">
          <SampleChip />
          <SourceFootnote metric={`${m.name} early-career earnings`} lineage={m.lineage} n={1} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        <div ref={viewRef} className="min-w-0">
          <div ref={ref} className="relative min-w-0">
            <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} className="block max-w-full" role="group" aria-roledescription="chart" aria-label={`Estimated distribution of early-career earnings for ${m.name}. Median ${money(m.early.p50)}; half of graduates earn between ${money(m.early.p25)} and ${money(m.early.p75)}.`}>
              <motion.rect initial={false} animate={{ x: sx(m.early.p25), width: sx(m.early.p75) - sx(m.early.p25) }} transition={valueTween(reduce)} y={PAD.t} height={innerH} fill="color-mix(in srgb, var(--ink) 6%, transparent)" />
              <motion.path key={`area-${id}`} d={area} variants={crossfade} initial="hidden" animate={inView || reduce ? "visible" : "hidden"} fill="var(--ink)" fillOpacity={0.06} />
              <motion.path key={`line-${id}`} d={d} variants={traceDraw} custom={0} initial={reduce ? "visible" : "hidden"} animate={inView || reduce ? "visible" : "hidden"} fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />
              <line x1={PAD.l} x2={PAD.l + innerW} y1={PAD.t + innerH} y2={PAD.t + innerH} stroke="var(--rule-strong)" />
              {[0, 50000, 100000, 150000, 200000].map((t) => (
                <text key={t} x={sx(t)} y={H - 18} textAnchor={t === 0 ? "start" : t === X_MAX ? "end" : "middle"} className="tabular fill-muted text-[11px]">
                  {moneyCompact(t)}
                </text>
              ))}
              <text x={PAD.l + innerW} y={H - 3} textAnchor="end" className="fill-muted text-[11px]">
                Annual earnings, ages 22–27
              </text>
              {percentiles.map(([label, v], i) => {
                const median = label === "Median";
                return (
                  <motion.g key={label} initial={false} animate={{ x: sx(v) }} transition={valueTween(reduce)}>
                    <line x1={0} x2={0} y1={PAD.t + (median ? 0 : 30)} y2={PAD.t + innerH} stroke={median ? "var(--ink)" : "var(--ink-2)"} strokeWidth={median ? 1.5 : 1} strokeDasharray={median ? undefined : "2 3"} />
                    {(median || width >= 560) && (
                      <text x={0} y={PAD.t + (median ? -6 : 24) - (i % 2 && !median ? 12 : 0)} textAnchor="middle" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke" className={median ? "fill-ink text-[12px] font-semibold" : "fill-ink-2 text-[11px] font-medium"}>
                        {label}
                      </text>
                    )}
                  </motion.g>
                );
              })}

              {/* the graduate */}
              <motion.g initial={false} animate={{ x: markerX }} transition={markerTr} pointerEvents="none">
                <motion.line x1={0} x2={0} y1={TRACK_Y + 26} initial={false} animate={{ y2: markerY }} transition={markerTr} stroke="var(--trace-a)" strokeWidth={1.5} />
                <motion.circle r={5} cx={0} initial={false} animate={{ cy: markerY }} transition={markerTr} fill="var(--trace-a)" stroke="var(--surface)" strokeWidth={2} />
                <g transform={`translate(-13,${TRACK_Y})`}>
                  <rect width={26} height={26} rx={13} fill="var(--trace-a)" />
                  <foreignObject width={26} height={26}>
                    <div className="grid size-[26px] place-items-center text-on-ink">
                      <UserRound className="size-4" aria-hidden />
                    </div>
                  </foreignObject>
                </g>
              </motion.g>

              <rect
                x={PAD.l}
                y={PAD.t}
                width={innerW}
                height={innerH}
                fill="transparent"
                data-cursor="EXPLORE"
                className="cursor-ew-resize touch-pan-y outline-none focus-visible:[outline:2px_solid_var(--trace-a)]"
                onPointerMove={(e) => (e.pointerType === "mouse" || dragging) && fromPointer(e)}
                onPointerDown={(e) => {
                  setDragging(true);
                  e.currentTarget.setPointerCapture(e.pointerId);
                  fromPointer(e);
                }}
                onPointerUp={() => setDragging(false)}
                onPointerCancel={() => setDragging(false)}
                tabIndex={0}
                role="slider"
                aria-label="Move the graduate along the salary distribution"
                aria-valuemin={0}
                aria-valuemax={X_MAX}
                aria-valuenow={Math.round(salary)}
                aria-valuetext={`${money(salary)}, about the ${ordinal(pctile)} percentile`}
                onKeyDown={onKey}
              />
            </svg>
          </div>
        </div>

        <div className="grid content-start gap-3 rounded-md bg-surface-sunk p-4" aria-live="polite">
          <p className="tabular text-caption font-bold tracking-[0.14em] text-trace-a">{ordinal(pctile).toUpperCase()} PERCENTILE</p>
          <p className="tabular text-metric font-extrabold text-ink">{money(salary)}</p>
          <p className="text-small text-ink-2">
            Estimated salary. More than {pctile}% of recent {m.name.toLowerCase()} graduates earn less; {100 - pctile}% earn more.
          </p>
          <div className="grid gap-1.5" role="group" aria-label="Jump to an outcome">
            {([["Lower outcome", m.early.p10, "10th percentile"], ["Typical outcome", m.early.p50, "Median"], ["Higher outcome", m.early.p90, "90th percentile"]] as Array<[string, number, string]>).map(([label, v, sub]) => (
              <motion.button key={label} type="button" whileTap={{ scale: 0.97 }} transition={microSpring} onClick={() => setSalary(v)} className={cn("flex min-h-11 items-center justify-between gap-2 rounded-sm border px-3 text-left text-caption", Math.abs(salary - v) < 300 ? "border-ink bg-ink text-on-ink" : "border-rule-strong bg-surface text-ink hover:border-ink")}>
                <span>
                  <span className="block font-semibold">{label}</span>
                  <span className="opacity-70">{sub}</span>
                </span>
                <span className="tabular font-bold">{moneyCompact(v)}</span>
              </motion.button>
            ))}
          </div>
          <p className="text-caption text-muted">Not good or bad outcomes: the same degree leads to different jobs, cities and choices.</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-5 gap-2 border-t border-rule pt-4">
        {percentiles.map(([label, v]) => (
          <div key={label} className="grid gap-0.5">
            <dt className="text-caption text-muted">{label}</dt>
            <dd className="tabular text-small font-semibold text-ink sm:text-base">{moneyCompact(v)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-small text-ink-2">
        Half of recent {m.name.toLowerCase()} graduates earn between {money(m.early.p25)} and {money(m.early.p75)}. One in ten earns less than {money(m.early.p10)}. The curve is a smooth fit to these five published points.
      </p>
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
