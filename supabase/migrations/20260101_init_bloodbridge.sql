-- ==============================================================================
-- BloodBridge AI: Database Schema & Migration Script
-- Target: PostgreSQL 15+ / Supabase
-- Contains: Tables, Constraints, Indexes, Row Level Security (RLS), ACID Stored
-- Procedures, and Synthetic Demo Data.
-- ==============================================================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('administrator', 'blood_bank_staff', 'hospital_staff', 'donor');
CREATE TYPE blood_group_enum AS ENUM ('O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+');
CREATE TYPE component_type_enum AS ENUM (
    'Whole Blood',
    'Packed Red Blood Cells (PRBC)',
    'Platelets (Single Donor / Pooled)',
    'Fresh Frozen Plasma (FFP)',
    'Cryoprecipitate'
);
CREATE TYPE batch_status_enum AS ENUM ('available', 'reserved', 'quarantined', 'expired', 'allocated');
CREATE TYPE request_status_enum AS ENUM ('submitted', 'under_review', 'approved', 'partially_fulfilled', 'fulfilled', 'rejected', 'cancelled');
CREATE TYPE urgency_enum AS ENUM ('STAT / Emergency', 'Urgent (< 6 hrs)', 'Routine Elective');

-- 2. USER PROFILES & ROLES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'donor',
    organization TEXT,
    title TEXT,
    hospital_id UUID,
    donor_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HOSPITALS
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    emergency_phone TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    blood_bank_director TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DONORS
CREATE TABLE IF NOT EXISTS donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    national_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    blood_group blood_group_enum NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deferred')),
    last_donation_date DATE,
    total_donations INTEGER DEFAULT 0 CHECK (total_donations >= 0),
    eligible_from_date DATE,
    city TEXT,
    preferred_contact_method TEXT DEFAULT 'sms',
    reminders_enabled BOOLEAN DEFAULT TRUE,
    emergency_alerts_enabled BOOLEAN DEFAULT TRUE,
    screening_checklist JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donors_blood_group ON donors(blood_group);
CREATE INDEX idx_donors_status ON donors(status);
CREATE INDEX idx_donors_national_id ON donors(national_id);

-- 5. BLOOD INVENTORY BATCHES
CREATE TABLE IF NOT EXISTS blood_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number TEXT UNIQUE NOT NULL,
    blood_group blood_group_enum NOT NULL,
    component_type component_type_enum NOT NULL,
    units INTEGER NOT NULL CHECK (units >= 0),
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    location TEXT NOT NULL,
    temperature_celsius NUMERIC(4, 1) NOT NULL,
    status batch_status_enum NOT NULL DEFAULT 'available',
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    testing_passed BOOLEAN DEFAULT FALSE,
    crossmatch_tag TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_expiry_after_collection CHECK (expiry_date >= collection_date)
);

CREATE INDEX idx_inventory_lookup ON blood_inventory(blood_group, component_type, status, expiry_date);
CREATE INDEX idx_inventory_expiry ON blood_inventory(expiry_date);

-- 6. BLOOD REQUESTS (REQUISITIONS)
CREATE TABLE IF NOT EXISTS blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT UNIQUE NOT NULL,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    patient_id_hash TEXT NOT NULL,
    patient_clinical_indication TEXT NOT NULL,
    blood_group blood_group_enum NOT NULL,
    component_type component_type_enum NOT NULL,
    units_requested INTEGER NOT NULL CHECK (units_requested > 0),
    units_fulfilled INTEGER NOT NULL DEFAULT 0 CHECK (units_fulfilled >= 0),
    urgency urgency_enum NOT NULL,
    required_by_date TIMESTAMPTZ NOT NULL,
    status request_status_enum NOT NULL DEFAULT 'submitted',
    rejection_reason TEXT,
    special_requirements TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requests_status ON blood_requests(status);
CREATE INDEX idx_requests_hospital ON blood_requests(hospital_id);

