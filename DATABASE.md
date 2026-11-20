# DATABASE.md

**Tech:** PostgreSQL via Prisma 7.5.0 (`provider = "prisma-client-js"`, driver adapter `@prisma/adapter-pg`). Schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma) (~1626 lines, 55 models). Connection: env `DATABASE_URL` (value not documented). **[code]** — no DB was connected to; actual live schema state is UNVERIFIED.

Conventions: `id String @id @default(cuid())`; tables snake_case via `@map`/`@@map`; most FKs `onDelete: Cascade`; `createdAt/updatedAt`. Soft delete: `User.isDeleted/deletedAt`, `InvestorDocument.deletedAt`.

## Enums
`CurrentStudyLevel, AuthProvider(LOCAL|GOOGLE), CourseLevel, CourseTier(BASIC|D2H|BOTH), ResourceCategory, OtpType(REGISTER|LOGIN|WEBINAR_RECOVERY), EmploymentType, ApplicationStatus, Direct2HireStatus(PENDING|PAID|REFUNDED), PaymentOrderStatus, PaymentProductType(COURSE|DIRECT2HIRE|D2H_ASSESSMENT_COUNSELLING), PaymentProvider(RAZORPAY|CASHFREE), PaymentTransactionStatus, WebinarRegistrationStatus, AssessmentAttemptStatus/PlacementAttemptStatus(IN_PROGRESS|SUBMITTED|AUTO_SUBMITTED_TIMEOUT|AUTO_SUBMITTED_VIOLATION), AssessmentType(WEEKLY|FINAL), InternshipSubmissionStatus, MockInterviewStatus, MockInterviewPerformanceGrade(GRADE_A|B|C), SubmissionAttachmentKind, PartnerType, PartnerStatus, PartnerClaimStatus`.

## Models by domain (table name → key fields / constraints)
**Identity & auth**
- `users` — email `@unique`, phoneNo `@unique`, googleId `@unique`, password?, authProvider, profileCompleted, isEmailVerified/isPhoneVerified, isActive, isDeleted, resume/profileImage URLs+publicIds, quiz* result columns. Idx: email, isActive.
- `roles` (name unique) ⟷ `user_role_mapping` (`@@unique[userId,roleId]`). Seeded: USER, ADMIN, SUPERADMIN.
- `sessions` — refreshToken (SHA-256 hash), device, expiresAt; idx userId, expiresAt.
- `otp_verifications` — email, otpCode (hash), type, used, expiresAt; idx email, expiresAt. `password_reset_tokens` — token unique. `quiz_assessments` — answers/domainScores Json.

**Courses & learning**
- `categories` (name, slug unique) → `courses` (slug unique, price Int, level, tools String[], whatYouLearn/audience Json, isDirect2HireCourse/isDirect2HireOnly, isPublished, isComingSoon; idx categoryId, isPublished, composites).
- `lessons` (`@@unique[courseId,tier,weekNumber]`, tier CourseTier) → `topics` (`@@unique[lessonId,topicOrder]`) → `resources` (category, url, bunnyVideoId). `resource_downloads` (unique user+resource). `intro_video` (D2H intro, Bunny).
- Enrollment/progress: `course_user_mapper` (`@@unique[userId,courseId]`, tier, progress, isCompleted), `course_track_progress` (`@@unique[userId,courseId,tier]`), `lesson_progress`, `topic_progress` (unique user+lesson/topic).
- Assessments: `assessments` (courseId, optional unique lessonId, type, tier, timeLimit, passingScorePercent, maxTabSwitchWarnings, maxAttempts) → `assessment_questions` (`@@unique[assessmentId,questionOrder]`) → `assessment_options` (isCorrect); `assessment_attempts` (`@@unique[userId,assessmentId,attemptNumber]`, status, score*, tabSwitchCount) → `assessment_answers` (`@@unique[attemptId,questionId]`, selectedOption `SetNull`).
- Placement (D2H): `placement_assessments` (courseId **unique**, questionsPerAttempt, maxAttempts), `placement_questions/options`, `placement_attempts` (questionIds String[]; **no unique on attemptNumber**), `placement_answers`, `placement_attempt_overrides` (admin-granted extra attempts; grantedBy→User).

