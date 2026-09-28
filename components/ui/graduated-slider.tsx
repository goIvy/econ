"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Slider } from "radix-ui";
import { useId, useState } from "react";
import { pop } from "@/lib/animations";
import { cn } from "@/lib/cn";

/**
 * A slider drawn as a graduated scale: tick marks along a sunk track, fill in
 * the active trace ink, and a value flag on the thumb while dragging.
 * Min and max labels are always visible.
 */
export function GraduatedSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  ticks = 10,
  trace = "ink",
  className,
  size = "md",
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  ticks?: number;
  /** Path trace ink when the slider belongs to a path; neutral ink otherwise. */
  trace?: "a" | "b" | "c" | "d" | "e" | "ink";
  className?: string;
  description?: string;
  /** sm hides the min/max row; lg is the tactile What-If size. */
  size?: "sm" | "md" | "lg";
}) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const fill = { a: "bg-trace-a", b: "bg-trace-b", c: "bg-trace-c", d: "bg-trace-d", e: "bg-trace-e", ink: "bg-ink" }[trace];
  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-caption font-medium text-muted">
          {label}
        </label>
        <output htmlFor={id} className={cn("tabular font-semibold text-ink", size === "lg" ? "text-h3" : "text-small")}>
          {format(value)}
        </output>
      </div>
      <Slider.Root
        id={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
        className={cn("relative flex touch-none select-none items-center", size === "lg" ? "h-11" : "h-8")}
        aria-label={label}
        aria-describedby={description ? `${id}-d` : undefined}
      >
        <Slider.Track className={cn("relative grow overflow-hidden rounded-full bg-surface-sunk", size === "lg" ? "h-3" : "h-2")}>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, var(--rule-strong) 0 1px, transparent 1px calc(100% / ${ticks}))`,
              backgroundSize: "100% 100%",
            }}
          />
          <Slider.Range className={cn("absolute h-full rounded-full", fill)} />
        </Slider.Track>
        <Slider.Thumb
          aria-label={label}
          className={cn("relative block rounded-full border-2 border-on-ink bg-ink shadow-2 outline-offset-2 transition-transform hover:scale-110 active:scale-95", size === "lg" ? "size-7" : "size-5")}
          onFocus={() => setDragging(false)}
        >
          <AnimatePresence>
            {dragging && (
              <motion.span
                variants={pop}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="tabular absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xs bg-ink px-2 py-1 text-caption font-semibold text-on-ink"
              >
                {format(value)}
              </motion.span>
            )}
          </AnimatePresence>
        </Slider.Thumb>
      </Slider.Root>
      <div className={cn("flex justify-between text-[0.75rem] text-muted tabular", size === "sm" && "hidden")} aria-hidden>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
      {description && (
        <p id={`${id}-d`} className="text-caption text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
