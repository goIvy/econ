"use client";

import { ArrowRight } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { goTo } from "@/lib/scroll";

/** The closing call to action: one inverted card, one question, one next step. */
export function FinalCta() {
  return (
    <section id="final-cta" className="relative px-4 pb-24 pt-8 md:px-8 md:pb-32" aria-labelledby="cta-h">
      <div className="bezel mx-auto max-w-[1200px]">
        <div className="relative isolate grid gap-8 overflow-hidden rounded-md bg-ink px-6 py-16 text-on-ink sm:px-12 md:grid-cols-[1fr_auto] md:items-end md:py-20">
          <div aria-hidden className="pointer-events-none absolute -right-32 -top-40 -z-10 size-[34rem] rounded-full bg-accent opacity-30 blur-[110px]" />
          <div className="grid gap-4">
            <h2 id="cta-h" className="max-w-[14ch] text-on-ink text-[clamp(2.4rem,5.4vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-balance">
              See what your college is really worth.
            </h2>
            <p className="max-w-[36rem] text-lede opacity-75">Pick a college and a major. It takes less than a minute.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button size="lg" trail className="justify-between pl-6" onClick={() => goTo("starter", "button")}>
              Start comparing
            </Button>
            <button type="button" onClick={() => goTo("compare", "h2")} className="group inline-flex min-h-11 items-center gap-2 rounded-full text-body font-medium text-on-ink/80 transition-colors hover:text-on-ink">
              Compare colleges
              <ArrowRight className="size-4 transition-transform duration-500 ease-[var(--ease-premium)] group-hover:translate-x-1" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
