"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";

// ThreeUI's LiquidMetalButton (MIT), pill variant: a liquid-chrome call to action.
const LiquidMetalButton = dynamic(() => import("@designcodeio/threeui/components/LiquidMetalButton").then((m) => m.LiquidMetalButton), {
  ssr: false,
  loading: () => <span aria-hidden className="block size-full rounded-full bg-[#070708]" />,
});

/**
 * A big call to action in liquid metal. The real button lives inside ThreeUI's
 * frame (keyboard and screen readers reach it there, named by `text`).
 */
export function LiquidCta({ text, onClick, className }: { text: string; onClick: () => void; className?: string }) {
  // Same width rule the component uses for its pill (units of a 52px-high button), plus a hairline of frame.
  const width = Math.round((Math.min(3000, Math.max(1407, 820 + text.length * 94)) / 516) * 52) + 8;
  return (
    <span className={cn("group/lm relative block h-[60px] shrink-0 overflow-hidden rounded-full", className)} style={{ width }}>
      <LiquidMetalButton variant="pill" rendering="colored" text={text} embedded onClick={onClick} />
      {/* Until the metal is ready, the label shows as plain text so the button never looks empty. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center text-[15px] font-medium text-white transition-opacity duration-300 group-has-[[data-state=ready]]/lm:opacity-0">
        {text}
      </span>
    </span>
  );
}
