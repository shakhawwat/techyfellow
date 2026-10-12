# Backend admin authentication

Step 7 originally provided backend admin authentication only. Public registration is now implemented separately in [public account Step 1](accounts.md); no default accounts, reset flow or deployment are introduced. Step 8 adds [protected content APIs](admin-content-api.md). Public content and health routes remain anonymous. Unannotated backend routes deny access by default; future protected handlers must explicitly declare `@Authenticated()` or `@RequirePermissions(...)`.

## Configuration

The backend reads process environment, not real `.env` files automatically. Existing `PORT`, `NODE_ENV` and `MONGODB_URI` remain required as previously documented.

- `AUTH_ALLOWED_ORIGINS`: comma-separated **exact** frontend origins. Development defaults to `http://localhost:3000,http://localhost:8080`; production requires an explicit nonempty HTTPS list. Include the actual same-origin Nginx website origin. No wildcards, credentials, paths, trailing slash, `null`, or arbitrary HTTP hosts. Credentialed CORS echoes only an explicitly allowed origin and accepts Content-Type/X-CSRF-Protection headers plus Idempotency-Key for inquiries. Deployment must supply this variable through production Compose's environment interpolation.
- `AUTH_SESSION_TTL_SECONDS`: absolute session lifetime, default 28800 (8 hours), valid 900–86400. No sliding refresh. Database TTL deletion is eventual; the guard checks expiry independently on every request.
- `AUTH_TRUSTED_PROXY_IPS`: optional comma-separated **literal IPs** of verified reverse proxies, empty by default. No trust-all flag, subnet, hop count or automatic forwarded-header trust. With the empty default, throttling uses the socket IP; clients behind Nginx share an IP budget. To enable per-client limits, pin/verify the immediate proxy IP(s), ensure the last trusted proxy writes/sanitizes forwarded headers, and configure only those IPs. Do not add entire Docker/private subnets. Origin checks and Secure cookies do not depend on forwarded headers.

