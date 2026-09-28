"use client";

import { motion, useInView, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useRef } from "react";
import { enter, motionSafe, revealViewport, staggerParent } from "@/lib/animations";

/**
 * Scroll reveal: useInView + motion.div with the default enter recipe.
 * Content is in the DOM and readable before it animates; only the visual
 * entrance waits for the viewport.
 */
export function Reveal({ children, delay = 0, className, as = "div", ...rest }: HTMLMotionProps<"div"> & { delay?: number; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, revealViewport);
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      ref={ref}
      variants={motionSafe(enter, reduce)}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={delay ? { delay } : undefined}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Parent that reveals its <RevealItem> children in sequence when scrolled into view. */
export function RevealGroup({ children, className, stagger = 0.06, ...rest }: HTMLMotionProps<"div"> & { stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, revealViewport);
  return (
    <motion.div ref={ref} variants={staggerParent(stagger)} initial="hidden" animate={inView ? "visible" : "hidden"} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className, ...rest }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={motionSafe(enter, reduce)} className={className} {...rest}>
      {children}
    </motion.div>
  );
}
