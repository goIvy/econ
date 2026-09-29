"use client";

import { useMemo } from "react";
import { ScrubText } from "@/components/motion/scrub-text";

/**
 * STATEMENT. What the site is for, in one sentence, on a frosted glass panel
 * over a vivid backdrop: slow drifting light and a fan of possible futures
 * (decorative curves, not data). The words light up as the panel scrolls past.
 */
/** Deterministic decorative trajectories: a fan of random walks from one start point. */
function fan() {
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 46 }, (_, i) => {
    let y = 560;
    let slope = -2 - rand() * 6;
    let d = `M -20 ${y}`;
    for (let x = 40; x <= 1480; x += 60) {
      slope += (rand() - 0.52) * 2.2;
      y = Math.max(40, Math.min(760, y + slope));
      d += ` L ${x} ${y.toFixed(1)}`;
    }
    return { d, tone: i % 7 === 0 ? "var(--trace-d)" : i % 3 === 0 ? "#ffd29a" : "var(--accent)", w: rand() < 0.15 ? 1.6 : 0.8, o: 0.25 + rand() * 0.45 };
  });
}

export function Statement() {
  const curves = useMemo(() => fan(), []);

  return (
    <section aria-label="What College Value Lab does" className="relative p-2 sm:p-3">
      <div className="statement-canvas relative isolate grid min-h-[92dvh] place-items-center overflow-hidden rounded-lg px-4 py-24 sm:rounded-[36px] md:px-8">
        {/* backdrop: drifting light + the futures fan */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="drift-a absolute -left-[10%] top-[8%] size-[46rem] rounded-full bg-accent opacity-50 blur-[120px]" />
          <div className="drift-b absolute -right-[12%] bottom-[-10%] size-[40rem] rounded-full bg-[#ffd29a] opacity-30 blur-[120px]" />
          <div className="drift-c absolute bottom-[10%] left-[30%] size-[30rem] rounded-full bg-trace-d opacity-30 blur-[110px]" />
          <svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
            {curves.map((c, i) => (
              <path key={i} d={c.d} fill="none" stroke={c.tone} strokeWidth={c.w} strokeOpacity={c.o} strokeLinejoin="round" />
            ))}
          </svg>
        </div>

        {/* the glass panel */}
        <div className="relative w-full max-w-[64rem] rounded-lg bg-[color-mix(in_srgb,var(--paper)_42%,transparent)] px-6 py-14 text-center shadow-[0_0_0_1px_color-mix(in_srgb,var(--ink)_14%,transparent),inset_0_1px_0_color-mix(in_srgb,#fff_18%,transparent),0_40px_120px_-40px_rgba(0,0,0,0.6)] backdrop-blur-2xl backdrop-saturate-150 sm:px-12 md:py-20">
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">Why this exists</p>
          <ScrubText
            className="serif mx-auto max-w-[22ch] font-serif text-[clamp(2rem,4.6vw,3.9rem)] leading-[1.04] tracking-[-0.01em] text-ink"
            parts={["We turn confusing", { em: "sticker prices" }, "into honest numbers: what you'll really pay, what you'll", { em: "borrow," }, "and when college finally", { em: "pays off." }]}
          />
        </div>
      </div>
    </section>
  );
}
