"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { PathTag, TRACE_KEYS, type TraceKey } from "@/components/ui/lineage";
import { Button } from "@/components/ui/button";
import { enter, enterSpring, motionSafe, staggerParent } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const HOLD_MS = 2600;

/**
 * The personalized entry after onboarding: "You're comparing N possible
 * futures", the paths arrive one by one, then the page settles into the
 * comparison. Skippable; under reduced motion it waits for the button.
 */
export function FuturesIntro({ paths, onDone }: { paths: Array<{ college: string; major: string }>; onDone: () => void }) {
  const reduce = useReducedMotion();
  const item = motionSafe(enter, reduce);
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(onDone, HOLD_MS + paths.length * 120);
    return () => clearTimeout(t);
  }, [reduce, onDone, paths.length]);
  const words = ["one", "two", "three", "four", "five"];
  return (
    <motion.section
      aria-live="polite"
      aria-label="Your comparison"
      className="measured-field relative grid gap-6 overflow-hidden rounded-lg border border-rule bg-surface p-6 shadow-3 sm:p-10"
      variants={staggerParent(0.12, 0.1)}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -16, height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: -32, transition: { ...enterSpring, duration: 0.5 } }}
    >
      <motion.p variants={item} className="text-caption font-semibold text-muted">
        Built from your answers
      </motion.p>
      <motion.h2 variants={item} className="max-w-[22ch] text-h1 font-[720]">
        You&apos;re comparing {words[paths.length - 1] ?? paths.length} possible {paths.length === 1 ? "future" : "futures"}.
      </motion.h2>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {paths.map((p, i) => (
          <motion.li key={i} variants={item} className="flex items-center gap-3 rounded-md border border-rule bg-surface px-4 py-3 shadow-2">
            <PathTag trace={TRACE_KEYS[i] as TraceKey} />
            <span className="grid">
              <span className="font-semibold text-ink">{p.college}</span>
              <span className="text-caption text-ink-2">{p.major}</span>
            </span>
          </motion.li>
        ))}
      </ol>
      <motion.div variants={item}>
        <Button onClick={onDone}>Show the comparison</Button>
      </motion.div>
    </motion.section>
  );
}
