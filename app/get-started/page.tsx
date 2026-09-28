import type { Metadata } from "next";
import { Nav } from "@/components/site/nav";
import { Onboarding } from "@/features/onboarding/onboarding";
import type { CollegeMeta } from "@/features/comparison/compare-workspace";
import { STATE_NAMES, listCities, listColleges, majorOptions } from "@/services/data";

export const metadata: Metadata = {
  title: "Get started",
  description: "Tell us what you're comparing and we'll set up your first side-by-side comparison. Every question is optional.",
};

export default function GetStartedPage() {
  const colleges: CollegeMeta[] = listColleges()
    .map((c) => ({ id: c.id, name: c.name, shortName: c.shortName, city: c.city, state: c.state, control: c.control, avgGrant: c.aid.avgGrant.value ?? 0, majorIds: c.majorIds }))
    .sort((a, b) => a.shortName.localeCompare(b.shortName));
  const states = Object.entries(STATE_NAMES).map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  const cities = listCities().map((c) => ({ value: c.id, label: `${c.name}, ${c.state}` })).sort((a, b) => a.label.localeCompare(b.label));
  return (
    <>
      <Nav />
      <main id="main" className="relative isolate min-h-[calc(100dvh-var(--nav-h))] overflow-hidden px-4 py-12 md:px-8 md:py-16">
        <div aria-hidden className="measured-field field-fade pointer-events-none absolute inset-0 -z-10" />
        <h1 className="sr-only">Get started</h1>
        <Onboarding colleges={colleges} majors={majorOptions().map((m) => ({ id: m.id, name: m.name, category: m.category }))} states={states} cities={cities} />
      </main>
    </>
  );
}
