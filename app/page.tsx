import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { AxisRule, Section, SectionHeading } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { HeroPaths } from "@/features/experience/hero-paths";
import { compareCards, heroPaths, mapCities, netCostStory, pathPresets, twoStudentsDefaults } from "@/features/experience/data";
import { FinancialTimeline } from "@/features/experience/financial-timeline";
import { WhatIfLab } from "@/features/experience/what-if";
import { DebtStack } from "@/features/experience/debt-stack";
import { CompareStage } from "@/features/experience/compare-stage";
import { PossibleFutures } from "@/features/experience/possible-futures";
import { PurchasingMap } from "@/features/experience/purchasing-map";
import { TwoStudents } from "@/features/experience/two-students";
import { NetCostStory } from "@/features/experience/net-cost-story";
import { SalaryDistribution } from "@/features/home/salary-distribution";
import { Transparency } from "@/features/home/transparency";
import { MethodologyCredibility } from "@/features/home/methodology-credibility";
import { Pricing } from "@/features/home/pricing";
import { majorsTable } from "@/features/home/data";
import { LearnTeaser } from "@/features/learn/learn-teaser";
import { LESSONS } from "@/features/learn/data";
import { Concept } from "@/components/concepts/concept";
import { getOutcome } from "@/services/data";
import { money } from "@/lib/format";

const FAQ = [
  {
    q: "Is this a college ranking?",
    a: "No. A ranking puts every student on one list. College Value Lab models a path (a specific college, major, residency, aid package and living arrangement) and shows how the costs, risks and earnings differ between the paths you're actually considering. It never declares a winner.",
  },
  {
    q: "Where do the numbers come from?",
    a: "From federal datasets: the College Scorecard and IPEDS for costs, aid, debt, graduation and earnings; the Bureau of Labor Statistics and American Community Survey for wages and employment; BEA price parities for cost of living; Federal Student Aid for loan rates. Every figure has a footnote naming its source, year, population and method.",
  },
  {
    q: "Is the data live?",
    a: "Not yet. This release runs on seeded sample data shaped exactly like those datasets, so the product can be built and tested end to end. Every figure is marked \"Sample data\" until live data is connected.",
  },
  {
    q: "Does a higher salary mean a college is better?",
    a: "Not necessarily. Colleges enroll different students, and students who attend selective colleges may have earned more wherever they went. That's selection bias, and it's why we show correlation, never cause. The same student's outcome depends on much more than the college.",
  },
  {
    q: "How is the break-even age calculated?",
    a: "We add up after-tax earnings and subtract college costs and loan payments, year by year, for each path. The break-even point is where one path's running total passes the other's for good. It's an estimate that depends on your assumptions, not a prediction for any one person.",
  },
  {
    q: "Who is it for?",
    a: "High-school students and their families comparing real options, current college students weighing a major or how much to borrow, and counselors helping students do the same.",
  },
];

