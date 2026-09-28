import Link from "next/link";
import { cn } from "@/lib/cn";

/** Mark: a calibrated plate with a rising trace crossing its baseline. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn("size-7 shrink-0", className)} aria-hidden>
      <rect width="28" height="28" rx="7" fill="var(--ink)" />
      {[7, 11, 15, 19, 23].map((x) => (
        <line key={x} x1={x} x2={x} y1="21" y2={x === 15 ? 18 : 19.5} stroke="var(--on-ink)" strokeOpacity="0.45" strokeWidth="1" />
      ))}
      <line x1="4" x2="24" y1="21" y2="21" stroke="var(--on-ink)" strokeOpacity="0.45" strokeWidth="1" />
      <path d="M5 17.5 L10 18.5 L14.5 14 L19 11 L23.5 6.5" fill="none" stroke="var(--trace-b)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 17.5 L10 18.5 L14.5 14 L19 11 L23.5 6.5" fill="none" stroke="var(--on-ink)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="23.5" cy="6.5" r="2" fill="var(--on-ink)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5 rounded-xs", className)} aria-label="College Value Lab home">
      <LogoMark />
      <span className="whitespace-nowrap font-display text-[1.05rem] font-bold tracking-[-0.015em] text-ink">College Value Lab</span>
    </Link>
  );
}
