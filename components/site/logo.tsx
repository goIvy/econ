import Link from "next/link";
import { cn } from "@/lib/cn";

/** Mark: three paths leaving one origin (the brand metaphor). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn("size-7 shrink-0", className)} aria-hidden>
      <path d="M4 20 C 11 20, 15 16, 24 6" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M4 20 C 12 20, 16 16, 24 13" fill="none" stroke="var(--accent-2)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M4 20 C 12 20, 17 21, 24 20" fill="none" stroke="var(--highlight)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="4" cy="20" r="2.6" fill="var(--ink)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5 rounded-xs", className)} aria-label="College Value Lab home">
      <LogoMark />
      <span className="whitespace-nowrap text-[0.95rem] font-extrabold tracking-[0.06em] text-ink">COLLEGE VALUE LAB</span>
    </Link>
  );
}
