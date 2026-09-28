"use client";

/**
 * Reusable motion building blocks. They only move things: every number they
 * show is computed by lib/calc and passed in. Each one respects
 * prefers-reduced-motion and switches off cursor effects on touch screens.
 */
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { numberSpring, parallaxSpring, TILT_DEG, tiltSpring } from "@/lib/animations";
import { cn } from "@/lib/cn";

const FINE = "(hover: hover) and (pointer: fine)";

/** True on devices with a precise hovering pointer (mouse, trackpad). False on the server. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(FINE);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(FINE).matches,
    () => false,
  );
}

/**
 * A number that glides to each new value on a spring (no re-render per frame).
 * Under reduced motion it jumps.
 */
export function AnimatedNumber({ value, format, className }: { value: number; format: (v: number) => string; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const spring = useSpring(mv, numberSpring);
  useEffect(() => {
    if (reduce) {
      mv.jump(value);
      spring.jump(value);
    } else mv.set(value);
  }, [value, reduce, mv, spring]);
  const text = useTransform(spring, format);
  return <motion.span className={cn("tabular", className)}>{text}</motion.span>;
}

/** Render a motion value as formatted text (for values already driven by a spring or scroll). */
export function MotionText({ value, format, className }: { value: MotionValue<number>; format: (v: number) => string; className?: string }) {
  const text = useTransform(value, format);
  return <motion.span className={cn("tabular", className)}>{text}</motion.span>;
}

/** Subscribe to a motion value but re-render only when its rounded value changes. */
export function useSteppedValue(mv: MotionValue<number>, step = 1): number {
  const [v, setV] = useState(() => Math.round(mv.get() / step) * step);
  useMotionValueEvent(mv, "change", (x) => {
    const r = Math.round(x / step) * step;
    setV((prev) => (prev === r ? prev : r));
  });
  return v;
}

/**
 * Pointer position over an element, normalised to -1…1 and smoothed on a
 * heavy spring. Stays at 0 on touch devices and under reduced motion.
 */
export function usePointerParallax<T extends HTMLElement>(external?: React.RefObject<T | null>) {
  const own = useRef<T>(null);
  const ref = external ?? own;
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const x = useSpring(0, parallaxSpring);
  const y = useSpring(0, parallaxSpring);
  const active = fine && !reduce;
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x.set(((e.clientX - r.left) / r.width) * 2 - 1);
      y.set(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const leave = () => {
      x.set(0);
      y.set(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [active, x, y, ref]);
  return { ref, x, y, active };
}

/** Card that tilts at most 2° toward the cursor. Flat on touch and under reduced motion. */
export function Tilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, x, y, active } = usePointerParallax<HTMLDivElement>();
  const rotateY = useSpring(useTransform(x, [-1, 1], [-TILT_DEG, TILT_DEG]), tiltSpring);
  const rotateX = useSpring(useTransform(y, [-1, 1], [TILT_DEG, -TILT_DEG]), tiltSpring);
  return (
    <motion.div ref={ref} className={cn("[transform-style:preserve-3d]", className)} style={active ? { rotateX, rotateY, transformPerspective: 900 } : undefined}>
      {children}
    </motion.div>
  );
}

/**
 * A scroll-driven scene: a tall section whose child sticks while the user
 * scrolls through it. `progress` runs 0 → 1 across the scroll distance.
 * Under reduced motion the scene is not tall and progress is fixed at 1, so
 * everything is shown in its final state.
 */
export function useScrollScene() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const one = useMotionValue(1);
  return { ref, progress: reduce ? one : scrollYProgress, reduce };
}

export function ScrollScene({
  sceneRef,
  reduce,
  length = 2.6,
  children,
  className,
  label,
}: {
  sceneRef: React.RefObject<HTMLDivElement | null>;
  reduce: boolean;
  /** Scroll length in viewport heights. */
  length?: number;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div ref={sceneRef} className={cn("relative", className)} style={reduce ? undefined : { height: `${length * 100}svh` }} aria-label={label}>
      <div className={cn(!reduce && "sticky top-[var(--nav-h)] flex min-h-[calc(100svh-var(--nav-h))] items-center")}>{children}</div>
    </div>
  );
}

/** Scroll the window so a scene's progress lands at `p` (for "jump to" controls). */
export function scrollSceneTo(el: HTMLElement | null, p: number, reduce: boolean) {
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const range = el.offsetHeight - window.innerHeight;
  window.scrollTo({ top: top + Math.max(0, Math.min(1, p)) * Math.max(0, range), behavior: reduce ? "auto" : "smooth" });
}

/** Width of an element in CSS pixels, so SVG text renders at its true size. */
export function useMeasuredWidth<T extends HTMLElement>(fallback = 720) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Magnetic pull toward the cursor (primary buttons): at most `max` px,
 * only while the pointer is within `reach` px of the element. Off on touch
 * and under reduced motion.
 */
export function useMagnetic<T extends HTMLElement>(max = 6, reach = 36) {
  const ref = useRef<T>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 220, damping: 18, mass: 0.5 });
  const y = useSpring(0, { stiffness: 220, damping: 18, mass: 0.5 });
  const active = fine && !reduce;
  useEffect(() => {
    if (!active) return;
    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inside = e.clientX > r.left - reach && e.clientX < r.right + reach && e.clientY > r.top - reach && e.clientY < r.bottom + reach;
      if (!inside) {
        x.set(0);
        y.set(0);
        return;
      }
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2 + reach);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2 + reach);
      x.set(Math.max(-1, Math.min(1, dx)) * max);
      y.set(Math.max(-1, Math.min(1, dy)) * max);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [active, max, reach, x, y]);
  return { ref, style: active ? { x, y } : undefined };
}
