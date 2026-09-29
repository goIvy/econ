"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DUR, EASE, STAGGER } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

/**
 * A homepage chapter: a question-led section on the page theme. A small mono
 * index ("03") anchors each question on the left edge, so the page reads as
 * one numbered path. Heading, description and content rise in once.
 */
export function Chapter({
  id,
  index,
  title,
  lede,
  children,
  className,
  aside,
}: {
  id: string;
  index?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Optional content set beside the heading on wide screens. */
  aside?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduce = useReducedMotion();
  const show = inView || reduce;
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: show ? { opacity: 1, y: 0 } : undefined,
    transition: reduce ? { duration: 0 } : { duration: DUR.large, ease: EASE.smooth, delay },
  });
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={cn("relative isolate scroll-mt-[var(--nav-h)] overflow-x-clip", className)}>
      <div ref={ref} className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
        <div className={cn("grid gap-6", aside && "lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12")}>
          <div className="grid max-w-[56rem] gap-4">
            <motion.h2 {...rise(STAGGER.heading)} id={`${id}-h`} className="text-[clamp(2.5rem,5.2vw,4.6rem)] leading-[0.98] text-balance">
              {index && (
                <span aria-hidden className="tabular mr-3 inline-block translate-y-[-0.35em] align-middle font-mono text-[0.8125rem] font-medium tracking-[0.08em] text-accent-ink">
                  {index}
                </span>
              )}
              {title}
            </motion.h2>
            {lede && (
              <motion.div {...rise(STAGGER.description)} className="max-w-[42rem] text-lede text-ink-2 text-pretty">
                {lede}
              </motion.div>
            )}
          </div>
          {aside && <motion.div {...rise(STAGGER.description)}>{aside}</motion.div>}
        </div>
        {children && (
          <motion.div {...rise(STAGGER.chart)} className="mt-10 md:mt-14">
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
