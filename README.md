# Media Team Hub

A shared web app for a church media/livestream team: weekly availability and
Sunday check-in, a Wirecast → YouTube setup guide, a troubleshooting log, and
a pre-service checklist. Built with Next.js and Supabase.

## Features

- **Real accounts** — everyone signs up with their own email and password. One admin (set in the
  database) can build the schedule and edit the checklist template; everyone else can still do
  everything self-service (availability, check-in, issue log, screenshots).
- **Scheduling** — mark yourself In / Maybe / Out for the next 5 Sundays, and check in with one tap on the day.
- **Calendar** — an admin-built assignment schedule: who's on Camera, Streaming, ProPresenter, Audio,
  etc. each Sunday, shown to everyone in a calendar-style grid.
- **Live stream setup** — step-by-step Wirecast → YouTube guide, with real screenshot upload on every step.
- **Troubleshooting** — an FAQ of common livestream problems, plus a shared log where anyone can report
  and resolve issues (with an optional screenshot attached).
- **Sunday checklist** — a pre-service checklist that resets automatically each week and tracks who
  checked off what. The template itself is admin-edited; anyone can tick items off.
- **AI help assistant** — a chat bubble that answers questions using this app's own guides (stream
  setup, troubleshooting, checklist), powered by Google's free-tier Gemini API.
- **Live sync** — everyone's screen updates in real time via Supabase Realtime as teammates check in, tick items, or log issues.

Group chat isn't built in — the Home page has a spot to paste your WhatsApp or Slack invite link instead.

## Tech Stack

| Layer      | Tech                                   |
| ---------- | --------------------------------------- |
| Framework  | Next.js 16 App Router (Turbopack)       |
| Database   | Supabase (PostgreSQL + Realtime)        |
| Styling    | Tailwind CSS v4                         |
| Icons      | lucide-react                            |
| Deployment | Vercel                                  |

## Getting Started

```
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

Create a `.env.local` file (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

The Supabase values are on your project's **Settings → API** page. The Gemini key (used by the
AI help assistant, server-side only) is free from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
— no credit card required.

## Database Setup

Run both migrations, in order, in the Supabase SQL editor:

1. `supabase/migrations/001_init.sql` — core tables and realtime.
2. `supabase/migrations/002_auth_and_admin.sql` — links accounts to Supabase Auth, adds the
   admin role, the assignment calendar tables, and screenshot storage.

Whoever signs up with the email hardcoded in `002_auth_and_admin.sql`
(`handle_new_auth_user`) becomes admin automatically. Change that email — or add more by
running `update members set role = 'admin' where name = '...';` — as needed.

## Commands

```
npm run dev     # Start dev server
npm run build   # Production build
npm run start   # Run the production build locally
npm run lint    # ESLint
```

## Deploying

See `DEPLOY.md` for the full step-by-step (Supabase project → GitHub → Vercel).

## Security note

The app uses real Supabase Auth accounts (email + password) with Row Level Security enforced
per table: any signed-in member can read everything and manage their own availability,
check-ins, and issue reports, but only the admin role can edit the checklist template or build
the assignment calendar. That's still a lighter trust model than a public-facing product — every
signed-in member can see everyone else's data, and there's no per-church tenant isolation — so
don't put sensitive information (financials, personal data beyond a name) into this app.