**Direct2Hire**
- `direct2hire_enrollments` (`@@unique[userId,courseId]`, status, paidAt, assessmentCounsellingPaidAt), `direct2hire_leads` (userId unique), `counselling_profiles` (userId unique; ~15 questionnaire answer + `*Other` text columns), `course_recommendations` (userId unique, counsellingProfileId unique, provider/model/promptVersion, rawResponse Json; recommended course fields nullable since migration 20260901), `counselling_bookings` (`@@unique[userId,courseId]`, selectedCourseId, phoneNumber), `counselling_feedbacks` (userId unique), `mock_interviews` (`@@unique[userId,courseId]`), `job_placement_entries` (idx userId, [userId,leftAt]).
- Internship program: `internship_tasks` (`@@unique[courseId,weekNumber]`) → `internship_task_attachments`; `internship_submissions` (`@@unique[userId,taskId]`, reviewer→User SetNull) → `internship_submission_attachments` (kind FILE|LINK).

**Commerce**
- `payment_orders` (gatewayOrderId **unique**, productType, provider, amount Int, status, couponId?, discountAmount; FKs course?/direct2hireEnrollment?; idx status, userId, …) → `payment_transactions` (gatewayPaymentId unique, metadata Json). `coupons` (code unique, discountPercent, expiresAt?). No redemption table — "redemptions" derived from orders (UNVERIFIED).
- Webinar: `webinar_schedules` (isLive, isPublished, priceInPaise) ← `webinar_registrations` (razorpayOrderId/PaymentId unique, status; idx email, phoneNumber, status). Not linked to `users`.
- Partners: `partners` (userId unique, referralCode unique, walletBalance Int, KYC fields/files, bank fields — **sensitive PII: aadhar, PAN, bank account**), `partner_referrals` (referredUserId unique, direct2hireEnrollmentId unique, eligibleAt idx, isRefunded), `partner_claims`.

**WhatsApp:** `whatsapp_messages` (`wa_message_id` **unique**, direction INBOUND|OUTBOUND, status RECEIVED|SENT|DELIVERED|READ|FAILED, contact_wa_id, text_body, sent/delivered/read/failed_at, error_*; idx contact_wa_id, status, [direction, created_at]). No FK to `users`. Migration `20261118130000_add_whatsapp_messages` (applied to the Neon `whatsapp-development` branch only).
**WhatsApp Inbox (migration `20261119180000_add_whatsapp_inbox`, generated offline, NOT applied anywhere; additive only):** status enum gains `SENDING` (appended: `ALTER TYPE ... ADD VALUE`); `whatsapp_messages` gains nullable `sent_by_user_id` and `client_request_id` (**unique**, the idempotency key; retries use `retry-of:<messageId>`); new `whatsapp_conversations` (`contact_wa_id` unique, `assigned_to_user_id`, `assigned_at`, team-wide `last_read_at`/`last_read_by_user_id`; created lazily) and append-only `whatsapp_conversation_events` (type ASSIGNED|UNASSIGNED|NOTE, author, assignee, body; idx [contact_wa_id, created_at]). No FKs to `users`. **Admin permissions (migration `20261119190000_add_business_admin_access`, generated offline, NOT applied; additive only):** new `business_admin_access` (`user_id` unique, `role_key`, `modules text[]`, `created_by_user_id`, timestamps; no FK). Admin accounts reuse `users` + `user_role_mappings` (role ADMIN); passwords in `users.password` (bcrypt). Apply only with `prisma migrate deploy` after the read-only diff; never `migrate dev`/`db push` (the database has migrations that are not in this repo).
**WhatsApp contacts (migration `20261120100000_add_whatsapp_contacts`, generated offline, NOT applied):** `whatsapp_contacts` (model `WhatsappContact`; unique `wa_id`; name, email, company, notes, tags, source; `opt_in_status` enum `WhatsappOptInStatus` UNKNOWN|GRANTED|WITHDRAWN with evidence text and timestamps). Interim opt-in register for Business Admin sends; the Stage-1 consent ledger on another branch is not wired. Additive (new table and enum only).
**Clarity snapshots (migration `20261120110000_add_clarity_snapshots`, generated offline, NOT applied):** `clarity_snapshots` (model `ClaritySnapshot`; `num_of_days`, `dimension` default empty, `payload` Json, `fetched_at`; 2 indexes). Cache and the only source of analytics history beyond Clarity's 3-day window. Additive (one table).

