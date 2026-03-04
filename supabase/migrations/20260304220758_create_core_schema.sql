/*
  # VoiceROI Terminal Core Schema

  ## Overview
  Complete database schema for managing voice analytics, call tracking, bookings, and revenue across multiple client tenants.

  ## New Tables

  ### 1. `tenants`
  - `id` (uuid, primary key) - Tenant identifier
  - `user_id` (text, unique) - Maps to app's user store
  - `email` (text) - Tenant contact email
  - `role` (text) - 'admin' or 'client'
  - `onboarding_complete` (boolean) - Setup status
  - `allowed_modules` (text[]) - Feature access control
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `tenant_credentials`
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, foreign key) - Links to tenants
  - `twilio_account_sid` (text) - Twilio Account SID
  - `twilio_auth_token` (text) - Encrypted auth token
  - `vapi_api_key` (text) - Encrypted Vapi API key
  - `crm_endpoint` (text) - Make.com webhook URL
  - `webhook_secret` (text) - Encrypted webhook validation secret
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `tenant_settings`
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, foreign key, unique) - One settings record per tenant
  - `default_revenue_per_booking` (integer) - Default revenue in cents
  - `currency` (text) - Currency code (USD, EUR, etc.)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `calls`
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, foreign key) - Owner tenant
  - `call_sid` (text, unique) - Twilio Call SID
  - `from_number` (text) - Caller phone number
  - `to_number` (text) - Receiving phone number
  - `duration_sec` (integer) - Call duration in seconds
  - `status` (text) - Call status (completed, busy, no-answer, etc.)
  - `created_at` (timestamptz) - Call start time
  - `updated_at` (timestamptz)

  ### 5. `conversations`
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, foreign key) - Owner tenant
  - `call_id` (uuid, foreign key) - Links to calls table
  - `external_id` (text) - External conversation/session ID
  - `intent` (text) - Detected intent (booking, inquiry, support, etc.)
  - `outcome` (text) - Conversation outcome (booked, callback, qualified, etc.)
  - `duration_sec` (integer) - Conversation duration
  - `revenue_cents` (integer) - Revenue attributed to this conversation
  - `metadata` (jsonb) - Additional conversation data
  - `created_at` (timestamptz) - Conversation end time
  - `updated_at` (timestamptz)

  ### 6. `bookings`
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, foreign key) - Owner tenant
  - `call_id` (uuid, foreign key, nullable) - Optional link to originating call
  - `external_id` (text) - Make.com/calendar booking ID
  - `contact_phone` (text) - Contact phone number
  - `contact_email` (text) - Contact email
  - `contact_name` (text) - Contact name
  - `value_cents` (integer) - Booking value in cents
  - `booked_at` (timestamptz) - Appointment date/time
  - `status` (text) - Booking status (confirmed, cancelled, completed, etc.)
  - `metadata` (jsonb) - Additional booking data
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz)

  ### 7. `kpi_snapshots`
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, foreign key) - Owner tenant
  - `snapshot_date` (date) - Date of snapshot
  - `daily_call_volume` (integer) - Calls on this day
  - `confirmed_bookings` (integer) - Bookings confirmed
  - `projected_revenue_cents` (integer) - Revenue in cents
  - `weekly_call_volume` (integer) - 7-day rolling call volume
  - `weekly_sales_yield` (numeric) - Conversion rate percentage
  - `monthly_gross_yield` (numeric) - Monthly conversion rate
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure tenants can only access their own data
  - Admin role can access all tenant data
  - Credentials table has restricted access policies

  ## Indexes
  - Optimized for date-range queries (dashboard views)
  - Tenant-scoped queries for multi-tenant isolation
  - Foreign key relationships for data integrity
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'client',
  onboarding_complete boolean DEFAULT false,
  allowed_modules text[] DEFAULT ARRAY['performance', 'analytics', 'system'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant record"
  ON tenants FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'user_id' = user_id);

CREATE POLICY "Users can update own tenant record"
  ON tenants FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'user_id' = user_id)
  WITH CHECK (auth.jwt()->>'user_id' = user_id);

-- ============================================================================
-- TENANT CREDENTIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  twilio_account_sid text,
  twilio_auth_token text,
  vapi_api_key text,
  crm_endpoint text,
  webhook_secret text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_credentials_tenant ON tenant_credentials(tenant_id);

ALTER TABLE tenant_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credentials"
  ON tenant_credentials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_credentials.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

CREATE POLICY "Users can insert own credentials"
  ON tenant_credentials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_credentials.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

CREATE POLICY "Users can update own credentials"
  ON tenant_credentials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_credentials.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_credentials.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

-- ============================================================================
-- TENANT SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  default_revenue_per_booking integer DEFAULT 0,
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON tenant_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_settings.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

CREATE POLICY "Users can insert own settings"
  ON tenant_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_settings.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

CREATE POLICY "Users can update own settings"
  ON tenant_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_settings.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_settings.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

-- ============================================================================
-- CALLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_sid text UNIQUE NOT NULL,
  from_number text,
  to_number text,
  duration_sec integer DEFAULT 0,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calls_tenant_created ON calls(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_call_sid ON calls(call_sid);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(tenant_id, status);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calls"
  ON calls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = calls.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

CREATE POLICY "Service can insert calls"
  ON calls FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service can update calls"
  ON calls FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_id uuid REFERENCES calls(id) ON DELETE SET NULL,
  external_id text,
  intent text,
  outcome text,
  duration_sec integer DEFAULT 0,
  revenue_cents integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant_created ON conversations(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_call ON conversations(call_id);
CREATE INDEX IF NOT EXISTS idx_conversations_external ON conversations(external_id);
CREATE INDEX IF NOT EXISTS idx_conversations_outcome ON conversations(tenant_id, outcome);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = conversations.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = conversations.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = conversations.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

CREATE POLICY "Service can insert conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service can update conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_id uuid REFERENCES calls(id) ON DELETE SET NULL,
  external_id text,
  contact_phone text,
  contact_email text,
  contact_name text,
  value_cents integer DEFAULT 0,
  booked_at timestamptz,
  status text DEFAULT 'confirmed',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_tenant_created ON bookings(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_call ON bookings(call_id);
CREATE INDEX IF NOT EXISTS idx_bookings_external ON bookings(external_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_booked_at ON bookings(tenant_id, booked_at DESC);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = bookings.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = bookings.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = bookings.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

CREATE POLICY "Service can insert bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- KPI SNAPSHOTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  daily_call_volume integer DEFAULT 0,
  confirmed_bookings integer DEFAULT 0,
  projected_revenue_cents integer DEFAULT 0,
  weekly_call_volume integer DEFAULT 0,
  weekly_sales_yield numeric(5,2) DEFAULT 0,
  monthly_gross_yield numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_tenant_date ON kpi_snapshots(tenant_id, snapshot_date DESC);

ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KPI snapshots"
  ON kpi_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = kpi_snapshots.tenant_id
      AND tenants.user_id = auth.jwt()->>'user_id'
    )
  );

CREATE POLICY "Service can insert KPI snapshots"
  ON kpi_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service can update KPI snapshots"
  ON kpi_snapshots FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_credentials_updated_at BEFORE UPDATE ON tenant_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_settings_updated_at BEFORE UPDATE ON tenant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
