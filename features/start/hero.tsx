"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { goTo } from "@/lib/scroll";
import { useScenario } from "@/features/scenario/store";
import { StarterCard } from "./starter-card";

// Three.js is large: load it after first paint, only in the browser.
const GradCap = dynamic(() => import("./grad-cap").then((m) => m.GradCap), {
  ssr: false,
  loading: () => <div aria-hidden className="size-full" />,
});

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * HERO. Asymmetric split: a two-line headline, one sentence and two actions on
 * the left; the procedural graduation cap (img2threejs) on the right. As the
 * page scrolls on, GSAP scrubs the hero back (scale + fade) so the path builder
 * below takes focus. Then BUILD: the three steps beside the starter card.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const { example, setPath, setPersonal, setActive } = useScenario();
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
        gsap.to(copyRef.current, { yPercent: -10, opacity: 0.35, ease: "none", scrollTrigger: st });
      }, sectionRef);
    })();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduce]);

  const rise = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 28, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, ease: EASE, delay: 0.08 + i * 0.09 },
  });

  return (
    <>
      <section ref={sectionRef} id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden">
        <div aria-hidden className="glow-hero pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto grid min-h-[100dvh] max-w-[1200px] items-center gap-6 px-4 pb-16 pt-[calc(var(--nav-h)+40px)] md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-20 lg:pt-24">
          <div ref={copyRef} className="grid content-center gap-7">
            <motion.h1 {...rise(0)} id="hero-title" className="max-w-[13ch] text-[clamp(2.9rem,6.6vw,5.9rem)] font-semibold leading-[0.95] tracking-[-0.055em]">
              See what college is <span className="text-accent-ink">really worth.</span>
            </motion.h1>
            <motion.p {...rise(1)} className="max-w-[34rem] text-lede text-ink-2">
              Compare the true cost, debt, pay and payoff of any college and major, in about a minute.
            </motion.p>
            <motion.div {...rise(2)} className="flex flex-wrap items-center gap-3">
              <Button size="lg" trail onClick={() => goTo("starter", "button")}>
                Start comparing
              </Button>
              <Button size="lg" variant="secondary" onClick={() => void showExample()}>
                See an example
              </Button>
            </motion.div>
          </div>
          <motion.div
            ref={capRef}
            initial={reduce ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
            className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[28rem] lg:max-w-[34rem]"
          >
            <button type="button" onClick={() => setToss((n) => n + 1)} className="absolute inset-0 rounded-full" aria-label="Toss the graduation cap">
              <GradCap tossKey={toss} className="size-full" />
            </button>
          </motion.div>
        </div>
      </section>

      <section id="build" aria-labelledby="build-h" className="relative scroll-mt-[calc(var(--nav-h)+16px)]">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="grid content-start gap-8 lg:sticky lg:top-[calc(var(--nav-h)+48px)] lg:self-start">
            <div className="grid gap-3">
              <h2 id="build-h" className="text-section font-semibold">
                Build your college path
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
