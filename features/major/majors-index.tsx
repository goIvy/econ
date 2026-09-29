"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search } from "@/components/ui/icons";
import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { SampleChip } from "@/components/ui/lineage";
import { collapse, microSpring } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { cn } from "@/lib/cn";
import { MajorPanel, type MajorBundle } from "./major-panel";

const CATS = ["All", "Engineering & computing", "Business & economics", "Math & physical sciences", "Life & health sciences", "Social sciences", "Humanities & arts", "Applied & professional"] as const;
const SHORT: Record<string, string> = {
  All: "All",
  "Engineering & computing": "Engineering",
  "Business & economics": "Business",
  "Math & physical sciences": "Math & science",
  "Life & health sciences": "Health",
  "Social sciences": "Social sci.",
  "Humanities & arts": "Humanities",
  "Applied & professional": "Applied",
};

/** Major selector (§10): search, filter by field, expand for full national outcomes. */
export function MajorsIndex({ bundles }: { bundles: MajorBundle[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(
    () =>
      bundles
        .filter((b) => (cat === "All" || b.major.category === cat) && b.major.name.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => b.major.earlyCareer.value!.p50 - a.major.earlyCareer.value!.p50),
    [bundles, q, cat],
  );

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="relative block">
          <span className="sr-only">Search majors</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search majors, like Economics or Nursing" className="h-12 w-full rounded-md border border-rule-strong bg-surface pl-12 pr-4 text-base text-ink shadow-1 outline-none placeholder:text-muted focus:border-trace-a" />
        </label>
        <SampleChip className="justify-self-start" />
      </div>
      <Segmented label="Field" hideLabel size="sm" wrap value={cat} onChange={setCat} options={CATS.map((c) => ({ value: c, label: SHORT[c] }))} />

      <p className="text-small text-muted" aria-live="polite">
        {list.length} {list.length === 1 ? "major" : "majors"}, sorted by median early-career earnings
      </p>
      {list.length === 0 ? (
        <p className="rounded-md border border-dashed border-rule-strong p-6 text-small text-ink-2">No majors match. Try a shorter search, like &ldquo;engineer&rdquo; or &ldquo;bio&rdquo;.</p>
      ) : (
        <ul className="divide-y divide-rule overflow-hidden panel">
          {list.map((b) => {
            const m = b.major;
            const isOpen = open === m.id;
            const p = m.earlyCareer.value!;
            return (
              <li key={m.id}>
                <button type="button" onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen} aria-controls={`major-${m.id}`} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 text-left hover:bg-paper sm:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_auto_auto] sm:px-6">
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{m.name}</span>
                    <span className="block text-caption text-muted">{m.category}</span>
                  </span>
                  <span className="relative hidden h-4 sm:block" aria-hidden>
                    <span className="absolute top-1/2 h-px -translate-y-1/2 bg-rule-strong" style={{ left: `${(p.p10 / 160000) * 100}%`, width: `${((p.p90 - p.p10) / 160000) * 100}%` }} />
                    <span className="absolute inset-y-[3px] rounded-[3px] bg-ink/15" style={{ left: `${(p.p25 / 160000) * 100}%`, width: `${((p.p75 - p.p25) / 160000) * 100}%` }} />
                    <span className="absolute inset-y-0 w-[2px] bg-ink" style={{ left: `${(p.p50 / 160000) * 100}%` }} />
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="tabular block text-small font-semibold text-ink">{money(p.p50)}</span>
                    <span className="block text-caption text-muted">{pct(m.unemploymentRate.value, 1)} unemployed</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular text-small font-semibold text-ink sm:hidden">{moneyCompact(p.p50)}</span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={microSpring} className="grid size-8 place-items-center rounded-full border border-rule-strong text-ink-2">
                      <ChevronDown className="size-4" aria-hidden />
                    </motion.span>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div id={`major-${m.id}`} variants={collapse} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                      <div className={cn("border-t border-rule bg-paper px-4 py-6 sm:px-6")}>
                        <p className="measure mb-6 text-small text-ink-2">{m.blurb} National figures for bachelor&apos;s degree holders; open a college to see its program-level data.</p>
                        <MajorPanel bundle={b} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
