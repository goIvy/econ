"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { goTo } from "@/lib/scroll";
import { useScenario } from "@/features/scenario/store";
import { BlurWords } from "@/components/motion/blur-words";
import { StarterCard } from "./starter-card";
import { HeroSearch } from "./hero-search";

// Three.js is large: load it after first paint, only in the browser.
const HeroGallery = dynamic(() => import("./hero-gallery").then((m) => m.HeroGallery), {
  ssr: false,
  loading: () => <div aria-hidden className="size-full" />,
});

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * HERO. A paper-grid stage: a badge, a serif headline that resolves out of a
 * blur word by word, a pill search that opens the path builder with a college
 * filled in, and ThreeUI's Gallery ribbon carrying plates of real college paths.
 * As the page scrolls on, GSAP eases the ribbon back so the path builder takes
 * focus. Then BUILD: the three steps beside the starter card.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const { example, setPath, setPersonal, setActive, colleges } = useScenario();
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);

  const showExample = async () => {
    await setPath(0, example);
    setPersonal(false);
    setActive(0);
    goTo("your-path", "h2");
  };

  // Scroll-scrubbed exit (GSAP ScrollTrigger). Motivation: hand focus to the next step.
  useEffect(() => {
    if (reduce || !sectionRef.current) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !sectionRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        const st = { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: 0.6 };
        gsap.to(capRef.current, { yPercent: -10, scale: 0.94, ease: "none", scrollTrigger: st });
        // The copy only drifts (no fade) so its buttons keep full contrast while visible.
        gsap.to(copyRef.current, { yPercent: -10, ease: "none", scrollTrigger: st });
      }, sectionRef);
    })();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduce]);

  const rise = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, ease: EASE, delay: 0.55 + i * 0.1 },
  });

  return (
    <>
      <section ref={sectionRef} id="top" aria-labelledby="hero-title" className="relative p-2 sm:p-3">
        {/* A paper-grid stage: the headline and search on the left, a ribbon of college paths turning on the right. */}
        <div className="paper-grid relative isolate grid min-h-[calc(100dvh-1rem)] overflow-hidden rounded-lg shadow-[0_0_0_1px_var(--rule)] sm:min-h-[calc(100dvh-1.5rem)] sm:rounded-[36px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div ref={copyRef} className="relative z-10 grid content-center justify-items-start gap-6 px-5 pb-6 pt-[calc(var(--nav-h)+40px)] sm:px-10 lg:py-24 lg:pl-16">
            <motion.p {...rise(-3)} className="inline-flex items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3.5 text-caption text-ink-2 shadow-[0_0_0_1px_var(--rule),var(--hairline-inset)]">
              <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-on-ink">New</span>
              Costs, debt and pay for {colleges.length} colleges
            </motion.p>
            <h1 id="hero-title" className="max-w-[11ch] text-[clamp(3.25rem,7.4vw,7rem)] leading-[0.92] tracking-[-0.02em]">
              <BlurWords parts={["See what college", { em: "is really worth" }]} delay={0.15} />
            </h1>
            <motion.div {...rise(0)} className="w-full max-w-[34rem]">
              <HeroSearch />
            </motion.div>
            <motion.p {...rise(1)} className="max-w-[30rem] text-small text-ink-2">
              Search a college, pick a major, and see the true cost, likely debt, starting pay and when it pays off.
            </motion.p>
            <motion.button
              {...rise(2)}
              type="button"
              onClick={() => void showExample()}
              className="-ml-4 rounded-full px-4 py-2 text-small font-medium text-ink underline decoration-rule-strong underline-offset-[6px] transition-colors hover:decoration-ink"
            >
              See an example
            </motion.button>
          </div>

          <motion.div
            ref={capRef}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, ease: EASE, delay: 0.3 }}
            className="relative h-[26rem] w-full sm:h-[32rem] lg:h-auto"
          >
            <HeroGallery />
          </motion.div>
        </div>
      </section>

      <section id="build" aria-labelledby="build-h" className="relative scroll-mt-[calc(var(--nav-h)+16px)]">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="grid content-start gap-8 lg:sticky lg:top-[calc(var(--nav-h)+48px)] lg:self-start">
            <div className="grid gap-3">
              <h2 id="build-h" className="text-[clamp(2.6rem,5.4vw,4.5rem)] leading-[0.95]">
                Four choices. <em>No guesswork.</em>
              </h2>
              <p className="max-w-[40ch] text-lede text-ink-2">Four quick choices. Your numbers appear right below, and you can change anything later.</p>
            </div>
            <ol className="grid gap-5" aria-label="How it works">
              {[
                ["Pick", "a college, a major and whether you'd pay in-state tuition."],
                ["See", "the real cost after grants, your likely debt, starting pay and when college pays off."],
                ["Compare", "with other colleges side by side, five numbers at a time."],
              ].map(([verb, rest], i) => (
                <motion.li
                  key={verb}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
                  className="grid grid-cols-[2.5rem_1fr] items-start gap-4"
                >
                  <span className="tabular grid size-10 place-items-center rounded-full bg-surface font-mono text-small font-semibold text-ink shadow-[0_0_0_1px_var(--rule),var(--hairline-inset)]">{i + 1}</span>
                  <p className="pt-1.5 text-body text-ink-2">
                    <span className="font-semibold text-ink">{verb}</span> {rest}
                  </p>
                </motion.li>
              ))}
            </ol>
          </div>
          <StarterCard />
        </div>
      </section>
    </>
  );
}
