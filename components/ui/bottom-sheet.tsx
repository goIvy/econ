"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "@/components/ui/icons";
import { Dialog } from "radix-ui";
import { overlay, sheet } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Phone bottom sheet (Radix Dialog underneath, so focus and Escape work).
 * Drag the handle down to dismiss. Kept to ~55% of the screen with a light
 * scrim so whatever it controls stays visible and updates live above it.
 */
export function BottomSheet({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-ink/10" variants={overlay} initial="hidden" animate="visible" exit="exit" />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                variants={sheet}
                initial="hidden"
                animate="visible"
                exit="exit"
                drag={reduce ? false : "y"}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 90 || info.velocity.y > 600) onOpenChange(false);
                }}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[55dvh] overflow-y-auto rounded-t-lg border-t border-rule bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-3"
              >
                <div className="mx-auto mb-3 h-1.5 w-12 cursor-grab rounded-full bg-rule-strong active:cursor-grabbing" aria-hidden />
                <div className="mb-3 flex items-center justify-between">
                  <Dialog.Title className="text-small font-semibold text-ink">{title}</Dialog.Title>
                  <Dialog.Close className="grid size-10 place-items-center rounded-sm text-ink-2 hover:bg-surface-sunk" aria-label="Close">
                    <X className="size-4" />
                  </Dialog.Close>
                </div>
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
