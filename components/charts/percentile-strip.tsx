"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useState } from "react";
import { enterSpring, tip } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { SalaryPercentiles } from "@/types";

const KEYS: Array<[keyof SalaryPercentiles, string]> = [
  ["p10", "10th percentile"],
  ["p25", "25th percentile"],
  ["p50", "Median"],
  ["p75", "75th percentile"],
  ["p90", "90th percentile"],
];

/**
 * Salary distribution as five labeled points on one scale: whisker 10th–90th,
 * bar for the middle half, tick for the median. Each point is focusable and
 * shows its value on hover or focus; all five values are also printed below.
 */
export function PercentileStrip({
  p,
  max = 200000,
  compare,
  compareLabel,
  label,
  className,
}: {
  p: SalaryPercentiles;
  max?: number;
  /** Optional second distribution (e.g. national) drawn muted underneath. */
  compare?: SalaryPercentiles | null;
  compareLabel?: string;
  label: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<keyof SalaryPercentiles | null>(null);
  const x = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  const t = reduce ? { duration: 0 } : enterSpring;
  return (
    <figure className={cn("grid gap-3", className)}>
      <figcaption className="sr-only">{label}</figcaption>
      <div className={cn("relative", compare ? "h-[5.25rem]" : "h-16")}>
        {compare && (
          <div aria-hidden className="absolute inset-x-0 top-[46px] h-3">
            <span className="absolute top-1/2 h-px -translate-y-1/2 bg-rule-strong" style={{ left: x(compare.p10), width: `calc(${x(compare.p90)} - ${x(compare.p10)})` }} />
            <span className="absolute inset-y-[2px] rounded-[3px] bg-surface-sunk ring-1 ring-rule-strong" style={{ left: x(compare.p25), width: `calc(${x(compare.p75)} - ${x(compare.p25)})` }} />
            <span className="absolute inset-y-0 w-[2px] bg-muted" style={{ left: x(compare.p50) }} />
          </div>
        )}
        <div className="absolute inset-x-0 top-[14px] h-6">
          <motion.span className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-ink/40" initial={false} animate={{ left: x(p.p10), width: `calc(${x(p.p90)} - ${x(p.p10)})` }} transition={t} />
          <motion.span className="absolute inset-y-[3px] rounded-[4px] bg-ink/10" initial={false} animate={{ left: x(p.p25), width: `calc(${x(p.p75)} - ${x(p.p25)})` }} transition={t} />
          {KEYS.map(([k, name]) => {
            const median = k === "p50";
            return (
              <motion.button
                key={k}
                type="button"
                initial={false}
                animate={{ left: x(p[k]) }}
                transition={t}
                onPointerEnter={() => setHover(k)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(k)}
                onBlur={() => setHover(null)}
                className="absolute top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-offset-0"
                aria-label={`${name}: ${money(p[k])} a year`}
              >
                <span className={cn("block rounded-full border-2 border-surface shadow-1", median ? "size-4 bg-ink" : "size-3 bg-surface ring-2 ring-ink")} />
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence>
          {hover && (
            <motion.div key="tip" variants={tip} initial="hidden" animate="visible" exit="exit" className="pointer-events-none absolute -top-9 z-10 -translate-x-1/2 whitespace-nowrap rounded-xs bg-ink px-2 py-1 text-caption font-semibold text-on-ink" style={{ left: x(p[hover]) }}>
              {money(p[hover])} · {KEYS.find(([k]) => k === hover)![1]}
            </motion.div>
          )}
        </AnimatePresence>
        <div aria-hidden className="absolute inset-x-0 bottom-0 flex justify-between text-[0.6875rem] text-muted tabular">
          {[0, max / 4, max / 2, (3 * max) / 4, max].map((v) => (
            <span key={v}>{moneyCompact(v)}</span>
          ))}
        </div>
      </div>
      <dl className="grid grid-cols-5 gap-2">
        {KEYS.map(([k, name]) => (
          <div key={k} className="grid gap-0.5">
            <dt className="text-[0.75rem] text-muted">{name.replace(" percentile", "")}</dt>
            <dd className={cn("tabular text-small font-semibold", k === "p50" ? "text-ink" : "text-ink-2")}>{moneyCompact(p[k])}</dd>
          </div>
        ))}
      </dl>
      {compare && compareLabel && (
        <p className="flex items-center gap-2 text-caption text-muted">
          <span aria-hidden className="inline-block h-2.5 w-6 rounded-[3px] bg-surface-sunk ring-1 ring-rule-strong" /> {compareLabel}
        </p>
      )}
    </figure>
  );
}
