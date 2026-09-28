"use client";

import { AnimatePresence, motion, useTransform } from "framer-motion";
import { useMemo } from "react";
import { AnimatedNumber, ScrollScene, scrollSceneTo, useScrollScene, useSteppedValue } from "@/components/motion";
import { Segmented } from "@/components/ui/segmented";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { annualCostLines, type CostKey } from "@/lib/calc";
import { DUR, EASE } from "@/lib/animations";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PATH_VAR, pathNo, useScenario } from "@/features/scenario/store";
import type { LivingArrangement } from "@/types";

/** The order costs arrive in, largest first after tuition. */
const ORDER: CostKey[] = ["tuition", "housing", "food", "fees", "transportation", "books", "misc"];
const LABELS: Record<CostKey, string> = { tuition: "TUITION", housing: "HOUSING", food: "FOOD", fees: "FEES", transportation: "TRANSPORTATION", books: "BOOKS", misc: "PERSONAL" };
/** Stack tones: one hue family, dark (tuition) to light. */
const TONE: Record<CostKey, string> = {
  tuition: "color-mix(in srgb, var(--trace-a) 92%, var(--paper))",
  housing: "color-mix(in srgb, var(--trace-a) 74%, var(--paper))",
  food: "color-mix(in srgb, var(--trace-a) 58%, var(--paper))",
  fees: "color-mix(in srgb, var(--trace-a) 46%, var(--paper))",
  transportation: "color-mix(in srgb, var(--trace-a) 36%, var(--paper))",
  books: "color-mix(in srgb, var(--trace-a) 28%, var(--paper))",
  misc: "color-mix(in srgb, var(--trace-a) 22%, var(--paper))",
};
const FAMILY = 10000;
const WORK = 3000;

type Step =
  | { kind: "cost"; key: CostKey; label: string; amount: number }
  | { kind: "total"; label: string; amount: number }
  | { kind: "aid"; label: string; amount: number }
  | { kind: "net"; label: string; amount: number }
  | { kind: "pay"; label: string; amount: number };

/**
 * TRUE COST. Scroll adds one line at a time: each cost slides in from
 * alternating sides and lands on the stack; aid slides in and subtracts;
 * the result is the net cost, then how that net cost actually gets paid.
 */
