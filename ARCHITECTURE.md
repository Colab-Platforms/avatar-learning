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

Business Admin analytics: `CLARITY_API_TOKEN`, `CLARITY_PROJECT_ID` (backend, read per request); `NEXT_PUBLIC_CLARITY_PROJECT_ID` (client; the public-site Clarity tag loads only on public paths after consent, see `client/lib/clarityConsent.ts`). WhatsApp templates also need `WHATSAPP_BUSINESS_ACCOUNT_ID`.
Backend: `DATABASE_URL, PORT, NODE_ENV, LOG_LEVEL, DEFAULT_PAGE_SIZE, JWT_SECRET, FRONTEND_URL, WEBINAR_PRICE_PAISE, WHATSAPP_COMMUNITY_LINK, WEBINAR_WHATSAPP_GROUP_LINK, DIRECT2HIRE_PRICE_RUPEES, DIRECT2HIRE_ASSESSMENT_PRICE_RUPEES, COURSE_BASIC_PRICE_RUPEES`.
Client: `NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_GOOGLE_CLIENT_ID, NEXT_PUBLIC_D2H_DEV_UNLOCK`.
Note `DIRECT2HIRE_*_PRICE_RUPEES` are `parseInt`'d at import time with `!` — missing var → `NaN` (gap).

## Conventions that affect design
Soft delete on `User` (`isDeleted`) and `InvestorDocument` (`deletedAt`); IDs are cuid strings; money as integer (rupees for course/commission, paise for webinar — check per field); times in UTC with IST conversion script (`convert:ist`).
