"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { Segmented } from "@/components/ui/segmented";
import { easeOutExpo, revealViewport } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import type { MajorRowData } from "./data";

const W = 720;
const H = 260;
const PAD = { l: 16, r: 16, t: 20, b: 40 };
const X_MAX = 200000;

/** Standard normal CDF (Abramowitz–Stegun) to turn a salary into a percentile. */
function normCdf(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/**
 * Lognormal density fitted to the major's percentiles. The curve is a smooth
 * reading of five published points, labeled as such.
 */
export function SalaryDistribution({ majors }: { majors: MajorRowData[] }) {
  const [id, setId] = useState(majors[0].id);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, revealViewport);
  const [width, setWidth] = useState(W);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(300, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const m = majors.find((x) => x.id === id)!;
  const mu = Math.log(m.early.p50);
  const sigma = Math.log(m.early.p90 / m.early.p50) / 1.2816;
  const innerW = width - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const sx = (v: number) => PAD.l + (v / X_MAX) * innerW;

  const { d, area } = useMemo(() => {
    const pts: Array<[number, number]> = [];
    let peak = 0;
    for (let i = 1; i <= 160; i++) {
      const v = (i / 160) * X_MAX;
      const z = (Math.log(v) - mu) / sigma;
      const y = Math.exp((-z * z) / 2) / (v * sigma * Math.sqrt(2 * Math.PI));
      peak = Math.max(peak, y);
      pts.push([v, y]);
    }
    const sy = (y: number) => PAD.t + innerH - (y / peak) * innerH * 0.92;
    const d = pts.map(([v, y], i) => `${i ? "L" : "M"}${sx(v).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
    const area = `${d} L${sx(X_MAX).toFixed(1)},${PAD.t + innerH} L${sx(pts[0][0]).toFixed(1)},${PAD.t + innerH} Z`;
    return { d, area };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mu, sigma, width]);

  const percentiles: Array<[string, number]> = [["10th", m.early.p10], ["25th", m.early.p25], ["Median", m.early.p50], ["75th", m.early.p75], ["90th", m.early.p90]];
  const hoverSalary = hoverX != null ? Math.max(1000, ((hoverX - PAD.l) / innerW) * X_MAX) : null;
  const hoverPct = hoverSalary != null ? Math.round(normCdf((Math.log(hoverSalary) - mu) / sigma) * 100) : null;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    setHoverX(((e.clientX - r.left) / r.width) * width);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const step = (5000 / X_MAX) * innerW;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setHoverX((x) => Math.min(PAD.l + innerW, Math.max(PAD.l, (x ?? sx(m.early.p50)) + (e.key === "ArrowRight" ? step : -step))));
    } else if (e.key === "Escape") setHoverX(null);
  };

  const options = majors.slice(0, 5).map((x) => ({ value: x.id, label: x.name.replace("Mechanical Engineering", "Mech. Eng.").replace("Computer Science", "Comp. Sci.") }));

  return (
    <div className="rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <Segmented label="Major" value={id} onChange={setId} options={options} size="sm" wrap className="w-full md:w-auto md:min-w-[34rem]" />
        <div className="flex items-center gap-2">
          <SampleChip />
          <SourceFootnote metric={`${m.name} early-career earnings`} lineage={m.lineage} n={1} />
        </div>
      </div>

      <div ref={ref} className="relative">
        <svg width="100%" height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label={`Estimated distribution of early-career earnings for ${m.name}. Median ${money(m.early.p50)}; half of graduates earn between ${money(m.early.p25)} and ${money(m.early.p75)}.`}>
          {/* middle half band */}
          <motion.rect
            initial={false}
            animate={{ x: sx(m.early.p25), width: sx(m.early.p75) - sx(m.early.p25) }}
            transition={{ duration: reduce ? 0 : 0.6, ease: easeOutExpo }}
            y={PAD.t}
            height={innerH}
            fill="var(--trace-a-tint)"
          />
          <motion.path
            key={`area-${id}`}
            d={area}
            initial={{ opacity: 0 }}
            animate={{ opacity: inView || reduce ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.3 }}
            fill="var(--trace-a)"
            fillOpacity={0.1}
          />
          <motion.path
            key={`line-${id}`}
            d={d}
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: inView || reduce ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 0.9, ease: easeOutExpo }}
            fill="none"
            stroke="var(--trace-a)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <line x1={PAD.l} x2={PAD.l + innerW} y1={PAD.t + innerH} y2={PAD.t + innerH} stroke="var(--rule-strong)" />
          {[0, 50000, 100000, 150000, 200000].map((t) => (
            <text key={t} x={sx(t)} y={H - 18} textAnchor={t === 0 ? "start" : t === X_MAX ? "end" : "middle"} className="tabular fill-muted text-[11px]">
              {moneyCompact(t)}
            </text>
          ))}
          <text x={PAD.l + innerW} y={H - 3} textAnchor="end" className="fill-muted text-[11px]">
            Annual earnings, ages 22–27
          </text>
          {/* percentile ticks */}
          {percentiles.map(([label, v], i) => {
            const median = label === "Median";
            return (
              <motion.g key={label} initial={false} animate={{ x: sx(v) }} transition={{ duration: reduce ? 0 : 0.6, ease: easeOutExpo }}>
                <line x1={0} x2={0} y1={PAD.t + (median ? 0 : 30)} y2={PAD.t + innerH} stroke={median ? "var(--ink)" : "var(--ink-2)"} strokeWidth={median ? 1.5 : 1} strokeDasharray={median ? undefined : "2 3"} />
                <text x={0} y={PAD.t + (median ? -6 : 24) - (i % 2 && !median ? 12 : 0)} textAnchor="middle" className={median ? "fill-ink text-[12px] font-semibold" : "fill-ink-2 text-[11px] font-medium"}>
                  {label}
                </text>
              </motion.g>
            );
          })}
          {hoverX != null && <line x1={hoverX} x2={hoverX} y1={PAD.t} y2={PAD.t + innerH} stroke="var(--ink)" strokeOpacity={0.4} pointerEvents="none" />}
          <rect
            x={PAD.l}
            y={PAD.t}
            width={innerW}
            height={innerH}
            fill="transparent"
            className="cursor-crosshair outline-none focus-visible:[outline:2px_solid_var(--trace-a)]"
            onPointerMove={onMove}
            onPointerLeave={() => setHoverX(null)}
            tabIndex={0}
            role="slider"
            aria-label="Explore the salary distribution"
            aria-valuemin={0}
            aria-valuemax={X_MAX}
            aria-valuenow={Math.round(hoverSalary ?? m.early.p50)}
            aria-valuetext={hoverSalary != null ? `${money(hoverSalary)} is about the ${hoverPct}th percentile` : "Use arrow keys to move along earnings"}
            onKeyDown={onKey}
            onBlur={() => setHoverX(null)}
          />
        </svg>
        <AnimatePresence>
          {hoverX != null && hoverSalary != null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute top-2 rounded-sm border border-rule bg-surface px-3 py-2 shadow-2"
              style={{ left: Math.min(hoverX + 12, width - 190) }}
              aria-hidden
            >
              <p className="tabular text-small font-semibold text-ink">{money(Math.round(hoverSalary / 500) * 500)}</p>
              <p className="text-caption text-muted">About the {ordinal(hoverPct!)} percentile</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <dl className="mt-4 grid grid-cols-5 gap-2 border-t border-rule pt-4">
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
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
