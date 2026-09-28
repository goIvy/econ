"use client";

import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useRef } from "react";
import { InfoTip } from "@/components/ui/info-tip";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { cellIn, growWidth, revealViewport } from "@/lib/animations";
import { pct } from "@/lib/format";
import type { College, Major } from "@/types";

export const GRAD_DISCLAIMER =
  "This is based on historical outcomes for students at this institution and does not predict any individual student with certainty.";

/** Graduation probability (§15) and employment model (§16). */
export function OutcomesPanel({ college, major }: { college: College; major: Major }) {
  const g4 = college.gradRate4.value;
  const g6 = college.gradRate6.value;
  const unemp = major.unemploymentRate.value ?? 0;
  const under = major.underemploymentRate.value ?? 0;
  const employed = 100 - unemp;
  // Of the employed, the underemployment share is of all employed recent grads.
  const inDegreeJobs = employed * (1 - under / 100);
  const inOtherJobs = employed - inDegreeJobs;

  return (
    <div className="grid gap-12">
      <section aria-labelledby="grad-h" className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="grad-h" className="flex items-center gap-1.5 text-h3 font-semibold">
            Graduation probability
            <InfoTip label="graduation probability">{GRAD_DISCLAIMER}</InfoTip>
          </h3>
          <SampleChip />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Gauge label="Finish within 4 years" value={g4} lineage={<SourceFootnote metric="4-year graduation rate" lineage={college.gradRate4.lineage} n={1} />} />
          <Gauge label="Finish within 6 years" value={g6} lineage={<SourceFootnote metric="6-year graduation rate" lineage={college.gradRate6.lineage} n={2} />} />
        </div>
        <p className="measure text-small text-ink-2">
          Of 100 students who started full time at {college.shortName}, about {g4 ?? "—"} finished in four years and {g6 ?? "—"} within six. {GRAD_DISCLAIMER}
        </p>
      </section>

      <section aria-labelledby="emp-h" className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="emp-h" className="text-h3 font-semibold">Employment after graduating in {major.name}</h3>
          <SourceFootnote metric={`${major.name} employment outcomes`} lineage={major.unemploymentRate.lineage} n={3} />
        </div>
        <Waffle
          segments={[
            { label: "Working in a job that typically needs a degree", value: inDegreeJobs, color: "var(--ink)" },
            { label: "Working in a job that typically doesn't (underemployed)", value: inOtherJobs, color: "var(--caution)", hatch: true },
            { label: "Looking for work (unemployed)", value: unemp, color: "var(--risk)" },
          ]}
        />
        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Employment rate" value={pct(employed, 1)} />
          <Stat label="Unemployment rate" value={pct(unemp, 1)} />
          <Stat label="Underemployment rate" value={pct(under)} tip={major.underemploymentRate.lineage.note} />
          <Stat label="Go on to grad school" value={pct(major.gradSchoolRate.value)} />
          <Stat label="Months to first job" value={major.monthsToFirstJob.value != null ? `${major.monthsToFirstJob.value.toFixed(1)} (approx.)` : "No reliable data"} />
        </dl>
        <p className="measure text-small text-ink-2">
          National outcomes for recent {major.name.toLowerCase()} graduates aged 22–27. Employment reflects past labor markets and the students who chose this major, so it isn&apos;t a forecast for any one person.
        </p>
      </section>
    </div>
  );
}

function Gauge({ label, value, lineage }: { label: string; value: number | null; lineage: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, revealViewport);
  const reduce = useReducedMotion();
  return (
    <div ref={ref} className="grid gap-2 rounded-md border border-rule bg-surface p-4">
      <p className="flex items-center gap-1.5 text-caption font-medium text-muted">
        {label} {lineage}
      </p>
      <p className="tabular text-readout font-semibold text-ink">{pct(value)}</p>
      <div className="relative h-3 overflow-hidden rounded-full bg-surface-sunk" role="img" aria-label={`${label}: ${pct(value)}`}>
        <motion.div className="h-full rounded-full bg-ink" variants={growWidth} custom={`${value ?? 0}%`} initial={reduce ? "visible" : "hidden"} animate={inView || reduce ? "visible" : "hidden"} />
        {[25, 50, 75].map((t) => (
          <span key={t} aria-hidden className="absolute inset-y-0 w-px bg-surface" style={{ left: `${t}%` }} />
        ))}
      </div>
    </div>
  );
}

/** 100-cell waffle: each cell is one graduate in 100. Identity by label + pattern, not color alone. */
function Waffle({ segments }: { segments: Array<{ label: string; value: number; color: string; hatch?: boolean }> }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, revealViewport);
  const reduce = useReducedMotion();
  const cells: number[] = [];
  let acc = 0;
  const bounds = segments.map((s) => (acc += s.value));
  for (let i = 0; i < 100; i++) cells.push(bounds.findIndex((b) => i + 0.5 < b));
  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center md:gap-8">
      <div className="grid w-fit gap-[3px]" style={{ gridTemplateColumns: "repeat(20, minmax(0, 1fr))" }} role="img" aria-label={segments.map((s) => `${s.label}: about ${Math.round(s.value)} in 100`).join("; ")}>
        {cells.map((seg, i) => {
          const s = segments[seg < 0 ? segments.length - 1 : seg];
          return (
            <motion.span
              key={i}
              className="block size-3.5 rounded-[3px] sm:size-4"
              style={{ background: s.color, backgroundImage: s.hatch ? "repeating-linear-gradient(45deg, transparent 0 2px, color-mix(in srgb, var(--on-ink) 45%, transparent) 2px 3px)" : undefined }}
              variants={cellIn}
              custom={reduce ? 0 : i}
              initial={reduce ? "visible" : "hidden"}
              animate={inView || reduce ? "visible" : "hidden"}
            />
          );
        })}
      </div>
      <ul className="grid gap-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-start gap-2 text-small text-ink-2">
            <span aria-hidden className="mt-1 size-3.5 shrink-0 rounded-[3px]" style={{ background: s.color, backgroundImage: s.hatch ? "repeating-linear-gradient(45deg, transparent 0 2px, color-mix(in srgb, var(--on-ink) 45%, transparent) 2px 3px)" : undefined }} />
            <span>
              <strong className="tabular font-semibold text-ink">{Math.round(s.value)} in 100</strong> {s.label.toLowerCase()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, tip }: { label: string; value: string; tip?: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="flex items-center gap-1 text-caption text-muted">
        {label}
        {tip && <InfoTip label={label}>{tip}</InfoTip>}
      </dt>
      <dd className="tabular text-base font-semibold text-ink">{value}</dd>
    </div>
  );
}
