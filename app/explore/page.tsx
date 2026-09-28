import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { SampleChip } from "@/components/ui/lineage";
import { CollegeCard, type CollegeCardData } from "@/features/college/college-card";
import { CompareTray } from "@/features/college/compare-tray";
import { ExploreFilters, ExploreSearch, ExploreSort } from "@/features/college/explore-filters";
import { STATE_NAMES, listColleges, majorOptions, searchColleges, statesWithColleges, type CollegeFilters } from "@/services/data";

export const metadata: Metadata = {
  title: "Explore colleges",
  description: "Search 120 colleges by name, city or state. Filter by net price, graduation rate, debt, earnings and majors, then compare up to five.",
};

const num = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function ExplorePage(props: PageProps<"/explore">) {
  const sp = await props.searchParams;
  const filters: CollegeFilters = {
    q: str(sp.q)?.slice(0, 80),
    control: (["public", "private"] as const).find((x) => x === str(sp.control)),
    state: str(sp.state)?.slice(0, 2).toUpperCase(),
    maxNetPrice: num(sp.maxNetPrice),
    minGradRate: num(sp.minGradRate),
    maxAcceptance: num(sp.maxAcceptance),
    size: (["small", "medium", "large"] as const).find((x) => x === str(sp.size)),
    maxDebt: num(sp.maxDebt),
    minEarnings: num(sp.minEarnings),
    major: str(sp.major)?.slice(0, 60),
    sort: (["name", "net-price", "earnings", "grad-rate", "debt"] as const).find((x) => x === str(sp.sort)),
  };
  const results = searchColleges(filters);
  const cards: CollegeCardData[] = results.map((c) => ({
    id: c.id,
    name: c.name,
    city: c.city,
    state: c.state,
    control: c.control,
    tuitionIn: (c.costs.tuitionInState.value ?? 0) + (c.costs.fees.value ?? 0),
    tuitionOut: (c.costs.tuitionOutOfState.value ?? 0) + (c.costs.fees.value ?? 0),
    netPrice: c.costs.netPrice.value,
    gradRate6: c.gradRate6.value,
    medianEarnings: c.medianEarnings.value,
    medianDebt: c.medianDebt.value,
    enrollment: c.undergradEnrollment.value,
    acceptance: c.acceptanceRate.value,
  }));
  const names = Object.fromEntries(listColleges().map((c) => [c.id, c.shortName]));
  const states = statesWithColleges().map((s) => ({ value: s, label: STATE_NAMES[s] ?? s }));
  const majors = majorOptions().map((m) => ({ value: m.id, label: m.name }));

  return (
    <PageShell
      title="Explore colleges"
      lede="Search by name, city or state. Add up to five colleges to compare their paths side by side."
      headerExtra={
        <Suspense>
          <ExploreSearch initial={filters.q ?? ""} />
        </Suspense>
      }
    >
      <div className="grid gap-8 pb-24 lg:grid-cols-[17rem_1fr] lg:gap-12">
        <aside aria-label="Filters" className="lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:self-start">
          <Suspense>
            <ExploreFilters states={states} majors={majors} count={results.length} />
          </Suspense>
        </aside>
        <section aria-labelledby="results-h" className="grid content-start gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-h" className="font-sans text-small font-semibold text-ink" aria-live="polite">
              {results.length} {results.length === 1 ? "college" : "colleges"}
              {filters.q ? ` matching “${filters.q}”` : ""}
            </h2>
            <div className="flex items-center gap-3">
              <SampleChip />
              <Suspense>
                <ExploreSort />
              </Suspense>
            </div>
          </div>
          {cards.length === 0 ? (
            <div className="grid justify-items-start gap-3 rounded-lg border border-dashed border-rule-strong bg-surface p-8">
              <SearchX className="size-6 text-muted" aria-hidden />
              <p className="font-display text-h3 font-semibold">No colleges match these filters</p>
              <p className="measure text-small text-ink-2">Try widening the net price or graduation rate, or search by state instead of city. The demo dataset covers 120 colleges.</p>
              <Link href="/explore" className="text-small font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
                Clear search and filters
              </Link>
            </div>
          ) : (
            <ul className="grid gap-3">
              {cards.map((c) => (
                <li key={c.id}>
                  <CollegeCard c={c} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <CompareTray names={names} />
    </PageShell>
  );
}
