/** Server-side seed for the shared homepage scenario. */
import "server-only";
import { getCity, getCollege, getMajor, getOutcome, listColleges, majorOptions } from "@/services/data";
import type { PathContext } from "@/lib/calc";
import type { PathSel } from "./types";

export const DEFAULT_PATHS: [PathSel, PathSel, PathSel] = [
  { collegeId: "uc-berkeley", majorId: "economics", residency: "resident", aid: 15000, living: "campus" },
  { collegeId: "nyu", majorId: "finance", residency: "resident", aid: 30000, living: "campus" },
  { collegeId: "san-jose-state", majorId: "economics", residency: "resident", aid: 8000, living: "campus" },
];

export function contextFor(collegeId: string, majorId: string): PathContext | null {
  const college = getCollege(collegeId);
  const major = getMajor(majorId);
  const outcome = college && major ? getOutcome(college.id, major.id) : null;
  if (!college || !major || !outcome) return null;
  const city = getCity(college.cityId) ?? null;
  return { college, major, outcome, collegeCity: city, careerCity: city };
}

export function scenarioSeed() {
  const contexts: Record<string, PathContext> = {};
  for (const p of DEFAULT_PATHS) contexts[`${p.collegeId}.${p.majorId}`] = contextFor(p.collegeId, p.majorId)!;
  return {
    paths: DEFAULT_PATHS,
    contexts,
    colleges: listColleges()
      .map((c) => ({ id: c.id, name: c.name, shortName: c.shortName, state: c.state, control: c.control, majorIds: c.majorIds }))
      .sort((a, b) => a.shortName.localeCompare(b.shortName)),
    majors: majorOptions().map((m) => ({ id: m.id, name: m.name })),
  };
}

export type ScenarioSeed = ReturnType<typeof scenarioSeed>;
