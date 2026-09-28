/**
 * Server-side data for the homepage salary explorer. Computed from the same
 * services the app uses.
 */
import "server-only";
import { getMajor } from "@/services/data";
import type { Lineage, SalaryPercentiles } from "@/types";

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

