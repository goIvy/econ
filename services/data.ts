/**
 * Data access. Every page and API route reads through these functions.
 * Today they read seeded data (data/build.ts); set CVL_API_URL to point them at
 * the FastAPI service when it is live, without changing any component.
 */
import "server-only";
import type { City, College, CollegeMajorOutcome, Major, Occupation, PathInputs } from "@/types";
import { CITIES, COLLEGES, MAJORS, OCCUPATIONS, buildOutcome } from "@/data/build";
import { projectNoCollege, projectPath, calculateBreakEvenYear, type ProjectionOptions } from "@/lib/calc";

const collegeById = new Map(COLLEGES.map((c) => [c.id, c]));
const majorById = new Map(MAJORS.map((m) => [m.id, m]));
const cityById = new Map(CITIES.map((c) => [c.id, c]));
const occupationById = new Map(OCCUPATIONS.map((o) => [o.id, o]));

export const getCollege = (id: string): College | undefined => collegeById.get(id);
export const getMajor = (id: string): Major | undefined => majorById.get(id);
export const getCity = (id: string): City | undefined => cityById.get(id);
export const getOccupation = (id: string): Occupation | undefined => occupationById.get(id);
export const listColleges = (): College[] => COLLEGES;
export const listMajors = (): Major[] => MAJORS;
export const listCities = (): City[] => CITIES;
export const listOccupations = (): Occupation[] => OCCUPATIONS;

export function getOutcome(collegeId: string, majorId: string): CollegeMajorOutcome | null {
  return buildOutcome(collegeId, majorId);
}

/** Light records for pickers (keeps client bundles small). */
export interface CollegeOption { id: string; name: string; shortName: string; city: string; state: string; control: College["control"] }
export interface MajorOption { id: string; name: string; category: Major["category"] }

export const collegeOptions = (): CollegeOption[] =>
  COLLEGES.map(({ id, name, shortName, city, state, control }) => ({ id, name, shortName, city, state, control })).sort((a, b) => a.shortName.localeCompare(b.shortName));
export const majorOptions = (): MajorOption[] =>
  MAJORS.map(({ id, name, category }) => ({ id, name, category })).sort((a, b) => a.name.localeCompare(b.name));

// ---------------------------------------------------------------- search

export interface CollegeFilters {
  q?: string;
  control?: "public" | "private";
  state?: string;
  maxTuition?: number;
  maxNetPrice?: number;
  minGradRate?: number;
  maxAcceptance?: number;
  size?: "small" | "medium" | "large";
  maxDebt?: number;
  minEarnings?: number;
  major?: string;
  sort?: "name" | "net-price" | "earnings" | "grad-rate" | "debt";
}

const SIZE_RANGES: Record<NonNullable<CollegeFilters["size"]>, [number, number]> = {
  small: [0, 5000],
  medium: [5000, 20000],
  large: [20000, Infinity],
};

export function searchColleges(f: CollegeFilters): College[] {
  const q = f.q?.trim().toLowerCase();
  let out = COLLEGES.filter((c) => {
    if (q) {
      const hay = `${c.name} ${c.shortName} ${c.city} ${c.state} ${STATE_NAMES[c.state] ?? ""}`.toLowerCase();
      if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
    }
    if (f.control && c.control !== f.control) return false;
    if (f.state && c.state !== f.state) return false;
    if (f.maxTuition != null && (c.costs.tuitionInState.value ?? 0) + (c.costs.fees.value ?? 0) > f.maxTuition) return false;
    if (f.maxNetPrice != null && (c.costs.netPrice.value ?? Infinity) > f.maxNetPrice) return false;
    if (f.minGradRate != null && (c.gradRate6.value ?? 0) < f.minGradRate) return false;
    if (f.maxAcceptance != null && (c.acceptanceRate.value ?? 100) > f.maxAcceptance) return false;
    if (f.size) {
      const [lo, hi] = SIZE_RANGES[f.size];
      const n = c.undergradEnrollment.value ?? 0;
      if (n < lo || n >= hi) return false;
    }
    if (f.maxDebt != null && (c.medianDebt.value ?? Infinity) > f.maxDebt) return false;
    if (f.minEarnings != null && (c.medianEarnings.value ?? 0) < f.minEarnings) return false;
    if (f.major && !c.majorIds.includes(f.major)) return false;
    return true;
  });
  const by: Record<NonNullable<CollegeFilters["sort"]>, (a: College, b: College) => number> = {
    name: (a, b) => a.shortName.localeCompare(b.shortName),
    "net-price": (a, b) => (a.costs.netPrice.value ?? 0) - (b.costs.netPrice.value ?? 0),
    earnings: (a, b) => (b.medianEarnings.value ?? 0) - (a.medianEarnings.value ?? 0),
    "grad-rate": (a, b) => (b.gradRate6.value ?? 0) - (a.gradRate6.value ?? 0),
    debt: (a, b) => (a.medianDebt.value ?? 0) - (b.medianDebt.value ?? 0),
  };
  out = [...out].sort(by[f.sort ?? "name"]);
  return out;
}

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AZ: "Arizona", CA: "California", CO: "Colorado", CT: "Connecticut", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", IA: "Iowa", IL: "Illinois", IN: "Indiana", KS: "Kansas", KY: "Kentucky",
  LA: "Louisiana", MA: "Massachusetts", MD: "Maryland", MI: "Michigan", MN: "Minnesota", MO: "Missouri",
  NC: "North Carolina", NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NV: "Nevada",
  NY: "New York", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia", WA: "Washington", WI: "Wisconsin",
  AK: "Alaska", AR: "Arkansas", DE: "Delaware", HI: "Hawaii", ID: "Idaho", ME: "Maine", MS: "Mississippi",
  MT: "Montana", ND: "North Dakota", SD: "South Dakota", VT: "Vermont", WV: "West Virginia", WY: "Wyoming",
};

export const statesWithColleges = (): string[] => [...new Set(COLLEGES.map((c) => c.state))].sort();

// ---------------------------------------------------------------- paths

export interface PathRequest extends PathInputs {
  options?: ProjectionOptions;
}

/** Run a path end to end; returns null if the college doesn't offer the major. */
export function runPath(req: PathRequest) {
  const college = getCollege(req.collegeId);
  const major = getMajor(req.majorId);
  if (!college || !major) return null;
  const outcome = getOutcome(college.id, major.id);
  if (!outcome) return null;
  const collegeCity = getCity(college.cityId) ?? null;
  const careerCity = req.careerCityId ? getCity(req.careerCityId) ?? collegeCity : collegeCity;
  const result = projectPath(req, { college, major, outcome, collegeCity, careerCity }, req.options);
  const baseline = projectNoCollege({ horizonAge: req.options?.horizonAge, stateRate: careerCity?.stateTaxRate });
  const breakEven = calculateBreakEvenYear(result.rows, baseline, result.graduationAge);
  return { college, major, outcome, collegeCity, careerCity, result, baseline, breakEven };
}

/** Is `state` the college's home state (for the default residency)? */
export function defaultResidency(college: College, homeState?: string): "resident" | "nonresident" {
  if (!homeState) return "resident";
  return college.state === homeState ? "resident" : "nonresident";
}
