import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { AverageSalaryLesson, CheaperCanWin, DebtCompoundsLesson, OpportunityCostLesson, PurchasingPowerLesson } from "@/features/learn/lessons";
import { LESSONS, lessonData } from "@/features/learn/data";
import { Lessons } from "@/features/chapters/lessons";
import { CityExplorer } from "@/features/chapters/city-explorer";
import { cityData, lessonInputs } from "@/features/chapters/data";

export const metadata: Metadata = {
  title: "Learn the economics",
  description: "Five short interactive lessons: opportunity cost, why cheaper can win, why averages mislead, how debt compounds, and purchasing power.",
};

export default function LearnPage() {
  const d = lessonData();
  return (
    <PageShell
      title="Learn the economics"
      lede="Short lessons you can play with. Scroll through each one and use the chart beside it: every example runs the same model as the rest of the site."
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
      <section id="salary-buys" aria-labelledby="salary-buys-h" className="scroll-mt-[calc(var(--nav-h)+16px)] border-t border-rule py-14 md:py-20">
        <div className="mb-8 grid gap-2">
          <h2 id="salary-buys-h" className="text-h2 font-bold">
            What your salary can actually buy
          </h2>
          <p className="max-w-[44rem] text-small text-ink-2">$100,000 does not provide the same lifestyle in every city. Pick a salary and where your offer is, then compare cities: see what goes to taxes, housing and basic costs, and how much is left.</p>
        </div>
        <CityExplorer {...cityData()} />
      </section>
      <section id="experiments" aria-labelledby="experiments-h" className="scroll-mt-[calc(var(--nav-h)+16px)] border-t border-rule py-14 md:py-20">
        <div className="mb-8 grid gap-2">
          <h2 id="experiments-h" className="text-h2 font-bold">
            Quick experiments
          </h2>
          <p className="max-w-[44rem] text-small text-ink-2">Eight ideas behind every number on this site. Open one and play with it.</p>
        </div>
        <Lessons data={lessonInputs()} />
      </section>
    </PageShell>
  );
}
