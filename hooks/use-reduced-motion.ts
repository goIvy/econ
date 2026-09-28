"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Hydration-safe reduced-motion preference. The server can't know it, so the
 * first client render matches the server (false) and React then re-renders
 * with the real value. Framer Motion's own hook reads it during hydration,
 * which makes server and client markup disagree.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(QUERY);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
