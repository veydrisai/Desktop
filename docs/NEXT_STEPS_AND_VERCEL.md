# Next Steps: Database + Vercel Deployment

## Is the database ready?

The **schema and code** are ready. The app does **not** create tables automatically. You must run the schema **once** in your Neon project. After that, the database is good to go.

---

## Step 1: Create tables in Neon (do this once)

You have two options.

### Option A: Neon SQL Editor (recommended)

1. Open [Neon Console](https://console.neon.tech) and select your project.
2. Go to **SQL Editor**.
3. Open the file `neon/schema.sql` in this repo and copy its **entire** contents.
4. Paste into the SQL Editor and click **Run**.
5. You should see success for each statement. If you see “already exists,” that’s fine (tables were created before).

### Option B: Run from your machine

From the project root, with `DATABASE_URL` set (e.g. from `.env.local`):

```bash
# Load .env.local and run schema (macOS/Linux)
export $(grep -v '^#' .env.local | xargs) && npm run db:setup
```

Or set the URL explicitly:

```bash
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-super-queen-ajozitmx-pooler..../neondb?sslmode=require" npm run db:setup
```

After this, all required tables exist in Neon. No one can “connect and create” them for you from outside; only you (or someone with your Neon credentials) can run this step.

---

## Step 2: Vercel deployment

Pushing code does **not** send `.env.local` to Vercel. You must set environment variables in Vercel.

1. In [Vercel](https://vercel.com), open your project.
2. Go to **Settings → Environment Variables**.
3. Add:
   - **Name:** `DATABASE_URL`  
     **Value:** Your Neon **pooled** connection string  
     (e.g. `postgresql://neondb_owner:******@ep-super-queen-ajozitmx-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require`)
   - **Name:** `SESSION_SECRET`  
     **Value:** A long random string (optional but recommended in production)
4. Save and **redeploy** (Deployments → ⋮ on latest → Redeploy, or push a new commit).

### If deployment still fails

- **Build errors:** Check the build log in Vercel. Fix any TypeScript or dependency errors.
- **Runtime errors (e.g. “Database error”, 500):**
  - Confirm `DATABASE_URL` is set in Vercel (Settings → Environment Variables) and has no extra spaces.
  - Use the **pooled** URL (host contains `-pooler`).
  - Confirm you ran the schema in Neon (Step 1).
- **Redirect/404:** Ensure the project is a Next.js app and the build command is `npm run build` (or `next build`).

---

## Summary

| Task | Status |
|------|--------|
| Schema file (`neon/schema.sql`) | ✅ In repo |
| App code using Neon | ✅ Done |
| **You run schema once in Neon** | ⬜ Do Step 1 above |
| **You set `DATABASE_URL` (and optionally `SESSION_SECRET`) in Vercel** | ⬜ Do Step 2 above |
| Redeploy after env vars | ⬜ Then database is connected on Vercel |

The database is “good” once (1) the schema has been run in your Neon project and (2) Vercel has `DATABASE_URL` set and you’ve redeployed.
