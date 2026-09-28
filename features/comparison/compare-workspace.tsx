"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TraceChart, type TraceSeries } from "@/components/charts/trace-chart";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboOption } from "@/components/ui/combobox";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { InfoTip } from "@/components/ui/info-tip";
import { PathTag, SampleChip, TRACE_KEYS, type TraceKey } from "@/components/ui/lineage";
import { MethodologyDialog } from "@/components/ui/methodology-dialog";
import { Segmented } from "@/components/ui/segmented";
import { crossing } from "@/hooks/use-path";
import { specKey, usePaths, type PathSpec } from "@/hooks/use-paths";
import { enter, microSpring } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { PathResponse } from "@/lib/api/path-response";

export interface CollegeMeta {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  control: "public" | "private";
  avgGrant: number;
  majorIds: string[];
}

const MAX = 5;

export interface CompareFunding {
  familyPerYear: number;
  workPerYear: number;
  savings: number;
  /** What the family plans to borrow in total (from onboarding); shown for reference. */
  plannedLoan: number;
}

type SortKey = "order" | "net" | "debt" | "grad" | "employment" | "salary" | "ten" | "breakEven";

const COLUMNS: Array<{ key: SortKey; label: string; tip: string; get: (d: PathResponse) => number | null; fmt: (n: number) => string }> = [
  { key: "net", label: "Net cost", tip: "What your household pays over 4 years after grants and scholarships.", get: (d) => d.net.netPrice, fmt: money },
  { key: "debt", label: "Debt", tip: "Estimated amount borrowed after family contribution and work income.", get: (d) => d.net.borrowing, fmt: money },
  { key: "grad", label: "Grad rate", tip: "Share of students finishing within 6 years. Historical, not a prediction for any individual.", get: (d) => d.gradRate6, fmt: (n) => pct(n) },
  { key: "employment", label: "Employment", tip: "Share of recent graduates in the labor force who have jobs.", get: (d) => d.employmentRate * 100, fmt: (n) => pct(n, 1) },
  { key: "salary", label: "Starting salary", tip: "Median early-career earnings for this program.", get: (d) => d.startingSalary, fmt: money },
  { key: "ten", label: "10-year earnings", tip: "Projected pre-tax earnings over the first 10 years after graduating, adjusted for employment rate. An estimate.", get: (d) => d.tenYearEarnings, fmt: moneyCompact },
  { key: "breakEven", label: "Break-even", tip: "Approximate age when this path's cumulative value passes working from 18 without a degree. An estimate.", get: (d) => d.breakEven?.age ?? null, fmt: (n) => `age ${n.toFixed(1)}` },
];

