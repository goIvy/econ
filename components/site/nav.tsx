"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { collapse, enter, microSpring, staggerParent } from "@/lib/animations";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";

export const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/compare", label: "Compare" },
  { href: "/simulator", label: "Simulator" },
  { href: "/majors", label: "Majors" },
  { href: "/careers", label: "Careers" },
  { href: "/research", label: "Research" },
  { href: "/methodology", label: "Methodology" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-paper/[0.92] transition-[border-color,box-shadow] duration-200",
        scrolled ? "border-rule shadow-1" : "border-transparent",
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-3 focus:py-2 focus:text-on-ink">
        Skip to content
      </a>
      <div className="mx-auto flex h-[var(--nav-h)] max-w-[1200px] items-center gap-6 px-4 md:px-8 xl:px-12">
        <Logo />
        <nav aria-label="Main" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href} className="relative">
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={cn(
                    "relative block rounded-xs px-2.5 py-1.5 text-small font-medium transition-colors",
                    isActive(l.href) ? "text-ink" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {l.label}
                  {isActive(l.href) && (
                    <motion.span layoutId="nav-active" transition={microSpring} className="absolute inset-x-2.5 -bottom-[13px] h-[2px] rounded-full bg-ink" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <Link href="/explore" className="grid size-10 place-items-center rounded-sm text-ink-2 transition-colors hover:bg-surface-sunk hover:text-ink" aria-label="Search colleges">
            <Search className="size-[18px]" aria-hidden />
          </Link>
          <Link href="/sign-in" className="hidden rounded-sm px-3 py-2 text-small font-semibold text-ink-2 transition-colors hover:text-ink sm:block">
            Sign in
          </Link>
          <ButtonLink href="/get-started" size="sm" className="hidden sm:inline-flex">
            Get started
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
              {NAV_LINKS.map((l) => (
                <motion.li key={l.href} variants={enter}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={cn("block rounded-sm px-3 py-3 font-display text-[1.35rem] font-semibold", isActive(l.href) ? "bg-surface-sunk text-ink" : "text-ink-2")}
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li variants={enter} className="mt-4 grid grid-cols-2 gap-3 border-t border-rule pt-5">
                <ButtonLink href="/sign-in" variant="secondary" onClick={() => setOpen(false)}>
                  Sign in
                </ButtonLink>
                <ButtonLink href="/get-started" onClick={() => setOpen(false)}>
                  Get started
                </ButtonLink>
              </motion.li>
            </motion.ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
