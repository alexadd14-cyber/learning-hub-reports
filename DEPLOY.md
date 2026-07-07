# Deploying the demo (standalone report generator)

This deploys the **report generator** as its own public website with no login and
no database. Auth and subscriptions are bypassed via `DEMO_MODE` (all that code
stays in the repo for later — it just isn't executed).

## What "demo mode" does

- `DEMO_MODE=true` (the default) skips all sign-in and subscription checks.
- The report generator, photo marking, and PDF download work for anyone with the URL.
- Only the `/admin` area stays blocked.
- No data is written; the database is never queried.

To turn the full system back on later, set `DEMO_MODE=false` and provide a real
`DATABASE_URL` (see "Restoring auth" below).

## Deploy to Vercel

1. Push the repo to GitHub (already connected):
   ```bash
   git add -A
   git commit -m "Demo mode: standalone report generator"
   git push
   ```
2. Go to https://vercel.com/new and import the `learning-hub-reports` repo.
3. Framework preset: **Next.js** (auto-detected). No build settings to change.
4. Add these **Environment Variables** (Production + Preview):

   | Name | Value | Notes |
   |------|-------|-------|
   | `OPENAI_API_KEY` | your key | Required |
   | `OPENAI_TEXT_MODEL` | `gpt-4o-mini` | Optional (default) |
   | `OPENAI_VISION_MODEL` | `gpt-4o` | Optional (default) |
   | `DEMO_MODE` | `true` | Keeps auth/DB bypassed |
   | `DATABASE_URL` | `file:./dev.db` | Dummy value; never queried in demo mode |

5. Click **Deploy**. You'll get an HTTPS URL like `https://learning-hub-reports.vercel.app`.

That URL works on any device. The camera capture needs HTTPS, which Vercel provides.

## Notes

- `prisma generate` runs automatically on install (via the `postinstall` script),
  so the Prisma client is available even though it's never queried in demo mode.
- The AI routes have `maxDuration = 60` for vision/report latency (~7-8s typical).
- `DATABASE_URL` must be present (even as a dummy) so the Prisma client can
  construct at import time; in demo mode no connection is ever opened.

## Restoring auth + subscriptions later

1. Set `DEMO_MODE=false`.
2. Switch `prisma/schema.prisma` datasource to `postgresql` and set `DATABASE_URL`
   to a hosted Postgres (Neon/Supabase) — SQLite does not work on Vercel.
3. Set `NEXTAUTH_URL` (to the deployed domain) and `NEXTAUTH_SECRET`.
4. Run migrations + seed against the new database.
