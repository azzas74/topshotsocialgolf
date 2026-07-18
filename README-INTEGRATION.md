# Connecting the app to Supabase — what's done, what's left

## What's already built (this download)

```
supabase-integration/
├── src/lib/supabaseClient.js   ← Supabase client (reads env vars)
├── src/lib/auth.js             ← sign in/out, getCurrentMember(), role helpers
├── src/lib/db.js               ← every query/insert the app needs (members,
│                                  courses, schedule, rounds, handicap, teams)
├── supabase/functions/
│   └── golf-course-search/     ← server-side course lookup (API key hidden)
├── package.json                ← adds @supabase/supabase-js
└── .env.example                ← your real project URL + anon key
```

The **database itself is already live** — 8 tables, RLS policies matching
your Role Permissions sheet, the AGU handicap recalculation function, and
the course-search Edge Function are all deployed and working on the
`topshotsocialgolf` Supabase project.

## What's NOT done yet — and why

I don't have your current `App.jsx` in this conversation (only the
documentation and config files were shared here). Wiring the actual screens
— login, home, schedule, scoring, leaderboard, profile, admin panel — to
these new `db.js`/`auth.js` functions means replacing specific chunks of
that file, and I'd rather do that with surgical, reviewable edits against
your real code than regenerate the whole UI from the doc and risk losing
work you've already built.

**To finish the connection, upload your current `golf-club-app.jsx`
(or `App.jsx`) here and I'll edit it directly** — swapping the in-code demo
arrays for `db.js` calls, replacing the demo login with `auth.signIn()`,
and gating admin/committee UI with the `can` helpers in `auth.js`.

## Steps to merge what's here into GitHub now

1. Copy `src/lib/supabaseClient.js`, `src/lib/auth.js`, `src/lib/db.js` into
   your repo's `src/lib/` folder (create it if it doesn't exist).
2. Copy `supabase/functions/golf-course-search/index.ts` into your repo at
   the same path (optional — it's already live on Supabase either way, this
   just keeps it in version control).
3. Replace your repo's `package.json` with the one here (or just add the
   `@supabase/supabase-js` line to your existing one).
4. In Vercel: **Project → Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL` = `https://gfzkjlfcajfrcazxkybi.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (see `.env.example` in this download)
5. **Set the GolfCourse API key as a Supabase secret** (I can't do this
   part for you — it requires the Supabase CLI or dashboard, not the API):
   - Dashboard → your project → Edge Functions → `golf-course-search` →
     Secrets, add `GOLF_COURSE_API_KEY` = `LC632TJS46WAI6RLCTOIN7MJ2Q`
   - or via CLI: `supabase secrets set GOLF_COURSE_API_KEY=LC632TJS46WAI6RLCTOIN7MJ2Q --project-ref gfzkjlfcajfrcazxkybi`
6. Add `.env.local` to your `.gitignore` if it isn't already there (never
   commit real keys — the anon key is safe to expose since it's protected
   by RLS, but keep the habit).

## Linking real member logins (needed before anyone but you can sign in)

Right now all 25 members exist in the `members` table but have no
Supabase Auth login (`auth_user_id` is NULL for everyone). Two ways to
close that gap:

- **Invite flow (recommended):** In Supabase Dashboard → Authentication →
  Users → Invite, send each member an invite email. When they set their
  password and log in for the first time, run:
  ```sql
  update members set auth_user_id = '<their new auth.users id>'
  where email = '<their email>';
  ```
- **Bulk pre-provision:** I can create all 25 auth accounts with the
  temporary password `TopShot2025!` directly via Supabase right now if
  you'd like — just say the word. Members would then be told to log in and
  change their password. (Louis Inns has no email on file, so he'd need to
  be handled manually either way.)

## Quick reference: what each RLS rule means for the UI you're about to wire

| In the app... | Call | Who succeeds |
|---|---|---|
| Score a live round | `submitLiveRound()` | anyone, for their own round |
| Add a past round | `addHistoricalRound()` | Administrator only |
| Edit anyone's handicap | `updateMemberHandicap()` | Administrator only |
| Add/edit schedule | `addScheduleEvent()` / `updateScheduleEvent()` | Administrator only |
| Manage courses | `addCourse()` / `updateCourse()` | Committee + Administrator |
| View another member's profile | `getMembers()` returns all rows | Committee + Administrator (Players only get their own row back) |

If a call fails for a role that shouldn't have access, that's the database
doing its job — Supabase will return a permissions error rather than the
UI silently succeeding.
