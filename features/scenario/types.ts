import type { LivingArrangement, Residency } from "@/types";

/** One future: the choices that define a path. */
export interface PathSel {
  collegeId: string;
  majorId: string;
  residency: Residency;
  /** Grant aid per year. */
  aid: number;
  living: LivingArrangement;
}

export interface CollegeLite {
  id: string;
  name: string;
  shortName: string;
  state: string;
  control: "public" | "private";
  majorIds: string[];
}
