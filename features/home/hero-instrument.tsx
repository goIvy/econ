"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboOption } from "@/components/ui/combobox";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { PathTag, SampleChip, SourceFootnote, type TraceKey } from "@/components/ui/lineage";
import { Segmented } from "@/components/ui/segmented";
import { TraceChart, type TraceSeries } from "@/components/charts/trace-chart";
import { useCountUp } from "@/hooks/use-count-up";
import { crossing, usePath } from "@/hooks/use-path";
import { collapse, crossfade, enter, motionSafe, pop } from "@/lib/animations";
import { money, moneyCompact } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { PathResponse } from "@/lib/api/path-response";
import type { CollegeOption, MajorOption } from "@/services/data";

/** Assumptions the demo holds fixed; stated on screen. */
const DEMO_FUNDING = { familyPerYear: 10000, workPerYear: 3000 };
/** Shorter horizon than the full model so the break-even region is legible. */
const HERO_HORIZON = 38;

interface PathControls {
  collegeId: string;
  majorId: string;
  residency: "resident" | "nonresident";
  aid: number;
}

export function HeroInstrument({ colleges, majors }: { colleges: CollegeOption[]; majors: MajorOption[] }) {
  const reduce = useReducedMotion();
  const [a, setA] = useState<PathControls>({ collegeId: "uc-berkeley", majorId: "economics", residency: "resident", aid: 15000 });
  const [b, setB] = useState<PathControls>({ collegeId: "nyu", majorId: "finance", residency: "resident", aid: 30000 });
  const [comparing, setComparing] = useState(false);
  const runA = usePath();
  const runB = usePath();
  const [ranA, setRanA] = useState<PathControls | null>(null);
  const [ranB, setRanB] = useState<PathControls | null>(null);

  const collegeOpts: ComboOption[] = useMemo(
    () => colleges.map((c) => ({ value: c.id, label: c.shortName, meta: `${c.city}, ${c.state} · ${c.control === "public" ? "Public" : "Private"}`, keywords: [c.name] })),
    [colleges],
  );
  const majorOpts: ComboOption[] = useMemo(() => majors.map((m) => ({ value: m.id, label: m.name, group: m.category })), [majors]);
  const controlOf = (id: string) => colleges.find((c) => c.id === id)?.control ?? "public";
  const stateOf = (id: string) => colleges.find((c) => c.id === id)?.state ?? "";

  const request = (p: PathControls) => ({
    collegeId: p.collegeId,
    majorId: p.majorId,
    residency: p.residency,
    funding: { aidPerYear: p.aid, ...DEMO_FUNDING },
    horizonAge: HERO_HORIZON,
  });

  const calculate = async () => {
    setRanA(a);
    const jobs: Promise<unknown>[] = [runA.run(request(a))];
    if (comparing) {
      setRanB(b);
      jobs.push(runB.run(request(b)));
    }
    await Promise.all(jobs);
  };

  // Page-load moment: run the default path once the hero has entered.
  useEffect(() => {
    const t = setTimeout(() => {
      setRanA(a);
      runA.run(request(a));
    }, reduce ? 0 : 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCompare = () => {
    setComparing(true);
    setRanB(b);
    runB.run(request(b));
  };
  const stopCompare = () => {
    setComparing(false);
    runB.reset();
    setRanB(null);
  };

  const dataA = runA.data;
  const dataB = comparing ? runB.data : null;
  const staleA = ranA && JSON.stringify(ranA) !== JSON.stringify(a);
  const staleB = comparing && ranB && JSON.stringify(ranB) !== JSON.stringify(b);
  const stale = Boolean(staleA || staleB);
  const loading = runA.status === "loading" || runB.status === "loading";

  const series: TraceSeries[] = [];
  if (dataA) series.push({ id: "a", trace: "a", label: `${dataA.college.shortName} ${dataA.major.name}`, points: dataA.series.map((p) => ({ x: p.age, y: p.cumulative })) });
  if (dataB) series.push({ id: "b", trace: "b", label: `${dataB.college.shortName} ${dataB.major.name}`, points: dataB.series.map((p) => ({ x: p.age, y: p.cumulative })) });
  if (dataA) series.push({ id: "base", trace: "baseline", label: "Working from 18, no degree", points: dataA.baseline.map((p) => ({ x: p.age, y: p.cumulative })) });

  let marker = null as null | { x: number; y: number; label: string };
  let summary = "";
  if (dataA && dataB) {
    const [hi, lo] = dataA.net.netPrice >= dataB.net.netPrice ? [dataA, dataB] : [dataB, dataA];
    const cross = crossing(hi.series, lo.series);
    const hiName = `${hi.college.shortName} ${hi.major.name}`;
    const loName = `${lo.college.shortName} ${lo.major.name}`;
    if (cross) {
      marker = { x: cross.age, y: cross.value, label: `Paths cross ≈ age ${cross.age.toFixed(1)}` };
      summary = `Based on these assumptions, ${hiName} costs more up front and overtakes ${loName} around age ${cross.age.toFixed(1)}, about ${(cross.age - hi.graduationAge).toFixed(1)} years after graduation.`;
    } else {
      const endHi = hi.series[hi.series.length - 1].cumulative;
      const endLo = lo.series[lo.series.length - 1].cumulative;
      summary =
        endHi < endLo
          ? `With these assumptions, ${hiName}'s higher cost isn't recovered relative to ${loName} by age ${HERO_HORIZON}. The gap at ${HERO_HORIZON} is about ${moneyCompact(endLo - endHi)}.`
          : `${hiName} stays ahead of ${loName} across the whole period, despite its higher net price.`;
    }
  } else if (dataA) {
    const be = dataA.breakEven;
    if (be) marker = { x: be.age, y: interp(dataA.series, be.age), label: `Break-even ≈ age ${be.age.toFixed(1)}` };
    summary = be
      ? `Cumulative value of ${dataA.college.shortName} ${dataA.major.name} after tuition, living costs and loan payments, compared with working from 18 without a degree. Based on these assumptions, the path overtakes that alternative around age ${be.age.toFixed(1)}.`
      : `With these assumptions, this path doesn't overtake working from 18 without a degree by age ${HERO_HORIZON}.`;
  }

  return (
    <div className="relative rounded-lg border border-rule bg-surface shadow-3">
      {/* controls */}
      <div className="grid gap-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-[1.05rem] font-semibold text-ink">Run a path</p>
          <SampleChip />
        </div>

        <PathControlsRow trace="a" value={a} onChange={setA} collegeOpts={collegeOpts} majorOpts={majorOpts} control={controlOf(a.collegeId)} state={stateOf(a.collegeId)} />

        <AnimatePresence initial={false}>
          {comparing && (
            <motion.div
              key="b"
              variants={collapse}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="overflow-hidden"
            >
              <div className="border-t border-dashed border-rule pt-5">
                <PathControlsRow
                  trace="b"
                  value={b}
                  onChange={setB}
                  collegeOpts={collegeOpts}
                  majorOpts={majorOpts}
                  control={controlOf(b.collegeId)}
                  state={stateOf(b.collegeId)}
                  onRemove={stopCompare}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Button onClick={calculate} size="lg" disabled={loading} aria-describedby="demo-assumptions">
            {loading ? "Calculating…" : "Calculate My Path"}
          </Button>
          <AnimatePresence>
            {!comparing && dataA && (
              <motion.span key="cmp" variants={pop} initial="hidden" animate="visible" exit="exit">
                <Button variant="secondary" size="lg" onClick={startCompare}>
                  <Plus className="size-4" aria-hidden /> Compare another path
                </Button>
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {stale && !loading && (
              <motion.span variants={crossfade} initial="hidden" animate="visible" exit="exit" className="text-caption font-medium text-caution" role="status">
                Inputs changed. Recalculate to update.
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <p id="demo-assumptions" className="text-caption text-muted">
          Assumes 4 years on campus, {money(DEMO_FUNDING.familyPerYear)}/yr family contribution and {money(DEMO_FUNDING.workPerYear)}/yr from work. The rest is borrowed at the federal rate. All figures are in 2024 dollars.
        </p>
      </div>

      {/* results */}
      <div className="border-t border-rule bg-paper/60 p-4 sm:p-6" aria-live="polite" aria-busy={loading}>
        <AnimatePresence mode="wait">
          {runA.status === "error" && !dataA ? (
            <ErrorState key="err" message={runA.error!} onRetry={calculate} />
          ) : !dataA ? (
            <ResultsSkeleton key="sk" />
          ) : (
            <motion.div key="res" variants={motionSafe(enter, reduce)} initial="hidden" animate="visible" className={cn("grid gap-6 transition-opacity", (loading || stale) && "opacity-60")}>
              <AnimatePresence initial={false}>
                {(runA.status === "error" || runB.status === "error") && (
                  <motion.p key="err" variants={collapse} initial="hidden" animate="visible" exit="exit" className="flex items-start gap-2 overflow-hidden rounded-sm bg-risk-tint px-3 py-2 text-small text-risk" role="alert">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {runA.error ?? runB.error}
                  </motion.p>
                )}
              </AnimatePresence>
              <Readouts a={dataA} b={dataB} />
              <TraceChart
                title="Cumulative net value by age"
                series={series}
                marker={marker}
                band={{ from: 18, to: dataA.graduationAge, label: "College" }}
                summary={summary}
                height={300}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function interp(series: PathResponse["series"], age: number): number {
  const i = Math.max(0, series.findIndex((p) => p.age > age) - 1);
  const p0 = series[i];
  const p1 = series[i + 1] ?? p0;
  const f = p1.age === p0.age ? 0 : (age - p0.age) / (p1.age - p0.age);
  return p0.cumulative + f * (p1.cumulative - p0.cumulative);
}

function PathControlsRow({
  trace,
  value,
  onChange,
  collegeOpts,
  majorOpts,
  control,
  state,
  onRemove,
}: {
  trace: TraceKey;
  value: PathControls;
  onChange: (v: PathControls) => void;
  collegeOpts: ComboOption[];
  majorOpts: ComboOption[];
  control: "public" | "private";
  state: string;
  onRemove?: () => void;
}) {
  const set = (patch: Partial<PathControls>) => onChange({ ...value, ...patch });
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-3 flex w-full items-center gap-2 text-small font-semibold text-ink">
        <PathTag trace={trace} />
        Path {trace.toUpperCase()}
        {onRemove && (
          <button type="button" onClick={onRemove} className="ml-auto inline-flex items-center gap-1 rounded-xs px-2 py-1 text-caption font-medium text-muted hover:bg-surface-sunk hover:text-ink">
            <X className="size-3.5" aria-hidden /> Remove
          </button>
        )}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Combobox label="College" value={value.collegeId} onChange={(v) => set({ collegeId: v })} options={collegeOpts} searchPlaceholder="Search by name, city or state" />
        <Combobox label="Major" value={value.majorId} onChange={(v) => set({ majorId: v })} options={majorOpts} searchPlaceholder="Search majors" />
        <Segmented
          label={control === "public" ? `Residency (${state})` : "Residency"}
          value={control === "private" ? "resident" : value.residency}
          onChange={(v) => set({ residency: v })}
          options={[
            { value: "resident", label: control === "public" ? "In-state" : "Same tuition for all", disabled: false },
            { value: "nonresident", label: "Out-of-state", disabled: control === "private" },
          ]}
        />
        <GraduatedSlider label="Grant aid per year" value={value.aid} onChange={(v) => set({ aid: v })} min={0} max={50000} step={500} format={(v) => moneyCompact(v)} trace={trace} />
      </div>
    </fieldset>
  );
}

function Readouts({ a, b }: { a: PathResponse; b: PathResponse | null }) {
  const paths: Array<[TraceKey, PathResponse]> = b ? [["a", a], ["b", b]] : [["a", a]];
  const rows: Array<{ label: string; get: (p: PathResponse) => number | null; fmt: (n: number) => string; unit?: string; lineage: (p: PathResponse) => PathResponse["lineage"][keyof PathResponse["lineage"]] }> = [
    { label: "Estimated net cost", get: (p) => p.net.netPrice, fmt: money, unit: "4 yrs", lineage: (p) => p.lineage.netCost },
    { label: "Estimated debt", get: (p) => p.net.borrowing, fmt: money, lineage: (p) => p.lineage.loanRate },
    { label: "Median early-career earnings", get: (p) => p.startingSalary, fmt: money, unit: "/yr", lineage: (p) => p.lineage.earnings },
    { label: "Estimated break-even age", get: (p) => p.breakEven?.age ?? null, fmt: (n) => n.toFixed(1), lineage: (p) => p.lineage.model },
    { label: "10-year projected earnings", get: (p) => p.tenYearEarnings, fmt: money, lineage: (p) => p.lineage.model },
  ];

  if (!b) {
    return (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        {rows.map((r, i) => (
          <HeroReadout key={r.label} label={r.label} value={r.get(a)} fmt={r.fmt} unit={r.unit} lineage={r.lineage(a)} n={i + 1} />
        ))}
      </dl>
    );
  }
  return (
    <table className="w-full text-left">
      <caption className="sr-only">Path A and Path B side by side</caption>
      <thead>
        <tr className="text-caption text-muted">
          <th scope="col" className="pb-2 font-medium">Metric</th>
          {paths.map(([t, p]) => (
            <th key={t} scope="col" className="pb-2 pl-3 text-right font-medium">
              <span className="inline-flex items-center gap-1.5">
                <PathTag trace={t} size="sm" />
                <span className="hidden truncate sm:inline">{p.college.shortName}</span>
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.label} className="border-t border-rule">
            <th scope="row" className="py-2.5 pr-2 text-small font-medium text-ink-2">
              {r.label}
              <SourceFootnote metric={r.label} lineage={r.lineage(a)} n={i + 1} className="ml-1" />
            </th>
            {paths.map(([t, p]) => (
              <td key={t} className="py-2.5 pl-3 text-right">
                <CountCell value={r.get(p)} fmt={r.fmt} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CountCell({ value, fmt }: { value: number | null; fmt: (n: number) => string }) {
  const v = useCountUp(value ?? 0, { enabled: value != null });
  return value == null ? <span className="text-small text-muted">After {HERO_HORIZON}</span> : <span className="tabular text-[1.0625rem] font-semibold text-ink">{fmt(v)}</span>;
}

function HeroReadout({ label, value, fmt, unit, lineage, n }: { label: string; value: number | null; fmt: (n: number) => string; unit?: string; lineage: PathResponse["lineage"]["model"]; n: number }) {
  const v = useCountUp(value ?? 0, { enabled: value != null });
  return (
    <div className="grid content-start gap-1">
      <dt className="text-caption font-medium text-muted">{label}</dt>
      <dd className="flex items-baseline gap-1">
        {value == null ? (
          <span className="text-small font-medium text-muted">Not by age {HERO_HORIZON}</span>
        ) : (
          <span className="tabular text-[1.35rem] font-semibold leading-tight text-ink">{fmt(v)}</span>
        )}
        {value != null && unit && <span className="text-[0.75rem] font-medium text-muted">{unit}</span>}
        <SourceFootnote metric={label} lineage={lineage} n={n} />
      </dd>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <motion.div variants={crossfade} initial="hidden" animate="visible" exit="exit" className="grid gap-6" aria-label="Calculating">
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid gap-2">
            <span className="h-3 w-24 animate-pulse rounded bg-surface-sunk" />
            <span className="h-6 w-20 animate-pulse rounded bg-surface-sunk" />
          </div>
        ))}
      </div>
      <div className="h-[300px] animate-pulse rounded-md bg-surface-sunk" />
    </motion.div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div variants={crossfade} initial="hidden" animate="visible" exit="exit" className="grid justify-items-start gap-3 rounded-md border border-rule bg-surface p-5" role="alert">
      <p className="flex items-center gap-2 font-semibold text-ink">
        <AlertCircle className="size-4 text-risk" aria-hidden /> We couldn&apos;t calculate this path
      </p>
      <p className="text-small text-ink-2">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </motion.div>
  );
}
