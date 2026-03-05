# Live Data Integration

How to switch from demo data to **real** data from Twilio, Vapi, and (optionally) Make.com.

---

## What you need

1. **API keys in the app** (Settings page)  
   So we know which tenant the data belongs to and can receive webhooks.

2. **Webhooks pointed at your Vercel app**  
   So new calls and bookings are sent to your app and stored in Neon.

3. **Optional: “Sync from Vapi”**  
   To backfill **past** Vapi calls into the dashboard (one-time or when you want).

---

## Step 1: Add your API keys in the app

1. Log in to your **Vercel** app (as the client account that should see the data).
2. Go to **Settings** (or **Onboarding** if first time).
3. Enter and save:
   - **Twilio Account SID** and **Twilio Auth Token**  
     (So when Twilio sends a webhook we can match `AccountSid` to your tenant and create `calls`.)
   - **Vapi API Key**  
     (Used for “Sync from Vapi” and for Vapi to send end-of-call webhooks if you configure them.)
   - **Webhook URL** (optional): e.g. `https://your-app.vercel.app/api/webhooks/make` for Make.com.

Saving stores these in Neon (`tenant_credentials`) and links them to your user.

---

## Step 2: Configure webhooks (for new live data)

### Twilio (creates rows in `calls`)

1. Twilio Console → **Phone Numbers** → your number.
2. **Voice & Fax** → **A Call Comes In**: set to **Webhook**, URL:
   - `https://YOUR_VERCEL_APP.vercel.app/api/webhooks/twilio`
3. Method: **POST**.

New calls will create a row in `calls` and be tied to your tenant via your Twilio Account SID.

### Vapi (creates rows in `conversations`)

1. Vapi Dashboard → **Webhooks** (or your assistant’s webhook).
2. Add webhook URL:
   - `https://YOUR_VERCEL_APP.vercel.app/api/webhooks/vapi`
3. Subscribe to **end-of-call-report** (or the event that sends call summary + analysis).
4. In your Vapi phone/integration config, pass the Twilio Call SID in metadata so we can link to the same call:
   - e.g. `metadata.twilioCallSid = <twilio_call_sid>`.

Then when a call ends, Vapi sends the report to your app; we find the `calls` row by `call_sid` and insert into `conversations` (intent, outcome, duration, etc.).

### Make.com (optional, for `bookings`)

If you use Make.com for bookings, set the webhook URL to:
`https://YOUR_VERCEL_APP.vercel.app/api/webhooks/make`  
and send the payload described in `docs/DATABASE_SETUP.md`.

---

## Step 3: Sync past Vapi calls (optional)

Past calls that already happened in Vapi were not sent to your app, so they’re not in the DB yet.

- Use **“Sync from Vapi”** in the dashboard (or call the sync API) to pull recent calls from Vapi into your database.  
- This uses your **Vapi API Key** (from Settings) and the **Vapi API** (e.g. `GET https://api.vapi.ai/call`) to fetch calls and insert them into `conversations` (and optionally link to `calls` when we have a Twilio Call SID).

After syncing, refresh the dashboard to see the imported data.

---

## Summary

| You have / do | Result |
|---------------|--------|
| Only add **Vapi API key** in Settings | You can use **Sync from Vapi** to import past calls. Dashboard shows that data after sync + refresh. |
| Add **Twilio + Vapi** in Settings and set **Twilio + Vapi webhooks** | **New** calls flow in automatically: Twilio → `calls`, Vapi → `conversations`. No need to paste the key “into” me; the app uses the key stored in Settings. |
| Add **Make.com** webhook URL and configure Make | **Bookings** from Make.com appear in the dashboard. |

You don’t need to “input the Vapi API key to me” (the AI) — you input it **in the app (Settings)**. Once it’s saved there, the app (and the Sync from Vapi feature) use it to get live and past data.
