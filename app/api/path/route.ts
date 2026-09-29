import { NextResponse } from "next/server";
import { runPath } from "@/services/data";
import { DEFAULT_RATES } from "@/lib/calc";
import { lineage } from "@/data/sources";
import { PathRequestSchema } from "@/lib/api/path-schema";
import type { PathResponse } from "@/lib/api/path-response";
import { rateLimit } from "@/lib/api/rate-limit";

export async function POST(req: Request) {
  const limited = rateLimit(req);
  if (limited) return limited;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const parsed = PathRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Some inputs are invalid.", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 422 });
  }
  const body = parsed.data;
  const loanType = body.loan?.type ?? "federal-unsubsidized";
  const ratePct = body.loan?.ratePct ?? DEFAULT_RATES[loanType];

  const run = runPath({
    collegeId: body.collegeId,
    majorId: body.majorId,
    residency: body.residency,
    living: body.living,
    yearsToGraduate: body.yearsToGraduate,
    careerCityId: body.careerCityId,
    funding: body.funding,
    options: { loanType, loanRatePct: ratePct, loanTermYears: body.loan?.termYears ?? 10, horizonAge: body.horizonAge },
  });
  if (!run) {
    return NextResponse.json({ error: "That college doesn't offer this major in our data. Try another major, or view institution-wide outcomes." }, { status: 404 });
  }

  const { college, major, outcome, result, baseline, breakEven } = run;
  const res: PathResponse = {
    college: { id: college.id, name: college.name, shortName: college.shortName, control: college.control, state: college.state, city: college.city },
    major: { id: major.id, name: major.name },
    residency: body.residency,
    living: body.living,
    costLines: result.costLines,
    net: result.net,
    loan: {
      principal: result.loan.principal,
      monthlyPayment: result.loan.monthlyPayment,
      totalInterest: result.loan.totalInterest,
      totalRepayment: result.loan.totalRepayment,
      payoffYears: result.loan.payoffYears,
      ratePct,
      schedule: result.loan.schedule,
    },
    startingSalary: result.startingSalary,
    percentiles: outcome.earlyCareer.value,
    employmentRate: result.employmentRate,
    tenYearEarnings: result.tenYearEarnings,
    graduationAge: result.graduationAge,
    breakEven,
    series: result.rows.map((r) => ({ age: r.age, cumulative: Math.round(r.cumulative) })),
    baseline: baseline.map((r) => ({ age: r.age, cumulative: Math.round(r.cumulative) })),
    isFallback: outcome.isFallback,
    gradRate4: college.gradRate4.value,
    gradRate6: college.gradRate6.value,
    lineage: {
      netCost: college.costs.tuitionInState.lineage,
      earnings: outcome.earlyCareer.lineage,
      employment: outcome.employmentRate.lineage,
      loanRate: lineage("fsa-rates", "2024-25", "Loans first disbursed July 1, 2024 - June 30, 2025"),
      model: lineage("cvl-model", 2024, "Calculated from your inputs and the datasets above", { note: "Break-even and projected earnings are estimates in 2024 dollars." }),
      gradRate: college.gradRate6.lineage,
    },
  };
  return NextResponse.json(res, { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } });
}
