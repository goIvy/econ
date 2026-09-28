"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { AnimatedNumber } from "@/components/motion";
import { DataKindChip, type DataKind } from "@/components/ui/data-kind";
import { DUR, EASE } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { PATH_VAR, pathNo, useScenario, type Future } from "@/features/scenario/store";

type NodeId = "tuition" | "living" | "aid" | "net" | "debt" | "employment" | "salary" | "projection" | "breakeven";

interface NodeDef {
  id: NodeId;
  label: string;
  kind: DataKind;
  formula: string;
  about: string;
  source: string;
  value: (f: Future) => string;
}

const perYear = (f: Future, keys: string[]) => f.result.costLines.filter((l) => keys.includes(l.key)).reduce((s, l) => s + l.perYear, 0);

const NODES: NodeDef[] = [
  { id: "tuition", label: "TUITION", kind: "observed", formula: "In-state or out-of-state tuition + required fees, per year", about: "Public colleges charge residents less. Private colleges charge everyone the same.", source: "IPEDS (sample data)", value: (f) => money(perYear(f, ["tuition", "fees"])) },
  { id: "living", label: "LIVING COST", kind: "observed", formula: "Housing + food + books + transportation + personal, per year", about: "On campus uses the college's room and board; off campus uses local rent; at home drops housing.", source: "IPEDS, ACS rents (sample data)", value: (f) => money(perYear(f, ["housing", "food", "books", "transportation", "misc"])) },
  { id: "aid", label: "AID", kind: "estimated", formula: "Grants + scholarships, per year", about: "Only money you never repay. Loans are not aid.", source: "Your input; college averages for reference", value: (f) => money(f.sel.aid) },
  { id: "net", label: "NET COST", kind: "estimated", formula: "(Tuition + living cost − aid) × years to graduate", about: "What college costs you after aid, before choosing how to pay it.", source: "Calculated", value: (f) => money(f.result.net.netPrice) },
  { id: "debt", label: "DEBT MODEL", kind: "projected", formula: "Borrowed = net cost − family − work − savings. Payment = P·r / (1 − (1+r)^−n), 10 years", about: "Unsubsidized federal loans build interest in school; it's added to the balance at graduation.", source: "Federal Student Aid rates, 2024–25", value: (f) => `${money(f.result.loan.repaymentBalance)} → ${money(f.result.loan.monthlyPayment)}/mo` },
  { id: "employment", label: "EMPLOYMENT MODEL", kind: "observed", formula: "Expected earnings = salary × employment rate", about: "A salary only counts if you have the job, so every year of earnings is weighted by the chance of working.", source: "College Scorecard, ACS (sample data)", value: (f) => pct(f.result.employmentRate * 100) },
  { id: "salary", label: "SALARY DISTRIBUTION", kind: "observed", formula: "10th / 25th / 50th / 75th / 90th percentiles; the median drives the projection", about: "Field-of-study earnings for this major at this college where reported; otherwise the college-wide figure.", source: "College Scorecard field of study (sample data)", value: (f) => { const p = f.ctx.outcome.earlyCareer.value; return p ? `${moneyCompact(p.p10)} – ${moneyCompact(p.p90)}` : "—"; } },
  { id: "projection", label: "10-YEAR PROJECTION", kind: "projected", formula: "Salary grows to the mid-career median over 15 years; after tax (2024 brackets); minus loan payments", about: "Everything in constant 2024 dollars. A projection under stated assumptions, not a prediction.", source: "Calculated", value: (f) => moneyCompact(f.result.tenYearEarnings) },
  { id: "breakeven", label: "BREAK-EVEN", kind: "projected", formula: "First age where cumulative value passes working from 18, and stays ahead", about: "The estimated point when the extra returns of this path recover its higher cost relative to working from 18.", source: "Calculated", value: (f) => (f.breakEven ? `Age ${f.breakEven.toFixed(1)}` : "Not by 40") },
];

