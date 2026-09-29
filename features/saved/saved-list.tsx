"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Trash2 } from "@/components/ui/icons";
import Link from "next/link";
import { useSaved } from "@/hooks/use-saved";
import { DUR, EASE } from "@/lib/animations";

/** Saved comparisons (this browser). Empty state offers ready-made comparisons, never a blank page. */
export function SavedList({ suggestions }: { suggestions: Array<{ label: string; href: string }> }) {
  const { items, remove } = useSaved();
  return (
    <div className="grid gap-8">
      <ul className="grid gap-3">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li key={it.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -24, transition: { duration: DUR.fast, ease: EASE.exit } }} transition={{ duration: DUR.standard, ease: EASE.smooth }} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule bg-surface p-4 shadow-1">
              <Link href={it.href} className="grid min-w-0 gap-1 rounded-xs">
                <span className="text-h3 font-bold text-ink hover:underline">{it.label}</span>
                <span className="text-small text-ink-2">{it.paths.join(" · ")}</span>
                <span className="text-caption text-muted">Saved {new Date(it.savedAt).toLocaleDateString()}</span>
              </Link>
              <button type="button" onClick={() => remove(it.id)} className="flex h-10 items-center gap-2 rounded-sm px-3 text-small text-ink-2 hover:bg-surface-sunk hover:text-ink" aria-label={`Remove ${it.label}`}>
                <Trash2 className="size-4" aria-hidden /> Remove
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {items.length === 0 && (
        <div className="grid justify-items-start gap-4 rounded-lg border border-dashed border-rule-strong p-6 sm:p-8">
          <Bookmark className="size-6 text-muted" aria-hidden />
          <p className="text-h3 font-bold">No saved comparisons yet.</p>
          <p className="max-w-[52ch] text-small text-ink-2">Save any comparison from the homepage stage or the compare page. It stays in this browser; no account needed. Or start with one of these:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Link key={s.href} href={s.href} className="flex h-11 items-center rounded-full border border-rule-strong bg-surface px-4 text-small font-semibold text-ink shadow-1 hover:border-ink">
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
