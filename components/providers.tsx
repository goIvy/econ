"use client";

import { MotionConfig } from "framer-motion";

/**
 * reducedMotion="user": Framer Motion honors prefers-reduced-motion globally
 * (transform and layout animations are disabled). Components additionally swap
 * to opacity-only variants via lib/animations.ts › motionSafe.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
