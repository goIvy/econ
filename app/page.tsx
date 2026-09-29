import { Nav, type SpySection } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Chapter } from "@/components/site/chapter";
import { ButtonLink } from "@/components/ui/button";
import { ScenarioProvider } from "@/features/scenario/store";
import { scenarioSeed } from "@/features/scenario/data";
import { Hero } from "@/features/start/hero";
import { FinalCta } from "@/features/start/final-cta";
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
      <Nav overlay sections={SECTIONS} />
      <ScenarioProvider seed={scenarioSeed()}>
        <main id="main">
          <Hero />
          <Results advanced={<Advanced />} />

          <Chapter id="compare" eyebrow="COMPARE" title="How does another college stack up?" lede="Add a college to see it next to yours. Five numbers first; open more when you want them.">
            <Compare />
          </Chapter>

          <Chapter id="true-cost" theme="dark" eyebrow="COST" title="What will college actually cost you?" lede="Sticker price can be very different from what you ultimately pay.">
            <TrueCost />
          </Chapter>

          <Chapter id="break-even" theme="dark-2" eyebrow="PAYOFF" title="When does college pay for itself?" lede="While you're in school, someone who starts working at 18 is already earning. College pays for itself once your higher pay makes up for that head start and the cost.">
            <BreakEvenExplorer />
          </Chapter>

          <Chapter id="futures" theme="dark" eyebrow="POSSIBLE FUTURES" title="There isn't just one possible future." lede="We simulate many possible outcomes by changing things like salary, graduation timing, time to find a job and living costs.">
            <FuturesSim />
          </Chapter>

          <Chapter id="learn" eyebrow="LEARN THE ECONOMICS" title="The ideas behind every number." lede="Short experiments you can play with. No textbook required.">
            <Lessons data={lessonInputs()} only={["opportunity", "debt", "purchasing"]} />
            <div className="mt-6">
              <ButtonLink href="/learn" variant="secondary">
                See all lessons
              </ButtonLink>
            </div>
          </Chapter>

          <Chapter id="data" eyebrow="DATA" title="Where do these numbers come from?" lede="Every figure is labeled with what kind of number it is and where it came from.">
            <Transparency />
          </Chapter>

          <FinalCta />
        </main>
        <StickySummary />
      </ScenarioProvider>
      <Footer />
    </>
  );
}
