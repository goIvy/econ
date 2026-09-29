"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { Popover } from "radix-ui";
import { Check, ChevronsUpDown } from "@/components/ui/icons";
import { useId, useState } from "react";
import { pop } from "@/lib/animations";
import { cn } from "@/lib/cn";

export interface ComboOption {
  value: string;
  label: string;
  /** Secondary text, e.g. "Berkeley, CA · Public". */
  meta?: string;
  group?: string;
  /** Extra words to match on (city, state name…). */
  keywords?: string[];
  disabled?: boolean;
}

/** Searchable single-select (college, major). Keyboard: type to filter, arrows, Enter. */
export function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches. Try a different spelling or a nearby city.",
  className,
  hideLabel,
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  options: ComboOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  hideLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const selected = options.find((o) => o.value === value);
  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <span id={`${id}-l`} className={cn("text-caption font-medium text-muted", hideLabel && "sr-only")}>
        {label}
      </span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          aria-labelledby={`${id}-l`}
          className="flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-sm border border-rule-strong bg-surface px-4 text-left shadow-[var(--hairline-inset)] transition-colors hover:border-[color-mix(in_srgb,var(--ink)_35%,transparent)] data-[state=open]:border-accent data-[state=open]:ring-4 data-[state=open]:ring-accent-soft"
        >
          <span className={cn("min-w-0 truncate text-[0.9375rem]", selected ? "font-medium text-ink" : "text-muted")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden />
        </Popover.Trigger>
        <AnimatePresence>
          {open && (
            <Popover.Portal forceMount>
              <Popover.Content
                asChild
                forceMount
                align="start"
                sideOffset={6}
                collisionPadding={12}
                // If focus already moved elsewhere (a click outside while closing), leave it there.
                onCloseAutoFocus={(e) => {
                  const a = document.activeElement;
                  if (a && a !== document.body) e.preventDefault();
                }}
              >
                <motion.div
                  aria-label={label}
                  variants={pop}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="z-[var(--z-overlay)] w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-rule bg-surface shadow-3"
                >
                  <Command loop>
                    <Command.Input
                      placeholder={searchPlaceholder}
                      className="h-11 w-full border-b border-rule bg-transparent px-3 text-[0.9375rem] text-ink outline-none placeholder:text-muted"
                    />
                    <Command.List className="max-h-72 overflow-y-auto p-1.5">
                      <Command.Empty className="px-3 py-6 text-center text-small text-muted">{emptyText}</Command.Empty>
                      {Object.entries(groupBy(options)).map(([group, opts]) => (
                        <Command.Group
                          key={group}
                          heading={group || undefined}
                          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[0.75rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted"
                        >
                          {opts.map((o) => (
                            <Command.Item
                              key={o.value}
                              value={`${o.label} ${o.meta ?? ""} ${(o.keywords ?? []).join(" ")}`}
                              disabled={o.disabled}
                              onSelect={() => {
                                onChange(o.value);
                                setOpen(false);
                              }}
                              className="flex cursor-pointer items-center gap-2 rounded-xs px-2 py-2 text-small text-ink data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40 data-[selected=true]:bg-surface-sunk"
                            >
                              <Check className={cn("size-4 shrink-0 text-accent-ink", o.value === value ? "opacity-100" : "opacity-0")} aria-hidden />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{o.label}</span>
                                {o.meta && <span className="block truncate text-caption text-muted">{o.meta}</span>}
                              </span>
                            </Command.Item>
                          ))}
                        </Command.Group>
                      ))}
                    </Command.List>
                  </Command>
                </motion.div>
              </Popover.Content>
            </Popover.Portal>
          )}
        </AnimatePresence>
      </Popover.Root>
    </div>
  );
}

function groupBy(options: ComboOption[]): Record<string, ComboOption[]> {
  const out: Record<string, ComboOption[]> = {};
  for (const o of options) (out[o.group ?? ""] ??= []).push(o);
  return out;
}
