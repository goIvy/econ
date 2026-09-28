/** Research studies computed from the seed data (server). */
import "server-only";
import { listColleges, listMajors } from "@/services/data";
import { NO_COLLEGE, crossingAge, impliedGrowth, twoStudents } from "@/lib/calc";

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function priceVsEarnings() {
  const pts = listColleges()
    .filter((c) => c.costs.netPrice.value != null && c.medianEarnings.value != null)
    .map((c) => ({ id: c.id, name: c.shortName, control: c.control, price: c.costs.netPrice.value!, earnings: c.medianEarnings.value! }));
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.price, 0) / n;
  const my = pts.reduce((s, p) => s + p.earnings, 0) / n;
  const cov = pts.reduce((s, p) => s + (p.price - mx) * (p.earnings - my), 0);
  const vx = pts.reduce((s, p) => s + (p.price - mx) ** 2, 0);
  const vy = pts.reduce((s, p) => s + (p.earnings - my) ** 2, 0);
  return { pts, r: cov / Math.sqrt(vx * vy), lineage: listColleges()[0].medianEarnings.lineage };
}

/** Break-even age by major in the teaching model, at the median public net price. */
export function breakEvenByMajor() {
  const cost = median(listColleges().filter((c) => c.control === "public").map((c) => c.costs.netPrice.value ?? 0));
  const workerGrowth = impliedGrowth(NO_COLLEGE.startSalary, NO_COLLEGE.midCareer);
  const rows = listMajors().flatMap((m) => {
    const p50 = m.earlyCareer.value?.p50;
    const mid = m.midCareerMedian.value;
    if (!p50 || !mid) return [];
    const age = crossingAge(twoStudents({ costPerYear: cost, yearsInCollege: 4, graduateSalary: p50, graduateGrowth: impliedGrowth(p50, mid), workerSalary: NO_COLLEGE.startSalary, workerGrowth, horizonAge: 45 }));
    return [{ id: m.id, name: m.name, category: m.category, age, salary: p50 }];
  });
  rows.sort((a, b) => (a.age ?? 99) - (b.age ?? 99));
  return { rows, cost };
}
