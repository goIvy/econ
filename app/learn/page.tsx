import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { AverageSalaryLesson, CheaperCanWin, DebtCompoundsLesson, OpportunityCostLesson, PurchasingPowerLesson } from "@/features/learn/lessons";
import { LESSONS, lessonData } from "@/features/learn/data";

export const metadata: Metadata = {
  title: "Learn the economics",
  description: "Five short interactive lessons: opportunity cost, why cheaper can win, why averages mislead, how debt compounds, and purchasing power.",
};

export default function LearnPage() {
  const d = lessonData();
  return (
    <PageShell
      title="Learn the economics"
      lede="Five short lessons. Scroll through each one and use the chart beside it: every example runs the same model as the rest of the site."
      headerExtra={
        <nav aria-label="Lessons" className="mt-2">
          <ol className="flex flex-wrap gap-2">
            {LESSONS.map((l, i) => (
              <li key={l.slug}>
                <Link href={`#${l.slug}`} className="flex min-h-10 items-center gap-2 rounded-full border border-rule bg-surface px-3 text-small text-ink-2 hover:border-ink hover:text-ink">
                  <span className="tabular font-semibold text-ink">{i + 1}</span>
                  {l.short}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      }
    >
      <CheaperCanWin cheap={d.cheap} pricey={d.pricey} />
      <OpportunityCostLesson opportunity={d.opportunity} />
      <AverageSalaryLesson salary={d.salary} />
      <DebtCompoundsLesson />
      <PurchasingPowerLesson cities={d.cities} />
    </PageShell>
  );
}
