import { NextResponse } from "next/server";
import { z } from "zod";
import { getCity, getCollege, getMajor, getOutcome } from "@/services/data";
import { rateLimit } from "@/lib/api/rate-limit";

const Query = z.object({
  college: z.string().regex(/^[a-z0-9-]{2,64}$/),
  major: z.string().regex(/^[a-z0-9-]{2,64}$/),
});

/**
 * GET /api/context?college=…&major=… → everything the client-side model
 * needs to project one path (college, major, program outcome, cities).
 * The calculation itself runs in the browser with lib/calc, so every slider
 * is instant.
 */
export async function GET(req: Request) {
  const limited = rateLimit(req);
  if (limited) return limited;
  const url = new URL(req.url);
  const parsed = Query.safeParse({ college: url.searchParams.get("college"), major: url.searchParams.get("major") });
  if (!parsed.success) return NextResponse.json({ error: "Pick a college and a major." }, { status: 422 });
  const college = getCollege(parsed.data.college);
  const major = getMajor(parsed.data.major);
  const outcome = college && major ? getOutcome(college.id, major.id) : null;
  if (!college || !major || !outcome) return NextResponse.json({ error: "That college doesn't offer this major in our data." }, { status: 404 });
  const collegeCity = getCity(college.cityId) ?? null;
  return NextResponse.json(
    { college, major, outcome, collegeCity, careerCity: collegeCity },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
  );
}
