"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Dialog } from "radix-ui";
import { BookOpen, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LIMITATIONS, METHODOLOGIES } from "@/data/methodologies";
import { overlay, pop } from "@/lib/animations";
import { cn } from "@/lib/cn";

/**
 * "How is this calculated?" The methodology modal (first-release item 14).
 * Opens on the entries relevant to where it's launched from.
 */
export function MethodologyDialog({ ids, label = "How this is calculated", className }: { ids?: string[]; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const items = ids ? METHODOLOGIES.filter((m) => ids.includes(m.id)) : METHODOLOGIES;
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={cn("inline-flex items-center gap-1.5 rounded-sm text-small font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink", className)}>
        <BookOpen className="size-4" aria-hidden />
        {label}
      </Dialog.Trigger>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-ink/35" variants={overlay} initial="hidden" animate="visible" exit="exit" />
            </Dialog.Overlay>
            <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center sm:p-6">
              <Dialog.Content asChild forceMount>
                <motion.div variants={pop} initial="hidden" animate="visible" exit="exit" className="grid max-h-[88dvh] w-full grid-rows-[auto_1fr_auto] overflow-hidden rounded-t-lg border border-rule bg-surface shadow-3 sm:max-w-[42rem] sm:rounded-lg">
                  <div className="flex items-start justify-between gap-4 border-b border-rule px-6 py-5">
                    <div>
                      <Dialog.Title className="font-display text-h3 font-[650]">How this is calculated</Dialog.Title>
                      <Dialog.Description className="mt-1 text-small text-muted">Every estimate is built from these steps. All values are in 2024 dollars.</Dialog.Description>
                    </div>
                    <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-sm text-ink-2 hover:bg-surface-sunk" aria-label="Close">
                      <X className="size-5" />
                    </Dialog.Close>
                  </div>
                  <div className="overflow-y-auto px-6 py-5">
                    <div className="grid gap-6">
                      {items.map((m) => (
                        <section key={m.id} aria-labelledby={`md-${m.id}`} className="grid gap-2">
                          <h3 id={`md-${m.id}`} className="text-[1.05rem] font-semibold">{m.title}</h3>
                          <p className="text-small font-medium text-ink">{m.simple}</p>
                          {m.formula && <pre className="whitespace-pre-wrap rounded-sm bg-surface-sunk px-3 py-2 font-sans text-small text-ink">{m.formula}</pre>}
                          {m.body.map((b) => (
                            <p key={b} className="text-small text-ink-2">{b}</p>
                          ))}
                        </section>
                      ))}
                      <section className="grid gap-2 rounded-md bg-caution-tint p-4">
                        <h3 className="text-[1.05rem] font-semibold text-ink">Limitations</h3>
                        <ul className="grid gap-1.5 text-small text-ink-2">
                          {LIMITATIONS.map((l) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </div>
                  <div className="border-t border-rule px-6 py-4">
                    <Link href="/methodology" onClick={() => setOpen(false)} className="text-small font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
                      Open the full methodology page
                    </Link>
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
