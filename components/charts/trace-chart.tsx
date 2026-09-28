"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { crossfade, easeOutExpo, markerSettle } from "@/lib/animations";
import { moneyCompact, money } from "@/lib/format";
import { cn } from "@/lib/cn";
import { LineKey, TRACE_DASH, TRACE_VAR, type TraceKey } from "@/components/ui/lineage";

export interface TraceSeries {
  id: string;
  /** Path trace, or "baseline" for the muted comparison (no-college) line. */
  trace: TraceKey | "baseline";
  label: string;
  points: Array<{ x: number; y: number }>;
}

export interface TraceMarker {
  x: number;
  y: number;
  label: string;
  /** Which series the marker sits on (for color). */
  trace?: TraceKey;
}

const M = { top: 20, right: 132, bottom: 40, left: 64 };
const MOBILE_RIGHT = 16;

function niceTicks(min: number, max: number, count = 5): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v));
  return out;
}

/**
 * Cumulative-value chart. X is age, Y is cumulative net value in 2024 dollars.
 * One axis, hairline grid, 2px lines, direct end labels + legend, crosshair
 * tooltip (pointer and keyboard), a break-even marker, a text summary and a
 * table view.
 */
export function TraceChart({
  series,
  marker,
  band,
  summary,
  title,
  height = 320,
  drawn = true,
  xLabel = "Age",
  yLabel = "Cumulative net value (2024 dollars)",
  className,
  caption,
}: {
  series: TraceSeries[];
  marker?: TraceMarker | null;
  /** Shaded x-range, e.g. the college years. */
  band?: { from: number; to: number; label: string } | null;
  summary: string;
  title: string;
  height?: number;
  /** Trigger the initial line draw (e.g. when in view / after Calculate). */
  drawn?: boolean;
  xLabel?: string;
  yLabel?: string;
  className?: string;
  caption?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const uid = useId();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact = width < 560;
  const right = compact ? MOBILE_RIGHT : M.right;
  const innerW = width - M.left - right;
  const innerH = height - M.top - M.bottom;

  const xs = series[0]?.points.map((p) => p.x) ?? [];
  const xMin = xs[0] ?? 0;
  const xMax = xs[xs.length - 1] ?? 1;
  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const yTicks = niceTicks(Math.min(0, ...allY), Math.max(0, ...allY), compact ? 4 : 5);
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];

  const sx = useCallback((x: number) => M.left + ((x - xMin) / (xMax - xMin || 1)) * innerW, [xMin, xMax, innerW]);
  const sy = useCallback((y: number) => M.top + (1 - (y - yMin) / (yMax - yMin || 1)) * innerH, [yMin, yMax, innerH]);

  const xTicks = useMemo(() => {
    const step = compact ? 6 : 3;
    const out: number[] = [];
    for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) out.push(x);
    return out;
  }, [xMin, xMax, compact]);

  const paths = series.map((s) => ({
    ...s,
    d: s.points.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" "),
  }));

  // End labels: sorted by y, nudged apart with leader lines when they'd collide.
  const endLabels = useMemo(() => {
    if (compact) return [];
    const items = series.map((s) => {
      const last = s.points[s.points.length - 1];
      return { id: s.id, trace: s.trace, label: s.label, value: last.y, lineY: sy(last.y), y: sy(last.y) };
    });
    items.sort((a, b) => a.lineY - b.lineY);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 30) items[i].y = items[i - 1].y + 30;
    return items;
  }, [series, sy, compact]);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const x = xMin + ((px - M.left) / innerW) * (xMax - xMin);
    const idx = Math.round(Math.min(Math.max(x, xMin), xMax) - xMin);
    setHover(Math.min(Math.max(0, idx), xs.length - 1));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setHover((h) => {
        const cur = h ?? (e.key === "ArrowRight" ? -1 : xs.length);
        return Math.min(xs.length - 1, Math.max(0, cur + (e.key === "ArrowRight" ? 1 : -1)));
      });
    } else if (e.key === "Home") setHover(0);
    else if (e.key === "End") setHover(xs.length - 1);
    else if (e.key === "Escape") setHover(null);
  };

  const hx = hover != null ? xs[hover] : null;
  const tipLeft = hx != null ? sx(hx) : 0;
  const tipOnLeft = tipLeft > width * 0.6;

  return (
    <figure className={cn("grid gap-3", className)} aria-labelledby={`${uid}-t`}>
      <figcaption className="sr-only" id={`${uid}-t`}>
        {title}
      </figcaption>
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-caption text-ink-2" aria-label="Legend">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <LineKey trace={s.trace === "baseline" ? undefined : s.trace} muted={s.trace === "baseline"} />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      <div ref={wrapRef} className="relative w-full">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${title}. ${summary}`}
          className="block overflow-visible"
        >
          {/* college band */}
          {band && (
            <g>
              <rect x={sx(band.from)} y={M.top} width={Math.max(0, sx(band.to) - sx(band.from))} height={innerH} fill="var(--surface-sunk)" />
              <text x={sx(band.from) + 6} y={M.top + 14} className="fill-muted text-[11px] font-medium">
                {band.label}
              </text>
            </g>
          )}
          {/* grid + y axis */}
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + innerW} y1={sy(t)} y2={sy(t)} stroke={t === 0 ? "var(--ink)" : "var(--rule)"} strokeOpacity={t === 0 ? 0.55 : 1} strokeWidth={1} shapeRendering="crispEdges" />
              <text x={M.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">
                {moneyCompact(t)}
              </text>
            </g>
          ))}
          {/* x axis */}
          {xTicks.map((t) => (
            <g key={t}>
              <line x1={sx(t)} x2={sx(t)} y1={M.top + innerH} y2={M.top + innerH + 5} stroke="var(--rule-strong)" />
              <text x={sx(t)} y={M.top + innerH + 18} textAnchor="middle" className="tabular fill-muted text-[11px]">
                {t}
              </text>
            </g>
          ))}
          <text x={M.left + innerW} y={height - 4} textAnchor="end" className="fill-muted text-[11px]">
            {xLabel}
          </text>
          <text x={M.left - 56} y={M.top - 8} className="fill-muted text-[11px]">
            {compact ? "USD" : yLabel}
          </text>

          {/* series */}
          {paths.map((p, i) => {
            const baseline = p.trace === "baseline";
            return (
              <motion.path
                key={p.id}
                d={p.d}
                fill="none"
                stroke={baseline ? "var(--muted)" : TRACE_VAR[p.trace as TraceKey]}
                strokeWidth={baseline ? 1.5 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={baseline ? "1 4" : TRACE_DASH[p.trace as TraceKey]}
                initial={reduce ? { d: p.d, opacity: 0 } : { d: p.d, pathLength: 0, opacity: 0 }}
                animate={
                  drawn
                    ? reduce
                      ? { d: p.d, opacity: 1 }
                      : { d: p.d, pathLength: 1, opacity: 1 }
                    : { d: p.d, pathLength: 0, opacity: 0 }
                }
                transition={{
                  d: { duration: reduce ? 0 : 0.6, ease: easeOutExpo },
                  pathLength: { duration: 0.9, ease: easeOutExpo, delay: i * 0.12 },
                  opacity: { duration: 0.15, delay: reduce ? 0 : i * 0.12 },
                }}
              />
            );
          })}

          {/* end dots */}
          {drawn &&
            series.map((s) => {
              const last = s.points[s.points.length - 1];
              if (s.trace === "baseline") return null;
              return (
                <motion.circle
                  key={`${s.id}-end`}
                  initial={{ opacity: 0, cx: sx(last.x), cy: sy(last.y) }}
                  animate={{ opacity: 1, cx: sx(last.x), cy: sy(last.y) }}
                  transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.8 }}
                  r={4.5}
                  fill={TRACE_VAR[s.trace]}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              );
            })}

          {/* direct end labels (desktop) */}
          {drawn &&
            endLabels.map((l) => (
              <g key={`${l.id}-lbl`}>
                {Math.abs(l.y - l.lineY) > 2 && (
                  <line x1={M.left + innerW + 6} y1={l.lineY} x2={M.left + innerW + 14} y2={l.y} stroke="var(--rule-strong)" />
                )}
                <text x={M.left + innerW + 16} y={l.y} dy="-0.15em" className="fill-ink text-[12px] font-semibold">
                  {truncate(l.label, 18)}
                </text>
                <text x={M.left + innerW + 16} y={l.y} dy="1.05em" className="tabular fill-muted text-[11px]">
                  {moneyCompact(l.value)}
                </text>
              </g>
            ))}

          {/* break-even marker */}
          <AnimatePresence>
            {drawn && marker && (
              <motion.g key={`${marker.x.toFixed(2)}`} initial="hidden" animate="visible" exit={{ opacity: 0 }} custom={reduce ? 0 : 0.9} variants={reduce ? crossfade : markerSettle} style={{ originX: `${sx(marker.x)}px`, originY: `${sy(marker.y)}px` }}>
                <line x1={sx(marker.x)} x2={sx(marker.x)} y1={M.top} y2={M.top + innerH} stroke="var(--ink)" strokeWidth={1} />
                <circle cx={sx(marker.x)} cy={sy(marker.y)} r={6} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
                <circle cx={sx(marker.x)} cy={sy(marker.y)} r={2.5} fill="var(--ink)" />
                <g transform={`translate(${Math.min(sx(marker.x) + 8, M.left + innerW - 150)}, ${M.top + innerH - 44})`}>
                  <rect width={150} height={36} rx={8} fill="var(--ink)" />
                  <text x={10} y={15} className="fill-white text-[11px] font-semibold">
                    {marker.label}
                  </text>
                  <text x={10} y={28} className="fill-white/75 text-[10px]">
                    Estimate, not a prediction
                  </text>
                </g>
              </motion.g>
            )}
          </AnimatePresence>

          {/* crosshair */}
          {hx != null && (
            <g pointerEvents="none">
              <line x1={sx(hx)} x2={sx(hx)} y1={M.top} y2={M.top + innerH} stroke="var(--ink)" strokeOpacity={0.35} strokeWidth={1} />
              {series.map((s) => {
                const p = s.points[hover!];
                return p ? (
                  <circle key={s.id} cx={sx(p.x)} cy={sy(p.y)} r={4} fill={s.trace === "baseline" ? "var(--muted)" : TRACE_VAR[s.trace]} stroke="var(--surface)" strokeWidth={2} />
                ) : null;
              })}
            </g>
          )}

          {/* hit area: the whole plot, so readers aim at an age, not a 2px line */}
          <rect
            x={M.left}
            y={M.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            tabIndex={0}
            role="slider"
            aria-label={`${title}: explore by age`}
            aria-valuemin={xMin}
            aria-valuemax={xMax}
            aria-valuenow={hx ?? xMin}
            aria-valuetext={
              hx != null ? `Age ${hx}: ${series.map((s) => `${s.label} ${money(s.points[hover!]?.y)}`).join(", ")}` : "Use arrow keys to read values by age"
            }
            onKeyDown={onKey}
            onBlur={() => setHover(null)}
            className="cursor-crosshair outline-none focus-visible:[outline:2px_solid_var(--trace-a)]"
          />
        </svg>

        {/* tooltip: values lead, labels follow, line keys */}
        <AnimatePresence>
          {hx != null && (
            <motion.div
              key="tip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, left: tipOnLeft ? tipLeft - 12 : tipLeft + 12 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className={cn("pointer-events-none absolute top-3 z-10 min-w-44 rounded-sm border border-rule bg-surface p-3 shadow-2", tipOnLeft && "-translate-x-full")}
              aria-hidden
            >
              <p className="mb-1.5 text-caption font-semibold text-muted">Age {hx}</p>
              <ul className="grid gap-1">
                {series.map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <LineKey trace={s.trace === "baseline" ? undefined : s.trace} muted={s.trace === "baseline"} />
                    <span className="tabular text-small font-semibold text-ink">{money(s.points[hover!]?.y)}</span>
                    <span className="truncate text-caption text-muted">{truncate(s.label, 22)}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <p className="measure text-small text-ink-2">{summary}</p>
        <button type="button" onClick={() => setShowTable((v) => !v)} className="text-caption font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink" aria-expanded={showTable}>
          {showTable ? "Hide table" : "View as table"}
        </button>
      </div>
      {caption}
      <AnimatePresence initial={false}>
        {showTable && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="max-h-72 overflow-auto rounded-sm border border-rule">
              <table className="w-full text-small">
                <caption className="sr-only">{title}</caption>
                <thead className="sticky top-0 bg-surface-sunk text-left text-caption text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">{xLabel}</th>
                    {series.map((s) => (
                      <th key={s.id} scope="col" className="px-3 py-2 text-right font-semibold">{s.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tabular">
                  {xs.map((x, i) => (
                    <tr key={x} className="border-t border-rule">
                      <th scope="row" className="px-3 py-1.5 text-left font-medium text-ink-2">{x}</th>
                      {series.map((s) => (
                        <td key={s.id} className="px-3 py-1.5 text-right text-ink">{money(s.points[i]?.y)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </figure>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
