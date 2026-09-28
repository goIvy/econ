/**
 * Server-side data for the homepage demonstrations. Computed once at build /
 * request time from the same services and calculation engine the app uses.
 */
import "server-only";
import { getCity, getCollege, getMajor, listCities, listMajors, runPath } from "@/services/data";
import { annualCostLines, type CostLine } from "@/lib/calc";
import type { Lineage, SalaryPercentiles } from "@/types";
import { lineage } from "@/data/sources";

const FUNDING = { familyPerYear: 10000, workPerYear: 3000, scholarshipsPerYear: 0, savings: 0 };

export interface SamplePath {
  key: "a" | "b" | "c";
  label: string;
  college: string;
  major: string;
  spec: string;
  netPrice: number;
  debt: number;
  monthly: number;
  startSalary: number;
  breakEvenAge: number | null;
  gradRate6: number;
  series: Array<{ age: number; cumulative: number }>;
  lineage: { cost: Lineage; earnings: Lineage; grad: Lineage; model: Lineage };
}

function sample(key: SamplePath["key"], collegeId: string, majorId: string, residency: "resident" | "nonresident", living: "campus" | "home", aid: number, spec: string): SamplePath {
  const r = runPath({ collegeId, majorId, residency, living, yearsToGraduate: 4, funding: { ...FUNDING, aidPerYear: aid }, options: { horizonAge: 40 } })!;
  return {
    key,
    label: `${r.college.shortName} ${r.major.name}`,
    college: r.college.shortName,
    major: r.major.name,
    spec,
    netPrice: r.result.net.netPrice,
    debt: r.result.net.borrowing,
    monthly: r.result.loan.monthlyPayment,
    startSalary: r.result.startingSalary,
    breakEvenAge: r.breakEven?.age ?? null,
    gradRate6: r.college.gradRate6.value ?? 0,
    series: r.result.rows.map((x) => ({ age: x.age, cumulative: Math.round(x.cumulative) })),
    lineage: {
      cost: r.college.costs.netPrice.lineage,
      earnings: r.outcome.earlyCareer.lineage,
      grad: r.college.gradRate6.lineage,
      model: lineage("cvl-model", 2024, "Calculated from the stated assumptions"),
    },
  };
}

/** Section 3: the spec's sample comparison (UCLA / NYU / SJSU at home). */
export function sampleComparison() {
  const campus = [
    sample("a", "ucla", "economics", "resident", "campus", 15000, "California resident · on campus · $15K/yr aid"),
    sample("b", "nyu", "finance", "resident", "campus", 30000, "Private · on campus · $30K/yr aid"),
    sample("c", "san-jose-state", "economics", "resident", "campus", 8000, "California resident · on campus · $8K/yr aid"),
  ];
  const home = sample("c", "san-jose-state", "economics", "resident", "home", 8000, "California resident · lives at home · $8K/yr aid");
  return { campus, cHome: home };
}

/** Section 4: cost lines for every residency × living combination at one college. */
export function trueCost(collegeId = "ucla") {
  const college = getCollege(collegeId)!;
  const city = getCity(college.cityId) ?? null;
  const combos: Record<string, CostLine[]> = {};
  for (const residency of ["resident", "nonresident"] as const) {
    for (const living of ["campus", "off-campus", "home"] as const) {
      combos[`${residency}:${living}`] = annualCostLines(college, residency, living, city);
    }
  }
  return {
    college: { id: college.id, shortName: college.shortName, name: college.name, state: college.state, city: city?.name ?? college.city },
    combos,
    lineage: college.costs.tuitionInState.lineage,
    avgGrant: college.aid.avgGrant.value ?? 0,
  };
}

export interface MajorRowData {
  id: string;
  name: string;
  category: string;
  early: SalaryPercentiles;
  mid: number;
  unemployment: number;
  underemployment: number;
  gradSchool: number;
  lineage: Lineage;
}

/** Section 5 & 7: majors with distributions. */
export function majorsTable(ids = ["computer-science", "economics", "finance", "nursing", "mechanical-engineering", "business-administration", "biology", "psychology", "english", "elementary-education"]): MajorRowData[] {
  return ids.map((id) => {
    const m = getMajor(id)!;
    return {
      id: m.id,
      name: m.name,
      category: m.category,
      early: m.earlyCareer.value!,
      mid: m.midCareerMedian.value!,
      unemployment: m.unemploymentRate.value!,
      underemployment: m.underemploymentRate.value!,
      gradSchool: m.gradSchoolRate.value!,
      lineage: m.earlyCareer.lineage,
    };
  });
}

export const allMajorCount = () => listMajors().length;

/** Section 6: break-even at several aid levels for one path, both residencies. */
export function breakEvenStudy() {
  const levels = [0, 5000, 10000, 15000, 20000, 25000, 30000];
  const out: Record<string, { series: Array<{ age: number; cumulative: number }>; baseline: Array<{ age: number; cumulative: number }>; breakEven: number | null; netPrice: number; debt: number; opportunityCost: number }> = {};
  for (const residency of ["resident", "nonresident"] as const) {
    for (const aid of levels) {
      const r = runPath({ collegeId: "u-michigan", majorId: "mechanical-engineering", residency, living: "campus", yearsToGraduate: 4, funding: { ...FUNDING, aidPerYear: aid }, options: { horizonAge: 40 } })!;
      out[`${residency}:${aid}`] = {
        series: r.result.rows.map((x) => ({ age: x.age, cumulative: Math.round(x.cumulative) })),
        baseline: r.baseline.map((x) => ({ age: x.age, cumulative: Math.round(x.cumulative) })),
        breakEven: r.breakEven?.age ?? null,
        netPrice: r.result.net.netPrice,
        debt: r.result.net.borrowing,
        opportunityCost: Math.round(r.baseline.slice(0, 4).reduce((s, x) => s + x.afterTaxEarnings, 0)),
      };
    }
  }
  const college = getCollege("u-michigan")!;
  return { levels, out, label: `${college.shortName} Mechanical Engineering`, state: college.state };
}

/** Section 8: metros for the purchasing-power translator. */
export function citiesForTranslator() {
  const ids = ["sf", "nyc", "sea", "bos", "la", "dc", "den", "chi", "aus", "atl", "dal", "phx", "ral", "col", "pit", "stl"];
  const all = listCities();
  return ids.map((id) => all.find((c) => c.id === id)!).map((c) => ({ id: c.id, name: c.name, state: c.state, rpp: c.rpp.value!, lineage: c.rpp.lineage }));
}
