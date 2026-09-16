-- ==============================================================================
-- DATABASE MIGRATION: CRF REMOVAL, DYNAMIC PRE-FILL SETTINGS & DATE TYPE ALIGNMENT
-- Compatible with PostgreSQL & Supabase
-- ==============================================================================

-- 1. REMOVE 'CRF' (Customer Request Form) COLUMNS
-- Drop CRF related columns safely if they exist in customers or bob_customers
ALTER TABLE IF EXISTS customers DROP COLUMN IF EXISTS crf_number;
ALTER TABLE IF EXISTS customers DROP COLUMN IF EXISTS crf_no;
ALTER TABLE IF EXISTS bob_customers DROP COLUMN IF EXISTS crf_number;
ALTER TABLE IF EXISTS bob_customers DROP COLUMN IF EXISTS crf_no;
ALTER TABLE IF EXISTS bob_settings DROP COLUMN IF EXISTS crf_prefix;
ALTER TABLE IF EXISTS bob_settings DROP COLUMN IF EXISTS default_crf_prefix;

-- 2. ADD STANDARD IDENTIFIER COLUMNS TO CUSTOMER TABLES
ALTER TABLE IF EXISTS bob_customers 
    ADD COLUMN IF NOT EXISTS reference_no VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS cif_no VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS account_no VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS sb_no VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS hb_no VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS sv_no VARCHAR(100) NULL;

ALTER TABLE IF EXISTS customers 
    ADD COLUMN IF NOT EXISTS reference_no VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS cif_no VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS account_no VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS sb_no VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS hb_no VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS sv_no VARCHAR(100) NULL;

-- 3. ENSURE BOB_SETTINGS TABLE EXISTS WITH ALL PREFIX COLUMNS
CREATE TABLE IF NOT EXISTS bob_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT DEFAULT 'bob_csp',
    csp_name TEXT DEFAULT 'Bank of Baroda CSP',
    csp_code TEXT DEFAULT '',
    csp_address TEXT DEFAULT '',
    link_branch TEXT DEFAULT '',
    branch_name TEXT DEFAULT '',
    branch_code TEXT DEFAULT '',
    ifsc_code TEXT DEFAULT '',
    operator_name TEXT DEFAULT 'CSP Operator',
    operator_contact TEXT DEFAULT '',
    ref_prefix TEXT DEFAULT 'BOB-',
    account_prefix TEXT DEFAULT '208801000',
    cif_prefix TEXT DEFAULT '987654',
    sb_prefix TEXT DEFAULT 'SB',
    hb_prefix TEXT DEFAULT '',
    sv_prefix TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add any missing prefix columns to bob_settings if table already existed
ALTER TABLE IF EXISTS bob_settings 
    ADD COLUMN IF NOT EXISTS ref_prefix TEXT DEFAULT 'BOB-',
    ADD COLUMN IF NOT EXISTS account_prefix TEXT DEFAULT '208801000',
    ADD COLUMN IF NOT EXISTS cif_prefix TEXT DEFAULT '987654',
    ADD COLUMN IF NOT EXISTS sb_prefix TEXT DEFAULT 'SB',
    ADD COLUMN IF NOT EXISTS hb_prefix TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS sv_prefix TEXT DEFAULT '';

-- 4. SYSTEM_SETTINGS (ID-BASED ROW FOR BOB_CSP_CONFIG)
-- Ensure system_settings table exists
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    tenant_id TEXT DEFAULT 'bob_csp',
    bank_name TEXT DEFAULT 'Bank of Baroda',
    branch_name TEXT DEFAULT 'CSP Branch',
    sol_id TEXT DEFAULT '',
    ifsc_code TEXT DEFAULT '',
    bc_agent_name TEXT DEFAULT 'CSP Operator',
    bc_agent_code TEXT DEFAULT '',
    bc_agent_mobile TEXT DEFAULT '',
    introducer_name TEXT DEFAULT '',
    introducer_account_no TEXT DEFAULT '',
    ckyc_logo_url TEXT NULL,
    sb_consent_logo_url TEXT NULL,
    custom_logos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert or update bob_csp_config row with 4 prefill settings inside custom_logos
INSERT INTO system_settings (id, bank_name, custom_logos, updated_at)
VALUES (
    'bob_csp_config',
    'Bank of Baroda',
    jsonb_build_object(
        'bob_settings', jsonb_build_object(
            'default_account_prefix', '208801000',
            'default_cif_prefix', '987654',
            'default_ref_prefix', 'BOB-',
            'default_sb_prefix', 'SB',
            'accountPrefix', '208801000',
            'cifPrefix', '987654',
            'refPrefix', 'BOB-',
            'sbPrefix', 'SB'
        )
    ),
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE 
SET bank_name = EXCLUDED.bank_name,
    custom_logos = COALESCE(system_settings.custom_logos, '{}'::jsonb) || EXCLUDED.custom_logos,
    updated_at = CURRENT_TIMESTAMP;

-- 5. DELIVERY TRACKING DATE COLUMNS ALIGNMENT
-- Ensure all tracking milestone date columns are typed as DATE / TIMESTAMPTZ (not boolean)
-- and boolean status flags are boolean columns.

DO $$
BEGIN
    -- Align bob_customers milestone date columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bob_customers') THEN
        -- Add _date columns if missing
        ALTER TABLE bob_customers ADD COLUMN IF NOT EXISTS passbook_issued_date DATE NULL;
        ALTER TABLE bob_customers ADD COLUMN IF NOT EXISTS passbook_delivered_date DATE NULL;
        ALTER TABLE bob_customers ADD COLUMN IF NOT EXISTS atm_issued_date DATE NULL;
        ALTER TABLE bob_customers ADD COLUMN IF NOT EXISTS atm_delivered_date DATE NULL;
        ALTER TABLE bob_customers ADD COLUMN IF NOT EXISTS form_submitted_date DATE NULL;

        -- Ensure boolean flag columns exist
        ALTER TABLE bob_customers ADD COLUMN IF NOT EXISTS passbook_issued BOOLEAN DEFAULT FALSE;
        ALTER TABLE bob_customers ADD COLUMN IF NOT EXISTS passbook_delivered BOOLEAN DEFAULT FALSE;
        ALTER TABLE bob_customers ADD COLUMN IF NOT EXISTS atm_issued BOOLEAN DEFAULT FALSE;
        ALTER TABLE bob_customers ADD COLUMN IF NOT EXISTS atm_delivered BOOLEAN DEFAULT FALSE;
        ALTER TABLE bob_customers ADD COLUMN IF NOT EXISTS form_submitted BOOLEAN DEFAULT FALSE;
    END IF;

    -- Align customers milestone date columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS form_submitted_date DATE NULL;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS form_submitted_at TIMESTAMPTZ NULL;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS passbook_issued_at TIMESTAMPTZ NULL;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS passbook_received_at TIMESTAMPTZ NULL;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS atm_issued_at TIMESTAMPTZ NULL;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS atm_received_at TIMESTAMPTZ NULL;

        ALTER TABLE customers ADD COLUMN IF NOT EXISTS form_submitted BOOLEAN DEFAULT FALSE;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS passbook_issued BOOLEAN DEFAULT FALSE;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS passbook_received BOOLEAN DEFAULT FALSE;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS atm_issued BOOLEAN DEFAULT FALSE;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS atm_received BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
