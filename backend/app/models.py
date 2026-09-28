"""
Relational schema for College Value Lab (spec §5).

Every fact table points at a `dataset_versions` row, which records the source,
data year, fetch date, processing version and whether the data is demo data.
That is what makes every statistic in the UI traceable to source, year,
dataset and methodology.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

Money = Numeric(12, 2)
Rate = Numeric(6, 3)  # percentages like 94.000 or 6.530


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Lineage:
    """Columns every sourced statistic carries."""

    dataset_version_id: Mapped[int] = mapped_column(ForeignKey("dataset_versions.id", ondelete="RESTRICT"), index=True)
    data_year: Mapped[str] = mapped_column(String(20))
    population: Mapped[str | None] = mapped_column(Text)
    sample_size: Mapped[int | None] = mapped_column(Integer)
    confidence: Mapped[str] = mapped_column(Enum("high", "moderate", "limited", name="confidence_level"), default="moderate")


# --------------------------------------------------------------------- provenance


class DataSource(Base, TimestampMixin):
    """A publisher's dataset family, e.g. College Scorecard field-of-study."""

    __tablename__ = "data_sources"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    publisher: Mapped[str] = mapped_column(String(200))
    name: Mapped[str] = mapped_column(String(200))
    dataset: Mapped[str] = mapped_column(String(300))
    url: Mapped[str] = mapped_column(String(500))
    quality: Mapped[float] = mapped_column(Float, default=0.8)
    methodology_id: Mapped[str | None] = mapped_column(ForeignKey("methodologies.id"))

    versions: Mapped[list[DatasetVersion]] = relationship(back_populates="source")


class DatasetVersion(Base):
    """One ingested release of a source (spec §61–62: download → … → version → publish)."""

    __tablename__ = "dataset_versions"
    __table_args__ = (UniqueConstraint("source_id", "release_label", "processing_version"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("data_sources.id", ondelete="RESTRICT"), index=True)
    release_label: Mapped[str] = mapped_column(String(80))  # e.g. "Most Recent Cohorts 2024-06"
    data_year: Mapped[str] = mapped_column(String(20))
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    processing_version: Mapped[str] = mapped_column(String(40), default="1.0.0")
    checksum: Mapped[str | None] = mapped_column(String(128))
    row_count: Mapped[int | None] = mapped_column(Integer)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text)

    source: Mapped[DataSource] = relationship(back_populates="versions")


class Methodology(Base, TimestampMixin):
    __tablename__ = "methodologies"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    simple: Mapped[str] = mapped_column(Text)
    body: Mapped[list] = mapped_column(JSON)
    formula: Mapped[str | None] = mapped_column(Text)
    limitations: Mapped[list | None] = mapped_column(JSON)
    version: Mapped[str] = mapped_column(String(20), default="1.0")


class ResearchSource(Base, TimestampMixin):
    """Published research cited by the methodology or research lab."""

    __tablename__ = "research_sources"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(400))
    authors: Mapped[str | None] = mapped_column(String(400))
    publisher: Mapped[str | None] = mapped_column(String(200))
    year: Mapped[int | None] = mapped_column(Integer)
    url: Mapped[str | None] = mapped_column(String(500))
    methodology_id: Mapped[str | None] = mapped_column(ForeignKey("methodologies.id"), index=True)


# --------------------------------------------------------------------- institutions


