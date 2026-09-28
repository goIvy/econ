"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PathTag, TRACE_KEYS } from "@/components/ui/lineage";
import { COMPARE_MAX, useCompareList } from "@/hooks/use-compare-list";
import { sheet } from "@/lib/animations";

/** Fixed tray listing queued colleges, with the path to /compare. */
export function CompareTray({ names }: { names: Record<string, string> }) {
  const { ids, remove, clear } = useCompareList();
  const href = `/compare?c=${ids.join(",")}`;
  return (
    <AnimatePresence>
      {ids.length > 0 && (
        <motion.aside
          variants={sheet}
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-label="Colleges to compare"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface/[0.97] shadow-3 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 py-3 md:px-8 xl:px-12">
            <p className="text-small font-semibold text-ink">
              Comparing {ids.length} of {COMPARE_MAX}
            </p>
            <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {ids.map((id, i) => (
                  <motion.li key={id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper py-1 pl-1.5 pr-1 text-small text-ink">
                      <PathTag trace={TRACE_KEYS[i]} size="sm" />
                      <span className="max-w-[10rem] truncate">{names[id] ?? id}</span>
                      <button type="button" onClick={() => remove(id)} className="grid size-6 place-items-center rounded-full text-muted hover:bg-surface-sunk hover:text-ink" aria-label={`Remove ${names[id] ?? id}`}>
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clear} className="rounded-sm px-3 py-2 text-small font-medium text-muted hover:text-ink">
                Clear
              </button>
              <ButtonLink href={href} size="sm" aria-disabled={ids.length < 2}>
                {ids.length < 2 ? "Add one more to compare" : "Compare paths"}
              </ButtonLink>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
