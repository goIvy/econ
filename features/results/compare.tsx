"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronDown, Loader2, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DataKindChip, type DataKind } from "@/components/ui/data-kind";
import { SampleChip } from "@/components/ui/lineage";
import { DUR, EASE } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { PATH_VAR, pathNo, useScenario, type Future } from "@/features/scenario/store";
import { breakEvenYears, residencyShort, yrs } from "@/features/scenario/facts";
import type { PathSel } from "@/features/scenario/types";

interface Row {
  label: string;
  kind: DataKind;
  get: (f: Future) => string;
}

const MAIN: Row[] = [
  { label: "Net cost", kind: "estimated", get: (f) => moneyCompact(f.result.net.netPrice) },
  { label: "Debt", kind: "estimated", get: (f) => moneyCompact(f.result.loan.principal) },
  { label: "Starting pay", kind: "observed", get: (f) => moneyCompact(f.ctx.outcome.earlyCareer.value?.p50 ?? f.result.startingSalary) },
  { label: "Employment", kind: "observed", get: (f) => pct(f.result.employmentRate * 100) },
  { label: "Break-even", kind: "projected", get: (f) => yrs(breakEvenYears(f)) },
];

const perYear = (f: Future, keys: string[]) => f.result.costLines.filter((l) => keys.includes(l.key)).reduce((s, l) => s + l.perYear, 0);

const MORE: Row[] = [
  { label: "Tuition & fees / yr", kind: "observed", get: (f) => money(perYear(f, ["tuition", "fees"])) },
  { label: "Living costs / yr", kind: "observed", get: (f) => money(perYear(f, ["housing", "food", "books", "transportation", "misc"])) },
  { label: "Grants / yr", kind: "estimated", get: (f) => money(f.sel.aid) },
  { label: "Monthly loan payment", kind: "estimated", get: (f) => (f.result.loan.monthlyPayment > 0 ? `${money(f.result.loan.monthlyPayment)}/mo` : "—") },
  { label: "Pay range (low – high)", kind: "observed", get: (f) => { const p = f.ctx.outcome.earlyCareer.value; return p ? `${moneyCompact(p.p10)} – ${moneyCompact(p.p90)}` : "—"; } },
  { label: "Mid-career pay", kind: "observed", get: (f) => moneyCompact(f.ctx.outcome.midCareerMedian.value ?? f.ctx.major.midCareerMedian.value) },
  { label: "Graduate in 6 years", kind: "observed", get: (f) => pct(f.ctx.college.gradRate6.value) },
  { label: "Earned minus costs by 40", kind: "projected", get: (f) => moneyCompact(f.series[f.series.length - 1]) },
];

const SAMPLES: Array<{ label: string; sel: PathSel }> = [
  { label: "UC Berkeley Economics", sel: { collegeId: "uc-berkeley", majorId: "economics", residency: "resident", aid: 15000, living: "campus" } },
  { label: "NYU Finance", sel: { collegeId: "nyu", majorId: "finance", residency: "resident", aid: 30000, living: "campus" } },
  { label: "SJSU Business", sel: { collegeId: "san-jose-state", majorId: "business-administration", residency: "resident", aid: 8000, living: "campus" } },
];

/**
 * COMPARE. Your path plus up to two more, side by side. Click "Add college",
 * search, pick: done. Five numbers first; "Show more" for the rest.
 */
