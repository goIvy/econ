"use client";

import dynamic from "next/dynamic";
import { ScrubText } from "@/components/motion/scrub-text";

// ThreeUI's Sylva living world (MIT): procedural moss, ferns, pale flowers, pollen and a landing butterfly.
const Sylva = dynamic(() => import("@designcodeio/threeui/components/SylvaLivingWorldScene").then((m) => m.SylvaLivingWorldScene), {
  ssr: false,
  loading: () => <div aria-hidden className="absolute inset-0 bg-[#4a4d44]" />,
});

/**
 * STATEMENT. What the site is for, in one sentence, on a frosted glass panel
 * over ThreeUI's Sylva living world: things growing, the way a good path does.
 * The words light up as the panel scrolls past.
 */
export function Statement() {
  return (
    <section aria-label="What College Value Lab does" className="relative p-2 sm:p-3">
      <div className="relative isolate grid min-h-[100dvh] items-end overflow-hidden rounded-lg bg-[#4a4d44] p-4 pt-[60dvh] sm:rounded-[36px] md:p-10 md:pt-10">
        {/* backdrop: the living world, growing behind the glass */}
        <div className="absolute inset-0 -z-10">
          <Sylva variant="living-green" style={{ position: "absolute", inset: 0 }} />
        </div>

        {/* the glass panel */}
        <div className="relative w-full max-w-[38rem] justify-self-start md:justify-self-end rounded-lg bg-[color-mix(in_srgb,var(--paper)_80%,transparent)] px-6 py-8 text-left shadow-[0_0_0_1px_color-mix(in_srgb,var(--ink)_14%,transparent),inset_0_1px_0_color-mix(in_srgb,#fff_18%,transparent),0_40px_120px_-40px_rgba(0,0,0,0.6)] backdrop-blur-2xl backdrop-saturate-150 sm:px-9 md:py-10">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">Why this exists</p>
          <ScrubText
            className="serif max-w-[22ch] font-serif text-[clamp(1.8rem,3.2vw,2.7rem)] leading-[1.06] tracking-[-0.01em] text-ink"
            parts={["We turn confusing", { em: "sticker prices" }, "into honest numbers: what you'll really pay, what you'll", { em: "borrow," }, "and when college finally", { em: "pays off." }]}
          />
        </div>
      </div>
    </section>
  );
}
