"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { PercentileStrip } from "@/components/charts/percentile-strip";
import { Readout } from "@/components/ui/readout";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { collapse, growWidth } from "@/lib/animations";
import { money, pct } from "@/lib/format";
import type { CollegeMajorOutcome, Major, Occupation } from "@/types";

export interface MajorBundle {
  major: Major;
  outcome: CollegeMajorOutcome | null;
  occupations: Occupation[];
}

/** Everything the spec lists for a major (§10), at a college when `outcome` is given. */
export function MajorPanel({ bundle, collegeName }: { bundle: MajorBundle; collegeName?: string }) {
  const { major, outcome, occupations } = bundle;
  const p = outcome?.earlyCareer.value ?? major.earlyCareer.value!;
  const pLineage = outcome?.earlyCareer.lineage ?? major.earlyCareer.lineage;
  const mid = outcome?.midCareerMedian.value ?? major.midCareerMedian.value;
  return (
    <div className="grid gap-8">
      <AnimatePresence initial={false}>
      {outcome?.isFallback && (
        <motion.div key={`fb-${major.id}`} variants={collapse} initial="hidden" animate="visible" exit="exit" className="flex gap-3 overflow-hidden rounded-md border border-caution/30 bg-caution-tint p-4 text-small text-caution" role="note">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <strong className="font-semibold">No field-of-study salary data is available for this program{collegeName ? ` at ${collegeName}` : ""}.</strong> Showing the national earnings for {major.name}, adjusted to this institution&apos;s earnings level. Try viewing institution-wide outcomes on the Earnings tab too.
          </p>
        </motion.div>
      )}
      </AnimatePresence>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="grid content-start gap-3 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-small font-semibold text-ink">
              Early-career earnings{collegeName && !outcome?.isFallback ? ` at ${collegeName}` : ""}
              <SourceFootnote metric={`${major.name} early-career earnings`} lineage={pLineage} n={1} className="ml-1" />
            </p>
            <SampleChip />
          </div>
          <PercentileStrip p={p} compare={outcome ? major.earlyCareer.value : null} compareLabel={`All ${major.name} graduates nationally`} label={`${major.name} salary percentiles`} />
        </div>
        <dl className="grid grid-cols-2 content-start gap-5 lg:col-span-5">
          <Readout label="Median starting salary" value={p.p50} format={money} lineage={pLineage} footnote={2} unit="/yr" />
          <Readout label="Mid-career estimate" value={mid} format={money} lineage={outcome?.midCareerMedian.lineage ?? major.midCareerMedian.lineage} footnote={3} estimate={Boolean(outcome)} unit="/yr" />
          <Readout label="Employment rate" value={major.employmentRate.value} format={(n) => pct(n, 1)} lineage={major.employmentRate.lineage} footnote={4} explain="Share of recent graduates in the labor force who have a job." />
          <Readout label="Unemployment" value={major.unemploymentRate.value} format={(n) => pct(n, 1)} lineage={major.unemploymentRate.lineage} footnote={5} />
          <Readout label="Go on to grad school" value={major.gradSchoolRate.value} format={(n) => pct(n)} lineage={major.gradSchoolRate.lineage} footnote={6} explain="Graduate school changes both cost and earnings, so it shifts the break-even point." />
          <Readout label="Months to first job" value={major.monthsToFirstJob.value} format={(n) => n.toFixed(1)} lineage={major.monthsToFirstJob.lineage} footnote={7} emptyText="No reliable data" estimate />
        </dl>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="mb-3 text-small font-semibold text-ink">Typical occupations</p>
          <div className="overflow-hidden rounded-md border border-rule">
            <table className="w-full text-small">
              <caption className="sr-only">Typical occupations for {major.name} graduates</caption>
              <thead className="bg-surface-sunk text-caption text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Occupation</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Share</th>
                  <th scope="col" className="hidden px-3 py-2 text-right font-medium sm:table-cell">Median wage</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">10-yr growth</th>
                </tr>
              </thead>
              <tbody>
                {major.occupations.map((o) => {
                  const occ = occupations.find((x) => x.id === o.occupationId);
                  if (!occ) return null;
                  const g = occ.growth10yr.value ?? 0;
                  return (
                    <tr key={o.occupationId} className="border-t border-rule">
                      <th scope="row" className="px-3 py-2 text-left font-normal text-ink">
                        {occ.title}
                        <span className="block text-caption text-muted">{occ.typicalEducation}</span>
                      </th>
                      <td className="tabular px-3 py-2 text-right text-ink-2">{pct(o.share * 100)}</td>
                      <td className="tabular hidden px-3 py-2 text-right text-ink-2 sm:table-cell">{money(occ.medianWage.value)}</td>
                      <td className="tabular px-3 py-2 text-right">
                        <span className={g >= 10 ? "text-gain" : g < 0 ? "text-risk" : "text-ink-2"}>
                          {g > 0 ? "+" : ""}
                          {g}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-caption text-muted">Growth: BLS projected change in jobs over 10 years. Shares don&apos;t add to 100%; the rest work in many other occupations.</p>
        </div>
        <div className="lg:col-span-5">
          <p className="mb-3 text-small font-semibold text-ink">Industries where graduates work</p>
          <ul className="grid gap-2">
            {major.industries.map((ind) => (
              <li key={ind.industry} className="grid grid-cols-[9rem_1fr] items-center gap-3">
                <span className="truncate text-small text-ink-2">{ind.industry}</span>
                <span className="flex items-center gap-2">
                  <motion.span className="block h-[14px] rounded-r-[4px] bg-muted" variants={growWidth} custom={`${Math.min(80, ind.share * 150)}%`} initial="hidden" animate="visible" />
                  <span className="tabular text-caption font-semibold text-ink">{pct(ind.share * 100)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