export function CompareWorkspace({
  colleges,
  majors,
  initial,
  funding: FUNDING,
}: {
  colleges: CollegeMeta[];
  majors: Array<{ id: string; name: string; category: string }>;
  initial: PathSpec[];
  funding: CompareFunding;
}) {
  const pathname = usePathname();
  const [paths, setPaths] = useState<PathSpec[]>(initial);
  const [editing, setEditing] = useState<number | "new" | null>(initial.length === 0 ? "new" : null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "order", dir: 1 });
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [copied, setCopied] = useState(false);

  const byId = useMemo(() => new Map(colleges.map((c) => [c.id, c])), [colleges]);
  const results = usePaths(paths, FUNDING);

  // Every comparison has a shareable URL.
  useEffect(() => {
    const p = paths.map((s) => `${s.collegeId}.${s.majorId}.${s.residency === "resident" ? "r" : "n"}.${s.living === "campus" ? "c" : s.living === "home" ? "h" : "o"}.${s.aid}`).join(",");
    const { familyPerYear, workPerYear, savings, plannedLoan } = FUNDING;
    const custom = familyPerYear !== 10000 || workPerYear !== 3000 || savings > 0 || plannedLoan > 0;
    const f = custom ? `&f=${familyPerYear}.${workPerYear}.${savings}.${plannedLoan}` : "";
    // replaceState updates the shareable URL without a server round-trip (Next keeps useSearchParams in sync).
    window.history.replaceState(null, "", p ? `${pathname}?p=${p}${f}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths, pathname, FUNDING.familyPerYear, FUNDING.workPerYear, FUNDING.savings, FUNDING.plannedLoan]);

  const rows = paths
    .map((spec, i) => ({ spec, i, trace: TRACE_KEYS[i] as TraceKey, res: results[i], meta: byId.get(spec.collegeId)! }))
    .filter((r) => filter === "all" || r.meta.control === filter);
  const sorted = sort.key === "order" ? rows : [...rows].sort((a, b) => {
    const col = COLUMNS.find((c) => c.key === sort.key)!;
    const x = a.res.data ? col.get(a.res.data) : null;
    const y = b.res.data ? col.get(b.res.data) : null;
    return ((x ?? Infinity) - (y ?? Infinity)) * sort.dir;
  });

  const ready = rows.filter((r) => r.res.data).map((r) => ({ ...r, d: r.res.data! }));
  const series: TraceSeries[] = ready.map((r) => ({ id: specKey(r.spec), trace: r.trace, label: `${r.d.college.shortName} ${r.d.major.name}`, points: r.d.series.map((p) => ({ x: p.age, y: p.cumulative })) }));
  if (ready[0]) series.push({ id: "base", trace: "baseline", label: "Working from 18, no degree", points: ready[0].d.baseline.map((p) => ({ x: p.age, y: p.cumulative })) });

  let summary = "Add at least one path to see cumulative value over time.";
  let marker: { x: number; y: number; label: string } | null = null;
  if (ready.length >= 2) {
    const byCost = [...ready].sort((a, b) => b.d.net.netPrice - a.d.net.netPrice);
    const hi = byCost[0], lo = byCost[byCost.length - 1];
    const cross = crossing(hi.d.series, lo.d.series);
    const hiN = `${hi.d.college.shortName} ${hi.d.major.name}`, loN = `${lo.d.college.shortName} ${lo.d.major.name}`;
    if (cross) {
      marker = { x: cross.age, y: cross.value, label: `${hi.trace.toUpperCase()} passes ${lo.trace.toUpperCase()} ≈ age ${cross.age.toFixed(1)}` };
      summary = `Based on current assumptions, ${hiN} (the highest net cost) overtakes the lowest-cost path, ${loN}, about ${(cross.age - hi.d.graduationAge).toFixed(1)} years after graduation. This is an estimate.`;
    } else {
      const gap = lo.d.series[lo.d.series.length - 1].cumulative - hi.d.series[hi.d.series.length - 1].cumulative;
      summary = gap > 0
        ? `Here is how the tradeoff changes: ${hiN} costs the most, and with these assumptions it doesn't catch up with ${loN} by age 40. The gap at 40 is about ${moneyCompact(gap)}.`
        : `${hiN} costs the most but stays ahead of ${loN} throughout, under these assumptions.`;
    }
  } else if (ready.length === 1) {
    const r = ready[0];
    summary = r.d.breakEven ? `${r.d.college.shortName} ${r.d.major.name} passes the no-degree path around age ${r.d.breakEven.age.toFixed(1)} under these assumptions. Add another path to compare.` : "Add another path to compare.";
  }

  const save = (i: number | "new", spec: PathSpec) => {
    setPaths((ps) => (i === "new" ? [...ps, spec].slice(0, MAX) : ps.map((p, j) => (j === i ? spec : p))));
    setEditing(null);
  };
  const remove = (i: number) => setPaths((ps) => ps.filter((_, j) => j !== i));

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; the URL bar already holds the link */
    }
  };

  const sortHeader = (key: SortKey, label: string, tip?: string) => {
    const active = sort.key === key;
    return (
      <th key={key} scope="col" aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className="px-3 py-3 text-right font-medium">
        <span className="inline-flex items-center justify-end gap-1">
          {tip && <InfoTip label={label}>{tip}</InfoTip>}
          <button type="button" onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : 1 }))} className={cn("inline-flex items-center gap-1 rounded-xs whitespace-nowrap hover:text-ink", active ? "text-ink" : "text-muted")}>
            {label}
            {active && (sort.dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}
          </button>
        </span>
      </th>
    );
  };

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Show"
            hideLabel
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "public", label: "Public" },
              { value: "private", label: "Private" },
            ]}
          />
          <SampleChip />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <MethodologyDialog ids={["net-cost", "loans", "earnings", "graduation", "employment", "break-even"]} />
          <Button variant="secondary" size="sm" onClick={share} disabled={!paths.length}>
            {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
            {copied ? "Link copied" : "Copy share link"}
          </Button>
        </div>
      </div>

      {/* desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-rule bg-surface shadow-2 md:block">
        <table className="w-full min-w-[60rem] text-small">
          <caption className="sr-only">Paths compared side by side. Select a column heading to sort. No path is marked better.</caption>
          <thead className="text-caption">
            <tr className="border-b border-rule">
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted">
                <button type="button" onClick={() => setSort({ key: "order", dir: 1 })} className="hover:text-ink">Path</button>
              </th>
              {COLUMNS.map((c) => sortHeader(c.key, c.label, c.tip))}
              <th scope="col" className="px-3 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {sorted.map((r) => (
                <motion.tr key={specKey(r.spec) + r.i} layout transition={microSpring} initial={{ opacity: 0 }} animate={{ opacity: r.res.status === "loading" ? 0.55 : 1 }} exit={{ opacity: 0 }} className="border-b border-rule last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <span className="flex items-start gap-2.5">
                      <PathTag trace={r.trace} />
                      <span className="grid">
                        <span className="font-semibold text-ink">{r.meta.shortName}</span>
                        <span className="text-caption text-ink-2">{majors.find((m) => m.id === r.spec.majorId)?.name}</span>
                        <span className="text-caption text-muted">
                          {r.meta.control === "public" ? (r.spec.residency === "resident" ? `${r.meta.state} resident` : "Non-resident") : "Private"} · {livingLabel(r.spec.living)} · {moneyCompact(r.spec.aid)}/yr aid
                        </span>
                      </span>
                    </span>
                  </th>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className="tabular px-3 py-3 text-right font-semibold text-ink">
                      {r.res.status === "error" ? <span className="text-caption font-normal text-risk">Unavailable</span> : r.res.data ? (c.get(r.res.data) == null ? <span className="text-caption font-normal text-muted">Not by 40</span> : c.fmt(c.get(r.res.data)!)) : <span className="inline-block h-4 w-14 animate-pulse rounded bg-surface-sunk" />}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <RowActions onEdit={() => setEditing(r.i)} onRemove={() => remove(r.i)} name={r.meta.shortName} />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {rows.length === 0 && paths.length > 0 && <p className="px-4 py-6 text-small text-muted">No paths match this filter.</p>}
      </div>

      {/* phones: cards */}
      <ul className="grid gap-3 md:hidden">
        {sorted.map((r) => (
          <li key={specKey(r.spec) + r.i} className="rounded-md border border-rule bg-surface p-4 shadow-1">
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-start gap-2.5">
                <PathTag trace={r.trace} />
                <span className="grid">
                  <span className="font-semibold text-ink">{r.meta.shortName}</span>
                  <span className="text-caption text-ink-2">{majors.find((m) => m.id === r.spec.majorId)?.name}</span>
                </span>
              </span>
              <RowActions onEdit={() => setEditing(r.i)} onRemove={() => remove(r.i)} name={r.meta.shortName} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {COLUMNS.map((c) => (
                <div key={c.key} className="flex items-baseline justify-between gap-2 border-t border-rule pt-2">
                  <dt className="text-caption text-muted">{c.label}</dt>
                  <dd className="tabular text-small font-semibold text-ink">{r.res.data ? (c.get(r.res.data) == null ? "—" : c.fmt(c.get(r.res.data)!)) : "…"}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* editor */}
      <AnimatePresence mode="wait">
        {editing != null ? (
          <motion.div key={`editor-${editing}`} variants={enter} initial="hidden" animate="visible" exit="exit">
            <PathEditor
              trace={TRACE_KEYS[editing === "new" ? paths.length : editing] as TraceKey}
              initial={editing === "new" ? undefined : paths[editing]}
              colleges={colleges}
              majors={majors}
              onCancel={paths.length ? () => setEditing(null) : undefined}
              onSave={(s) => save(editing, s)}
            />
          </motion.div>
        ) : paths.length < MAX ? (
          <motion.div key="add" variants={enter} initial="hidden" animate="visible" exit="exit">
            <Button variant="secondary" onClick={() => setEditing("new")}>
              <Plus className="size-4" aria-hidden /> Add a path ({paths.length} of {MAX})
            </Button>
          </motion.div>
        ) : (
          <p key="max" className="text-small text-muted">You&apos;re comparing the maximum of {MAX} paths. Remove one to add another.</p>
        )}
      </AnimatePresence>

      {paths.length > 0 && (
        <section aria-labelledby="cum-h" className="rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6">
          <h2 id="cum-h" className="mb-4 text-h3 font-semibold">Cumulative net value</h2>
          <TraceChart title="Cumulative net value by path" series={series} marker={marker} band={{ from: 18, to: 22, label: "College" }} summary={summary} height={340} />
          <p className="mt-3 text-caption text-muted">
            Assumes {money(FUNDING.familyPerYear)}/yr family contribution{FUNDING.savings > 0 ? `, ${money(FUNDING.savings)} in savings` : ""} and {money(FUNDING.workPerYear)}/yr from work for every path. Debt is repaid over 10 years at the federal rate.
            {FUNDING.plannedLoan > 0 && ` You planned to borrow up to ${money(FUNDING.plannedLoan)}; paths whose estimated debt is higher would need more aid or a different plan.`}
          </p>
        </section>
      )}
    </div>
  );
}

function livingLabel(l: PathSpec["living"]) {
  return l === "campus" ? "On campus" : l === "home" ? "At home" : "Off campus";
}

function RowActions({ onEdit, onRemove, name }: { onEdit: () => void; onRemove: () => void; name: string }) {
  return (
    <span className="flex items-center justify-end gap-1">
      <button type="button" onClick={onEdit} className="grid size-9 place-items-center rounded-sm text-ink-2 hover:bg-surface-sunk hover:text-ink" aria-label={`Edit ${name} path`}>
        <Pencil className="size-4" aria-hidden />
      </button>
      <button type="button" onClick={onRemove} className="grid size-9 place-items-center rounded-sm text-ink-2 hover:bg-risk-tint hover:text-risk" aria-label={`Remove ${name} path`}>
        <Trash2 className="size-4" aria-hidden />
      </button>
    </span>
  );
}

function PathEditor({
  trace,
  initial,
  colleges,
  majors,
  onSave,
  onCancel,
}: {
  trace: TraceKey;
  initial?: PathSpec;
  colleges: CollegeMeta[];
  majors: Array<{ id: string; name: string; category: string }>;
  onSave: (s: PathSpec) => void;
  onCancel?: () => void;
}) {
  const [collegeId, setCollegeId] = useState(initial?.collegeId ?? "");
  const [majorId, setMajorId] = useState(initial?.majorId ?? "");
  const [residency, setResidency] = useState<PathSpec["residency"]>(initial?.residency ?? "resident");
  const [living, setLiving] = useState<PathSpec["living"]>(initial?.living ?? "campus");
  const [aid, setAid] = useState(initial?.aid ?? 10000);
  const college = colleges.find((c) => c.id === collegeId);

  const collegeOpts: ComboOption[] = colleges.map((c) => ({ value: c.id, label: c.shortName, meta: `${c.city}, ${c.state} · ${c.control === "public" ? "Public" : "Private"}`, keywords: [c.name] }));
  const majorOpts: ComboOption[] = majors.map((m) => ({ value: m.id, label: m.name, group: m.category, disabled: college ? !college.majorIds.includes(m.id) : false, meta: college && !college.majorIds.includes(m.id) ? `Not offered at ${college.shortName}` : undefined }));
  const valid = Boolean(college && majorId && college.majorIds.includes(majorId));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave({ collegeId, majorId, residency: college?.control === "private" ? "resident" : residency, living, aid });
      }}
      className="grid gap-5 rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6"
      aria-label={initial ? "Edit path" : "Add a path"}
    >
      <p className="flex items-center gap-2 font-display text-[1.05rem] font-semibold">
        <PathTag trace={trace} /> {initial ? "Edit path" : "Add a path"}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Combobox
          label="College"
          value={collegeId || null}
          onChange={(v) => {
            setCollegeId(v);
            const c = colleges.find((x) => x.id === v);
            if (c) {
              setAid(Math.round(c.avgGrant / 500) * 500);
              if (majorId && !c.majorIds.includes(majorId)) setMajorId(c.majorIds.includes("economics") ? "economics" : c.majorIds[0]);
              if (!majorId) setMajorId(c.majorIds.includes("economics") ? "economics" : c.majorIds[0]);
            }
          }}
          options={collegeOpts}
          placeholder="Choose a college"
          searchPlaceholder="Search by name, city or state"
        />
        <Combobox label="Major" value={majorId || null} onChange={setMajorId} options={majorOpts} placeholder="Choose a major" searchPlaceholder="Search majors" />
        {college?.control === "public" ? (
          <Segmented
            label={`Residency (${college.state})`}
            value={residency}
            onChange={setResidency}
            options={[
              { value: "resident", label: "Resident" },
              { value: "nonresident", label: "Non-resident" },
            ]}
          />
        ) : (
          <div className="grid content-end">
            <p className="rounded-sm bg-surface-sunk px-3 py-2.5 text-small text-ink-2">{college ? "Private: same tuition for everyone." : "Residency applies to public colleges."}</p>
          </div>
        )}
        <Segmented
          label="Living arrangement"
          value={living}
          onChange={setLiving}
          options={[
            { value: "campus", label: "Campus" },
            { value: "off-campus", label: "Off campus" },
            { value: "home", label: "At home" },
          ]}
        />
        <GraduatedSlider label="Grants and scholarships per year" value={aid} onChange={setAid} min={0} max={70000} step={500} format={moneyCompact} trace={trace} description={college ? `This college's average grant is ${money(college.avgGrant)}.` : undefined} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!valid}>
          {initial ? "Update path" : "Add path"}
        </Button>
        {onCancel && (
          <Button type="button" variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
