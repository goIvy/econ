"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { goTo } from "@/lib/scroll";
import { useScenario } from "@/features/scenario/store";
import { BlurWords } from "@/components/motion/blur-words";
import { StarterCard } from "./starter-card";
import { HeroSearch } from "./hero-search";

// Three.js is large: load it after first paint, only in the browser.
const GradCap = dynamic(() => import("./grad-cap").then((m) => m.GradCap), {
  ssr: false,
  loading: () => <div aria-hidden className="size-full" />,
});

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * HERO. A cinematic inset stage: a badge, a serif headline that resolves out of
 * a blur word by word, a pill search that opens the path builder with a college
 * filled in, and the procedural graduation cap (img2threejs) inside glowing
 * orbit rings. As the page scrolls on, GSAP scrubs the stage back so the path
 * builder takes focus. Then BUILD: the three steps beside the starter card.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const { example, setPath, setPersonal, setActive, colleges } = useScenario();
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const [toss, setToss] = useState(0);

  const showExample = async () => {
    await setPath(0, example);
    setPersonal(false);
    setActive(0);
    goTo("your-path", "h2");
  };

  // One entrance toss, then the cap waits to be clicked.
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setToss((n) => n + 1), 900);
    return () => clearTimeout(t);
  }, [reduce]);

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
        gsap.to(capRef.current, { yPercent: -18, scale: 0.86, opacity: 0.25, ease: "none", scrollTrigger: st });
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
        {/* The cinematic canvas: an inset rounded stage, like a screen within the page. */}
        <div className="hero-canvas relative isolate flex min-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-lg sm:min-h-[calc(100dvh-1.5rem)] sm:rounded-[36px]">
          <div ref={copyRef} className="relative z-10 mx-auto grid w-full max-w-[1100px] justify-items-center gap-6 px-4 pt-[calc(var(--nav-h)+40px)] text-center md:pt-[calc(var(--nav-h)+56px)]">
            <motion.p {...rise(-3)} className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--surface)_60%,transparent)] py-1 pl-1 pr-3.5 text-caption text-ink-2 shadow-[0_0_0_1px_var(--rule)] backdrop-blur-md">
              <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-on-ink">New</span>
              Costs, debt and pay for {colleges.length} colleges
            </motion.p>
            <h1 id="hero-title" className="max-w-[12ch] text-[clamp(3.25rem,9vw,7.75rem)] leading-[0.92] tracking-[-0.02em] sm:max-w-none">
              <BlurWords parts={["See what college", { em: "is really worth" }]} delay={0.15} />
            </h1>
            <motion.div {...rise(0)} className="w-full">
              <HeroSearch />
            </motion.div>
            <motion.p {...rise(1)} className="max-w-[30rem] text-small text-ink-2">
              Search a college, pick a major, and see the true cost, likely debt, starting pay and when it pays off.
            </motion.p>
            <motion.button
              {...rise(2)}
              type="button"
              onClick={() => void showExample()}
              className="rounded-full px-4 py-2 text-small font-medium text-ink underline decoration-rule-strong underline-offset-[6px] transition-colors hover:decoration-ink"
            >
              See an example
            </motion.button>
          </div>

          {/* The cap in its orbit fills the lower stage and bleeds off the edges. */}
          <motion.div
            ref={capRef}
            initial={reduce ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: EASE, delay: 0.35 }}
            className="relative -mt-6 min-h-[22rem] w-full flex-1 lg:min-h-[26rem] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_78%,transparent)] sm:-mt-10"
          >
            <GradCap tossKey={toss} orbit className="absolute inset-0" />
            <button
              type="button"
              onClick={() => setToss((n) => n + 1)}
              className="absolute left-1/2 top-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full sm:size-64"
              aria-label="Toss the graduation cap"
            />
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
