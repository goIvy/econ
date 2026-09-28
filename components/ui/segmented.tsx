"use client";

import { motion } from "framer-motion";
import { RadioGroup } from "radix-ui";
import { useId } from "react";
import { microSpring } from "@/lib/animations";
import { cn } from "@/lib/cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Optional secondary line, e.g. the tuition for that option. */
  hint?: string;
  disabled?: boolean;
}

/**
 * Segmented toggle: Resident / Non-resident, Campus / Off-campus / At home.
 * Radio-group semantics (arrow keys move the selection). The selected segment
 * is ink-filled and the indicator slides between segments.
 */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
  size = "md",
  hideLabel,
  wrap,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  className?: string;
  size?: "sm" | "md";
  hideLabel?: boolean;
  /** Let segments wrap onto a second row on narrow screens. */
  wrap?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <span id={`${id}-label`} className={cn("text-caption font-medium text-muted", hideLabel && "sr-only")}>
        {label}
      </span>
      <RadioGroup.Root
        aria-labelledby={`${id}-label`}
        value={value}
        onValueChange={(v) => onChange(v as T)}
        orientation="horizontal"
        className={cn("relative flex rounded-sm border border-rule bg-surface-sunk p-1", wrap && "flex-wrap gap-y-1")}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <RadioGroup.Item
              key={o.value}
              value={o.value}
              disabled={o.disabled}
              className={cn(
                "relative z-0 flex flex-1 flex-col items-center justify-center rounded-[7px] px-3 text-center outline-offset-1 transition-colors", wrap && "basis-[30%] md:basis-0",
                size === "md" ? "min-h-10 py-1.5" : "min-h-8 py-1",
                active ? "text-on-ink" : "text-ink-2 hover:text-ink",
                o.disabled && "opacity-40",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`${id}-indicator`}
                  className="absolute inset-0 -z-10 rounded-[7px] bg-ink shadow-1"
                  transition={microSpring}
                  aria-hidden
                />
              )}
              <span className={cn("font-semibold leading-tight", size === "md" ? "text-small" : "text-caption")}>{o.label}</span>
              {o.hint && (
                <span className={cn("tabular text-[0.75rem] leading-tight", active ? "text-on-ink/80" : "text-muted")}>{o.hint}</span>
              )}
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>
    </div>
  );
}
