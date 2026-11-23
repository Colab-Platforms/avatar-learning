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
**WhatsApp Inbox (migration `20261119180000_add_whatsapp_inbox`, generated offline, since APPLIED to production (2026-11-21, see PROGRESS.md); additive only):** status enum gains `SENDING` (appended: `ALTER TYPE ... ADD VALUE`); `whatsapp_messages` gains nullable `sent_by_user_id` and `client_request_id` (**unique**, the idempotency key; retries use `retry-of:<messageId>`); new `whatsapp_conversations` (`contact_wa_id` unique, `assigned_to_user_id`, `assigned_at`, team-wide `last_read_at`/`last_read_by_user_id`; created lazily) and append-only `whatsapp_conversation_events` (type ASSIGNED|UNASSIGNED|NOTE, author, assignee, body; idx [contact_wa_id, created_at]). No FKs to `users`. **Admin permissions (migration `20261119190000_add_business_admin_access`, generated offline, since APPLIED to production; additive only):** new `business_admin_access` (`user_id` unique, `role_key`, `modules text[]`, `created_by_user_id`, timestamps; no FK). Admin accounts reuse `users` + `user_role_mappings` (role ADMIN); passwords in `users.password` (bcrypt). Apply only with `prisma migrate deploy` after the read-only diff; never `migrate dev`/`db push` (the database has migrations that are not in this repo).
**WhatsApp contacts (migration `20261120100000_add_whatsapp_contacts`, generated offline, since APPLIED to production):** `whatsapp_contacts` (model `WhatsappContact`; unique `wa_id`; name, email, company, notes, tags, source; `opt_in_status` enum `WhatsappOptInStatus` UNKNOWN|GRANTED|WITHDRAWN with evidence text and timestamps). Interim opt-in register for Business Admin sends; the Stage-1 consent ledger on another branch is not wired. Additive (new table and enum only).
**Clarity snapshots (migration `20261120110000_add_clarity_snapshots`, generated offline, since APPLIED to production):** `clarity_snapshots` (model `ClaritySnapshot`; `num_of_days`, `dimension` default empty, `payload` Json, `fetched_at`; 2 indexes). Cache and the only source of analytics history beyond Clarity's 3-day window. Additive (one table).

**Internships (public listings):** `internships` (slug unique, Json outcome fields), `internship_applications` (`@@unique[userId,internshipId]`). **CMS/other:** `investor_categories` (slug unique), `investor_documents` (soft delete; categories are rows — migration `20261125100000_seed_investor_categories` is a data-only, idempotent seed adding Subsidiary Financial, MOA & AOA, Annual Return after the existing ones), `contacts` (idx isRead, createdAt).

## Key relationships
User 1—N almost everything (cascade). Courses 1—N lessons/assessments/enrollments/payment orders; Courses 1—1 placement_assessment. PaymentOrder → Courses? / Direct2HireEnrollment? / Coupon?. PartnerReferral → Partner, referred User, Direct2HireEnrollment?.

## Applying migrations: the exact procedure (verified on a local scratch database)
**Why they show as "pending":** they are new and were never applied to your database, so `_prisma_migrations` does not list them. That is expected. Pending now: `20260901120000`, `20261118130000`, the two adoption migrations `20261119120000` and `20261119150000`, `20261119180000`, `20261119190000`, `20261120100000`, `20261120110000`, `20261121100000` and `20261123100000`. All are additive (17 new tables, 10 enums, indexes, foreign keys, one `ADD COLUMN`, one relaxing `DROP NOT NULL`); none drops, deletes or rewrites data.

**There is NO baseline migration.** The oldest one (`20260727130000`) alters `counselling_bookings`, which no migration creates, so `migrate deploy` on an EMPTY database fails at the first migration (P3018, relation does not exist). Tested.

