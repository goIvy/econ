"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { Popover } from "radix-ui";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useId, useState } from "react";
import { collapse, pop } from "@/lib/animations";
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
          className="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-sm border border-rule-strong bg-surface px-3 text-left shadow-1 transition-colors hover:border-ink/40 data-[state=open]:border-trace-a"
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
                  className="z-50 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-rule bg-surface shadow-3"
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
                              <Check className={cn("size-4 shrink-0 text-trace-a", o.value === value ? "opacity-100" : "opacity-0")} aria-hidden />
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

/** Searchable multi-select with removable chips (onboarding steps 3–4). */
export function MultiCombobox({
  label,
  values,
  onChange,
  options,
  max,
  placeholder = "Search…",
  emptyText = "No matches.",
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: ComboOption[];
  max?: number;
  placeholder?: string;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const full = max != null && values.length >= max;
  return (
    <div className="grid gap-3">
      <Command className="overflow-hidden rounded-md border border-rule-strong bg-surface shadow-1" label={label}>
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder={full ? `You've picked ${max}. Remove one to add another.` : placeholder}
          disabled={full}
          className="h-12 w-full border-b border-rule bg-transparent px-4 text-base text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed"
          aria-label={label}
        />
        <Command.List className="max-h-64 overflow-y-auto p-1.5">
          <Command.Empty className="px-3 py-6 text-center text-small text-muted">{emptyText}</Command.Empty>
          {options.map((o) => {
            const on = values.includes(o.value);
            return (
              <Command.Item
                key={o.value}
                value={`${o.label} ${o.meta ?? ""} ${(o.keywords ?? []).join(" ")}`}
                disabled={!on && full}
                onSelect={() => onChange(on ? values.filter((v) => v !== o.value) : [...values, o.value])}
                className="flex cursor-pointer items-center gap-3 rounded-xs px-2.5 py-2 text-small text-ink data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40 data-[selected=true]:bg-surface-sunk"
              >
                <span className={cn("grid size-4 shrink-0 place-items-center rounded-[4px] border", on ? "border-ink bg-ink text-on-ink" : "border-rule-strong bg-surface")} aria-hidden>
                  {on && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{o.label}</span>
                  {o.meta && <span className="block truncate text-caption text-muted">{o.meta}</span>}
                </span>
              </Command.Item>
            );
          })}
        </Command.List>
      </Command>
      <AnimatePresence initial={false}>
        {values.length > 0 && (
          <motion.ul
            variants={collapse}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-wrap gap-2"
            aria-label={`Selected ${label.toLowerCase()}`}
          >
            <AnimatePresence initial={false}>
              {values.map((v) => {
                const o = options.find((x) => x.value === v);
                return (
                  <motion.li key={v} layout variants={pop} initial="hidden" animate="visible" exit="exit">
                    <button
                      type="button"
                      onClick={() => onChange(values.filter((x) => x !== v))}
                      className="inline-flex items-center gap-1.5 rounded-full border border-rule-strong bg-surface py-1 pl-3 pr-2 text-small font-medium text-ink hover:border-ink"
                      aria-label={`Remove ${o?.label ?? v}`}
                    >
                      {o?.label ?? v}
                      <X className="size-3.5 text-muted" aria-hidden />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
