"use client";

import { useCallback, useRef, useState } from "react";
import type { PathRequestBody } from "@/lib/api/path-schema";
import type { PathResponse } from "@/lib/api/path-response";

export type PathInput = Omit<PathRequestBody, "living" | "yearsToGraduate" | "funding" | "horizonAge"> & {
  horizonAge?: number;
  living?: PathRequestBody["living"];
  yearsToGraduate?: number;
  funding?: Partial<PathRequestBody["funding"]>;
};

type State =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: PathResponse | null; error: null }
  | { status: "ready"; data: PathResponse; error: null }
  | { status: "error"; data: PathResponse | null; error: string };

/**
 * Runs a path through /api/path. While a new request is in flight the
 * previous result stays on screen (the frame is kept; no skeleton flash).
 */
export function usePath() {
  const [state, setState] = useState<State>({ status: "idle", data: null, error: null });
  const abort = useRef<AbortController | null>(null);

  const run = useCallback(async (input: PathInput) => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setState((s) => ({ status: "loading", data: s.data, error: null }));
    try {
      const res = await fetch("/api/path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ living: "campus", yearsToGraduate: 4, ...input }),
        signal: ctrl.signal,
      });
      const json = await res.json();
      if (!res.ok) {
        setState((s) => ({ status: "error", data: s.data, error: json?.error ?? "Something went wrong. Try again." }));
        return null;
      }
      setState({ status: "ready", data: json as PathResponse, error: null });
      return json as PathResponse;
    } catch (e) {
      if ((e as Error).name === "AbortError") return null;
      setState((s) => ({ status: "error", data: s.data, error: "We couldn't reach the calculator. Check your connection and try again." }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    setState({ status: "idle", data: null, error: null });
  }, []);

  return { ...state, run, reset };
}

/** Where path `a` overtakes path `b` for good (cumulative value). */
export function crossing(a: PathResponse["series"], b: PathResponse["series"]): { age: number; value: number } | null {
  const n = Math.min(a.length, b.length);
  if (!n) return null;
  const d = (i: number) => a[i].cumulative - b[i].cumulative;
  if (d(n - 1) < 0) return null;
  let last = -1;
  for (let i = n - 1; i >= 0; i--) if (d(i) < 0) { last = i; break; }
  if (last < 0) return null;
  const f = -d(last) / (d(last + 1) - d(last));
  const age = a[last].age + f;
  const value = a[last].cumulative + f * (a[last + 1].cumulative - a[last].cumulative);
  return { age, value };
}
