import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know our custom font-size tokens; otherwise it reads
 * `text-small` as a text *color* and drops a real color like `text-white`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "section", "metric", "h1", "h2", "h3", "readout-xl", "readout", "lede", "body", "small", "caption"] }],
      shadow: [{ shadow: ["1", "2", "3"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
