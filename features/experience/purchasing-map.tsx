"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { AnimatedNumber } from "@/components/motion";
import { Combobox } from "@/components/ui/combobox";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { US_MAP, US_NATION, US_STATE_BORDERS } from "@/data/geo/us-map";
import { equivalentSalary } from "@/lib/calc";
import { enterSpring, ledgerItem, revealViewport } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import type { Lineage } from "@/types";
import type { MapCity } from "./data";

/** Circle area is proportional to the salary, so a bigger circle means more money needed. */
const R_AT_100K = 13;
const radius = (salary: number) => R_AT_100K * Math.sqrt(salary / 100000);

/**
 * Purchasing power, on a map: the same salary changes size city by city.
 * Each circle is the salary needed there to live like your salary in your
 * city (regional price parities).
 */
export function PurchasingMap({ cities, lineage }: { cities: MapCity[]; lineage: Lineage }) {
  const reduce = useReducedMotion();
  const [salary, setSalary] = useState(100000);
  const [fromId, setFromId] = useState("sf");
  const [targetId, setTargetId] = useState("aus");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, revealViewport);
  const from = cities.find((c) => c.id === fromId)!;
  const target = cities.find((c) => c.id === targetId) ?? from;
  const eq = (c: MapCity) => equivalentSalary(salary, from.rpp, c.rpp);
  const sorted = useMemo(() => [...cities].sort((a, b) => b.rpp - a.rpp), [cities]);
  const dist = (c: MapCity) => Math.hypot(c.x - from.x, c.y - from.y);
  const targetEq = eq(target);
  // Sequential ink ramp as a second channel: darker = more expensive (price levels span only ~±20%).
  const rpps = cities.map((c) => c.rpp);
  const [minR, maxR] = [Math.min(...rpps), Math.max(...rpps)];
  const shade = (c: MapCity) => 0.08 + ((c.rpp - minR) / (maxR - minR || 1)) * 0.5;
  const diff = targetEq - salary;

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
      <div className="order-2 grid content-start gap-5 lg:order-1 lg:col-span-4">
        <GraduatedSlider label="Your salary" value={salary} onChange={setSalary} min={40000} max={250000} step={5000} format={moneyCompact} />
        <Combobox label="Earned in" value={fromId} onChange={setFromId} options={cities.map((c) => ({ value: c.id, label: `${c.name}, ${c.state}`, meta: `Price level ${c.rpp.toFixed(1)}` }))} searchPlaceholder="Search metros" />
        <Combobox label="Compare with" value={targetId} onChange={setTargetId} options={cities.map((c) => ({ value: c.id, label: `${c.name}, ${c.state}`, meta: moneyCompact(eq(c)) }))} searchPlaceholder="Search metros" />

        <div className="grid gap-2 rounded-md border border-rule bg-surface p-4 shadow-1" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${fromId}-${targetId}`} variants={ledgerItem} initial="hidden" animate="visible" exit="exit" className="grid gap-1">
              <p className="text-caption text-muted">
                To live like {moneyCompact(salary)} in {from.name}, in {target.name} you&apos;d need
              </p>
            </motion.div>
          </AnimatePresence>
          <p className="text-h1 font-semibold tracking-[-0.02em] text-ink">
            <AnimatedNumber value={targetEq} format={money} />
          </p>
          <p className="text-small text-ink-2">
            {target.id === from.id
              ? "Pick another city on the map to compare."
              : `${diff < 0 ? "Less" : "More"} by ${money(Math.abs(diff))}, because prices in ${target.name} are ${Math.abs(((target.rpp - from.rpp) / from.rpp) * 100).toFixed(0)}% ${diff < 0 ? "lower" : "higher"} overall.`}
          </p>
        </div>
      </div>

      <div className="order-1 grid min-w-0 gap-3 rounded-lg border border-rule bg-surface p-3 shadow-2 sm:p-5 lg:order-2 lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-small font-semibold text-ink">
            Salary with the same purchasing power
            <SourceFootnote metric="Regional price parities" lineage={lineage} n={1} className="ml-1" />
          </p>
          <SampleChip />
        </div>
        <div ref={ref} className="relative w-full" style={{ aspectRatio: `${US_MAP.width} / ${US_MAP.height}` }}>
          <svg viewBox={`0 0 ${US_MAP.width} ${US_MAP.height}`} className="absolute inset-0 h-full w-full" role="img" aria-label={`Map of ${cities.length} US metros. Circles show the salary needed to match ${money(salary)} in ${from.name}; bigger circles mean more expensive places.`}>
            <path d={US_NATION} fill="var(--surface-sunk)" stroke="var(--rule-strong)" strokeWidth={1} />
            <path d={US_STATE_BORDERS} fill="none" stroke="var(--rule)" strokeWidth={0.75} />
            {sorted.map((c) => {
              const on = c.id === targetId;
              const home = c.id === fromId;
              const d = Math.min(1, dist(c) / 900);
              return (
                <motion.circle
                  key={c.id}
                  cx={c.x}
                  cy={c.y}
                  initial={{ r: 0 }}
                  animate={{ r: inView || reduce ? radius(eq(c)) * (on ? 1.15 : 1) : 0 }}
                  transition={reduce ? { duration: 0 } : { ...enterSpring, delay: inView ? d * 0.5 : 0 }}
                  fill={home ? "var(--trace-a)" : "var(--ink)"}
                  fillOpacity={home ? 0.35 : shade(c)}
                  stroke={home ? "var(--trace-a)" : "var(--ink)"}
                  strokeOpacity={on || home ? 1 : 0.35}
                  strokeWidth={on || home ? 2 : 1}
                />
              );
            })}
            {[from, target].filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i).map((c) => (
              <text key={`l-${c.id}`} x={c.x < 160 ? c.x - radius(eq(c)) : c.x > 815 ? c.x + radius(eq(c)) : c.x} y={c.y - radius(eq(c)) * 1.15 - 6} textAnchor={c.x < 160 ? "start" : c.x > 815 ? "end" : "middle"} stroke="var(--surface)" strokeWidth={4} paintOrder="stroke" className="tabular fill-ink text-[15px] font-semibold">
                {c.name} {moneyCompact(eq(c))}
              </text>
            ))}
          </svg>
          {/* hit targets: real buttons so every city works with a tap, a hover or the keyboard */}
          {cities.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseEnter={() => setTargetId(c.id)}
              onFocus={() => setTargetId(c.id)}
              onClick={() => setTargetId(c.id)}
              aria-label={`${c.name}, ${c.state}: ${money(eq(c))}`}
              aria-pressed={c.id === targetId}
              className={cn("absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full outline-offset-2 sm:size-7")}
              style={{ left: `${(c.x / US_MAP.width) * 100}%`, top: `${(c.y / US_MAP.height) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-caption text-ink-2">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border-2 border-trace-a bg-trace-a/35" aria-hidden /> Your city
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5" aria-hidden>
              <span className="size-2.5 rounded-full border border-ink/40 bg-ink/10" />
              <span className="size-3.5 rounded-full border border-ink/40 bg-ink/50" />
            </span>
            Bigger and darker = more needed there
          </span>
          <span>Overall prices only; state taxes differ and aren&apos;t included.</span>
        </div>
      </div>
    </div>
  );
}