export default function HomePage() {
  const hero = heroPaths();
  const presets = pathPresets();
  const map = mapCities();
  const majors = majorsTable();
  const berkeleyEcon = getOutcome("uc-berkeley", "economics")!;

  return (
    <>
      <Nav />
      <main id="main">
        <HeroPaths pub={hero.public} priv={hero.private} />

        <section id="sticker" aria-labelledby="h-sticker" className="relative">
          <div className="mx-auto max-w-[1200px] px-4 md:px-8 xl:px-12">
            <AxisRule />
          </div>
          <NetCostStory {...netCostStory()} />
        </section>

        <section id="opportunity-cost" aria-labelledby="h-oc" className="relative">
          <div className="mx-auto max-w-[1200px] px-4 md:px-8 xl:px-12">
            <AxisRule className="mb-16 md:mb-20" />
            <SectionHeading id="h-oc" title="Two students, one decision">
              Both are 18. Student A goes to college; Student B starts working. Scroll through the years and watch the gap between them: that gap is <Concept id="opportunity-cost">opportunity cost</Concept>, and where the lines cross is break-even.
            </SectionHeading>
          </div>
          <TwoStudents {...twoStudentsDefaults()} />
        </section>

        <Section id="timeline" labelledBy="h-timeline">
          <SectionHeading id="h-timeline" title="Your Financial Timeline">
            Start at 18 and drag forward. Salary, debt, earnings and your overall position all read the same model at the age you choose. Press play to watch a whole path unfold.
          </SectionHeading>
          <div className="mt-10">
            <FinancialTimeline presets={presets} />
          </div>
        </Section>

        <Section id="what-if" labelledBy="h-whatif">
          <SectionHeading id="h-whatif" title="The What-If Lab">
            Drag, don&apos;t type. Every control re-runs the model instantly, and the note under the chart says what your last change actually did.
          </SectionHeading>
          <div className="mt-10">
            <WhatIfLab presets={presets} />
          </div>
        </Section>

        <Section id="debt" labelledBy="h-debt">
          <SectionHeading id="h-debt" title="Debt you can see">
            Every block is $1,000 you will pay back. Aid takes blocks away, a higher interest rate adds them, and repayment removes them one year at a time. What the payment means for your budget is your <Concept id="debt-burden">debt burden</Concept>.
          </SectionHeading>
          <div className="mt-10">
            <DebtStack presets={presets} />
          </div>
        </Section>

        <Section id="compare" labelledBy="h-compare">
          <SectionHeading id="h-compare" title="Put colleges side by side">
            Pick up a college and drop it on the stage. Flip a card to see its debt, jobs and break-even. The comparison gives each measure its own scale and never names a winner.
          </SectionHeading>
          <div className="mt-10">
            <CompareStage cards={compareCards()} />
          </div>
        </Section>

        <Section id="salaries" labelledBy="h-salaries">
          <SectionHeading id="h-salaries" title="Graduates do not all earn the same amount">
            A median is one point on a wide curve. Move the graduate along it (hover, drag, or use the arrow keys) to see where a salary falls, and why the <Concept id="expected-value">expected value</Concept> of a degree is a range, not a number.
          </SectionHeading>
          <div className="mt-10">
            <SalaryDistribution majors={majors} />
          </div>
        </Section>

        <Section id="futures" labelledBy="h-futures">
          <SectionHeading id="h-futures" title="1,000 Possible Futures">
            A projection is one line; a life is not. Run the same path a thousand times with different salaries, job searches, graduation times and costs, and watch the futures settle into a range.
          </SectionHeading>
          <div className="mt-10">
            <PossibleFutures presets={presets} />
          </div>
        </Section>

        <Section id="cost-of-living" labelledBy="h-col">
          <SectionHeading id="h-col" title="The same salary, a different size">
            A paycheck buys more in some cities than others: that&apos;s <Concept id="purchasing-power">purchasing power</Concept>. Hover a city (or tap it) to see the salary you&apos;d need there to live the way your salary lets you live now. All figures are <Concept id="real-income">real</Concept> 2024 dollars, so <Concept id="inflation">inflation</Concept> is already taken out.
          </SectionHeading>
          <div className="mt-10">
            <PurchasingMap {...map} />
          </div>
        </Section>

        <Section id="learn" labelledBy="h-learn">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading id="h-learn" title="Learn the Economics">
                Five short lessons you scroll through and play with. No jargon without a working example.
              </SectionHeading>
            </div>
            <div className="lg:col-span-8">
              <LearnTeaser lessons={LESSONS} />
            </div>
          </div>
        </Section>

        <Section id="sources" labelledBy="h-sources">
          <SectionHeading id="h-sources" title="Every number has a footnote">
            Source, dataset, year, population, last update and method, one tap away on every figure. Here is one opened up.
          </SectionHeading>
          <div className="mt-12">
            <Transparency specimen={{ label: "UC Berkeley Economics, median early-career earnings", value: money(berkeleyEcon.earlyCareer.value!.p50), lineage: berkeleyEcon.earlyCareer.lineage }} />
          </div>
        </Section>

        <Section id="methodology" labelledBy="h-method">
          <SectionHeading id="h-method" title="How the math works, and where it stops">
            The formulas are simple enough to check by hand. The limits matter as much as the math. Future dollars are compared using <Concept id="npv">net present value</Concept>.
          </SectionHeading>
          <div className="mt-12">
            <MethodologyCredibility />
          </div>
        </Section>

        <Section id="pricing" labelledBy="h-pricing">
          <SectionHeading id="h-pricing" title="Pricing" />
          <div className="mt-8">
            <Pricing />
          </div>
        </Section>

        <Section id="faq" labelledBy="h-faq">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading id="h-faq" title="Questions families ask" />
            </div>
            <div className="lg:col-span-8">
              <Accordion items={FAQ} />
            </div>
          </div>
        </Section>

        <section aria-labelledby="h-cta" className="relative">
          <div className="mx-auto grid max-w-[1200px] justify-items-start gap-6 px-4 pb-24 md:px-8 md:pb-32 xl:px-12">
            <AxisRule className="mb-10 w-full md:mb-14" />
            <h2 id="h-cta" className="max-w-[18ch] text-h1 font-[720]">
              Run the paths you&apos;re actually choosing between.
            </h2>
            <p className="measure text-lede text-ink-2">Pick up to five colleges, set your aid and where you&apos;ll live, and see the tradeoffs side by side.</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/get-started" size="lg">
                Get started
              </ButtonLink>
              <ButtonLink href="/compare" size="lg" variant="secondary">
                Compare Colleges
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
