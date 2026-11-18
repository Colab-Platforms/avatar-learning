# PROGRESS.md

Status as of 2026-11-18, established by **reading code only** (**[code]**). **No feature was runtime-tested by the doc author**; "implemented" = code present and wired (routes/pages exist), not "proven working". Last commits: Book a Demo nav button, Products→Tools rename, hid "Avatar Learning" header button.

## Implemented (code present & wired)
- Auth: register + OTP, login, Google sign-in, MSG91 phone verify, refresh rotation, logout/all, password reset, complete-profile.
- Users: profile CRUD, resume upload (Cloudinary), profile image, career quiz persistence, SUPERADMIN role change.
- Courses: categories, courses, lessons→topics→resources, Bunny video upload/playback, file upload, enrollment, progress, certificate PDF, public listing/hero/slug.
- Assessments: weekly/final MCQ with timer, autosave, tab-switch violations, attempt history, admin editor & attempt reset.
- Payments: Razorpay + Cashfree order/verify/webhooks, coupons, abandoned-checkout report.
- Direct2Hire: pricing/status, assessment+counselling product, counselling profile/booking/feedback, Groq course recommendation, course selection, intro video, internship tasks & submissions with admin review, placement assessment (+overrides/cooldown), mock interview lifecycle, job placement journey, admin student views.
- Webinar: schedules (publish/live), paid registration, OTP recovery, emails.
- Partners: apply+KYC, approval, referral tracking, wallet, claims, commission cron.
- Investor CMS, contact inbox, admin dashboard overview, internships listing/applications, chatbot "Ava", Google Sheets + Pabbly sync.
- Frontend pages for all above, plus marketing home (`/` AI Adoption Ecosystem), `/learning`, about, blog (static), legal.

## Partially implemented / in flux
- Header/nav: many items commented out (Internships, Marketplace, Webinar, Contact) and "Avatar Learning" button temporarily hidden ([client/data/navigation.ts](client/data/navigation.ts), recent commits).
- `app/marketplace`, `app/coming-soon`, `app/onboarded`: purpose UNVERIFIED.
- Two parallel learner UIs exist: `app/courses/[id]/…` + `app/dashboard/[courseId]/…` and `app/dashboard/learning/[courseId]/…` (and legacy `/:courseId/assessment` aliases) — consolidation status unclear.
- Blog is static data; no CMS/API.
- Migrations history incomplete (see DATABASE.md).

## Pending / not found in code
Automated tests; CI/CD config; deployment config (Dockerfile, vercel/render files); OpenAPI spec; formal requirements; error monitoring; email/SMS delivery retry. Planned features: none documented in repo (UNVERIFIED — ask the user).

