"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useMeasuredWidth } from "@/components/motion";
import { Segmented } from "@/components/ui/segmented";
import { DataKindChip } from "@/components/ui/data-kind";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { linear, ticks } from "@/components/charts/scale";
import { DUR, EASE } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { Lineage } from "@/types";

interface Pt { id: string; name: string; control: string; price: number; earnings: number }

export function PriceEarningsScatter({ pts, r, lineage }: { pts: Pt[]; r: number; lineage: Lineage }) {
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [hover, setHover] = useState<Pt | null>(null);
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(900);
  const view = useRef<HTMLDivElement>(null);
  const inView = useInView(view, { once: true });
  const reduce = useReducedMotion();
  const H = W < 560 ? 300 : 420;
  const M = { t: 16, r: 16, b: 40, l: 64 };
  const x = linear([0, Math.max(...pts.map((p) => p.price)) * 1.05], [M.l, W - M.r]);
  const y = linear([Math.min(...pts.map((p) => p.earnings)) * 0.9, Math.max(...pts.map((p) => p.earnings)) * 1.05], [H - M.b, M.t]);
  const shown = pts.filter((p) => filter === "all" || p.control === filter);
  return (
    <div ref={view} className="grid gap-4 rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Show" hideLabel size="sm" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "public", label: "Public" }, { value: "private", label: "Private" }]} />
        <div className="flex items-center gap-2">
          <DataKindChip kind="observed" />
          <SampleChip />
          <SourceFootnote metric="Net price and median earnings by college" lineage={lineage} n={1} />
        </div>
      </div>
      <div ref={ref} className="relative min-w-0" data-cursor="EXPLORE">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`Scatter of ${pts.length} colleges: average net price against median earnings ten years after starting. Correlation r = ${r.toFixed(2)}.`}>
          {ticks(...(y.domain as [number, number]), 5).map((t) => (
            <g key={t}>
              <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
              <text x={M.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">{moneyCompact(t)}</text>
            </g>
          ))}
          {ticks(...(x.domain as [number, number]), 5).map((t) => (
            <text key={t} x={x(t)} y={H - 18} textAnchor="middle" className="tabular fill-muted text-[11px]">{moneyCompact(t)}</text>
          ))}
          <text x={W - M.r} y={H - 2} textAnchor="end" className="fill-muted text-[11px]">Average net price per year →</text>
          <text x={M.l} y={10} className="fill-muted text-[11px]">Median earnings, 10 yrs after entry</text>
          <AnimatePresence>
            {shown.map((p, i) => (
              <motion.g key={p.id} initial={reduce ? false : { opacity: 0, scale: 0 }} animate={inView || reduce ? { opacity: 1, scale: 1 } : undefined} exit={{ opacity: 0, scale: 0 }} transition={{ duration: DUR.standard, ease: EASE.spring, delay: reduce ? 0 : Math.min(i, 60) * 0.008 }} style={{ originX: `${x(p.price)}px`, originY: `${y(p.earnings)}px` }} onPointerEnter={() => setHover(p)} onPointerLeave={() => setHover(null)}>
                {p.control === "public" ? (
                  <circle cx={x(p.price)} cy={y(p.earnings)} r={hover?.id === p.id ? 8 : 5.5} fill="var(--trace-a)" fillOpacity={0.7} stroke="var(--surface)" strokeWidth={1.5} />
                ) : (
                  <rect x={x(p.price) - 6} y={y(p.earnings) - 6} width={12} height={12} transform={`rotate(45 ${x(p.price)} ${y(p.earnings)})`} fill="var(--trace-b)" fillOpacity={0.75} stroke="var(--surface)" strokeWidth={1.5} />
                )}
              </motion.g>
            ))}
          </AnimatePresence>
        </svg>
        <AnimatePresence>
          {hover && (
            <motion.div key={hover.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="pointer-events-none absolute rounded-sm border border-rule bg-surface px-3 py-2 shadow-3" style={{ left: Math.min(x(hover.price) + 12, W - 200), top: Math.max(0, y(hover.earnings) - 60) }}>
              <p className="text-small font-bold text-ink">{hover.name}</p>
              <p className="tabular text-caption text-ink-2">{money(hover.price)} net / yr · {money(hover.earnings)} earnings</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-ink-2">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-trace-a/70" />Public</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rotate-45 bg-trace-b/75" />Private</span>
        <span className="tabular font-semibold text-ink">Correlation r = {r.toFixed(2)}</span>
      </div>
      <p className="text-small text-ink-2">
        A {Math.abs(r) < 0.3 ? "weak" : Math.abs(r) < 0.6 ? "moderate" : "strong"} {r >= 0 ? "positive" : "negative"} relationship. This is correlation, not causation: selective colleges enroll students who may have earned more anywhere, and earnings depend heavily on major.
      </p>
      <details className="text-small">
        <summary className="cursor-pointer font-semibold text-ink">View as table</summary>
        <div className="mt-2 max-h-72 overflow-y-auto">
          <table className="w-full text-left text-caption">
            <thead><tr className="text-muted"><th className="py-1">College</th><th>Control</th><th className="text-right">Net price</th><th className="text-right">Earnings</th></tr></thead>
            <tbody>{pts.map((p) => <tr key={p.id} className="border-t border-rule"><td className="py-1">{p.name}</td><td>{p.control}</td><td className="tabular text-right">{money(p.price)}</td><td className="tabular text-right">{money(p.earnings)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function BreakEvenBars({ rows, cost }: { rows: Array<{ id: string; name: string; age: number | null; salary: number }>; cost: number }) {
  const view = useRef<HTMLDivElement>(null);
  const inView = useInView(view, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [all, setAll] = useState(false);
  const list = all ? rows : rows.slice(0, 12);
  const max = 45;
  return (
    <div ref={view} className="grid gap-4 rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-small text-ink-2">Break-even age vs. working from 18, at {money(cost)} a year (median public net price)</p>
        <div className="flex gap-2"><DataKindChip kind="projected" /><SampleChip /></div>
      </div>
      <ol className="grid gap-1.5">
        {list.map((r, i) => (
          <li key={r.id} className="grid grid-cols-[minmax(0,11rem)_1fr_3.5rem] items-center gap-3 text-small">
            <span className="truncate text-ink-2">{r.name}</span>
            <span className="h-3 rounded-full bg-surface-sunk">
              <motion.span className="block h-full origin-left rounded-full bg-trace-a" initial={{ scaleX: reduce ? ((r.age ?? max) - 18) / (max - 18) : 0 }} animate={inView || reduce ? { scaleX: ((r.age ?? max) - 18) / (max - 18) } : undefined} transition={{ duration: DUR.large, ease: EASE.smooth, delay: reduce ? 0 : i * 0.03 }} />
            </span>
            <span className="tabular text-right font-semibold text-ink">{r.age ? r.age.toFixed(1) : "45+"}</span>
          </li>
        ))}
      </ol>
      {rows.length > 12 && (
        <button type="button" onClick={() => setAll((a) => !a)} className="justify-self-start rounded-sm px-3 py-2 text-small font-semibold text-ink-2 hover:bg-surface-sunk hover:text-ink">
          {all ? "Show fewer" : `Show all ${rows.length} majors`}
        </button>
      )}
      <p className="text-caption text-muted">Teaching model: before taxes, college paid as you go, salary grows toward each major&apos;s mid-career median; the alternative is the typical high-school-graduate wage. A shorter bar means the cost is recovered sooner, not that a major is &quot;better&quot;.</p>
    </div>
  );
}
