# VoiceROI Terminal – Deployment Checklist

Complete checklist for deploying the VoiceROI Terminal with Supabase database.

---

## 1. Supabase Setup

- [ ] Create a Supabase project at [supabase.com](https://supabase.com)
- [ ] Database schema is already migrated (automatic on first use)
- [ ] Copy Project URL and Anon Key from Settings → API
- [ ] Save credentials for next step

---

## 2. Environment Variables

Add these to your deployment platform (Vercel, etc.):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SESSION_SECRET=generate-a-strong-random-secret
```

For local development, copy these to `.env.local`.

---

## 3. Deploy Application

### Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Other platforms

Build the production bundle:

```bash
npm run build
npm run start
```

---

## 4. Webhook Configuration

After deployment, configure these webhooks in your external services:

### Twilio

1. Go to Console → Phone Numbers → select your number
2. Under Voice & Fax, set webhook to:
   ```
   https://your-app.vercel.app/api/webhooks/twilio
   ```
3. Set method to POST

### Vapi

1. Go to Dashboard → Settings → Webhooks
2. Add webhook URL:
   ```
   https://your-app.vercel.app/api/webhooks/vapi
   ```
3. Subscribe to: `end-of-call-report`
4. In your Vapi call config, add metadata:
   ```json
   {
     "twilioCallSid": "{{call_sid}}"
   }
   ```

### Make.com

1. Create scenario triggered by your calendar app
2. Add Webhook action with URL:
   ```
   https://your-app.vercel.app/api/webhooks/make
   ```
3. Send JSON payload:
   ```json
   {
     "tenantId": "get-from-tenant-table",
     "contactPhone": "+1234567890",
     "value": 150,
     "bookedAt": "2024-01-15T10:00:00Z"
   }
   ```

---

## 5. First Login

1. Visit your deployed app
2. Log in as admin:
   - Email: `admin@voiceroi.local`
   - Password: `admin`
3. Go to Admin page
4. Create client accounts

---

## 6. Client Onboarding

When clients log in for the first time:

1. They'll be guided through onboarding
2. They enter their API keys:
   - Twilio Account SID & Auth Token
   - Vapi API Key
   - Make.com webhook URL (optional)
3. Keys are stored securely in database
4. They can access their dashboard

---

## 7. Verify Data Flow

Test the complete flow:

1. Make a test call to your Twilio number
2. Check database: should see new row in `calls` table
3. After Vapi processes it, check `conversations` table
4. Create a test booking in your calendar
5. Check `bookings` table
6. Refresh dashboard to see live data

---

## 8. Security Checklist

- [ ] Change SESSION_SECRET to a strong random value
- [ ] Consider encrypting API keys in database (add encryption layer)
- [ ] Enable Supabase Row Level Security (already enabled)
- [ ] Use webhook signature verification for production
- [ ] Set up database backups in Supabase
- [ ] Enable HTTPS only (automatic on Vercel)
- [ ] Review CORS settings for production

---

## 9. Monitoring

Monitor these areas:

- **Supabase Dashboard**: Database usage, query performance
- **Vercel Dashboard**: Function invocations, errors
- **Webhook logs**: Check Twilio, Vapi, Make.com for delivery failures
- **Application logs**: Check for database errors or API failures

---

## 10. Troubleshooting

### No data showing in dashboard

1. Check Supabase credentials are set correctly
2. Verify webhooks are configured and firing
3. Check Supabase logs for errors
4. Test webhook endpoints with curl (see DATABASE_SETUP.md)

### Webhook failures

1. Check webhook URLs are correct (no typos)
2. Verify SSL certificates are valid
3. Check webhook payload format matches expected schema
4. Review server logs for errors

### Database connection errors

1. Verify NEXT_PUBLIC_SUPABASE_URL is correct
2. Check NEXT_PUBLIC_SUPABASE_ANON_KEY is valid
3. Ensure RLS policies allow access
4. Check Supabase project is not paused

---

## Next Steps

1. Set up monitoring and alerting
2. Configure custom domain
3. Add backup and recovery procedures
4. Plan for scaling (Supabase can handle high load)
5. Consider adding more modules (Nurture Pro, Review Booster)

For detailed documentation, see:
- `docs/DATABASE_SETUP.md` – Database schema and webhooks
- `docs/LIVE_DATA_SPEC.md` – Data sources and flow
- `docs/CLIENT_SETUP_GUIDE.md` – API key instructions for clients