class College(Base, TimestampMixin):
    __tablename__ = "colleges"
    __table_args__ = (Index("ix_colleges_state_control", "state", "control"),)
    id: Mapped[str] = mapped_column(String(80), primary_key=True)  # slug
    unit_id: Mapped[str] = mapped_column(String(20), unique=True)  # IPEDS UNITID
    name: Mapped[str] = mapped_column(String(300), index=True)
    short_name: Mapped[str] = mapped_column(String(120))
    state: Mapped[str] = mapped_column(String(2), index=True)
    control: Mapped[str] = mapped_column(Enum("public", "private", name="college_control"), index=True)
    undergrad_enrollment: Mapped[int | None] = mapped_column(Integer, index=True)
    acceptance_rate: Mapped[Decimal | None] = mapped_column(Rate)
    earnings_factor: Mapped[float] = mapped_column(Float, default=1.0)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)

    location: Mapped[CollegeLocation | None] = relationship(back_populates="college", uselist=False, cascade="all, delete-orphan")
    costs: Mapped[list[CollegeCost]] = relationship(back_populates="college", cascade="all, delete-orphan")
    aid: Mapped[list[CollegeFinancialAid]] = relationship(back_populates="college", cascade="all, delete-orphan")
    completion: Mapped[list[CollegeCompletion]] = relationship(back_populates="college", cascade="all, delete-orphan")
    debt: Mapped[list[CollegeDebt]] = relationship(back_populates="college", cascade="all, delete-orphan")
    majors: Mapped[list[CollegeMajor]] = relationship(back_populates="college", cascade="all, delete-orphan")


class CollegeLocation(Base):
    __tablename__ = "college_locations"
    college_id: Mapped[str] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"), primary_key=True)
    city: Mapped[str] = mapped_column(String(120), index=True)
    state: Mapped[str] = mapped_column(String(2))
    metro_city_id: Mapped[str | None] = mapped_column(ForeignKey("cities.id"), index=True)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)

    college: Mapped[College] = relationship(back_populates="location")


