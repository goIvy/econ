import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { AxisRule, Section, SectionHeading } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { Hero } from "@/features/home/hero";
import { Tradeoffs } from "@/features/home/tradeoffs";
import { TrueCost } from "@/features/home/true-cost";
import { CareersTable } from "@/features/home/careers-table";
import { BreakEvenStudy } from "@/features/home/break-even-study";
import { SalaryDistribution } from "@/features/home/salary-distribution";
import { CostOfLiving } from "@/features/home/cost-of-living";
import { Transparency } from "@/features/home/transparency";
import { MethodologyCredibility } from "@/features/home/methodology-credibility";
import { Pricing } from "@/features/home/pricing";
import { breakEvenStudy, citiesForTranslator, majorsTable, sampleComparison, trueCost } from "@/features/home/data";
import { collegeOptions, majorOptions, getOutcome } from "@/services/data";
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
  const sample = sampleComparison();
  const cost = trueCost("ucla");
  const majors = majorsTable();
  const study = breakEvenStudy();
  const cities = citiesForTranslator();
  const berkeleyEcon = getOutcome("uc-berkeley", "economics")!;

  return (
    <>
      <Nav />
      <main id="main">
        <Hero colleges={collegeOptions()} majors={majorOptions()} />

        <Section id="compare" labelledBy="h-compare">
          <SectionHeading id="h-compare" title="Tradeoffs, not rankings">
            Three paths for the same California student. Each measure gets its own scale, so nothing collapses into a single score. Switch where Path C lives and watch what moves.
          </SectionHeading>
          <div className="mt-12">
            <Tradeoffs campus={sample.campus} cHome={sample.cHome} />
          </div>
        </Section>

        <Section id="true-cost" labelledBy="h-cost">
          <SectionHeading id="h-cost" title="See the true cost">
            Tuition is one line of seven. Residency and where you live can move the total more than the sticker price suggests.
          </SectionHeading>
          <div className="mt-12">
            <TrueCost college={cost.college} combos={cost.combos} lineage={cost.lineage} />
          </div>
        </Section>

        <Section id="careers" labelledBy="h-careers">
          <SectionHeading id="h-careers" title="Compare careers and earnings">
            A median hides half the story. Here is the range recent graduates actually earn, alongside how often they&apos;re out of work and how many go on to graduate school.
          </SectionHeading>
          <div className="mt-12">
            <CareersTable rows={majors} />
          </div>
        </Section>

        <Section id="break-even" labelledBy="h-breakeven">
          <SectionHeading id="h-breakeven" title="When does it pay off?">
            College costs tuition and four years of earnings you could have made. Cumulative value dips, then climbs. Move aid and residency to see where the lines cross.
          </SectionHeading>
          <div className="mt-12" />
          <BreakEvenStudy levels={study.levels} out={study.out} label={study.label} state={study.state} />
        </Section>

        <Section id="salaries" labelledBy="h-salaries">
          <SectionHeading id="h-salaries" title="Salaries are a range, not a promise">
            Two graduates with the same degree can earn very different amounts. Hover or use the arrow keys along the curve to see where a salary falls.
          </SectionHeading>
          <div className="mt-12">
            <SalaryDistribution majors={majors} />
          </div>
        </Section>

        <Section id="cost-of-living" labelledBy="h-col">
          <SectionHeading id="h-col" title="What is a salary worth elsewhere?">
            A bigger paycheck in an expensive city can buy less than a smaller one somewhere else. This is purchasing power, adjusted with regional price levels.
          </SectionHeading>
          <div className="mt-12">
            <CostOfLiving cities={cities} />
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
            The formulas are simple enough to check by hand. The limits matter as much as the math.
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
            <h2 id="h-cta" className="max-w-[18ch] text-h1 font-bold">
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
