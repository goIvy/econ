"""
College Value Lab API.

    uvicorn app.main:app --reload

The Next.js frontend reads seeded data directly today; point it at this service
(CVL_API_URL) once PostgreSQL is loaded with live datasets.
"""

from __future__ import annotations

import hmac
import time
from collections import defaultdict, deque
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import calc
from . import models as m
from .config import settings
from .db import get_session

app = FastAPI(title="College Value Lab API", version="0.1.0", docs_url="/docs", redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), allow_methods=["GET", "POST"], allow_headers=["Content-Type", "Authorization"])

# ----------------------------------------------------------------- rate limiting

_hits: dict[str, deque[float]] = defaultdict(deque)


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "local")).split(",")[0].strip()
    now = time.monotonic()
    q = _hits[ip]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= settings.rate_limit_per_minute:
        return JSONResponse({"detail": "Too many requests. Please wait a minute and try again."}, status_code=429, headers={"Retry-After": "60"})
    q.append(now)
    return await call_next(request)


DB = Annotated[Session, Depends(get_session)]


def lineage(row) -> dict:
    return {
        "dataset_version_id": row.dataset_version_id,
        "year": row.data_year,
        "population": row.population,
        "sample_size": row.sample_size,
        "confidence": row.confidence,
    }


def num(v) -> float | None:
    return None if v is None else float(v)


# ----------------------------------------------------------------- reference data


@app.get("/health")
def health(db: DB):
    return {"status": "ok", "colleges": db.scalar(select(func.count()).select_from(m.College))}


@app.get("/sources")
def sources(db: DB):
    rows = db.execute(select(m.DataSource, m.DatasetVersion).join(m.DatasetVersion)).all()
    return [
        {"id": s.id, "publisher": s.publisher, "name": s.name, "dataset": s.dataset, "url": s.url, "methodology_id": s.methodology_id, "version": {"id": v.id, "label": v.release_label, "year": v.data_year, "fetched_at": v.fetched_at, "is_demo": v.is_demo}}
        for s, v in rows
    ]


@app.get("/methodologies")
def methodologies(db: DB):
    return [{"id": x.id, "title": x.title, "simple": x.simple, "body": x.body, "formula": x.formula, "limitations": x.limitations} for x in db.scalars(select(m.Methodology))]


@app.get("/cities")
def cities(db: DB):
    rows = db.execute(select(m.City, m.CostOfLiving).join(m.CostOfLiving, m.CostOfLiving.city_id == m.City.id)).all()
    return [{"id": c.id, "name": c.name, "state": c.state, "rpp": num(col.rpp_all_items), "rent_1br": num(col.median_rent_1br), "lineage": lineage(col)} for c, col in rows]


@app.get("/majors")
def majors(db: DB, category: str | None = None):
    stmt = select(m.Major).order_by(m.Major.name)
    if category:
        stmt = stmt.where(m.Major.category == category)
    return [{"id": x.id, "name": x.name, "cip": x.cip_code, "category": x.category} for x in db.scalars(stmt)]


@app.get("/majors/{major_id}")
def major(major_id: str, db: DB):
    mj = db.get(m.Major, major_id)
    if not mj:
        raise HTTPException(404, "Major not found")
    early = db.scalar(select(m.MajorEarnings).where(m.MajorEarnings.major_id == major_id, m.MajorEarnings.college_id.is_(None), m.MajorEarnings.career_stage == "early"))
    pcts = db.scalars(select(m.SalaryPercentile).where(m.SalaryPercentile.major_earnings_id == early.id)).all() if early else []
    emp = db.scalar(select(m.MajorEmployment).where(m.MajorEmployment.major_id == major_id))
    occ = db.execute(select(m.MajorOccupationMapping, m.Occupation).join(m.Occupation).where(m.MajorOccupationMapping.major_id == major_id)).all()
    return {
        "id": mj.id,
        "name": mj.name,
        "category": mj.category,
        "early_career": {f"p{p.percentile}": num(p.amount) for p in pcts} | ({"lineage": lineage(early)} if early else {}),
        "employment": emp and {"unemployment_rate": num(emp.unemployment_rate), "underemployment_rate": num(emp.underemployment_rate), "grad_school_rate": num(emp.grad_school_rate), "months_to_first_job": num(emp.months_to_first_job), "lineage": lineage(emp)},
        "occupations": [{"id": o.id, "title": o.title, "share": mp.share} for mp, o in occ],
        "industries": mj.industries,
    }