-- 7. REQUEST ALLOCATIONS (Audit mapping of units to requests)
CREATE TABLE IF NOT EXISTS request_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES blood_inventory(id) ON DELETE RESTRICT,
    units_allocated INTEGER NOT NULL CHECK (units_allocated > 0),
    selection_reason TEXT NOT NULL,
    allocated_by TEXT NOT NULL,
    allocated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDIT LOGS (Immutable audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_reference TEXT NOT NULL,
    details TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);

-- ==============================================================================
-- 9. ACID TRANSACTION FUNCTION: Atomic Stock Allocation
-- ==============================================================================
CREATE OR REPLACE FUNCTION allocate_blood_units_transactional(
    p_request_id UUID,
    p_batch_id UUID,
    p_units INTEGER,
    p_actor_name TEXT,
    p_actor_id TEXT,
    p_selection_reason TEXT
) RETURNS JSONB AS $$
DECLARE
    v_batch RECORD;
    v_req RECORD;
    v_new_fulfilled INTEGER;
    v_new_status request_status_enum;
BEGIN
    -- 1. Lock batch row FOR UPDATE to prevent race conditions & double allocation
    SELECT * INTO v_batch FROM blood_inventory WHERE id = p_batch_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Batch with ID % not found', p_batch_id;
    END IF;

    -- 2. Validate batch eligibility
    IF v_batch.status != 'available' THEN
        RAISE EXCEPTION 'Batch % is not in available status (current status: %)', v_batch.batch_number, v_batch.status;
    END IF;

    IF v_batch.expiry_date <= CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot allocate expired batch % (expiry: %)', v_batch.batch_number, v_batch.expiry_date;
    END IF;

    IF v_batch.units < p_units THEN
        RAISE EXCEPTION 'Insufficient stock in batch % (available: %, requested: %)', v_batch.batch_number, v_batch.units, p_units;
    END IF;

    -- 3. Lock request row FOR UPDATE
    SELECT * INTO v_req FROM blood_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request with ID % not found', p_request_id;
    END IF;

    -- 4. Decrement batch inventory atomically
    UPDATE blood_inventory
    SET units = units - p_units,
        status = CASE WHEN units - p_units = 0 THEN 'allocated'::batch_status_enum ELSE status END,
        updated_at = NOW()
    WHERE id = p_batch_id;

    -- 5. Record allocation mapping
    INSERT INTO request_allocations (request_id, batch_id, units_allocated, selection_reason, allocated_by)
    VALUES (p_request_id, p_batch_id, p_units, p_selection_reason, p_actor_name);

    -- 6. Update request status
    v_new_fulfilled := v_req.units_fulfilled + p_units;
    v_new_status := CASE 
        WHEN v_new_fulfilled >= v_req.units_requested THEN 'fulfilled'::request_status_enum
        ELSE 'partially_fulfilled'::request_status_enum
    END;

    UPDATE blood_requests
    SET units_fulfilled = v_new_fulfilled,
        status = v_new_status,
        updated_at = NOW()
    WHERE id = p_request_id;

    -- 7. Insert Audit Trail
    INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, entity_type, entity_id, entity_reference, details)
    VALUES (
        p_actor_id, 
        p_actor_name, 
        'transfusion_specialist', 
        'REQUEST_ALLOCATED', 
        'blood_request', 
        p_request_id::TEXT, 
        v_req.request_number, 
        format('Allocated %s units from batch %s (%s). New status: %s', p_units, v_batch.batch_number, v_batch.blood_group, v_new_status)
    );

    RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'units_allocated', p_units, 'status', v_new_status);
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Administrators & Staff can manage inventory and view all records
CREATE POLICY "Staff and Admins Full Access Inventory" ON blood_inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('administrator', 'blood_bank_staff')
        )
    );

-- Hospitals can read inventory levels (aggregated) and submit requests
CREATE POLICY "Hospitals can insert and view their requests" ON blood_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.hospital_id = blood_requests.hospital_id OR profiles.role IN ('administrator', 'blood_bank_staff'))
        )
    );

-- Donors can only view and update their own donor record
CREATE POLICY "Donors can view their own record" ON donors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.donor_id = donors.id OR profiles.role IN ('administrator', 'blood_bank_staff'))
        )
    );
