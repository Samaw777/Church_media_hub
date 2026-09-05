# Media Team Hub

A shared web app for a church media/livestream team: weekly availability and
Sunday check-in, a Wirecast → YouTube setup guide, a troubleshooting log, and
a pre-service checklist. Built with Next.js and Supabase.

## Features

- **Scheduling** — mark yourself In / Maybe / Out for the next 5 Sundays, and check in with one tap on the day.
- **Live stream setup** — step-by-step Wirecast → YouTube guide, with a spot on every step to attach your own screenshot.
- **Troubleshooting** — an FAQ of common livestream problems, plus a shared log where anyone can report and resolve issues.
- **Sunday checklist** — an editable pre-service checklist that resets automatically each week and tracks who checked off what.
- **No login** — everyone just types their name once. Simple by design for a small volunteer team (see Security note below).
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
```

Both values are on your Supabase project's **Settings → API** page.

## Database Setup

Run the migration in the Supabase SQL editor: `supabase/migrations/001_init.sql`.

It creates all tables, enables Row Level Security with public read/write
policies, and adds every table to the `supabase_realtime` publication so the
app updates live across devices.

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

There's no real authentication — anyone with the link can type any name and
act as that person, and the database's public policies allow full read/write
access with the anon key. That's an intentional simplicity tradeoff for a
small, trusted volunteer team, not an oversight. Don't reuse this schema or
these RLS policies for anything that needs real access control, and don't
put sensitive information (financials, personal data) into this app.
