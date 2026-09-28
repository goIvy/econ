/**
 * Exports the seeded demo dataset (the same one the frontend reads) to
 * backend/data/seed.json so the FastAPI service can load it into PostgreSQL.
 *
 *   npx tsx scripts/export-seed.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { CITIES, COLLEGES, MAJORS, OCCUPATIONS, buildOutcome } from "../data/build";
import { SOURCES } from "../data/sources";
import { METHODOLOGIES } from "../data/methodologies";

const outcomes = COLLEGES.flatMap((c) => c.majorIds.map((m) => buildOutcome(c.id, m)).filter(Boolean));
const out = {
  generatedAt: new Date().toISOString(),
  demo: true,
  sources: Object.values(SOURCES),
  methodologies: METHODOLOGIES,
  cities: CITIES,
  occupations: OCCUPATIONS,
  majors: MAJORS,
  colleges: COLLEGES,
  outcomes,
};
const path = join(__dirname, "..", "backend", "data", "seed.json");
writeFileSync(path, JSON.stringify(out));
console.log(`wrote ${path}: ${COLLEGES.length} colleges, ${MAJORS.length} majors, ${OCCUPATIONS.length} occupations, ${CITIES.length} cities, ${outcomes.length} programs`);