Same-origin Nginx `/api/` routing is unchanged. Separate-origin development requires browser requests with `credentials: 'include'`. Cookies use SameSite=Lax: keep frontend/API on the same site (including localhost's different ports). Cross-site frontend/API hosting is not supported by these cookie settings.

Production cookie: `__Host-techyfellow_session`, Secure, HttpOnly, SameSite=Lax, Path=/, no Domain. Local development/test cookie: `techyfellow_session`, HttpOnly, SameSite=Lax, Path=/, without Secure, allowing localhost HTTP. Production authentication requires HTTPS; existing local HTTP Nginx configuration is unsuitable for public authentication until TLS is configured. Authentication/admin responses use Cache-Control: no-store.

## Endpoints and CSRF contract

- `POST /api/v1/auth/login`: JSON body with exactly `email` and `password`. Email is trimmed/lowercased; password is not normalized. Success 200 `{data:{user:{id,email,role}}}` plus the HttpOnly session cookie. Incorrect password, unknown email and disabled user return the same generic 401. Malformed input returns sanitized 400.
- `GET /api/v1/auth/me`: valid enabled session required; 200 `{data:{user:{id,email,role}}}`.
- `POST /api/v1/auth/logout`: valid enabled session required; send JSON `{}`. Revokes the current session, clears its cookie and returns 200 `{data:{loggedOut:true}}`. Missing/revoked/expired sessions return 401.
- `GET /api/v1/admin/access`: valid session plus `admin:access` required; returns `{data:{user:{id,email,role},permissions:[...]}}`. Anonymous 401; VIEWER 403. Does not implement content/user administration.

**Every mutation, including login and logout, requires all three**: an exact allowlisted `Origin`, `Content-Type: application/json`, and `X-CSRF-Protection: 1`. The custom header is deliberately not a secret: a malicious site cannot send it with browser credentials unless the server grants its CORS preflight. Rejecting simple content types and requiring an exact Origin also protects pre-authentication login. Requests with absent/empty/null/unconfigured Origin fail 403; authenticated reads with an unconfigured Origin also fail 403. Command-line clients must explicitly follow the same mutation contract. No CSRF value or session token is put in a URL.

Only session cookies carry raw session tokens; JSON never returns them. Sessions store only SHA-256 token digests, user reference, absolute expiry, revocation and timestamps. Login creates a fresh cryptographically random 256-bit opaque token and revokes any valid-format previous browser token; it never adopts a supplied token. Other independent sessions are bounded but remain valid. Logout revokes its own session. Every protected request reloads enabled/role, so disabling an account or removing role permissions immediately affects existing sessions. Database failures fail closed with sanitized 503.

## Permissions

Permissions are centralized in `src/auth/permissions.ts`; unknown roles/permissions and empty/missing permission declarations never grant access, even to SUPER_ADMIN. Read, edit and publish are distinct actions.

| Role | Explicit grants |
| --- | --- |
| SUPER_ADMIN | admin:access, users:admin; read/edit/publish for all five R1 resources; leads read/manage |
| CONTENT_EDITOR | admin:access; projects/team read and edit |
| RESEARCH_EDITOR | admin:access; research/publications read and edit |
| ACADEMY_MANAGER | admin:access; courses read and edit |
| VIEWER | projects/research/publications/team/courses read only |
| SALES_MANAGER | admin:access; leads read/manage only; no content/media grants |

Publishing is reserved to SUPER_ADMIN pending an explicit broader publishing policy. VIEWER reads apply only to handlers explicitly requiring those internal read permissions; no general admin permission is granted. Step 7 added only the access probe; Step 8 now implements the explicitly protected internal content handlers, including VIEWER reads.

## Passwords, throttle and audit

Passwords are salted Argon2id (64 MiB, 3 iterations, parallelism 1) using pinned `argon2`. Missing users perform a dummy password verification. Passwords are limited to 128 characters/1024 UTF-8 bytes; bootstrap requires at least 12 characters. Password hashes are excluded by default from model reads and never appear in API responses.

Persistent, atomic database counters allow 5 attempts per normalized email and 30 per client IP in a fixed 15-minute window, including successful and malformed CSRF-valid attempts. The next attempt returns sanitized 429 with Retry-After: 900. Identity keys are SHA-256 digests; counters expire through TTL indexes and survive API restarts. Windows can allow another budget across a boundary; this is throttling rather than permanent account lockout.

`auth_audits` records login outcomes (success, invalid credentials, invalid request, throttled, CSRF rejection) and successful logout with timestamps and optional user ID. No password, token, password hash, raw body, email or IP is recorded. Audit persistence failures fail closed. Audit retention/export is an operator concern; no audit API is exposed. Request/parser/database errors are sanitized and do not log raw credentials or connection details.

## Explicit indexes and bootstrap

From `backend/`, with intended database/configuration already securely supplied:

```sh
npm ci
npm run build
npm run db:indexes
npm run auth:bootstrap
```

Before bootstrap, supply `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` through a trusted secret manager or hidden interactive environment input. Do not put credentials in command arguments, shell history, committed source/templates or documentation. Unset these two variables afterward. They are not loaded automatically, used at runtime, or passed to Compose application startup.

`db:indexes` now explicitly creates content **and** user/session/throttle/audit indexes, including unique normalized email/session digest and TTL indexes. It is repeatable and never drops indexes. Run it before serving authentication. Startup auto-indexing stays disabled. Bootstrap explicitly ensures the unique user index, inserts one enabled SUPER_ADMIN, and refuses existing normalized users (including concurrent insertion), missing/invalid credentials and privilege elevation. It never updates an existing record or runs automatically. No real administrator has been bootstrapped by these implementation checks.

## Isolated verification

Policy/config/cookie tests, from `backend/` after build:

```sh
node --test test/auth-policy.test.mjs test/configuration-health.test.mjs test/public-query.test.mjs
```

For database tests, create an untracked `docker-compose.step7.local.yml` in the project root:

```yaml
services:
  backend:
    environment:
      NODE_ENV: test
      MONGODB_URI: mongodb://mongodb:27017/techyfellow_test_step7?replicaSet=rs0
      AUTH_ALLOWED_ORIGINS: http://localhost:3000,http://localhost:8080
      AUTH_TRUSTED_PROXY_IPS: ""
```

Use a new, verification-only Compose project; never reuse production/database services:

```sh
docker compose -p techyfellow-step7-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step7.local.yml config --quiet
docker compose -p techyfellow-step7-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step7.local.yml up -d --build --wait --wait-timeout 180 backend mongodb mongodb-init
docker compose -p techyfellow-step7-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step7.local.yml exec -T backend npm run test:auth
docker compose -p techyfellow-step7-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step7.local.yml down
```

Additional production-image verification uses `test/auth-production.integration.test.mjs`. While the isolated development test backend is running, add a temporary service named `backend-production-check` to the local override with build context `./backend`, target `production`, and environment `NODE_ENV=production`, `PORT=4000`, `MONGODB_URI=mongodb://mongodb:27017/techyfellow_test_step7_production?replicaSet=rs0`, `AUTH_ALLOWED_ORIGINS=https://frontend-host.example`, and `AUTH_TRUSTED_PROXY_IPS=""`. Keep it private, on the same isolated Compose network, with no published ports. Start it with the same Compose flags and `up -d --build backend-production-check`; after readiness, use `exec -T backend node --test test/auth-production.integration.test.mjs`. The private HTTP transport checks cookie attributes; it does not verify real public TLS or browser HTTPS behavior. This test also refuses a nonempty database and removes only its separate synthetic database.

The test refuses any other URI/environment or a nonempty database before writing, uses synthetic users and random fixture passwords, runs the real explicit index/bootstrap commands, and drops only the database it verified empty and owns. Shutdown preserves persistent volumes. Remove the temporary override afterward. Actual results are recorded in `docs/progress.md`.

Implementation references: [node-argon2](https://github.com/ranisalt/node-argon2), [NestJS authorization](https://docs.nestjs.com/security/authorization), [OWASP API CSRF defenses](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [Express proxy trust](https://expressjs.com/en/guide/behind-proxies/).

Step 10 retains these Origin/custom-header/session controls. The protected media upload handler alone uses multipart instead of JSON, with bounded file/text fields and scoped edit authorization. Other mutations remain JSON-only; see [media API](media.md).

Step 15 adds [typed inquiries, private lead permissions and explicit sales-manager creation](leads.md). Existing session, proxy trust and content grants remain unchanged.

## Public accounts — Step 1

[Public account backend](accounts.md) now adds registration/login/logout/me and email-code verification under `/api/v1/account`. It shares existing cookie sessions and normalized-email uniqueness, adds MEMBER with zero grants, and preserves all existing admin grants and `/auth` response fields. Public login accepts only MEMBER; admin login retains its existing role set. Public/admin logout revoke the same browser session. Existing administrator accounts are not automatically marked email-verified and are not subjected to the future MEMBER transaction-verification gate.
