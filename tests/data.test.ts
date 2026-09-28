import { describe, expect, it } from "vitest";
import { CITIES, COLLEGES, MAJORS, OCCUPATIONS, buildOutcome } from "@/data/build";
import { runPath, searchColleges } from "@/services/data";
import { OCCUPATION_ROWS } from "@/data/seed/occupations";

describe("seed data", () => {
  it("meets the minimum demo dataset sizes", () => {
    expect(COLLEGES.length).toBeGreaterThanOrEqual(100);
    expect(MAJORS.length).toBeGreaterThanOrEqual(50);
    expect(OCCUPATIONS.length).toBeGreaterThanOrEqual(100);
    expect(CITIES.length).toBeGreaterThanOrEqual(50);
  });
  it("has unique ids", () => {
    for (const list of [COLLEGES, MAJORS, OCCUPATIONS, CITIES]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
    }
  });
  it("tags every statistic as demo data with lineage", () => {
    for (const c of COLLEGES) {
      expect(c.medianEarnings.lineage.demo).toBe(true);
      expect(c.costs.netPrice.lineage.sourceId).toBeTruthy();
    }
  });
  it("orders salary percentiles", () => {
    for (const m of MAJORS) {
      const p = m.earlyCareer.value!;
      expect(p.p10).toBeLessThan(p.p25);
      expect(p.p25).toBeLessThan(p.p50);
      expect(p.p50).toBeLessThan(p.p75);
      expect(p.p75).toBeLessThan(p.p90);
    }
  });
  it("maps every major's occupations to known occupations", () => {
    const ids = new Set(OCCUPATION_ROWS.map((o) => o[0]));
    for (const m of MAJORS) for (const o of m.occupations) expect(ids.has(o.occupationId)).toBe(true);
  });
  it("keeps 4-year graduation rates below 6-year rates", () => {
    for (const c of COLLEGES) expect(c.gradRate4.value!).toBeLessThanOrEqual(c.gradRate6.value!);
  });
  it("only builds outcomes for offered majors", () => {
    expect(buildOutcome("spelman", "mechanical-engineering")).toBeNull();
    expect(buildOutcome("uc-berkeley", "economics")).not.toBeNull();
  });
});

describe("search", () => {
  it("finds colleges by name, city or state", () => {
    expect(searchColleges({ q: "berkeley" }).map((c) => c.id)).toContain("uc-berkeley");
    expect(searchColleges({ q: "boston" }).length).toBeGreaterThan(1);
    expect(searchColleges({ q: "california" }).every((c) => c.state === "CA")).toBe(true);
  });
  it("applies filters", () => {
    const pub = searchColleges({ control: "public", minGradRate: 90 });
    expect(pub.length).toBeGreaterThan(0);
    expect(pub.every((c) => c.control === "public" && c.gradRate6.value! >= 90)).toBe(true);
  });
});

describe("path scenarios", () => {
  const base = { majorId: "economics", living: "campus" as const, yearsToGraduate: 4, funding: { aidPerYear: 15000, scholarshipsPerYear: 0, familyPerYear: 5000, workPerYear: 2000, savings: 0 } };
  it("runs a full path with a break-even point", () => {
    const r = runPath({ ...base, collegeId: "uc-berkeley", residency: "resident" })!;
    expect(r.result.net.netPrice).toBeGreaterThan(0);
    expect(r.result.startingSalary).toBeGreaterThan(40000);
    expect(r.breakEven).not.toBeNull();
  });
  it("non-residency raises debt and delays break-even", () => {
    const res = runPath({ ...base, collegeId: "uc-berkeley", residency: "resident" })!;
    const non = runPath({ ...base, collegeId: "uc-berkeley", residency: "nonresident" })!;
    expect(non.result.net.borrowing).toBeGreaterThan(res.result.net.borrowing);
    expect(non.breakEven!.age).toBeGreaterThan(res.breakEven!.age);
  });
  it("returns null for a major the college doesn't offer", () => {
    expect(runPath({ ...base, collegeId: "spelman", majorId: "mechanical-engineering", residency: "resident" })).toBeNull();
  });
});
