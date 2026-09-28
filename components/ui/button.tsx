"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { buttonHover, buttonTap, microSpring } from "@/lib/animations";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "tertiary" | "quiet";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-sans font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-on-ink shadow-1 hover:bg-ink-hover rounded-sm",
  secondary: "bg-surface text-ink border border-rule-strong shadow-1 hover:border-ink/40 rounded-sm",
  tertiary: "text-ink underline-offset-4 hover:underline decoration-rule-strong rounded-xs",
  quiet: "text-ink-2 hover:text-ink hover:bg-surface-sunk rounded-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-small",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-12 px-6 text-base",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, ...props },
  ref,
) {
  const lift = variant === "primary" || variant === "secondary";
  return (
    <motion.button
      ref={ref}
      whileHover={lift && !props.disabled ? buttonHover : undefined}
      whileTap={!props.disabled ? buttonTap : undefined}
      transition={microSpring}
      className={cn(base, variants[variant], variant !== "tertiary" && sizes[size], className)}
      {...props}
    />
  );
});

const MotionLink = motion.create(Link);

export interface ButtonLinkProps extends Omit<React.ComponentProps<typeof MotionLink>, "ref"> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  const lift = variant === "primary" || variant === "secondary";
  return (
    <MotionLink
      whileHover={lift ? buttonHover : undefined}
      whileTap={buttonTap}
      transition={microSpring}
      className={cn(base, variants[variant], variant !== "tertiary" && sizes[size], className)}
      {...props}
    />
  );
}
