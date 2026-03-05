# VoiceROI Terminal

Next.js (App Router) dashboard with liquid-style UI, auth, API key management, and Neon PostgreSQL for live data.

## Auth & roles

- **Login-first**: Visiting the app redirects to `/login`. No dashboard access without signing in.
- **No public sign-up**: Users cannot self-register. All logins are created by an admin in the Admin portal.
- **Admin**: Default account `admin@voiceroi.local` / `admin`. Admins create client accounts and manage revenue settings.
- **Clients**: Created by an admin (email + password). On first login they complete onboarding (API keys); then they use the dashboard and Settings.

## Database & Live Data

The app uses **Neon PostgreSQL** to store:
- Tenant credentials (Twilio, Vapi, Make.com API keys)
- Call logs from Twilio webhooks
- Conversation data (intent, outcome) from Vapi webhooks
- Bookings from Make.com webhooks
- Revenue settings per client

**See `docs/DATABASE_SETUP.md` for complete setup instructions.**

## API Session & Data Flow

When a client saves their API keys in Settings, they're stored securely in the database. The dashboard displays live data from:

1. **Twilio** → Webhook receives call data → Stored in `calls` table
2. **Vapi** → Webhook receives conversation analysis → Stored in `conversations` table
3. **Make.com** → Webhook receives booking confirmations → Stored in `bookings` table

Dashboard KPIs and the Conversation Pipeline are computed from this data in real-time.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Neon:**
   - Create a project at [neon.tech](https://neon.tech) and copy the connection string
   - Add to `.env.local`: `DATABASE_URL=postgresql://...`
   - Run the schema once in Neon SQL Editor (see `neon/schema.sql`)

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   - Open `http://localhost:3000`
   - Log in as admin: `admin@voiceroi.local` / `admin`

## Webhook Setup

Configure webhooks in your external services to send data to the app:

- **Twilio:** `/api/webhooks/twilio`
- **Vapi:** `/api/webhooks/vapi`
- **Make.com:** `/api/webhooks/make`

See `docs/DATABASE_SETUP.md` for detailed webhook configuration.

## Build

```bash
npm run build
```

Deploys on Vercel with Neon database. Set **Environment Variables** in Vercel (e.g. `DATABASE_URL`) so the app can connect to Neon in production. User accounts are still in-memory (for demo); all data (calls, conversations, bookings) is persisted in Neon.
# Desktop
