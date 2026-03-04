# VoiceROI Terminal – Database Setup Guide

Complete guide for setting up and using the Supabase database for live data management.

---

## Overview

The VoiceROI Terminal now uses **Supabase PostgreSQL** to store and manage all live data from:

- **Twilio** (call logs and volume)
- **Vapi** (conversation AI with intents and outcomes)
- **Make.com** (bookings and appointments)

All data is multi-tenant, meaning each client only sees their own data.

---

## Database Schema

### Tables

1. **`tenants`** – Client accounts
   - `id` (uuid) – Primary key
   - `user_id` (text) – Maps to app's user store
   - `email` (text)
   - `role` (text) – 'admin' or 'client'
   - `onboarding_complete` (boolean)
   - `allowed_modules` (text[]) – Feature access
   - `created_at`, `updated_at`

2. **`tenant_credentials`** – API keys (one per tenant)
   - `tenant_id` (uuid) – Foreign key to tenants
   - `twilio_account_sid` (text)
   - `twilio_auth_token` (text)
   - `vapi_api_key` (text)
   - `crm_endpoint` (text)
   - `webhook_secret` (text)
   - `created_at`, `updated_at`

3. **`tenant_settings`** – Revenue and currency settings
   - `tenant_id` (uuid) – Foreign key to tenants
   - `default_revenue_per_booking` (integer) – Revenue in cents
   - `currency` (text) – Currency code (USD, EUR, etc.)
   - `created_at`, `updated_at`

4. **`calls`** – Call logs from Twilio
   - `tenant_id` (uuid)
   - `call_sid` (text, unique) – Twilio Call SID
   - `from_number`, `to_number` (text)
   - `duration_sec` (integer)
   - `status` (text)
   - `created_at`, `updated_at`

5. **`conversations`** – AI conversation data from Vapi
   - `tenant_id` (uuid)
   - `call_id` (uuid) – Links to calls
   - `external_id` (text) – Vapi conversation ID
   - `intent` (text) – booking, inquiry, support, etc.
   - `outcome` (text) – booked, callback, no_answer, etc.
   - `duration_sec` (integer)
   - `revenue_cents` (integer)
   - `metadata` (jsonb)
   - `created_at`, `updated_at`

6. **`bookings`** – Appointments from Make.com
   - `tenant_id` (uuid)
   - `call_id` (uuid, nullable) – Optional link to call
   - `external_id` (text) – Calendar/CRM booking ID
   - `contact_phone`, `contact_email`, `contact_name` (text)
   - `value_cents` (integer)
   - `booked_at` (timestamptz) – Appointment time
   - `status` (text) – confirmed, cancelled, completed
   - `metadata` (jsonb)
   - `created_at`, `updated_at`

7. **`kpi_snapshots`** – Precomputed daily KPIs (optional)
   - `tenant_id` (uuid)
   - `snapshot_date` (date)
   - `daily_call_volume`, `confirmed_bookings`, `projected_revenue_cents`
   - `weekly_call_volume`, `weekly_sales_yield`, `monthly_gross_yield`
   - `created_at`

---

## Setup Instructions

### 1. Get Supabase credentials

1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to **Settings** → **API**
3. Copy your:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **Anon public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 2. Add to `.env.local`

Create or update `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SESSION_SECRET=your-session-secret-change-in-production
```

### 3. Database is already migrated

The database schema was created via the migration in this project. You don't need to run any SQL manually.

### 4. Test the connection

Run the development server:

```bash
npm run dev
```

Log in as admin (`admin@voiceroi.local` / `admin`) and go to **Settings**. When you save API keys, they'll be stored in the database.

---

## Webhook Endpoints

### Twilio webhook

**URL:** `https://your-app.vercel.app/api/webhooks/twilio`

**Configure in Twilio:**
1. Go to **Console** → **Phone Numbers** → select your number
2. Under **Voice & Fax**, set **A Call Comes In** webhook to the URL above
3. Set **HTTP POST**

**Payload (Twilio sends):**
- `CallSid` – Unique call identifier
- `From`, `To` – Phone numbers
- `CallDuration` – Duration in seconds
- `CallStatus` – completed, busy, no-answer, etc.
- `AccountSid` – Your Twilio Account SID

### Vapi webhook

**URL:** `https://your-app.vercel.app/api/webhooks/vapi`

**Configure in Vapi:**
1. Go to **Dashboard** → **Settings** → **Webhooks**
2. Add webhook URL above
3. Subscribe to event: `end-of-call-report`

**Payload (Vapi sends):**
```json
{
  "message": {
    "type": "end-of-call-report",
    "analysis": {
      "intent": "booking",
      "outcome": "booked"
    }
  },
  "call": {
    "id": "vapi-call-id",
    "duration": 180,
    "metadata": {
      "twilioCallSid": "CA123..."
    }
  }
}
```

**Important:** Include `twilioCallSid` in Vapi call metadata so we can link conversations to calls.

### Make.com webhook

