"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { PathTag } from "@/components/ui/lineage";
import { microSpring } from "@/lib/animations";
import { cn } from "@/lib/cn";
import type { PathPreset } from "./data";

/** Radio group of the shared path presets, each wearing its path letter. */
export function PathPicker({ presets, value, onChange, label = "Path" }: { presets: PathPreset[]; value: PathPreset["key"]; onChange: (k: PathPreset["key"]) => void; label?: string }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {presets.map((p) => {
        const on = p.key === value;
        return (
          <button
            key={p.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(p.key)}
            className={cn("relative flex min-h-11 items-center gap-2 rounded-full border px-3 py-1.5 text-left text-small transition-colors", on ? "border-ink text-ink" : "border-rule bg-surface text-ink-2 hover:border-rule-strong hover:text-ink")}
          >
            {on && <motion.span layoutId={`${id}-on`} transition={microSpring} className="absolute inset-0 rounded-full bg-surface shadow-2 ring-1 ring-ink" aria-hidden />}
            <PathTag trace={p.key} size="sm" className="relative" />
            <span className="relative grid leading-tight">
              <span className="font-semibold">{p.ctx.college.shortName}</span>
              <span className="text-caption text-muted">{p.ctx.major.name}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
