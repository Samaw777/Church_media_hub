# Deploying Media Team Hub

Two free accounts get this live: **Supabase** (database) and **Vercel** (hosting).
You'll also need a **GitHub** account to hold the code.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up / log in.
2. Click **New Project**. Pick a name and a database password (save it somewhere), choose the region closest to your team, and create it — takes about 2 minutes to provision.
3. Once it's ready, open the **SQL Editor** (left sidebar), paste in the entire contents of `supabase/migrations/001_init.sql` from this project, and click **Run**. This creates all the tables and turns on live sync.
4. Go to **Settings → API**. Copy the **Project URL** and the **anon public** key — you'll need both in step 3 below.

## 2. Push the code to GitHub

1. Create a new (empty) repository on [github.com](https://github.com/new) — don't initialize it with a README.
2. From this project's folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

## 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in with your GitHub account.
2. Click **Add New → Project**, then select the repo you just pushed.
3. Before deploying, expand **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` — the Project URL from step 1.4
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon key from step 1.4
4. Click **Deploy**. After a minute or two you'll get a live URL like `media-team-hub.vercel.app`.

## 4. Share it with the team

Send everyone the Vercel URL. First visit, they type their name — no
account needed. That's it.

## After launch

- **Custom domain**: Vercel → your project → Settings → Domains, if the church has one to point at it.
- **Updating the app**: push new commits to `main` on GitHub; Vercel redeploys automatically.
- **Changing the checklist template**: use the "Edit list" button on the Checklist page itself — no redeploy needed, it's stored in the database.
