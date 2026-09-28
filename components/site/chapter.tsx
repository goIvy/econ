"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DUR, EASE, STAGGER } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

/**
 * A homepage chapter: a question-led section in the dark or light theme.
 * Heading, description and content enter on the shared stagger
 * (0 / 80 / 160ms), once, when scrolled into view.
 */
export function Chapter({
  id,
  theme = "light",
  eyebrow,
  title,
  lede,
  children,
  className,
  align = "left",
  glow,
}: {
  id: string;
  theme?: "light" | "dark" | "dark-2";
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
  glow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduce = useReducedMotion();
  const show = inView || reduce;
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 28 },
    animate: show ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: DUR.large, ease: EASE.smooth, delay },
  });
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className={cn("relative isolate scroll-mt-[var(--nav-h)] overflow-x-clip", theme !== "light" && "theme-dark", theme === "dark-2" && "theme-dark-2", "bg-paper", className)}
    >
      {glow && <div aria-hidden className="glow-2 pointer-events-none absolute inset-0 -z-10" />}
      <div ref={ref} className="mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-28 lg:py-36">
        <div className={cn("grid gap-5", align === "center" ? "justify-items-center text-center" : "max-w-[56rem]")}>
          {eyebrow && (
            <motion.p {...rise(STAGGER.heading)} className="text-caption font-semibold tracking-[0.18em] text-trace-a">
              {eyebrow}
            </motion.p>
          )}
          <motion.h2 {...rise(STAGGER.heading)} id={`${id}-h`} className="text-section font-extrabold">
            {title}
          </motion.h2>
          {lede && (
            <motion.div {...rise(STAGGER.description)} className={cn("text-lede text-ink-2", align === "center" ? "max-w-[46rem]" : "max-w-[42rem]")}>
              {lede}
            </motion.div>
          )}
        </div>
        {children && (
          <motion.div {...rise(STAGGER.chart)} className="mt-12 md:mt-16">
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
