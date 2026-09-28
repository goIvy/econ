import pytest

from app import calc


def test_loan_payment_matches_amortization():
    assert calc.calculate_loan_payment(30000, 6.53, 10) == pytest.approx(341.07, abs=0.05)


def test_zero_rate_and_zero_principal():
    assert calc.calculate_loan_payment(12000, 0, 10) == pytest.approx(100)
    assert calc.calculate_loan_payment(0, 6.53, 10) == 0


def test_total_interest_is_payments_minus_principal():
    p = calc.calculate_loan_payment(30000, 6.53, 10)
    assert calc.calculate_total_interest(30000, 6.53, 10) == pytest.approx(p * 120 - 30000)


def test_in_school_interest():
    assert calc.calculate_in_school_interest(20000, 6.53, 4, "federal-subsidized") == 0
    assert calc.calculate_in_school_interest(10000, 5, 4, "federal-unsubsidized") == pytest.approx(1500)


def test_schedule_ends_at_zero():
    s = calc.loan_schedule(25000, 6.53, 10)
    assert len(s) == 11 and s[0]["balance"] == 25000 and s[-1]["balance"] == pytest.approx(0, abs=1e-6)


def test_net_cost_formula_and_caps():
    n = calc.calculate_net_cost(40000, 4, calc.Funding(10000, 2000, 8000, 3000, 5000))
    assert n["gross"] == 160000
    assert n["net_price"] == 160000 - 40000 - 8000
    assert n["borrowing"] == n["net_student_cost"] - 12000 - 5000
    capped = calc.calculate_net_cost(20000, 4, calc.Funding(aid_per_year=30000))
    assert capped["aid"] == 80000 and capped["borrowing"] == 0


def test_residency_and_living():
    c = calc.CollegeCosts(12000, 45000, 1500, 12000, 8000, 1200, 1000, 2000, "public")
    assert calc.annual_cost_lines(c, "nonresident", "campus")["tuition"] == 45000
    home = calc.annual_cost_lines(c, "resident", "home")
    assert home["housing"] == 0 and home["food"] < 8000 and home["transportation"] > 1000
    private = calc.CollegeCosts(60000, 60000, 1500, 12000, 8000, 1200, 1000, 2000, "private")
    assert calc.annual_cost_lines(private, "nonresident", "campus")["tuition"] == 60000


def test_salary_projection_reaches_mid_career():
    s = calc.project_salary(60000, 100000, 25)
    assert s[0] == 60000 and s[calc.YEARS_TO_MID_CAREER] == pytest.approx(100000, abs=1)


def test_cost_of_living_and_inflation():
    assert calc.adjust_for_cost_of_living(110000, 118) == pytest.approx(93220.34, abs=0.01)
    assert calc.adjust_for_inflation(110, 1, 0.1) == pytest.approx(100)


def test_federal_tax_2024():
    assert calc.federal_income_tax(50000) == pytest.approx(1160 + 2856)


def row(age, cum):
    return calc.Row(age, 0, 0, 0, 0, cum)


def test_break_even_interpolates_and_handles_edges():
    be = calc.calculate_break_even_year([row(22, -100), row(23, -50), row(24, 50)], [row(22, 0), row(23, 0), row(24, 0)], 22)
    assert be["age"] == pytest.approx(23.5)
    assert calc.calculate_break_even_year([row(22, -5), row(23, -1)], [row(22, 0), row(23, 0)], 22) is None


def test_opportunity_cost():
    base = calc.project_no_college()
    assert calc.calculate_opportunity_cost(4, base) == pytest.approx(sum(r.after_tax for r in base[:4]))
