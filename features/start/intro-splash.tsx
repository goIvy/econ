"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
// Vendored ThreeUI adapter; ThreeUIIntro is what <TextAnimationCollection variant="threeui-intro" /> renders.
import { ThreeUIIntro } from "@/features/threeui/vendor/neuform-isolated-effects.js";

const KEY = "cvl-intro-seen";
/** The authored beat: 1.7s assemble + 1.1s hold. */
const DURATION = 2900;

/**
 * A one-time opening: ThreeUI's chromatic wordmark intro, assembling
 * "Value Lab" with our mark, once per browser session. Skippable (button,
 * click or Escape) and never shown under reduced motion.
 */
export function IntroSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
      sessionStorage.setItem(KEY, "1");
    } catch {}
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Reading a browser-only value after mount is the documented way to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
    const t = setTimeout(() => setShow(false), DURATION);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShow(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[calc(var(--z-overlay)+5)] bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } }}
          onClick={() => setShow(false)}
        >
          <div aria-hidden className="absolute inset-0">
            <ThreeUIIntro mode="dark" hue={0} saturation={1} brightness={1} />
          </div>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="absolute bottom-6 right-6 rounded-full px-4 py-2 text-small font-medium text-white/80 ring-1 ring-white/25 transition-colors hover:bg-white/10 hover:text-white"
          >
            Skip intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
