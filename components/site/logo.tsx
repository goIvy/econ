import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Mark: one path rising above a quiet baseline from a shared origin. The
 * product in one glyph (a college path vs. working from 18), in the single
 * accent plus ink. Geometric on purpose: two strokes and a dot.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn("size-7 shrink-0", className)} aria-hidden>
      <path d="M5 21 H 23" fill="none" stroke="var(--rule-strong)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2.5 3" />
      <path d="M5 21 C 12 21, 14 17, 23 7" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="5" cy="21" r="2.8" fill="var(--ink)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2 rounded-full", className)} aria-label="College Value Lab home">
      <LogoMark />
      <span className="whitespace-nowrap text-[0.98rem] font-semibold tracking-[-0.02em] text-ink">College Value Lab</span>
    </Link>
  );
}
