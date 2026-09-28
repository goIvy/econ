/** Scroll to a section (instant under reduced motion), then move focus into it. */
export function goTo(id: string, focus?: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  const target = (focus ? el.querySelector<HTMLElement>(focus) : null) ?? el;
  if (!target.hasAttribute("tabindex") && !target.matches("button, a, input, select, textarea")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}
