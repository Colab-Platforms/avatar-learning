# CLAUDE.md — Avatar Adaption (repo: `avatar-learning`)

Entry point for Claude. Read this first on **every** task, then read only what the task needs.

## What this is
Avatar India's web platform: AI-adoption marketing site + AI course LMS + paid "Direct2Hire" (D2H) career program + webinars, partners/referrals, investor CMS, admin panel. Two independent npm packages in one git repo (no root `package.json`, no monorepo tooling):
- `backend/` — Express 5 + Prisma 7 + PostgreSQL (TypeScript, ESM)
- `client/` — Next.js 15 App Router + Tailwind 4 + Redux Toolkit + React Query

> "Avatar Adaption" is the project name used by the team; the code/repo/UI use "Avatar Learning", "Avatar AI Ecosystem" and "AI Adoption Ecosystem". Same codebase.

## Documentation map (read only what's relevant)
| File | Read when |
|---|---|
| [PROJECT.md](PROJECT.md) | Product purpose, roles, workflows, business rules |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack/versions, folders, data flow, auth, integrations, env var names |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Adding/changing endpoints, request/response shape, error format |
| [DATABASE.md](DATABASE.md) | Touching Prisma schema, queries, migrations |
| [PROGRESS.md](PROGRESS.md) | What's done / partial / pending, known bugs, decisions |

## Finding code fast (don't scan the repo)
- Backend feature = folder `backend/src/modules/<name>/` with `*.route.ts` → `*.controller.ts` → `*.service.ts` (+ `*.validators.ts`/`*.types.ts`). Admin routes live in `admin.route.ts` in the same module. All mounted in [backend/src/routes.ts](backend/src/routes.ts) under `/api`.
- Frontend page = `client/app/<route>/page.tsx`; API calls in `client/lib/*Api.ts`; React Query hooks in `client/hooks/queries|mutations`; shared UI in `client/components/<area>/`.
- Schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma) (single file, ~1600 lines — grep the model name, don't read all).
- To locate a feature: grep the route path or controller name, then open just that module.

## Commands (from `backend/` or `client/`)
Backend: `npm run dev` (tsx watch), `npm run type-check` (`tsc --noEmit`), `npm run build`, `npm run db:generate`, `npm run db:migrate` (dev), `npm run db:deploy` (prod), `npm run db:seed` (roles only), `npm run db:studio`. Utility scripts: `sync:*`, `convert:ist`, `backfill:tiers` (touch real data — never run without explicit user approval).
Client: `npm run dev` (port **3001**), `npm run build`, `npm run lint`.
Env: copy `backend/.env.example` / `client/.env.example`; the backend reads more vars than the example lists (see ARCHITECTURE.md). **Never print or commit env values.**

## Coding conventions (observed in code)
- Backend: ESM with `.js` import suffixes on TS files; path aliases `@/` (src), `@root/` (backend root). Pattern: route → controller → service; Joi validators; throw `ApiError(message, STATUS_CODES.X)`; respond with `sendResponse(res, status, data, message, code)` → `{ status, data, message }`.
- Auth: `auth("USER"|"ADMIN"|"SUPERADMIN")` middleware (role hierarchy: higher roles pass lower-role checks); add `requireCompleteProfile` for user routes. Admin routers call `router.use(auth("ADMIN"))`.
- Route order matters: static/`/me/*` routes before `/:slug` catch-alls.
- Prisma: model PascalCase → snake_case tables via `@map`; Prisma client uses `@prisma/adapter-pg` (`backend/prisma.ts`).
- Frontend: `"use client"` components, axios `apiClient` (`client/lib/apiClient.ts`) with Bearer token + auto refresh; `@/` alias; Tailwind utility classes; toasts via `sonner`.
- Match surrounding style; don't refactor unrelated code.

## Testing requirements
- **No automated tests exist** (no test runner, no `*.test.*`). Only manual HTTP samples in `backend/test/*.http`.
- Minimum before declaring work done: `npm run type-check` in `backend/` for backend changes; `npm run build` (or at least `npm run lint`) in `client/` for frontend changes. Report honestly if not run.
- Prefer adding tests only if the user asks or a test runner is introduced; if you add one, record it in PROGRESS.md.
- Never claim runtime behaviour was verified unless you actually ran it.

## Safety rules
- Don't commit, push, deploy, or run production/data-touching scripts unless explicitly asked.
- Don't edit migrations or schema without being asked; schema changes need a migration (`prisma migrate dev`) and a DATABASE.md update.
- Never expose secrets/keys; document env var **names** only.
- Payments/webhooks, auth, and partner-commission code are money- or security-sensitive: read the service fully before editing.

## Documentation maintenance rules (mandatory)
1. Read `CLAUDE.md` before starting every new task.
2. Read only the additional docs relevant to the task.
3. Inspect specific source files when implementation details need verification — docs may be stale; code wins.
4. Update the relevant doc whenever functionality, endpoints, schema, env vars, or architecture change (API → API_DOCUMENTATION.md, schema → DATABASE.md, structure/integrations → ARCHITECTURE.md, behaviour/roles → PROJECT.md).
5. Update `PROGRESS.md` after completing meaningful development work.
6. Never mark a feature "completed" without verifying its implementation in code (and say whether it was runtime-tested).
7. Avoid re-scanning the whole repo when the docs suffice. Don't duplicate facts across docs — link instead.
8. Keep docs concise; mark anything unverified as `UNVERIFIED`.

Verification labels used in docs: **[code]** = read in source; **[runtime]** = actually run/tested; **UNVERIFIED** = not confirmed. Everything in the current docs is **[code]** unless stated — no runtime testing was done when they were written.
