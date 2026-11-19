# WhatsApp Cloud API webhook — setup guide

Receives Meta (WhatsApp Cloud API) events in the existing Express backend:

- **Messages** sent to the business number by customers.
- **Status updates** (`sent`, `delivered`, `read`, `failed`) for messages the business sent.

Code: [backend/src/modules/whatsapp/](backend/src/modules/whatsapp/) · Tests: [backend/test/whatsapp/](backend/test/whatsapp/) · Table: `whatsapp_messages` ([DATABASE.md](DATABASE.md)).

> **Status:** implemented and tested locally with mocked requests. It has **not** been deployed, and no live Meta request has been made. Do the steps below to go live.

## Callback URL

```
https://avatar-learning.onrender.com/api/whatsapp/webhook
```

This URL becomes live only after this branch is deployed to Render **and** the migration is applied (steps below). Until then Meta's "Verify and save" will fail. It is the same path locally: `http://localhost:5000/api/whatsapp/webhook`.

| Method | Purpose | Auth |
|---|---|---|
| `GET /api/whatsapp/webhook` | Meta verification handshake (`hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`) | verify token |
| `POST /api/whatsapp/webhook` | Event delivery | `X-Hub-Signature-256` HMAC of the raw body |

## Environment variables (Render → backend service → Environment)

| Variable | Required | Notes |
|---|---|---|
| `WHATSAPP_ENABLED` | yes | `true` to turn the webhook on. Anything else → webhook answers `503`. |
| `WHATSAPP_APP_SECRET` | yes | Meta App Secret. Used **only** to verify signatures. |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | yes | A random string you invent (e.g. `openssl rand -hex 24`). Avoid `<`, `>`, `&`, quotes. |
| `WHATSAPP_PHONE_NUMBER_ID` | recommended | If set, events for any other number ID are ignored. |
| `WHATSAPP_ACCESS_TOKEN` | for sending | Permanent system-user token. Not used by the webhook; used by `WhatsappClient` (nothing calls it yet). |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | for later | WABA ID. Reserved for template/subscription calls. |
| `WHATSAPP_GRAPH_API_VERSION` | optional | Default `v23.0`. |

Never put these in the frontend, in `NEXT_PUBLIC_*` variables, in git, or in logs. Placeholders live in [backend/.env.example](backend/.env.example).

## One-time setup

### 1. Database migration — check first, apply only if pending

The migration `backend/prisma/migrations/20261118130000_add_whatsapp_messages/migration.sql` is additive (2 enums + the `whatsapp_messages` table + 4 indexes; no existing table is touched).

**Read-only check** (changes nothing) — run against the database you are about to deploy to, using the *direct* (non-`-pooler`) Neon host:

```bash
cd backend
# exit 0 + "empty migration" => the database already matches schema.prisma (nothing to apply)
DATABASE_URL="<direct url>" npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --exit-code
```

- Output is only the WhatsApp objects (and/or the `20260901…` `DROP NOT NULL`) → read the SQL, then apply with `migrate deploy` below.
- Output contains `DROP`/`ALTER … DROP COLUMN`/anything else → **stop**: the database has drifted from this branch (see "Migration history warnings"); do not apply.

**Apply (only the pending forward migrations):**

```bash
DATABASE_URL="<direct url>" npx prisma migrate deploy
```

Never use `prisma migrate dev`, `prisma migrate reset` or `prisma db push` against a shared/Neon database (reasons below).

