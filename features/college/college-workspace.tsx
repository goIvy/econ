"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Tabs } from "radix-ui";
import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TraceChart } from "@/components/charts/trace-chart";
import { PercentileStrip } from "@/components/charts/percentile-strip";
import { Combobox } from "@/components/ui/combobox";
import { ConfidenceBadge, SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { Readout } from "@/components/ui/readout";
import { MethodologyDialog } from "@/components/ui/methodology-dialog";
import { ButtonLink } from "@/components/ui/button";
import { CostControls, CostLedger } from "@/features/cost/cost-model";
import { DebtModel } from "@/features/debt/debt-model";
import { MajorPanel, type MajorBundle } from "@/features/major/major-panel";
import { OutcomesPanel } from "@/features/outcomes/outcomes-panel";
import { SOURCES } from "@/data/sources";
import { calculateBreakEvenYear, projectNoCollege, projectPath } from "@/lib/calc";
import { crossfade, enter, microSpring, motionSafe } from "@/lib/animations";
import { money, moneyCompact, number, pct } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { City, College, FundingInputs, Lineage, LivingArrangement, Residency } from "@/types";

const TABS = [
  ["overview", "Overview"],
  ["costs", "Costs"],
  ["majors", "Majors"],
  ["earnings", "Earnings"],
  ["debt", "Debt"],
  ["outcomes", "Outcomes"],
  ["research", "Research"],
] as const;
type Tab = (typeof TABS)[number][0];

export function CollegeWorkspace({
  college,
  city,
  majors,
  defaultMajorId,
  initialResidency,
}: {
  college: College;
  city: City | null;
  majors: Record<string, MajorBundle>;
  defaultMajorId: string;
  initialResidency: Residency;
}) {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("overview");
  const [majorId, setMajorId] = useState(defaultMajorId);
  const [residency, setResidency] = useState<Residency>(initialResidency);
  const [living, setLiving] = useState<LivingArrangement>("campus");
  const [funding, setFunding] = useState<FundingInputs>({
    aidPerYear: Math.round((college.aid.avgGrant.value ?? 0) / 500) * 500,
    scholarshipsPerYear: 0,
    familyPerYear: 10000,
    workPerYear: 3000,
    savings: 0,
  });

  const bundle = majors[majorId];
  const result = useMemo(() => {
    if (!bundle?.outcome) return null;
    const r = projectPath(
      { collegeId: college.id, majorId, residency, living, funding, yearsToGraduate: 4 },
      { college, major: bundle.major, outcome: bundle.outcome, collegeCity: city, careerCity: city },
      { horizonAge: 40 },
    );
    const baseline = projectNoCollege({ horizonAge: 40, stateRate: city?.stateTaxRate });
    const be = calculateBreakEvenYear(r.rows, baseline, r.graduationAge);
    return { r, baseline, be };
  }, [bundle, college, majorId, residency, living, funding, city]);

  const majorOptions = useMemo(
    () => Object.values(majors).map((b) => ({ value: b.major.id, label: b.major.name, group: b.major.category, meta: b.outcome?.isFallback ? "National estimate (no program data)" : undefined })).sort((a, b) => a.label.localeCompare(b.label)),
    [majors],
  );

  const effectiveResidency = college.control === "private" ? "resident" : residency;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-8">
      {/* path bar: the choices every tab shares */}
      <div className="sticky top-[calc(var(--nav-h)+8px)] z-20 rounded-md border border-rule bg-paper px-4 py-3 shadow-2">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <Combobox label="Major" value={majorId} onChange={setMajorId} options={majorOptions} className="w-full sm:w-72" searchPlaceholder="Search this college's majors" />
          {college.control === "public" && (
            <ResidencyPills value={residency} onChange={setResidency} state={college.state} />
          )}
          <div className="ml-auto flex items-center gap-4">
            <MethodologyDialog ids={["total-cost", "net-cost", "loans", "earnings", "graduation", "employment", "break-even"]} />
          </div>
        </div>
      </div>

      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <Tabs.List aria-label="College details" className="-mx-4 flex gap-1 overflow-x-auto border-b border-rule px-4 md:mx-0 md:px-0">
          {TABS.map(([v, label]) => (
            <Tabs.Trigger key={v} value={v} className={cn("relative shrink-0 px-3 pb-3 pt-1 text-small font-semibold transition-colors", tab === v ? "text-ink" : "text-muted hover:text-ink")}>
              {label}
              {tab === v && <motion.span layoutId="college-tab" transition={microSpring} className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-ink" />}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <AnimatePresence mode="wait">
          <motion.div key={tab} variants={motionSafe(crossfade, reduce)} initial="hidden" animate="visible" exit="exit" className="min-w-0 pt-8">
            <Tabs.Content value={tab} forceMount className="outline-none">
              {tab === "overview" && <Overview college={college} result={result} bundle={bundle} residency={effectiveResidency} />}
              {tab === "costs" && (
                <div className="grid gap-10 lg:grid-cols-12">
                  <div className="lg:col-span-5">
                    <CostControls
                      control={college.control}
                      state={college.state}
                      residency={residency}
                      onResidency={setResidency}
                      living={living}
                      onLiving={setLiving}
                      funding={funding}
                      onFunding={setFunding}
                      tuitionIn={(college.costs.tuitionInState.value ?? 0) + (college.costs.fees.value ?? 0)}
                      tuitionOut={(college.costs.tuitionOutOfState.value ?? 0) + (college.costs.fees.value ?? 0)}
                    />
                  </div>
                  <div className="rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6 lg:col-span-7">
                    {result ? (
                      <CostLedger lines={result.r.costLines} net={result.r.net} lineage={college.costs.tuitionInState.lineage} title={`${college.shortName}, one year`} />
                    ) : (
                      <NoMajor />
                    )}
                  </div>
                </div>
              )}
              {tab === "majors" && bundle && <MajorPanel bundle={bundle} collegeName={college.shortName} />}
              {tab === "earnings" && <Earnings college={college} bundle={bundle} />}
              {tab === "debt" && <DebtModel key={Math.round(result?.r.net.borrowing ?? 0)} defaultPrincipal={result?.r.net.borrowing ?? (college.medianDebt.value ?? 0)} />}
              {tab === "outcomes" && bundle && <OutcomesPanel college={college} major={bundle.major} />}
              {tab === "research" && <Research college={college} />}
            </Tabs.Content>
          </motion.div>
        </AnimatePresence>
      </Tabs.Root>
      <p className="sr-only" aria-live="polite">
        {result ? `Net cost ${money(result.r.net.netPrice)}, estimated debt ${money(result.r.net.borrowing)}.` : ""}
      </p>
    </div>
  );
}

function ResidencyPills({ value, onChange, state }: { value: Residency; onChange: (r: Residency) => void; state: string }) {
  return (
    <div role="radiogroup" aria-label={`Residency (${state})`} className="flex items-center gap-1 rounded-sm border border-rule bg-surface-sunk p-1">
      {(["resident", "nonresident"] as const).map((r) => (
        <button key={r} role="radio" aria-checked={value === r} onClick={() => onChange(r)} className={cn("relative h-9 rounded-[7px] px-3 text-small font-semibold transition-colors", value === r ? "text-on-ink" : "text-ink-2 hover:text-ink")}>
          {value === r && <motion.span layoutId="res-pill" transition={microSpring} className="absolute inset-0 -z-0 rounded-[7px] bg-ink" />}
          <span className="relative">{r === "resident" ? `${state} resident` : "Non-resident"}</span>
        </button>
      ))}
    </div>
  );
}

function NoMajor() {
  return <p className="text-small text-muted">Choose a major to see costs for this path.</p>;
}

type Result = { r: ReturnType<typeof projectPath>; baseline: ReturnType<typeof projectNoCollege>; be: ReturnType<typeof calculateBreakEvenYear> } | null;

function Overview({ college, result, bundle, residency }: { college: College; result: Result; bundle?: MajorBundle; residency: Residency }) {
  const reduce = useReducedMotion();
  const model: Lineage = { ...college.costs.netPrice.lineage, sourceId: "cvl-model", population: "Calculated from your choices", note: "Estimate in 2024 dollars." };
  const trend = college.trends;
  return (
    <div className="grid gap-10">
      {result && bundle && (
        <motion.section variants={motionSafe(enter, reduce)} initial="hidden" animate="visible" aria-labelledby="yp-h" className="rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 id="yp-h" className="text-h3 font-semibold">
              Your path: {bundle.major.name}, {residency === "resident" ? (college.control === "public" ? `${college.state} resident` : "on campus") : "non-resident"}
            </h2>
            <SampleChip />
          </div>
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Readout label="Net cost, 4 years" value={result.r.net.netPrice} format={money} lineage={college.costs.tuitionInState.lineage} footnote={1} />
            <Readout label="Estimated debt" value={result.r.net.borrowing} format={money} lineage={model} footnote={2} />
            <Readout label="Median starting salary" value={result.r.startingSalary} format={money} lineage={bundle.outcome!.earlyCareer.lineage} footnote={3} unit="/yr" />
            <Readout label="Break-even age" value={result.be?.age ?? null} format={(n) => n.toFixed(1)} lineage={model} footnote={4} estimate emptyText="Not by 40" explain="Approximately when this path's cumulative value passes working from 18 without a degree." />
          </dl>
          <div className="mt-6">
            <TraceChart
              title="Cumulative net value by age"
              series={[
                { id: "p", trace: "a", label: `${college.shortName} ${bundle.major.name}`, points: result.r.rows.map((x) => ({ x: x.age, y: x.cumulative })) },
                { id: "b", trace: "baseline", label: "Working from 18, no degree", points: result.baseline.map((x) => ({ x: x.age, y: x.cumulative })) },
              ]}
              marker={result.be ? { x: result.be.age, y: interp(result.r.rows, result.be.age), label: `Break-even ≈ age ${result.be.age.toFixed(1)}` } : null}
              band={{ from: 18, to: result.r.graduationAge, label: "College" }}
              summary={result.be ? `Based on your choices, this path passes the no-degree path around age ${result.be.age.toFixed(1)}.` : "With these choices, this path doesn't pass the no-degree path by age 40."}
              height={280}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href={`/compare?p=${college.id}.${bundle.major.id}.${residency === "resident" ? "r" : "n"}`} variant="secondary" size="sm">
              Compare this path with others
            </ButtonLink>
          </div>
        </motion.section>
      )}
      <section aria-labelledby="trend-h" className="grid gap-4">
        <h2 id="trend-h" className="text-h3 font-semibold">
          Price over time
          <SourceFootnote metric="Tuition and net price trend" lineage={college.costs.tuitionInState.lineage} n={5} className="ml-1" />
        </h2>
        <div className="h-64 w-full rounded-md border border-rule bg-surface p-3" role="img" aria-label={`Tuition from ${trend[0].year} to ${trend[trend.length - 1].year}: in-state from ${money(trend[0].tuitionInState)} to ${money(trend[trend.length - 1].tuitionInState)}; average net price from ${money(trend[0].netPrice)} to ${money(trend[trend.length - 1].netPrice)}.`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--rule)" />
              <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: "var(--rule-strong)" }} tick={{ fill: "var(--muted)", fontSize: 11 }} />
              <YAxis tickFormatter={(v) => moneyCompact(v)} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} width={56} domain={[0, "auto"]} />
              <Tooltip
                cursor={{ stroke: "var(--ink)", strokeOpacity: 0.3 }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-sm border border-rule bg-surface px-3 py-2 shadow-2">
                      <p className="mb-1 text-caption font-semibold text-muted">{label}</p>
                      {payload.map((p) => (
                        <p key={String(p.dataKey)} className="flex items-center gap-2 text-small">
                          <span className="inline-block h-[2px] w-4" style={{ background: p.color }} />
                          <span className="tabular font-semibold text-ink">{money(p.value as number)}</span>
                          <span className="text-caption text-muted">{p.name}</span>
                        </p>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Legend verticalAlign="top" height={28} iconType="plainline" wrapperStyle={{ fontSize: 12, color: "var(--ink-2)" }} />
              {college.control === "public" && <Line name="Out-of-state tuition" type="monotone" dataKey="tuitionOutOfState" stroke="var(--ink-2)" strokeWidth={2} strokeDasharray="6 4" dot={false} />}
              <Line name={college.control === "public" ? "In-state tuition" : "Tuition"} type="monotone" dataKey="tuitionInState" stroke="var(--ink)" strokeWidth={2} dot={false} />
              <Line name="Average net price" type="monotone" dataKey="netPrice" stroke="var(--muted)" strokeWidth={2} strokeDasharray="2 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-small text-ink-2">Published tuition rose each year; the average net price, what students pay after grants, rose more slowly. Values in current dollars for each year.</p>
      </section>
    </div>
  );
}

function interp(rows: Array<{ age: number; cumulative: number }>, age: number) {
  const i = Math.max(0, rows.findIndex((p) => p.age > age) - 1);
  const a = rows[i], b = rows[i + 1] ?? a;
  return a.cumulative + (b.age === a.age ? 0 : ((age - a.age) / (b.age - a.age)) * (b.cumulative - a.cumulative));
}

function Earnings({ college, bundle }: { college: College; bundle?: MajorBundle }) {
  if (!bundle) return null;
  const p = bundle.outcome?.earlyCareer.value ?? bundle.major.earlyCareer.value!;
  return (
    <div className="grid gap-10">
      <section className="grid gap-4 rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-h3 font-semibold">{bundle.major.name} graduates: the full range</h2>
          <SampleChip />
        </div>
        <PercentileStrip p={p} compare={bundle.major.earlyCareer.value} compareLabel={`All ${bundle.major.name} graduates nationally`} label="Salary distribution" />
        <p className="measure text-small text-ink-2">
          Half of {college.shortName} {bundle.major.name.toLowerCase()} graduates in this estimate earn between {money(p.p25)} and {money(p.p75)} early in their careers. One in ten earns more than {money(p.p90)}, and one in ten less than {money(p.p10)}.
        </p>
      </section>
      <section className="grid gap-4">
        <h2 className="text-h3 font-semibold">Institution-wide earnings</h2>
        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Readout label="Median earnings, 10 years after entry" value={college.medianEarnings.value} format={money} lineage={college.medianEarnings.lineage} footnote={1} unit="/yr" />
          <Readout label="Same major, national median" value={bundle.major.earlyCareer.value!.p50} format={money} lineage={bundle.major.earlyCareer.lineage} footnote={2} unit="/yr" />
          <Readout label="Mid-career, national" value={bundle.major.midCareerMedian.value} format={money} lineage={bundle.major.midCareerMedian.lineage} footnote={3} unit="/yr" />
        </dl>
        <p className="measure rounded-md bg-surface-sunk p-4 text-small text-ink-2">
          Earnings differences between colleges reflect both the college and the students it enrolls. Students admitted to selective colleges may have earned more regardless, so these gaps are correlation, not proof of cause.
        </p>
      </section>
    </div>
  );
}

function Research({ college }: { college: College }) {
  const rows: Array<[string, string, Lineage]> = [
    ["Undergraduate enrollment", number(college.undergradEnrollment.value), college.undergradEnrollment.lineage],
    ["Acceptance rate", pct(college.acceptanceRate.value), college.acceptanceRate.lineage],
    [college.control === "public" ? "In-state tuition" : "Tuition", money(college.costs.tuitionInState.value), college.costs.tuitionInState.lineage],
    ...(college.control === "public" ? ([["Out-of-state tuition", money(college.costs.tuitionOutOfState.value), college.costs.tuitionOutOfState.lineage]] as Array<[string, string, Lineage]>) : []),
    ["Required fees", money(college.costs.fees.value), college.costs.fees.lineage],
    ["Room", money(college.costs.room.value), college.costs.room.lineage],
    ["Board", money(college.costs.board.value), college.costs.board.lineage],
    ["Average net price", money(college.costs.netPrice.value), college.costs.netPrice.lineage],
    ["Students receiving grants", pct(college.aid.pctReceivingGrants.value), college.aid.pctReceivingGrants.lineage],
    ["Average grant", money(college.aid.avgGrant.value), college.aid.avgGrant.lineage],
    ["4-year graduation rate", pct(college.gradRate4.value), college.gradRate4.lineage],
    ["6-year graduation rate", pct(college.gradRate6.value), college.gradRate6.lineage],
    ["Median debt", money(college.medianDebt.value), college.medianDebt.lineage],
    ["Median earnings (10 yrs)", money(college.medianEarnings.value), college.medianEarnings.lineage],
  ];
  return (
    <section className="grid gap-4" aria-labelledby="research-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="research-h" className="text-h3 font-semibold">Raw metrics and where they come from</h2>
        <SampleChip />
      </div>
      <div className="overflow-x-auto rounded-md border border-rule bg-surface">
        <table className="w-full min-w-[46rem] text-small">
          <caption className="sr-only">Every metric for {college.name} with its source, year, population and confidence</caption>
          <thead className="bg-surface-sunk text-left text-caption text-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Metric</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Value</th>
              <th scope="col" className="px-3 py-2 font-medium">Source</th>
              <th scope="col" className="px-3 py-2 font-medium">Year</th>
              <th scope="col" className="px-3 py-2 font-medium">Population</th>
              <th scope="col" className="px-3 py-2 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value, l]) => (
              <tr key={label} className="border-t border-rule align-top">
                <th scope="row" className="px-3 py-2.5 text-left font-medium text-ink">{label}</th>
                <td className="tabular px-3 py-2.5 text-right font-semibold text-ink">{value}</td>
                <td className="px-3 py-2.5 text-ink-2">{SOURCES[l.sourceId].name}</td>
                <td className="px-3 py-2.5 text-ink-2">{l.year}</td>
                <td className="max-w-[16rem] px-3 py-2.5 text-caption text-ink-2">
                  {l.population}
                  {l.sampleSize ? ` (n ≈ ${l.sampleSize.toLocaleString("en-US")})` : ""}
                </td>
                <td className="px-3 py-2.5">
                  <ConfidenceBadge level={l.confidence} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-caption text-muted">Confidence combines sample size, data age, source quality and coverage. See the methodology for the exact weights.</p>
    </section>
  );
}
