"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { buttonHover, buttonTap, microSpring } from "@/lib/animations";
import { cn } from "@/lib/cn";
import { useMagnetic } from "@/components/motion";
import { ArrowUpRight } from "@/components/ui/icons";

type Variant = "primary" | "secondary" | "tertiary" | "quiet";
type Size = "md" | "lg" | "sm";

/*
 * Buttons are full pills (the shape rule: every control is a pill).
 * Primary is a bright ink pill (white on the dark default) and means
 * "continue / calculate / compare / run". `trail` nests an arrow in its own circle that nudges
 * up-right on hover (button-in-button).
 */
const base =
  "group/btn inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans font-semibold transition-[background-color,color,box-shadow,filter] duration-300 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-on-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_12px_30px_-14px_color-mix(in_srgb,var(--ink)_55%,transparent)] hover:bg-ink-hover",
  secondary: "bg-surface text-ink ring-1 ring-rule-strong shadow-1 hover:ring-[color-mix(in_srgb,var(--ink)_35%,transparent)]",
  tertiary: "rounded-xs text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink",
  quiet: "text-ink-2 hover:bg-surface-sunk hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-small",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-[3.25rem] px-6 text-base",
};
const trailPad: Record<Size, string> = { sm: "pr-1.5", md: "pr-1.5", lg: "pr-2" };
const trailDot: Record<Size, string> = { sm: "size-7", md: "size-8", lg: "size-9" };

function Trail({ size, variant }: { size: Size; variant: Variant }) {
  return (
    <span
      aria-hidden
      className={cn(
        "ml-1 grid shrink-0 place-items-center rounded-full transition-transform duration-500 ease-[var(--ease-premium)] group-hover/btn:-translate-y-px group-hover/btn:translate-x-0.5 group-hover/btn:scale-105",
        trailDot[size],
        variant === "primary" ? "bg-on-ink text-ink" : "bg-surface-sunk",
      )}
    >
      <ArrowUpRight className="size-4" />
    </span>
  );
}

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
  /** Nest a trailing arrow in its own circle (primary actions that move you forward). */
  trail?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, trail, children, ...props },
  ref,
) {
  const lift = variant === "primary" || variant === "secondary";
  return (
    <motion.button
      ref={ref}
      whileHover={lift && !props.disabled ? buttonHover : undefined}
      whileTap={!props.disabled ? buttonTap : undefined}
      transition={microSpring}
      className={cn(base, variants[variant], variant !== "tertiary" && sizes[size], trail && trailPad[size], className)}
      {...props}
    >
      <>
        {children as React.ReactNode}
        {trail && <Trail size={size} variant={variant} />}
      </>
    </motion.button>
  );
});

const MotionLink = motion.create(Link);

export interface ButtonLinkProps extends Omit<React.ComponentProps<typeof MotionLink>, "ref"> {
  variant?: Variant;
  size?: Size;
  trail?: boolean;
}

export function ButtonLink({ variant = "primary", size = "md", className, style, trail, children, ...props }: ButtonLinkProps) {
  const lift = variant === "primary" || variant === "secondary";
  // Primary calls to action lean toward the cursor (≤6px).
  const mag = useMagnetic<HTMLAnchorElement>();
  const magnetic = variant === "primary" && size === "lg";
  return (
    <MotionLink
      ref={magnetic ? mag.ref : undefined}
      style={magnetic && mag.style ? { ...mag.style, ...(style as object) } : style}
      whileHover={lift ? buttonHover : undefined}
      whileTap={buttonTap}
      transition={microSpring}
      className={cn(base, variants[variant], variant !== "tertiary" && sizes[size], trail && trailPad[size], className)}
      {...props}
    >
      <>
        {children as React.ReactNode}
        {trail && <Trail size={size} variant={variant} />}
      </>
    </MotionLink>
  );
}
