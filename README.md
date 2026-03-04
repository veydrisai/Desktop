# VoiceROI Terminal

Next.js (App Router) dashboard with liquid-style UI, auth, and API key management.

## Auth & roles

- **Login-first**: Visiting the app redirects to `/login`. No dashboard access without signing in.
- **Admin**: Default account `admin@voiceroi.local` / `admin`. Admins can create client accounts and see the Admin page.
- **Clients**: Created by an admin (email + password). On first login they are sent through onboarding to add API keys; then they can use the dashboard and Settings.

## API Session – what it connects to (long-term)

**In this app (demo):**  
“Connect Dashboard” is a **demo action**: it toggles a local “Connected” / “Backend unavailable” state. No real external service is called. API keys you enter in **Settings** or **Onboarding** are stored in memory (per user) and are not yet used to call Twilio or any CRM.

**In a production / “real state” setup you would:**

1. **Validate and use the stored keys** when the user clicks “Connect Dashboard”:
   - Call Twilio’s API (e.g. list projects or validate credentials) with `twilioAccountSid` + `twilioAuthToken`.
   - Optionally ping your `crmEndpoint` or webhook with the `webhookSecret` to confirm the integration is reachable.
2. **Persist keys** in a secure backend (e.g. DB or vault), not in memory, and never send them to the client except when needed for a one-time setup.
3. **Run background jobs** that use those keys to sync call data, update KPIs, and fill the Conversation Pipeline from Twilio (or your telephony provider) and your CRM.
4. **Keep “API Session”** as the concept of “this dashboard is linked to this Twilio/CRM tenant”; the cookie/session identifies the user, and the backend resolves which API keys and tenant to use for that user.

So: **API Session** = “this dashboard instance is connected to your voice/CRM backend.” Long-term, that connection is implemented by your server using the user’s stored API keys to talk to Twilio, your CRM, and webhooks; the dashboard then just shows data that the backend has synced.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000` → redirects to `/login`. Use `admin@voiceroi.local` / `admin` to sign in as admin.

## Build

```bash
npm run build
```

Deploys cleanly on Vercel. No database required; users and API keys are in-memory (reset on deploy/cold start). For production you’d replace the in-memory stores with a DB and a secrets manager.
# Desktop