/**
 * METHODOLOGY PIPELINE. The whole model as a path of clickable nodes; each
 * shows its formula, sources, kind of number, and the active path's value.
 */
export function Pipeline() {
  const { futures, active } = useScenario();
  const f = futures.find((x) => x.index === active) ?? futures[0];
  const [sel, setSel] = useState<NodeId>("net");
  const node = NODES.find((n) => n.id === sel)!;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const drawn = inView || reduce;
  const inputs = NODES.slice(0, 3);
  const chain = NODES.slice(3);

  const btn = (n: NodeDef, i: number) => (
    <motion.button
      key={n.id}
      type="button"
      onClick={() => setSel(n.id)}
      aria-pressed={sel === n.id}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={drawn ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: DUR.standard, ease: EASE.smooth, delay: 0.1 + i * 0.08 }}
      whileTap={{ scale: 0.98 }}
      className={cn("grid w-full gap-1 rounded-md border px-4 py-3 text-left transition-colors", sel === n.id ? "border-ink bg-ink text-on-ink shadow-3" : "border-rule bg-surface text-ink hover:border-rule-strong")}
    >
      <span className="text-[11px] font-bold tracking-[0.14em]">{n.label}</span>
      <span className={cn("tabular text-small font-semibold", sel === n.id ? "text-on-ink" : "text-ink-2")}>{n.value(f)}</span>
    </motion.button>
  );

  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-12">
      <div className="grid gap-2 lg:col-span-6">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
          {btn(inputs[0], 0)}
          <Op>+</Op>
          {btn(inputs[1], 1)}
          <Op>−</Op>
          {btn(inputs[2], 2)}
        </div>
        <Op vertical>=</Op>
        {chain.map((n, i) => (
          <div key={n.id} className="grid gap-2">
            {btn(n, i + 3)}
            {i < chain.length - 1 && <Connector drawn={drawn} delay={0.3 + i * 0.1} />}
          </div>
        ))}
      </div>
      <div className="lg:col-span-6">
        <div className="sticky top-[calc(var(--nav-h)+24px)] grid gap-4 rounded-lg border border-rule bg-surface p-5 shadow-2 sm:p-6" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={node.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, transition: { duration: DUR.fast, ease: EASE.exit } }} transition={{ duration: DUR.standard, ease: EASE.smooth }} className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-h3 font-bold">{node.label.charAt(0) + node.label.slice(1).toLowerCase()}</p>
                <DataKindChip kind={node.kind} />
              </div>
              <p className="rounded-md bg-surface-sunk px-3 py-2 font-mono text-small text-ink">{node.formula}</p>
              <p className="text-small text-ink-2">{node.about}</p>
              <div className="flex items-center justify-between gap-3 border-t border-rule pt-3">
                <span className="flex items-center gap-2 text-caption font-bold tracking-[0.1em] text-muted">
                  <span className="size-2 rounded-full" style={{ background: PATH_VAR[f.index] }} />
                  PATH {pathNo(f.index)}
                </span>
                <span className="tabular text-h3 font-bold text-ink">{node.id === "net" ? <AnimatedNumber value={f.result.net.netPrice} format={money} /> : node.value(f)}</span>
              </div>
              <p className="text-caption text-muted">Source: {node.source}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Op({ children, vertical }: { children: React.ReactNode; vertical?: boolean }) {
  return <span aria-hidden className={cn("grid place-items-center text-h3 font-bold text-muted", vertical && "py-1")}>{children}</span>;
}

function Connector({ drawn, delay }: { drawn: boolean; delay: number }) {
  return (
    <svg viewBox="0 0 20 24" className="mx-auto h-6 w-5" aria-hidden>
      <motion.path d="M10 0 V18 M5 13 L10 19 L15 13" fill="none" stroke="var(--trace-a)" strokeWidth={2} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: drawn ? 1 : 0 }} transition={{ duration: DUR.standard, delay }} />
    </svg>
  );
}
