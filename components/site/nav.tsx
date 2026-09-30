"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Sections as SectionsIcon } from "@/components/ui/icons";
import { Popover } from "radix-ui";
import { goTo } from "@/lib/scroll";
import { ButtonLink } from "@/components/ui/button";
import { microSpring } from "@/lib/animations";
import { useSavedCount } from "@/hooks/use-saved";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";

export const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/compare", label: "Compare" },
  { href: "/shelf", label: "Shelf" },
  { href: "/learn", label: "Learn" },
  { href: "/research", label: "Research" },
];

export interface SpySection {
  id: string;
  label: string;
}

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * The fluid island: a floating glass pill, detached from the top edge. On
 * phones the two-line menu icon morphs into an X and opens a full-screen
 * glass sheet whose links rise in one after another.
 */
export function Nav({ overlay = false, sections }: { overlay?: boolean; sections?: SpySection[] }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const saved = useSavedCount();
  const sheetRef = useRef<HTMLDivElement>(null);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  const current = useCurrentSection(sections);
  // On the homepage, "Start comparing" moves focus into the form (not just the scroll position).
  const toStarter = (e: React.MouseEvent) => {
    if (pathname !== "/" || !document.getElementById("starter")) return;
    e.preventDefault();
    requestAnimationFrame(() => goTo("starter", "button"));
  };
  const [jumpOpen, setJumpOpen] = useState(false);
  const jump = (id: string) => {
    setJumpOpen(false);
    setOpen(false);
    // Let the menu close (and page scroll unlock) before moving.
    requestAnimationFrame(() => goTo(id, "h2"));
  };

  // Menu open: lock page scroll, close on Escape, move focus into the sheet.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    sheetRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header data-site-nav className="pointer-events-none fixed inset-x-0 top-0 z-[var(--z-nav)] px-3 pt-3 sm:px-4 sm:pt-4">
        <a href="#main" className="pointer-events-auto sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-on-ink">
          Skip to content
        </a>
        <div className="glass pointer-events-auto relative mx-auto flex h-[3.75rem] max-w-[1120px] items-center gap-4 overflow-hidden rounded-full pl-4 pr-2 sm:pl-5">
          <Logo />
          <nav aria-label="Main" className="mx-auto hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={cn("relative block rounded-full px-4 py-2 text-small font-medium transition-colors duration-300", isActive(l.href) ? "text-ink" : "text-ink-2 hover:text-ink")}
                  >
                    {isActive(l.href) && <motion.span layoutId="nav-active" transition={microSpring} className="absolute inset-0 -z-10 rounded-full bg-surface-sunk" />}
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            {sections && sections.length > 0 && (
              <Popover.Root open={jumpOpen} onOpenChange={setJumpOpen}>
                <Popover.Trigger className="hidden h-10 items-center gap-2 rounded-full px-3 text-small font-medium text-ink-2 transition-colors hover:bg-surface-sunk hover:text-ink data-[state=open]:bg-surface-sunk data-[state=open]:text-ink sm:flex">
                  <SectionsIcon className="size-[18px]" />
                  Sections
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    align="end"
                    sideOffset={12}
                    aria-label="Jump to a section"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className="z-[var(--z-overlay)] w-72 rounded-md bg-surface p-2 shadow-[0_0_0_1px_var(--rule),var(--hairline-inset),var(--shadow-3)]"
                  >
                    <p className="px-3 pb-1 pt-2 text-caption font-medium text-muted">Jump to a section</p>
                    <SectionList sections={sections} current={current} onPick={jump} />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            )}
            <Link href="/saved" title="Saved comparisons" className="relative grid size-11 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-sunk hover:text-ink" aria-label={`Saved comparisons${saved ? ` (${saved})` : ""}`}>
              <Bookmark className="size-[19px]" />
              <AnimatePresence>
                {saved > 0 && (
                  <motion.span key={saved} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="tabular absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-on-accent">
                    {saved}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <ButtonLink href="/#starter" size="sm" trail className="hidden sm:inline-flex" onClick={toStarter}>
              Start comparing
            </ButtonLink>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative grid size-11 place-items-center rounded-full text-ink hover:bg-surface-sunk lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span aria-hidden className={cn("absolute h-[1.5px] w-5 rounded-full bg-current transition-transform duration-500 ease-[var(--ease-premium)]", open ? "rotate-45" : "-translate-y-[4px]")} />
              <span aria-hidden className={cn("absolute h-[1.5px] w-5 rounded-full bg-current transition-transform duration-500 ease-[var(--ease-premium)]", open ? "-rotate-45" : "translate-y-[4px]")} />
            </button>
          </div>
          {overlay && (
            <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px" aria-hidden>
              <motion.div className="h-full origin-left bg-accent" style={{ scaleX: progress }} />
            </div>
          )}
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={sheetRef}
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-[calc(var(--z-nav)-1)] flex flex-col overflow-y-auto bg-[var(--glass)] px-6 pb-10 pt-28 backdrop-blur-3xl lg:hidden"
          >
            <nav aria-label="Main">
              <ul className="grid gap-1">
                {[...NAV_LINKS, { href: "/saved", label: "Saved" }].map((l, i) => (
                  <li key={l.href} className="overflow-hidden">
                    <motion.div initial={reduce ? false : { y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.08 + i * 0.05 }}>
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive(l.href) ? "page" : undefined}
                        className={cn("block py-2 text-[2.5rem] font-semibold leading-tight tracking-[-0.04em]", isActive(l.href) ? "text-ink" : "text-ink-2 hover:text-ink")}
                      >
                        {l.label}
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </nav>
            {sections && sections.length > 0 && (
              <motion.div className="mt-6 grid gap-1 border-t border-rule pt-4" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}>
                <p className="text-caption font-medium text-muted">On this page</p>
                <SectionList sections={sections} current={current} onPick={jump} columns />
              </motion.div>
            )}
            <motion.div className="mt-auto" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}>
              <ButtonLink href="/#starter" size="lg" trail onClick={(e) => { setOpen(false); toStarter(e); }} className="w-full justify-between">
                Start comparing
              </ButtonLink>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Pages flow below the floating bar; the homepage hero slides underneath it. */}
      {!overlay && <div aria-hidden className="h-[calc(var(--nav-h)+12px)]" />}
    </>
  );
}

/** Which homepage section is under the middle of the screen right now. */
function useCurrentSection(sections?: SpySection[]) {
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    if (!sections?.length) return;
    const els = sections.map((x) => document.getElementById(x.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setCurrent(hit.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);
  return current;
}

function SectionList({ sections, current, onPick, columns = false }: { sections: SpySection[]; current: string | null; onPick: (id: string) => void; columns?: boolean }) {
  return (
    <ol className={cn("grid", columns ? "grid-cols-2 gap-x-4" : "gap-0.5")}>
      {sections.map((x, i) => (
        <li key={x.id}>
          <a
            href={`#${x.id}`}
            onClick={(e) => {
              e.preventDefault();
              onPick(x.id);
            }}
            aria-current={current === x.id ? "location" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-sm px-3 text-small transition-colors",
              current === x.id ? "bg-surface-sunk font-medium text-ink" : "text-ink-2 hover:bg-surface-sunk hover:text-ink",
            )}
          >
            <span className="tabular w-5 font-mono text-[11px] text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
            {x.label}
          </a>
        </li>
      ))}
    </ol>
  );
}
