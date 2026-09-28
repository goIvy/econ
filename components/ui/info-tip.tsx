"use client";

import { Tooltip, Popover } from "radix-ui";
import { Info } from "lucide-react";
import { useMedia } from "@/hooks/use-media";

/**
 * Plain-language explanation for a metric. Tooltip on hover/focus for
 * pointer devices; tap-to-open popover on touch, where hover doesn't exist.
 */
export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const fine = useMedia("(hover: hover) and (pointer: fine)");
  const icon = (
    <button type="button" aria-label={`What is ${label.toLowerCase()}?`} className="relative grid size-6 place-items-center rounded-full text-muted transition-colors after:absolute after:-inset-[3px] after:content-[''] hover:text-ink">
      <Info className="size-3.5" aria-hidden />
    </button>
  );
  const body = (
    <div className="z-50 max-w-[18rem] rounded-sm bg-ink px-3 py-2 text-caption leading-relaxed text-on-ink shadow-3">{children}</div>
  );
  if (fine) {
    return (
      <Tooltip.Provider delayDuration={150}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>{icon}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content sideOffset={6} collisionPadding={12} asChild>
              {body}
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{icon}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={6} collisionPadding={12} asChild>
          {body}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
