"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { calculateBreakEvenYear, cumulativeSeries, projectNoCollege, projectPath, type PathContext, type PathResult } from "@/lib/calc";
import type { ProjectionRow } from "@/lib/calc";
import type { CollegeLite, PathSel } from "./types";

/**
 * The one scenario the homepage shares. The hero's "Build your path" writes to
 * it; True Cost, Break-Even, What-If and the lessons read from it. Every
 * number is recomputed in the browser with lib/calc, so changes are instant.
 */
export const HORIZON = 40;
const FUNDING = { scholarshipsPerYear: 0, familyPerYear: 10000, workPerYear: 3000, savings: 0 };

export interface Future {
  index: number;
  sel: PathSel;
  ctx: PathContext;
  result: PathResult;
  /** Cumulative net value by age, 18…40 (index 0 = age 18). */
  series: number[];
  /** Break-even vs working from 18 (fractional age), or null. */
  breakEven: number | null;
  label: string;
}

interface Store {
  paths: PathSel[];
  active: number;
  setActive: (i: number) => void;
  setPath: (i: number, patch: Partial<PathSel>) => Promise<boolean>;
  futures: Future[];
  baseline: ProjectionRow[];
  baselineSeries: number[];
  colleges: CollegeLite[];
  majors: Array<{ id: string; name: string }>;
  loading: number | null;
  error: string | null;
}

const Ctx = createContext<Store | null>(null);
const key = (p: Pick<PathSel, "collegeId" | "majorId">) => `${p.collegeId}.${p.majorId}`;

export function ScenarioProvider({
  seed,
  children,
}: {
  seed: { paths: PathSel[]; contexts: Record<string, PathContext>; colleges: CollegeLite[]; majors: Array<{ id: string; name: string }> };
  children: React.ReactNode;
}) {
  const [paths, setPaths] = useState<PathSel[]>(seed.paths);
  const [active, setActive] = useState(0);
  const [contexts, setContexts] = useState<Record<string, PathContext>>(seed.contexts);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef(new Map<string, Promise<PathContext | null>>());

  const load = useCallback(async (collegeId: string, majorId: string) => {
    const k = `${collegeId}.${majorId}`;
    if (contexts[k]) return contexts[k];
    if (!inflight.current.has(k)) {
      inflight.current.set(
        k,
        fetch(`/api/context?college=${encodeURIComponent(collegeId)}&major=${encodeURIComponent(majorId)}`)
          .then((r) => (r.ok ? (r.json() as Promise<PathContext>) : null))
          .catch(() => null),
      );
    }
    const ctx = await inflight.current.get(k)!;
    inflight.current.delete(k);
    if (ctx) setContexts((c) => ({ ...c, [k]: ctx }));
    return ctx;
  }, [contexts]);

  const setPath = useCallback(
    async (i: number, patch: Partial<PathSel>) => {
      const next = { ...paths[i], ...patch };
      setError(null);
      if (!contexts[key(next)]) {
        setLoading(i);
        const ctx = await load(next.collegeId, next.majorId);
        setLoading(null);
        if (!ctx) {
          setError("That college doesn't offer this major in our data.");
          return false;
        }
      }
      // Private colleges have one tuition; keep residency meaningful only for publics.
      setPaths((ps) => ps.map((p, j) => (j === i ? next : p)));
      return true;
    },
    [paths, contexts, load],
  );

  const baseline = useMemo(() => projectNoCollege({ horizonAge: HORIZON }), []);
  const baselineSeries = useMemo(() => cumulativeSeries(baseline, HORIZON), [baseline]);

  const futures = useMemo(
    () =>
      paths.flatMap((sel, index) => {
        const ctx = contexts[key(sel)];
        if (!ctx) return [];
        const result = projectPath(
          { collegeId: sel.collegeId, majorId: sel.majorId, residency: ctx.college.control === "public" ? sel.residency : "resident", living: sel.living, yearsToGraduate: 4, funding: { ...FUNDING, aidPerYear: sel.aid } },
          ctx,
          { horizonAge: HORIZON },
        );
        const be = calculateBreakEvenYear(result.rows, baseline, result.graduationAge);
        return [{ index, sel, ctx, result, series: cumulativeSeries(result.rows, HORIZON), breakEven: be && be.age > 18 ? be.age : null, label: `${ctx.college.shortName} ${ctx.major.name}` }];
      }),
    [paths, contexts, baseline],
  );

  const value = useMemo<Store>(
    () => ({ paths, active, setActive, setPath, futures, baseline, baselineSeries, colleges: seed.colleges, majors: seed.majors, loading, error }),
    [paths, active, setPath, futures, baseline, baselineSeries, seed.colleges, seed.majors, loading, error],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useScenario(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useScenario must be used inside <ScenarioProvider>");
  return s;
}

/** Path number label, "01"–"03". */
export const pathNo = (i: number) => String(i + 1).padStart(2, "0");
/** Trace token per path slot (01 → a, 02 → b, 03 → d; c is reserved for "work"). */
export const PATH_TRACE = ["a", "b", "d"] as const;
export const PATH_VAR = ["var(--trace-a)", "var(--trace-b)", "var(--trace-d)"] as const;
export const PATH_DASH = [undefined, undefined, "2 4"] as const;
