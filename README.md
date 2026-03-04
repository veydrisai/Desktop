# VoiceROI Terminal

Next.js (App Router) dashboard with liquid-style UI, auth, API key management, and Supabase database for live data.

## Auth & roles

- **Login-first**: Visiting the app redirects to `/login`. No dashboard access without signing in.
- **Admin**: Default account `admin@voiceroi.local` / `admin`. Admins can create client accounts and see the Admin page.
- **Clients**: Created by an admin (email + password). On first login they are sent through onboarding to add API keys; then they can use the dashboard and Settings.

## Database & Live Data

The app now uses **Supabase PostgreSQL** to store:
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

2. **Configure Supabase:**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Copy your Project URL and Anon Key
   - Add to `.env.local`:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SESSION_SECRET=your-secret-here
     ```
   - Database schema is already migrated automatically

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

Deploys on Vercel with Supabase database. User accounts are still in-memory (for demo), but all data (calls, conversations, bookings) is persisted in the database.
# Desktop
