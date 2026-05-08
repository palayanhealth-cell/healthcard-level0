# AGENTS

This file is a handoff guide for the next AI or coding agent working in this repository.

## Primary Goal

Work inside the existing HealthCard workspace without breaking the current Ionic + Supabase flow.

## Where To Work First

- Main app: `healthcard-app/`
- Primary UI pages: `healthcard-app/src/pages/`
- Services: `healthcard-app/src/services/`
- Supabase SQL and migrations: `healthcard-app/supabase/sql/` and `supabase/migrations/`

Do not start in design reference folders unless the task is explicitly about matching static mockups.

## Current Important Facts

- The login flow supports username and email.
- Username login depends on DB-side resolution functions and app-side logic in `authService.ts`.
- Encoder drafts are intentionally local-only and live in `draftService.ts`.
- Continue Draft UI is in `EncoderClientsPage.tsx`.
- Encoder multi-step form is in `EncoderFormPage.tsx`.
- Ionic keeps pages mounted, so page refresh logic often needs `useIonViewWillEnter`, not only `useEffect`.
- New Registration must clear stale draft values when there is no `draft` query parameter.
- The draft list includes a live client-name search bar.

## Commands

Run from `healthcard-app/` unless the task is repository-level.

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test.unit
npm run test.e2e
```

Git runs from repository root:

```bash
git status
git add .
git commit -m "message"
git push
```

## Files Worth Reading Before Editing

- `healthcard-app/src/App.tsx`
- `healthcard-app/src/hooks/useAuth.tsx`
- `healthcard-app/src/services/authService.ts`
- `healthcard-app/src/services/draftService.ts`
- `healthcard-app/src/services/healthCardService.ts`
- `healthcard-app/src/pages/EncoderFormPage.tsx`
- `healthcard-app/src/pages/EncoderClientsPage.tsx`
- `healthcard-app/src/pages/EncoderPortal.css`

## Known Conventions

- Prefer minimal edits over broad rewrites.
- Preserve current Ionic/React Router v5 patterns unless the task requires migration.
- Keep frontend styling consistent with the existing portal CSS files.
- Draft persistence is local storage based; do not silently move it to Supabase without explicit approval.
- Root `.gitignore` already excludes local AI tooling folders, env files, node_modules, dist, and Supabase temp files.

## GitHub / Security Notes

- Do not commit secrets.
- `.vscode/mcp.json` is ignored because it may contain tokens.
- If a token was pasted into chat previously, treat it as compromised and rotate it.
- Do not re-enable or auto-run MCP unless explicitly requested by the user.

## Good Next Checks After Changes

- Validate TypeScript errors in touched files.
- Re-test encoder draft save, resume, delete, and new-registration reset behavior when touching encoder pages.
- Re-test username login when touching auth logic.