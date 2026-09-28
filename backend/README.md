# College Value Lab API

FastAPI + SQLAlchemy service over PostgreSQL. It exposes the same calculation engine as the web app (`app/calc.py` mirrors `lib/calc`), and a test checks that both produce the same numbers.

## Run locally

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

# 1. Export the demo dataset from the web app's seed (repo root)
(cd .. && npm run export:seed)

# 2. Point at PostgreSQL (defaults to a local SQLite file for quick starts)
export DATABASE_URL=postgresql://user:pass@localhost:5432/cvl

# 3. Create tables and load demo data (every row is tagged is_demo via its dataset version)
.venv/bin/python -m app.seed

# 4. Serve
.venv/bin/uvicorn app.main:app --reload     # http://localhost:8000/docs
```

## Environment

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy URL (`postgresql://…` uses psycopg 3) | `sqlite:///./cvl-dev.db` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |
| `RATE_LIMIT_PER_MINUTE` | Per-IP request limit | `120` |
| `ADMIN_TOKEN` | Bearer token for `/admin/*`; unset disables admin routes | unset |

No secrets are committed. Use your platform's secret store (Railway, Render, Fly.io, AWS).

## Schema

All 29 tables from the product spec, in `app/models.py`. `schema.sql` is the generated PostgreSQL DDL (`python -m app.ddl > schema.sql`): 61 indexes and 46 foreign keys.

Provenance works like this: every fact table (`college_costs`, `major_earnings`, `salary_percentiles`, `cost_of_living`, …) carries `dataset_version_id`, `data_year`, `population`, `sample_size` and `confidence`. `dataset_versions` records the source, release, fetch date, processing version and `is_demo`. So any number in the UI traces back to its source, year, dataset and methodology.

## Endpoints

| Method | Path | |
|---|---|---|
| GET | `/health` | Liveness + row count |
| GET | `/colleges` | Search by name/city/state; filter by state, control, net price, graduation rate, major |
| GET | `/colleges/{id}` | Costs, aid, completion, debt, offered majors, each with lineage |
| GET | `/majors`, `/majors/{id}` | Percentiles, employment, occupations, industries |
| GET | `/cities` | Regional price parities and rents |
| POST | `/paths` | Run a path: net cost, loans, earnings, break-even, cumulative series |
| GET | `/sources`, `/methodologies` | Data lineage and methods |
| GET | `/admin/datasets` | Dataset status (requires `ADMIN_TOKEN`) |

All input is validated (Pydantic models, bounded query params); requests are rate-limited per IP.

## Tests

```bash
.venv/bin/python -m pytest
```

This covers the loan, tuition, salary, break-even, cost-of-living and scenario calculations, the API, input validation, and parity with the web app's engine.