export function TrueCost() {
  const { futures, active, setPath, paths } = useScenario();
  const f = futures.find((x) => x.index === active) ?? futures[0];
  const sel = paths[f.index];
  const { ref, progress, reduce } = useScrollScene();

  const steps = useMemo<Step[]>(() => {
    const lines = annualCostLines(f.ctx.college, f.ctx.college.control === "public" ? sel.residency : "resident", sel.living, f.ctx.collegeCity);
    const costs = ORDER.flatMap((k) => {
      const l = lines.find((x) => x.key === k);
      return l && l.perYear > 0 ? [{ kind: "cost" as const, key: k, label: LABELS[k], amount: Math.round(l.perYear) }] : [];
    });
    const gross = costs.reduce((s, c) => s + c.amount, 0);
    const aid = Math.min(sel.aid, gross);
    const net = gross - aid;
    const family = Math.min(FAMILY, net);
    const work = Math.min(WORK, net - family);
    return [
      ...costs,
      { kind: "total", label: "COST OF ATTENDANCE", amount: gross },
      { kind: "aid", label: "GRANTS & SCHOLARSHIPS", amount: aid },
      { kind: "net", label: "NET COST", amount: net },
      { kind: "pay", label: "FAMILY CONTRIBUTION", amount: family },
      { kind: "pay", label: "WORK & SUMMER JOBS", amount: work },
      { kind: "pay", label: "BORROWED", amount: Math.max(0, net - family - work) },
    ];
  }, [f, sel.residency, sel.living, sel.aid]);

  // Thresholds from 0.10 to 0.90 across the scroll, one step at a time.
  const n = steps.length;
  const threshold = (i: number) => 0.1 + (0.8 * i) / (n - 1);
  const raw = useTransform(progress, (p) => steps.reduce((c, _, i) => (p >= threshold(i) ? i + 1 : c), 0));
  const stepped = useSteppedValue(raw, 1);
  const shown = reduce ? n : Math.max(1, stepped);

  const gross = steps.find((s) => s.kind === "total")!.amount;
  const aid = steps.find((s) => s.kind === "aid")!.amount;
  const net = steps.find((s) => s.kind === "net")!.amount;
  const costSteps = steps.filter((s): s is Extract<Step, { kind: "cost" }> => s.kind === "cost");
  const visible = steps.slice(0, shown);
  const running = visible.filter((s) => s.kind === "cost").reduce((t, s) => t + s.amount, 0) - (shown > costSteps.length + 1 ? aid : 0);
  const phase = shown <= costSteps.length ? "adding" : shown <= costSteps.length + 1 ? "total" : shown <= costSteps.length + 3 ? "net" : "paying";

  return (
    <ScrollScene sceneRef={ref} reduce={reduce} length={3.6} label="How net cost is built, one line at a time">
      <div className="grid w-full items-center gap-6 py-4 lg:grid-cols-[1fr_minmax(0,440px)_1fr] lg:gap-10">
        {/* left: context + controls */}
        <div className="order-3 grid content-start gap-4 lg:order-1">
          <p className="flex items-center gap-2 text-caption font-bold tracking-[0.12em] text-muted">
            <span className="size-2 rounded-full" style={{ background: PATH_VAR[f.index] }} />
            PATH {pathNo(f.index)} · ONE YEAR
          </p>
          <p className="text-h3 font-bold text-ink">{f.label}</p>
          <p className="text-small text-ink-2">
            {f.ctx.college.control === "public" ? (sel.residency === "resident" ? `In-state (${f.ctx.college.state})` : "Out-of-state") : "Private"}, {money(sel.aid)} a year in grants. Change the path in the hero and this story follows.
          </p>
          <Segmented
            label="Where you live"
            size="sm"
            value={sel.living}
            onChange={(v: LivingArrangement) => void setPath(f.index, { living: v })}
            options={[
              { value: "campus", label: "Campus" },
              { value: "off-campus", label: "Apartment" },
              { value: "home", label: "Home" },
            ]}
          />
          <StepDots n={n} shown={shown} onPick={(i) => scrollSceneTo(ref.current, threshold(i) + 0.01, reduce)} />
          <div className="flex items-center gap-2">
            <SampleChip />
            <SourceFootnote metric={`${f.ctx.college.shortName} cost of attendance`} lineage={f.ctx.college.costs.tuitionInState.lineage} n={1} />
          </div>
        </div>

        {/* center: the calculation */}
        <div className="order-1 grid gap-1.5 lg:order-2" aria-live="polite">
          <ol className="grid gap-0.5">
            <AnimatePresence initial={false}>
              {visible.map((s, i) => (
                <motion.li
                  key={`${s.label}`}
                  layout="position"
                  initial={reduce ? false : { opacity: 0, x: i % 2 ? 56 : -56 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, transition: { duration: DUR.fast } }}
                  transition={{ duration: DUR.standard, ease: EASE.spring }}
                  className={cn(
                    "flex items-baseline justify-between gap-4 rounded-sm px-3 py-1",
                    s.kind === "total" && "mt-1.5 border-t border-rule-strong pt-2.5",
                    s.kind === "net" && "my-1.5 bg-surface py-2.5 shadow-2",
                  )}
                >
                  <span className={cn("text-[11px] font-bold tracking-[0.14em]", s.kind === "net" ? "text-ink" : "text-muted")}>
                    {s.kind === "pay" && s.label === "FAMILY CONTRIBUTION" && <span className="mb-1 block text-[10px] tracking-[0.16em] text-trace-a">HOW IT&apos;S PAID</span>}
                    {s.label}
                  </span>
                  <span className={cn("tabular font-bold tracking-[-0.02em]", s.kind === "net" ? "text-h2 text-ink" : s.kind === "total" ? "text-h3 text-ink" : "text-base text-ink-2")}>
                    {s.kind === "cost" && i > 0 ? "+" : s.kind === "aid" ? "−" : ""}
                    {money(s.amount)}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
          <AnimatePresence initial={false}>
            {(phase === "adding" || phase === "total") && (
              <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0, transition: { duration: DUR.fast } }} className="mt-3 flex items-baseline justify-between gap-3 border-t border-rule px-3 pt-3">
                <span className="text-caption text-muted">{phase === "adding" ? "Adding up" : "The sticker price"}</span>
                <span className="tabular text-metric font-extrabold">
                  <AnimatedNumber value={running} format={money} />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {phase === "paying" && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-3 text-small text-ink-2">
                The sticker price was {money(gross)}. Grants cover {Math.round((aid / gross) * 100)}%. Family and work pay part of the rest; the remainder is borrowed and repaid later, with interest.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* right: the cost stack */}
        <CostStack steps={steps} shown={shown} gross={gross} aid={aid} net={net} reduce={reduce} />
      </div>
    </ScrollScene>
  );
}

function CostStack({ steps, shown, gross, aid, net, reduce }: { steps: Step[]; shown: number; gross: number; aid: number; net: number; reduce: boolean }) {
  const costs = steps.filter((s): s is Extract<Step, { kind: "cost" }> => s.kind === "cost");
  const aidIn = shown > costs.length + 1;
  const payIn = shown > costs.length + 3;
  const pays = steps.filter((s) => s.kind === "pay");
  // Where each block starts, as a share of the stack (precomputed, no mutation during render).
  const starts = costs.map((_, i) => costs.slice(0, i).reduce((t, c) => t + (c.amount / gross) * 100, 0));
  return (
    <div className="order-2 mx-auto w-full max-w-[220px] lg:order-3" aria-hidden>
      <div className="relative h-[240px] rounded-md border border-rule bg-surface-sunk sm:h-[300px] lg:h-[440px]">
        {costs.map((c, i) => {
          const h = (c.amount / gross) * 100;
          const b = starts[i];
          return (
            <motion.div
              key={c.key}
              className="absolute inset-x-2 origin-bottom rounded-[4px]"
              style={{ bottom: `${b}%`, height: `calc(${h}% - 2px)`, background: TONE[c.key] }}
              initial={false}
              animate={{ scaleY: i < shown ? 1 : 0, opacity: i < shown ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : DUR.standard, ease: EASE.spring }}
            />
          );
        })}
        {/* aid drops in from above and removes the top of the stack */}
        <AnimatePresence>
          {aidIn && (
            <motion.div
              key="aid"
              className="aid-hatch absolute inset-x-1 rounded-[4px] border-2 border-ink"
              style={{ top: 0, height: `${(aid / gross) * 100}%` }}
              initial={reduce ? false : { y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.large, ease: EASE.spring }}
            />
          )}
        </AnimatePresence>
        {/* how the net cost is paid, as bands inside the remaining stack */}
        <AnimatePresence>
          {payIn &&
            pays.reduce<{ els: React.ReactNode[]; at: number }>(
              (acc, p, i) => {
                const h = (p.amount / gross) * 100;
                acc.els.push(
                  <motion.div
                    key={p.label}
                    className="absolute inset-x-0 flex items-center justify-end border-t border-dashed border-ink/40 pr-1"
                    style={{ bottom: `${acc.at}%`, height: `${h}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.12 }}
                  />,
                );
                acc.at += h;
                return acc;
              },
              { els: [], at: 0 },
            ).els}
        </AnimatePresence>
      </div>
      <p className="mt-2 text-center text-caption text-muted">{aidIn ? `Net ${money(net)} of ${money(gross)}` : "Cost of attendance"}</p>
    </div>
  );
}

function StepDots({ n, shown, onPick }: { n: number; shown: number; onPick: (i: number) => void }) {
  return (
    <div role="group" aria-label="Jump to a step" className="flex flex-wrap gap-1">
      {Array.from({ length: n }, (_, i) => (
        <button key={i} type="button" onClick={() => onPick(i)} aria-label={`Step ${i + 1} of ${n}`} aria-current={i + 1 === shown ? "step" : undefined} className="grid size-7 place-items-center rounded-full">
          <span className={cn("block h-1.5 rounded-full transition-all duration-300", i < shown ? "w-4 bg-trace-a" : "w-1.5 bg-rule-strong")} />
        </button>
      ))}
    </div>
  );
}
