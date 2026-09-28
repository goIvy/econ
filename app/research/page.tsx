import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { BreakEvenBars, PriceEarningsScatter } from "@/features/research/research-charts";
import { breakEvenByMajor, priceVsEarnings } from "@/features/research/data";

export const metadata: Metadata = { title: "Research", description: "Patterns across 120 colleges and 50 majors: price versus earnings, and how quickly each major recovers its cost. Correlation, clearly labeled." };

export default function ResearchPage() {
  const scatter = priceVsEarnings();
  const be = breakEvenByMajor();
  return (
    <PageShell title="Research" lede="Patterns across every college and major in the data. Each chart is labeled with what kind of number it shows, and where a relationship is correlation, it says so." wide>
      <div className="grid gap-16">
        <section aria-labelledby="r1" className="grid gap-5">
          <h2 id="r1" className="text-h2 font-extrabold">Does paying more mean earning more?</h2>
          <PriceEarningsScatter {...scatter} />
        </section>
        <section aria-labelledby="r2" className="grid gap-5">
          <h2 id="r2" className="text-h2 font-extrabold">Which majors recover their cost fastest?</h2>
          <BreakEvenBars rows={be.rows} cost={be.cost} />
        </section>
      </div>
    </PageShell>
  );
}
