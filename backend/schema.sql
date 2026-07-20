CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS budget_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_code VARCHAR(50) UNIQUE NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    allocated_budget_kes NUMERIC(15, 2) NOT NULL,
    remaining_budget_kes NUMERIC(15, 2) NOT NULL
);

-- Seed with original sandbox training values
INSERT INTO budget_components (id, component_code, component_name, account_code, allocated_budget_kes, remaining_budget_kes)
VALUES 
    ('8f2d79a2-9b1a-4c28-98f5-30cf2f70b6d1', 'COMP-01', 'Value Chain Infrastructure Support', '4120-01', 35000000.00, 35000000.00),
    ('3c4b92c4-118e-4a67-b50a-f9b23f20b8e2', 'COMP-02', 'Agricultural Value Chain Finance', '4120-02', 15000000.00, 15000000.00)
ON CONFLICT (component_code) DO NOTHING;