## Known bugs, risks & limitations (from code reading, unconfirmed at runtime)
1. **Hard-coded cron flag:** [backend/src/jobs/partnerCommission.job.ts:5](backend/src/jobs/partnerCommission.job.ts) and `partner.service.ts:21` set `isProd = true` with "TODO: remove before deploying" — forces the production schedule/hold regardless of `NODE_ENV`. Full analysis in "Environment & security audit" below (the TODO/comment is inverted; the real risks are different).
2. **Public `POST /api/users`** (`createUser`) has no `auth`; it creates a USER-role account with a hashed password and no email/OTP verification (`user.service.ts:93`). Confirm whether it is intentionally public (bypasses the OTP signup flow).
3. **User enumeration:** login returns 404 "User with this Email doesn't exist" vs 401 for bad password.
4. **JWT trust:** role/deactivation not rechecked per request except via `requireCompleteProfile`; access token lives 1d.
5. **Tokens in localStorage** (XSS-exposed); OTP generated with `Math.random`; rate limiting only on chatbot + webinar OTP — auth routes (login/OTP/forgot) not limited (UNVERIFIED elsewhere).
6. **Env gaps:** `.env.example` omits `CLOUDINARY_*`, `GROQ_API_KEY/GROQ_MODEL`, `DIRECT2HIRE_PRICE_RUPEES`, `DIRECT2HIRE_ASSESSMENT_PRICE_RUPEES`, `COURSE_BASIC_PRICE_RUPEES`, `APP_NAME`; D2H price vars are `parseInt(...!)` at import → `NaN` if unset.
7. Chatbot sessions are in-memory (`Map`) → lost on restart, not shared across instances. Cron jobs run in the web process → duplicates if scaled out.
8. `placement_attempts` lacks a unique constraint on (user, assessment, attemptNumber) unlike regular assessments (race risk, UNVERIFIED).
9. CORS allow-list has a trailing-slash entry `https://avatar-learning.vercel.app/` (won't match browser `Origin`) and hard-coded domains.
10. `client/README.md` is stale/incorrect. Unused deps possibly: twilio, prisma-qb, pagination-helper. Partner KYC (Aadhar/PAN/bank) stored as plain columns/URLs.

## Testing status
- Automated tests: **none**. Manual `.http` samples: `backend/test/auth.http, pabbly.http, webhok.http`.
- Type-check / build / lint: **not run** by the doc author (no commands executed).
- Runtime verification of any flow: **none**.

## Important development decisions (evident in code)
- Dual payment provider switch via `PAYMENT_PROVIDER`; webinar locked to Razorpay. Webhook and client `verify` both record payments; idempotent on conflict.
- Course content is **tiered** (`BASIC|D2H|BOTH`) per lesson/assessment/progress.
- D2H bought **per course**; gates resolve course from id/slug and never create enrollments as a side effect.
- Refresh tokens hashed server-side and rotated on use; OTPs hashed.
- Google Sheets/Pabbly are secondary, fire-and-forget (failures logged, not fatal).
- Direct uploads (Cloudinary signed, Bunny two-step init/complete) to avoid proxying files through the API.
- Dev-only shortcuts: `POST /api/direct2hire/dev/continue-as-paid` (non-prod only), `NEXT_PUBLIC_D2H_DEV_UNLOCK`.
- Marketing home swapped to AI Adoption Ecosystem (`/`), with `/home` rewritten to static `public/home-revamp`.

## Environment & security audit (2026-11-18)
Method: read-only SQL (SELECT only), file/Git inspection, one local run of backend+frontend. No migrations, seeds, writes or financial jobs were run by the auditor. Secret values are intentionally not recorded here.

**Local run result [runtime]:** Prisma Client generated; DB reachable (55 public tables, roles USER/ADMIN/SUPERADMIN present); `/api/health` 200; `/api/courses` returns DB rows; CORS allows `http://localhost:3001` and rejects unknown origins; protected routes return 401; frontend pages `/ /courses /login /direct2hire` return 200. Login, payments, email, Bunny, Groq, MSG91 were NOT exercised. Both servers were stopped afterwards.

**1–2. Neon branch / dev vs prod — NOT VERIFIED.** Cannot be determined from inside the repo or DB. Known (non-secret) identifiers: database `neondb`, Neon project id `sparkling-wave-11047708`, compute endpoint `ep-snowy-resonance-ai0smlxw` (pooler host), timeline `33c3c87615ed9a27756366f9e8006800`, PostgreSQL 18.7. Neon branch *names* are visible only in the Neon console/API. Evidence is ambiguous: data looks **real production data** (871 users, 851 gmail.com; 36 PAID + 2 REFUNDED Razorpay orders; 49 PAID webinar registrations; 33 PAID D2H enrollments; 4 partners), but a Neon dev branch is a copy-on-write copy of its parent, so a dev branch would look identical. Weak hint toward a snapshot: newest user 2026-11-06, newest order 2026-10-28, newest webinar 2026-10-29 while "today" is 2026-11-18 (a live DB would likely have newer signups). **Needed to close this:** in the Neon console, open project `sparkling-wave-11047708` → Branches, and confirm which branch owns endpoint `ep-snowy-resonance-ai0smlxw` and whether it is the default/primary (production) branch (or `neonctl branches list` with an API key). Treat the DB as PRODUCTION-EQUIVALENT until confirmed.

**Live payment key in local env.** `backend/.env` `RAZORPAY_KEY_ID` is a **`rzp_live_` key** (prefix only checked). Local dev with this env can create real Razorpay orders. Also `FRONTEND_URL`'s sibling payment/webhook/Pabbly/Google Sheets/Resend/MSG91/Cloudinary/Bunny values were not classified as test vs live. Recommend swapping to test keys for local work.

**3. Partner commission job — can it modify financial records? YES, in principle.** [partnerCommission.job.ts](backend/src/jobs/partnerCommission.job.ts) calls `partnerService.processMaturedReferrals()` once at every process boot, then daily 04:00 (`isProd=true`). For each referral with `credited_at IS NULL AND is_refunded=false AND eligible_at <= now()` it either sets `is_refunded=true` (enrollment REFUNDED) or, in a transaction, sets `credited_at/commission_*` and **increments `partners.wallet_balance`**. Findings:
- Direction of the `isProd` flag: `true` = 15-day hold and 04:00 daily cron = the *safer/production* behaviour. Setting it `false` (what the TODO text implies for prod) would be wrong: the hold would shrink to 5 minutes and the cron would run every minute. The TODO comment is inverted; the fix is to restore the commented line `process.env.NODE_ENV === "production"` **and** keep `NODE_ENV=production` in prod — but note that makes any non-production process use a 5-minute hold/every-minute cron, which is only safe against a throw-away DB. Duplicated in two files (`partner.service.ts:21`, `partnerCommission.job.ts:5`); they must stay consistent.
- **Real risk 1 — runs on every boot against whatever `DATABASE_URL` points to.** A local/dev process pointed at production-equivalent data will credit real partners' wallets for any matured referral.
- **Real risk 2 — double-credit race.** `processMaturedReferrals` does `findMany(creditedAt null…)` then updates without a conditional `where creditedAt: null` and without a lock. Two processes (e.g. local dev + deployed server, or two scaled instances, boot overlap with the 04:00 run) can both read the same due referral and both increment `wallet_balance`. Mitigation (not applied): `updateMany({where:{id, creditedAt:null}})` guard / single-runner or advisory lock.
- Both jobs start inside the web process (`index.ts`), so every `npm run dev` triggers them.

**4. Did it change records at startup? NO (for this run), by evidence.** (a) Backend log for this session has no `[PartnerCommission] Credited/skipped…` or `[SessionCleanup] Deleted…` lines (both only log when count > 0). (b) Read-only DB state after startup: `partner_referrals` has 0 rows total (0 credited, 0 due, 0 held, 0 credited in last 3h); `partner_claims` empty; all `partners.wallet_balance` sum to 0; no sessions created in last 3h. With zero referrals the commission sweep had nothing to process. Limitation: logs exist only for this session; earlier historical runs by other developers' machines are unknowable from here — the empty `partner_referrals` table suggests the referral feature has never been used on this DB.

**5. Git ignore:** added `.env*.local` to [client/.gitignore](client/.gitignore). Verified with `git check-ignore`: `client/.env.local` and the misplaced `client/client/.env.local` are now ignored; `backend/.env` was already ignored by `backend/.gitignore`. (`client/client/.env.local` is a stray misplaced copy, safe to delete.)

**6. `FRONTEND_URL` is NOT localhost:** it is `https://avatarindia.com` (production). CORS still works locally because `http://localhost:3001` is hard-coded in the allow-list (`index.ts`), but links in emails/password-reset/payment redirects built from `FRONTEND_URL` will point at production. Not changed (config belongs to the user); suggested value for local: `http://localhost:3001`. Also `NODE_ENV=development`, `PAYMENT_PROVIDER` unset (defaults to Razorpay), `BACKEND_URL` unset (defaults to localhost).

**7. Secrets/env files in Git:** tracked env-like files are only `backend/.env.example` and `client/.env.example`; no `.env`, `.pem`, key or credentials files tracked or ever committed (checked `git log --all`). Pattern scans (private-key header, Postgres URL with credentials, `rzp_live_`, `rzp_test_`, Resend/Groq/AWS key shapes) match only placeholders in `backend/.env.example` (a 63-char key stub and `postgres://username:…@host`) in HEAD and in commits `b792326`, `a1b8fc5`. Caveat: pattern scans can't prove absence of every secret format; remote branches (`origin/agents`, `cashfree`, `d2h/*` …) were included via `--all` for env-file names and the listed patterns. `.gitignore` entries `agents`, `*.md` in backend/.gitignore are unrelated but note `backend/.gitignore` ignores all `*.md` (docs placed under `backend/` would not be tracked).

**Exposure incident:** during the 2026-11-18 session an assistant command printed most of `GOOGLE_PRIVATE_KEY` (Google service account) into the chat transcript (not into any file). Rotate that key if the transcript may be retained/shared.

**Open actions (owner decisions):** confirm Neon branch (above); switch local Razorpay to test keys; set local `FRONTEND_URL`; decide fix for `isProd` flag + add `creditedAt: null` guard; consider a per-environment switch to disable cron jobs locally (e.g. `ENABLE_JOBS` env) — none implemented.

## Update log
- 2026-11-18: Environment & security audit added (see above); `client/.gitignore` updated. No application source, schema, migration or DB data changed.
- 2026-11-18: Initial documentation set created from code inspection (no code changes, no commands run besides read-only git/file inspection).
