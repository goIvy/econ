"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ButtonLink } from "@/components/ui/button";
import { enter, motionSafe, staggerParent } from "@/lib/animations";
import type { CollegeOption, MajorOption } from "@/services/data";
import { HeroInstrument } from "./hero-instrument";

export function Hero({ colleges, majors }: { colleges: CollegeOption[]; majors: MajorOption[] }) {
  const reduce = useReducedMotion();
  const item = motionSafe(enter, reduce);
  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
      {/* measured field + wash (gradient allowed here) */}
      <div aria-hidden className="measured-field field-fade pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="field-wash pointer-events-none absolute inset-0 -z-10" />

      <motion.div
        variants={staggerParent(0.06)}
        initial="hidden"
        animate="visible"
        className="mx-auto grid max-w-[1200px] gap-10 px-4 pb-16 pt-8 md:px-8 md:pt-10 lg:grid-cols-12 lg:gap-12 lg:pb-24 xl:px-12"
      >
        <div className="grid content-start gap-6 lg:sticky lg:top-[calc(var(--nav-h)+40px)] lg:col-span-5 lg:self-start lg:pt-6">
          <motion.h1 id="hero-title" variants={item} className="text-display font-[750] tracking-[-0.03em]">
            Understand the Real Value of College.
          </motion.h1>
          <motion.p variants={item} className="text-lede text-ink-2">
            Compare colleges, majors, tuition, debt, employment, salaries, and long-term financial outcomes using real economic data.
          </motion.p>
          <motion.div variants={item} className="flex flex-wrap gap-3">
            <ButtonLink href="/compare" size="lg">
              Compare Colleges
            </ButtonLink>
            <ButtonLink href="/simulator" size="lg" variant="secondary">
              Explore the Simulator
            </ButtonLink>
          </motion.div>
          <motion.p variants={item} className="measure border-t border-rule pt-5 text-small text-ink-2">
            A path is one college, one major, one residency, one aid package. We model the whole path, not a school&apos;s rank.
          </motion.p>
        </div>

        <motion.div variants={item} className="lg:col-span-7">
          <HeroInstrument colleges={colleges} majors={majors} />
        </motion.div>
      </motion.div>
    </section>
  );
}
