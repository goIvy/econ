"use client";

import { AnimatePresence, motion, useTransform } from "framer-motion";
import { useState } from "react";
import { AnimatedNumber, ScrollScene, scrollSceneTo, useScrollScene, useSteppedValue } from "@/components/motion";
import { Segmented } from "@/components/ui/segmented";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { COST_TONES } from "@/features/cost/cost-model";
import { enterSpring, ledgerItem } from "@/lib/animations";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CostKey } from "@/lib/calc";
import type { Lineage } from "@/types";

type Living = "campus" | "off-campus" | "home";
interface Line { key: string; label: string; amount: number }

export interface NetCostStoryProps {
  college: { name: string; shortName: string; city: string };
  byLiving: Record<Living, Line[]>;
  aid: { label: string; amount: number; lineage: Lineage };
  lineage: Lineage;
}

/**
 * "The sticker price is only the beginning." Scrolling adds each cost line to
 * a ledger and a measuring column; then grant aid slides in and subtracts.
 * Step buttons operate the same scene without scrolling.
 */
export function NetCostStory({ college, byLiving, aid, lineage }: NetCostStoryProps) {
  const { ref, progress, reduce } = useScrollScene();
  const [living, setLiving] = useState<Living>("campus");
  const lines = byLiving[living];
  const steps = lines.length + 2; // each line, aid, result
  const raw = useTransform(progress, (p) => Math.min(steps, Math.floor(p * (steps + 0.6))));
  const step = useSteppedValue(raw, 1);
  const shown = reduce ? steps : Math.max(1, step);

  const visibleLines = lines.slice(0, Math.min(lines.length, shown));
  const gross = lines.reduce((s, l) => s + l.amount, 0);
  const running = visibleLines.reduce((s, l) => s + l.amount, 0);
  const aidIn = shown > lines.length;
  const done = shown > lines.length + 1;
  const net = Math.max(0, gross - aid.amount);
  const total = aidIn ? running - aid.amount : running;

  return (
    <ScrollScene sceneRef={ref} reduce={reduce} length={3.2} label="Net price explained step by step">
      <div className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-6 md:px-8 lg:grid-cols-12 lg:gap-12 xl:px-12">
        <div className="grid content-start gap-5 lg:col-span-5">
          <div className="grid gap-3">
            <h2 id="h-sticker" className="text-h2 font-bold">
              The sticker price is only the beginning.
            </h2>
            <p className="text-lede text-ink-2">
              One year at {college.name}, line by line. Keep scrolling: costs pile up, then aid comes off the top.
            </p>
          </div>
          <StepDots count={steps} active={shown} onPick={(i) => scrollSceneTo(ref.current, (i + 0.5) / (steps + 0.6), reduce)} />
          <AnimatePresence initial={false}>
            {done && (
              <motion.div key="try" variants={ledgerItem} initial="hidden" animate="visible" exit="exit" className="grid gap-2">
                <Segmented
                  label="Try it: where would you live?"
                  value={living}
                  onChange={setLiving}
                  options={[
                    { value: "campus", label: "On campus" },
                    { value: "off-campus", label: "Apartment" },
                    { value: "home", label: "At home" },
                  ]}
                  size="sm"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-[88px_1fr] gap-5 rounded-lg border border-rule bg-surface p-4 shadow-2 sm:grid-cols-[120px_1fr] sm:p-6 lg:col-span-7">
          <Column lines={lines} shownCount={visibleLines.length} gross={gross} aid={aid.amount} aidIn={aidIn} done={done} />
          <div className="grid min-w-0 content-start gap-1">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-small font-semibold text-ink">
                {college.shortName}, one year
                <SourceFootnote metric={`${college.shortName} cost of attendance`} lineage={lineage} n={1} className="ml-1" />
              </p>
              <SampleChip />
            </div>
            <ul className="grid">
              <AnimatePresence initial={false}>
                {visibleLines.map((l, i) => (
                  <motion.li key={l.key} layout="position" variants={ledgerItem} initial="hidden" animate="visible" exit="exit" className="flex items-baseline justify-between gap-3 border-b border-rule py-1.5 text-small">
                    <span className="flex items-center gap-2 text-ink-2">
                      <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: COST_TONES[l.key as CostKey] }} />
                      {l.label}
                    </span>
                    <span className="tabular font-semibold text-ink">{i === 0 ? money(l.amount) : `+${money(l.amount)}`}</span>
                  </motion.li>
                ))}
                {aidIn && (
                  <motion.li key="aid" layout="position" variants={ledgerItem} custom={true} initial="hidden" animate="visible" exit="exit" className="flex items-baseline justify-between gap-3 border-b border-rule-strong py-1.5 text-small">
                    <span className="flex items-center gap-2 text-ink-2">
                      <span aria-hidden className="aid-hatch size-2.5 rounded-[3px] border border-ink" />
                      {aid.label}
                      <SourceFootnote metric={`${college.shortName} average grant aid`} lineage={aid.lineage} n={2} />
                    </span>
                    <span className="tabular font-semibold text-ink">−{money(aid.amount)}</span>
                  </motion.li>
                )}
              </AnimatePresence>
            </ul>
            <div className="mt-3 grid gap-1" aria-live="polite">
              <p className="text-caption text-muted">{done ? "Estimated net annual cost" : aidIn ? "After aid" : "Running total"}</p>
              <p className={cn("tabular font-semibold tracking-[-0.02em] text-ink", done ? "text-h1" : "text-h2")}>
                <AnimatedNumber value={done ? net : total} format={money} />
              </p>
              <AnimatePresence>
                {done && (
                  <motion.p key="explain" variants={ledgerItem} initial="hidden" animate="visible" exit="exit" className="text-small text-ink-2">
                    The sticker price was {money(gross)}. Aid covers {Math.round((aid.amount / gross) * 100)}% of it on average; your aid depends on your family&apos;s finances. Four years at this rate is {money(net * 4)} before loans and interest.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </ScrollScene>
  );
}

function Column({ lines, shownCount, gross, aid, aidIn, done }: { lines: Line[]; shownCount: number; gross: number; aid: number; aidIn: boolean; done: boolean }) {
  // Scale is fixed to the full sticker price so the column visibly fills up.
  const pct = (v: number) => `${(v / gross) * 100}%`;
  return (
    <div className="relative h-[300px] lg:h-[420px]" aria-hidden>
      {/* measuring rule */}
      <div className="absolute inset-y-0 left-0 w-2 border-r border-rule-strong" style={{ backgroundImage: "repeating-linear-gradient(0deg, var(--rule-strong) 0 1px, transparent 1px 10%)" }} />
      <div className="absolute inset-y-0 left-4 right-0 flex flex-col-reverse overflow-visible rounded-sm bg-surface-sunk">
        {lines.map((l, i) => (
          <motion.div
            key={l.key}
            className="w-full first:rounded-b-sm"
            initial={false}
            animate={{ height: i < shownCount ? pct(l.amount) : "0%", opacity: i < shownCount ? 1 : 0 }}
            transition={enterSpring}
            style={{ background: COST_TONES[l.key as CostKey], boxShadow: "inset 0 1px 0 var(--surface)" }}
          />
        ))}
      </div>
      <AnimatePresence>
        {aidIn && (
          <motion.div
            key="aid"
            className="aid-hatch absolute left-4 right-0 top-0 rounded-t-sm border-2 border-ink"
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 48, opacity: 0 }}
            transition={enterSpring}
            style={{ height: pct(aid) }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {done && (
          <motion.div
            key="net"
            className="absolute bottom-0 left-4 right-0 rounded-sm ring-2 ring-trace-a ring-offset-2 ring-offset-surface"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ height: pct(Math.max(0, gross - aid)) }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StepDots({ count, active, onPick }: { count: number; active: number; onPick: (i: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Jump to a step">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(i)}
          aria-label={i === count - 1 ? "Show the net cost" : i === count - 2 ? "Show aid" : `Show cost line ${i + 1}`}
          aria-current={i + 1 === active ? "step" : undefined}
          className="grid size-7 place-items-center rounded-full"
        >
          <span className={cn("block h-1.5 rounded-full transition-all duration-300", i < active ? "w-5 bg-ink" : "w-1.5 bg-rule-strong")} />
        </button>
      ))}
    </div>
  );
}
