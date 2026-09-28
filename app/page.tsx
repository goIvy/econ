import { Nav, type SpySection } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Chapter } from "@/components/site/chapter";
import { ButtonLink } from "@/components/ui/button";
import { ThreeFutures } from "@/features/hero/three-futures";
import { ScenarioProvider } from "@/features/scenario/store";
import { scenarioSeed } from "@/features/scenario/data";
import { TrueCost } from "@/features/chapters/true-cost";
import { CompareStage } from "@/features/chapters/compare-stage";
import { BreakEvenExplorer } from "@/features/chapters/break-even-explorer";
import { WhatIfLab } from "@/features/chapters/what-if-lab";
import { Lessons } from "@/features/chapters/lessons";
import { cityData, employmentMajors, lessonInputs, trayCards } from "@/features/chapters/data";
import { EmploymentParticles } from "@/features/chapters/employment-particles";
import { FuturesSim } from "@/features/chapters/futures-sim";
import { CityExplorer } from "@/features/chapters/city-explorer";
import { Pipeline } from "@/features/chapters/pipeline";
import { TwoStudents } from "@/features/experience/two-students";
import { twoStudentsDefaults } from "@/features/experience/data";
import { SalaryDistribution } from "@/features/home/salary-distribution";
import { majorsTable } from "@/features/home/data";

const SECTIONS: SpySection[] = [
  { id: "futures-hero", label: "Three futures" },
  { id: "true-cost", label: "True cost" },
  { id: "compare", label: "Compare" },
  { id: "opportunity", label: "Opportunity cost" },
  { id: "salaries", label: "Salaries" },
  { id: "employment", label: "Employment" },
  { id: "break-even", label: "Break-even" },
  { id: "what-if", label: "What-if lab" },
  { id: "futures", label: "1,000 futures" },
  { id: "cost-of-living", label: "Cost of living" },
  { id: "learn", label: "Learn" },
  { id: "research", label: "Methodology" },
];

export default function HomePage() {
  return (
    <>
      <Nav overlay sections={SECTIONS} />
      <ScenarioProvider seed={scenarioSeed()}>
        <main id="main">
          <ThreeFutures />

          <Chapter id="true-cost" eyebrow="01 · WHAT DOES COLLEGE ACTUALLY COST?" title="The price you see isn't the price you pay." lede="Scroll to build one year of college, line by line. Watch the costs stack up, then watch aid take its share away.">
            <TrueCost />
          </Chapter>

          <Chapter id="compare" eyebrow="02 · HOW DO YOUR OPTIONS STACK UP?" title="Put your options side by side." lede="Pick up a college and drop it on the stage. Switch the lens between cost, career, risk and the long term. Nothing here is ranked.">
            <CompareStage cards={trayCards()} />
          </Chapter>

          <Chapter id="opportunity" theme="dark" eyebrow="03 · WHAT ARE YOU GIVING UP?" title="College costs more than tuition." lede="Two students start at 18. One goes to college; one starts working. Scroll through the years: the gap between them is opportunity cost, and the crossing is break-even.">
            <TwoStudents {...twoStudentsDefaults()} />
          </Chapter>

          <Chapter id="salaries" eyebrow="04 · WHAT MIGHT YOU EARN?" title="A salary isn't one number." lede="Graduates with the same degree earn very different amounts. Move along the curve to see where a salary falls.">
            <SalaryDistribution majors={majorsTable()} />
          </Chapter>

          <Chapter id="employment" theme="dark" eyebrow="05 · WHAT HAPPENS AFTER GRADUATION?" title="What happens after graduation?" lede="Start with 100 graduates. A year later, where are they? Pick a major and watch them sort themselves out.">
            <EmploymentParticles majors={employmentMajors()} />
          </Chapter>

          <Chapter id="break-even" theme="dark-2" eyebrow="06 · WHEN COULD IT PAY OFF?" title="When does the investment catch up?" lede="Paths 01 and 02 against working from 18. Drag through time, or press play and watch debt fall, salary rise and each break-even land.">
            <BreakEvenExplorer />
          </Chapter>

          <Chapter id="what-if" eyebrow="07 · WHAT IF?" title="Change one assumption. Watch the future change." lede="Every control re-runs the model for your active path. Let go of a slider and see exactly what moved.">
            <WhatIfLab />
          </Chapter>

          <Chapter id="futures" theme="dark" glow eyebrow="08 · HOW UNCERTAIN IS IT?" title="Your future is a range, not a single number." lede="Run your active path a thousand times, each with its own salary, job search, graduation time and costs. Watch the futures spread out, then settle into what's likely.">
            <FuturesSim />
          </Chapter>

          <Chapter id="cost-of-living" eyebrow="09 · WHERE WILL YOU LIVE?" title="Where you live changes what your salary means." lede="The same paycheck splits very differently in different cities. Pick a salary, then hover or tap a city.">
            <CityExplorer {...cityData()} />
          </Chapter>

          <Chapter id="learn" theme="dark-2" eyebrow="10 · LEARN THE ECONOMICS" title="The ideas behind every number." lede="Eight short experiments. Open one and play with it.">
            <Lessons data={lessonInputs()} />
          </Chapter>

          <Chapter id="research" eyebrow="11 · RESEARCH & METHODOLOGY" title="How every number is made." lede="The whole model as one path. Click any step to see its formula, its sources, what kind of number it is, and its value for your active path.">
            <Pipeline />
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/methodology" variant="secondary">
                Full methodology and limits
              </ButtonLink>
              <ButtonLink href="/research" variant="secondary">
                Research: patterns across colleges
              </ButtonLink>
            </div>
          </Chapter>

          <section className="theme-dark relative isolate overflow-hidden bg-paper" aria-labelledby="cta-h">
            <div aria-hidden className="glow-hero pointer-events-none absolute inset-0 -z-10" />
            <div className="mx-auto grid max-w-[1200px] justify-items-center gap-6 px-4 py-28 text-center md:px-8 md:py-40">
              <h2 id="cta-h" className="max-w-[14ch] text-section font-extrabold">
                See what college is really worth.
              </h2>
              <p className="max-w-[40rem] text-lede text-ink-2">Build your own paths, compare them side by side, and see how every assumption changes the outcome.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <ButtonLink href="/get-started" size="lg">
                  Get started
                </ButtonLink>
                <ButtonLink href="/compare" size="lg" variant="secondary">
                  Compare colleges
                </ButtonLink>
              </div>
            </div>
          </section>
        </main>
      </ScenarioProvider>
      <Footer />
    </>
  );
}
