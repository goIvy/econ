CREATE TABLE cities (
	id VARCHAR(10) NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	state VARCHAR(2) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

CREATE INDEX ix_cities_name ON cities (name);
CREATE INDEX ix_cities_state ON cities (state);

CREATE TABLE colleges (
	id VARCHAR(80) NOT NULL, 
	unit_id VARCHAR(20) NOT NULL, 
	name VARCHAR(300) NOT NULL, 
	short_name VARCHAR(120) NOT NULL, 
	state VARCHAR(2) NOT NULL, 
	control college_control NOT NULL, 
	undergrad_enrollment INTEGER, 
	acceptance_rate NUMERIC(6, 3), 
	earnings_factor FLOAT NOT NULL, 
	is_demo BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (unit_id)
);

CREATE INDEX ix_colleges_control ON colleges (control);
CREATE INDEX ix_colleges_name ON colleges (name);
CREATE INDEX ix_colleges_state ON colleges (state);
CREATE INDEX ix_colleges_state_control ON colleges (state, control);
CREATE INDEX ix_colleges_undergrad_enrollment ON colleges (undergrad_enrollment);

CREATE TABLE majors (
	id VARCHAR(80) NOT NULL, 
	cip_code VARCHAR(10) NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	category VARCHAR(80) NOT NULL, 
	blurb TEXT, 
	industries JSON, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (cip_code)
);

CREATE INDEX ix_majors_category ON majors (category);
CREATE INDEX ix_majors_name ON majors (name);

CREATE TABLE methodologies (
	id VARCHAR(40) NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	simple TEXT NOT NULL, 
	body JSON NOT NULL, 
	formula TEXT, 
	limitations JSON, 
	version VARCHAR(20) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);


CREATE TABLE occupations (
	id VARCHAR(80) NOT NULL, 
	soc_code VARCHAR(10) NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	category VARCHAR(80) NOT NULL, 
	typical_education VARCHAR(80) NOT NULL, 
	top_metros JSON, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

CREATE INDEX ix_occupations_category ON occupations (category);
CREATE INDEX ix_occupations_soc_code ON occupations (soc_code);
CREATE INDEX ix_occupations_title ON occupations (title);

CREATE TABLE users (
	id SERIAL NOT NULL, 
	auth_provider_id VARCHAR(200) NOT NULL, 
	email VARCHAR(320), 
	role user_role NOT NULL, 
	grade VARCHAR(40), 
	home_state VARCHAR(2), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (auth_provider_id), 
	UNIQUE (email)
);


CREATE TABLE college_locations (
	college_id VARCHAR(80) NOT NULL, 
	city VARCHAR(120) NOT NULL, 
	state VARCHAR(2) NOT NULL, 
	metro_city_id VARCHAR(10), 
	latitude FLOAT, 
	longitude FLOAT, 
	PRIMARY KEY (college_id), 
	FOREIGN KEY(college_id) REFERENCES colleges (id) ON DELETE CASCADE, 
	FOREIGN KEY(metro_city_id) REFERENCES cities (id)
);

CREATE INDEX ix_college_locations_city ON college_locations (city);
CREATE INDEX ix_college_locations_metro_city_id ON college_locations (metro_city_id);

CREATE TABLE college_majors (
	id SERIAL NOT NULL, 
	college_id VARCHAR(80) NOT NULL, 
	major_id VARCHAR(80) NOT NULL, 
	has_field_of_study_data BOOLEAN NOT NULL, 
	employment_rate NUMERIC(6, 3), 
	PRIMARY KEY (id), 
	UNIQUE (college_id, major_id), 
	FOREIGN KEY(college_id) REFERENCES colleges (id) ON DELETE CASCADE, 
	FOREIGN KEY(major_id) REFERENCES majors (id) ON DELETE CASCADE
);

CREATE INDEX ix_college_majors_college_id ON college_majors (college_id);
CREATE INDEX ix_college_majors_major_id ON college_majors (major_id);

CREATE TABLE data_sources (
	id VARCHAR(40) NOT NULL, 
	publisher VARCHAR(200) NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	dataset VARCHAR(300) NOT NULL, 
	url VARCHAR(500) NOT NULL, 
	quality FLOAT NOT NULL, 
	methodology_id VARCHAR(40), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(methodology_id) REFERENCES methodologies (id)
);


CREATE TABLE major_occupation_mapping (
	id SERIAL NOT NULL, 
	major_id VARCHAR(80) NOT NULL, 
	occupation_id VARCHAR(80) NOT NULL, 
	share FLOAT NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (major_id, occupation_id), 
	FOREIGN KEY(major_id) REFERENCES majors (id) ON DELETE CASCADE, 
	FOREIGN KEY(occupation_id) REFERENCES occupations (id) ON DELETE CASCADE
);

CREATE INDEX ix_major_occupation_mapping_major_id ON major_occupation_mapping (major_id);
CREATE INDEX ix_major_occupation_mapping_occupation_id ON major_occupation_mapping (occupation_id);

CREATE TABLE research_sources (
	id SERIAL NOT NULL, 
	title VARCHAR(400) NOT NULL, 
	authors VARCHAR(400), 
	publisher VARCHAR(200), 
	year INTEGER, 
	url VARCHAR(500), 
	methodology_id VARCHAR(40), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(methodology_id) REFERENCES methodologies (id)
);

CREATE INDEX ix_research_sources_methodology_id ON research_sources (methodology_id);

CREATE TABLE saved_colleges (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	college_id VARCHAR(80) NOT NULL, 
	folder VARCHAR(80) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (user_id, college_id, folder), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(college_id) REFERENCES colleges (id) ON DELETE CASCADE
);

CREATE INDEX ix_saved_colleges_college_id ON saved_colleges (college_id);
CREATE INDEX ix_saved_colleges_user_id ON saved_colleges (user_id);

CREATE TABLE saved_comparisons (
	id SERIAL NOT NULL, 
	user_id INTEGER, 
	title VARCHAR(200) NOT NULL, 
	scenario_ids JSON NOT NULL, 
	share_slug VARCHAR(24), 
	folder VARCHAR(80), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ix_saved_comparisons_share_slug ON saved_comparisons (share_slug);
CREATE INDEX ix_saved_comparisons_user_id ON saved_comparisons (user_id);

CREATE TABLE scenarios (
	id SERIAL NOT NULL, 
	user_id INTEGER, 
	college_id VARCHAR(80) NOT NULL, 
	major_id VARCHAR(80) NOT NULL, 
	residency residency NOT NULL, 
	living living_arrangement NOT NULL, 
	career_city_id VARCHAR(10), 
	years_to_graduate INTEGER NOT NULL, 
	share_slug VARCHAR(24), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(college_id) REFERENCES colleges (id), 
	FOREIGN KEY(major_id) REFERENCES majors (id), 
	FOREIGN KEY(career_city_id) REFERENCES cities (id), 
	UNIQUE (share_slug)
);

CREATE INDEX ix_scenarios_college_id ON scenarios (college_id);
CREATE INDEX ix_scenarios_major_id ON scenarios (major_id);
CREATE INDEX ix_scenarios_user_id ON scenarios (user_id);

CREATE TABLE dataset_versions (
	id SERIAL NOT NULL, 
	source_id VARCHAR(40) NOT NULL, 
	release_label VARCHAR(80) NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	processing_version VARCHAR(40) NOT NULL, 
	checksum VARCHAR(128), 
	row_count INTEGER, 
	is_demo BOOLEAN NOT NULL, 
	is_published BOOLEAN NOT NULL, 
	notes TEXT, 
	PRIMARY KEY (id), 
	UNIQUE (source_id, release_label, processing_version), 
	FOREIGN KEY(source_id) REFERENCES data_sources (id) ON DELETE RESTRICT
);

CREATE INDEX ix_dataset_versions_is_demo ON dataset_versions (is_demo);
CREATE INDEX ix_dataset_versions_source_id ON dataset_versions (source_id);

CREATE TABLE saved_paths (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	scenario_id INTEGER NOT NULL, 
	label VARCHAR(120) NOT NULL, 
	saved_on DATE DEFAULT CURRENT_DATE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(scenario_id) REFERENCES scenarios (id) ON DELETE CASCADE
);

CREATE INDEX ix_saved_paths_scenario_id ON saved_paths (scenario_id);
CREATE INDEX ix_saved_paths_user_id ON saved_paths (user_id);

CREATE TABLE scenario_assumptions (
	id SERIAL NOT NULL, 
	scenario_id INTEGER NOT NULL, 
	key VARCHAR(60) NOT NULL, 
	value NUMERIC(14, 4) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (scenario_id, key), 
	FOREIGN KEY(scenario_id) REFERENCES scenarios (id) ON DELETE CASCADE
);

CREATE INDEX ix_scenario_assumptions_scenario_id ON scenario_assumptions (scenario_id);

CREATE TABLE career_growth_data (
	id SERIAL NOT NULL, 
	occupation_id VARCHAR(80) NOT NULL, 
	growth_10yr_pct NUMERIC(6, 2) NOT NULL, 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (occupation_id, data_year), 
	FOREIGN KEY(occupation_id) REFERENCES occupations (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_career_growth_data_dataset_version_id ON career_growth_data (dataset_version_id);
CREATE INDEX ix_career_growth_data_occupation_id ON career_growth_data (occupation_id);

CREATE TABLE career_salary_data (
	id SERIAL NOT NULL, 
	occupation_id VARCHAR(80) NOT NULL, 
	city_id VARCHAR(10), 
	median_wage NUMERIC(12, 2) NOT NULL, 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (occupation_id, city_id, data_year), 
	FOREIGN KEY(occupation_id) REFERENCES occupations (id) ON DELETE CASCADE, 
	FOREIGN KEY(city_id) REFERENCES cities (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_career_salary_data_city_id ON career_salary_data (city_id);
CREATE INDEX ix_career_salary_data_dataset_version_id ON career_salary_data (dataset_version_id);
CREATE INDEX ix_career_salary_data_occupation_id ON career_salary_data (occupation_id);

CREATE TABLE college_completion (
	id SERIAL NOT NULL, 
	college_id VARCHAR(80) NOT NULL, 
	cohort_year VARCHAR(20) NOT NULL, 
	grad_rate_4yr NUMERIC(6, 3), 
	grad_rate_6yr NUMERIC(6, 3), 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (college_id, cohort_year), 
	FOREIGN KEY(college_id) REFERENCES colleges (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_college_completion_college_id ON college_completion (college_id);
CREATE INDEX ix_college_completion_dataset_version_id ON college_completion (dataset_version_id);
CREATE INDEX ix_college_completion_grad_rate_6yr ON college_completion (grad_rate_6yr);

CREATE TABLE college_costs (
	id SERIAL NOT NULL, 
	college_id VARCHAR(80) NOT NULL, 
	academic_year VARCHAR(9) NOT NULL, 
	tuition_in_state NUMERIC(12, 2), 
	tuition_out_of_state NUMERIC(12, 2), 
	fees NUMERIC(12, 2), 
	room NUMERIC(12, 2), 
	board NUMERIC(12, 2), 
	books NUMERIC(12, 2), 
	transportation NUMERIC(12, 2), 
	misc NUMERIC(12, 2), 
	net_price NUMERIC(12, 2), 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (college_id, academic_year), 
	FOREIGN KEY(college_id) REFERENCES colleges (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_college_costs_academic_year ON college_costs (academic_year);
CREATE INDEX ix_college_costs_college_id ON college_costs (college_id);
CREATE INDEX ix_college_costs_dataset_version_id ON college_costs (dataset_version_id);
CREATE INDEX ix_college_costs_net_price ON college_costs (net_price);

CREATE TABLE college_debt (
	id SERIAL NOT NULL, 
	college_id VARCHAR(80) NOT NULL, 
	academic_year VARCHAR(9) NOT NULL, 
	median_debt NUMERIC(12, 2), 
	median_earnings_10yr NUMERIC(12, 2), 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (college_id, academic_year), 
	FOREIGN KEY(college_id) REFERENCES colleges (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_college_debt_college_id ON college_debt (college_id);
CREATE INDEX ix_college_debt_dataset_version_id ON college_debt (dataset_version_id);
CREATE INDEX ix_college_debt_median_debt ON college_debt (median_debt);
CREATE INDEX ix_college_debt_median_earnings_10yr ON college_debt (median_earnings_10yr);

CREATE TABLE college_financial_aid (
	id SERIAL NOT NULL, 
	college_id VARCHAR(80) NOT NULL, 
	academic_year VARCHAR(9) NOT NULL, 
	pct_receiving_grants NUMERIC(6, 3), 
	avg_grant NUMERIC(12, 2), 
	pct_borrowing NUMERIC(6, 3), 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (college_id, academic_year), 
	FOREIGN KEY(college_id) REFERENCES colleges (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_college_financial_aid_college_id ON college_financial_aid (college_id);
CREATE INDEX ix_college_financial_aid_dataset_version_id ON college_financial_aid (dataset_version_id);

CREATE TABLE cost_of_living (
	id SERIAL NOT NULL, 
	city_id VARCHAR(10) NOT NULL, 
	rpp_all_items NUMERIC(6, 2) NOT NULL, 
	median_rent_1br NUMERIC(12, 2), 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (city_id, data_year), 
	FOREIGN KEY(city_id) REFERENCES cities (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_cost_of_living_city_id ON cost_of_living (city_id);
CREATE INDEX ix_cost_of_living_dataset_version_id ON cost_of_living (dataset_version_id);

CREATE TABLE employment_rates (
	id SERIAL NOT NULL, 
	major_id VARCHAR(80) NOT NULL, 
	city_id VARCHAR(10), 
	employment_rate NUMERIC(6, 3) NOT NULL, 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(major_id) REFERENCES majors (id) ON DELETE CASCADE, 
	FOREIGN KEY(city_id) REFERENCES cities (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_employment_rates_dataset_version_id ON employment_rates (dataset_version_id);
CREATE INDEX ix_employment_rates_major_city ON employment_rates (major_id, city_id);

CREATE TABLE major_earnings (
	id SERIAL NOT NULL, 
	major_id VARCHAR(80) NOT NULL, 
	college_id VARCHAR(80), 
	career_stage career_stage NOT NULL, 
	median NUMERIC(12, 2), 
	is_fallback BOOLEAN NOT NULL, 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(major_id) REFERENCES majors (id) ON DELETE CASCADE, 
	FOREIGN KEY(college_id) REFERENCES colleges (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_major_earnings_dataset_version_id ON major_earnings (dataset_version_id);
CREATE INDEX ix_major_earnings_major_college ON major_earnings (major_id, college_id);

CREATE TABLE major_employment (
	id SERIAL NOT NULL, 
	major_id VARCHAR(80) NOT NULL, 
	unemployment_rate NUMERIC(6, 3), 
	underemployment_rate NUMERIC(6, 3), 
	grad_school_rate NUMERIC(6, 3), 
	months_to_first_job NUMERIC(5, 2), 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (major_id, data_year), 
	FOREIGN KEY(major_id) REFERENCES majors (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_major_employment_dataset_version_id ON major_employment (dataset_version_id);
CREATE INDEX ix_major_employment_major_id ON major_employment (major_id);

CREATE TABLE tax_data (
	id SERIAL NOT NULL, 
	state VARCHAR(2) NOT NULL, 
	city_id VARCHAR(10), 
	effective_rate NUMERIC(6, 4) NOT NULL, 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (state, city_id, data_year), 
	FOREIGN KEY(city_id) REFERENCES cities (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_tax_data_dataset_version_id ON tax_data (dataset_version_id);
CREATE INDEX ix_tax_data_state ON tax_data (state);

CREATE TABLE salary_percentiles (
	id SERIAL NOT NULL, 
	major_earnings_id INTEGER NOT NULL, 
	percentile INTEGER NOT NULL, 
	amount NUMERIC(12, 2) NOT NULL, 
	dataset_version_id INTEGER NOT NULL, 
	data_year VARCHAR(20) NOT NULL, 
	population TEXT, 
	sample_size INTEGER, 
	confidence confidence_level NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (major_earnings_id, percentile), 
	CONSTRAINT ck_percentile_value CHECK (percentile IN (10, 25, 50, 75, 90)), 
	FOREIGN KEY(major_earnings_id) REFERENCES major_earnings (id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_version_id) REFERENCES dataset_versions (id) ON DELETE RESTRICT
);

CREATE INDEX ix_salary_percentiles_dataset_version_id ON salary_percentiles (dataset_version_id);
CREATE INDEX ix_salary_percentiles_major_earnings_id ON salary_percentiles (major_earnings_id);

