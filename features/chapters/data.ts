/** Server-side inputs for the homepage chapters (seed data only). */
import "server-only";
import { getMajor, listCities, listMajors } from "@/services/data";
import { METRO_XY } from "@/data/geo/us-map";
import type { PathContext } from "@/lib/calc";

export interface TrayCard {
  id: string;
  aid: number;
  ctx: PathContext;
}

/** The comparison tray: eight real college/major pairs. */
export function employmentMajors() {
  return ["computer-science", "economics", "nursing", "psychology", "english"].flatMap((id) => {
    const m = getMajor(id);
    if (!m) return [];
    return [
      {
        id: m.id,
        name: m.name,
        employment: m.employmentRate.value ?? 0,
        unemployment: m.unemploymentRate.value ?? 0,
        gradSchool: m.gradSchoolRate.value ?? 0,
        lineage: m.employmentRate.lineage,
      },
    ];
  });
}

export function salaryMajors() {
  return ["computer-science", "economics", "finance", "nursing", "psychology"].flatMap((id) => {
    const m = getMajor(id);
    return m && m.earlyCareer.value ? [{ id: m.id, name: m.name, p: m.earlyCareer.value, lineage: m.earlyCareer.lineage }] : [];
  });
}

export function cityData() {
  const cities = listCities().filter((c) => METRO_XY[c.id]);
  return {
    cities: cities.map((c) => ({ id: c.id, name: c.name, state: c.state, rpp: c.rpp.value ?? 100, rent: c.rent1br.value ?? 0, tax: c.stateTaxRate, x: METRO_XY[c.id][0], y: METRO_XY[c.id][1] })),
    lineage: cities[0].rpp.lineage,
  };
}

export const majorCount = () => listMajors().length;

/** Inputs for the eight lesson micro-experiences. */
export function lessonInputs() {
  const pick = (id: string) => {
    const c = listCities().find((x) => x.id === id)!;
    return { name: c.name, rpp: c.rpp.value ?? 100, rent: c.rent1br.value ?? 0, tax: c.stateTaxRate };
  };
  const econ = getMajor("economics")!;
  const majors = listMajors();
  const med = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[s.length >> 1];
  };
  return {
    sf: pick("sf"),
    cle: pick("cle"),
    econ: { name: econ.name, p: econ.earlyCareer.value!, employment: econ.employmentRate.value ?? 90 },
    gradStart: med(majors.map((m) => m.earlyCareer.value?.p50 ?? 0)),
    gradMid: med(majors.map((m) => m.midCareerMedian.value ?? 0)),
  };
}
export type LessonInputs = ReturnType<typeof lessonInputs>;
