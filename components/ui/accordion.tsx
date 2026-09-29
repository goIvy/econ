"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Accordion as A } from "radix-ui";
import { Plus } from "@/components/ui/icons";
import { useState } from "react";
import { collapse, microSpring } from "@/lib/animations";

/** Accordion with animated height; content exits through AnimatePresence. */
export function Accordion({ items }: { items: Array<{ q: string; a: React.ReactNode }> }) {
  const [open, setOpen] = useState<string>("");
  return (
    <A.Root type="single" collapsible value={open} onValueChange={setOpen} className="border-t border-rule">
      {items.map((it, i) => {
        const v = `item-${i}`;
        const isOpen = open === v;
        return (
          <A.Item key={v} value={v} className="border-b border-rule">
            <A.Header>
              <A.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left">
                <span className="font-display text-[1.1rem] font-semibold text-ink">{it.q}</span>
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={microSpring} className="grid size-8 shrink-0 place-items-center rounded-full border border-rule-strong text-ink-2 group-hover:border-ink group-hover:text-ink">
                  <Plus className="size-4" aria-hidden />
                </motion.span>
              </A.Trigger>
            </A.Header>
            <AnimatePresence initial={false}>
              {isOpen && (
                <A.Content forceMount asChild>
                  <motion.div
                    variants={collapse}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="measure pb-6 text-body text-ink-2">{it.a}</div>
                  </motion.div>
                </A.Content>
              )}
            </AnimatePresence>
          </A.Item>
        );
      })}
    </A.Root>
  );
}