export function Compare() {
  const { futures, shown, paths, addPath, removePath, setPath, colleges, majors, loading, error } = useScenario();
  const reduce = useReducedMotion();
  const [more, setMore] = useState(false);
  const cols = futures.filter((f) => f.index < shown);
  const rows = more ? [...MAIN, ...MORE] : MAIN;
  const used = new Set(paths.slice(0, shown).map((p) => `${p.collegeId}.${p.majorId}`));
  const samples = SAMPLES.filter((s) => !used.has(`${s.sel.collegeId}.${s.sel.majorId}`));
  const shareHref = `/compare?p=${paths
    .slice(0, shown)
    .map((p) => `${p.collegeId}.${p.majorId}.${p.residency === "resident" ? "r" : "n"}.${p.living === "campus" ? "c" : p.living === "home" ? "h" : "o"}.${p.aid}`)
    .join(",")}`;

  const add = (collegeId: string) => {
    const c = colleges.find((x) => x.id === collegeId)!;
    const majorId = c.majorIds.includes(paths[0].majorId) ? paths[0].majorId : c.majorIds[0];
    void addPath({ collegeId, majorId, residency: "resident", aid: 0, living: "campus" });
  };

  return (
    <div className="grid gap-5">
      {shown > 1 && <p className="-mb-2 text-caption text-muted md:hidden">Swipe sideways to see each college.</p>}
      <LayoutGroup>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0" style={{ gridTemplateColumns: `repeat(${Math.min(3, shown + (shown < 3 ? 1 : 0))}, minmax(0, 1fr))` }}>
          <AnimatePresence initial={false} mode="popLayout">
            {cols.map((f) => (
              <motion.article
                key={`${f.index}.${f.sel.collegeId}.${f.sel.majorId}`}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: DUR.fast } }}
                transition={{ duration: DUR.standard, ease: EASE.smooth }}
                className="grid w-[82vw] max-w-[360px] shrink-0 snap-start content-start gap-4 rounded-md border border-rule bg-surface p-4 sm:p-5 md:w-auto md:max-w-none"
                aria-label={`${f.label}${f.index === 0 ? " (your path)" : ""}`}
              >
                <header className="grid gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-muted">
                      <span className="size-2 rounded-full" style={{ background: PATH_VAR[f.index] }} />
                      {f.index === 0 ? "YOUR PATH" : `PATH ${pathNo(f.index)}`}
                    </p>
                    {f.index > 0 && (
                      <button type="button" onClick={() => removePath(f.index)} aria-label={`Remove ${f.label}`} className="-my-3 -mr-2 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-sunk hover:text-ink">
                        <X className="size-4" aria-hidden />
                      </button>
                    )}
                  </div>
                  <h3 className="text-h3 font-bold leading-tight text-ink">{f.ctx.college.shortName}</h3>
                  <MajorPicker f={f} majors={majors} collegeMajors={colleges.find((c) => c.id === f.sel.collegeId)?.majorIds ?? []} onPick={(m) => void setPath(f.index, { majorId: m })} />
                  {f.ctx.college.control === "public" ? (
                    <div className="flex gap-1" role="group" aria-label={`Residency for ${f.ctx.college.shortName}`}>
                      {(["resident", "nonresident"] as const).map((r) => (
                        <button key={r} type="button" aria-pressed={f.sel.residency === r} onClick={() => void setPath(f.index, { residency: r })} className={cn("h-9 rounded-full border px-3 text-caption font-semibold transition-colors", f.sel.residency === r ? "border-ink bg-ink text-on-ink" : "border-rule text-ink-2 hover:text-ink")}>
                          {r === "resident" ? "In-state" : "Out-of-state"}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="flex h-9 items-center text-caption text-ink-2">{residencyShort(f)} · one tuition</p>
                  )}
                </header>
                <dl className="grid">
                  {rows.map((r, k) => (
                    <motion.div key={r.label} initial={k >= MAIN.length && !reduce ? { opacity: 0, y: -4 } : false} animate={{ opacity: 1, y: 0 }} className="flex items-baseline justify-between gap-3 border-t border-rule py-2.5">
                      <dt className="flex items-center gap-1.5 text-small text-ink-2">
                        {r.label}
                        {k < MAIN.length && <DataKindChip kind={r.kind} className="hidden xl:inline-flex" />}
                      </dt>
                      <dd className={cn("tabular text-right font-bold text-ink", k < MAIN.length ? "text-h3" : "text-small")}>{r.get(f)}</dd>
                    </motion.div>
                  ))}
                </dl>
              </motion.article>
            ))}
            {shown < 3 && (
              <motion.div key="add" layout={!reduce} className="grid self-start w-[82vw] max-w-[360px] shrink-0 snap-start content-start gap-4 rounded-md border border-dashed border-rule-strong p-4 sm:p-5 md:w-auto md:max-w-none">
                <p className="flex items-center gap-2 text-small font-bold text-ink">
                  <Plus className="size-4" aria-hidden /> Add a college
                </p>
                <Combobox label="Add a college" hideLabel value={null} placeholder="Search colleges" onChange={add} options={colleges.map((c) => ({ value: c.id, label: c.shortName, meta: c.state, keywords: [c.name] }))} searchPlaceholder="Search colleges" />
                {loading != null && loading > 0 && (
                  <p className="flex items-center gap-2 text-caption text-muted">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden /> Adding…
                  </p>
                )}
                {error && <p className="text-caption text-risk">{error}</p>}
                {samples.length > 0 && (
                  <div className="grid gap-2">
                    <p className="text-caption text-muted">{shown === 1 ? "Start by adding a college. Or try:" : "Or try:"}</p>
                    <div className="flex flex-wrap gap-2">
                      {samples.map((s) => (
                        <button key={s.label} type="button" onClick={() => void addPath(s.sel)} className="h-9 rounded-full border border-rule-strong bg-surface px-3 text-caption font-semibold text-ink hover:border-ink">
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="flex h-11 items-center gap-1.5 rounded-sm px-1 text-small font-semibold text-ink hover:underline">
          {more ? "Show less" : "Show more"}
          <ChevronDown className={cn("size-4 transition-transform", more && "rotate-180")} aria-hidden />
        </button>
        <div className="flex items-center gap-3">
          <SampleChip />
          <ButtonLink href={shareHref} variant="secondary" size="sm">
            Open full comparison
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function MajorPicker({ f, majors, collegeMajors, onPick }: { f: Future; majors: Array<{ id: string; name: string }>; collegeMajors: string[]; onPick: (id: string) => void }) {
  const opts = useMemo(() => collegeMajors.map((id) => ({ value: id, label: majors.find((m) => m.id === id)?.name ?? id })).sort((a, b) => a.label.localeCompare(b.label)), [collegeMajors, majors]);
  return <Combobox label={`Major at ${f.ctx.college.shortName}`} hideLabel value={f.sel.majorId} onChange={onPick} options={opts} searchPlaceholder="Search majors" />;
}
