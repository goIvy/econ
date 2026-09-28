import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Readout } from "@/components/ui/readout";
import { SampleChip } from "@/components/ui/lineage";
import { CollegeWorkspace } from "@/features/college/college-workspace";
import type { MajorBundle } from "@/features/major/major-panel";
import { getCity, getCollege, getMajor, getOccupation, getOutcome, listColleges } from "@/services/data";
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
  return (
    <>
      <Nav />
      <main id="main">
        <header className="relative isolate overflow-hidden border-b border-rule">
          <div aria-hidden className="measured-field field-fade pointer-events-none absolute inset-0 -z-10" />
          <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-10 pt-8 md:px-8 md:pt-12 xl:px-12">
            <Link href="/explore" className="inline-flex w-fit items-center gap-1 rounded-xs text-small font-medium text-ink-2 hover:text-ink">
              <ChevronLeft className="size-4" aria-hidden /> All colleges
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="grid gap-2">
                <h1 className="text-h1 font-bold">{college.name}</h1>
                <p className="text-lede text-ink-2">
                  {college.city}, {college.state} · {college.control === "public" ? "Public" : "Private nonprofit"} · {number(college.undergradEnrollment.value)} undergraduates
                </p>
              </div>
              <SampleChip />
            </div>
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
