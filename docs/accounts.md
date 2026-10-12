# Public account backend — Step 1

Backend only. No signup/login screens, payments, enrollment, social login, marketing consent or deployment. Existing administrator accounts and permission grants are preserved.

## Requests and safe responses

All mutations require the existing exact trusted `Origin`, `Content-Type: application/json` and `X-CSRF-Protection: 1`. Browser clients must include credentials. Authentication/account responses are `Cache-Control: no-store`; extra query parameters are rejected. Errors use the existing sanitized envelope, never submitted passwords, hashes, tokens or database details.

| Endpoint | Contract |
| --- | --- |
| `POST /api/v1/account/register` | Exactly `{name,email,password,passwordConfirmation}`. Returns 201 `{data:{user,verification:{status:"pending"\|"unavailable"}}}`. Does not sign in or replace a browser cookie. |
| `POST /api/v1/account/login` | Exactly `{email,password}`; MEMBER accounts only. Returns 200 `{data:{user}}` and a fresh session cookie. Invalid password, unknown/disabled account and an admin email all receive the same 401. |
| `POST /api/v1/account/logout` | Authenticated, JSON `{}`. Revokes this browser session and clears its cookie. Missing, expired, revoked or disabled sessions receive 401. |
| `GET /api/v1/account/me` | Authenticated. Returns 200 `{data:{user}}`. Rechecks enabled status each request. |
| `POST /api/v1/account/verify-email` | Exactly `{token}` with the same pre-authentication CSRF protections. Atomically consumes an unexpired code and verifies its enabled MEMBER. Returns `{data:{emailVerified:true}}`. Invalid, expired, consumed and disabled-account codes receive the same 400. |

`user` contains only `id`, `email`, `role`, `emailVerified` and `name` when supplied. Existing `/auth/*` response fields remain unchanged. Name is trimmed, 1–120 characters, without control characters. Email follows the existing validator and is trimmed/lowercased. Password is not normalized: 12–128 characters and at most 1024 UTF-8 bytes; confirmation must match exactly. The existing salted Argon2id implementation is reused (64 MiB, three iterations, parallelism one).

Registration explicitly inserts `role: MEMBER`, `enabled: true`, with no verified timestamp. It rejects every extra field, including role, permissions, enabled/verified status, password hash, ID and marketing consent. MEMBER grants are empty. No existing account is updated, including on normalized duplicate/admin email or concurrent insertion; duplicates return the generic 400 without disclosing the account's role or status. Database email uniqueness remains enforced by the existing unique index.

The existing atomic throttle budget is shared across admin/public login, registration and verification: 30 attempts per socket/trusted-proxy IP per fixed 15-minute window, and five per normalized email (verification uses a hashed-token identity). Malformed CSRF-valid requests consume the budget. Only configured literal proxy IPs are trusted. Audits contain action/outcome, timestamps and optional user ID, never credentials or raw bodies.

## Shared sessions and admin compatibility

**Public and admin sessions are shared**, using the existing session collection and cookie. The production cookie remains `__Host-techyfellow_session`, Secure, HttpOnly, SameSite=Lax, Path=/, no Domain; localhost/test uses `techyfellow_session` without Secure. Production requires actual HTTPS.

Successful login rotates the browser's previous token and revokes that previous session, including an admin session replaced by public login. Registration alone never changes an admin session. Either `/auth/logout` or `/account/logout` revokes the current shared session: logging out through the public endpoint also logs out an administrator in that browser. Other browsers' independent sessions remain unaffected. `/account/me` can return the safe identity for a valid existing admin session, but public login accepts only MEMBER. Admin login rejects MEMBER; existing admin roles and their grants are unchanged. MEMBER sessions cannot access any existing permission-protected administration route.

Only cookie headers carry raw session tokens; storage uses SHA-256 digests. Absolute expiry is the existing `AUTH_SESSION_TTL_SECONDS` (default eight hours); authorization checks expiry itself rather than relying on eventual TTL deletion. Disabling an account immediately invalidates authorization for its existing sessions.