# ----------------------------------------------------------------- colleges


@app.get("/colleges")
def search_colleges(
    db: DB,
    q: Annotated[str | None, Query(max_length=80)] = None,
    state: Annotated[str | None, Query(min_length=2, max_length=2)] = None,
    control: Literal["public", "private"] | None = None,
    max_net_price: Annotated[float | None, Query(ge=0)] = None,
    min_grad_rate: Annotated[float | None, Query(ge=0, le=100)] = None,
    major: Annotated[str | None, Query(max_length=80)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    stmt = (
        select(m.College, m.CollegeLocation, m.CollegeCost, m.CollegeCompletion, m.CollegeDebt)
        .join(m.CollegeLocation)
        .join(m.CollegeCost)
        .join(m.CollegeCompletion)
        .join(m.CollegeDebt)
    )
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(func.lower(m.College.name).like(like) | func.lower(m.CollegeLocation.city).like(like) | func.lower(m.College.state).like(like))
    if state:
        stmt = stmt.where(m.College.state == state.upper())
    if control:
        stmt = stmt.where(m.College.control == control)
    if max_net_price is not None:
        stmt = stmt.where(m.CollegeCost.net_price <= max_net_price)
    if min_grad_rate is not None:
        stmt = stmt.where(m.CollegeCompletion.grad_rate_6yr >= min_grad_rate)
    if major:
        stmt = stmt.where(m.College.id.in_(select(m.CollegeMajor.college_id).where(m.CollegeMajor.major_id == major)))
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = db.execute(stmt.order_by(m.College.short_name).limit(limit).offset(offset)).all()
    return {
        "total": total,
        "results": [
            {
                "id": c.id,
                "name": c.name,
                "city": loc.city,
                "state": c.state,
                "control": c.control,
                "tuition_in_state": num(cost.tuition_in_state),
                "tuition_out_of_state": num(cost.tuition_out_of_state),
                "net_price": num(cost.net_price),
                "grad_rate_6yr": num(comp.grad_rate_6yr),
                "median_earnings": num(debt.median_earnings_10yr),
                "median_debt": num(debt.median_debt),
                "is_demo": c.is_demo,
            }
            for c, loc, cost, comp, debt in rows
        ],
    }


@app.get("/colleges/{college_id}")
def college(college_id: str, db: DB):
    c = db.get(m.College, college_id)
    if not c:
        raise HTTPException(404, "College not found")
    cost, aid, comp, debt = c.costs[0], c.aid[0], c.completion[0], c.debt[0]
    return {
        "id": c.id,
        "unit_id": c.unit_id,
        "name": c.name,
        "city": c.location.city if c.location else None,
        "state": c.state,
        "control": c.control,
        "undergrad_enrollment": c.undergrad_enrollment,
        "acceptance_rate": num(c.acceptance_rate),
        "costs": {k: num(getattr(cost, k)) for k in ("tuition_in_state", "tuition_out_of_state", "fees", "room", "board", "books", "transportation", "misc", "net_price")} | {"lineage": lineage(cost)},
        "aid": {"pct_receiving_grants": num(aid.pct_receiving_grants), "avg_grant": num(aid.avg_grant), "pct_borrowing": num(aid.pct_borrowing), "lineage": lineage(aid)},
        "completion": {"grad_rate_4yr": num(comp.grad_rate_4yr), "grad_rate_6yr": num(comp.grad_rate_6yr), "lineage": lineage(comp)},
        "debt": {"median_debt": num(debt.median_debt), "median_earnings_10yr": num(debt.median_earnings_10yr), "lineage": lineage(debt)},
        "major_ids": [cm.major_id for cm in c.majors],
        "is_demo": c.is_demo,
    }


# ----------------------------------------------------------------- paths


class FundingIn(BaseModel):
    aid_per_year: float = Field(0, ge=0, le=1_000_000)
    scholarships_per_year: float = Field(0, ge=0, le=1_000_000)
    family_per_year: float = Field(0, ge=0, le=1_000_000)
    work_per_year: float = Field(0, ge=0, le=1_000_000)
    savings: float = Field(0, ge=0, le=1_000_000)


class PathIn(BaseModel):
    college_id: str = Field(max_length=80, pattern=r"^[a-z0-9-]+$")
    major_id: str = Field(max_length=80, pattern=r"^[a-z0-9-]+$")
    residency: Literal["resident", "nonresident"] = "resident"
    living: Literal["campus", "off-campus", "home"] = "campus"
    years_to_graduate: int = Field(4, ge=3, le=6)
    horizon_age: int = Field(45, ge=30, le=65)
    loan_type: Literal["federal-subsidized", "federal-unsubsidized", "parent-plus", "private"] = "federal-unsubsidized"
    loan_rate_pct: float | None = Field(None, ge=0, le=20)
    loan_term_years: int = Field(10, ge=5, le=30)
    funding: FundingIn = FundingIn()


@app.post("/paths")
def run_path(body: PathIn, db: DB):
    c = db.get(m.College, body.college_id)
    if not c:
        raise HTTPException(404, "College not found")
    program = db.scalar(select(m.CollegeMajor).where(m.CollegeMajor.college_id == c.id, m.CollegeMajor.major_id == body.major_id))
    if not program:
        raise HTTPException(404, "That college doesn't offer this major in our data.")
    cost = c.costs[0]
    early = db.scalar(select(m.MajorEarnings).where(m.MajorEarnings.major_id == body.major_id, m.MajorEarnings.college_id == c.id, m.MajorEarnings.career_stage == "early"))
    program_mid = db.scalar(select(m.MajorEarnings.median).where(m.MajorEarnings.major_id == body.major_id, m.MajorEarnings.college_id == c.id, m.MajorEarnings.career_stage == "mid"))
    national_employment = db.scalar(select(m.EmploymentRate.employment_rate).where(m.EmploymentRate.major_id == body.major_id, m.EmploymentRate.city_id.is_(None)))
    employment = program.employment_rate if program.employment_rate is not None else national_employment
    col = db.scalar(select(m.CostOfLiving).where(m.CostOfLiving.city_id == (c.location.metro_city_id if c.location else None)))
    tax = db.scalar(select(m.TaxData.effective_rate).where(m.TaxData.city_id == (c.location.metro_city_id if c.location else None)))

    start = float(early.median)
    mid = float(program_mid) if program_mid is not None else start
    result = calc.project_path(
        calc.CollegeCosts(
            tuition_in_state=float(cost.tuition_in_state), tuition_out_of_state=float(cost.tuition_out_of_state), fees=float(cost.fees),
            room=float(cost.room), board=float(cost.board), books=float(cost.books), transportation=float(cost.transportation), misc=float(cost.misc), control=c.control,
        ),
        body.residency, body.living,
        calc.Funding(**body.funding.model_dump()),
        start, mid, float(employment or 95) / 100,
        rent_1br=float(col.median_rent_1br) if col and col.median_rent_1br else None,
        state_rate=float(tax) if tax is not None else 0.045,
        years=body.years_to_graduate, horizon_age=body.horizon_age,
        loan_type=body.loan_type, loan_rate_pct=body.loan_rate_pct, loan_term_years=body.loan_term_years,
    )
    baseline = calc.project_no_college(body.horizon_age, float(tax) if tax is not None else 0.045)
    return {
        "college_id": c.id,
        "major_id": body.major_id,
        "net": result.net,
        "monthly_payment": result.monthly_payment,
        "total_interest": result.total_interest,
        "starting_salary": result.starting_salary,
        "ten_year_earnings": result.ten_year_earnings,
        "break_even": calc.calculate_break_even_year(result.rows, baseline, result.graduation_age),
        "series": [{"age": r.age, "cumulative": round(r.cumulative)} for r in result.rows],
        "baseline": [{"age": r.age, "cumulative": round(r.cumulative)} for r in baseline],
        "is_fallback": early.is_fallback,
        "lineage": {"earnings": lineage(early), "costs": lineage(cost)},
    }


# ----------------------------------------------------------------- admin


def require_admin(authorization: Annotated[str | None, Header()] = None) -> None:
    if not settings.admin_token:
        raise HTTPException(404, "Not found")
    token = (authorization or "").removeprefix("Bearer ").strip()
    if not hmac.compare_digest(token, settings.admin_token):
        raise HTTPException(401, "Unauthorized")


@app.get("/admin/datasets", dependencies=[Depends(require_admin)])
def admin_datasets(db: DB):
    """Dataset status and freshness (spec §60)."""
    rows = db.execute(select(m.DatasetVersion, m.DataSource).join(m.DataSource)).all()
    return [{"source": s.name, "dataset": s.dataset, "release": v.release_label, "year": v.data_year, "fetched_at": v.fetched_at, "processing_version": v.processing_version, "is_demo": v.is_demo, "published": v.is_published} for v, s in rows]
