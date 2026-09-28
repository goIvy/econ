import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { MajorsIndex } from "@/features/major/majors-index";
import type { MajorBundle } from "@/features/major/major-panel";
import { getOccupation, listMajors } from "@/services/data";
import type { Occupation } from "@/types";

export const metadata: Metadata = {
  title: "Majors",
  description: "Earnings ranges, employment, unemployment, typical occupations and industries for 50 majors, with sources for every number.",
};

export default function MajorsPage() {
  const bundles: MajorBundle[] = listMajors().map((major) => ({
    major,
    outcome: null,
    occupations: major.occupations.map((o) => getOccupation(o.occupationId)).filter((o): o is Occupation => Boolean(o)),
  }));
  return (
    <PageShell title="Majors" lede="What graduates earn (the whole range, not just the average), how often they find work, and where they end up.">
      <MajorsIndex bundles={bundles} />
    </PageShell>
  );
}
