"use client";

import { Button } from "@/components/ui/button";
import { goTo } from "@/lib/scroll";

export function FinalCta() {
  return (
    <section id="final-cta" className="theme-dark relative isolate overflow-hidden bg-paper" aria-labelledby="cta-h">
      <div aria-hidden className="glow-hero pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto grid max-w-[1200px] justify-items-center gap-6 px-4 py-24 text-center md:px-8 md:py-32">
        <h2 id="cta-h" className="max-w-[14ch] text-section font-extrabold">
          See what your college is really worth.
        </h2>
        <p className="max-w-[36rem] text-lede text-ink-2">Pick a college and a major. It takes less than a minute.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => goTo("starter", "button")}>
            Start comparing
          </Button>
          <Button size="lg" variant="secondary" onClick={() => goTo("compare", "h2")}>
            Compare colleges
          </Button>
        </div>
      </div>
    </section>
  );
}