## Email verification and blockers

The separate `account_verifications` collection stores only token digests, user references, one-hour expiry and consumption timestamp. Consumption and verified-account update are transactional, including concurrent use. The separate `account_verification_jobs` queue is processed alongside inquiries by the existing email worker; inquiry jobs/templates/recipient behavior remain unchanged.

Verification needs these **backend/worker-only** settings:

- `ACCOUNT_VERIFICATION_KEY`: securely supplied 32-byte key encoded as 64 lowercase hexadecimal characters, identical for API and worker. It encrypts queued codes using AES-256-GCM with fresh nonces. Never put a real key in source or frontend configuration. Keep it stable until existing queued codes expire; changing it makes those jobs unusable.
- `EMAIL_FROM`: valid approved sender. Key and sender are required to queue a usable verification job.
- `RESEND_API_KEY` and `EMAIL_ENABLED=true`: required for actual delivery through the existing provider. Account verification does not require lead-notification recipients or admin links.

When key/sender are missing, registration still creates an **unverified** account and reports `verification.status: "unavailable"`; no token/job is fabricated. With key/sender but delivery disabled, jobs remain pending and unverified. The local stack deliberately has delivery disabled and missing sender/provider/key settings: actual email verification is blocked until operators supply approved configuration. Tests use synthetic settings and an injected fake provider only; no live emails are sent.

Raw codes never enter API responses, audit records or logs. A recoverable queue copy is encrypted and excluded from normal model reads; successful/terminal processing removes it. Verification removes any remaining queue copy. Jobs use atomic leases, fenced writes, stable provider idempotency keys, five bounded attempts, retry backoff and the token's expiry. Expired/disabled/already-verified work is not delivered. The email contains a single-use code, with no fabricated frontend verification URL; a frontend verification screen and resend/recovery flow are future work. Missing-config accounts remain unverified until a later recovery flow is implemented.

`AccountService.requireVerifiedMember(userId)` rejects unverified/non-MEMBER/disabled accounts. Future sensitive transaction handlers must invoke it in their authorization path and maintain the check within their transaction policy; Step 1 introduces no such transactions. Existing admin authorization does not require verification and is unchanged.

## Indexes and isolated verification

Automatic collection/index creation remains disabled. Before enabling account traffic on an intended database, run the existing explicit `npm run db:indexes` command from backend. It adds account verification/job unique, due and TTL indexes without dropping data or existing indexes. MongoDB must support transactions (the existing local replica set does).

From the project root:

```sh
npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend run build
cd backend
node --test test/account-policy.test.mjs test/auth-policy.test.mjs test/configuration-health.test.mjs test/public-query.test.mjs
cd ..
docker compose -p techyfellow-account-check -f backend/test/account-compose.yml up -d --build --wait --wait-timeout 180
docker compose -p techyfellow-account-check -f backend/test/account-compose.yml exec -T backend npm run test:account
docker compose -p techyfellow-account-check -f backend/test/account-compose.yml exec -T backend-admin-check node --test test/auth.integration.test.mjs
docker compose -p techyfellow-account-check -f backend/test/account-compose.yml exec -T backend-admin-check node --test test/auth-production.integration.test.mjs
docker compose -p techyfellow-account-check -f backend/test/account-compose.yml down
```

The fixture has no published ports or persistent volumes; its MongoDB uses temporary memory-backed storage. Account tests require exactly NODE_ENV=test, EMAIL_ENABLED=false and `mongodb://mongodb:27017/techyfellow_test_account_step1?replicaSet=rs0`; they refuse a nonempty database before writing and remove only their owned synthetic database afterward. The unchanged admin suites use their own empty synthetic databases in the same private test stack. Provider tests never use the network. The production-mode suite verifies cookie attributes and origin/proxy rules on private HTTP transport, not real browser TLS or inbox delivery.
