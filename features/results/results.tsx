"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Plus, SlidersHorizontal } from "@/components/ui/icons";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { DataKindChip } from "@/components/ui/data-kind";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { DUR, EASE } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { goTo } from "@/lib/scroll";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { useScenario, type Future } from "@/features/scenario/store";
import { breakEvenYears, primaryFacts, residencyLabel, whatThisMeans, type Fact } from "@/features/scenario/facts";

/**
 * RESULTS. Five numbers and what they mean. Open any number for its parts
 * and its calculation. "Advanced analysis" holds the assumptions and the
 * methodology for anyone who wants to dig in.
 */
export function Results({ advanced }: { advanced: React.ReactNode }) {
  const { futures, personal } = useScenario();
  const reduce = useReducedMotion();
  const f = futures.find((x) => x.index === 0)!;
  const [open, setOpen] = useState<Fact["key"] | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const panelId = useId();
  const advId = useId();
  const facts = primaryFacts(f);
  const openFact = facts.find((x) => x.key === open);

  return (
    <section id="your-path" aria-labelledby="your-path-h" className="relative scroll-mt-[var(--nav-h)]">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
        {/* who this is */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-3">
            <p className="flex items-center gap-2 font-mono text-[0.8125rem] font-medium tracking-[0.04em] text-ink-2">
              <span className="tabular text-accent-ink">01</span>
              <span className="relative flex size-2">
                {!reduce && <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-50" />}
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              {personal ? "Your result" : "Example result"}
            </p>
            <h2 id="your-path-h" tabIndex={-1} className="text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.05em] outline-none text-balance">
              {f.ctx.college.shortName}
            </h2>
            <p className="text-lede text-ink-2">
              <span className="font-medium text-ink">{f.ctx.major.name}</span>, {residencyLabel(f)}, {f.sel.aid > 0 ? `${moneyCompact(f.sel.aid)}/yr in grants` : "no grants"}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => goTo("starter", "button")} className="gap-1.5">
            <Pencil className="size-3.5" aria-hidden /> {personal ? "Change my path" : "Use my own path"}
          </Button>
        </div>

        {/* five numbers: one lead tile, four around it */}
        <div className="bezel">
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-flow-dense lg:grid-cols-4">
            {facts.map((m) => (
              <MetricCard
                key={m.key}
                label={m.label}
                value={m.value}
                kind={m.kind}
                sub={m.sub}
                feature={m.key === "cost"}
                expanded={open === m.key}
                onToggle={() => setOpen((o) => (o === m.key ? null : m.key))}
                controls={panelId}
                className={m.key === "cost" ? "sm:col-span-2 lg:row-span-2" : undefined}
              />
            ))}
          </div>
        </div>

        {/* the parts of one number */}
        <div id={panelId} aria-live="polite" className="-mt-4 empty:hidden">
          <AnimatePresence mode="wait" initial={false}>
            {openFact && (
              <motion.div key={openFact.key} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: DUR.fast } }} transition={{ duration: DUR.standard, ease: EASE.smooth }} className="pt-4">
                <Details f={f} fact={openFact} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* what it means, and what to do next */}
        <div className="bezel">
          <div className="bezel-core grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
            <div className="grid gap-3">
              <h3 className="text-small font-medium text-ink-2">What this means</h3>
              <p className="max-w-[60ch] text-[clamp(1.125rem,1.6vw,1.375rem)] font-medium leading-[1.45] tracking-[-0.01em] text-ink text-pretty">{whatThisMeans(f)}</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
              <Button trail className="justify-between pl-5" onClick={() => goTo("compare", "h2")}>
                Compare another college
              </Button>
              <Button variant="secondary" onClick={() => goTo("break-even", "h2")}>
                See when it pays off
              </Button>
            </div>
          </div>
        </div>

        {/* for anyone who wants to dig in */}
        <div className="border-y border-rule">
          <button type="button" onClick={() => setShowAdvanced((v) => !v)} aria-expanded={showAdvanced} aria-controls={advId} className="group/adv flex w-full items-center justify-between gap-4 py-5 text-left">
            <span className="flex items-start gap-3">
              <SlidersHorizontal className="mt-0.5 size-5 shrink-0 text-ink-2" aria-hidden />
              <span className="grid gap-0.5">
                <span className="text-body font-medium text-ink">Advanced analysis</span>
                <span className="text-caption text-ink-2">Change the assumptions behind these numbers and see how each one is calculated.</span>
              </span>
            </span>
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-full ring-1 ring-rule transition-[transform,background-color,color] duration-500 ease-[var(--ease-premium)] group-hover/adv:bg-surface-sunk", showAdvanced && "rotate-45 bg-ink text-on-ink group-hover/adv:bg-ink")}>
              <Plus className="size-4" aria-hidden />
            </span>
          </button>
          <AnimatePresence initial={false}>
            {showAdvanced && (
              <motion.div id={advId} key="adv" initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0, transition: { duration: DUR.fast } }} transition={{ duration: DUR.standard, ease: EASE.smooth }} className="overflow-hidden">
                <div className="border-t border-rule py-6 sm:py-8">{advanced}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ level 2 / 3

function Details({ f, fact }: { f: Future; fact: Fact }) {
  const [calc, setCalc] = useState(false);
  const r = f.result;
  const n = r.net;
  const line = (keys: string[]) => r.costLines.filter((l) => keys.includes(l.key)).reduce((s, l) => s + l.perYear, 0);
  const p = f.ctx.outcome.earlyCareer.value;
  const be = breakEvenYears(f);

  let rows: Array<[string, string, boolean?]> = [];
  let formula = "";
  let lineage = f.ctx.college.costs.tuitionInState.lineage;
  let extra: React.ReactNode = null;

  switch (fact.key) {
    case "cost":
      rows = [
        ["Tuition & fees", `${money(line(["tuition", "fees"]))}/yr`],
        ["Housing & food", `${money(line(["housing", "food"]))}/yr`],
        ["Books, travel & personal", `${money(line(["books", "transportation", "misc"]))}/yr`],
        ["Grants & scholarships", `−${money(f.sel.aid)}/yr`],
        [`Net cost × ${n.years} years`, money(n.netPrice), true],
      ];
      formula = `(tuition + living costs − grants) × ${n.years} years = ${money(n.netPrice)}`;
      break;
    case "debt":
      rows = [
        ["Net cost", money(n.netPrice)],
        ["Family help", `−${money(n.family)}`],
        ["Work & summer jobs", `−${money(n.work)}`],
        ["Borrowed (expected debt)", money(r.loan.principal), true],
        ["Interest while in school", `+${money(r.loan.inSchoolInterest)}`],
        ["Owed at graduation", money(r.loan.repaymentBalance)],
      ];
      formula = `Borrowed = net cost − family − work. Monthly payment = P·r ÷ (1 − (1 + r)^−120) = ${money(r.loan.monthlyPayment)} for 10 years; ${money(r.loan.totalInterest)} interest in total.`;
      lineage = f.ctx.college.medianDebt.lineage;
      break;
    case "pay":
      lineage = f.ctx.outcome.earlyCareer.lineage;
      extra = !p ? (
        <p className="rounded-sm bg-surface-sunk px-3 py-2 text-small text-ink-2">We couldn&apos;t find a salary range for this major at this college, so the college-wide figure is used.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["Lower", p.p10, "10th percentile"],
              ["Typical", p.p50, "Median (50th)"],
              ["Higher", p.p90, "90th percentile"],
            ] as const
          ).map(([label, v, pctl]) => (
            <div key={label} title={pctl} className={cn("grid gap-0.5 rounded-sm p-3", label === "Typical" ? "bg-ink text-on-ink" : "bg-surface-sunk")}>
              <span className={cn("text-caption font-medium", label === "Typical" ? "text-on-ink" : "text-muted")}>{label}</span>
              <span className="tabular text-h3 font-semibold">{moneyCompact(v)}</span>
              <span className={cn("text-[11px]", label === "Typical" ? "text-on-ink/80" : "text-muted")}>{pctl}</span>
            </div>
          ))}
        </div>
      );
      rows = [["Mid-career (age 35-45)", moneyCompact(f.ctx.outcome.midCareerMedian.value ?? f.ctx.major.midCareerMedian.value)]];
      formula = "Field-of-study earnings for this major at this college where reported; otherwise the college-wide figure. The model follows the typical (median) graduate.";
      break;
    case "jobs":
      lineage = f.ctx.outcome.employmentRate.lineage;
      rows = [
        ["Working a year after graduating", pct(r.employmentRate * 100)],
        ["In graduate school", pct(f.ctx.major.gradSchoolRate.value)],
        ["Looking for work", pct(f.ctx.major.unemploymentRate.value, 1)],
      ];
      formula = "Expected earnings each year = salary × chance of being employed. A salary only counts if you have the job.";
      break;
    case "breakeven":
      rows = [
        ["Graduation", `Age ${r.graduationAge}`],
        ["Break-even", f.breakEven ? `Age ${f.breakEven.toFixed(1)}` : "Not by 40"],
        ["Years after graduation", be == null ? "n/a" : `${be.toFixed(1)} yrs`, true],
      ];
      formula = "The first age where total money earned minus costs passes what you'd have by working from 18, and stays ahead. After taxes and loan payments, in 2024 dollars.";
      lineage = f.ctx.outcome.earlyCareer.lineage;
      break;
  }

  return (
    <div className="grid gap-5 rounded-md bg-surface p-5 shadow-[0_0_0_1px_var(--rule),var(--hairline-inset),var(--shadow-2)] sm:p-7 lg:grid-cols-12">
      <div className="grid content-start gap-2 lg:col-span-4">
        <p className="flex items-center gap-2 text-body font-semibold text-ink">
          {fact.label} <DataKindChip kind={fact.kind} />
        </p>
        <p className="text-small text-ink-2">
          <span className="font-semibold text-ink">Why this matters: </span>
          {fact.why}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <SampleChip />
          <SourceFootnote metric={`${f.label}: ${fact.label}`} lineage={lineage} n={1} />
        </div>
      </div>
      <div className="grid content-start gap-3 lg:col-span-8">
        {extra}
        <dl className="grid">
          {rows.map(([k, v, strong]) => (
            <div key={k} className={cn("flex items-baseline justify-between gap-4 border-b border-rule py-2 last:border-0", strong && "border-t border-t-rule-strong")}>
              <dt className={cn("text-small", strong ? "font-semibold text-ink" : "text-ink-2")}>{k}</dt>
              <dd className={cn("tabular text-right", strong ? "text-h3 font-bold text-ink" : "text-small font-semibold text-ink")}>{v}</dd>
            </div>
          ))}
        </dl>
        <div>
          <button type="button" onClick={() => setCalc((c) => !c)} aria-expanded={calc} className="text-caption font-semibold text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-ink">
            {calc ? "Hide calculation" : "View calculation"}
          </button>
          {calc && <p className="mt-2 rounded-sm bg-surface-sunk px-3 py-2 font-mono text-caption text-ink">{formula}</p>}
        </div>
      </div>
    </div>
  );
}
