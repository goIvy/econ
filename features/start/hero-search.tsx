"use client";

import { Command } from "cmdk";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "@/components/ui/icons";
import { goTo } from "@/lib/scroll";
import { cn } from "@/lib/cn";
import { useScenario } from "@/features/scenario/store";

/**
 * The hero's pill search. Type a college, pick it, and the path builder opens
 * with that college filled in and the Major field focused. The round arrow
 * picks the highlighted match (or just opens the builder when empty).
 */
export function HeroSearch() {
  const { colleges, paths, setPath } = useScenario();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const list = useMemo(() => [...colleges].sort((a, b) => a.shortName.localeCompare(b.shortName)), [colleges]);

  const openBuilder = () => {
    goTo("starter");
    // Land on the next choice to make: the Major field.
    requestAnimationFrame(() => document.querySelectorAll<HTMLElement>("#starter button")[1]?.focus({ preventScroll: true }));
  };
  const pick = async (id: string) => {
    const c = colleges.find((x) => x.id === id);
    if (!c) return;
    const cur = paths[0];
    setQuery(c.shortName);
    setOpen(false);
    await setPath(0, { ...cur, collegeId: c.id, majorId: c.majorIds.includes(cur.majorId) ? cur.majorId : c.majorIds[0] });
    openBuilder();
  };
  const submit = () => {
    const match = query.trim() && active ? list.find((c) => c.id === active) : undefined;
    if (match) void pick(match.id);
    else openBuilder();
  };

  return (
    <Command
      label="Find a college"
      value={active}
      onValueChange={setActive}
      loop
      className="relative mx-auto w-full max-w-[34rem]"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <div className="flex h-14 items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] pl-5 pr-1.5 shadow-[0_0_0_1px_var(--rule-strong),var(--hairline-inset)] backdrop-blur-xl transition-shadow focus-within:shadow-[0_0_0_1px_var(--accent),0_0_0_5px_var(--accent-soft)]">
        <Search className="size-[18px] shrink-0 text-muted" aria-hidden />
        <Command.Input
          value={query}
          onValueChange={(v) => {
            setQuery(v);
            setOpen(v.trim().length > 0);
          }}
          onFocus={() => query.trim() && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="Search a college, city or state"
          className="h-full min-w-0 flex-1 bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-muted"
        />
        <button type="button" onClick={submit} aria-label={query.trim() ? "Use the highlighted college" : "Open the path builder"} className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-on-ink transition-transform duration-300 ease-[var(--ease-premium)] hover:scale-105 active:scale-95">
          <ArrowRight className="size-[18px]" aria-hidden />
        </button>
      </div>
      <Command.List
        className={cn(
          "absolute inset-x-0 top-[calc(100%+8px)] z-[var(--z-overlay)] max-h-72 overflow-y-auto rounded-md bg-surface p-1.5 text-left shadow-[0_0_0_1px_var(--rule-strong),var(--hairline-inset),var(--shadow-3)]",
          !open && "hidden",
        )}
      >
        <Command.Empty className="px-3 py-5 text-center text-small text-muted">No matches. Try a city or a state.</Command.Empty>
        {list.map((c) => (
          <Command.Item
            key={c.id}
            value={c.id}
            keywords={[c.shortName, c.name, c.state]}
            onMouseDown={(e) => e.preventDefault()}
            onSelect={() => void pick(c.id)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2.5 text-small text-ink data-[selected=true]:bg-surface-sunk"
          >
            <span className="truncate font-medium">{c.shortName}</span>
            <span className="shrink-0 text-caption text-muted">{c.state}</span>
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
}
