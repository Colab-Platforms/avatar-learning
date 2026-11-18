# PROJECT.md

All statements are **[code]**-verified unless marked otherwise. See [ARCHITECTURE.md](ARCHITECTURE.md) for how it's built.

## Purpose
Avatar India's platform to (1) market an "AI Adoption Ecosystem" (tools, talent, adoption path), (2) teach AI courses, (3) place students in jobs via a paid **Direct2Hire** program, and (4) run supporting businesses: paid webinars, partner/referral program, investor document CMS.
Business objectives beyond what code shows (revenue targets, KPIs): UNVERIFIED.

## Modules / features (existing in code)
| Module | Backend | Frontend |
|---|---|---|
| Auth (email+OTP, Google, MSG91 phone verify, password reset, sessions) | `modules/auth` | `app/(auth)/*` |
| User profile, resume, profile image, career quiz | `modules/user` | `app/profile`, `app/quiz`, `components/profile` |
| Courses (categories, lessons→topics→resources, videos via Bunny, files via Cloudinary), enrollment, progress, certificate PDF | `modules/course` | `app/courses`, `app/dashboard`, `app/admin/courses` |
| Course assessments (WEEKLY/FINAL MCQ, timed, tab-switch proctoring, attempt limits) | `modules/course/assessment` | `app/courses/[id]/assessment`, `app/dashboard/learning` |
| Payments (Razorpay or Cashfree, coupons, webhooks) | `modules/payment`, `modules/coupon` | `hooks/useRazorpay`, `useCashfree`, checkout hooks |
| Direct2Hire (see workflow) | `modules/direct2hire/*` | `app/direct2hire`, `app/dashboard/[courseId]/*`, `app/admin/direct2hire` |
| Internships (public listings + applications) | `modules/internship` | `app/internships`, `app/admin/internships` |
| Webinars (paid ₹ registration, schedules, OTP recovery) | `modules/webinar` | `app/webinar`, `app/admin/webinar` |
| Partners & referrals (apply, KYC, wallet, claims) | `modules/partners` | `app/partners`, `app/partner-dashboard`, `app/admin/partners` |
| Investor CMS (categories, documents) | `modules/investors-cms` | `app/investors`, `app/admin/investors` |
| Contact form + admin inbox | `modules/contact` | `app/contact`, `app/admin/contacts` |
| AI chatbot "Ava" (Groq LLM) | `modules/chatbot` | `components/ui/ChatbotAgent.tsx` |
| Admin dashboard overview | `modules/dashboard` | `app/admin` |
| Static marketing: AI ecosystem home (`/`), learning (`/learning`), about, blog (static data), legal | — | `app/page.tsx`, `components/ai-ecosystem`, `data/*` |

Pages that exist but whose backend is absent/unclear: `app/marketplace`, `app/coming-soon`, `app/onboarded` — UNVERIFIED purpose (not inspected in depth). Blog content is static (`client/data/blogData.ts`), no blog API.

## User roles & permissions
Roles: `USER`, `ADMIN`, `SUPERADMIN` (JWT claim `role`; `roles` / `user_role_mapping` tables seeded by `prisma/seeds/index.ts`).
- Hierarchy: `auth("USER")` routes also admit ADMIN/SUPERADMIN; `auth("ADMIN")` admits ADMIN+SUPERADMIN; only SUPERADMIN can `PATCH /api/users/:id/role` and (with ADMIN) list users. ([backend/src/middlewares/authMiddleware.ts](backend/src/middlewares/authMiddleware.ts))
- Unauthenticated: browse courses/internships/investors, submit contact form, buy/recover webinar, chat with bot, register/login.
- USER: needs `profileCompleted=true` (enforced by `requireCompleteProfile`) for nearly everything except `/users/me`, `/auth/*`.
- D2H features are additionally gated by payment state (below).
- Partner: not a role — a `Partner` record linked to a USER, status PENDING/APPROVED/REJECTED.
- Frontend admin area only checks JWT role client-side for UX (`client/app/admin/layout.tsx`); real enforcement is server-side.

## Core workflows & business rules
**Registration/login [code]:** register (email/password) → OTP email (hashed, SHA-256) → verify → session. Login can also issue OTP. Google sign-in may leave `profileCompleted=false` → `/complete-profile` (min age 10). Phone verification via MSG91 widget. Access JWT TTL 1d; refresh token 30d, stored hashed in `sessions`.

**Course purchase [code]:** course has `price`; tiers `BASIC | D2H | BOTH`. Create order (`/api/payment/create-order`, optional coupon %) → provider checkout → `/verify` and webhook both record the payment (race handled idempotently) → `CourseUserMapper` enrollment. Basic course price referenced as ₹499 in env comments (value from env `COURSE_BASIC_PRICE_RUPEES`).

**Direct2Hire [code]:** step-locked journey (UI order: Assessment → Counselling → AI Learning → Internships → Job Placement; dev bypass `NEXT_PUBLIC_D2H_DEV_UNLOCK`).
1. Optional paid "Assessment + Counselling" product (`D2H_ASSESSMENT_COUNSELLING`) unlocks counselling profile form, AI course recommendation (Groq), counselling booking, course selection, feedback.
2. Full D2H purchase (≈₹4999 per env comment; `DIRECT2HIRE_PRICE_RUPEES`) sets enrollment `PAID` → unlocks intro video, internship tasks/submissions (admin review), mock interview (request → admin schedule → complete → feedback with grade A/B/C), job-placement entries, placement assessment (limited attempts, admin can grant extra via overrides, cooldown policy in `placement.attempt-policy.ts`).
3. Admin can mark paid/refunded, generate payment link, confirm booking, etc.
Gates: `requireAssessmentCounsellingAccess` (assessment/counselling product OR full paid) and `requireDirect2HireAccess` (full paid) in [backend/src/modules/direct2hire/assessmentCounsellingAccess.middleware.ts](backend/src/modules/direct2hire/assessmentCounsellingAccess.middleware.ts).

**Partner commission [code]:** approved partners get a referral code; a referred student's D2H payment creates `PartnerReferral` with flat ₹999 commission base (`DIRECT2HIRE_COMMISSION_BASE_AMOUNT`), held until `eligibleAt` (15 days prod), then a cron credits `walletBalance` unless refunded; partner raises `PartnerClaim`, admin marks paid. (Commission rate/hold are in `partner.service.ts` — verify before changing.)

**Webinar [code]:** public registration with name/email/phone, Razorpay payment (default ₹7 via `WEBINAR_PRICE_PAISE`, or per-schedule `priceInPaise`), one schedule can be `isLive`; email confirmation with WhatsApp links; OTP-based recovery of existing registration.

**Assessments [code]:** timed attempts, answers autosaved, tab-switch violations auto-submit after `maxTabSwitchWarnings`, timeout auto-submit, pass % per assessment, attempt cap (`maxAttempts`).

## Functional requirements (inferred from implemented behaviour)
Formal requirements document: none in repo (UNVERIFIED). Implied: secure auth with refresh; role-based admin CRUD for all content; payments must be idempotent across webhook+verify; D2H access strictly gated by payment; external reporting (Google Sheets, Pabbly) must not block core flows (calls are `.catch`ed).
