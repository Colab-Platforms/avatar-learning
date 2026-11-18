# API_DOCUMENTATION.md

REST API, all under **`/api`** (mounted in [backend/src/routes.ts](backend/src/routes.ts)). Verified from route files **[code]**; nothing was called at runtime. For per-endpoint body fields, open the module's `*.validators.ts` (Joi) — only auth bodies are summarised here.

## Conventions
- **Response envelope:** `{ "status": boolean, "data": any, "message": string }` via `sendResponse` ([responseUtils.ts](backend/src/utils/responseUtils.ts)).
- **Errors:** thrown `ApiError(message, code)` → [errorHandler.ts](backend/src/middlewares/errorHandler.ts) → `{status:false, data:<error object>, message, }` with `err.statusCode` (default 500). Unknown routes → `notFoundHandler`. Rate limit → 429 with envelope. CORS rejection → generic error (500) logged as "Origin not allowed by CORS".
- **Status codes used:** 200, 201, 202, 204, 400, 401, 403, 404, 405, 409, 422, 429, 500 ([statusCodes.ts](backend/src/utils/statusCodes.ts)). 401 = missing/invalid/expired token; 403 = role insufficient or profile incomplete ("Please complete your profile…") or inactive account.
- **Auth:** `Authorization: Bearer <accessToken>`. Legend below: **Pub** public · **U** `auth("USER")` (+ `requireCompleteProfile` = **U+P**) · **A** `auth("ADMIN")` (ADMIN or SUPERADMIN) · **SA** SUPERADMIN. Higher roles pass lower checks.
- `express.json` keeps `req.rawBody` for webhook signatures; all input passes xss sanitize middleware.
- Param name quirks: course routes accept `:courseId` as id; D2H gates resolve a course from `courseId` in query/body/params (id or slug).

## Auth — `/api/auth` (Pub unless noted)
| Method | Path | Notes |
|---|---|---|
| POST | `/register` | `{firstName,lastName,email,password(min 8, upper+lower+digit),phoneNo,state,country,city,referralCode?}` → sends OTP email |
| POST | `/verify-otp` | `{email, otp(6 digits), type: REGISTER|LOGIN}` → `{user,accessToken,refreshToken}` |
| POST | `/verify-phone` | `{email, accessToken}` MSG91 widget token |
| GET | `/msg91-config` | widget id/token config for client |
| POST | `/resend-otp` | `{email,type}` (cooldown check in service) |
| POST | `/login` | `{email,password}` → tokens, or `{requiresVerification:true}` if email+phone unverified. Returns 404 if email unknown (user-enumeration, see PROGRESS) |
| POST | `/google` | `{idToken, referralCode?}` |
| POST | `/complete-profile` | U/A/SA; `{firstName,lastName,phoneNo,state?,country?,city?,dateOfBirth?}` |
| POST | `/refresh` | `{refreshToken}` → `{accessToken,refreshToken}` (rotates) |
| POST | `/logout` | `{refreshToken}` |
| POST | `/logout-all` | U/A/SA |
| POST | `/forgot-password` `/reset-password` | `{email}` / `{token,password}` |

## Users — `/api/users`
`GET /` (A) list · `GET /me` (U, allowed with incomplete profile) · `POST /me/quiz/complete` · `GET /me/resume/sign` · `POST /me/resume/complete` · `DELETE /me/resume` · `PATCH|DELETE /profile/image` (multipart via multer) — all U+P · `GET|PUT|DELETE /:id` (U/A/SA + P) · `POST /` (**Pub — `createUser`, creates a USER account without OTP**; see PROGRESS) · `PATCH /:id/role` (SA).

## Courses — `/api/courses`
Pub: `GET /`, `GET /hero`, `GET /:slug` (must stay last).
U+P: `GET /me/enrollments`, `GET /resources/:resourceId/download|playback`, `POST|DELETE /:courseId/enroll`, `GET /:courseId/enrollment|learn|certificate`, `POST /topics/:topicId/watch`.
Assessments (U+P): `GET /:courseId/assessments`, `GET|…/:courseId/assessments/:assessmentId` (`GET`, `…/attempts` GET/POST), legacy `/:courseId/assessment[/attempts]`, `GET /assessments/attempts/:attemptId`, `PUT /assessments/attempts/:attemptId/answers/:questionId`, `POST …/violations`, `POST …/submit`, `GET …/result`.
Placement assessment (U+P): `GET /:courseId/placement-assessment`, `GET|POST /:courseId/placement-assessment/attempts`, `GET|PUT|POST /placement-assessments/attempts/:attemptId[/answers/:questionId|/violations|/submit|/result]`.

