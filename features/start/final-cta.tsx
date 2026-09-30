"use client";

import { ArrowRight } from "@/components/ui/icons";
import { LiquidCta } from "@/components/ui/liquid-cta";
import { BlurWords } from "@/components/motion/blur-words";
import { goTo } from "@/lib/scroll";

/** The closing call to action: the hero's cinematic stage again, one line, one next step. */
export function FinalCta() {
  return (
    <section id="final-cta" className="relative p-2 pb-16 sm:p-3 sm:pb-24" aria-labelledby="cta-h">
      <div className="hero-canvas relative isolate grid min-h-[80dvh] place-items-center overflow-hidden rounded-lg px-6 py-24 text-center sm:rounded-[36px]">
        <div className="grid justify-items-center gap-8">
          <h2 id="cta-h" className="max-w-[14ch] text-[clamp(3rem,8vw,7rem)] leading-[0.92] tracking-[-0.02em]">
            <BlurWords parts={["Your future,", { em: "priced honestly." }]} />
          </h2>
          <p className="max-w-[34rem] text-lede text-ink-2">Pick a college and a major. It takes less than a minute, and nothing is stored anywhere but your browser.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <LiquidCta text="Start comparing" onClick={() => goTo("starter", "button")} />
            <button type="button" onClick={() => goTo("compare", "h2")} className="group inline-flex min-h-11 items-center gap-2 rounded-full text-body font-medium text-ink-2 transition-colors hover:text-ink">
              Compare colleges
              <ArrowRight className="size-4 transition-transform duration-500 ease-[var(--ease-premium)] group-hover:translate-x-1" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
