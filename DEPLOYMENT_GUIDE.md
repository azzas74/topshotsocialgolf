# Top Shot Social Golf Club — Deployment Guide
## Publishing to topshotsocialgolf.vercel.app

---

## WHAT YOU NEED BEFORE STARTING
- ✅ GitHub account (github.com)
- ✅ Vercel account (vercel.com) — sign in with GitHub
- ✅ This folder: topshotsocialgolf/

---

## STEP 1 — Create a GitHub Repository (5 minutes)

1. Go to **github.com** and sign in
2. Click the **+** button (top right) → **New repository**
3. Fill in:
   - Repository name: `topshotsocialgolf`
   - Description: `Top Shot Social Golf Club Score Card`
   - Set to **Public** (required for free Vercel)
   - ❌ Do NOT tick "Add a README file"
4. Click **Create repository**
5. GitHub will show you an empty repo page — leave it open

---

## STEP 2 — Upload the App Files (5 minutes)

On the empty repository page you'll see a link that says **"uploading an existing file"** — click it.

1. Click **"uploading an existing file"**
2. Drag the entire contents of the `topshotsocialgolf` folder into the upload area:
   - `src/` folder
   - `public/` folder
   - `index.html`
   - `package.json`
   - `vite.config.js`
   - `vercel.json`
   - `.gitignore`

   ⚠️ Upload the FILES AND FOLDERS inside `topshotsocialgolf/`, not the folder itself.

3. Scroll down, add a commit message: `Initial deployment`
4. Click **Commit changes**

Your code is now on GitHub ✅

---

## STEP 3 — Deploy to Vercel (3 minutes)

1. Go to **vercel.com** and sign in
2. Click **Add New…** → **Project**
3. You'll see your GitHub repos listed — click **Import** next to `topshotsocialgolf`
4. Vercel auto-detects the Vite/React setup. Leave all settings as default.
5. Click **Deploy**
6. Wait ~60 seconds — Vercel builds and deploys automatically

---

## STEP 4 — Set Your Custom URL (2 minutes)

After deployment, Vercel gives you a random URL like `topshotsocialgolf-abc123.vercel.app`.

To get `topshotsocialgolf.vercel.app`:
1. In Vercel, click your project → **Settings** → **Domains**
2. Click **Edit** on the auto-generated domain
3. Change it to `topshotsocialgolf.vercel.app`
4. Click **Save**

Your app is now live at: **https://topshotsocialgolf.vercel.app** ✅

---

## STEP 5 — Test on Your Phone

1. Open **https://topshotsocialgolf.vercel.app** on your phone
2. On iPhone: tap the Share button → **Add to Home Screen**
3. On Android: tap the menu → **Add to Home Screen**

The app installs like a native app with the golf icon ⛳

---

## DEMO LOGIN ACCOUNTS FOR UAT TESTING

| Name | Email | Role |
|------|-------|------|
| Aaron Hargreaves | admin@club.com | 👑 Admin |
| Mel Wallis | mel@club.com | Member |
| Greg Chen | greg@club.com | Member |
| Wolfy Donoghue | wolfy@club.com | Member |
| David Park | david@club.com | Member |

Password for all accounts: **demo1234**

---

## UPDATING THE APP AFTER PUBLISHING

Whenever you want to push an update:
1. Go to your GitHub repo
2. Navigate to the file you want to update (e.g. `src/App.jsx`)
3. Click the pencil ✏️ icon to edit
4. Paste the new code
5. Click **Commit changes**

Vercel automatically detects the GitHub change and re-deploys within 60 seconds.
No manual steps needed — it's fully automatic.

---

## WHAT HAPPENS NEXT (When Ready to Go Live)

When UAT testing is complete and you're ready for real members:

1. **Connect Supabase** — adds a real database for member accounts and scores
2. **Replace demo data** — load real members via the CSV bulk importer
3. **Real login system** — members get proper email/password accounts
4. **All demo data is wiped** — replaced with real club data

None of this affects the published URL. The app stays at topshotsocialgolf.vercel.app throughout.

---

## NEED HELP?

If anything goes wrong during deployment, take a screenshot and share it in the Claude project.
All the code and history is saved there — we can fix any issue quickly.
