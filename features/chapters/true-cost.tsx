"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { AnimatedNumber } from "@/components/motion";
import { DataKindChip } from "@/components/ui/data-kind";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { Segmented } from "@/components/ui/segmented";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import type { CostKey } from "@/lib/calc";
import { DUR, EASE } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { useScenario } from "@/features/scenario/store";
import type { LivingArrangement } from "@/types";

const PARTS: Array<{ key: CostKey; label: string }> = [
  { key: "tuition", label: "Tuition" },
  { key: "housing", label: "Housing" },
  { key: "food", label: "Food" },
  { key: "fees", label: "Fees" },
  { key: "books", label: "Books & supplies" },
  { key: "transportation", label: "Transportation" },
  { key: "misc", label: "Personal" },
];
/** One hue family, dark (tuition) to light. */
const TONE = [92, 74, 60, 48, 38, 30, 22].map((m) => `color-mix(in srgb, var(--trace-a) ${m}%, var(--paper))`);

/**
 * TRUE COST. Sticker price − aid = net cost, readable in five seconds. The
 * bar shows it: aid slides in over the sticker price and what's left is what
 * you pay. "Where does the money go?" opens the breakdown.
 */
export function TrueCost() {
  const { futures, paths, setPath } = useScenario();
  const f = futures.find((x) => x.index === 0)!;
  const sel = paths[0];
  const n = f.result.net;
  const years = n.years;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const reduce = useReducedMotion();
  const shown = inView || reduce;
  const [open, setOpen] = useState(false);
  const sticker = n.gross;
  const aid = n.aid + n.scholarships;
  const net = n.netPrice;
  const aidShare = sticker > 0 ? Math.min(1, aid / sticker) : 0;
  const lines = PARTS.map((p, i) => ({ ...p, tone: TONE[i], perYear: f.result.costLines.find((l) => l.key === p.key)?.perYear ?? 0 })).filter((l) => l.perYear > 0);
  const grossYear = lines.reduce((s, l) => s + l.perYear, 0);

  return (
    <div ref={ref} className="grid gap-8">
      {/* the equation */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-end">
        <Term label="Sticker price" sub={`${years} years, before aid`} value={sticker} />
        <Op>−</Op>
        <Term label="Grants & scholarships" sub={`${money(sel.aid)} a year`} value={aid} />
        <Op>=</Op>
        <Term label="Net cost" sub="What you actually pay" value={net} strong />
      </div>

      {/* the bar: sticker price, with aid sliding over it */}
      <div className="grid gap-2" aria-hidden>
        <div className="relative h-14 overflow-hidden rounded-md bg-surface-sunk">
          <motion.div className="absolute inset-y-0 left-0 flex" initial={{ width: reduce ? "100%" : "0%" }} animate={{ width: shown ? "100%" : "0%" }} transition={{ duration: reduce ? 0 : 0.9, ease: EASE.smooth }}>
            {lines.map((l) => (
              <motion.span key={l.key} className="h-full" style={{ background: l.tone, boxShadow: "inset -2px 0 0 var(--surface-sunk)" }} initial={false} animate={{ width: `${(l.perYear / grossYear) * 100}%` }} transition={{ duration: DUR.standard, ease: EASE.smooth }} />
            ))}
          </motion.div>
          <motion.div
            className="aid-hatch absolute inset-y-0 right-0 border-l-2 border-ink"
            initial={{ width: "0%" }}
            animate={{ width: shown ? `${aidShare * 100}%` : "0%" }}
            transition={{ duration: reduce ? 0 : DUR.large, ease: EASE.smooth, delay: reduce ? 0 : 0.9 }}
          />
        </div>
        <div className="flex justify-between text-caption text-muted">
          <span>You pay {moneyCompact(net)}</span>
          <span>Grants cover {moneyCompact(aid)}</span>
        </div>
      </div>

      {/* change it */}
      <div className="grid gap-5 rounded-md border border-rule bg-surface p-4 sm:grid-cols-2 sm:p-5">
        <GraduatedSlider size="sm" label="Grants & scholarships per year" value={sel.aid} onChange={(v) => void setPath(0, { aid: v })} min={0} max={60000} step={1000} format={moneyCompact} trace="a" />
        <Segmented
          label="Where you live"
          size="sm"
          value={sel.living}
          onChange={(v: LivingArrangement) => void setPath(0, { living: v })}
          options={[
            { value: "campus", label: "On campus" },
            { value: "off-campus", label: "Apartment" },
            { value: "home", label: "At home" },
          ]}
        />
      </div>

      {/* where the money goes */}
      <div className="rounded-md border border-rule bg-surface">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="money-goes" className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5">
          <span className="text-small font-bold text-ink">Where does the money go?</span>
          <ChevronDown className={cn("size-5 text-ink-2 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div id="money-goes" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : DUR.standard, ease: EASE.smooth }} className="overflow-hidden">
              <div className="grid gap-3 border-t border-rule p-4 sm:p-5">
                <p className="text-caption text-muted">One year at {f.ctx.college.shortName}</p>
                <ul className="grid gap-2">
                  {lines.map((l) => (
                    <li key={l.key} className="grid grid-cols-[8.5rem_1fr_auto] items-center gap-3 text-small sm:grid-cols-[11rem_1fr_auto]">
                      <span className="flex items-center gap-2 text-ink-2">
                        <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: l.tone }} />
                        {l.label}
                      </span>
                      <span className="h-2 rounded-full bg-surface-sunk">
                        <motion.span className="block h-full rounded-full" style={{ background: l.tone }} initial={{ width: 0 }} animate={{ width: `${(l.perYear / grossYear) * 100}%` }} transition={{ duration: reduce ? 0 : DUR.large, ease: EASE.smooth }} />
                      </span>
                      <span className="tabular font-semibold text-ink">{money(l.perYear)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3">
                  <span className="flex items-center gap-2 text-caption text-muted">
                    <DataKindChip kind="observed" /> Published costs; living costs follow where you live.
                  </span>
                  <span className="flex items-center gap-2">
                    <SampleChip />
                    <SourceFootnote metric={`${f.ctx.college.shortName} cost of attendance`} lineage={f.ctx.college.costs.tuitionInState.lineage} n={1} />
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Term({ label, sub, value, strong }: { label: string; sub: string; value: number; strong?: boolean }) {
  return (
    <div className={cn("grid gap-1 rounded-md p-4", strong ? "bg-ink text-on-ink" : "border border-rule bg-surface")}>
      <p className={cn("text-caption font-semibold", strong ? "text-on-ink" : "text-ink-2")}>{label}</p>
      <p className="tabular text-[clamp(2rem,4vw,3rem)] font-extrabold leading-none tracking-[-0.04em]">
        <AnimatedNumber value={value} format={moneyCompact} />
      </p>
      <p className={cn("text-caption", strong ? "text-on-ink/80" : "text-muted")}>{sub}</p>
    </div>
  );
}

function Op({ children }: { children: string }) {
  return (
    <span className="-my-2 text-center text-h3 font-bold leading-none text-muted sm:my-0 sm:pb-8 sm:text-h2">
      <span aria-hidden>{children}</span>
      <span className="sr-only">{children === "=" ? "equals" : "minus"}</span>
    </span>
  );
}
