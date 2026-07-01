# Money Jars

A simple, private, card-free budgeting app for kids — three jars (Spend / Save / Give),
recurring allowance, chore approvals, savings goals, and giving to a cause.
Shared-device model: the parent signs in, kids use the app on the same device.

## Deploy

1. **Database:** the Supabase schema is already set up (families, parents, kids, jars,
   allowances, goals, causes, chores, transactions — all with per-family RLS).
2. **Environment variables** (in Vercel → Settings → Environment Variables):
   - `VITE_SUPABASE_URL` — your Money Jars Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — the anon / publishable key
   (Supabase → Project Settings → API)
3. Push to GitHub → Vercel builds automatically.

## Local dev

```bash
npm install
cp .env.example .env   # then fill in your real Supabase values
npm run dev
```

## Structure

- `src/App.jsx` — the whole UI (auth, kid view, parent view)
- `src/db.js` — data access layer (auth + all actions against Supabase)
- `src/supabaseClient.js` — Supabase client (reads env vars)

## Notes

- Kids have **no login** — they're rows the parent owns. The optional PIN is an
  in-app convenience gate, not a security boundary. Data is protected by the
  parent's login + Row Level Security.
- Money is **symbolic** (educational). No real card, no bank transfers — parents
  handle actual cash themselves. This keeps the app COPPA-friendly and avoids
  money-transmitter regulation.
