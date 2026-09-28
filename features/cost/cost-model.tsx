"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { Segmented } from "@/components/ui/segmented";
import { useCountUp } from "@/hooks/use-count-up";
import type { CostKey, CostLine, NetCostBreakdown } from "@/lib/calc/cost";
import { collapse, enterSpring } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { FundingInputs, Lineage, LivingArrangement, Residency } from "@/types";

export const COST_TONES: Record<CostKey, string> = {
  tuition: "var(--ink)",
  fees: "var(--ink-2)",
  housing: "color-mix(in srgb, var(--ink) 62%, var(--surface))",
  food: "color-mix(in srgb, var(--ink) 42%, var(--surface))",
  books: "var(--muted)",
  transportation: "color-mix(in srgb, var(--muted) 60%, var(--surface))",
  misc: "var(--rule-strong)",
};

export const FEDERAL_DEPENDENT_LIMIT = 27000;

/** Controls for residency, living arrangement and funding. */
export function CostControls({
  control,
  state,
  residency,
  onResidency,
  living,
  onLiving,
  funding,
  onFunding,
  tuitionIn,
  tuitionOut,
}: {
  control: "public" | "private";
  state: string;
  residency: Residency;
  onResidency: (r: Residency) => void;
  living: LivingArrangement;
  onLiving: (l: LivingArrangement) => void;
  funding: FundingInputs;
  onFunding: (f: FundingInputs) => void;
  tuitionIn: number;
  tuitionOut: number;
}) {
  const set = (patch: Partial<FundingInputs>) => onFunding({ ...funding, ...patch });
  return (
    <div className="grid gap-6">
      {control === "public" ? (
        <Segmented
          label={`Residency (${state})`}
          value={residency}
          onChange={onResidency}
          options={[
            { value: "resident", label: "Resident", hint: `${moneyCompact(tuitionIn)} tuition` },
            { value: "nonresident", label: "Non-resident", hint: `${moneyCompact(tuitionOut)} tuition` },
          ]}
        />
      ) : (
        <p className="rounded-sm bg-surface-sunk px-3 py-2 text-small text-ink-2">Private college: everyone pays the same tuition ({moneyCompact(tuitionIn)}), regardless of residency.</p>
      )}
      <Segmented
        label="Living arrangement"
        value={living}
        onChange={onLiving}
        options={[
          { value: "campus", label: "Campus housing" },
          { value: "off-campus", label: "Off campus" },
          { value: "home", label: "At home" },
        ]}
      />
      <GraduatedSlider label="Grant aid per year" value={funding.aidPerYear} onChange={(v) => set({ aidPerYear: v })} min={0} max={70000} step={500} format={moneyCompact} description="Need-based grants from the college, state or federal government." />
      <GraduatedSlider label="Scholarships per year" value={funding.scholarshipsPerYear} onChange={(v) => set({ scholarshipsPerYear: v })} min={0} max={40000} step={500} format={moneyCompact} />
      <GraduatedSlider label="Family contribution per year" value={funding.familyPerYear} onChange={(v) => set({ familyPerYear: v })} min={0} max={70000} step={500} format={moneyCompact} />
      <GraduatedSlider label="Work income per year" value={funding.workPerYear} onChange={(v) => set({ workPerYear: v })} min={0} max={15000} step={250} format={moneyCompact} description="Work-study and part-time jobs." />
      <GraduatedSlider label="Savings" value={funding.savings} onChange={(v) => set({ savings: v })} min={0} max={60000} step={500} format={moneyCompact} description="One-time amount applied across all years." />
    </div>
  );
}

/** Annual cost breakdown + the gross → net → borrowing ledger. */
export function CostLedger({ lines, net, lineage, title }: { lines: CostLine[]; net: NetCostBreakdown; lineage: Lineage; title: string }) {
  const perYear = lines.reduce((s, l) => s + l.perYear, 0);
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-small font-semibold text-ink">
          {title}
          <SourceFootnote metric="Cost of attendance" lineage={lineage} n={1} className="ml-1" />
        </p>
        <SampleChip />
      </div>
      <div className="flex h-6 w-full gap-[2px] overflow-hidden rounded-[6px]" role="img" aria-label={`Annual cost ${money(perYear)}: ${lines.map((l) => `${l.label} ${money(l.perYear)}`).join(", ")}`}>
        {lines.map((l) => (l.perYear > 0 ? <motion.div key={l.key} layout transition={enterSpring} className="h-full" style={{ flexGrow: l.perYear, flexBasis: 0, background: COST_TONES[l.key] }} /> : null))}
      </div>
      <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {lines.map((l) => (
          <div key={l.key} className="flex items-center justify-between gap-3 border-b border-rule py-2">
            <dt className="flex items-center gap-2 text-small text-ink-2">
              <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: COST_TONES[l.key] }} />
              {l.label}
            </dt>
            <dd>
              <Fig value={l.perYear} />
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 py-2 sm:col-span-2">
          <dt className="text-small font-semibold text-ink">Per year</dt>
          <dd>
            <Fig value={perYear} className="text-base" />
          </dd>
        </div>
      </dl>
      <div className="grid rounded-md bg-surface-sunk p-4 sm:p-5">
        <Row label={`Gross cost, ${net.years} years`} value={net.gross} strong />
        <Row label="Grant aid" value={-net.aid} />
        <Row label="Scholarships" value={-net.scholarships} />
        <Row label="Family contribution" value={-net.family} />
        <Row label="Net student cost" value={net.netStudentCost} strong rule />
        <Row label="Work income" value={-net.work} />
        <Row label="Savings" value={-net.savings} />
        <Row label="Estimated borrowing" value={net.borrowing} strong rule accent={net.borrowing > FEDERAL_DEPENDENT_LIMIT} />
        <AnimatePresence>
          {net.borrowing > FEDERAL_DEPENDENT_LIMIT && (
            <motion.p variants={collapse} initial="hidden" animate="visible" exit="exit" className="mt-3 overflow-hidden text-caption text-caution">
              More than {money(FEDERAL_DEPENDENT_LIMIT)}, the federal Direct Loan limit for a dependent undergraduate over four years. The rest would need Parent PLUS or private loans.
            </motion.p>
          )}
          {net.surplus > 0 && net.borrowing === 0 && (
            <motion.p variants={collapse} initial="hidden" animate="visible" exit="exit" className="mt-3 overflow-hidden text-caption text-gain">
              Your funding covers the full cost with {money(net.surplus)} to spare. Grant aid is capped at the cost of attendance.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Fig({ value, className }: { value: number; className?: string }) {
  const v = useCountUp(value);
  return <span className={cn("tabular text-small font-semibold text-ink", className)}>{money(v)}</span>;
}

function Row({ label, value, strong, rule, accent }: { label: string; value: number; strong?: boolean; rule?: boolean; accent?: boolean }) {
  const v = useCountUp(value);
  if (!strong && value === 0) return null;
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-1.5", rule && "mt-1 border-t border-ink/25 pt-2.5")}>
      <span className={cn("text-small", strong ? "font-semibold text-ink" : "text-ink-2")}>{label}</span>
      <span className={cn("tabular", strong ? "text-[1.125rem] font-semibold" : "text-small", accent ? "text-caution" : "text-ink")}>{value < 0 ? `− ${money(-v)}` : money(v)}</span>
    </div>
  );
}
