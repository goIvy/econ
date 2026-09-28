"use client";

import { useSyncExternalStore } from "react";

/**
 * Saved comparisons, kept in this browser (localStorage). No account needed.
 * Each entry is a shareable URL plus a label, so a saved comparison is just a
 * bookmark into the app's URL state.
 */
export interface SavedItem {
  id: string;
  label: string;
  href: string;
  paths: string[];
  savedAt: number;
}

const KEY = "cvl:saved";
const listeners = new Set<() => void>();
let cache: SavedItem[] | null = null;

function read(): SavedItem[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedItem[];
  } catch {
    cache = [];
  }
  return cache;
}
function write(items: SavedItem[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage blocked: keep in memory for this visit */
  }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}
const EMPTY: SavedItem[] = [];

export function useSaved() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items,
    save: (item: Omit<SavedItem, "id" | "savedAt">) => {
      const existing = read().filter((i) => i.href !== item.href);
      write([{ ...item, id: Math.random().toString(36).slice(2, 10), savedAt: Date.now() }, ...existing].slice(0, 30));
    },
    remove: (id: string) => write(read().filter((i) => i.id !== id)),
    isSaved: (href: string) => read().some((i) => i.href === href),
  };
}

export function useSavedCount() {
  return useSyncExternalStore(subscribe, () => read().length, () => 0);
}
