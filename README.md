# Stack Pulse AI (FounderOS)

FounderOS is a simulation-first AI co-founder cockpit built with React + TypeScript and Supabase.  
It helps founders:

- triage inbox and draft high-quality replies (`Ops Agent`)
- evaluate tooling and migration decisions (`Tech Agent`)
- prioritize commitments and calendar load (`Brief`, `Calendar`, `Activity`)

The app is intentionally human-in-the-loop: agents can suggest, draft, and score, but they do not auto-execute final actions.

## What This App Does

### 1) Daily Brief

The `Daily Brief` page combines:

- pending founder replies from inbox
- top tech opportunities from intelligence feed
- calendar suggestions
- commitments and recent activity
- risk and time-saved simulation cards

### 2) Ops Agent (Inbox -> Workflow -> Draft)

The `Ops Agent` flow:

1. load/seed inbox data by `device_id`
2. classify and summarize email
3. extract actionable intent + urgency + data sources
4. generate workflow steps
5. run workflow (mock data tool runs + AI drafting)
6. let founder edit and approve draft
7. log outcome + optionally suggest follow-up calendar event

All actions are persisted in Supabase tables and reflected in Activity.

### 3) Tech Agent (Feed -> Analysis -> Decision)

The `Tech Agent` flow:

1. generate/refresh intelligence feed
2. run modular analyses:
   - sandbox test
   - code impact
   - migration plan
   - A/B test simulation
   - decision panel (confidence, risk, rationale, cited sources)
3. founder decides: `switch`, `hold`, or `reject`
4. decision is logged and status is propagated to feed/activity

### 4) Calendar + Auto-Balance

The Calendar includes priority-aware events (`urgent`, `moderate`, `flexible`) and an AI auto-balance routine that moves flexible events away from urgent conflicts and logs changes to Activity.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, React Router
- **UI:** Tailwind CSS, shadcn/ui, Radix primitives, lucide icons
- **State/Data:** React Query + Supabase JS client
- **Backend:** Supabase Postgres + RLS (public policy mode), Edge Functions
- **Testing:** Vitest + Testing Library
- **3D/Visuals:** React Three Fiber + Drei (logo/visual accents)

## Project Structure

```text
src/
  pages/                 # Index, Brief, Ops, Tech, Calendar, Activity
  components/            # Layout, cards, dialogs, workflow UI
  integrations/supabase/ # typed client + generated DB types
  lib/                   # seed, mode, activity, commitments, utils
supabase/
  migrations/            # schema evolution
  functions/
    ops-agent/           # inbox/ops workflow AI actions
    tech-agent/          # tech intelligence AI actions
```

## Environment Variables

Create `.env` in the project root:

```env
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-supabase-anon-key>"
VITE_SUPABASE_PROJECT_ID="<your-project-ref>"
```

For Supabase Edge Functions, set:

- `LOVABLE_API_KEY` (required by both `ops-agent` and `tech-agent`)

Example:

```bash
supabase secrets set LOVABLE_API_KEY=your_key_here
```

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Run the app

```bash
npm run dev
```

Vite is configured to run on `http://localhost:8080`.

### 3) Run tests

```bash
npm test
```

### 4) Lint

```bash
npm run lint
```

### 5) Build

```bash
npm run build
```

## Supabase Setup

### Option A: Use existing hosted Supabase project

1. set the `VITE_SUPABASE_*` values in `.env`
2. ensure the database has the migration schema applied
3. deploy edge functions and set `LOVABLE_API_KEY`

### Option B: Local Supabase

```bash
supabase start
supabase db reset
supabase functions serve ops-agent --no-verify-jwt
supabase functions serve tech-agent --no-verify-jwt
```

`supabase/config.toml` has `verify_jwt = false` for both functions in simulation mode.

## Data Model (Core Tables)

- `emails` - inbox items + extracted intent metadata
- `workflows` - generated ops pipelines and outputs
- `commitments` - extracted obligations + deadlines
- `calendar_events` - event timeline + rescheduling metadata
- `tech_feed` - incoming tool/model/pricing opportunities
- `tech_analyses` - sandbox/impact/migration/A-B/decision artifacts
- `activity_log` - immutable action history across agents

## Simulation Mode Notes

- The app is device-scoped using a local `device_id`.
- `seedIfEmpty()` inserts realistic sample inbox data.
- Many agent actions intentionally use deterministic/mock-style outputs so UX can be demonstrated without live integrations.
- UI emphasizes founder approval before "sending" or adopting decisions.

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run build:dev` - dev-mode build
- `npm run preview` - preview production build
- `npm run lint` - lint codebase
- `npm test` - run Vitest once
- `npm run test:watch` - watch mode tests

## Current Test Coverage

There is currently a minimal placeholder test (`src/test/example.test.ts`).  
Recommended next step is adding integration tests for:

- Ops workflow generation and approval states
- Tech decision pipeline transitions
- Calendar auto-balance behavior
- commitment extraction and status updates

## Deployment

Frontend can be deployed on any Vite-compatible host (Vercel, Netlify, etc.).  
Supabase Edge Functions must be deployed separately:

```bash
supabase functions deploy ops-agent
supabase functions deploy tech-agent
```

Make sure `LOVABLE_API_KEY` is configured in the target Supabase project.