class CollegeCost(Base, Lineage):
    """Cost of attendance for one academic year."""

    __tablename__ = "college_costs"
    __table_args__ = (UniqueConstraint("college_id", "academic_year"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    college_id: Mapped[str] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"), index=True)
    academic_year: Mapped[str] = mapped_column(String(9), index=True)  # "2023-24"
    tuition_in_state: Mapped[Decimal | None] = mapped_column(Money)
    tuition_out_of_state: Mapped[Decimal | None] = mapped_column(Money)
    fees: Mapped[Decimal | None] = mapped_column(Money)
    room: Mapped[Decimal | None] = mapped_column(Money)
    board: Mapped[Decimal | None] = mapped_column(Money)
    books: Mapped[Decimal | None] = mapped_column(Money)
    transportation: Mapped[Decimal | None] = mapped_column(Money)
    misc: Mapped[Decimal | None] = mapped_column(Money)
    net_price: Mapped[Decimal | None] = mapped_column(Money, index=True)

    college: Mapped[College] = relationship(back_populates="costs")


class CollegeFinancialAid(Base, Lineage):
    __tablename__ = "college_financial_aid"
    __table_args__ = (UniqueConstraint("college_id", "academic_year"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    college_id: Mapped[str] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"), index=True)
    academic_year: Mapped[str] = mapped_column(String(9))
    pct_receiving_grants: Mapped[Decimal | None] = mapped_column(Rate)
    avg_grant: Mapped[Decimal | None] = mapped_column(Money)
    pct_borrowing: Mapped[Decimal | None] = mapped_column(Rate)

    college: Mapped[College] = relationship(back_populates="aid")


class CollegeCompletion(Base, Lineage):
    __tablename__ = "college_completion"
    __table_args__ = (UniqueConstraint("college_id", "cohort_year"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    college_id: Mapped[str] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"), index=True)
    cohort_year: Mapped[str] = mapped_column(String(20))
    grad_rate_4yr: Mapped[Decimal | None] = mapped_column(Rate)
    grad_rate_6yr: Mapped[Decimal | None] = mapped_column(Rate, index=True)

    college: Mapped[College] = relationship(back_populates="completion")


class CollegeDebt(Base, Lineage):
    __tablename__ = "college_debt"
    __table_args__ = (UniqueConstraint("college_id", "academic_year"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    college_id: Mapped[str] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"), index=True)
    academic_year: Mapped[str] = mapped_column(String(9))
    median_debt: Mapped[Decimal | None] = mapped_column(Money, index=True)
    median_earnings_10yr: Mapped[Decimal | None] = mapped_column(Money, index=True)

    college: Mapped[College] = relationship(back_populates="debt")


# --------------------------------------------------------------------- majors & careers


class Major(Base, TimestampMixin):
    __tablename__ = "majors"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    cip_code: Mapped[str] = mapped_column(String(10), unique=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    blurb: Mapped[str | None] = mapped_column(Text)
    industries: Mapped[list | None] = mapped_column(JSON)


class CollegeMajor(Base):
    """A program: a major offered at a college, with field-of-study coverage."""

    __tablename__ = "college_majors"
    __table_args__ = (UniqueConstraint("college_id", "major_id"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    college_id: Mapped[str] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"), index=True)
    major_id: Mapped[str] = mapped_column(ForeignKey("majors.id", ondelete="CASCADE"), index=True)
    has_field_of_study_data: Mapped[bool] = mapped_column(Boolean, default=True)
    employment_rate: Mapped[Decimal | None] = mapped_column(Rate)

    college: Mapped[College] = relationship(back_populates="majors")


class MajorEarnings(Base, Lineage):
    """Earnings for a major, nationally (college_id NULL) or for one program."""

    __tablename__ = "major_earnings"
    __table_args__ = (Index("ix_major_earnings_major_college", "major_id", "college_id"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    major_id: Mapped[str] = mapped_column(ForeignKey("majors.id", ondelete="CASCADE"))
    college_id: Mapped[str | None] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"))
    career_stage: Mapped[str] = mapped_column(Enum("early", "mid", name="career_stage"))
    median: Mapped[Decimal | None] = mapped_column(Money)
    is_fallback: Mapped[bool] = mapped_column(Boolean, default=False)


class SalaryPercentile(Base, Lineage):
    __tablename__ = "salary_percentiles"
    __table_args__ = (
        UniqueConstraint("major_earnings_id", "percentile"),
        CheckConstraint("percentile IN (10, 25, 50, 75, 90)", name="ck_percentile_value"),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    major_earnings_id: Mapped[int] = mapped_column(ForeignKey("major_earnings.id", ondelete="CASCADE"), index=True)
    percentile: Mapped[int] = mapped_column(Integer)
    amount: Mapped[Decimal] = mapped_column(Money)


class MajorEmployment(Base, Lineage):
    __tablename__ = "major_employment"
    __table_args__ = (UniqueConstraint("major_id", "data_year"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    major_id: Mapped[str] = mapped_column(ForeignKey("majors.id", ondelete="CASCADE"), index=True)
    unemployment_rate: Mapped[Decimal | None] = mapped_column(Rate)
    underemployment_rate: Mapped[Decimal | None] = mapped_column(Rate)
    grad_school_rate: Mapped[Decimal | None] = mapped_column(Rate)
    months_to_first_job: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))


class EmploymentRate(Base, Lineage):
    """Employment rate by major and optional geography, for scenario modeling."""

    __tablename__ = "employment_rates"
    __table_args__ = (Index("ix_employment_rates_major_city", "major_id", "city_id"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    major_id: Mapped[str] = mapped_column(ForeignKey("majors.id", ondelete="CASCADE"))
    city_id: Mapped[str | None] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"))
    employment_rate: Mapped[Decimal] = mapped_column(Rate)


class Occupation(Base, TimestampMixin):
    __tablename__ = "occupations"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    soc_code: Mapped[str] = mapped_column(String(10), index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    typical_education: Mapped[str] = mapped_column(String(80))
    top_metros: Mapped[list | None] = mapped_column(JSON)


class MajorOccupationMapping(Base):
    __tablename__ = "major_occupation_mapping"
    __table_args__ = (UniqueConstraint("major_id", "occupation_id"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    major_id: Mapped[str] = mapped_column(ForeignKey("majors.id", ondelete="CASCADE"), index=True)
    occupation_id: Mapped[str] = mapped_column(ForeignKey("occupations.id", ondelete="CASCADE"), index=True)
    share: Mapped[float] = mapped_column(Float)


class CareerSalaryData(Base, Lineage):
    __tablename__ = "career_salary_data"
    __table_args__ = (UniqueConstraint("occupation_id", "city_id", "data_year"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    occupation_id: Mapped[str] = mapped_column(ForeignKey("occupations.id", ondelete="CASCADE"), index=True)
    city_id: Mapped[str | None] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"), index=True)  # NULL = national
    median_wage: Mapped[Decimal] = mapped_column(Money)


class CareerGrowthData(Base, Lineage):
    __tablename__ = "career_growth_data"
    __table_args__ = (UniqueConstraint("occupation_id", "data_year"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    occupation_id: Mapped[str] = mapped_column(ForeignKey("occupations.id", ondelete="CASCADE"), index=True)
    growth_10yr_pct: Mapped[Decimal] = mapped_column(Numeric(6, 2))


# --------------------------------------------------------------------- geography & taxes


class City(Base, TimestampMixin):
    __tablename__ = "cities"
    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    state: Mapped[str] = mapped_column(String(2), index=True)


class CostOfLiving(Base, Lineage):
    __tablename__ = "cost_of_living"
    __table_args__ = (UniqueConstraint("city_id", "data_year"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    city_id: Mapped[str] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"), index=True)
    rpp_all_items: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    median_rent_1br: Mapped[Decimal | None] = mapped_column(Money)


class TaxData(Base, Lineage):
    """Effective state + local income tax by state (and optional city)."""

    __tablename__ = "tax_data"
    __table_args__ = (UniqueConstraint("state", "city_id", "data_year"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    state: Mapped[str] = mapped_column(String(2), index=True)
    city_id: Mapped[str | None] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"))
    effective_rate: Mapped[Decimal] = mapped_column(Numeric(6, 4))


# --------------------------------------------------------------------- users & saved work


class User(Base, TimestampMixin):
    """Identity lives in the auth provider (Clerk / Supabase / Auth.js); this row mirrors it."""

    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    auth_provider_id: Mapped[str] = mapped_column(String(200), unique=True)
    email: Mapped[str | None] = mapped_column(String(320), unique=True)
    role: Mapped[str] = mapped_column(Enum("student", "parent", "counselor", "admin", name="user_role"), default="student")
    grade: Mapped[str | None] = mapped_column(String(40))
    home_state: Mapped[str | None] = mapped_column(String(2))


class Scenario(Base, TimestampMixin):
    __tablename__ = "scenarios"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    college_id: Mapped[str] = mapped_column(ForeignKey("colleges.id"), index=True)
    major_id: Mapped[str] = mapped_column(ForeignKey("majors.id"), index=True)
    residency: Mapped[str] = mapped_column(Enum("resident", "nonresident", name="residency"))
    living: Mapped[str] = mapped_column(Enum("campus", "off-campus", "home", name="living_arrangement"))
    career_city_id: Mapped[str | None] = mapped_column(ForeignKey("cities.id"))
    years_to_graduate: Mapped[int] = mapped_column(Integer, default=4)
    share_slug: Mapped[str | None] = mapped_column(String(24), unique=True)


class ScenarioAssumption(Base):
    __tablename__ = "scenario_assumptions"
    __table_args__ = (UniqueConstraint("scenario_id", "key"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scenario_id: Mapped[int] = mapped_column(ForeignKey("scenarios.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(60))  # e.g. aid_per_year, loan_rate_pct
    value: Mapped[Decimal] = mapped_column(Numeric(14, 4))


class SavedCollege(Base, TimestampMixin):
    __tablename__ = "saved_colleges"
    __table_args__ = (UniqueConstraint("user_id", "college_id", "folder"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    college_id: Mapped[str] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"), index=True)
    folder: Mapped[str] = mapped_column(String(80), default="Saved")


class SavedComparison(Base, TimestampMixin):
    __tablename__ = "saved_comparisons"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    scenario_ids: Mapped[list] = mapped_column(JSON)
    share_slug: Mapped[str | None] = mapped_column(String(24), unique=True, index=True)
    folder: Mapped[str | None] = mapped_column(String(80))


class SavedPath(Base, TimestampMixin):
    __tablename__ = "saved_paths"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    scenario_id: Mapped[int] = mapped_column(ForeignKey("scenarios.id", ondelete="CASCADE"), index=True)
    label: Mapped[str] = mapped_column(String(120))
    saved_on: Mapped[date] = mapped_column(Date, server_default=func.current_date())


ALL_TABLES = sorted(Base.metadata.tables)
