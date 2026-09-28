"use client";

import { useEffect, useRef, useState } from "react";
import type { PathResponse } from "@/lib/api/path-response";

export interface PathSpec {
  collegeId: string;
  majorId: string;
  residency: "resident" | "nonresident";
  living: "campus" | "off-campus" | "home";
  aid: number;
}

export const specKey = (p: PathSpec) => `${p.collegeId}|${p.majorId}|${p.residency}|${p.living}|${p.aid}`;

type Entry = { status: "loading" | "ready" | "error"; data?: PathResponse; error?: string };

/**
 * Runs a list of paths through /api/path, caching by spec so unchanged paths
 * aren't refetched. Previous results stay visible while new ones load.
 */
export function usePaths(specs: PathSpec[], funding: { familyPerYear: number; workPerYear: number; savings?: number }) {
  const [results, setResults] = useState<Record<string, Entry>>({});
  const inflight = useRef(new Set<string>());

  useEffect(() => {
    for (const s of specs) {
      const key = `${specKey(s)}|${funding.familyPerYear}|${funding.workPerYear}|${funding.savings ?? 0}`;
      if (results[key]?.status === "ready" || inflight.current.has(key)) continue;
      inflight.current.add(key);
      setResults((r) => ({ ...r, [key]: { status: "loading", data: r[key]?.data } }));
      fetch("/api/path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeId: s.collegeId,
          majorId: s.majorId,
          residency: s.residency,
          living: s.living,
          horizonAge: 40,
          funding: { aidPerYear: s.aid, familyPerYear: funding.familyPerYear, workPerYear: funding.workPerYear, savings: funding.savings ?? 0 },
        }),
      })
        .then(async (res) => {
          const json = await res.json();
          setResults((r) => ({ ...r, [key]: res.ok ? { status: "ready", data: json } : { status: "error", error: json?.error ?? "Couldn't calculate this path." } }));
        })
        .catch(() => setResults((r) => ({ ...r, [key]: { status: "error", error: "We couldn't reach the calculator. Check your connection." } })))
        .finally(() => inflight.current.delete(key));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specs, funding.familyPerYear, funding.workPerYear, funding.savings]);

  return specs.map((s) => results[`${specKey(s)}|${funding.familyPerYear}|${funding.workPerYear}|${funding.savings ?? 0}`] ?? { status: "loading" as const });
}
