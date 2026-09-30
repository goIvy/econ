"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/segmented";
import { goTo } from "@/lib/scroll";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useScenario } from "@/features/scenario/store";
import type { PathSel } from "@/features/scenario/types";

type Field = "Tech" | "Health" | "Business";
const PICKS: Array<{ collegeId: string; majorId: string; field: Field }> = [
  { collegeId: "ut-austin", majorId: "computer-science", field: "Tech" },
  { collegeId: "georgia-state", majorId: "nursing", field: "Health" },
  { collegeId: "nyu", majorId: "finance", field: "Business" },
  { collegeId: "georgia-tech", majorId: "computer-science", field: "Tech" },
  { collegeId: "u-michigan", majorId: "nursing", field: "Health" },
  { collegeId: "san-jose-state", majorId: "business-administration", field: "Business" },
];
// Each field gets its own light in the card art (decorative only).
const TONES: Record<Field, [string, string]> = {
  Tech: ["var(--trace-b)", "#dfe8ff"],
  Health: ["var(--trace-d)", "#d6fff0"],
  Business: ["var(--accent)", "#ffd29a"],
};

/**
 * POPULAR PATHS. A gallery of ready-made college + major paths, filterable by
 * type. Each card's art is generated from its name (decoration, not data);
 * "Try this path" loads the real numbers into the results above.
 */
export function PopularPaths() {
  const { colleges, majors, setPath, setPersonal, setActive } = useScenario();
  const reduce = useReducedMotion();
  const [type, setType] = useState<"all" | "public" | "private">("all");
  const cards = useMemo(
    () =>
      PICKS.flatMap((p) => {
        const c = colleges.find((x) => x.id === p.collegeId);
        const m = majors.find((x) => x.id === p.majorId);
        return c && m && c.majorIds.includes(m.id) ? [{ ...p, college: c, major: m.name }] : [];
      }),
    [colleges, majors],
  );
  const shown = cards.filter((c) => type === "all" || c.college.control === type);

  const tryPath = async (p: (typeof cards)[number]) => {
    const sel: PathSel = { collegeId: p.collegeId, majorId: p.majorId, residency: "resident", aid: 0, living: "campus" };
    await setPath(0, sel);
    setPersonal(false);
    setActive(0);
    goTo("your-path", "h2");
  };

  return (
    <section id="popular" aria-labelledby="popular-h" className="relative scroll-mt-[var(--nav-h)]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 md:px-8 md:py-24">
        <div className="grid justify-items-center gap-5 text-center">
          <h2 id="popular-h" className="text-[clamp(2.6rem,6vw,5rem)] leading-[0.95]">
            Start from a <em>popular path</em>
          </h2>
          <p className="max-w-[36rem] text-lede text-ink-2">Not sure where to begin? Try one of these and change anything afterwards.</p>
          <Link href="/shelf" className="group inline-flex min-h-11 items-center gap-1.5 rounded-full text-small font-medium text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
            Or take an elite university down from the shelf
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
          <p className="text-small text-ink-2">
            <span className="tabular font-medium text-ink">{shown.length}</span> paths
          </p>
          <Segmented
            label="College type"
            size="sm"
            value={type}
            onChange={setType}
            options={[
              { value: "all", label: "All" },
              { value: "public", label: "Public" },
              { value: "private", label: "Private" },
            ]}
          />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((p, i) => (
              <motion.li
                key={`${p.collegeId}.${p.majorId}`}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: (i % 3) * 0.08 }}
              >
                <button
                  type="button"
                  onClick={() => void tryPath(p)}
                  className="group/card grid w-full gap-3 rounded-lg bg-surface p-2 text-left shadow-[0_0_0_1px_var(--rule),var(--hairline-inset)] transition-shadow duration-500 hover:shadow-[0_0_0_1px_var(--rule-strong),var(--hairline-inset),var(--shadow-3)]"
                  aria-label={`Try ${p.college.shortName} ${p.major}`}
                >
                  <CardArt name={`${p.college.shortName} ${p.major}`} field={p.field} title={p.college.shortName} />
                  <span className="flex items-end justify-between gap-3 px-3 pb-2">
                    <span className="grid gap-0.5">
                      <span className="text-body font-medium text-ink">{p.major}</span>
                      <span className="text-caption text-muted">
                        {p.college.control === "public" ? "Public" : "Private"}, {p.college.state}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-medium text-ink-2 ring-1 ring-rule transition-colors group-hover/card:bg-ink group-hover/card:text-on-ink">
                      Try this path <ArrowUpRight className="size-3.5" aria-hidden />
                    </span>
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}

/** Seeded rising curves for a card, from its name (same art on every visit). */
function cardCurves(name: string) {
  let seed = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 2147483647, 7) || 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 18 }, () => {
    let y = 190 + rand() * 20;
    let slope = -1 - rand() * 3;
    let d = `M 0 ${y.toFixed(1)}`;
    for (let x = 20; x <= 400; x += 20) {
      slope += (rand() - 0.55) * 1.4;
      y = Math.max(20, Math.min(230, y + slope));
      d += ` L ${x} ${y.toFixed(1)}`;
    }
    return { d, o: 0.2 + rand() * 0.6 };
  });
}

/** Generated card art: a seeded glow and a spray of rising curves, with the college name set large. */
function CardArt({ name, field, title }: { name: string; field: Field; title: string }) {
  const [tone, glow] = TONES[field];
  const paths = useMemo(() => cardCurves(name), [name]);
  return (
    <span aria-hidden className="relative block aspect-[16/10] overflow-hidden rounded-md bg-[color-mix(in_srgb,var(--paper)_50%,#000)]">
      <span className="absolute -bottom-1/3 left-1/4 size-[70%] rounded-full opacity-60 blur-3xl transition-transform duration-700 ease-[var(--ease-premium)] group-hover/card:scale-125" style={{ background: tone }} />
      <svg viewBox="0 0 400 250" preserveAspectRatio="none" className="absolute inset-0 size-full">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke={i % 4 === 0 ? glow : tone} strokeOpacity={p.o} strokeWidth={i % 5 === 0 ? 1.4 : 0.7} />
        ))}
      </svg>
      <span className="absolute bottom-3 left-4 right-4 truncate font-serif text-[clamp(2rem,3.4vw,2.6rem)] leading-none text-white">{title}</span>
    </span>
  );
}
