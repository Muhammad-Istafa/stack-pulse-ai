# StackPulse — Private Intelligence

A dark, editorial AI co-founder dashboard. StackPulse triages a founder's inbox,
extracts commitments, drafts replies, surfaces tech-stack decisions, and keeps
a calendar of what actually matters — without ever auto-executing.

## Problem

Founders drown in low-signal inbox + tooling noise. Existing "AI assistants"
either over-automate (risking damage) or under-deliver (generic summaries).
StackPulse is opinionated counsel: it drafts, scores, and proposes — the founder
always approves.

## Features

- **Daily Brief** — overdue commitments, risk meter, time-saved overview
- **Ops Agent** — extracts commitments from emails, drafts replies, tracks workflows
- **Tech Agent** — scores tech-feed items by relevance, risk, and migration cost
- **Calendar** — auto-suggests events from extracted commitments
- **Activity Log** — full audit trail of every AI suggestion + founder action
- **Integrations** — Google + 10 platform stubs (Stripe, Notion, Linear, etc.)
- **Simulation mode** — fully usable on seed data before connecting Google

## Tech Stack

- **Frontend**: React 18 · Vite 5 · TypeScript · Tailwind · shadcn/ui · React Router
- **3D**: Three.js + react-three-fiber (Obsidian hero logo)
- **State/data**: TanStack Query, React Context
- **Backend**: Lovable Cloud (Supabase) — Postgres + Edge Functions
- **AI**: Lovable AI Gateway (Gemini / GPT-5 family) via `ops-agent` + `tech-agent` edge functions
- **Auth model**: device-id scoped (no login required for the demo)

## Project Structure

```
src/
  components/      Feature components + shadcn/ui primitives
  pages/           Route-level screens (Index, Brief, Ops, Tech, Calendar, Activity)
  lib/             Services & utilities (mode, activity, commitments, seed, deviceId, utils)
  hooks/           Reusable React hooks
  integrations/    Auto-generated Supabase client + types (do not edit)
  index.css        Design tokens (Obsidian palette)
supabase/
  functions/       ops-agent, tech-agent edge functions
  config.toml      Function config
```

## Setup

```bash
bun install
bun run dev
```

The app reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env`
(auto-managed by Lovable Cloud). Copy `.env.example` to `.env` for self-hosting.

## Deployment

- **Lovable**: click **Publish** in the editor.
- **Vercel**: import the repo, framework preset *Vite*, build `bun run build`,
  output `dist`. Add the three `VITE_SUPABASE_*` env vars from `.env.example`.
  SPA routing works out of the box (no rewrites needed for Vercel + Vite).

## Architecture Summary

- **Frontend** — Vite SPA, React Router routes wrapped in `AppLayout` with the
  Obsidian sidebar. Design tokens live in `index.css`; never hard-code colors.
- **Services** (`src/lib/`) — pure TS modules: `mode` (connection + integrations
  context), `commitments` (calls AI edge function + writes DB), `activity`
  (audit log), `seed` (first-run mock data), `deviceId` (stable browser id).
- **AI flow** — UI calls `supabase.functions.invoke("ops-agent" | "tech-agent")`.
  Edge functions call the **Lovable AI Gateway** (no API key needed) and return
  structured JSON, which is persisted to Postgres.
- **Database** — Postgres tables: `emails`, `commitments`, `calendar_events`,
  `activity_log`, `ops_tasks`, `tech_feed`, `tech_analyses`, `tech_tasks`,
  `workflows`. RLS enabled and scoped by `device_id` in this demo.
- **Auth** — device-id pattern (no login). For production, swap to Supabase
  Auth + a `user_roles` table.
- **Deployment** — Lovable Cloud auto-deploys edge functions and DB migrations.
  Frontend ships through Lovable hosting or Vercel.

## Future Improvements

- Replace device-id with real Supabase Auth + Google OAuth
- Live Gmail / Calendar integration (currently simulation seed data)
- Per-user RLS policies (currently public for demo simplicity)
- Background scheduled briefs via cron edge function
- E2E tests with Playwright