## Admin — `/api/admin/*` (all **A**; each admin module calls `router.use(auth("ADMIN"))`)
- Course module: `categories` (GET/POST); `courses` (GET/POST, `/images/sign`, `/:id` GET/PUT/DELETE, `/:id/publish` PATCH); `lessons`, `topics` CRUD; `courses/:courseId/assessment(s)`, `assessments/:id[/publish|/questions|/attempts]`, `questions/:id`, `attempts/:id` (GET/DELETE=reset); placement equivalents (`placement-assessments`, `placement-questions`, `placement-attempts`); video `POST topics/:topicId/video/init|complete`; files `GET topics/files/sign`, `POST topics/:topicId/files`; `DELETE resources/:resourceId`.
- Internships: `internships` CRUD + `/:id/publish`, `/:id/applications`, `PATCH applications/:applicationId/status`.
- Users/others: `contacts` (+`/unread-count`, `PATCH /:id/read`, DELETE), `coupons` CRUD + `/:id/redemptions`, `investors/categories` & `investors/documents` CRUD (+`documents/upload/sign`), `partners` (list, `/:id`, `PATCH /:id/approve|reject`), `partners/claims` (+`PATCH /:claimId/mark-paid`), `dashboard/overview`, `webinar/registrations[/:id]`, `webinar/schedules` CRUD + `PATCH /:id/publish|live|unlive`.
- Direct2Hire admin (`/api/admin/direct2hire…`): intro-video (GET, POST `init`/`complete`, DELETE); list enrollments; assessment-counselling purchases; `PATCH /:enrollmentId/mark-paid|mark-refunded`; basic-enrollments (+`/:userId`); `students` (+`/:userId`); `students/:userId/payment-link` (POST), `booking/confirm`, `counselling/complete`, `counselling/feedback` (GET/PUT), `placement/summary|attempts|overrides|grant-attempts`, `mock-interview` (GET, PATCH `schedule|complete|feedback|cancel`), `job-placement`; internship tasks `course/:courseId/internship-tasks` (GET/POST), `internship-tasks/:taskId` (PUT/DELETE), `internship-submissions/:submissionId/review` (PATCH), `upload/sign`.
- Note: `/api/admin/...` routers from many modules share one prefix; Express runs each `router.use(auth("ADMIN"))` for any `/api/admin/*` request that reaches that router, so an unauthenticated call returns 401 from the first admin router.

## Internships — `/api/internships`
Pub `GET /`, `GET /:slug` (last). U+P: `GET /me/applications`, `POST|DELETE /:internshipId/apply`, `GET /:internshipId/application`.

## Payments — `/api/payment`
`POST /webhook` (Razorpay, signature) · `POST /webhook/cashfree` · `GET /config` (Pub; provider/public key id) · `POST /create-order`, `POST /verify` (U+P; supports coupon) · `POST /abandoned-checkout` (U). Coupons: `POST /api/coupons/apply` (U).

## Direct2Hire (student) — `/api/direct2hire` (router-wide `auth("USER")` + `requireCompleteProfile`)
`GET /status|pricing|me|referral-discount`; `POST /create-order`; `POST /assessment-counselling/create-order`; `POST /dev/continue-as-paid` (**only when `NODE_ENV !== "production"`**).
Sub-routers: `/intro-video` (GET, `/playback`, POST `/complete`) · `/lead` (GET, POST upsert) — *these two are U-only*.
Gate `requireAssessmentCounsellingAccess`: `/counselling` (GET/POST/PUT profile, `/booking` GET/POST, `/feedback` GET), `/recommendation` (GET, Groq), `/course-selection` (GET).
Gate `requireDirect2HireAccess` (full paid): `/internship` (`/upload/sign`, `/tasks`, `/tasks/:taskId`, POST `/tasks/:taskId/submit`), `/mock-interview` (GET, POST `/request`), `/job-placement` (GET, POST, PUT/DELETE `/:entryId`).

## Webinar — `/api/webinar` (Pub)
`GET /live-schedule` · `POST /create-order` · `POST /verify-payment` · `GET /registration/:id/status` · `POST /recovery/request-otp` and `/recovery/verify-otp` (each limited 5 / 15 min).

## Partners — `/api/partners` (U+P)
`GET /kyc/upload/sign` · `POST /apply` · `GET /me` · `GET /me/referrals` · `POST /me/claim`.

## Other public
`GET /api/health` · `GET /api/investors` (categories+documents) · `POST /api/contact` · `POST /api/chatbot` + `DELETE /api/chatbot/:sessionId` (limited 10 / 15 min; chat history is in-memory per process) · `GET /api/chatbot/health`.

## External APIs called by the backend
Razorpay & Cashfree (orders, verification, payment links), Resend (email), Bunny Stream (video create/upload/playback signing), Cloudinary (signed uploads), Groq (chat + recommendation JSON), Google OAuth tokeninfo, MSG91 (token verify), Google Sheets API, Pabbly webhook URLs. Names of env vars: see [ARCHITECTURE.md](ARCHITECTURE.md).

## Gaps / UNVERIFIED
Exact request/response bodies for non-auth endpoints; pagination parameters (uses `pagination-helper`/`DEFAULT_PAGE_SIZE` — not inspected); no OpenAPI spec; sample requests exist only in `backend/test/*.http`.
