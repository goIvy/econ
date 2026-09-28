"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Dialog } from "radix-ui";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Segmented } from "@/components/ui/segmented";
import { sheet } from "@/lib/animations";
import { moneyCompact } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Option { value: string; label: string }

const PRICE_STEPS = [20000, 30000, 40000, 50000, 60000];
const DEBT_STEPS = [15000, 20000, 25000, 30000];
const EARN_STEPS = [50000, 60000, 70000, 80000];
const GRAD_STEPS = [60, 70, 80, 90];
const ACCEPT_STEPS = [10, 25, 50, 75];

/** The search bar (name, city or state). Updates the URL; results are server-rendered. */
export function ExploreSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(initial);
  const [pending, start] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") === q) return;
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    }, 250);
    return () => clearTimeout(t);
  }, [q, params, pathname, router]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by college name, city or state"
        aria-label="Search colleges by name, city or state"
        className="h-14 w-full rounded-md border border-rule-strong bg-surface pl-12 pr-4 text-base text-ink shadow-1 outline-none transition-colors placeholder:text-muted focus:border-trace-a"
        autoFocus={false}
      />
      {pending && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-caption text-muted">Searching…</span>}
    </div>
  );
}

/** Filters: sidebar on desktop, bottom sheet on phones. Every change updates the URL. */
export function ExploreFilters({ states, majors, count }: { states: Option[]; majors: Option[]; count: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value == null || value === "" || value === "any") next.delete(key);
    else next.set(key, value);
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  const get = (k: string) => params.get(k) ?? "any";
  const active = ["control", "state", "maxNetPrice", "minGradRate", "maxAcceptance", "size", "maxDebt", "minEarnings", "major"].filter((k) => params.get(k)).length;
  const reset = () => {
    const q = params.get("q");
    start(() => router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false }));
  };

  const body = (
    <div className="grid gap-6">
      <Segmented
        label="Type"
        value={get("control") as "any" | "public" | "private"}
        onChange={(v) => set("control", v)}
        options={[
          { value: "any", label: "Any" },
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
        ]}
      />
      <Combobox label="State" value={params.get("state") ?? "any"} onChange={(v) => set("state", v)} options={[{ value: "any", label: "Any state" }, ...states]} searchPlaceholder="Search states" />
      <Combobox label="Offers this major" value={params.get("major") ?? "any"} onChange={(v) => set("major", v)} options={[{ value: "any", label: "Any major" }, ...majors]} searchPlaceholder="Search majors" />
      <ChipGroup label="Average net price" value={get("maxNetPrice")} onChange={(v) => set("maxNetPrice", v)} options={PRICE_STEPS.map((n) => ({ value: String(n), label: `≤ ${moneyCompact(n)}` }))} />
      <ChipGroup label="6-year graduation rate" value={get("minGradRate")} onChange={(v) => set("minGradRate", v)} options={GRAD_STEPS.map((n) => ({ value: String(n), label: `≥ ${n}%` }))} />
      <ChipGroup label="Acceptance rate" value={get("maxAcceptance")} onChange={(v) => set("maxAcceptance", v)} options={ACCEPT_STEPS.map((n) => ({ value: String(n), label: `≤ ${n}%` }))} />
      <ChipGroup
        label="Undergraduate size"
        value={get("size")}
        onChange={(v) => set("size", v)}
        options={[
          { value: "small", label: "Under 5K" },
          { value: "medium", label: "5K–20K" },
          { value: "large", label: "20K+" },
        ]}
      />
      <ChipGroup label="Typical debt" value={get("maxDebt")} onChange={(v) => set("maxDebt", v)} options={DEBT_STEPS.map((n) => ({ value: String(n), label: `≤ ${moneyCompact(n)}` }))} />
      <ChipGroup label="Median earnings" value={get("minEarnings")} onChange={(v) => set("minEarnings", v)} options={EARN_STEPS.map((n) => ({ value: String(n), label: `≥ ${moneyCompact(n)}` }))} />
      {active > 0 && (
        <button type="button" onClick={reset} className="justify-self-start text-small font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
          Clear {active} {active === 1 ? "filter" : "filters"}
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{body}</div>
      <div className="lg:hidden">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button variant="secondary" className="w-full">
              <SlidersHorizontal className="size-4" aria-hidden /> Filters{active ? ` (${active})` : ""}
            </Button>
          </Dialog.Trigger>
          <AnimatePresence>
            {open && (
              <Dialog.Portal forceMount>
                <Dialog.Overlay asChild forceMount>
                  <motion.div className="fixed inset-0 z-50 bg-ink/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                </Dialog.Overlay>
                <Dialog.Content asChild forceMount>
                  <motion.div variants={sheet} initial="hidden" animate="visible" exit="exit" className="fixed inset-x-0 bottom-0 z-50 grid max-h-[88dvh] grid-rows-[auto_1fr_auto] rounded-t-lg border-t border-rule bg-surface shadow-3">
                    <div className="flex items-center justify-between border-b border-rule px-5 py-4">
                      <Dialog.Title className="font-display text-[1.15rem] font-semibold">Filters</Dialog.Title>
                      <Dialog.Close className="grid size-9 place-items-center rounded-sm hover:bg-surface-sunk" aria-label="Close filters">
                        <X className="size-5" />
                      </Dialog.Close>
                    </div>
                    <Dialog.Description className="sr-only">Narrow the list of colleges</Dialog.Description>
                    <div className="overflow-y-auto px-5 py-5">{body}</div>
                    <div className="border-t border-rule px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                      <Button className="w-full" onClick={() => setOpen(false)}>
                        Show {count} {count === 1 ? "college" : "colleges"}
                      </Button>
                    </div>
                  </motion.div>
                </Dialog.Content>
              </Dialog.Portal>
            )}
          </AnimatePresence>
        </Dialog.Root>
      </div>
    </>
  );
}

function ChipGroup({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string | null) => void; options: Option[] }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-caption font-medium text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? null : o.value)}
              className={cn(
                "tabular rounded-full border px-3 py-1.5 text-small font-medium transition-colors",
                on ? "border-ink bg-ink text-white" : "border-rule-strong bg-surface text-ink-2 hover:border-ink hover:text-ink",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Sort control for the results header. */
export function ExploreSort() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, start] = useTransition();
  const value = params.get("sort") ?? "name";
  return (
    <label className="flex items-center gap-2 text-small text-muted">
      Sort by
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", e.target.value);
          start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
        }}
        className="h-9 rounded-sm border border-rule-strong bg-surface px-2 text-small font-medium text-ink"
      >
        <option value="name">Name</option>
        <option value="net-price">Net price (low to high)</option>
        <option value="earnings">Median earnings (high to low)</option>
        <option value="grad-rate">Graduation rate (high to low)</option>
        <option value="debt">Typical debt (low to high)</option>
      </select>
    </label>
  );
}
