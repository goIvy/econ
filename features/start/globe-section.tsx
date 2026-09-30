"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { LiquidCta } from "@/components/ui/liquid-cta";
import { InteractGuard } from "@/components/ui/interact-guard";
import { useScenario } from "@/features/scenario/store";

const CollegeGlobe = dynamic(() => import("@/features/threeui/college-globe").then((m) => m.CollegeGlobe), {
  ssr: false,
  loading: () => <div aria-hidden className="absolute inset-0 bg-[#f3f5f8]" />,
});

/**
 * EVERY COLLEGE IS A PATH. ThreeUI's typographic globe, its continents written
 * in our own sentence, beside the way into Explore. Drag to spin, scroll to
 * zoom, click to drop a pin.
 */
export function GlobeSection() {
  const { colleges } = useScenario();
  const router = useRouter();
  return (
    <section id="every-path" aria-labelledby="every-path-h" className="relative scroll-mt-[var(--nav-h)]">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div className="grid content-start justify-items-start gap-6">
          <h2 id="every-path-h" className="text-[clamp(2.6rem,5.6vw,4.8rem)] leading-[0.95]">
            Every college is <em>a path.</em>
          </h2>
          <p className="max-w-[34rem] text-lede text-ink-2">
            {colleges.length} colleges across the country, each with its own cost, debt and payoff. Search them by name, city or state, filter by price, and add any to your comparison.
          </p>
          <LiquidCta text="Explore colleges" onClick={() => router.push("/explore")} />
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Click the globe, then drag to spin, scroll to zoom and click to drop a pin</p>
        </div>
        <InteractGuard label="Click to spin the globe" className="aspect-square w-full overflow-hidden rounded-lg bg-[#f3f5f8] shadow-[0_0_0_1px_var(--rule),var(--hairline-inset)] sm:rounded-[36px]">
          <CollegeGlobe mode="light" style={{ position: "absolute", inset: 0 }} />
        </InteractGuard>
      </div>
    </section>
  );
}
