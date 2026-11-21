# ARCHITECTURE.md

Verification: **[code]** from `package.json`/source. Versions are the declared semver ranges, not installed versions (no install/run was done).

## Stack
**Backend** (`backend/`): Node (ESM, `"type":"module"`), TypeScript ^5.9, Express ^5.2, Prisma 7.5.0 + `@prisma/adapter-pg`, PostgreSQL, Joi ^18 validation, jsonwebtoken ^9, bcrypt ^6 (cost 8), helmet, cors, compression, express-rate-limit, node-cron ^4, multer, pdfkit (certificates), xss sanitiser, dayjs, resend (email), LangChain core + `@langchain/groq` (chatbot, recommendations), razorpay ^2.9 & cashfree-pg ^6, cloudinary ^2, google-auth-library, googleapis/google-spreadsheet. Dev: tsx, tsc-alias. Dependencies listed but no usage found in `src`: `twilio`, `prisma-qb`, `pagination-helper` (UNVERIFIED if used indirectly).
**Frontend** (`client/`): Next.js ^15.3 (App Router), React ^18.3, TypeScript ^5, Tailwind ^4 (`@tailwindcss/postcss`), Redux Toolkit ^2 (auth), TanStack React Query ^5, axios, react-hook-form + zod ^4, framer-motion, three/ogl/postprocessing (visual effects), face-api.js, react-markdown, sonner, lucide-react, `@react-oauth/google`. `client/README.md` is stale (says Next 14, mock data) — ignore it.
**Hosting hints [code]:** CORS allow-list contains `avatarindia.com`, Vercel preview domains; backend comments mention Render (`trust proxy`). Deployment config files: none in repo.

## Layout
```
avatar-learning/
├─ backend/
│  ├─ prisma/schema.prisma, migrations/ (3 files), seeds/index.ts (roles)
│  ├─ prisma.ts, prisma.config.ts      # client w/ pg adapter; CLI config
│  ├─ scripts/                         # one-off sync/backfill scripts (touch real data)
│  ├─ test/*.http                      # manual HTTP samples (no automated tests)
│  └─ src/
│     ├─ index.ts                      # app bootstrap, CORS, helmet, json(rawBody), sanitize, /api, cron start
│     ├─ routes.ts                     # mounts every module router
│     ├─ middlewares/                  # auth, requireCompleteProfile, rateLimiter, sanitize, errorHandler, notFound, profileImageUpload
│     ├─ modules/<feature>/            # route/controller/service/validators/types (+ admin.route.ts, *.mail.ts)
│     ├─ jobs/                         # sessionCleanup (03:00 daily), partnerCommission
│     ├─ lib/langchain/                # groqModel, normalizeContent
│     ├─ services/googleSheets.service.ts
│     └─ utils/                        # ApiError, responseUtils, statusCodes, auth(bcrypt), mailer(Resend), cloudinary, bunny, msg91, googleAuth, certificate(pdfkit), logger
└─ client/
   ├─ app/                             # routes: (auth), (legal), admin/*, dashboard/*, courses/*, direct2hire/*, webinar, partners, investors, blog, …
   ├─ components/<area>/               # ai-ecosystem, learn-adopt, assessment, learning, counselling, placement, mock-interview, profile, admin, ui, layout, sections
   ├─ lib/                             # apiClient.ts (axios+refresh), *Api.ts per domain, react-query/query-keys.ts
   ├─ hooks/{queries,mutations}/       # React Query hooks; checkout hooks (useRazorpay, useCashfree, …)
   ├─ store/                           # Redux: authSlice, StoreProvider, QueryProvider
   ├─ data/ constants/ types/          # static content & types
   ├─ public/                          # static assets incl. home-revamp/ (served at /home via rewrite)
   └─ next.config.ts                   # /home rewrite, remote images "**", webpack fs stub for face-api
```

## Request / data flow
Browser → axios `apiClient` (`NEXT_PUBLIC_API_BASE_URL`, adds `Authorization: Bearer <accessToken>` from `localStorage["auth"]`; on 401 refreshes once via `POST /auth/refresh`) → Express `/api/*` → middleware chain (helmet → cors → compression → json w/ `rawBody` for webhook signatures → xss sanitize) → module route → `auth()` / `requireCompleteProfile` / D2H gates → controller → service → Prisma → Postgres. Errors → `errorHandler`; all responses `{status,data,message}`. React Query handles server state; Redux holds auth/user only.

