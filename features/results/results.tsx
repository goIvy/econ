"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { ArrowLeft, ArrowRight, Compass, Pencil } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useMeasuredWidth } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { Segmented } from "@/components/ui/segmented";
import { DataKindChip } from "@/components/ui/data-kind";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { linear, linePath, valueAt } from "@/components/charts/scale";
import { DUR, EASE } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { goTo } from "@/lib/scroll";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { HORIZON, PATH_VAR, useScenario, type Future } from "@/features/scenario/store";
import { breakEvenYears, primaryFacts, residencyLabel, whatThisMeans, type Fact } from "@/features/scenario/facts";

type Mode = "simple" | "advanced";

/**
 * RESULTS. Level 1: five numbers and what they mean. Level 2: open any number
 * for its parts. Level 3: "View calculation" for the formula. Advanced mode
 * adds the assumptions, distributions and methodology underneath.
 */
export function Results({ advanced }: { advanced: React.ReactNode }) {
  const { futures, personal } = useScenario();
  const f = futures.find((x) => x.index === 0)!;
  const [mode, setMode] = useState<Mode>("simple");
  const [open, setOpen] = useState<Fact["key"] | null>(null);
  const [guided, setGuided] = useState(false);
  const panelId = useId();
  const facts = primaryFacts(f);
  const openFact = facts.find((x) => x.key === open);

  return (
    <section id="your-path" aria-labelledby="your-path-h" className="relative scroll-mt-[var(--nav-h)] bg-paper">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-16 md:px-8 md:py-24">
        {/* who this is */}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="grid gap-2">
            <p className="text-caption font-semibold tracking-[0.18em] text-trace-a">{personal ? "YOUR PATH" : "EXAMPLE RESULT"}</p>
            <h2 id="your-path-h" tabIndex={-1} className="text-[clamp(2rem,4.4vw,3.5rem)] font-extrabold uppercase leading-none tracking-[-0.04em] outline-none">
              {f.ctx.college.shortName}
            </h2>
            <p className="text-lede text-ink-2">
              <span className="font-semibold text-ink">{f.ctx.major.name}</span> · {residencyLabel(f)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="quiet" size="sm" onClick={() => goTo("starter", "button")} className="gap-1.5">
              <Pencil className="size-3.5" aria-hidden /> Change
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setGuided((g) => !g)} aria-pressed={guided} className="gap-1.5">
              <Compass className="size-4" aria-hidden /> {guided ? "Exit guided view" : "Guided view"}
            </Button>
            <Segmented label="Detail level" hideLabel size="sm" value={mode} onChange={setMode} options={[{ value: "simple", label: "Simple" }, { value: "advanced", label: "Advanced" }]} />
          </div>
        </div>
        {!personal && (
          <p className="-mt-4 text-small text-muted">
            This is an example.{" "}
            <button type="button" onClick={() => goTo("starter", "button")} className="font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
              Build your own path
            </button>{" "}
            to see your numbers.
          </p>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {guided ? (
            <motion.div key="guided" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: DUR.fast } }} transition={{ duration: DUR.standard, ease: EASE.smooth }}>
              <Guided f={f} onDone={() => setGuided(false)} />
            </motion.div>
          ) : (
            <motion.div key="all" className="grid gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: DUR.fast } }}>
              {/* level 1 */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {facts.map((m) => (
                  <MetricCard
                    key={m.key}
                    label={m.label}
                    value={m.value}
                    kind={m.kind}
                    sub={m.sub}
                    expanded={open === m.key}
                    onToggle={() => setOpen((o) => (o === m.key ? null : m.key))}
                    controls={panelId}
                    className={m.key === "breakeven" ? "sm:col-span-2 lg:col-span-1" : undefined}
                  />
                ))}
              </div>

              {/* level 2 + 3 */}
              <div id={panelId} aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  {openFact && (
                    <motion.div key={openFact.key} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: DUR.fast } }} transition={{ duration: DUR.standard, ease: EASE.smooth }}>
                      <Details f={f} fact={openFact} advanced={mode === "advanced"} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
                <div className="grid gap-3 rounded-md border border-rule bg-surface-sunk p-5 lg:col-span-5">
                  <h3 className="text-small font-bold text-ink">What this means</h3>
                  <p className="text-lede text-ink">{whatThisMeans(f)}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" onClick={() => goTo("compare", "h2")}>
                      Compare another college
                    </Button>
                    <Button size="sm" variant="quiet" onClick={() => goTo("true-cost", "h2")}>
                      Explore the details
                    </Button>
                  </div>
                </div>
                <div className="lg:col-span-7">
                  <PathChart f={f} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {mode === "advanced" && !guided && (
            <motion.div key="adv" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: DUR.fast } }} transition={{ duration: DUR.large, ease: EASE.smooth }} className="grid gap-6 border-t border-rule pt-10">
              <div className="grid gap-2">
                <p className="text-caption font-semibold tracking-[0.18em] text-trace-a">ADVANCED ANALYSIS</p>
                <p className="max-w-[44rem] text-small text-ink-2">Every assumption behind the numbers above, the full salary and job distributions, and how each figure is calculated.</p>
              </div>
              {advanced}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ level 2 / 3

function Details({ f, fact, advanced }: { f: Future; fact: Fact; advanced: boolean }) {
  const [calc, setCalc] = useState(advanced);
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
              <span className={cn("text-[11px] font-bold tracking-[0.12em]", label === "Typical" ? "text-on-ink" : "text-muted")}>{label.toUpperCase()}</span>
              <span className="tabular text-h3 font-extrabold">{moneyCompact(v)}</span>
              {advanced && <span className={cn("text-[11px]", label === "Typical" ? "text-on-ink/80" : "text-muted")}>{pctl}</span>}
            </div>
          ))}
        </div>
      );
      rows = [["Mid-career (age 35–45)", moneyCompact(f.ctx.outcome.midCareerMedian.value ?? f.ctx.major.midCareerMedian.value)]];
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
        ["Years after graduation", be == null ? "—" : `${be.toFixed(1)} yrs`, true],
      ];
      formula = "The first age where total money earned minus costs passes what you'd have by working from 18, and stays ahead. After taxes and loan payments, in 2024 dollars.";
      lineage = f.ctx.outcome.earlyCareer.lineage;
      break;
  }

  return (
    <div className="grid gap-5 rounded-md border border-rule bg-surface p-5 shadow-2 sm:p-6 lg:grid-cols-12">
      <div className="grid content-start gap-2 lg:col-span-4">
        <p className="flex items-center gap-2 text-small font-bold text-ink">
          {fact.label} <DataKindChip kind={fact.kind} />
        </p>
        <p className="text-small text-ink-2">
          <span className="font-semibold text-ink">Why this matters: </span>
          {fact.why}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <SampleChip />
          <SourceFootnote metric={`${f.label} · ${fact.label}`} lineage={lineage} n={1} />
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

// ------------------------------------------------------------------ basic chart

/** Total money earned minus costs, by age: this path vs. working from 18. */
export function PathChart({ f, compact }: { f: Future; compact?: boolean }) {
  const { baselineSeries } = useScenario();
  const reduce = useReducedMotion();
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(640);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const H = compact || W < 480 ? 200 : 260;
  const M = { t: 16, r: 12, b: 26, l: 48 };
  const all = [...f.series, ...baselineSeries];
  const lo = Math.min(0, ...all) * 1.15;
  const hi = Math.max(...all) * 1.08;
  const x = linear([18, HORIZON], [M.l, W - M.r]);
  const y = linear([lo, hi], [H - M.b, M.t]);
  const d = (s: number[]) => linePath(s.map((v, i) => [x(18 + i), y(v)]));
  const be = f.breakEven;
  return (
    <figure className="grid gap-2 rounded-md border border-rule bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-caption text-ink-2">
        <figcaption className="font-semibold text-ink">Total money earned minus costs, by age</figcaption>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: PATH_VAR[f.index] }} /> This path
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-trace-c" /> Work from 18
          </span>
        </span>
      </div>
      <div ref={ref} className="min-w-0">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`Total money earned minus costs from age 18 to 40 for ${f.label}. ${be ? `Passes working from 18 at age ${be.toFixed(1)}.` : "Does not pass working from 18 by 40."} ${moneyCompact(f.series[f.series.length - 1])} by 40.`}>
          <line x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} stroke="var(--rule-strong)" />
          <text x={M.l - 8} y={y(0)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px]">
            $0
          </text>
          <text x={M.l - 8} y={y(hi / 1.08)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">
            {moneyCompact(hi / 1.08)}
          </text>
          <path d={d(baselineSeries)} fill="none" stroke="var(--trace-c)" strokeWidth={1.5} strokeDasharray="6 4" />
          <motion.path
            key={f.label + f.sel.aid + f.sel.residency}
            d={d(f.series)}
            fill="none"
            stroke={PATH_VAR[f.index]}
            strokeWidth={3}
            strokeLinejoin="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: inView || reduce ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 1.1, ease: EASE.smooth }}
          />
          {be && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: inView || reduce ? 1 : 0 }} transition={{ delay: reduce ? 0 : 0.9 }}>
              <circle cx={x(be)} cy={y(valueAt(baselineSeries, 18, be))} r={6} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
              <text x={x(be)} y={y(valueAt(baselineSeries, 18, be)) - 14} textAnchor={x(be) > W - 90 ? "end" : "middle"} stroke="var(--surface)" strokeWidth={4} paintOrder="stroke" className="fill-ink text-[11px] font-bold">
                Break-even · {be.toFixed(1)}
              </text>
            </motion.g>
          )}
          {[18, 22, 26, 30, 35, 40].map((t) => (
            <text key={t} x={x(t)} y={H - 6} textAnchor="middle" className="tabular fill-muted text-[11px]">
              {t}
            </text>
          ))}
        </svg>
      </div>
    </figure>
  );
}

