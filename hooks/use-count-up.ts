"use client";

import { animate, useReducedMotion } from "framer-motion";
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
    if (!enabled) return;
    if (reduce) {
      prev.current = target;
      setValue(target);
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

  return value;
}
