"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useMemo, useRef, useState } from "react";
import { PathTag, SampleChip, SourceFootnote, TRACE_VAR } from "@/components/ui/lineage";
import { Segmented } from "@/components/ui/segmented";
import { crossfade, revealViewport, valueSpring } from "@/lib/animations";
import { money, pct } from "@/lib/format";
import type { Lineage } from "@/types";
import type { SamplePath } from "./data";

type MetricKey = "netPrice" | "debt" | "monthly" | "startSalary" | "breakEvenAge" | "gradRate6";

const METRICS: Array<{
  key: MetricKey;
  label: string;
  fmt: (n: number) => string;
  /** Descriptions for the extremes. Neither end is labeled good or bad. */
  higherWord: string;
  lowerWord: string;
  lineage: (p: SamplePath) => Lineage;
}> = [
  { key: "netPrice", label: "Net cost, 4 years", fmt: money, higherWord: "Highest net cost of the three", lowerWord: "Lowest net cost of the three", lineage: (p) => p.lineage.cost },
  { key: "debt", label: "Estimated debt", fmt: money, higherWord: "Most estimated debt", lowerWord: "Least estimated debt", lineage: (p) => p.lineage.model },
  { key: "monthly", label: "Monthly loan payment", fmt: (n) => `${money(n)}/mo`, higherWord: "Largest monthly loan payment", lowerWord: "Smallest monthly loan payment", lineage: (p) => p.lineage.model },
  { key: "startSalary", label: "Median early-career salary", fmt: money, higherWord: "Highest typical starting salary", lowerWord: "Lowest typical starting salary", lineage: (p) => p.lineage.earnings },
  { key: "gradRate6", label: "6-year graduation rate", fmt: (n) => pct(n), higherWord: "Highest share of students who finish", lowerWord: "Lowest share of students who finish", lineage: (p) => p.lineage.grad },
  { key: "breakEvenAge", label: "Break-even age vs. no degree", fmt: (n) => n.toFixed(1), higherWord: "Takes longest to break even", lowerWord: "Breaks even soonest", lineage: (p) => p.lineage.model },
];

function valueOf(p: SamplePath, k: MetricKey): number | null {
  return k === "breakEvenAge" ? p.breakEvenAge : (p[k] as number);
}

/** Plain statements of how each path differs from the others. No verdicts. */
function tradeoffsFor(p: SamplePath, all: SamplePath[]): string[] {
  const others = all.filter((o) => o.key !== p.key);
  const lines: string[] = [];
  for (const m of METRICS) {
    const v = valueOf(p, m.key);
    const ov = others.map((o) => valueOf(o, m.key)).filter((x): x is number => x != null);
    if (v == null || ov.length < others.length) continue;
    const spread = Math.max(v, ...ov) - Math.min(v, ...ov);
    const tol = m.key === "gradRate6" ? 3 : m.key === "breakEvenAge" ? 0.8 : spread * 0.12;
    if (ov.every((o) => v > o + tol)) lines.push(m.higherWord);
    else if (ov.every((o) => v < o - tol)) lines.push(m.lowerWord);
  }
  return lines.length ? lines : ["In the middle on most measures"];
}