// ------------------------------------------------------------------ guided view

const STEPS: Array<{ key: Fact["key"]; title: string }> = [
  { key: "cost", title: "Cost" },
  { key: "debt", title: "Debt" },
  { key: "jobs", title: "Job outlook" },
  { key: "pay", title: "Salary" },
  { key: "breakeven", title: "Long-term value" },
];

function Guided({ f, onDone }: { f: Future; onDone: () => void }) {
  const [i, setI] = useState(0);
  const facts = primaryFacts(f);
  const step = STEPS[i];
  const fact = facts.find((x) => x.key === step.key)!;
  const r = f.result;
  const p = f.ctx.outcome.earlyCareer.value;
  const be = breakEvenYears(f);
  const headRef = useRef<HTMLHeadingElement>(null);
  const explain: Record<Fact["key"], string> = {
    cost: `The sticker price for ${r.net.years} years is ${moneyCompact(r.net.gross)}. Grants take off ${moneyCompact(r.net.aid)}, so you'd pay about ${fact.value}.`,
    debt: r.loan.principal > 0 ? `After family help and work, about ${fact.value} would be borrowed. With interest while in school, you'd owe ${moneyCompact(r.loan.repaymentBalance)} at graduation: roughly ${moneyCompact(r.loan.monthlyPayment)} a month for 10 years.` : "Family help and work cover the net cost, so no borrowing is needed.",
    jobs: `About ${Math.round(r.employmentRate * 100)} of every 100 graduates are working a year after graduating.`,
    pay: p ? `Typical early-career pay is ${moneyCompact(p.p50)}. Lower earners make around ${moneyCompact(p.p10)}; higher earners around ${moneyCompact(p.p90)}.` : `Typical early-career pay is about ${fact.value}.`,
    breakeven: be == null ? "With these numbers, earnings don't make up the extra cost by age 40." : `Higher earnings pay back the extra cost of college about ${be.toFixed(1)} years after graduation. After that, this path is ahead of working from 18.`,
  };
  const go = (n: number) => {
    setI(n);
    requestAnimationFrame(() => headRef.current?.focus());
  };
  return (
    <div className="grid gap-6 rounded-lg border border-rule bg-surface p-5 shadow-2 sm:p-8">
      <ol className="flex flex-wrap gap-2" aria-label="Steps">
        {STEPS.map((s, k) => (
          <li key={s.key}>
            <button type="button" onClick={() => go(k)} aria-current={k === i ? "step" : undefined} className={cn("flex h-9 items-center gap-2 rounded-full border px-3 text-caption font-semibold transition-colors", k === i ? "border-ink bg-ink text-on-ink" : k < i ? "border-rule-strong text-ink" : "border-rule text-muted hover:text-ink")}>
              <span className="tabular">{k + 1}</span> {s.title}
            </button>
          </li>
        ))}
      </ol>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step.key} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24, transition: { duration: DUR.fast } }} transition={{ duration: DUR.standard, ease: EASE.smooth }} className="grid gap-4 md:grid-cols-12 md:items-center">
          <div className="grid gap-2 md:col-span-5">
            <h3 ref={headRef} tabIndex={-1} className="flex items-center gap-2 text-small font-bold text-ink-2 outline-none">
              Step {i + 1} of {STEPS.length} · {fact.label} <DataKindChip kind={fact.kind} />
            </h3>
            <p className="tabular text-[clamp(3rem,7vw,5rem)] font-extrabold leading-none tracking-[-0.045em] text-ink">{fact.value}</p>
            <p className="text-caption text-muted">{fact.sub}</p>
          </div>
          <div className="grid gap-3 md:col-span-7">
            <p className="text-lede text-ink">{explain[step.key]}</p>
            <p className="text-small text-ink-2">
              <span className="font-semibold text-ink">Why this matters: </span>
              {fact.why}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center justify-between gap-3 border-t border-rule pt-5">
        <Button variant="quiet" onClick={() => go(Math.max(0, i - 1))} disabled={i === 0} className="gap-1.5">
          <ArrowLeft className="size-4" aria-hidden /> Back
        </Button>
        {i < STEPS.length - 1 ? (
          <Button onClick={() => go(i + 1)} className="gap-1.5">
            Next: {STEPS[i + 1].title} <ArrowRight className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button onClick={onDone}>See full analysis</Button>
        )}
      </div>
    </div>
  );
}
