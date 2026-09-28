"""
Load the demo dataset into the database.

    npm run export:seed                # from the repo root: writes backend/data/seed.json
    python -m app.seed                 # creates tables (if needed) and loads it

Every row is attached to a dataset version flagged `is_demo=True`, so demo data
is always distinguishable from live data (spec §69).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy import delete
from sqlalchemy.orm import Session

from . import models as m
from .db import SessionLocal, engine

SEED_PATH = Path(__file__).resolve().parent.parent / "data" / "seed.json"
PERCENTILES = {"p10": 10, "p25": 25, "p50": 50, "p75": 75, "p90": 90}


def _lineage(metric: dict, versions: dict[str, int]) -> dict:
    lin = metric["lineage"]
    return {
        "dataset_version_id": versions[lin["sourceId"]],
        "data_year": str(lin["year"]),
        "population": lin.get("population"),
        "sample_size": lin.get("sampleSize"),
        "confidence": lin.get("confidence", "moderate"),
    }


def load(session: Session, data: dict) -> dict[str, int]:
    # Clear in dependency order so the seed is re-runnable.
    for table in reversed(m.Base.metadata.sorted_tables):
        session.execute(delete(table))

    for meth in data["methodologies"]:
        session.add(m.Methodology(id=meth["id"], title=meth["title"], simple=meth["simple"], body=meth["body"], formula=meth.get("formula"), limitations=meth.get("limitations")))
    session.flush()

    versions: dict[str, int] = {}
    for src in data["sources"]:
        session.add(m.DataSource(id=src["id"], publisher=src["publisher"], name=src["name"], dataset=src["dataset"], url=src["url"], quality=src["quality"], methodology_id=src["methodologyId"] if src["methodologyId"] in {x["id"] for x in data["methodologies"]} else None))
    session.flush()
    for src in data["sources"]:
        v = m.DatasetVersion(source_id=src["id"], release_label="Seeded demo dataset", data_year="demo", processing_version="demo-1", is_demo=True, is_published=True, notes="Seeded demo values shaped like the source; not live data.")
        session.add(v)
        session.flush()
        versions[src["id"]] = v.id

    for c in data["cities"]:
        session.add(m.City(id=c["id"], name=c["name"], state=c["state"]))
        session.add(m.CostOfLiving(city_id=c["id"], rpp_all_items=c["rpp"]["value"], median_rent_1br=c["rent1br"]["value"], **_lineage(c["rpp"], versions)))
        session.add(m.TaxData(state=c["state"], city_id=c["id"], effective_rate=c["stateTaxRate"], dataset_version_id=versions["irs-brackets"], data_year="2024", population="Approximate effective state and local rate", confidence="moderate"))
    session.flush()

    for o in data["occupations"]:
        session.add(m.Occupation(id=o["id"], soc_code=o["soc"], title=o["title"], category=o["category"], typical_education=o["typicalEducation"], top_metros=o["topMetros"]))
        session.add(m.CareerSalaryData(occupation_id=o["id"], city_id=None, median_wage=o["medianWage"]["value"], **_lineage(o["medianWage"], versions)))
        session.add(m.CareerGrowthData(occupation_id=o["id"], growth_10yr_pct=o["growth10yr"]["value"], **_lineage(o["growth10yr"], versions)))
    session.flush()

    for mj in data["majors"]:
        session.add(m.Major(id=mj["id"], cip_code=mj["cip"], name=mj["name"], category=mj["category"], blurb=mj["blurb"], industries=mj["industries"]))
        session.flush()
        early = m.MajorEarnings(major_id=mj["id"], college_id=None, career_stage="early", median=mj["earlyCareer"]["value"]["p50"], **_lineage(mj["earlyCareer"], versions))
        session.add(early)
        session.add(m.MajorEarnings(major_id=mj["id"], college_id=None, career_stage="mid", median=mj["midCareerMedian"]["value"], **_lineage(mj["midCareerMedian"], versions)))
        session.flush()
        for k, pct in PERCENTILES.items():
            session.add(m.SalaryPercentile(major_earnings_id=early.id, percentile=pct, amount=mj["earlyCareer"]["value"][k], **_lineage(mj["earlyCareer"], versions)))
        session.add(m.MajorEmployment(major_id=mj["id"], unemployment_rate=mj["unemploymentRate"]["value"], underemployment_rate=mj["underemploymentRate"]["value"], grad_school_rate=mj["gradSchoolRate"]["value"], months_to_first_job=mj["monthsToFirstJob"]["value"], **_lineage(mj["unemploymentRate"], versions)))
        session.add(m.EmploymentRate(major_id=mj["id"], city_id=None, employment_rate=mj["employmentRate"]["value"], **_lineage(mj["employmentRate"], versions)))
        for occ in mj["occupations"]:
            session.add(m.MajorOccupationMapping(major_id=mj["id"], occupation_id=occ["occupationId"], share=occ["share"]))
    session.flush()

    for c in data["colleges"]:
        costs = c["costs"]
        college = m.College(id=c["id"], unit_id=c["unitId"], name=c["name"], short_name=c["shortName"], state=c["state"], control=c["control"], undergrad_enrollment=c["undergradEnrollment"]["value"], acceptance_rate=c["acceptanceRate"]["value"], earnings_factor=c["earningsFactor"], is_demo=True)
        college.location = m.CollegeLocation(city=c["city"], state=c["state"], metro_city_id=c["cityId"])
        session.add(college)
        session.add(m.CollegeCost(college_id=c["id"], academic_year="2023-24", tuition_in_state=costs["tuitionInState"]["value"], tuition_out_of_state=costs["tuitionOutOfState"]["value"], fees=costs["fees"]["value"], room=costs["room"]["value"], board=costs["board"]["value"], books=costs["books"]["value"], transportation=costs["transportation"]["value"], misc=costs["misc"]["value"], net_price=costs["netPrice"]["value"], **_lineage(costs["tuitionInState"], versions)))
        session.add(m.CollegeFinancialAid(college_id=c["id"], academic_year="2022-23", pct_receiving_grants=c["aid"]["pctReceivingGrants"]["value"], avg_grant=c["aid"]["avgGrant"]["value"], pct_borrowing=c["aid"]["pctBorrowing"]["value"], **_lineage(c["aid"]["avgGrant"], versions)))
        session.add(m.CollegeCompletion(college_id=c["id"], cohort_year="2017", grad_rate_4yr=c["gradRate4"]["value"], grad_rate_6yr=c["gradRate6"]["value"], **_lineage(c["gradRate6"], versions)))
        session.add(m.CollegeDebt(college_id=c["id"], academic_year="2022-23", median_debt=c["medianDebt"]["value"], median_earnings_10yr=c["medianEarnings"]["value"], **_lineage(c["medianDebt"], versions)))
    session.flush()

    for o in data["outcomes"]:
        session.add(m.CollegeMajor(college_id=o["collegeId"], major_id=o["majorId"], has_field_of_study_data=not o["isFallback"], employment_rate=o["employmentRate"]["value"]))
        session.add(m.MajorEarnings(major_id=o["majorId"], college_id=o["collegeId"], career_stage="mid", median=o["midCareerMedian"]["value"], is_fallback=o["isFallback"], **_lineage(o["midCareerMedian"], versions)))
        early = m.MajorEarnings(major_id=o["majorId"], college_id=o["collegeId"], career_stage="early", median=o["earlyCareer"]["value"]["p50"], is_fallback=o["isFallback"], **_lineage(o["earlyCareer"], versions))
        session.add(early)
        session.flush()
        for k, pct in PERCENTILES.items():
            session.add(m.SalaryPercentile(major_earnings_id=early.id, percentile=pct, amount=o["earlyCareer"]["value"][k], **_lineage(o["earlyCareer"], versions)))
    session.commit()
    return {"colleges": len(data["colleges"]), "majors": len(data["majors"]), "occupations": len(data["occupations"]), "cities": len(data["cities"]), "programs": len(data["outcomes"])}


def main() -> None:
    if not SEED_PATH.exists():
        sys.exit(f"{SEED_PATH} not found. Run `npm run export:seed` from the repo root first.")
    m.Base.metadata.create_all(engine)
    data = json.loads(SEED_PATH.read_text())
    with SessionLocal() as session:
        counts = load(session, data)
    print("Loaded demo dataset:", ", ".join(f"{v} {k}" for k, v in counts.items()))


if __name__ == "__main__":
    main()
