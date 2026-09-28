/** Server-side inputs for the economics lessons (seed data only). */
import "server-only";
import { getCity, getMajor } from "@/services/data";
import { pathPresets, twoStudentsDefaults } from "@/features/experience/data";

export const LESSONS = [
  { slug: "cheaper-can-win", short: "When cheaper wins", title: "Why does a cheaper college sometimes outperform an expensive one?", teaser: "Lower cost, similar pay: the lines cross sooner than you'd think." },
  { slug: "opportunity-cost", short: "What you give up", title: "What are you really giving up?", teaser: "Tuition is only part of the price. The rest is what you didn't earn. Economists call this opportunity cost." },
  { slug: "average-salary", short: "Averages mislead", title: "Why is average salary misleading?", teaser: "A few very high earners pull the average up. The median barely moves." },
  { slug: "debt-compounds", short: "Debt compounds", title: "How does debt compound?", teaser: "Unpaid interest becomes principal, and then earns interest itself." },
  { slug: "purchasing-power", short: "What your salary buys", title: "What can your salary actually buy?", teaser: "The same salary buys a different life in a different city, and a different year. Economists call this purchasing power." },
] as const;

export type LessonSlug = (typeof LESSONS)[number]["slug"];

export function lessonData() {
  const presets = pathPresets();
  const cheap = presets.find((p) => p.key === "d")!;
  const pricey = presets.find((p) => p.key === "b")!;
  const econ = getMajor("economics")!;
  const cities = ["sf", "chi", "hou"].map((id) => {
    const c = getCity(id)!;
    return { id: c.id, name: c.name, rpp: c.rpp.value ?? 100 };
  });
  return {
    cheap,
    pricey,
    opportunity: twoStudentsDefaults(),
    salary: { major: econ.name, p: econ.earlyCareer.value!, lineage: econ.earlyCareer.lineage },
    cities,
  };
}

export type LessonData = ReturnType<typeof lessonData>;
