import { z } from "zod";

const money = z.number().finite().min(0).max(1_000_000);

/** Validated request for one path. Shared by the API route and its tests. */
export const PathRequestSchema = z.object({
  collegeId: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  majorId: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  residency: z.enum(["resident", "nonresident"]),
  living: z.enum(["campus", "off-campus", "home"]).default("campus"),
  yearsToGraduate: z.number().int().min(3).max(6).default(4),
  horizonAge: z.number().int().min(30).max(65).default(45),
  careerCityId: z.string().max(10).regex(/^[a-z]+$/).optional(),
  funding: z
    .object({
      aidPerYear: money.default(0),
      scholarshipsPerYear: money.default(0),
      familyPerYear: money.default(0),
      workPerYear: money.default(0),
      savings: money.default(0),
    })
    .default({ aidPerYear: 0, scholarshipsPerYear: 0, familyPerYear: 0, workPerYear: 0, savings: 0 }),
  loan: z
    .object({
      type: z.enum(["federal-subsidized", "federal-unsubsidized", "parent-plus", "private"]).default("federal-unsubsidized"),
      ratePct: z.number().finite().min(0).max(20).optional(),
      termYears: z.number().int().min(5).max(30).default(10),
    })
    .optional(),
});

export type PathRequestBody = z.infer<typeof PathRequestSchema>;
