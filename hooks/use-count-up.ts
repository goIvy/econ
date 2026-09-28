"use client";

import { animate } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useEffect, useRef, useState } from "react";
import { COUNT_UP_MS, easeOutExpo } from "@/lib/animations";

/**
 * Animates a number from its previous value to `target` (600ms, ease-out).
 * Under reduced motion it jumps straight to the target.
 */
export function useCountUp(target: number, opts: { from?: number; enabled?: boolean } = {}): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(opts.from ?? target);
  const prev = useRef(opts.from ?? target);
  const enabled = opts.enabled ?? true;

  useEffect(() => {
    if (!enabled || reduce) {
      prev.current = target;
      return;
    }
    const controls = animate(prev.current, target, {
      duration: COUNT_UP_MS / 1000,
      ease: easeOutExpo,
      onUpdate: (v) => setValue(v),
    });
    prev.current = target;
    return () => controls.stop();
  }, [target, reduce, enabled]);

  // Under reduced motion (or before enabling) show the target directly: no animation, no extra render.
  if (reduce || !enabled) return target;
  return value;
}
