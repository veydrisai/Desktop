# Live Data Stream – What You Need

This doc maps **every piece of data** the client sees in the dashboard to **real sources** (Twilio, Make.com, Vappy/Vapi) and spells out what you need for a **live data stream**, plus a **database recommendation**.

---

## 1. Data we show the client (current UI)

### Performance (main dashboard)

| Data point | What it is | Today |
|------------|------------|--------|
| **Daily Call Volume** | Number of calls today | Mock count |
| **Confirmed Bookings** | Bookings confirmed in the period | Mock count |
| **Projected Revenue** | $ from calls/bookings | Mock $ |
| **Weekly Revenue** | This week $, last week $, week-over-week % | Derived from projected revenue |
| **Weekly Call Volume** | Calls in last 7 days | Mock count |
| **Weekly Sales Yield** | % of calls that convert (e.g. to booking) | Mock % |
| **Monthly Gross Yield** | Same idea, monthly | Mock % |
| **Conversation Pipeline** | Table: Time, Caller, Intent, Outcome, Revenue | Mock rows |
| **Last Sync** | When data was last updated | "No sync yet" / "Just now" |

### Conversation Analytics

| Data point | What it is | Today |
|------------|------------|--------|
| **Total conversations** (7d / 30d) | Count of conversations in range | Static mock |
| **Avg duration** | Average call/conversation length | Static mock |
| **Intent match rate** | % where detected intent was correct/used | Static mock |
| **Breakdown by outcome** | Booked, Callback, Qualified, No answer, Not interested (count + %) | Static mock |
| **Top intents** | Booking, Inquiry, Support, Follow-up (counts) | Static mock |

### Nurture Pro / Review Booster / System

- Currently static or placeholder; can be filled later from Make.com (sequences) and review tools.

---

## 2. Where live data should come from

Assumptions:

- **Twilio** = phone numbers, call control, call logs (who called, when, duration, status).
- **Vappy** = assumed to be **Vapi** or similar (voice/conversation AI). If you use another vendor, the same ideas apply.
- **Make.com** = appointments/bookings (e.g. Calendly, Cal.com, Google Calendar, CRM), and automation between Twilio + appointments.

High-level flow:

- **Calls** → Twilio (and optionally Vapi) → your backend stores **calls** and **conversation results**.
- **Bookings** → Make.com (or calendar/CRM) → your backend stores **bookings** and optionally links them to calls.
- **Revenue** → from bookings (e.g. value per booking) or from your CRM; can be sent via Make.com or a webhook.

---

## 3. Source mapping for live data

### Calls and call volume

| UI metric | Source | How to get it |
|----------|--------|----------------|
| Daily Call Volume | Twilio | Twilio API: **Calls** list, filter by `dateCreated` = today, count. |
| Weekly Call Volume | Twilio | Same, filter by last 7 days. |
| Pipeline: Time, Caller | Twilio | From each **Call**: `dateCreated`, `from` (caller number). |
| Pipeline: duration (if you add it) | Twilio | Call `duration` or compute from start/end. |

**What you need:**

- **Twilio Account SID + Auth Token** (already in Settings/Onboarding).
- Backend job or **Twilio webhook** on call completion that:
  - Receives call SID, from, to, duration, status.
  - Writes/updates a row in your DB (see schema below).

### Conversation AI (intent, outcome)

| UI metric | Source | How to get it |
|----------|--------|----------------|
| Pipeline: Intent | Vapi (or your voice AI) | After-call webhook or API: “intent” or “summary” field. |
| Pipeline: Outcome | Vapi / Make.com | Vapi: outcome (e.g. booked, callback, no_answer). Or Make.com sets outcome when it creates a booking. |
| Conversation Analytics: all metrics | Derived | From stored **conversations**: aggregate by date range, compute totals, avg duration, outcome breakdown, top intents. |

**What you need:**

- **Vapi** (or similar) webhook or API that sends per-call:
  - Call/call SID (to link to Twilio call).
  - Intent (e.g. booking, inquiry, support).
  - Outcome (e.g. booked, callback, no_answer, qualified, not_interested).
  - Duration (or use Twilio’s).