**Migration history warnings (verified read-only on the dev Neon database, 2026-11-18):**
- `_prisma_migrations` there also lists `20260819120000_add_direct2hire_plans` (exists only on branch `origin/d2h-pricing`) and `20260828120000_rename_direct2hire_only_flag` (on no branch). Those files are not in this branch, so `migrate dev` would report divergence and offer to **reset (wipe) the database**. `migrate deploy` tolerates it.
- `20260729130000_add_job_placement_entries` looks "modified" on Windows only because Git checks it out with CRLF line endings (checksum differs from the LF version that was applied). Harmless for `migrate deploy`; another reason never to run `migrate dev`.
- The repo has no baseline migration for the original tables. A database created before `_prisma_migrations` existed makes `migrate deploy` fail with `P3005`. Check the target database first: `SELECT migration_name FROM _prisma_migrations ORDER BY started_at;` (read-only).
- Prefer a Neon **branch** of the target database for a rehearsal: Neon console → Branches → create child → run the commands above against the child → discard it.
- Use the direct host for migrations. The `-pooler` host (PgBouncer) can stall Prisma's advisory lock. The running app may keep the pooled URL.

### 2. Set the Render environment variables

Add the variables above, with `WHATSAPP_ENABLED=true` last. Deploy this branch (merge → deploy is your decision). Render restarts the service.

### 3. Check the endpoint is up (before touching Meta)

```bash
curl -i "https://avatar-learning.onrender.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=<YOUR_VERIFY_TOKEN>&hub.challenge=12345"
# expect: HTTP 200, body: 12345
curl -i "https://avatar-learning.onrender.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345"
# expect: HTTP 403
```

`503` = `WHATSAPP_ENABLED` not `true` or a required variable is missing (the Render logs name the missing variable, never its value). `404` from Express = the new code isn't deployed yet.

### 4. Configure the webhook in Meta

