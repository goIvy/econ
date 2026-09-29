"use client";

import { motion, useInView } from "framer-motion";
import { useMeasuredWidth } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { linear, linePath } from "@/components/charts/scale";
import { DUR, EASE, enter, motionSafe, staggerParent } from "@/lib/animations";
import { goTo } from "@/lib/scroll";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { HORIZON, PATH_DASH, PATH_VAR, useScenario } from "@/features/scenario/store";
import { StarterCard } from "./starter-card";

/**
 * HERO. One headline, one sentence, two actions, and the starter card: the
 * clearest thing on the page. The possible futures draw themselves faintly
 * behind it; they support the message instead of competing with it.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const item = motionSafe(enter, reduce);
  const { example, setPath, setPersonal, setActive } = useScenario();

  const showExample = async () => {
    await setPath(0, example);
    setPersonal(false);
    setActive(0);
    goTo("your-path", "h2");
  };

  return (
    <section id="start" aria-labelledby="hero-title" className="theme-dark relative isolate overflow-hidden bg-paper">
      <div aria-hidden className="glow-hero pointer-events-none absolute inset-0 -z-20" />
      <BackgroundPaths />
      <div className="mx-auto grid min-h-[100svh] max-w-[1200px] items-center gap-10 px-4 pb-16 pt-[calc(var(--nav-h)+32px)] md:px-8 lg:grid-cols-[1.1fr_minmax(0,460px)] lg:gap-16 lg:pb-24">
        <motion.div variants={staggerParent(0.08)} initial="hidden" animate="visible" className="grid content-center gap-6">
          <motion.h1 id="hero-title" variants={item} className="max-w-[12ch] text-[clamp(2.75rem,6.4vw,5.75rem)] font-extrabold leading-[0.95] tracking-[-0.045em]">
            See what college is really worth.
          </motion.h1>
          <motion.p variants={item} className="max-w-[36rem] text-lede text-ink-2">
            Compare the true cost, debt, job outcomes, salary and long-term financial impact of different colleges and majors.
          </motion.p>
          <motion.div variants={item} className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => goTo("starter", "button")}>
              Start comparing
            </Button>
            <Button size="lg" variant="secondary" onClick={() => void showExample()}>
              See an example
            </Button>
          </motion.div>
          <motion.ol variants={item} aria-label="How it works" className="mt-4 grid max-w-[36rem] gap-3 border-t border-rule pt-6 sm:grid-cols-3">
            {[
              ["Pick", "a college, a major and residency"],
              ["See", "cost, debt, pay and when it pays off"],
              ["Compare", "with other colleges side by side"],
            ].map(([verb, rest], i) => (
              <li key={verb} className="flex gap-3 sm:grid sm:gap-1.5">
                <span className="tabular grid size-7 shrink-0 place-items-center rounded-full border border-rule-strong text-caption font-bold text-ink">{i + 1}</span>
                <span className="text-small text-ink-2">
                  <span className="font-semibold text-ink">{verb}</span> {rest}
                </span>
              </li>
            ))}
          </motion.ol>
        </motion.div>
        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.large, ease: EASE.smooth, delay: 0.25 }}>
          <StarterCard />
        </motion.div>
      </div>
    </section>
  );
}

/** Faint futures from 18 to 40 along the bottom of the hero. Decorative. */
function BackgroundPaths() {
  const { futures, baselineSeries } = useScenario();
  const reduce = useReducedMotion();
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(1400);
  const inView = useInView(ref, { once: true });
  const H = 320;
  const all = [...futures.flatMap((f) => f.series), ...baselineSeries];
  const x = linear([18, HORIZON], [0, W]);
  const y = linear([Math.min(0, ...all) * 1.2, Math.max(...all) * 1.05], [H - 10, 20]);
  const d = (s: number[]) => linePath(s.map((v, i) => [x(18 + i), y(v)]));
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 opacity-60 [mask-image:linear-gradient(to_top,#000_20%,transparent)]">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full">
        <path d={d(baselineSeries)} fill="none" stroke="var(--trace-c)" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.6} />
        {futures.map((f) => (
          <motion.path
            key={f.index}
            d={d(f.series)}
            fill="none"
            stroke={PATH_VAR[f.index]}
            strokeWidth={2}
            strokeDasharray={PATH_DASH[f.index]}
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: inView || reduce ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 2.2, ease: EASE.smooth, delay: 0.4 + f.index * 0.2 }}
          />
        ))}
      </svg>
    </div>
  );
}