- Backend that receives this and stores one row per **conversation** (or augments the call row).

### Bookings and revenue

| UI metric | Source | How to get it |
|----------|--------|----------------|
| Confirmed Bookings | Make.com | Make.com scenario: when appointment is confirmed, POST to your API (webhook) with booking details. |
| Projected Revenue | Make.com / CRM | Same webhook or a second one: send “value” or “revenue” per booking; or derive from booking type. |
| Weekly Revenue (this week / last week) | Your DB | Sum of **revenue** from bookings (or from calls with revenue) in current week vs previous week. |
| Pipeline: Revenue | Make.com / backend | When a call leads to a booking, link booking revenue to that call; or send revenue in the “conversation completed” payload. |

**What you need:**

- **Make.com scenario** that:
  - Triggers on: “Appointment confirmed” (or “New calendar event” in your appointment tool).
  - Action: **Webhook** to your backend: `{ appointmentId, contactPhoneOrId, value?, startTime, ... }`.
- Optional: **Make.com** also triggered when a **call ends** (from Twilio) so you can send call SID + outcome from Vapi and link call ↔ booking in your DB.

### Yields (sales / gross)

| UI metric | Source | How to get it |
|----------|--------|----------------|
| Weekly Sales Yield % | Your DB | e.g. (calls with outcome “Booked” or “Qualified” in 7d) / (total calls in 7d) × 100. |
| Monthly Gross Yield % | Your DB | Same logic over 30 days, or define “gross” as revenue-based and compute from bookings. |

These are **derived** in your backend from stored calls + conversation outcomes (and optionally bookings).

---

## 4. What you need to implement (checklist)

### Twilio

- [ ] **Twilio number(s)** for your business.
- [ ] **Credentials**: Account SID, Auth Token (you already collect these in Settings).
- [ ] **Webhook** for “call completed” → your backend (so every call creates/updates a row).
- [ ] Optional: Twilio **Sync** or **Functions** if you want to keep some logic inside Twilio; not required if your backend does the work.

### Vapi (or “Vappy” / voice AI)

- [ ] **Account** and API key / webhook secret.
- [ ] **Webhook** “conversation ended” (or equivalent) sending: external ID (Twilio Call SID), intent, outcome, duration.
- [ ] Store in your DB linked to the same call (e.g. by `call_sid` or `external_id`).

### Make.com

- [ ] **Scenario 1 – Bookings**: Trigger = “Appointment confirmed” (or your calendar/appointment app). Action = **Webhook** to your API with: who, when, optional value/revenue, optional phone (to match to a call).
- [ ] **Scenario 2 (optional)** – Call → booking link: when a booking is created, if you have the related call SID (e.g. from Vapi or from your app), send it so your backend can set `call_id` on the booking row.
- [ ] If revenue comes from CRM instead, add a scenario or webhook that sends “booking value” or “deal won” to your API.

### Your backend (this app)

- [ ] **Database** (see below) to store: calls, conversations, bookings.
- [ ] **API routes** (e.g. `/api/webhooks/twilio`, `/api/webhooks/vapi`, `/api/webhooks/make`) that:
  - Verify webhook signatures (Twilio, Vapi, Make.com).
  - Parse body and upsert into DB.
- [ ] **Aggregation** for KPIs and analytics (daily/weekly/monthly counts, revenue sums, yields). Can be:
  - On-demand when the client opens the dashboard (query last 7d, 30d), or
  - A small **cron job** (e.g. Vercel Cron) that precomputes KPIs into a `kpi_snapshots` table for fast load.
- [ ] **Dashboard** reads from your DB (and optionally from precomputed snapshots) instead of demo data; “Last sync” = last time you ingested data (e.g. last webhook time or last cron run).

---

## 5. Database recommendation

You need to store:

