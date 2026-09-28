/**
 * Server-side inputs for the interactive homepage. Everything here comes from
 * the seeded data and the calculation engine; the client components only
 * animate and re-run the same pure functions when the user changes something.
 */
import "server-only";
import { getCity, getCollege, getMajor, getOutcome, listCities, listColleges, listMajors, runPath } from "@/services/data";
import { annualCostLines, NO_COLLEGE, type PathContext } from "@/lib/calc";
import { lineage } from "@/data/sources";
import { METRO_XY } from "@/data/geo/us-map";
import type { FundingInputs, Lineage, PathInputs } from "@/types";

export const DEMO_FUNDING: FundingInputs = { aidPerYear: 0, scholarshipsPerYear: 0, familyPerYear: 10000, workPerYear: 3000, savings: 0 };

export interface PathPreset {
  /** Path letter. C is reserved site-wide for "work from 18", so presets are A, B, D. */
  key: "a" | "b" | "d";
  /** Short label, e.g. "UC Berkeley Economics". */
  label: string;
  kind: string;
  inputs: PathInputs;
  ctx: PathContext;
}

function preset(key: PathPreset["key"], kind: string, collegeId: string, majorId: string, aid: number): PathPreset {
  const college = getCollege(collegeId)!;
  const major = getMajor(majorId)!;
  const outcome = getOutcome(collegeId, majorId)!;
  const collegeCity = getCity(college.cityId) ?? null;
  return {
    key,
    kind,
    label: `${college.shortName} ${major.name}`,
    inputs: { collegeId, majorId, residency: "resident", living: "campus", yearsToGraduate: 4, funding: { ...DEMO_FUNDING, aidPerYear: aid } },
    ctx: { college, major, outcome, collegeCity, careerCity: collegeCity },
  };
}

/** The three paths the flagship components share. */
export function pathPresets(): PathPreset[] {
  return [
    preset("a", "Public university", "uc-berkeley", "economics", 15000),
    preset("b", "Private university", "nyu", "finance", 30000),
    preset("d", "Public university", "san-jose-state", "economics", 8000),
  ];
}

/** Hero: public vs private vs working from 18. */
export function heroPaths() {
  const [pub, priv] = pathPresets();
  return { public: pub, private: priv, noCollege: NO_COLLEGE };
}

/** Net-cost story: every line of one college's annual cost, then aid, for each living arrangement. */
export function netCostStory(collegeId = "nyu") {
  const college = getCollege(collegeId)!;
  const city = getCity(college.cityId) ?? null;
  const grant = college.aid.avgGrant.value ?? 0;
  const byLiving = Object.fromEntries(
    (["campus", "off-campus", "home"] as const).map((living) => [
      living,
      annualCostLines(college, "nonresident", living, city)
        .filter((l) => l.perYear > 0)
        .map((l) => ({ key: l.key, label: l.label, amount: Math.round(l.perYear) })),
    ]),
  ) as Record<"campus" | "off-campus" | "home", Array<{ key: string; label: string; amount: number }>>;
  return {
    college: { name: college.name, shortName: college.shortName, control: college.control, city: city?.name ?? college.city },
    byLiving,
    aid: { label: "Grants & scholarships (average)", amount: Math.round(grant), lineage: college.aid.avgGrant.lineage },
    lineage: college.costs.tuitionOutOfState.lineage,
  };
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Opportunity-cost demonstration defaults, derived from the seed data. */
export function twoStudentsDefaults() {
  const publics = listColleges().filter((c) => c.control === "public");
  const costPerYear = Math.round(median(publics.map((c) => c.costs.netPrice.value ?? 0)) / 500) * 500;
  const majors = listMajors();
  const graduateSalary = Math.round(median(majors.map((m) => m.earlyCareer.value?.p50 ?? 0)) / 1000) * 1000;
  const mid = median(majors.map((m) => m.midCareerMedian.value ?? 0));
  const graduateGrowth = Math.round((Math.pow(mid / graduateSalary, 1 / 15) - 1) * 1000) / 1000;
  const workerGrowth = Math.round((Math.pow(NO_COLLEGE.midCareer / NO_COLLEGE.startSalary, 1 / 15) - 1) * 1000) / 1000;
  return {
    costPerYear,
    yearsInCollege: 4,
    graduateSalary,
    graduateGrowth,
    workerSalary: NO_COLLEGE.startSalary,
    workerGrowth,
    lineage: lineage("cvl-model", 2024, "Median public net price and median bachelor's starting salary across the sample; no-college wage from ACS-shaped sample data"),
  };
}

export interface CompareCardData {
  id: string;
  collegeId: string;
  /** Grant aid per year assumed for the card. */
  aid: number;
  name: string;
  shortName: string;
  major: string;
  control: string;
  state: string;
  netPerYear: number;
  net4: number;
  debt: number;
  monthly: number;
  grad6: number;
  salary: number;
  employment: number;
  breakEven: number | null;
  confidence: string;
  isFallback: boolean;
  lineage: { cost: Lineage; earnings: Lineage; grad: Lineage };
}

/** Cards for the drag-to-compare stage. */
export function compareCards(): CompareCardData[] {
  const picks: Array<[string, string, number]> = [
    ["uc-berkeley", "economics", 15000],
    ["nyu", "finance", 30000],
    ["san-jose-state", "economics", 8000],
    ["ut-austin", "computer-science", 10000],
    ["u-michigan", "mechanical-engineering", 12000],
    ["georgia-state", "nursing", 9000],
  ];
  return picks.map(([collegeId, majorId, aid]) => {
    const r = runPath({ collegeId, majorId, residency: "resident", living: "campus", yearsToGraduate: 4, funding: { ...DEMO_FUNDING, aidPerYear: aid }, options: { horizonAge: 45 } })!;
    return {
      id: `${collegeId}.${majorId}`,
      collegeId,
      aid,
      name: r.college.name,
      shortName: r.college.shortName,
      major: r.major.name,
      control: r.college.control,
      state: r.college.state,
      netPerYear: r.result.net.netPrice / 4,
      net4: r.result.net.netPrice,
      debt: r.result.net.borrowing,
      monthly: r.result.loan.monthlyPayment,
      grad6: r.college.gradRate6.value ?? 0,
      salary: r.result.startingSalary,
      employment: r.result.employmentRate * 100,
      breakEven: r.breakEven?.age ?? null,
      confidence: r.outcome.earlyCareer.lineage.confidence,
      isFallback: r.outcome.isFallback,
      lineage: { cost: r.college.costs.netPrice.lineage, earnings: r.outcome.earlyCareer.lineage, grad: r.college.gradRate6.lineage },
    };
  });
}

export interface MapCity {
  id: string;
  name: string;
  state: string;
  rpp: number;
  x: number;
  y: number;
}

export function mapCities() {
  const cities = listCities();
  return {
    cities: cities.filter((c) => METRO_XY[c.id]).map<MapCity>((c) => ({ id: c.id, name: c.name, state: c.state, rpp: c.rpp.value ?? 100, x: METRO_XY[c.id][0], y: METRO_XY[c.id][1] })),
    lineage: cities[0].rpp.lineage,
  };
}