## Authentication & authorization [code]
- Access JWT (`JWT_SECRET`, claims `{id, role}`, 1d) sent as Bearer. Refresh token = 32-byte random, **hashed (SHA-256)** in `sessions`, 30d; rotation in `authService.refresh`; `logout`, `logoutAll`. Expired sessions pruned by cron.
- Tokens stored client-side in **localStorage** (XSS-exposed by design; see PROGRESS.md notes). Not httpOnly cookies.
- Role check in [authMiddleware.ts](backend/src/middlewares/authMiddleware.ts): role not looked up in DB per request (JWT claim trusted until expiry → role changes/deactivation take effect only after token expiry; `requireCompleteProfile` does hit DB and checks `isDeleted`).
- OTPs: 6-digit via `Math.random` (not crypto-secure), stored SHA-256 hashed, types REGISTER/LOGIN/WEBINAR_RECOVERY.
- Google: ID token verified with `google-auth-library` (`GOOGLE_CLIENT_ID`). Phone: MSG91 widget token verified server-side.
- Rate limiting: only on chatbot (10/15min) and webinar OTP routes (5/15min each). No global/auth-route limiter found (UNVERIFIED for other places).
- Webhook auth: Razorpay (`RAZORPAY_WEBHOOK_SECRET`) and Cashfree (`CASHFREE_WEBHOOK_SECRET`) signature checks in `payment.service.ts` (details UNVERIFIED beyond code reading).

## Scheduled jobs [code]
- `sessionCleanup.job.ts` — boot + daily 03:00, batched delete of expired sessions.
- `partnerCommission.job.ts` — boot + cron; **`isProd` is hard-coded `true` with a TODO** (see PROGRESS.md).
- Jobs start inside the web process (`index.ts`) → duplicate runs if horizontally scaled (UNVERIFIED deployment topology).

## Third-party integrations [code]
| Service | Use | Where | Env names |
|---|---|---|---|
| Razorpay / Cashfree | Course, D2H, webinar payments; chosen by `PAYMENT_PROVIDER` (default razorpay; webinar always Razorpay) | `modules/payment`, `modules/webinar` | `PAYMENT_PROVIDER, BACKEND_URL, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_WEBHOOK_SECRET, CASHFREE_ENV` |
| Resend | Transactional email (OTP, reset, webinar, counselling, partner) | `utils/mailer.ts` | `RESEND_API_KEY, SMTP_FROM_EMAIL, SUPPORT_EMAIL, APP_NAME` |
| Bunny.net Stream | Course/intro video upload + signed playback | `utils/bunny.ts` | `BUNNY_API_KEY, BUNNY_LIBRARY_ID, BUNNY_CDN_HOSTNAME, BUNNY_TOKEN_SECURITY_KEY, BUNNY_EMBED_TOKEN_AUTH` |
| Cloudinary | Images, documents, resumes (signed direct upload) | `utils/cloudinary.ts` | `CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET` (not in `.env.example`) |
| Groq (via LangChain) | Chatbot "Ava"; D2H course recommendation | `modules/chatbot`, `modules/direct2hire/recommendation`, `lib/langchain` | `GROQ_API_KEY, GROQ_MODEL` (not in `.env.example`) |
| Google Sign-In | OAuth ID-token login | `utils/googleAuth.ts` | `GOOGLE_CLIENT_ID` (+ client `NEXT_PUBLIC_GOOGLE_CLIENT_ID`) |
| Google Sheets | Secondary reporting sync (users, leads, enrollments, webinar, abandoned checkout, quiz) | `services/googleSheets.service.ts` | `GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY` |
| Pabbly webhooks | Purchase/signup → Excel + WhatsApp | `payment.service.ts`, `auth.service.ts` | `PABBLY_D2H_PURCHASE_WEBHOOK_URL, PABBLY_BASIC_COURSE_PURCHASE_WEBHOOK_URL, PABBLY_SIGNUP_WEBHOOK_URL` |
| WhatsApp Cloud API (Meta) | Incoming messages + delivery/read/failed statuses via webhook; optional outbound `WhatsappClient` (not called yet) | `modules/whatsapp`, `/api/whatsapp/webhook` | `WHATSAPP_ENABLED, WHATSAPP_APP_SECRET, WHATSAPP_WEBHOOK_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_GRAPH_API_VERSION` |
| MSG91 | Phone-verification widget | `utils/msg91.ts` | `MSG91_AUTH_KEY, MSG91_WIDGET_ID, MSG91_TOKEN_AUTH` |

## Other env var names