**Internships (public listings):** `internships` (slug unique, Json outcome fields), `internship_applications` (`@@unique[userId,internshipId]`). **CMS/other:** `investor_categories` (slug unique), `investor_documents` (soft delete), `contacts` (idx isRead, createdAt).

## Key relationships
User 1—N almost everything (cascade). Courses 1—N lessons/assessments/enrollments/payment orders; Courses 1—1 placement_assessment. PaymentOrder → Courses? / Direct2HireEnrollment? / Coupon?. PartnerReferral → Partner, referred User, Direct2HireEnrollment?.

## Migrations
`backend/prisma/migrations/` holds only **3** migrations (plus 1 unapplied WhatsApp migration on `feature/whatsapp-webhook`) (+ `migration_lock.toml`, provider postgresql):
1. `20260727130000_add_counselling_booking_phone_number`
2. `20260729130000_add_job_placement_entries`
3. `20260901120000_make_course_recommendation_course_optional`
There is **no baseline/init migration** for the other ~50 tables → the DB was likely created via `prisma db push` or migrations were squashed/reset (UNVERIFIED). Consequence: `prisma migrate dev` on a fresh DB cannot rebuild the schema from these files alone. Treat as a gap before any schema work; ask the user how environments are provisioned.
Commands: `npm run db:migrate` (dev), `db:deploy` (prod), `db:generate`, `db:seed` (roles only), `db:studio`. Config: [backend/prisma.config.ts](backend/prisma.config.ts).
Data scripts (`backend/scripts/*.ts`): `sync-exist-{users,leads,enrollments,webinar-registrations}` (push to Google Sheets), `convert-time-to-ist`, `backfill-course-tiers` — operate on live data; don't run unasked.

## Demo bookings (migration `20261122100000_add_demo_bookings`: created, **NOT applied** anywhere)
`demo_bookings` (model `DemoBooking`): `id`, `name`, `email`, `phone` (as typed), `wa_phone` (digits with country code), optional `company` / `role` / `company_size` / `custom_requirements` / `message`, `interested_tools text[]`, `preferred_at` (UTC; entered in IST), `whatsapp_consent bool`, `request_key` **unique** (sha256 of wa_phone|email|preferred_at, so a repeated submit finds the same row), `status` (default REQUESTED), `created_at`; indexes on `created_at` and `preferred_at`. Additive: one new table, no change to existing ones. Written only by `POST /api/demo/book`.

## WhatsApp Template Manager & Automation (migration `20261121100000_add_whatsapp_automation` — created, **NOT applied** anywhere)
- `whatsapp_templates` (`WhatsappTemplate`): name+language unique, `status` text ("DRAFT" = local only; otherwise exactly what Meta reported), `draft` JSON (header/body/footer/buttons/examples), `rejected_reason`, `last_error`, `meta_template_id`.
- `automation_rules` (`AutomationRule`): trigger event, template name+language, `variable_mapping` JSON, `is_active` (default false).
- `automation_executions` (`AutomationExecution`, enum `AutomationExecutionStatus`): unique `idempotency_key` (rule+event), attempts/backoff (`next_attempt_at`), `expires_at`, `skip_reason`, `history` JSON, links to the `whatsapp_messages` row (`message_id`).
Apply with `npm run db:deploy` only against a verified database; `prisma validate` passes.