**A. You already have a developer database with the older tables and `_prisma_migrations` listing `20260727…` and `20260729…`:** from `backend/`, after confirming `DATABASE_URL` is YOUR database (never Neon or a shared one without the owner's approval):
```
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status    # expect: Database schema is up to date!
```
Tested: all ten apply cleanly in order and `migrate diff` against `schema.prisma` is empty (no drift).

**B. Fresh local database (no tables):** do not run `migrate deploy` (fails as above) and do not hand-edit history. Create the schema once with `npx prisma db push` (local only), then `npm run db:seed`. Because `db push` records no history, `migrate status` will list everything as pending on that database; that is expected and harmless for local work. Do not run `migrate deploy` on it afterwards (the tables already exist).

**C. A database built by `db push` that you want to track with migrations:** the schema already matches (verified: zero drift), so the history must be baselined with `npx prisma migrate resolve --applied <name>` for each folder in `prisma/migrations`. That edits migration history, so only do it deliberately, on a database you own, and only for local/dev.

**Never** run any of this against Neon, production or a shared database without explicit authorization from its owner. Use `npm run dev:local` / `.env.local-test` for a local database.

## Migrations
`backend/prisma/migrations/` holds only **3** migrations (plus 1 unapplied WhatsApp migration on `feature/whatsapp-webhook`) (+ `migration_lock.toml`, provider postgresql):
1. `20260727130000_add_counselling_booking_phone_number`
2. `20260729130000_add_job_placement_entries`
3. `20260901120000_make_course_recommendation_course_optional`
There is **no baseline/init migration** for the other ~50 tables → the DB was likely created via `prisma db push` or migrations were squashed/reset (UNVERIFIED). Consequence: `prisma migrate dev` on a fresh DB cannot rebuild the schema from these files alone. Treat as a gap before any schema work; ask the user how environments are provisioned.
Commands: `npm run db:migrate` (dev), `db:deploy` (prod), `db:generate`, `db:seed` (roles only), `db:studio`. Config: [backend/prisma.config.ts](backend/prisma.config.ts).
Data scripts (`backend/scripts/*.ts`): `sync-exist-{users,leads,enrollments,webinar-registrations}` (push to Google Sheets), `convert-time-to-ist`, `backfill-course-tiers` — operate on live data; don't run unasked.

## Admin permissions and audit log (migration `20261123100000_add_admin_permissions_and_audit_log`: created, **APPLIED to production** 2026-11-21)
`business_admin_access.permissions JSONB NULL` (per-module actions) and new table `business_admin_audit_logs` (`actor_user_id/email`, `action`, `target_user_id/email`, `details JSONB`, `created_at`; indexes on `created_at` and `(target_user_id, created_at)`). Additive only. Also needs a `BUSINESS_ADMIN` row in `roles` (data, created by `npm run db:seed`, not by the migration).

## WhatsApp Template Manager & Automation (migration `20261121100000_add_whatsapp_automation` — created, **APPLIED to production** 2026-11-21)
- `whatsapp_templates` (`WhatsappTemplate`): name+language unique, `status` text ("DRAFT" = local only; otherwise exactly what Meta reported), `draft` JSON (header/body/footer/buttons/examples), `rejected_reason`, `last_error`, `meta_template_id`.
- `automation_rules` (`AutomationRule`): trigger event, template name+language, `variable_mapping` JSON, `is_active` (default false).
- `automation_executions` (`AutomationExecution`, enum `AutomationExecutionStatus`): unique `idempotency_key` (rule+event), attempts/backoff (`next_attempt_at`), `expires_at`, `skip_reason`, `history` JSON, links to the `whatsapp_messages` row (`message_id`).
Apply with `npm run db:deploy` only against a verified database; `prisma validate` passes.

## Live User Monitoring (migration `20261124100000_add_live_monitoring`: created, additive only, **NOT applied to any shared/production database**)
Three new tables, nothing existing is altered. No foreign keys to `users`/`sessions` (plain `user_id` / `auth_session_id` strings) so audit rows survive account changes and the existing auth tables stay untouched.
- `monitoring_visitors` (`MonitoringVisitor`): one row per browser; unique random first-party `visitor_key`; nullable `user_id` (set the first time that browser signs in; earlier anonymous history is back-filled); first/last seen, first path, first referrer (host only), country (only from a CDN header), device/browser/os summary, `page_views`. Indexes: `user_id`, `last_seen_at`.
- `monitoring_sessions` (`MonitoringSession`): a period of activity; `started_at`, `last_activity_at` (heartbeat), `ended_at`, `end_reason` (LOGOUT | TIMEOUT | EXPIRED | TERMINATED), `current_path`, device summary, `auth_session_id` (= `sessions.id` while signed in, used to terminate). Online/offline is DERIVED (open + recent heartbeat), never stored. Indexes: `(ended_at,last_activity_at)`, `(user_id,started_at)`, `(visitor_id,started_at)`, `auth_session_id`, `started_at`.
- `monitoring_events` (`MonitoringEvent`): `category` ACTIVITY | AUTH, `type`, nullable user/visitor/session ids, path/module, device summary, AUTH-only `ip`/`outcome`/`reason`/`identifier` (the email typed on a failed sign-in, never a password), sanitized `metadata` JSON. Indexes: `(user_id,created_at)`, `(visitor_id,created_at)`, `(category,type,created_at)`, `session_id`, `created_at`.
Retention (deleted hourly in bounded batches by `monitoring.job.ts`): activity events, ended sessions and un-linked guest visitors after `MONITORING_RETENTION_DAYS` (180); AUTH/security events after `MONITORING_SECURITY_RETENTION_DAYS` (365). Rollback (sessions before visitors, because of the one foreign key): `DROP TABLE monitoring_events, monitoring_sessions, monitoring_visitors;` (nothing else references them).

## Email Automation (migration `20261121150000_add_email_automation` — created, **NOT applied** anywhere)
- `adoption_users` gains `marketing_email_opt_in` (default **false**; nothing in the UI sets it yet) and `email_unsubscribed_at`.
- `email_templates` (`EmailTemplate`; enums `EmailTemplateType` TRANSACTIONAL|PROMOTIONAL, `EmailTemplateStatus` ACTIVE|INACTIVE|ARCHIVED): subject, `html_body`, optional `text_body`.
- `email_automations` (`EmailAutomation`; enum `EmailTrigger`): trigger, template, `anchor_event`, `delay_minutes`, `scheduled_at` (UTC), `fired_at`/`expired_at`, `is_active` (default false).
- `email_messages` (`EmailMessage`; enum `EmailMessageStatus`): the queue, activity log and execution history in one table. Unique `dedupe_key` (automation+event+person, or manual template+person+time window) and unique `resend_id`; `scheduled_for` (UTC) doubles as the retry time; `attempts`, `retry_epoch` (Resend idempotency key = id + epoch), `locked_at`, `failure_reason`, `is_test`.
Apply with `npm run db:deploy` only against a verified database; `prisma validate` passes.

### Email Automation fixes (migration `20261121170000_email_automation_snapshots_and_events` — created, **NOT applied** anywhere; apply AFTER `20261121150000_add_email_automation`)
Generated with `prisma migrate diff` from the schema of the first migration; additive only (no DROP/UPDATE/DELETE).
- Enum `EmailMessageStatus` gains `UNCONFIRMED` (`ALTER TYPE ... ADD VALUE`).
- `email_messages` gains `body_html`, `body_text`, `list_unsubscribe` (the exact queued content, cleared once SENT), `content_hash` (SHA-256 checked before every send), `template_type` (type when queued; default TRANSACTIONAL), `maybe_accepted` (default false), `first_attempt_at`.
- New `email_webhook_events` (`EmailWebhookEvent`): unique `svix_id`, `resend_id` (indexed), `type`, `detail`, `occurred_at`, `received_at`, `applied_at`. A short-lived buffer for delivery events that arrive before the message is recorded as SENT; pruned by the worker.
Existing rows (none yet if migration 1 is still unapplied) would get the column defaults; a message queued before this migration has no snapshot and is cancelled as `NO_SNAPSHOT` rather than sent.
