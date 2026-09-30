import { Nav, type SpySection } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Chapter } from "@/components/site/chapter";
import { ScrubText } from "@/components/motion/scrub-text";
import { ButtonLink } from "@/components/ui/button";
import { ScenarioProvider } from "@/features/scenario/store";
import { scenarioSeed } from "@/features/scenario/data";
import { Hero } from "@/features/start/hero";
import { FinalCta } from "@/features/start/final-cta";
import { Statement } from "@/features/start/statement";
import { PopularPaths } from "@/features/start/popular-paths";
import { GlobeSection } from "@/features/start/globe-section";
import { Wordmark } from "@/features/start/wordmark";
import { GrowthSection } from "@/features/start/growth-section";
import { PredictiveArcTile } from "@/features/start/predictive-arc-tile";
import { IntroSplash } from "@/features/start/intro-splash";
import { Results } from "@/features/results/results";
import { Compare } from "@/features/results/compare";
import { StickySummary } from "@/features/results/sticky-summary";
import { Transparency } from "@/features/results/transparency";
import { TrueCost } from "@/features/chapters/true-cost";
import { BreakEvenExplorer } from "@/features/chapters/break-even-explorer";
import { FuturesSim } from "@/features/chapters/futures-sim";
import { Lessons } from "@/features/chapters/lessons";
import { WhatIfLab } from "@/features/chapters/what-if-lab";
import { Pipeline } from "@/features/chapters/pipeline";
import { lessonInputs } from "@/features/chapters/data";

const SECTIONS: SpySection[] = [
  { id: "your-path", label: "Your path" },
  { id: "compare", label: "Compare" },
  { id: "true-cost", label: "Cost" },
  { id: "break-even", label: "Payoff" },
  { id: "futures", label: "Possible futures" },
  { id: "learn", label: "Learn" },
  { id: "data", label: "Data" },
];

function Advanced() {
  return (
    <div className="grid gap-12">
      <AdvancedBlock title="Change the assumptions" text="Scholarships, pay, rent, family help, interest rate, time to graduate, raises and inflation. Let go of a control to see exactly what changed.">
        <WhatIfLab />
      </AdvancedBlock>
      <AdvancedBlock title="How every number is made" text="The whole model as one chain. Pick a step to see its formula, sources and value for your path.">
        <Pipeline />
      </AdvancedBlock>
    </div>
  );
}

function AdvancedBlock({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5">
      <div className="grid gap-1">
        <h3 className="text-h3 font-bold text-ink">{title}</h3>
        <p className="max-w-[44rem] text-small text-ink-2">{text}</p>
      </div>
      {children}
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <IntroSplash />
      <Nav overlay sections={SECTIONS} />
      <ScenarioProvider seed={scenarioSeed()}>
        <main id="main">
          <Hero />
          <Results advanced={<Advanced />} />

          <Chapter id="compare" index="02" title={<>How does another college <em>stack up?</em></>} lede="Add a college to see it next to yours. Five numbers first; open more when you want them.">
            <Compare />
          </Chapter>

          <GlobeSection />
          <PopularPaths />
          <Statement />

          <Chapter id="true-cost" index="03" title={<>What will college <em>actually cost</em> you?</>} lede="Sticker price can be very different from what you ultimately pay.">
            <TrueCost />
          </Chapter>

          <Chapter
            id="break-even"
            index="04"
            title={<>When does college <em>pay for itself?</em></>}
            lede={<ScrubText className="text-[clamp(1.3rem,2.3vw,1.85rem)] font-medium leading-[1.35] tracking-[-0.02em] text-ink" text="While you're in school, someone who starts working at 18 is already earning. College pays for itself once your higher pay makes up for that head start and the cost." />}
          >
            <BreakEvenExplorer />
          </Chapter>

          <GrowthSection />

          <Chapter id="futures" index="05" aside={<PredictiveArcTile />} title={<>There isn&apos;t just one <em>possible future.</em></>} lede="We simulate many possible outcomes by changing things like salary, graduation timing, time to find a job and living costs.">
            <FuturesSim />
          </Chapter>

          <Chapter
            id="learn"
            index="06"
            title={<>The ideas behind <em>every number.</em></>}
            lede="Short experiments you can play with. No textbook required."
            aside={
              <ButtonLink href="/learn" variant="secondary" trail>
                See all lessons
              </ButtonLink>
            }
          >
            <Lessons data={lessonInputs()} only={["opportunity", "debt", "purchasing"]} />
          </Chapter>

          <Chapter id="data" index="07" title={<>Where do these numbers <em>come from?</em></>} lede="Every figure is labeled with what kind of number it is and where it came from.">
            <Transparency />
          </Chapter>

          <FinalCta />
          <Wordmark />
        </main>
        <StickySummary />
      </ScenarioProvider>
      <Footer />
    </>
  );
}
