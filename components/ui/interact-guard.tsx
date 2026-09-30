"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * For embedded scenes that capture the scroll wheel (to zoom): until clicked,
 * a transparent layer lets the page scroll past; after a click the scene takes
 * input until the pointer leaves it.
 */
export function InteractGuard({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  const [active, setActive] = useState(false);
  return (
    <div className={cn("relative", className)} onMouseLeave={() => setActive(false)}>
      {children}
      {!active && (
        <button type="button" onClick={() => setActive(true)} className="group absolute inset-0 z-[1] grid place-items-end justify-items-center pb-6" aria-label={label}>
          <span className="rounded-full bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-4 py-2 text-small font-medium text-ink shadow-[0_0_0_1px_var(--rule),var(--shadow-2)] backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-0.5">
            {label}
          </span>
        </button>
      )}
    </div>
  );
}
