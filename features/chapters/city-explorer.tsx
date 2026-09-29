"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { AnimatedNumber } from "@/components/motion";
import { Combobox } from "@/components/ui/combobox";
import { Segmented } from "@/components/ui/segmented";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { US_MAP, US_NATION, US_STATE_BORDERS } from "@/data/geo/us-map";
import { calculateDisposableIncome, calculatePurchasingPower } from "@/lib/calc";
import { DUR, EASE } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import type { Lineage } from "@/types";

interface City {
  id: string;
  name: string;
  state: string;
  rpp: number;
  rent: number;
  tax: number;
  x: number;
  y: number;
}

const QUICK = ["sf", "aus", "chi", "nyc", "sea"];
const PARTS = [
  { key: "taxes", label: "Taxes", color: "var(--trace-c)" },
  { key: "rent", label: "Housing", color: "var(--trace-d)" },
  { key: "core", label: "Basic costs", color: "var(--trace-b)" },
  { key: "disposable", label: "Money left", color: "var(--trace-a)" },
] as const;

/**
 * COST OF LIVING. Pick a salary and hover (or tap) a city: the salary splits
 * into taxes, rent, core costs and what's left, the purchasing-power circle
 * resizes, and the map eases toward the city.
 */
export function CityExplorer({ cities, lineage }: { cities: City[]; lineage: Lineage }) {
  const reduce = useReducedMotion();
  const [salary, setSalary] = useState("100000");
  const [homeId, setHomeId] = useState("sf");
  const [cityId, setCityId] = useState("aus");
  const s = Number(salary);
  const home = cities.find((c) => c.id === homeId)!;
  const city = cities.find((c) => c.id === cityId) ?? home;
  const d = calculateDisposableIncome({ salary: s, stateRate: city.tax, rentPerMonth: city.rent, rpp: city.rpp });
  const dHome = calculateDisposableIncome({ salary: s, stateRate: home.tax, rentPerMonth: home.rent, rpp: home.rpp });
  const equivalent = calculatePurchasingPower(s, home.rpp, city.rpp);
  const values: Record<(typeof PARTS)[number]["key"], number> = { taxes: d.taxes, rent: d.rent, core: d.core, disposable: Math.max(0, d.disposable) };

  // Ease the map to frame both cities (mild zoom, never past the map's edges).
  const pad = 160;
  const bw = Math.abs(city.x - home.x) + pad * 2;
  const bh = Math.abs(city.y - home.y) + pad * 2;
  const zoom = Math.max(1, Math.min(1.6, US_MAP.width / bw, US_MAP.height / bh));
  const cxm = (city.x + home.x) / 2;
  const cym = (city.y + home.y) / 2;
  const tx = Math.min(0, Math.max(US_MAP.width * (1 - zoom), US_MAP.width / 2 - cxm * zoom));
  const ty = Math.min(0, Math.max(US_MAP.height * (1 - zoom), US_MAP.height / 2 - cym * zoom));
  const circle = (v: number) => 34 * Math.sqrt(v / 100000);

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
      <div className="order-2 grid content-start gap-5 lg:order-1 lg:col-span-5">
        <Segmented label="Salary" value={salary} onChange={setSalary} options={["60000", "100000", "150000"].map((v) => ({ value: v, label: moneyCompact(Number(v)) }))} />
        <Combobox label="Your offer is in" value={homeId} onChange={setHomeId} options={cities.map((c) => ({ value: c.id, label: `${c.name}, ${c.state}` }))} searchPlaceholder="Search metros" />
        <div className="grid gap-2">
          <p className="text-caption font-medium text-muted">Compare with</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick cities">
            {QUICK.map((id) => {
              const c = cities.find((x) => x.id === id);
              if (!c) return null;
              return (
                <button key={id} type="button" onClick={() => setCityId(id)} aria-pressed={cityId === id} className={cn("h-10 rounded-full border px-3 text-caption font-semibold transition-colors", cityId === id ? "border-ink bg-ink text-on-ink" : "border-rule-strong bg-surface text-ink hover:border-ink")}>
                  {c.name}
                </button>
              );
            })}
          </div>
          <Combobox label="Any city" hideLabel value={cityId} onChange={setCityId} options={cities.map((c) => ({ value: c.id, label: `${c.name}, ${c.state}` }))} searchPlaceholder="Search metros" />
        </div>

        <div className="grid gap-4 panel p-4" aria-live="polite">
          <div className="flex items-baseline justify-between gap-3">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={city.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: DUR.fast } }} className="text-h3 font-bold text-ink">
                {city.name}
              </motion.p>
            </AnimatePresence>
            <SampleChip />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-small">
            <Row label="Salary" v={s} />
            <Row label="Taxes" v={d.taxes} minus />
            <Row label="Housing (1-bed rent)" v={d.rent} minus />
            <Row label="Basic costs" v={d.core} minus />
          </dl>
          {/* the salary, split: blocks resize with transforms */}
          <div className="flex h-4 overflow-hidden rounded-full bg-surface-sunk" aria-hidden>
            {PARTS.map((p) => (
              <motion.span key={p.key} className="h-full" style={{ background: p.color, boxShadow: "inset -2px 0 0 var(--surface)" }} initial={false} animate={{ width: `${(values[p.key] / s) * 100}%` }} transition={{ duration: DUR.standard, ease: EASE.smooth }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.75rem] text-muted">
            {PARTS.map((p) => (
              <span key={p.key} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: p.color }} />
                {p.label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-rule pt-3">
            <div>
              <p className="text-caption text-muted">Money left each year</p>
              <p className="text-h2 font-semibold text-ink">
                <AnimatedNumber value={d.disposable} format={money} />
              </p>
              <p className="text-caption text-muted">{moneyCompact(dHome.disposable)} in {home.name}</p>
            </div>
            <div>
              <p className="text-caption text-muted">Same lifestyle would need</p>
              <p className="text-h2 font-semibold text-trace-a">
                <AnimatedNumber value={equivalent} format={money} />
              </p>
              <p className="text-caption text-muted">to live like {moneyCompact(s)} in {home.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="order-1 grid min-w-0 gap-3 self-start panel p-3 sm:p-5 lg:order-2 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-small font-semibold text-ink">
            Where {moneyCompact(s)} goes further
            <SourceFootnote metric="Local prices and rents" lineage={lineage} n={1} className="ml-1" />
          </p>
          <p className="text-caption text-muted">Bigger circle = your salary goes further</p>
        </div>
        <div className="relative w-full overflow-hidden rounded-md bg-surface-sunk" style={{ aspectRatio: `${US_MAP.width} / ${US_MAP.height}` }} data-cursor="EXPLORE">
          <svg viewBox={`0 0 ${US_MAP.width} ${US_MAP.height}`} className="absolute inset-0 h-full w-full" role="img" aria-label={`Map of US metros. ${money(s)} in ${home.name} buys the same as ${money(equivalent)} in ${city.name}; money left there ${money(d.disposable)} a year.`}>
            <motion.g initial={false} animate={{ x: tx, y: ty, scale: zoom }} transition={reduce ? { duration: 0 } : { duration: DUR.large, ease: EASE.smooth }} style={{ originX: 0, originY: 0 }}>
              <path d={US_NATION} fill="var(--surface)" stroke="var(--rule-strong)" strokeWidth={1} />
              <path d={US_STATE_BORDERS} fill="none" stroke="var(--rule)" strokeWidth={0.75} />
              {cities.map((c) => {
                const on = c.id === city.id;
                const isHome = c.id === home.id;
                // purchasing power of the salary in each city, relative to home prices
                const pp = (s * home.rpp) / c.rpp;
                return (
                  <g key={c.id}>
                    <motion.circle cx={c.x} cy={c.y} initial={false} animate={{ r: on || isHome ? circle(pp) : 4 }} transition={{ duration: DUR.standard, ease: EASE.spring }} fill={isHome ? "var(--trace-c-tint)" : on ? "var(--trace-a-tint)" : "var(--ink)"} fillOpacity={on || isHome ? 1 : 0.35} stroke={isHome ? "var(--trace-c)" : on ? "var(--trace-a)" : "none"} strokeWidth={2} />
                    {(on || isHome) && (
                      <text
                        x={c.x}
                        y={c.y - circle(pp) - 8}
                        textAnchor={c.x * zoom + tx < 120 ? "start" : c.x * zoom + tx > US_MAP.width - 120 ? "end" : "middle"}
                        dx={c.x * zoom + tx < 120 ? -circle(pp) : c.x * zoom + tx > US_MAP.width - 120 ? circle(pp) : 0}
                        stroke="var(--surface)"
                        strokeWidth={5}
                        paintOrder="stroke"
                        className="fill-ink text-[18px] font-bold"
                      >
                        {c.name} {moneyCompact(pp)}
                      </text>
                    )}
                  </g>
                );
              })}
            </motion.g>
          </svg>
          {/* pointer shortcuts; the chips and "Any city" picker are the accessible equivalent */}
          {cities.map((c) => (
            <button
              key={c.id}
              type="button"
              tabIndex={-1}
              aria-hidden
              title={c.name}
              onMouseEnter={() => setCityId(c.id)}
              onClick={() => setCityId(c.id)}
              className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${((c.x * zoom + tx) / US_MAP.width) * 100}%`, top: `${((c.y * zoom + ty) / US_MAP.height) * 100}%` }}
            />
          ))}
        </div>
        <p className="text-caption text-muted">
          Circles show what {moneyCompact(s)} earned in {home.name} buys in each place (bigger = goes further). Core expenses: {money(20400)} a year at US-average prices, scaled by local prices (sample assumption).
        </p>
      </div>
    </div>
  );
}

function Row({ label, v, minus }: { label: string; v: number; minus?: boolean }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="tabular text-right font-semibold text-ink">
        {minus ? "−" : ""}
        <AnimatedNumber value={v} format={money} />
      </dd>
    </>
  );
}
