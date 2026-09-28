"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { enterSpring } from "@/lib/animations";

interface LessonLink {
  slug: string;
  title: string;
  teaser: string;
}

/** Glyph parts rest, then act out their idea when the row is hovered or focused. */
const act: Variants = { rest: {}, active: {} };

/**
 * "Learn the Economics": an editorial list of five lessons, each with a
 * tiny glyph of its visual metaphor that moves when you point at it.
 */
export function LearnTeaser({ lessons }: { lessons: readonly LessonLink[] }) {
  return (
    <ol className="grid border-t border-rule">
      {lessons.map((l, i) => (
        <li key={l.slug} className="border-b border-rule">
          <motion.div initial="rest" whileHover="active" whileFocus="active" animate="rest" variants={act}>
            <Link href={`/learn#${l.slug}`} className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 rounded-sm px-1 py-5 outline-offset-4 transition-colors hover:bg-surface sm:grid-cols-[3.5rem_1fr_7rem] sm:gap-6 sm:px-3 sm:py-6">
              <span className="tabular text-h2 font-semibold text-muted transition-colors group-hover:text-ink">{i + 1}</span>
              <span className="grid gap-1">
                <span className="text-base font-semibold text-ink sm:text-h3 sm:font-[650]">{l.title}</span>
                <span className="text-small text-ink-2">{l.teaser}</span>
              </span>
              <span className="hidden sm:block" aria-hidden>
                <Glyph i={i} />
              </span>
            </Link>
          </motion.div>
        </li>
      ))}
    </ol>
  );
}

function Glyph({ i }: { i: number }) {
  const common = { width: 112, height: 56, viewBox: "0 0 112 56", fill: "none" } as const;
  switch (i) {
    case 0: // two paths crossing
      return (
        <svg {...common}>
          <motion.path d="M4 44 C 40 44, 60 30, 108 10" stroke="var(--trace-b)" strokeWidth="2.5" variants={{ rest: { pathLength: 0.55 }, active: { pathLength: 1 } }} transition={enterSpring} />
          <motion.path d="M4 44 C 30 40, 50 20, 108 4" stroke="var(--trace-d)" strokeWidth="2.5" strokeDasharray="2 3" variants={{ rest: { pathLength: 0.55 }, active: { pathLength: 1 } }} transition={enterSpring} />
        </svg>
      );
    case 1: // branching paths
      return (
        <svg {...common}>
          <path d="M4 28 H 40" stroke="var(--ink)" strokeWidth="2.5" />
          <motion.path d="M40 28 C 60 28, 70 8, 108 8" stroke="var(--trace-a)" strokeWidth="2.5" variants={{ rest: { pathLength: 0.3 }, active: { pathLength: 1 } }} transition={enterSpring} />
          <motion.path d="M40 28 C 60 28, 70 48, 108 48" stroke="var(--trace-c)" strokeWidth="2.5" strokeDasharray="6 4" variants={{ rest: { pathLength: 0.3 }, active: { pathLength: 1 } }} transition={enterSpring} />
        </svg>
      );
    case 2: // skew: mean moves, median stays
      return (
        <svg {...common}>
          {[10, 16, 20, 24, 27, 30, 34, 38, 44, 52].map((x, k) => (
            <circle key={k} cx={x} cy={20 + ((k * 7) % 22)} r="2.5" fill="var(--ink)" fillOpacity="0.4" />
          ))}
          <line x1="28" x2="28" y1="6" y2="50" stroke="var(--ink)" strokeWidth="2" />
          <motion.line y1="6" y2="50" stroke="var(--trace-c)" strokeWidth="2" strokeDasharray="4 3" variants={{ rest: { x1: 34, x2: 34 }, active: { x1: 62, x2: 62 } }} transition={enterSpring} />
          <motion.circle cy="30" r="4" fill="var(--trace-c)" variants={{ rest: { cx: 60, opacity: 0 }, active: { cx: 104, opacity: 1 } }} transition={enterSpring} />
        </svg>
      );
    case 3: // accelerating curve
      return (
        <svg {...common}>
          <path d="M4 48 L 108 34" stroke="var(--ink-2)" strokeWidth="1.5" strokeDasharray="4 3" />
          <motion.path d="M4 48 C 50 46, 80 36, 108 6" stroke="var(--ink)" strokeWidth="2.5" variants={{ rest: { pathLength: 0.45 }, active: { pathLength: 1 } }} transition={enterSpring} />
        </svg>
      );
    default: // same salary, different sizes
      return (
        <svg {...common}>
          <motion.circle cx="22" cy="28" stroke="var(--trace-a)" strokeWidth="2" fill="var(--trace-a-tint)" variants={{ rest: { r: 16 }, active: { r: 18 } }} transition={enterSpring} />
          <motion.circle cx="60" cy="28" stroke="var(--ink)" strokeWidth="1.5" fill="none" variants={{ rest: { r: 16 }, active: { r: 14 } }} transition={enterSpring} />
          <motion.circle cx="94" cy="28" stroke="var(--ink)" strokeWidth="1.5" fill="none" variants={{ rest: { r: 16 }, active: { r: 12 } }} transition={enterSpring} />
        </svg>
      );
  }
}
