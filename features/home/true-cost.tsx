"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { Segmented } from "@/components/ui/segmented";
import { useCountUp } from "@/hooks/use-count-up";
import { calculateNetCost, sumLines, type CostKey, type CostLine } from "@/lib/calc/cost";
import { collapse, enterSpring } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Lineage } from "@/types";

type Living = "campus" | "off-campus" | "home";
type Residency = "resident" | "nonresident";

/** Stack order + tone for the sticker-price bar (neutral steps, not series colors). */
const TONES: Record<CostKey, string> = {
  tuition: "var(--ink)",
  fees: "var(--ink-2)",
  housing: "color-mix(in srgb, var(--ink) 62%, var(--surface))",
  food: "color-mix(in srgb, var(--ink) 42%, var(--surface))",
  books: "var(--muted)",
  transportation: "color-mix(in srgb, var(--muted) 60%, var(--surface))",
  misc: "var(--rule-strong)",
};

export function TrueCost({
  college,
  combos,
  lineage,
}: {
  college: { shortName: string; state: string; city: string };
  combos: Record<string, CostLine[]>;
  lineage: Lineage;
}) {
  const [residency, setResidency] = useState<Residency>("resident");
  const [living, setLiving] = useState<Living>("campus");
  const [aid, setAid] = useState(12000);
  const [family, setFamily] = useState(8000);
  const lines = combos[`${residency}:${living}`];
  const perYear = sumLines(lines);
  const net = calculateNetCost(perYear, 4, { aidPerYear: aid, scholarshipsPerYear: 0, familyPerYear: family, workPerYear: 3000, savings: 0 });

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="grid content-start gap-6 lg:col-span-5">
        <Segmented
          label={`Residency at ${college.shortName}`}
          value={residency}
          onChange={setResidency}
          options={[
            { value: "resident", label: `${college.state} resident` },
            { value: "nonresident", label: "Out-of-state" },
          ]}
        />
        <Segmented
          label="Where you live"
          value={living}
          onChange={setLiving}
          options={[
            { value: "campus", label: "Campus" },
            { value: "off-campus", label: "Off campus" },
            { value: "home", label: "At home" },
          ]}
        />
        <GraduatedSlider label="Grants and scholarships per year" value={aid} onChange={setAid} min={0} max={40000} step={500} format={moneyCompact} description="Money you don't pay back." />
        <GraduatedSlider label="Family contribution per year" value={family} onChange={setFamily} min={0} max={40000} step={500} format={moneyCompact} />
        <p className="text-caption text-muted">Plus $3,000 a year from part-time work. Off-campus rent uses the {college.city} market.</p>
      </div>

      <div className="rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6 lg:col-span-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-small font-semibold text-ink">
            {college.shortName}, one year, before aid
            <SourceFootnote metric="Cost of attendance" lineage={lineage} n={1} className="ml-1" />
          </p>
          <SampleChip />
        </div>

        {/* sticker-price bar: 2px surface gaps between segments */}
        <div className="flex h-6 w-full gap-[2px] overflow-hidden rounded-[6px]" role="img" aria-label={`Annual cost ${money(perYear)}: ${lines.map((l) => `${l.label} ${money(l.perYear)}`).join(", ")}`}>
          {lines.map((l) =>
            l.perYear > 0 ? (
              <motion.div key={l.key} layout transition={enterSpring} className="h-full" style={{ flexGrow: l.perYear, flexBasis: 0, background: TONES[l.key] }} />
            ) : null,
          )}
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {lines.map((l) => (
            <div key={l.key} className="flex items-center justify-between gap-3 border-b border-rule py-2">
              <dt className="flex items-center gap-2 text-small text-ink-2">
                <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: TONES[l.key] }} />
                {l.label}
              </dt>
              <dd>
                <Figure value={l.perYear} />
              </dd>
            </div>
          ))}
        </dl>

        {/* the ledger: gross → net */}
        <div className="mt-6 grid gap-0 rounded-md bg-surface-sunk p-4 sm:p-5">
          <LedgerRow label="Gross cost, 4 years" value={net.gross} strong />
          <LedgerRow label="Grants and scholarships" value={-(net.aid + net.scholarships)} />
          <LedgerRow label="Family contribution" value={-net.family} />
          <LedgerRow label="Net student cost" value={net.netStudentCost} strong rule />
          <LedgerRow label="Work income" value={-net.work} />
          <LedgerRow label="Estimated borrowing" value={net.borrowing} strong rule accent={net.borrowing > 40000 ? "caution" : undefined} />
          <AnimatePresence>
            {net.borrowing > 27000 && (
              <motion.p variants={collapse} initial="hidden" animate="visible" exit="exit" className="mt-3 overflow-hidden text-caption text-caution">
                Above $27,000, the most a dependent undergraduate can borrow in federal Direct Loans over four years. The rest would need Parent PLUS or private loans, usually at higher rates.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Figure({ value, className }: { value: number; className?: string }) {
  const v = useCountUp(value);
  return <span className={cn("tabular text-small font-semibold text-ink", className)}>{money(v)}</span>;
}

function LedgerRow({ label, value, strong, rule, accent }: { label: string; value: number; strong?: boolean; rule?: boolean; accent?: "caution" }) {
  const v = useCountUp(value);
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-1.5", rule && "mt-1 border-t border-ink/25 pt-2.5")}>
      <span className={cn("text-small", strong ? "font-semibold text-ink" : "text-ink-2")}>{label}</span>
      <span className={cn("tabular", strong ? "text-[1.125rem] font-semibold" : "text-small", accent === "caution" ? "text-caution" : "text-ink")}>
        {value < 0 ? `− ${money(-v)}` : money(v)}
      </span>
    </div>
  );
}
