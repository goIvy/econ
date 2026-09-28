"""
Calculation engine (spec §63), mirroring lib/calc in the web app so the API and
the browser produce identical numbers. All amounts are 2024 dollars.

Public functions use the spec's names:
    calculate_net_cost, calculate_loan_payment, calculate_total_interest,
    project_salary, adjust_for_inflation, adjust_for_cost_of_living,
    calculate_cumulative_earnings, calculate_opportunity_cost,
    calculate_break_even_year
run_scenario_simulation and run_monte_carlo_simulation belong to later
releases (spec §28–30).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Literal

LoanType = Literal["federal-subsidized", "federal-unsubsidized", "parent-plus", "private"]
Living = Literal["campus", "off-campus", "home"]

DEFAULT_RATES: dict[str, float] = {
    "federal-subsidized": 6.53,
    "federal-unsubsidized": 6.53,
    "parent-plus": 9.08,
    "private": 8.5,
}
OFF_CAMPUS_RENT_SHARE = 0.6
YEARS_TO_MID_CAREER = 15
LATE_CAREER_GROWTH = 0.005
START_AGE = 18
NO_COLLEGE = {"start": 31000.0, "mid": 46000.0, "employment": 0.93}
STANDARD_DEDUCTION_2024 = 14600
SS_WAGE_BASE_2024 = 168600
BRACKETS_2024 = [(11600, 0.10), (47150, 0.12), (100525, 0.22), (191950, 0.24), (243725, 0.32), (609350, 0.35), (math.inf, 0.37)]


# ----------------------------------------------------------------- costs


@dataclass
class CollegeCosts:
    tuition_in_state: float
    tuition_out_of_state: float
    fees: float
    room: float
    board: float
    books: float
    transportation: float
    misc: float
    control: Literal["public", "private"]


def annual_cost_lines(c: CollegeCosts, residency: str, living: Living, rent_1br: float | None = None) -> dict[str, float]:
    tuition = c.tuition_out_of_state if (c.control == "public" and residency == "nonresident") else c.tuition_in_state
    rent = rent_1br if rent_1br is not None else c.room / 12 / OFF_CAMPUS_RENT_SHARE
    housing = c.room if living == "campus" else (round(rent * OFF_CAMPUS_RENT_SHARE * 12) if living == "off-campus" else 0)
    food = c.board if living == "campus" else (round(c.board * 0.85) if living == "off-campus" else round(c.board * 0.35))
    transport = c.transportation if living == "campus" else (round(c.transportation * 1.4) if living == "off-campus" else round(c.transportation * 2.2))
    return {"tuition": tuition, "fees": c.fees, "housing": housing, "food": food, "books": c.books, "transportation": transport, "misc": c.misc}


@dataclass
class Funding:
    aid_per_year: float = 0
    scholarships_per_year: float = 0
    family_per_year: float = 0
    work_per_year: float = 0
    savings: float = 0


def calculate_net_cost(gross_per_year: float, years: int, f: Funding) -> dict[str, float]:
    """Gross − aid − scholarships − family = net student cost; work and savings reduce borrowing."""
    y = max(0, years)
    gross = gross_per_year * y
    aid = min(gross, max(0.0, f.aid_per_year) * y)
    scholarships = min(gross - aid, max(0.0, f.scholarships_per_year) * y)
    net_price = gross - aid - scholarships
    family = min(net_price, max(0.0, f.family_per_year) * y)
    net_student_cost = net_price - family
    work = min(net_student_cost, max(0.0, f.work_per_year) * y)
    savings = min(net_student_cost - work, max(0.0, f.savings))
    borrowing = max(0.0, net_student_cost - work - savings)
    return {"gross": gross, "aid": aid, "scholarships": scholarships, "net_price": net_price, "family": family, "net_student_cost": net_student_cost, "work": work, "savings": savings, "borrowing": borrowing}


# ----------------------------------------------------------------- loans


def calculate_loan_payment(principal: float, rate_pct: float, term_years: float) -> float:
    if principal <= 0 or term_years <= 0:
        return 0.0
    n = round(term_years * 12)
    r = rate_pct / 100 / 12
    if r == 0:
        return principal / n
    return principal * r / (1 - (1 + r) ** -n)


def calculate_total_interest(principal: float, rate_pct: float, term_years: float) -> float:
    return max(0.0, calculate_loan_payment(principal, rate_pct, term_years) * round(term_years * 12) - principal)


def calculate_in_school_interest(principal: float, rate_pct: float, years_in_school: int, loan_type: LoanType) -> float:
    if loan_type == "federal-subsidized" or principal <= 0 or years_in_school <= 0:
        return 0.0
    slice_ = principal / years_in_school
    return sum(slice_ * rate_pct / 100 * (years_in_school - i + 0.5) for i in range(years_in_school))


def loan_schedule(principal: float, rate_pct: float, term_years: int) -> list[dict[str, float]]:
    payment = calculate_loan_payment(principal, rate_pct, term_years)
    r = rate_pct / 100 / 12
    months = round(term_years * 12)
    balance = principal
    out = [{"year": 0, "balance": principal}]
    for m in range(1, months + 1):
        interest = balance * r
        balance = max(0.0, balance - min(balance, payment - interest))
        if m % 12 == 0 or m == months:
            out.append({"year": math.ceil(m / 12), "balance": balance})
    return out


# ----------------------------------------------------------------- taxes


def federal_income_tax(gross: float) -> float:
    taxable = max(0.0, gross - STANDARD_DEDUCTION_2024)
    tax, lower = 0.0, 0.0
    for upper, rate in BRACKETS_2024:
        if taxable <= 0:
            break
        piece = min(taxable, upper - lower)
        tax += piece * rate
        taxable -= piece
        lower = upper
    return tax


def after_tax(gross: float, state_rate: float = 0.045) -> float:
    if gross <= 0:
        return 0.0
    payroll = min(gross, SS_WAGE_BASE_2024) * 0.062 + gross * 0.0145
    state = max(0.0, gross - STANDARD_DEDUCTION_2024) * state_rate
    return max(0.0, gross - federal_income_tax(gross) - payroll - state)


# ----------------------------------------------------------------- earnings


def project_salary(start: float, mid_career: float, years: int, growth_override: float | None = None) -> list[float]:
    if start <= 0 or years <= 0:
        return [0.0] * max(0, years)
    implied = (max(mid_career, start) / start) ** (1 / YEARS_TO_MID_CAREER) - 1
    g = implied if growth_override is None else growth_override
    out, salary = [], start
    for t in range(years):
        out.append(salary)
        salary *= 1 + (g if (t < YEARS_TO_MID_CAREER or growth_override is not None) else LATE_CAREER_GROWTH)
    return out


def calculate_cumulative_earnings(series: list[float]) -> list[float]:
    total, out = 0.0, []
    for v in series:
        total += v
        out.append(total)
    return out


def adjust_for_cost_of_living(salary: float, rpp: float) -> float:
    return salary if rpp <= 0 else salary * 100 / rpp


def adjust_for_inflation(amount: float, years: float, inflation_rate: float = 0.025) -> float:
    return amount / (1 + inflation_rate) ** years


# ----------------------------------------------------------------- paths


@dataclass
class Row:
    age: int
    earnings: float
    after_tax: float
    outlay: float
    loan_payment: float
    cumulative: float


@dataclass
class PathResult:
    net: dict[str, float]
    monthly_payment: float
    total_interest: float
    starting_salary: float
    ten_year_earnings: float
    graduation_age: int
    rows: list[Row] = field(default_factory=list)


def project_path(
    costs: CollegeCosts,
    residency: str,
    living: Living,
    funding: Funding,
    start_salary: float,
    mid_career: float,
    employment_rate: float,
    *,
    rent_1br: float | None = None,
    state_rate: float = 0.045,
    years: int = 4,
    horizon_age: int = 45,
    loan_type: LoanType = "federal-unsubsidized",
    loan_rate_pct: float | None = None,
    loan_term_years: int = 10,
) -> PathResult:
    lines = annual_cost_lines(costs, residency, living, rent_1br)
    net = calculate_net_cost(sum(lines.values()), years, funding)
    rate = DEFAULT_RATES[loan_type] if loan_rate_pct is None else loan_rate_pct
    repay_balance = net["borrowing"] + calculate_in_school_interest(net["borrowing"], rate, years, loan_type)
    monthly = calculate_loan_payment(repay_balance, rate, loan_term_years)
    total_interest = repay_balance - net["borrowing"] + calculate_total_interest(repay_balance, rate, loan_term_years)
    grad_age = START_AGE + years
    salaries = project_salary(start_salary, mid_career, max(0, horizon_age - grad_age + 1))
    outlay = (net["net_price"] - net["borrowing"]) / years
    work = net["work"] / years
    rows, cumulative = [], 0.0
    for age in range(START_AGE, horizon_age + 1):
        if age < grad_age:
            earn, taxed, out, pay = work, work, outlay, 0.0
        else:
            t = age - grad_age
            earn = salaries[t] * employment_rate
            taxed, out = after_tax(earn, state_rate), 0.0
            pay = monthly * 12 if (t < loan_term_years and net["borrowing"] > 0) else 0.0
        cumulative += taxed - out - pay
        rows.append(Row(age, earn, taxed, out, pay, cumulative))
    ten = sum(s * employment_rate for s in salaries[:10])
    return PathResult(net, monthly, total_interest, start_salary, ten, grad_age, rows)


def project_no_college(horizon_age: int = 45, state_rate: float = 0.045) -> list[Row]:
    salaries = project_salary(NO_COLLEGE["start"], NO_COLLEGE["mid"], horizon_age - START_AGE + 1)
    rows, cumulative = [], 0.0
    for i, s in enumerate(salaries):
        earn = s * NO_COLLEGE["employment"]
        taxed = after_tax(earn, state_rate)
        cumulative += taxed
        rows.append(Row(START_AGE + i, earn, taxed, 0.0, 0.0, cumulative))
    return rows


def calculate_break_even_year(path: list[Row], alternative: list[Row], graduation_age: int) -> dict[str, float] | None:
    """First age where `path` overtakes `alternative` for good (linear interpolation)."""
    n = min(len(path), len(alternative))
    if n == 0:
        return None
    diff = [path[i].cumulative - alternative[i].cumulative for i in range(n)]
    if diff[-1] < 0:
        return None
    behind = [i for i in range(n) if diff[i] < 0]
    if not behind:
        return {"age": float(path[0].age), "years_after_graduation": float(path[0].age - graduation_age)}
    i = behind[-1]
    frac = 0.0 if diff[i + 1] == diff[i] else -diff[i] / (diff[i + 1] - diff[i])
    age = path[i].age + frac
    return {"age": age, "years_after_graduation": age - graduation_age}


def calculate_opportunity_cost(years_in_college: int, no_college: list[Row] | None = None) -> float:
    base = no_college if no_college is not None else project_no_college()
    return sum(r.after_tax for r in base[:years_in_college])