1. [developers.facebook.com](https://developers.facebook.com) → your app → **WhatsApp → Configuration**.
2. **Webhook → Edit**:
   - **Callback URL:** `https://avatar-learning.onrender.com/api/whatsapp/webhook`
   - **Verify token:** the exact value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Click **Verify and save**.
3. **Webhook fields → Manage** → subscribe to **`messages`** (covers incoming messages and delivery/read/failed statuses).
4. Copy the **App Secret** (App settings → Basic → Show) into `WHATSAPP_APP_SECRET`. Without it every POST is refused with `503`.
5. Make sure the app is subscribed to the WhatsApp Business Account (Meta does this automatically when you add the number; otherwise `POST /{WABA_ID}/subscribed_apps`).

### 5. Test from Meta

- In **API Setup**, use the Meta test number or send a message to your business number from a phone. A row should appear in `whatsapp_messages` (`direction = INBOUND`).
- If you use the "Test" button on the `messages` field, a `401` in the logs (`invalid signature`) means `WHATSAPP_APP_SECRET` does not match the Meta app that is sending; check it is the secret of the same app.
- Render logs show one line per delivery: `[WhatsApp] Webhook processed: inbound created=1 duplicate=0; status applied=0 …`.

## Deploying to a *development* Render service

Use a separate Render service and a separate Meta app/test number. Do **not** reuse the production service URL (`avatar-learning.onrender.com`) and do **not** point the production Meta app's webhook at a dev URL: a Meta app has one callback URL, and changing it diverts real customer traffic.

1. **Render** → New → Web Service → repo `Colab-Platforms/avatar-learning`, branch `dev-vishwa` (or `feature/whatsapp-webhook` for a first test), **Root Directory `backend`**. Copy Build/Start commands from the existing production service if you can see them; otherwise Build `npm install --include=dev && npm run build`, Start `npm start`. Health check path `/api/health`. Turn auto-deploy off.
2. **Environment** (names only here; values from your secret manager):
   - Required by the app at start-up (it throws if missing): `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `SMTP_FROM_EMAIL`, `SUPPORT_EMAIL`, `WHATSAPP_COMMUNITY_LINK`, `WEBINAR_WHATSAPP_GROUP_LINK`, plus `FRONTEND_URL`, `DIRECT2HIRE_PRICE_RUPEES`, `DIRECT2HIRE_ASSESSMENT_PRICE_RUPEES`, `COURSE_BASIC_PRICE_RUPEES`, `CLOUDINARY_*`, `BUNNY_*`, `GROQ_API_KEY`, `GROQ_MODEL` (copy the dev set from `backend/.env.example`).
   - **`NODE_ENV=production`.** Any other value enables the dev-only route `POST /api/direct2hire/dev/continue-as-paid` (any logged-in user can mark themselves paid) on a public URL.
   - **Leave unset:** `PABBLY_SIGNUP_WEBHOOK_URL`, `PABBLY_D2H_PURCHASE_WEBHOOK_URL`, `PABBLY_BASIC_COURSE_PURCHASE_WEBHOOK_URL` (these send real WhatsApp messages through Pabbly on signup/purchase), `GOOGLE_SHEET_*` (writes to the real sheet).
   - **Use test credentials:** `RAZORPAY_KEY_ID`/`SECRET` must be `rzp_test_…`; the dev database may hold real customers' emails/phones, and `RESEND_API_KEY` sends real email.
   - WhatsApp: `WHATSAPP_ENABLED=true`, `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` of the **test** number; `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_BUSINESS_ACCOUNT_ID` optional (nothing sends yet).
3. Callback URL for dev = `https://<your-dev-service>.onrender.com/api/whatsapp/webhook`. Run the two `curl` checks (step 3 above), then configure the Meta *development* app (step 4).
4. The service runs the session-cleanup and partner-commission jobs on boot against `DATABASE_URL`; make sure that is the dev database.

No code path sends WhatsApp messages: `WhatsappClient` is not imported by any route, controller, job or service (verified by search), and the webhook only reads Meta's requests and writes `whatsapp_messages`.

## Behaviour reference

| Situation | Response |
|---|---|
| Integration disabled / missing `WHATSAPP_APP_SECRET` or verify token | `503` |
| GET with wrong token | `403`; missing/invalid params → `400` |
| POST missing or invalid signature | `401`, nothing stored |
| POST not valid JSON / not a JSON object | `400` |
| POST signed but `object` ≠ `whatsapp_business_account` | `404` |
| Event for another `phone_number_id` (when configured) | `200`, ignored |
| Valid event | `200 {"status":true,"data":{…counts},"message":"EVENT_RECEIVED"}` |
| Database failure while saving | `500` — Meta retries, and retries are safe |

**Duplicates / ordering.** Meta retries and may reorder events.
- Messages are keyed by the Meta message id (`wa_message_id`, unique): a replay is counted as `duplicate`, never stored twice, even for parallel deliveries.
- Statuses move forward only (`SENT` → `DELIVERED` → `READ`); replays and late older events change nothing except filling a missing timestamp. `failed` after `delivered/read` is ignored; a late `sent` never undoes `failed`.

**Stored data.** Inbound: sender number, profile name, message type, text (text/button/interactive replies), the original message object. Statuses: timestamps and Meta error code/title/details. Phone numbers and message text are personal data: they are stored but never logged. Limit database access accordingly and set a retention policy if required.

**Security notes.**
- Signature = HMAC-SHA256 of the **raw** body with the App Secret, compared in constant time; the verified bytes are what get parsed.
- The endpoint is public by necessity (no JWT); it is not covered by the app's CORS rules because Meta's servers send no `Origin`.
- The existing sanitize middleware rewrites `req.body`/`req.query`; the webhook deliberately reads the raw body and raw URL so message text and tokens are never altered.
- Rotate the verify token / app secret in Render, then update the Meta form (verify token) — rotating the App Secret in Meta takes effect immediately for signatures.

## Running the tests

```bash
cd backend
npm test                 # node:test via tsx, no database or network, no new dependencies
npm run type-check:test  # type-checks src + tests
```

Meta is never contacted: webhook calls go to an in-process Express server and the Graph API client is tested with an injected mock `fetch`.

## Not implemented (by design)

- Replying to customers or sending templates (the `WhatsappClient` exists but nothing calls it).
- Linking messages to `users` by phone number.
- Admin UI/API to browse messages.
