import { ViewTransition } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Readout } from "@/components/ui/readout";
import { SampleChip } from "@/components/ui/lineage";
import { CollegeWorkspace } from "@/features/college/college-workspace";
import { CollegeHero } from "@/features/college/college-hero";
import { cumulativeSeries } from "@/lib/calc";
import type { MajorBundle } from "@/features/major/major-panel";
import { getCity, getCollege, getMajor, getOccupation, getOutcome, listColleges, runPath } from "@/services/data";
import { number } from "@/lib/format";
import type { Occupation } from "@/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return listColleges().map((c) => ({ id: c.id }));
}

export async function generateMetadata(props: PageProps<"/college/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const college = getCollege(id);
  if (!college) return { title: "College not found" };
  const majorId = typeof sp.major === "string" ? sp.major : undefined;
  const major = majorId && college.majorIds.includes(majorId) ? getMajor(majorId) : undefined;
  const title = major ? `${college.shortName} ${major.name} ROI` : `${college.shortName} cost, debt and earnings`;
  return {
    title,
    description: `${college.name} in ${college.city}, ${college.state}: tuition, net price, graduation rates, debt and earnings by major, with sources for every number.`,
    openGraph: { title: `${title} | College Value Lab` },
  };
}

const DEFAULT_MAJOR_ORDER = ["economics", "business-administration", "computer-science", "psychology", "biology"];

export default async function CollegePage(props: PageProps<"/college/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const college = getCollege(id);
  if (!college) notFound();

  const city = getCity(college.cityId) ?? null;
  const occupationCache = new Map<string, Occupation>();
  const majors: Record<string, MajorBundle> = {};
  for (const mid of college.majorIds) {
    const major = getMajor(mid);
    if (!major) continue;
    const occupations = major.occupations.map((o) => {
      if (!occupationCache.has(o.occupationId)) {
        const occ = getOccupation(o.occupationId);
        if (occ) occupationCache.set(o.occupationId, occ);
      }
      return occupationCache.get(o.occupationId)!;
    }).filter(Boolean);
    majors[mid] = { major, outcome: getOutcome(college.id, mid), occupations };
  }
  const requested = typeof sp.major === "string" && majors[sp.major] ? sp.major : undefined;
  const defaultMajorId = requested ?? DEFAULT_MAJOR_ORDER.find((m) => majors[m]) ?? Object.keys(majors)[0];
  const initialResidency = sp.residency === "nonresident" ? "nonresident" : "resident";

  const c = college.costs;
  // Hero: the default major's path, with average grant aid.
  const run = runPath({ collegeId: college.id, majorId: defaultMajorId, residency: initialResidency, living: "campus", yearsToGraduate: 4, funding: { aidPerYear: college.aid.avgGrant.value ?? 0, scholarshipsPerYear: 0, familyPerYear: 10000, workPerYear: 3000, savings: 0 }, options: { horizonAge: 40 } });
  const sorted = listColleges().slice().sort((a, b) => a.shortName.localeCompare(b.shortName));
  const at = sorted.findIndex((x) => x.id === college.id);
  const prev = sorted[(at - 1 + sorted.length) % sorted.length];
  const next = sorted[(at + 1) % sorted.length];
  const accent = [...college.id].reduce((h, ch) => h + ch.charCodeAt(0), 0) % 3;
  return (
    <>
      <Nav />
      <main id="main">
        {run && (
          <CollegeHero
            id={college.id}
            name={college.shortName}
            place={`${college.name} · ${college.city}, ${college.state} · ${college.control === "public" ? (initialResidency === "resident" ? "in-state" : "out-of-state") : "private"}, on campus, average grant aid`}
            major={run.major.name}
            metrics={{ netCost: run.result.net.netPrice, employment: run.result.employmentRate * 100, salary: run.result.startingSalary, debt: run.result.net.borrowing, breakEven: run.breakEven && run.breakEven.age > 18 ? run.breakEven.age : null }}
            series={cumulativeSeries(run.result.rows, 40)}
            base={cumulativeSeries(run.baseline, 40)}
            prev={{ id: prev.id, name: prev.shortName }}
            next={{ id: next.id, name: next.shortName }}
            accent={accent}
          />
        )}
        <header className="relative isolate overflow-hidden border-b border-rule">
          <div aria-hidden className="measured-field field-fade pointer-events-none absolute inset-0 -z-10" />
          <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-10 pt-8 md:px-8 md:pt-12 xl:px-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="grid gap-2">
                <h2 className="text-h2 font-bold">{college.name} at a glance</h2>
                <p className="text-lede text-ink-2">
                  {college.city}, {college.state} · {college.control === "public" ? "Public" : "Private nonprofit"} · {number(college.undergradEnrollment.value)} undergraduates
                </p>
              </div>
              <SampleChip />
            </div>
            <ViewTransition name={`college-stats-${college.id}`}>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-6 rounded-lg border border-rule bg-surface p-5 shadow-2 sm:grid-cols-3 lg:grid-cols-5">
              {college.control === "public" ? (
                <>
                  <Readout size="sm" label="In-state tuition" value={c.tuitionInState.value} format="money" lineage={c.tuitionInState.lineage} footnote={1} />
                  <Readout size="sm" label="Out-of-state tuition" value={c.tuitionOutOfState.value} format="money" lineage={c.tuitionOutOfState.lineage} footnote={2} />
                </>
              ) : (
                <Readout size="sm" label="Tuition" value={c.tuitionInState.value} format="money" lineage={c.tuitionInState.lineage} footnote={1} />
              )}
              <Readout size="sm" label="Fees" value={c.fees.value} format="money" lineage={c.fees.lineage} footnote={3} />
              <Readout size="sm" label="Room and board" value={(c.room.value ?? 0) + (c.board.value ?? 0)} format="money" lineage={c.room.lineage} footnote={4} />
              <Readout size="sm" label="Average net price" value={c.netPrice.value} format="money" lineage={c.netPrice.lineage} footnote={5} explain="What students receiving grant aid paid on average, after grants and scholarships, for one year." />
              <Readout size="sm" label="6-year graduation rate" value={college.gradRate6.value} format="pct" lineage={college.gradRate6.lineage} footnote={6} explain="This is based on historical outcomes for students at this institution and does not predict any individual student with certainty." />
              <Readout size="sm" label="Median debt" value={college.medianDebt.value} format="money" lineage={college.medianDebt.lineage} footnote={7} />
              <Readout size="sm" label="Median earnings" value={college.medianEarnings.value} format="money" lineage={college.medianEarnings.lineage} footnote={8} unit="/yr" explain="Median earnings of federally aided students 10 years after they started college." />
              <Readout size="sm" label="Receive grant aid" value={college.aid.pctReceivingGrants.value} format="pct" lineage={college.aid.pctReceivingGrants.lineage} footnote={9} />
              {college.control === "private" && (
                <Readout size="sm" label="Average grant" value={college.aid.avgGrant.value} format="money" lineage={college.aid.avgGrant.lineage} footnote={10} />
              )}
            </dl>
            </ViewTransition>
          </div>
        </header>
        <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 md:px-8 xl:px-12">
          <CollegeWorkspace college={college} city={city} majors={majors} defaultMajorId={defaultMajorId} initialResidency={initialResidency} />
        </div>
      </main>
      <Footer />
    </>
  );
}