Production database state (as of 2026-11-21, per the owner): all migrations through `20261123100000_add_admin_permissions_and_audit_log` are applied, roles are seeded (incl. `BUSINESS_ADMIN`) and the Super Admin account is repaired and can log in. Do not re-run these. Only a code deploy plus the Render/Meta configuration below remain. (Two production-only history rows have no migration file in the repo; see PROGRESS.md.)

Live User Monitoring (`backend/src/modules/monitoring/`, client `app/admin-adaption/monitoring/**`, `components/analytics/ActivityTracker.tsx`): first-party tracking, no fingerprinting. The browser keeps one random id (`localStorage av_vid`) and, only after the visitor accepted analytics (same consent as the cookie banner; `NEXT_PUBLIC_TRACKING_REQUIRE_CONSENT=false` relaxes it, a refusal always wins), sends a page view per navigation and a 30s heartbeat while the tab is visible to `/api/track/*`. Query strings, form contents and keystrokes are never sent; /admin, /admin-adaption and bots are not tracked. Server-side events (sign-in, failed sign-in, logout, session expiry/termination, registration, email verification, password reset, (de)activation, enrolment, lesson/test, payment, profile update) are recorded fire-and-forget through `track.*` (never awaited, never throws) using an AsyncLocalStorage request context (IP, user agent, `X-Visitor-Id`). Sign-in attaches the browser's earlier anonymous history to the account (not re-linked if that browser already belongs to another person). The refresh-token row id is now carried in the access token as `sid`, so an administrator can terminate ONE sign-in: its refresh token is deleted, the access token is refused by the `auth` middleware, which asks the SHARED DATABASE whether the session with the token's `sid` was terminated (the `monitoring_sessions` row, `end_reason = 'TERMINATED'`; per-instance caches: revoked = until the token would have expired, not-revoked = 10 seconds, so the instance that terminates enforces it at once and every other instance within ~10 seconds, and it survives restarts; FAIL CLOSED: if the database cannot verify a session-bound token (error, or no answer within 1.5s) the request gets a temporary 503 "could not verify your session" instead of being allowed; the failure is never cached, so it recovers on the next request; sessions verified in the last 10s keep working; tokens without a `sid` are not checked and keep their normal expiry; terminate is one transaction (mark TERMINATED + delete the refresh token: both or neither, 503 and no change if it cannot complete)). Every sign-in is its own monitoring session (a second sign-in on the same browser gets its own row, so each refresh token can be terminated); a sign-in that merely went idle (TIMEOUT, refresh token still valid) can still be terminated, logout/expiry/termination are final and the next heartbeat makes the browser sign out. Tokens issued before this release have no `sid` and cannot be revoked individually (they expire within 1 day). The legacy `BUSINESS_ADMIN_EMAILS` allowlist does NOT grant `monitoring` (`EXPLICIT_GRANT_ONLY` in `business-admin.modules.ts`): personal activity data needs an explicit grant. Online = open session with a heartbeat inside `MONITORING_ONLINE_TIMEOUT_SECONDS` (90); idle sessions close after `MONITORING_SESSION_IDLE_MINUTES` (30). Real-time dashboard: Server-Sent Events read with fetch (falls back to 10s polling). Permissions: Business Admin module `monitoring` (view / manage); SUPERADMIN has it, the Manager preset includes it, other staff only if granted. Env (all optional, read at call time): `MONITORING_ENABLED` (default on; off in the Node test runner), `MONITORING_ONLINE_TIMEOUT_SECONDS`, `MONITORING_SESSION_IDLE_MINUTES`, `MONITORING_RETENTION_DAYS`, `MONITORING_SECURITY_RETENTION_DAYS`.

Unified authentication (identity): ONE person = one email = one `users` row (the shared identity: password hash, roles, profile) plus, for AI Adoption, one `adoption_users` row (Adoption profile, sessions, tool access, demo requests), linked BY EMAIL with no schema change and no id ever rewritten (`backend/src/modules/auth/identity.service.ts`). Rules: the same email + password signs in to Learning (`POST /api/auth/login`) and Adoption (`POST /api/adoption/auth/login`); either stored hash proves the person (accounts created separately before unification may differ) and login never overwrites a hash; a missing side is created lazily from the verified other side (shared identity = plain USER, never an invented role); registering where a verified account already exists on either side returns the usual "already exists" error; verifying an Adoption email, an Adoption/Learning password reset or an Adoption password change writes the new hash to both sides and ends every session in both modules; an Adoption email change moves the `users` email with it; Google sign-in links to the same row. Sessions stay separate per module (Adoption opaque token, Learning JWT + refresh); Business Admin staff (SUPERADMIN / BUSINESS_ADMIN only) who sign in at Adoption also receive a Learning session in the response (`data.learning`) so the client lands them on `/admin-adaption`; ADMIN (Learning Admin) and USER never do. A login grants NO module: every admin API still checks the role/permissions (`/admin` Learning Admin, `/admin-adaption` Business Admin, `/admin-adaption/admins` Super Admin only). Existing accounts: `backend/scripts/reconcile-accounts.ts` (dry run by default; creates missing shared identities for verified Adoption accounts and fills empty hashes only).

