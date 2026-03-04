# Where to Get Your API Keys & Links (VoiceROI Terminal)

Each **client** uses their **own** accounts and API keys. Your dashboard stores them securely per account (admin has one set, each client has theirs). Use the links below to sign up or log in and find the values you need.

---

## 1. Twilio (phone numbers & call data)

**What you need:** Account SID, Auth Token (used for call volume, caller ID, and call logs).

| Link | What it’s for |
|------|-------------------------------|
| **Twilio Console (login)** | https://console.twilio.com |
| **Sign up** | https://www.twilio.com/try-twilio |
| **Account SID & Auth Token (where to find)** | https://console.twilio.com → **Account** → **Account info** (right side). You’ll see **Account SID** and **Auth token** (click “Show” to reveal). |

**In VoiceROI Settings you’ll enter:**
- **Twilio Account SID** – starts with `AC…` (e.g. `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
- **Twilio Auth Token** – long string; treat it like a password (never share or commit to git).

**Docs:** https://www.twilio.com/docs/usage/api

---

## 2. Vapi (voice AI – intents & outcomes)

**What you need:** API key (and optionally webhook secret) so we can receive conversation results (intent, outcome, duration).

| Link | What it’s for |
|------|-------------------------------|
| **Vapi Dashboard (login)** | https://dashboard.vapi.ai |
| **Sign up** | https://vapi.ai (or “Get started” from dashboard). |
| **API keys** | https://dashboard.vapi.ai → **Settings** (or **API Keys**) → create or copy your **Private API Key**. |

**In VoiceROI Settings you’ll enter:**
- **Vapi API Key** – your private key from the Vapi dashboard (starts with a long string). Used to fetch call/assistant data and to verify webhooks if you use one.

**Docs:** https://docs.vapi.ai

---

## 3. Make.com (appointments & bookings)

**What you need:** No “API key” from Make.com for basic use. **You** configure a Make.com scenario that sends data **to** VoiceROI when an appointment is confirmed (or created). We give you a **webhook URL**; you point Make.com at it.

| Link | What it’s for |
|------|-------------------------------|
| **Make.com (login)** | https://www.make.com |
| **Sign up** | https://www.make.com/register |
| **Scenarios** | https://www.make.com → **Scenarios** → create one. Trigger = your appointment/calendar app (e.g. “Google Calendar – Event created” or “Calendly – Appointment scheduled”). Action = **Webhooks – Custom webhook** → use the URL your VoiceROI dashboard shows (e.g. `https://your-app.vercel.app/api/webhooks/make`). |

**In VoiceROI:**
- You don’t enter “Make.com API key” in Settings. You use the **Webhook URL** we show (in Settings or in this guide) and optionally a **Webhook secret** so we can verify that requests really come from your scenario.
- If we support a **webhook secret**, you’d set the same secret in Make.com (in the webhook action) and in VoiceROI Settings so we can verify incoming requests.

**What to send from Make.com:** At minimum: contact identifier (e.g. phone or email), appointment time, and optionally “value” or “revenue” so we can show confirmed bookings and projected revenue.

---

## 4. Postgres (database) – app owner only

**Who uses this:** You (the app owner), not your clients. Clients never see or configure Postgres.

| Link | What it’s for |
|------|-------------------------------|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Vercel Postgres** | https://vercel.com/docs/storage/vercel-postgres (create a Postgres store from your Vercel project → **Storage** → **Create Database** → **Postgres**). |
| **Connect to your app** | After creating the DB, Vercel gives you `POSTGRES_URL` (and optionally `POSTGRES_PRISMA_URL`). Add them as **Environment Variables** in your Vercel project so the app can read/write calls, conversations, and bookings. |

Clients do **not** get Postgres links or credentials; the app uses one shared Postgres database and separates data by tenant/client account.

---

## 5. How “each client’s own keys” works

- **Admin:** You can log in as admin and, in **Settings**, enter **your** Twilio, Vapi, and (when we support it) Make.com webhook details. That lets you verify that live data (calls, intents, bookings) works for your account.
- **Clients:** Each client logs in with the credentials you create for them. They go to **Settings** (or onboarding) and enter **their** Twilio Account SID, Twilio Auth Token, Vapi API key, etc. We store these per user and use them when syncing or displaying data for that client. So:
  - No client sees another client’s keys.
  - You (admin) use your own keys to test; clients use theirs for their own numbers and apps.

---

## 6. Quick reference – where each value lives

| What you need | Where to get it |
|---------------|------------------|
| **Twilio Account SID** | https://console.twilio.com → Account → Account info → **Account SID** |
| **Twilio Auth Token** | https://console.twilio.com → Account → Account info → **Auth token** (Show) |
| **Vapi API Key** | https://dashboard.vapi.ai → Settings / API Keys → **Private API Key** |
| **Make.com webhook** | You don’t “get” a key; you **add** a webhook in a Make.com scenario and use the **VoiceROI webhook URL** we provide (e.g. in Settings or docs). |
| **Postgres** | You only: Vercel Dashboard → Storage → Vercel Postgres → create DB → copy env vars. |

---

## 7. Security notes

- Never share or commit **Twilio Auth Token**, **Vapi API Key**, or **Webhook secret** in code or email. Store them only in VoiceROI Settings (and in each provider’s dashboard when required).
- Rotate keys if you think they’ve been exposed (Twilio and Vapi both let you regenerate).
- Use **Webhook secret** (if we support it) so only your Make.com scenario can call our endpoint.

If you want, we can add an in-app “Where to get these” panel (e.g. in Settings) that links to this guide or repeats these links.
