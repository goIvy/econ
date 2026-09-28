"use client";

import { useCallback, useSyncExternalStore } from "react";

export const COMPARE_MAX = 5;
const KEY = "cvl:compare";
const EVENT = "cvl:compare-change";

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, COMPARE_MAX) : [];
  } catch {
    return [];
  }
}

let cache: string[] = [];
let cacheKey = "";
function snapshot(): string[] {
  const next = read();
  const k = next.join(",");
  if (k !== cacheKey) {
    cache = next;
    cacheKey = k;
  }
  return cache;
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, COMPARE_MAX)));
  } catch {
    /* storage unavailable (private mode): the list still works for this page view via the event */
  }
  window.dispatchEvent(new Event(EVENT));
}

const EMPTY: string[] = [];

/** Colleges queued for comparison (max 5), shared across pages and tabs. */
export function useCompareList() {
  const ids = useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    snapshot,
    () => EMPTY,
  );

  const toggle = useCallback((id: string) => {
    const cur = read();
    if (cur.includes(id)) write(cur.filter((x) => x !== id));
    else if (cur.length < COMPARE_MAX) write([...cur, id]);
  }, []);
  const remove = useCallback((id: string) => write(read().filter((x) => x !== id)), []);
  const clear = useCallback(() => write([]), []);

  return { ids, toggle, remove, clear, full: ids.length >= COMPARE_MAX };
}
