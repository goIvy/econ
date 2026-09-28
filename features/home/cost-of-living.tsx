"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { enterSpring } from "@/lib/animations";
import { equivalentSalary } from "@/lib/calc/earnings";
import { money, moneyCompact } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Lineage } from "@/types";

interface CityLite { id: string; name: string; state: string; rpp: number; lineage: Lineage }

/** "What is this salary worth elsewhere?" Equivalent salaries by regional price parity. */
export function CostOfLiving({ cities }: { cities: CityLite[] }) {
  const [salary, setSalary] = useState(110000);
  const [fromId, setFromId] = useState("sf");
  const from = cities.find((c) => c.id === fromId)!;
  const rows = useMemo(
    () => cities.map((c) => ({ ...c, eq: equivalentSalary(salary, from.rpp, c.rpp) })).sort((a, b) => b.eq - a.eq),
    [cities, salary, from.rpp],
  );
  const max = Math.max(...rows.map((r) => r.eq));

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="grid content-start gap-6 lg:col-span-4">
        <GraduatedSlider label="Salary" value={salary} onChange={setSalary} min={40000} max={200000} step={1000} format={moneyCompact} />
        <Combobox
          label="Earned in"
          value={fromId}
          onChange={setFromId}
          options={cities.map((c) => ({ value: c.id, label: `${c.name}, ${c.state}`, meta: `Price level ${c.rpp.toFixed(1)} (US = 100)` }))}
          searchPlaceholder="Search metros"
        />
        <p className="rounded-md bg-surface-sunk p-4 text-small text-ink-2">
          {money(salary)} in {from.name} buys about what <strong className="tabular font-semibold text-ink">{money(equivalentSalary(salary, from.rpp, 100))}</strong> buys in an average-priced U.S. metro.
        </p>
      </div>
      <div className="rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6 lg:col-span-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-small font-semibold text-ink">
            Salary with the same purchasing power
            <SourceFootnote metric="Regional price parities" lineage={from.lineage} n={1} className="ml-1" />
          </p>
          <SampleChip />
        </div>
        <ul className="grid gap-[2px]">
          {rows.map((r) => {
            const isFrom = r.id === fromId;
            return (
              <motion.li key={r.id} layout transition={enterSpring} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 py-1 sm:grid-cols-[9rem_1fr]">
                <span className={cn("truncate text-small", isFrom ? "font-semibold text-ink" : "text-ink-2")}>
                  {r.name}
                  {isFrom && <span className="sr-only"> (selected)</span>}
                </span>
                <span className="flex items-center gap-2">
                  <motion.span
                    className="block h-[18px] rounded-r-[4px]"
                    style={{ background: isFrom ? "var(--ink)" : "var(--muted)" }}
                    initial={false}
                    animate={{ width: `${(r.eq / max) * 78}%` }}
                    transition={enterSpring}
                  />
                  <span className="tabular shrink-0 text-caption font-semibold text-ink">{moneyCompact(r.eq)}</span>
                </span>
              </motion.li>
            );
          })}
        </ul>
        <p className="mt-4 text-caption text-muted">Adjusts for overall price levels (housing, goods, services). Taxes differ by state and aren&apos;t included here.</p>
      </div>
    </div>
  );
}
