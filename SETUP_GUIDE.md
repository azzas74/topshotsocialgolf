# Top Shot Social Golf Club — GitHub Setup & Go-Live Guide

**Updated:** August 2026
**Supabase project:** `gfzkjlfcajfrcazxkybi` (Sydney, ap-southeast-2)
**Live URL:** https://topshotsocialgolf.vercel.app

---

## READ THIS FIRST — what's in this bundle and what isn't

This bundle contains **every file except `src/App.jsx` and `src/main.jsx`**.

Those two are your existing application code. They were not available to
regenerate, and inventing replacements would have thrown away your working UI.
You need to source them from your existing repo or local machine. Section 5
tells you exactly what changes `App.jsx` needs.

---

## 1. Where every file goes

Your repository root should end up looking exactly like this:

```
topshotsocialgolf/
├── .env.example                 ← reference copy, safe to commit
├── .gitignore                   ← keeps .env and node_modules out
├── index.html                   ← unchanged
├── package.json                 ← UPDATED: adds @supabase/supabase-js
├── vite.config.js               ← note the DOT, not underscore
├── vercel.json                  ← unchanged
├── public/
│   ├── favicon.svg
│   ├── manifest.json
│   ├── icon-192.png             ← you must supply (see section 6)
│   └── icon-512.png             ← you must supply (see section 6)
├── src/
│   ├── App.jsx                  ← YOUR FILE — not in this bundle
│   ├── main.jsx                 ← YOUR FILE — not in this bundle
│   └── lib/
│       └── supabase.js          ← NEW: the Supabase client
└── supabase/
    └── functions/
        └── golf-course-search/
            └── index.ts         ← record of the deployed function
```

**Do not commit:** `.env`, `node_modules/`, `dist/`. The `.gitignore` handles
this automatically once committed.

---

## 2. Three problems in your current repo

### 2a. The Supabase library was never installed — this is the main one

Your committed `package.json` lists only `react` and `react-dom`. There is no
`@supabase/supabase-js`. Any `App.jsx` that imports the Supabase client would
fail the Vercel build immediately.

This is almost certainly why the app still shows test data: the Supabase-wired
version of `App.jsx` was never successfully committed and deployed.

The `package.json` in this bundle fixes it.

### 2b. `vite_config.js` vs `vite.config.js`

The copy in the Claude project is named with an **underscore**. Vite only reads
`vite.config.js` with a **dot**. If the underscore version is what's in GitHub,
Vite has been silently ignoring it and using defaults this whole time.

Check the filename in your repo. If it has an underscore, delete it and add the
`vite.config.js` from this bundle.

### 2c. `manifest.json` location

Your `manifest.json` and `favicon.svg` need to be in `public/`, because
`index.html` references them at absolute paths (`/manifest.json`, `/favicon.svg`).
Vite serves anything in `public/` from the site root. They're placed correctly
in this bundle.

---

## 3. Uploading to GitHub

Web interface (no command line required):

1. Go to your `topshotsocialgolf` repository
2. **Add file → Upload files**
3. Drag in the files. To create folders, drag the whole `src`, `public` and
   `supabase` folders — GitHub preserves the structure
4. Commit message: `Wire app to live Supabase backend`
5. **Commit changes**

**Dotfiles need a different approach.** GitHub's drag-and-drop often skips files
starting with a dot. For `.gitignore` and `.env.example`:

1. **Add file → Create new file**
2. Type the filename exactly, including the leading dot
3. Paste the contents
4. Commit

**When replacing an existing file,** upload the new version with the same path
and GitHub will overwrite it. It won't duplicate.

---

## 4. Vercel environment variables

The `.env` file is gitignored, so Vercel never sees it. You must set the same
values in Vercel directly, or the deployed build will throw the "Missing
Supabase environment variables" error from `supabase.js`.

1. Vercel → your project → **Settings** → **Environment Variables**
2. Add these two, ticked for **Production**, **Preview** and **Development**:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://gfzkjlfcajfrcazxkybi.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_UhuDN4NJQbYmY57UNPrnvw_NnUEzmZG` |

3. **Redeploy.** Vercel does not apply new environment variables to existing
   builds — go to **Deployments**, open the latest, and choose **Redeploy**.