Frontend API base URL (Vercel): the only source is `NEXT_PUBLIC_API_BASE_URL`, baked in at build time (`client/lib/apiBase.ts`, used by `apiClient.ts` and `adoptionSession.ts`). Production and local builds use it as given. A Vercel PREVIEW build (`VERCEL_ENV=preview`) must have its own development API: if the variable is missing, not https (localhost excepted) or points at the production API host, `next.config.ts` fails the build with a clear message and the runtime refuses every request (`lib/apiBaseCheck.ts`). So a Preview can never silently call production. Set `NEXT_PUBLIC_API_BASE_URL` per Vercel environment (Production = production API, Preview = development API); the development backend needs `FRONTEND_URL` set to the Preview origin for CORS.

WhatsApp configuration (Render, backend). Feature flags are the literal string `true` (anything else, or unset, is off); credentials/IDs are opaque strings and are never booleans. Names only, never commit values:
- Flags: `WHATSAPP_ENABLED` (webhook + Cloud API on), `WHATSAPP_OUTBOUND_ENABLED` (allows sending from the inbox and automation), `WHATSAPP_AUTOMATION_ENABLED` (website events + queue worker; the worker starts only at boot, so restart after changing it).
- Credentials/IDs: `WHATSAPP_ACCESS_TOKEN` (system-user token), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` (needed to list/create templates), `WHATSAPP_APP_SECRET` and `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (webhook; both required), optional `WHATSAPP_APP_ID` (media template headers), optional `WHATSAPP_GRAPH_API_VERSION` (default v23.0).
- Book a Demo confirmation needs ALL of: the three flags, the credentials above, an APPROVED Meta template, an active `demo.requested` rule (Business Admin -> Automations), and the visitor ticking the WhatsApp consent box (recorded as opt-in; a STOP reply always wins). Template: category UTILITY, language matching the rule (e.g. `en`), suggested name `demo_requested_thanks`, body `Hi {{1}}, thank you for booking a demo with Avatar for {{2}}. Our team will be in touch shortly to confirm the date and time.` with variable mapping 1=name, 2=tools and sample values (e.g. Asha, CRM, HRMS). An older template with the one-variable body keeps working only if its rule maps just `name`. Business-initiated sends outside a 24h customer window are refused by the engine (and recorded as SKIPPED) without recorded opt-in.
Business Admin analytics: `CLARITY_API_TOKEN`, `CLARITY_PROJECT_ID` (backend, read per request); `NEXT_PUBLIC_CLARITY_PROJECT_ID` (client; the public-site Clarity tag loads only on public paths after consent, see `client/lib/clarityConsent.ts`). WhatsApp templates also need `WHATSAPP_BUSINESS_ACCOUNT_ID`.
Backend: `DATABASE_URL, PORT, NODE_ENV, LOG_LEVEL, DEFAULT_PAGE_SIZE, JWT_SECRET, FRONTEND_URL, WEBINAR_PRICE_PAISE, WHATSAPP_COMMUNITY_LINK, WEBINAR_WHATSAPP_GROUP_LINK, DIRECT2HIRE_PRICE_RUPEES, DIRECT2HIRE_ASSESSMENT_PRICE_RUPEES, COURSE_BASIC_PRICE_RUPEES`.
Client: `NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_GOOGLE_CLIENT_ID, NEXT_PUBLIC_D2H_DEV_UNLOCK`.
Note `DIRECT2HIRE_*_PRICE_RUPEES` are `parseInt`'d at import time with `!` — missing var → `NaN` (gap).

## Conventions that affect design
Soft delete on `User` (`isDeleted`) and `InvestorDocument` (`deletedAt`); IDs are cuid strings; money as integer (rupees for course/commission, paise for webinar — check per field); times in UTC with IST conversion script (`convert:ist`).
