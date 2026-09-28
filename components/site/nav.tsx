"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Bookmark, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { collapse, enter, microSpring, staggerParent } from "@/lib/animations";
import { useSavedCount } from "@/hooks/use-saved";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";

export const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/compare", label: "Compare" },
  { href: "/learn", label: "Learn" },
  { href: "/research", label: "Research" },
];

export interface SpySection {
  id: string;
  label: string;
}

/**
 * Fixed frosted-glass navbar. It reads the section underneath and takes that
 * section's theme (dark or light), so its text always contrasts. On the
 * homepage it carries a scroll-spy "path line": the current chapter's name and
 * how far through the story you are.
 */
export function Nav({ overlay = false, sections }: { overlay?: boolean; sections?: SpySection[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(overlay);
  const [scrolled, setScrolled] = useState(false);
  const saved = useSavedCount();

  // Theme under the nav + scroll-spy, sampled at most once per frame.
  useEffect(() => {
    let raf = 0;
    const sample = () => {
      raf = 0;
      const navH = 64;
      setScrolled(window.scrollY > 8);
      const below = document.elementsFromPoint(window.innerWidth / 2, navH / 2).find((el) => !el.closest("header[data-site-nav]"));
      setDark(!!below?.closest(".theme-dark"));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sample);
    };
    sample();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sections]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header
        data-site-nav
        className={cn(
          "glass fixed inset-x-0 top-0 z-40 border-b text-ink transition-[border-color,background-color,color] duration-300",
          dark && "theme-dark !bg-[var(--glass)]",
          scrolled || !overlay ? "border-rule" : "border-transparent",
        )}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-3 focus:py-2 focus:text-on-ink">
          Skip to content
        </a>
        <div className="mx-auto flex h-[var(--nav-h)] max-w-[1280px] items-center gap-6 px-4 md:px-8">
          <Logo />
          <nav aria-label="Main" className="hidden flex-1 lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <li key={l.href} className="relative">
                  <Link
                    href={l.href}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={cn("relative block rounded-xs px-3 py-1.5 text-small font-medium transition-colors", isActive(l.href) ? "text-ink" : "text-muted hover:text-ink")}
                  >
                    {l.label}
                    {isActive(l.href) && <motion.span layoutId="nav-active" transition={microSpring} className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-accent" />}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <Link href="/saved" title="Saved comparisons" className="relative grid size-10 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-sunk hover:text-ink" aria-label={`Saved comparisons${saved ? ` (${saved})` : ""}`}>
              <Bookmark className="size-[18px]" aria-hidden />
              <AnimatePresence>
                {saved > 0 && (
                  <motion.span key={saved} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="tabular absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#0b1020]">
                    {saved}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <ButtonLink href="/#starter" size="sm" className="ml-1 hidden sm:inline-flex">
              Start comparing
            </ButtonLink>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid size-10 place-items-center rounded-sm text-ink hover:bg-surface-sunk lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* scroll-spy path line (homepage) */}
        {sections && (
          <div className="pointer-events-none absolute inset-x-0 -bottom-px h-[2px]" aria-hidden>
            <motion.div className="h-full origin-left bg-accent" style={{ scaleX: progress }} />
          </div>
        )}
        <AnimatePresence>
          {open && (
            <motion.nav
              id="mobile-nav"
              aria-label="Main"
              variants={collapse}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ maxHeight: "calc(100dvh - var(--nav-h))" }}
              className="overflow-y-auto border-t border-rule bg-paper lg:hidden"
            >
              <motion.ul variants={staggerParent(0.04, 0.05)} initial="hidden" animate="visible" className="grid gap-1 px-4 py-4">
                {[...NAV_LINKS, { href: "/saved", label: "Saved" }].map((l) => (
                  <motion.li key={l.href} variants={enter}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(l.href) ? "page" : undefined}
                      className={cn("block rounded-sm px-3 py-3 text-[1.5rem] font-bold tracking-[-0.03em]", isActive(l.href) ? "bg-surface-sunk text-ink" : "text-ink-2")}
                    >
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
                <motion.li variants={enter} className="mt-4 grid border-t border-rule pt-5">
                  <ButtonLink href="/#starter" onClick={() => setOpen(false)}>
                    Start comparing
                  </ButtonLink>
                </motion.li>
              </motion.ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      {/* Pages flow below the fixed bar; the homepage hero slides underneath it. */}
      {!overlay && <div aria-hidden className="h-[var(--nav-h)]" />}
    </>
  );
}
