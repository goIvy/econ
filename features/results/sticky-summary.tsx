"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp } from "@/components/ui/icons";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DUR, EASE } from "@/lib/animations";
import { goTo } from "@/lib/scroll";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { useScenario } from "@/features/scenario/store";
import { breakEvenYears, residencyShort, yrs } from "@/features/scenario/facts";
import { moneyCompact } from "@/lib/format";

/**
 * A compact reminder of the path you're analyzing. Appears once the results
 * have scrolled away and hides again near the end of the page. Desktop: a
 * small card. Phones: a bar that expands into a sheet.
 */
export function StickySummary() {
  const { futures } = useScenario();
  const f = futures.find((x) => x.index === 0);
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const results = document.getElementById("your-path");
    const end = document.getElementById("final-cta");
    if (!results) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const past = results.getBoundingClientRect().bottom < 80;
      const atEnd = end ? end.getBoundingClientRect().top < window.innerHeight * 0.8 : false;
      const cmp = document.getElementById("compare")?.getBoundingClientRect();
      const inCompare = cmp ? cmp.top < window.innerHeight * 0.5 && cmp.bottom > window.innerHeight * 0.5 : false;
      setVisible(past && !atEnd && !inCompare);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!f) return null;
  const rows: Array<[string, string]> = [
    ["Net cost", moneyCompact(f.result.net.netPrice)],
    ["Debt", moneyCompact(f.result.loan.principal)],
    ["Break-even", yrs(breakEvenYears(f))],
  ];
  const compare = () => {
    setOpen(false);
    goTo("compare", "h2");
  };
  const motionProps = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    transition: { duration: DUR.standard, ease: EASE.smooth },
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* desktop: a slim bar */}
          <motion.aside key="desk" {...motionProps} aria-label="Your path summary" className="fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-5 rounded-full border border-rule bg-surface py-2 pl-5 pr-2 shadow-3 lg:flex">
            <p className="grid leading-tight">
              <span className="text-[10px] font-bold tracking-[0.16em] text-trace-a">YOUR PATH</span>
              <span className="max-w-[16rem] truncate text-small font-bold text-ink">
                {f.ctx.college.shortName} <span className="font-normal text-ink-2">· {f.ctx.major.name}, {residencyShort(f).toLowerCase()}</span>
              </span>
            </p>
            <dl className="flex gap-5 border-l border-rule pl-5">
              {rows.map(([k, v]) => (
                <div key={k} className="grid leading-tight">
                  <dt className="text-[11px] text-muted">{k}</dt>
                  <dd className="tabular text-small font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <Button size="sm" onClick={compare} className="rounded-full">
              Compare
            </Button>
          </motion.aside>

          {/* phone bar + sheet */}
          <motion.aside key="mob" {...motionProps} aria-label="Your path summary" className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)] shadow-3 lg:hidden">
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="summary-sheet" className="flex h-14 w-full items-center justify-between gap-3 px-4 text-left">
              <span className="min-w-0 truncate text-small">
                <span className="font-bold text-ink">{f.ctx.college.shortName}</span> <span className="text-ink-2">· {moneyCompact(f.result.net.netPrice)} net, {yrs(breakEvenYears(f))}</span>
              </span>
              <ChevronUp className={cn("size-5 shrink-0 text-ink-2 transition-transform", open && "rotate-180")} aria-hidden />
            </button>
            <div id="summary-sheet" hidden={!open} className="grid gap-3 border-t border-rule px-4 pb-4 pt-3">
              <p className="text-caption text-ink-2">
                {f.ctx.major.name} · {residencyShort(f)}
              </p>
              <dl className="grid grid-cols-3 gap-2">
                {rows.map(([k, v]) => (
                  <div key={k} className="grid gap-0.5">
                    <dt className="text-caption text-muted">{k}</dt>
                    <dd className="tabular text-base font-bold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <Button onClick={compare} className="w-full">
                Compare
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