**URL:** `https://your-app.vercel.app/api/webhooks/make`

**Configure in Make.com:**
1. Create a scenario triggered by your calendar/appointment app (Calendly, Google Calendar, etc.)
2. Add action: **Webhooks** → **Custom webhook**
3. Set URL to the endpoint above
4. Send JSON body:

```json
{
  "tenantId": "tenant-uuid-from-your-app",
  "appointmentId": "cal-123",
  "contactPhone": "+1234567890",
  "contactEmail": "john@example.com",
  "contactName": "John Doe",
  "value": 150,
  "bookedAt": "2024-01-15T10:00:00Z",
  "callSid": "CA123...",
  "status": "confirmed"
}
```

**Required fields:**
- `tenantId` – Get this from the tenant's dashboard or admin panel
- At least one of: `contactPhone`, `contactEmail`, `contactName`

**Optional fields:**
- `value` – Revenue in dollars (will be converted to cents); if omitted, uses `default_revenue_per_booking`
- `callSid` – Links booking to a call
- `bookedAt` – Appointment time; defaults to now if omitted
- `status` – Booking status; defaults to `confirmed`

---

## Dashboard Data API

The dashboard now fetches live data from the database instead of using mock data.

**Endpoint:** `GET /api/dashboard/data`

**Returns:**
```json
{
  "kpis": {
    "dailyCallVolume": 42,
    "confirmedBookings": 12,
    "projectedRevenue": 1800,
    "weeklyCallVolume": 284,
    "weeklySalesYield": 15.5,
    "monthlyGrossYield": 12.3
  },
  "pipelineRows": [
    {
      "id": "uuid",
      "time": "2:30 PM",
      "caller": "+1 555-0123",
      "intent": "Booking",
      "outcome": "Booked",
      "revenue": 150
    }
  ],
  "lastSync": "Jan 15, 2:45 PM"
}
```

---

## Data Flow

### 1. Call comes in
1. Twilio receives call
2. Twilio webhook → `/api/webhooks/twilio`
3. App stores call in `calls` table

### 2. Conversation ends (Vapi)
1. Vapi processes conversation, detects intent/outcome
2. Vapi webhook → `/api/webhooks/vapi`
3. App stores conversation in `conversations` table, linked to call via `call_sid`

### 3. Booking created (Make.com)
1. User books appointment (Calendly, Google Calendar, etc.)
2. Make.com scenario triggers
3. Make.com webhook → `/api/webhooks/make`
4. App stores booking in `bookings` table
5. If `callSid` provided, links booking to call and updates conversation revenue

### 4. Dashboard loads
1. User opens dashboard
2. App calls `/api/dashboard/data`
3. App queries database for:
   - Today's calls and bookings (daily KPIs)
   - Last 7 days (weekly KPIs)
   - Last 30 days (monthly KPIs)
   - Recent conversations (pipeline table)
4. Dashboard displays live data

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled. Tenants can only access their own data.

**Example policy (on `calls`):**
```sql
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
```

### Credentials

API keys (`twilio_auth_token`, `vapi_api_key`, `webhook_secret`) are stored in `tenant_credentials`. In production, consider encrypting these at the application level before storing.

---

## Migration to Database

The app still uses in-memory user authentication (`lib/userStore.ts`) but all **data** (calls, conversations, bookings, settings) is now stored in Supabase.

**What's still in-memory:**
- User accounts (email, password hash, role)
- Session management

**What's in Supabase:**
- Tenant records (synced from users)
- API credentials
- Revenue settings
- All call, conversation, and booking data

---

## Troubleshooting

### No data showing in dashboard

1. Check that you've added Supabase credentials to `.env.local`
2. Verify webhooks are configured correctly in Twilio, Vapi, and Make.com
3. Check browser console and server logs for errors
4. Test webhook endpoints manually with curl:

```bash
# Test Twilio webhook
curl -X POST https://your-app.vercel.app/api/webhooks/twilio \
  -d "CallSid=CA123&AccountSid=AC123&From=%2B1234567890&To=%2B9876543210&CallDuration=120&CallStatus=completed"

# Test Make.com webhook
curl -X POST https://your-app.vercel.app/api/webhooks/make \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"your-tenant-uuid","contactPhone":"+1234567890","value":150}'
```

### Tenant ID for webhooks

To get your `tenantId` for Make.com webhooks:
1. Log in to your dashboard
2. Open browser console
3. Run: `await fetch('/api/auth/session', {credentials: 'include'}).then(r => r.json())`
4. Or query Supabase directly: `SELECT id FROM tenants WHERE email = 'your@email.com'`

---

## Next Steps

1. Set up Twilio, Vapi, and Make.com webhooks (see above)
2. Configure your API keys in the app Settings page
3. Make a test call to verify Twilio → Vapi → Database flow
4. Create a test booking in your calendar to verify Make.com → Database flow
5. Refresh your dashboard to see live data

For questions or issues, see `docs/LIVE_DATA_SPEC.md` or open an issue in the repo.
