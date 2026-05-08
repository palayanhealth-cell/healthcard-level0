# HealthCard Workspace

This repository contains the Palayan health card project workspace. The main runnable app lives in `healthcard-app/`, with supporting Supabase assets, design references, and AI skills stored at the repository root.

## Workspace Layout

- `healthcard-app/` — main Ionic React + Vite application
- `supabase/` — Supabase project config, Edge Functions, and SQL migrations used by the app
- `_archive_admin_portal/` — HTML design references for admin screens (archive)
- `_archive_encoder_portal/` — HTML design references for encoder screens (archive)
- `scripts/` — build and deploy scripts
- `skills/` — local AI skills used in this workspace
- `.github/skills/` — additional workspace skill content

## Main App

The production app is in `healthcard-app/`.

Key stack:

- Ionic React
- Vite
- TypeScript
- Supabase Auth + Postgres
- React Hook Form

Important app areas:

- `src/pages/LoginPage.tsx` — login flow
- `src/pages/EncoderFormPage.tsx` — multi-step encoder registration form
- `src/pages/EncoderClientsPage.tsx` — draft list, search, and resume flow
- `src/pages/Admin*` — admin portal pages
- `src/services/authService.ts` — auth and username/email login resolution
- `src/services/draftService.ts` — local draft persistence for encoder registrations
- `src/services/healthCardService.ts` — health card persistence

## Setup

### App

From `healthcard-app/`:

```bash
npm install
```

Create environment variables using `healthcard-app/.env.example` as reference.

Typical local commands:

```bash
npm run dev
npm run build
npm run lint
npm run test.unit
npm run test.e2e
```

### Supabase

Relevant files:

- `healthcard-app/supabase/sql/schema.sql`
- `supabase/config.toml`
- `supabase/migrations/20260501_staff_role_management.sql`
- `supabase/migrations/20260502_login_identifier_functions.sql`

The app expects profile-based auth and username-aware login resolution.

## Current Behavior Notes

- Login supports username or email through database-backed resolution logic.
- Encoder drafts are stored locally in browser storage, not in Supabase.
- The Continue Draft page refreshes using Ionic page lifecycle hooks, not only React mount hooks.
- Starting a new encoder registration should reset the form when no `draft` query parameter is present.

## Git

This workspace is now initialized as a git repository and tracks `origin/main`.

## Additional Context

- App-specific details are also documented in `healthcard-app/README.md`.
- AI handoff instructions for future coding agents are in `AGENTS.md` at the repository root.