- **Calls**: high volume, time-series-like (time, caller, duration, status, optional link to conversation).
- **Conversations**: one per call (or per “conversation” from Vapi), with intent, outcome, revenue.
- **Bookings**: from Make.com (appointment id, contact, value, time, optional `call_id`).
- **Aggregations**: optional precomputed KPIs per tenant per day/week.

**Recommendation: PostgreSQL**

- Relational model fits: tenants → calls, conversations, bookings; easy to query by date range and tenant.
- Good for reporting: `GROUP BY day`, `SUM(revenue)`, counts, yields.
- Works well on **Vercel** (Vercel Postgres), or as a managed DB (**Supabase**, **Neon**, **Railway**).

**Why Postgres (and not only JSON / NoSQL):**

- You’ll do a lot of “calls in last 7 days”, “bookings this month”, “revenue by week”. Postgres with indexes on `tenant_id` and `created_at` (or `date`) is simple and fast.
- Supabase adds: auth (if you want to move off file-based auth later), and **Realtime** so you can push “new call” / “new booking” to the UI without polling.

**Suggested minimal schema (Postgres):**

```sql
-- Tenant = your client (maps to current "user" / org)
-- calls: one row per Twilio call
CREATE TABLE calls (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL,
  call_sid      TEXT NOT NULL UNIQUE,   -- Twilio
  from_number   TEXT,
  to_number     TEXT,
  duration_sec  INT,
  status        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- conversations: one per call, from Vapi (intent, outcome)
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL,
  call_id       UUID REFERENCES calls(id),
  intent        TEXT,
  outcome       TEXT,
  duration_sec  INT,
  revenue_cents INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- bookings: from Make.com
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       TEXT NOT NULL,
  call_id         UUID REFERENCES calls(id),  -- optional link
  external_id     TEXT,                       -- Make.com / calendar id
  contact_phone   TEXT,
  value_cents     INT,
  booked_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dashboard queries
CREATE INDEX idx_calls_tenant_created ON calls(tenant_id, created_at DESC);
CREATE INDEX idx_conversations_tenant_created ON conversations(tenant_id, created_at DESC);
CREATE INDEX idx_bookings_tenant_created ON bookings(tenant_id, created_at DESC);
```

You can add a **tenant_id** column to your existing `users` table (or a separate `tenants` table) and scope all queries by `tenant_id` so each client only sees their own data.

---

## 6. End-to-end flow (once implemented)

1. **Call comes in** → Twilio → your Twilio webhook → insert/update `calls`.
2. **Conversation ends** (Vapi) → Vapi webhook → insert `conversations` with `call_sid` → join to `calls.id`.
3. **Booking confirmed** (Make.com) → Make.com webhook → insert `bookings` (and optionally set `call_id` if you pass it from your app or from Vapi).
4. **Dashboard** (or a cron):
   - Daily/Weekly/Monthly call counts, booking counts, revenue sums, yields → from `calls` + `conversations` + `bookings`.
   - Pipeline table → recent rows from `conversations` (or join calls + conversations).
   - Analytics 7d/30d → same tables, filter by `created_at` range.
5. **“Last sync”** = last `created_at` of ingested call/conversation/booking, or last cron run.

---

## 7. Summary table

| You need | Purpose |
|----------|---------|
| **Twilio** | Numbers, call logs, webhook on call end → **call volume**, **pipeline (time, caller)**. |
| **Vapi (Vappy)** | Per-call intent + outcome → **pipeline (intent, outcome)**, **analytics (breakdown, intents)**. |
| **Make.com** | Appointment/booking events → **confirmed bookings**, **revenue**, optional **call ↔ booking link**. |
| **PostgreSQL** (e.g. Supabase or Vercel Postgres) | Store calls, conversations, bookings; compute KPIs and serve dashboard. |
| **Webhook API routes** | Receive Twilio / Vapi / Make.com payloads, validate, write to DB. |
| **Dashboard API** | Read from DB by tenant and date range; replace demo data with live aggregates and pipeline rows. |

If you tell me which of these you want to implement first (e.g. “Twilio + DB only” or “Twilio + Make.com + DB”), I can outline the exact API route shapes and the first DB schema you should add to this repo.
