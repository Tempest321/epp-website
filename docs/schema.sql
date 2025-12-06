-- EPP Canonical Data Schema
-- PostgreSQL 15+ with pgvector extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table (multi-tenant)
CREATE TABLE companies (
    company_id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    industry_focus TEXT[],
    regions_active TEXT[],
    avg_project_size FLOAT,
    model_version_id TEXT,
    lora_adapter_path TEXT,
    onboarding_date DATE NOT NULL,
    subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    project_id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(company_id),
    project_name TEXT NOT NULL,
    sector TEXT, -- industrial, commercial, infrastructure
    project_type TEXT, -- plant, road, bridge, building, pipeline
    location_country TEXT,
    location_region TEXT,
    location_climate TEXT, -- tropical, temperate, arctic, arid
    location_urban_rural TEXT CHECK (location_urban_rural IN ('urban', 'suburban', 'rural')),
    contract_type TEXT CHECK (contract_type IN ('lump_sum', 'time_materials', 'gmp', 'cost_plus')),
    project_size_primary FLOAT,
    project_size_unit TEXT,
    estimated_cost_total FLOAT,
    actual_cost_total FLOAT,
    baseline_cost FLOAT, -- parametric baseline for ratio calculation
    estimated_duration_days INT,
    actual_duration_days INT,
    start_date DATE,
    end_date DATE,
    complexity_score FLOAT, -- 0.0 to 1.0
    risk_score FLOAT, -- 0.0 to 1.0, model-generated
    scope_text TEXT,
    scope_embedding vector(768), -- LLaMA embeddings
    status TEXT CHECK (status IN ('planned', 'active', 'completed', 'cancelled')) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_projects_embedding ON projects USING ivfflat (scope_embedding vector_cosine_ops);

-- Deliverable classes (master taxonomy)
CREATE TABLE deliverable_classes (
    class_id TEXT PRIMARY KEY,
    class_name TEXT NOT NULL UNIQUE,
    discipline TEXT, -- civil, structural, mechanical, electrical, etc.
    typical_units TEXT[],
    avg_cost_per_unit FLOAT, -- across all companies (anonymized benchmark)
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deliverables / line items / work packages
CREATE TABLE deliverables (
    deliverable_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    line_number INT,
    description_raw TEXT,
    description_normalized TEXT,
    deliverable_class TEXT REFERENCES deliverable_classes(class_id),
    discipline TEXT,
    quantity FLOAT,
    unit TEXT,
    estimated_cost FLOAT,
    actual_cost FLOAT,
    estimated_duration INT, -- days
    actual_duration INT,
    embedding vector(768),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deliverables_project ON deliverables(project_id);
CREATE INDEX idx_deliverables_class ON deliverables(deliverable_class);
CREATE INDEX idx_deliverables_embedding ON deliverables USING ivfflat (embedding vector_cosine_ops);

-- Documents
CREATE TABLE documents (
    document_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    doc_type TEXT CHECK (doc_type IN ('rfp', 'sow', 'proposal', 'drawings', 'specs', 'boq', 'other')),
    file_path TEXT,
    file_name TEXT,
    text_content TEXT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(doc_type);

-- Execution signals (change orders, RFIs, delays, etc.)
CREATE TABLE execution_signals (
    signal_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    signal_type TEXT CHECK (signal_type IN ('change_order', 'rfi', 'rework', 'delay_event', 'other')),
    date DATE NOT NULL,
    description TEXT,
    cost_impact FLOAT,
    schedule_impact_days INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_signals_project ON execution_signals(project_id);
CREATE INDEX idx_signals_type ON execution_signals(signal_type);

-- Precomputed project features (feature store)
CREATE TABLE project_features (
    project_id TEXT PRIMARY KEY REFERENCES projects(project_id) ON DELETE CASCADE,
    scope_embedding vector(768),
    complexity_score FLOAT,
    risk_score FLOAT,
    num_deliverables INT,
    num_disciplines INT,
    num_high_risk_items INT,
    share_concrete_pct FLOAT,
    share_steel_pct FLOAT,
    share_electrical_pct FLOAT,
    share_mechanical_pct FLOAT,
    location_features JSONB,
    temporal_features JSONB,
    historical_similar_avg_cost_ratio FLOAT,
    historical_similar_avg_duration_ratio FLOAT,
    deliverable_class_distribution JSONB,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deliverable misestimation statistics (per company)
CREATE TABLE deliverable_misestimation_stats (
    company_id TEXT NOT NULL REFERENCES companies(company_id),
    deliverable_class TEXT NOT NULL REFERENCES deliverable_classes(class_id),
    avg_cost_error FLOAT, -- (actual - estimated) / estimated
    std_cost_error FLOAT,
    avg_duration_error FLOAT,
    std_duration_error FLOAT,
    sample_size INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, deliverable_class)
);

CREATE INDEX idx_misestimation_company ON deliverable_misestimation_stats(company_id);

-- Predictions log (for audit and retraining)
CREATE TABLE predictions (
    prediction_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    company_id TEXT NOT NULL REFERENCES companies(company_id),
    project_id TEXT REFERENCES projects(project_id), -- NULL for new projects
    model_version TEXT NOT NULL,
    input_features JSONB,
    predicted_cost_p50 FLOAT,
    predicted_cost_p80 FLOAT,
    predicted_cost_p90 FLOAT,
    predicted_duration_p50 FLOAT,
    predicted_duration_p80 FLOAT,
    predicted_duration_p90 FLOAT,
    confidence_score FLOAT,
    explanation JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_company ON predictions(company_id);
CREATE INDEX idx_predictions_project ON predictions(project_id);

-- Model registry
CREATE TABLE model_versions (
    model_version_id TEXT PRIMARY KEY,
    model_type TEXT CHECK (model_type IN ('llm_base', 'llm_adapter', 'tabular_predictor')),
    company_id TEXT REFERENCES companies(company_id), -- NULL for base models
    artifact_path TEXT NOT NULL,
    metrics JSONB,
    hyperparameters JSONB,
    training_data_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_models_company ON model_versions(company_id);
CREATE INDEX idx_models_type ON model_versions(model_type);

-- User activity tracking (for usage metrics)
CREATE TABLE user_activity (
    activity_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    company_id TEXT NOT NULL REFERENCES companies(company_id),
    user_id TEXT NOT NULL,
    action TEXT NOT NULL, -- predict, view_similar, export, etc.
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_company ON user_activity(company_id);
CREATE INDEX idx_activity_user ON user_activity(user_id);
CREATE INDEX idx_activity_created ON user_activity(created_at);

-- Views for common queries

-- View: Project cost/duration ratios
CREATE VIEW project_ratios AS
SELECT
    p.project_id,
    p.company_id,
    p.project_name,
    CASE
        WHEN p.estimated_cost_total > 0 THEN p.actual_cost_total / p.estimated_cost_total
        ELSE NULL
    END AS cost_ratio,
    CASE
        WHEN p.estimated_duration_days > 0 THEN p.actual_duration_days::FLOAT / p.estimated_duration_days
        ELSE NULL
    END AS duration_ratio,
    p.sector,
    p.project_type,
    p.complexity_score
FROM projects p
WHERE p.status = 'completed'
  AND p.actual_cost_total IS NOT NULL
  AND p.actual_duration_days IS NOT NULL;

-- View: Deliverable-level errors
CREATE VIEW deliverable_errors AS
SELECT
    d.deliverable_id,
    d.project_id,
    p.company_id,
    d.deliverable_class,
    d.discipline,
    CASE
        WHEN d.estimated_cost > 0 THEN (d.actual_cost - d.estimated_cost) / d.estimated_cost
        ELSE NULL
    END AS cost_error,
    CASE
        WHEN d.estimated_duration > 0 THEN (d.actual_duration - d.estimated_duration)::FLOAT / d.estimated_duration
        ELSE NULL
    END AS duration_error
FROM deliverables d
JOIN projects p ON d.project_id = p.project_id
WHERE d.actual_cost IS NOT NULL
  AND d.actual_duration IS NOT NULL
  AND p.status = 'completed';

-- Function: Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON deliverables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development (optional, comment out for production)
-- This creates a few standard deliverable classes
INSERT INTO deliverable_classes (class_id, class_name, discipline, typical_units) VALUES
    ('concrete_foundation_gen', 'Concrete Foundation - General', 'civil', ARRAY['cy', 'm3']),
    ('concrete_foundation_ind', 'Concrete Foundation - Industrial Equipment', 'civil', ARRAY['cy', 'm3']),
    ('steel_structural', 'Structural Steel - General', 'structural', ARRAY['ton', 'kg']),
    ('electrical_switchgear', 'Electrical Switchgear Installation', 'electrical', ARRAY['ea', 'unit']),
    ('hvac_ductwork', 'HVAC Ductwork Installation', 'mechanical', ARRAY['lf', 'm']),
    ('piping_carbon_steel', 'Piping - Carbon Steel', 'mechanical', ARRAY['lf', 'm']),
    ('piping_stainless', 'Piping - Stainless Steel', 'mechanical', ARRAY['lf', 'm']);
