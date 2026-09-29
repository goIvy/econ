"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export type BlurPart = string | { em: string };

/**
 * A headline whose words resolve out of a soft blur one after another.
 * `{ em }` parts are set in italic (the one idea the line is about).
 * Screen readers read the words in order; reduced motion shows them at once.
 */
export function BlurWords({ parts, delay = 0, step = 0.07 }: { parts: BlurPart[]; delay?: number; step?: number }) {
  const reduce = useReducedMotion();
  let i = 0;
  const word = (w: string, em: boolean, key: string) => {
    const d = delay + i++ * step;
    const props = {
      initial: reduce ? false : { opacity: 0, filter: "blur(14px)", y: "0.18em" },
      animate: { opacity: 1, filter: "blur(0px)", y: "0em" },
      transition: { duration: 1.1, ease: [0.32, 0.72, 0, 1] as const, delay: d },
      className: "inline-block will-change-[filter,transform]",
    };
    return em ? <motion.em key={key} {...props}>{w}</motion.em> : <motion.span key={key} {...props}>{w}</motion.span>;
  };
  const out: React.ReactNode[] = [];
  parts.forEach((p, pi) => {
    const text = typeof p === "string" ? p : p.em;
    const words = text.split(" ").filter(Boolean);
    words.forEach((w, wi) => {
      out.push(word(w, typeof p !== "string", `${pi}-${wi}`));
      out.push(" ");
    });
  });
  out.pop();
  return <>{out}</>;
}
