import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { SavedList } from "@/features/saved/saved-list";
import { contextFor } from "@/features/scenario/data";

export const metadata: Metadata = { title: "Saved comparisons", description: "Comparisons you saved in this browser." };

const WANT: Array<[string, string, string[], number]> = [
  ["Try Berkeley Economics", "uc-berkeley", ["economics"], 15000],
  ["Try NYU Finance", "nyu", ["finance"], 30000],
  ["Try SJSU Business", "san-jose-state", ["business-administration", "economics"], 8000],
];

export default function SavedPage() {
  const suggestions = WANT.flatMap(([label, college, majors, aid]) => {
    const m = majors.find((x) => contextFor(college, x));
    return m ? [{ label, href: `/compare?p=${college}.${m}.r.c.${aid}` }] : [];
  });
  return (
    <PageShell title="Saved comparisons" lede="Your saved scenarios, kept in this browser. Open one to pick up exactly where you left off.">
      <SavedList suggestions={suggestions} />
    </PageShell>
  );
}
