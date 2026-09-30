"use client";

import dynamic from "next/dynamic";
import { ArrowRight } from "@/components/ui/icons";
import { goTo } from "@/lib/scroll";

// ThreeUI's generative tree (MIT): a painterly tree that grows from sienna to golden tips,
// sways with the pointer and sheds soft motes. Configured usage, unchanged.
const ElementsCollection = dynamic(() => import("@designcodeio/threeui/components/ElementsCollection").then((m) => m.ElementsCollection), {
  ssr: false,
  loading: () => <div aria-hidden className="absolute inset-0 bg-[#0a0a0a]" />,
});

const LEVERS: Array<{ n: string; title: string; text: string; go: () => void; cta: string }> = [
  { n: "01", title: "Plant for less", text: "Every dollar of net cost you avoid is a dollar that starts growing sooner. Grants and in-state tuition matter most.", go: () => goTo("true-cost", "h2"), cta: "See the real cost" },
  { n: "02", title: "Keep the roots light", text: "Debt grows too, just in the wrong direction. Less borrowing means more of your pay goes into your own future.", go: () => goTo("your-path", "h2"), cta: "Check your debt" },
  { n: "03", title: "Grow faster", text: "Majors and colleges differ in how quickly pay rises. The sooner a path pays for itself, the longer it has to grow.", go: () => goTo("break-even", "h2"), cta: "See when it pays off" },
];

/**
 * GROWTH. College as something you plant: the generative tree beside three
 * levers that make a path grow more for what it costs, each linking to the
 * part of the page that shows it for your own path.
 */
export function GrowthSection() {
  return (
    <section id="growth" aria-labelledby="growth-h" className="relative scroll-mt-[var(--nav-h)]">
      <div className="mx-auto grid max-w-[1200px] items-stretch gap-8 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="relative min-h-[26rem] overflow-hidden rounded-lg bg-[#0a0a0a] shadow-[0_0_0_1px_var(--rule)] sm:min-h-[34rem] sm:rounded-[36px]">
          <ElementsCollection
            variant="generative-tree"
            speed={1}
            size={1}
            particleAmount={1}
            hue={0}
            saturation={1}
            brightness={1}
            opacity={1}
            style={{ position: "absolute", inset: 0 }}
          />
          <p className="pointer-events-none absolute bottom-5 left-6 font-mono text-[11px] uppercase tracking-[0.1em] text-white/60">Move your pointer to make it sway</p>
        </div>
        <div className="grid content-center gap-8">
          <div className="grid gap-4">
            <h2 id="growth-h" className="text-[clamp(2.6rem,5.4vw,4.6rem)] leading-[0.95]">
              College is a <em>growth</em> decision.
            </h2>
            <p className="max-w-[34rem] text-lede text-ink-2">The best path isn&apos;t the most famous one. It&apos;s the one that grows the most for what it costs you. Three levers decide that.</p>
          </div>
          <ol className="grid border-t border-rule">
            {LEVERS.map((l) => (
              <li key={l.n} className="grid gap-2 border-b border-rule py-5 sm:grid-cols-[2.5rem_1fr_auto] sm:items-baseline sm:gap-4">
                <span className="tabular font-mono text-[11px] text-accent-ink">{l.n}</span>
                <div className="grid gap-1">
                  <h3 className="text-body font-semibold text-ink">{l.title}</h3>
                  <p className="text-small text-ink-2">{l.text}</p>
                </div>
                <button type="button" onClick={l.go} className="group inline-flex min-h-11 items-center gap-1.5 justify-self-start rounded-full text-small font-medium text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink sm:justify-self-end">
                  {l.cta}
                  <ArrowRight className="size-3.5 transition-transform duration-500 ease-[var(--ease-premium)] group-hover:translate-x-0.5" aria-hidden />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