Both values are safe to expose publicly. Row Level Security is what actually
protects your data, and all 32 policies are already live. Your `service_role`
key is a different thing entirely and must never go in Vercel's frontend
variables or in the repo.

---

## 5. What `App.jsx` must contain

Since you're supplying `App.jsx` yourself, here's the checklist for making it
read live data instead of test data.

**Remove:** every hardcoded demo array — the `demoMembers`, `demoCourses`,
`demoRounds`, `demoSchedule` constants and any `demo1234` password logic.

**Add at the top:**

```javascript
import { supabase } from './lib/supabase'
```

**Authentication** — replace the simulated login with:

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

And restore the session on mount so members aren't logged out on refresh:

```javascript
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
  })
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => setSession(session)
  )
  return () => subscription.unsubscribe()
}, [])
```

**Data loading** — one fetch per table, for example:

```javascript
const { data: members } = await supabase.from('members').select('*')
const { data: courses } = await supabase
  .from('courses')
  .select('*, holes(*)')     // pulls each course's 18 holes in one query
```

**Field name mapping.** The database uses snake_case; your UI components expect
camelCase. Every row needs translating on the way in and out:

| Database column | UI property |
|---|---|
| `course_rating` | `courseRating` |
| `slope_rating` | `slopeRating` |
| `stroke_index` | `strokeIndex` |
| `hole_number` | `holeNumber` |
| `gross_score` | `grossScore` |
| `stableford_points` | `stablefordPoints` |
| `daily_handicap` | `dailyHandicap` |
| `score_differential` | `scoreDifferential` |
| `is_historical` | `isHistorical` |
| `agu_handicap` | `aguHandicap` |
| `event_date` | `eventDate` |
| `tee_time` | `teeTime` |
| `schedule_event_id` | `scheduleEventId` |

**Roles — important.** The database uses three roles: `player`, `committee`,
`administrator`. Any leftover check for `role === 'admin'` will fail silently
and lock you out of admin features. Search for `'admin'` and fix every hit.

**IDs are UUIDs**, not integers. Anything doing `id + 1` or `Math.max(...ids)`
to generate a new ID must go — let Postgres generate them via `gen_random_uuid()`.

**Handicaps recalculate server-side.** The `recalculate_handicap()` function
fires automatically when a round is saved. Don't compute handicaps in the
frontend and write them back; you'll fight the database trigger. Save the round,
then re-read the member row to get the updated handicap.

---

## 6. Loose ends

**App icons.** `manifest.json` references `/icon-192.png` and `/icon-512.png`.
If those don't exist, the PWA install prompt won't appear on phones. Create two
square PNGs at those sizes and put them in `public/`.

**Louis Inns has no account.** 24 of your 25 members have Auth accounts. Louis
has no email address on file, so he can't sign in. Either get an email from him,
or create a placeholder address.

**Temporary password.** All accounts share `TopShot2025!`. Change this before
real use — anyone with the list can sign in as anyone else, and with committee
or admin accounts in that list, that's a real exposure.

**Course hole data is placeholder.** The five courses have correct par, rating
and slope, but generated hole layouts. Handicaps and differentials will be
correct; individual hole stroke indexes will not match the real scorecards.
Replace via the course search once it's confirmed working.

**Free tier auto-pause.** The project pauses after roughly a week of inactivity
and everything goes down until restored. It was paused when we started this
session. If members report the app being dead, check this first.

---

## 7. Verifying it worked

After deploying, open the live site and check in this order:

1. **Login page loads** — no blank white screen. A blank screen with a console
   error about environment variables means section 4 wasn't done, or you didn't
   redeploy after adding them.
2. **Sign in** with your own email and `TopShot2025!`. Success means Auth is
   connected.
3. **Members list shows 25 people** with real names, not Mel/Greg/Wolfy/David.
   Those four are demo data — if you see them, `App.jsx` is still the old version.
4. **Courses tab shows 5 Queensland courses.**
5. **Open a course** and confirm 18 holes with pars summing to the course par.
6. **Course search** — search "Royal Pines". Results confirm the Edge Function
   and API key are working end to end.

If step 3 shows demo names, the frontend is still test data regardless of how
healthy the backend is.
