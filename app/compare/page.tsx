import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/site/page-shell";
import { CompareWorkspace, type CollegeMeta } from "@/features/comparison/compare-workspace";
import type { PathSpec } from "@/hooks/use-paths";
import { getCollege, getMajor, listColleges, majorOptions } from "@/services/data";

export async function generateMetadata(props: PageProps<"/compare">): Promise<Metadata> {
  const specs = parse(await props.searchParams);
  if (!specs.length) return { title: "Compare college paths" };
  const names = specs.map((s) => `${getCollege(s.collegeId)?.shortName} ${getMajor(s.majorId)?.name}`).join(" vs ");
  return {
    title: `${names} | Compare`,
    description: `Side-by-side net cost, debt, earnings and break-even for ${names}. Every figure sourced.`,
    openGraph: { title: `${names} | College Value Lab` },
  };
}

const DEFAULT_ORDER = ["economics", "business-administration", "computer-science", "psychology", "biology"];
const LIVING: Record<string, PathSpec["living"]> = { c: "campus", h: "home", o: "off-campus" };

/** Parse `?p=college.major.r|n.c|h|o.aid,...` or `?c=collegeId,...` (from the compare tray). */
function parse(sp: Record<string, string | string[] | undefined>): PathSpec[] {
  const out: PathSpec[] = [];
  const p = typeof sp.p === "string" ? sp.p : "";
  for (const part of p.split(",").filter(Boolean).slice(0, 5)) {
    const [collegeId, majorId, r, l, aid] = part.split(".");
    const college = getCollege(collegeId);
    if (!college) continue;
    const major = college.majorIds.includes(majorId) ? majorId : DEFAULT_ORDER.find((m) => college.majorIds.includes(m)) ?? college.majorIds[0];
    const a = Number(aid);
    out.push({
      collegeId,
      majorId: major,
      residency: r === "n" && college.control === "public" ? "nonresident" : "resident",
      living: LIVING[l] ?? "campus",
      aid: Number.isFinite(a) && a >= 0 && a <= 100000 ? Math.round(a) : Math.round((college.aid.avgGrant.value ?? 0) / 500) * 500,
    });
  }
  const c = typeof sp.c === "string" ? sp.c : "";
  for (const id of c.split(",").filter(Boolean)) {
    if (out.length >= 5) break;
    const college = getCollege(id);
    if (!college || out.some((x) => x.collegeId === id)) continue;
    out.push({
      collegeId: id,
      majorId: DEFAULT_ORDER.find((m) => college.majorIds.includes(m)) ?? college.majorIds[0],
      residency: "resident",
      living: "campus",
      aid: Math.round((college.aid.avgGrant.value ?? 0) / 500) * 500,
    });
  }
  return out;
}

/** `?f=family.work.savings.plannedLoan` from onboarding; defaults otherwise. */
function parseFunding(sp: Record<string, string | string[] | undefined>) {
  const raw = typeof sp.f === "string" ? sp.f.split(".").map((v) => Number(v)) : [];
  const ok = (n: number | undefined, max: number) => (n != null && Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n) : undefined);
  return {
    familyPerYear: ok(raw[0], 200000) ?? 10000,
    workPerYear: ok(raw[1], 50000) ?? 3000,
    savings: ok(raw[2], 500000) ?? 0,
    plannedLoan: ok(raw[3], 500000) ?? 0,
  };
}

export default async function ComparePage(props: PageProps<"/compare">) {
  const sp = await props.searchParams;
  const initial = parse(sp);
  const funding = parseFunding(sp);
  const colleges: CollegeMeta[] = listColleges()
    .map((c) => ({ id: c.id, name: c.name, shortName: c.shortName, city: c.city, state: c.state, control: c.control, avgGrant: c.aid.avgGrant.value ?? 0, majorIds: c.majorIds }))
    .sort((a, b) => a.shortName.localeCompare(b.shortName));
  const majors = majorOptions().map((m) => ({ id: m.id, name: m.name, category: m.category }));
  return (
    <PageShell
      title="Compare paths"
      lede="Put up to five college paths side by side: cost, debt, graduation, employment, earnings and break-even. Here is how the financial tradeoff changes. No path is declared the winner."
      wide
    >
      <Suspense>
        <CompareWorkspace colleges={colleges} majors={majors} initial={initial} funding={funding} />
      </Suspense>
    </PageShell>
  );
}
