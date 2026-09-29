"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import type { BlurPart } from "./blur-words";

/**
 * A sentence that lights up word by word as it scrolls through the viewport
 * (GSAP ScrollTrigger, scrubbed). Screen readers get the plain sentence;
 * under reduced motion every word is simply shown at full strength.
 */
export function ScrubText({ text, parts, className }: { text?: string; parts?: BlurPart[]; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  // Plain text, or parts where { em } words are set in italic.
  const segs: Array<{ w: string; em: boolean }> = (parts ?? [text ?? ""]).flatMap((p) =>
    (typeof p === "string" ? p : p.em)
      .split(" ")
      .filter(Boolean)
      .map((w) => ({ w, em: typeof p !== "string" })),
  );
  const plain = segs.map((x) => x.w).join(" ");

  useEffect(() => {
    if (reduce || !ref.current) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-w]",
          // 0.62 keeps unread words at AA contrast (4.5:1) in both themes; the reveal lifts them to full ink.
          { opacity: 0.62 },
          { opacity: 1, ease: "none", stagger: 0.12, scrollTrigger: { trigger: ref.current, start: "top 85%", end: "bottom 45%", scrub: 0.5 } },
        );
      }, ref);
    })();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduce]);

  return (
    <p ref={ref} className={cn("text-pretty", className)}>
      <span className="sr-only">{plain}</span>
      <span aria-hidden>
        {segs.map(({ w, em }, i) => (
          <span key={i}>
            {em ? (
              <em data-w className="inline-block">
                {w}
              </em>
            ) : (
              <span data-w className="inline-block">
                {w}
              </span>
            )}
            {i < segs.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </p>
  );
}
