/**
 * Every motion variant in the app lives here (design-system/MASTER.md §6).
 * Components never define transitions inline; they import from this file.
 *
 * Reduced motion: call `motionSafe(variants, reduce)` or use the hooks in
 * `hooks/use-motion.ts`. Under reduced motion, elements render in their final
 * state and at most crossfade opacity for 150ms.
 */
import type { Transition, Variants } from "framer-motion";

/** Jakub Krehel's default enter spring. */
export const enterSpring: Transition = { type: "spring", duration: 0.45, bounce: 0 };
/** Quick spring for micro-interactions (hover, tap, toggles). */
export const microSpring: Transition = { type: "spring", duration: 0.3, bounce: 0 };
/** Exponential ease-out for count-ups and line draws. */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

/** Default enter recipe: opacity + 8px rise + 4px blur, spring 0.45 / bounce 0. */
export const enter: Variants = {
  hidden: { opacity: 0, translateY: 8, filter: "blur(4px)" },
  visible: { opacity: 1, translateY: 0, filter: "blur(0px)", transition: enterSpring },
  exit: { opacity: 0, translateY: -4, filter: "blur(2px)", transition: { duration: 0.18 } },
};

/** Parent that staggers its `enter` children (hero: 0.06s). */
export const staggerParent = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
});

/** Lists stagger at 0.04s, capped so long lists don't trail on for seconds. */
export const listItem = (index: number): Variants => ({
  hidden: enter.hidden,
  visible: {
    ...(enter.visible as object),
    transition: { ...enterSpring, delay: Math.min(index, 8) * 0.04 },
  },
  exit: enter.exit,
});

/** Crossfade used for swapping content in place (tabs, results). */
export const crossfade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

/** Bottom sheet (mobile filters, source footnotes). */
export const sheet: Variants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { type: "spring", duration: 0.4, bounce: 0 } },
  exit: { y: "100%", transition: { duration: 0.22, ease: easeOutExpo } },
};

/** Popover / dropdown. */
export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.97, translateY: -4, filter: "blur(2px)" },
  visible: { opacity: 1, scale: 1, translateY: 0, filter: "blur(0px)", transition: microSpring },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.12 } },
};

/** Micro-interactions. */
export const buttonHover = { y: -1 };
export const buttonTap = { scale: 0.98 };
export const cardHover = { y: -2, boxShadow: "var(--shadow-2)" };

/** SVG trace draw (pathLength 0 → 1). */
export const traceDraw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delay: number = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.9, ease: easeOutExpo, delay },
      opacity: { duration: 0.15, delay },
    },
  }),
};

/** Break-even marker settles in last. */
export const markerSettle: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: (delay: number = 0.9) => ({
    opacity: 1,
    scale: 1,
    transition: { type: "spring", duration: 0.5, bounce: 0.15, delay },
  }),
};

/** Count-up duration for readouts (ms). */
export const COUNT_UP_MS = 600;

/** Scroll-reveal viewport options for useInView. */
export const revealViewport = { once: true, margin: "0px 0px -10% 0px" } as const;

/** Reduced-motion variant: final state, opacity-only crossfade ≤150ms. */
export const reducedEnter: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

/** Pick the reduced variant when the user prefers reduced motion. */
export function motionSafe(variants: Variants, reduce: boolean | null): Variants {
  return reduce ? reducedEnter : variants;
}