export function Tradeoffs({ campus, cHome }: { campus: SamplePath[]; cHome: SamplePath }) {
  const [living, setLiving] = useState<"campus" | "home">("home");
  const paths = useMemo(() => (living === "home" ? [campus[0], campus[1], cHome] : campus), [living, campus, cHome]);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="grid content-start gap-6 lg:col-span-4">
        <div className="grid gap-4">
          {paths.map((p) => (
            <div key={p.key} className="grid gap-2 border-t border-rule pt-4">
              <p className="flex items-center gap-2 font-display text-[1.05rem] font-semibold">
                <PathTag trace={p.key} /> {p.label}
              </p>
              <p className="text-caption text-muted">{p.key === "c" ? cHomeSpec(living, p) : p.spec}</p>
              <ul className="grid gap-1 text-small text-ink-2">
                <AnimatePresence initial={false} mode="popLayout">
                  {tradeoffsFor(p, paths).map((t) => (
                    <motion.li key={t} layout variants={crossfade} initial="hidden" animate="visible" exit="exit" className="flex gap-2">
                      <span aria-hidden className="mt-[0.6em] h-px w-3 shrink-0 bg-rule-strong" />
                      {t}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          ))}
        </div>
        <Segmented
          label="Path C living arrangement"
          value={living}
          onChange={setLiving}
          options={[
            { value: "home", label: "Lives at home" },
            { value: "campus", label: "On campus" },
          ]}
        />
      </div>

      <div className="rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6 lg:col-span-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-small font-semibold text-ink">Each measure on its own scale</p>
          <SampleChip />
        </div>
        <div className="grid gap-1">
          {METRICS.map((m, i) => (
            <StripRow key={m.key} metric={m} paths={paths} n={i + 1} />
          ))}
        </div>
        <p className="mt-5 text-caption text-muted">
          Markers show where each path falls between the lowest and highest value on that measure. The scales are separate, so nothing here adds up to a single score.
        </p>
      </div>
    </div>
  );
}

function cHomeSpec(living: "campus" | "home", p: SamplePath) {
  return living === "home" ? "California resident · lives at home · $8K/yr aid" : p.spec;
}

function StripRow({ metric, paths, n }: { metric: (typeof METRICS)[number]; paths: SamplePath[]; n: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, revealViewport);
  const reduce = useReducedMotion();
  const vals = paths.map((p) => valueOf(p, metric.key));
  const known = vals.filter((v): v is number => v != null);
  const lo = Math.min(...known);
  const hi = Math.max(...known);
  const pad = (hi - lo) * 0.12 || Math.abs(hi) * 0.1 || 1;
  const pos = (v: number) => ((v - (lo - pad)) / (hi + pad - (lo - pad))) * 100;
  // Markers closer than ~5% of the scale would overlap; lift later ones so both stay legible.
  const lift = paths.map((_, i) => {
    const v = vals[i];
    if (v == null) return 0;
    return vals.slice(0, i).filter((o) => o != null && Math.abs(pos(o) - pos(v)) < 5).length;
  });

  return (
    <div ref={ref} className="grid gap-2 border-t border-rule py-3.5 first:border-t-0 md:grid-cols-[13rem_1fr] md:items-center md:gap-6">
      <div className="flex items-center gap-1.5 text-small font-medium text-ink-2">
        {metric.label}
        <SourceFootnote metric={metric.label} lineage={metric.lineage(paths[0])} n={n} />
      </div>
      <div>
        <div className="relative h-9">
          {/* scale */}
          <div aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rule-strong" />
          <div aria-hidden className="absolute inset-x-0 top-1/2 h-[7px] -translate-y-[3px]" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--rule-strong) 0 1px, transparent 1px 10%)" }} />
          {paths.map((p, i) => {
            const v = vals[i];
            if (v == null) return null;
            return (
              <motion.div
                key={p.key}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={false}
                animate={{ left: inView || reduce ? `${pos(v)}%` : "50%", opacity: inView || reduce ? 1 : 0, y: lift[i] * -14 }}
                transition={valueSpring(reduce, i)}
                style={{ zIndex: 3 - i }}
              >
                <span
                  className="grid size-6 place-items-center rounded-full border-2 border-surface text-[0.6875rem] font-bold text-on-ink shadow-1"
                  style={{ background: TRACE_VAR[p.key] }}
                  title={`${p.label}: ${metric.fmt(v)}`}
                >
                  {p.key.toUpperCase()}
                </span>
              </motion.div>
            );
          })}
        </div>
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-caption text-muted" aria-label={`${metric.label} values`}>
          {paths.map((p, i) => (
            <li key={p.key} className="tabular">
              <span className="font-semibold text-ink-2">{p.key.toUpperCase()}</span> {vals[i] == null ? "not by 40" : metric.fmt(vals[i]!)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
