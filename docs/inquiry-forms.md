# Public inquiry forms — Step 16

`/build-with-us` uses engineering inquiries. `/contact` selects engineering, research, mentorship, institutional, training, course-interest or contact. Shared React Hook Form 7.85.0 and Zod 4.5.4 validation mirrors the existing [lead contract](leads.md); backend validation remains authoritative. Both dependencies are pinned in npm's generated lockfile. No backend application or Compose configuration changed.

Only the allowlisted, single `type` query parameter is read. Names, emails, phone numbers, course identifiers and references are never prefilled from query parameters or added to URLs. Research/publication CTAs select research; capstone selects mentorship; solutions/startup select engineering; institutional selects institutional; Academy offers course interest, mentorship and training. Course detail forms receive their published slug directly from server-rendered content, not a query. Contact offers up to 100 published courses from the existing bounded 60-second public cache; courses outside that initial selection remain accessible through their own detail form. No courses are fabricated if the API is unavailable or empty.

Browser submission uses the existing build-time `NEXT_PUBLIC_API_BASE_URL` (`/api/v1` for Nginx, localhost backend for independent development). The configured frontend origin must appear in backend `AUTH_ALLOWED_ORIGINS`. Requests use JSON, `X-CSRF-Protection: 1`, a cryptographic `Idempotency-Key`, omitted session cookies, no request caching, no redirects and no referrer. No additional environment settings or secrets are required. Public forms need JavaScript and HTTPS or localhost for secure key generation.

The mounted form keeps a key for each normalized submitted payload in memory. Simultaneous clicks are suppressed; unchanged retries, including after an unconfirmed network response, reuse the same key. Corrections create a different key; restoring an earlier payload restores its key. Do not reload/leave an unconfirmed form before retrying: memory and entered values are not persisted across navigation. A 409 keeps values and offers an explicit **Start a separate inquiry** action; this clears that payload's key without automatically submitting it. A 429 observes the bounded Retry-After interval while preserving editable values. A request has a 15-second deadline. Only a strict HTTP 201 acknowledgment with `TF-` plus 24 uppercase hexadecimal characters and `received` counts as success.

Acknowledgment is required and optional marketing consent is independently unchecked. Type changes unregister inactive fields. The backend's `website` honeypot is hidden from display, keyboard and the accessibility tree; a filled honeypot receives no fake receipt. Validation/API errors use a focusable summary and labeled fields; status is announced, receipt heading receives focus, and a fresh inquiry clears contact values and consent. No form values, credentials or references enter browser storage, analytics or application logs. Forms have noindex metadata and no-referrer metadata; receipt state has no addressable route or metadata. Public course pages remain indexable, but receipts exist only in client memory after POST.

Verified direct company contact details have not been supplied. No email notification, booking, enrollment, payment or availability confirmation is implemented. No deployment was performed.

## Verification

Commands from the project root:

```sh
npm run lint --prefix frontend
npm run typecheck --prefix frontend
node --test frontend/test/inquiry.test.mjs
docker build -t techyfellow-step16-check-frontend:latest frontend
```

Production Docker build (`npm ci`, then `npm run build`) passed. The initial sandboxed host build failed while Next.js parsed TypeScript `--showConfig`; container builds verified the actual final production bundle. Focused unit tests passed for all seven validation contracts, safe type prefill, duplicate clicks, changed/restored payload keys, malformed acknowledgments, explicit conflict restart and bounded throttling. Unit transport simulation alone does not prove persistence.

Real verification used loopback `http://localhost:12087`, Compose project `techyfellow-step16-check`, existing verified Step 15 backend image, and exact isolated replica-set database `techyfellow_test_step16`. Temporary ignored `docker-compose.step16.local.yml` selected production application targets, removed development source mounts, configured `NODE_ENV=test`, the exact synthetic database URI and allowed origins, and replaced Nginx's port binding. MongoDB had no host port.

```sh
docker compose -p techyfellow-step16-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step16.local.yml config --quiet
docker compose -p techyfellow-step16-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step16.local.yml up -d --no-build
# Helper refuses any non-test database or existing seed data. Private JSON comes from a mode-600 temporary file.
docker exec techyfellow-step16-check-backend-1 mkdir -p /app/test
docker cp backend/test/inquiry-fixtures.mjs techyfellow-step16-check-backend-1:/app/test/inquiry-fixtures.mjs
docker exec -i techyfellow-step16-check-backend-1 node test/inquiry-fixtures.mjs seed < /tmp/techyfellow-step16-fixtures.json
TECHYFELLOW_PLAYWRIGHT_MODULE=/tmp/techyfellow-step5-browser/node_modules/playwright/index.mjs TECHYFELLOW_UI_FIXTURES=/tmp/techyfellow-step16-fixtures.json node frontend/test/inquiry-browser.mjs
TECHYFELLOW_PLAYWRIGHT_MODULE=/tmp/techyfellow-step5-browser/node_modules/playwright/index.mjs TECHYFELLOW_UI_FIXTURES=/tmp/techyfellow-step16-fixtures.json node frontend/test/inquiry-failures-browser.mjs
TECHYFELLOW_PLAYWRIGHT_MODULE=/tmp/techyfellow-step5-browser/node_modules/playwright/index.mjs node frontend/test/inquiry-layout-browser.mjs
```

Private fixture contains a random 32-hex-character runId and random password of at least 24 characters; never store or print it in the repository. Seed creates explicit indexes, a synthetic SALES_MANAGER and a clearly synthetic published course. All form submissions were synthetic. The first browser run verified seven types/admin visibility; the runner was resumed with `TECHYFELLOW_INQUIRY_RELIABILITY_ONLY=1` after fixing a test timing assumption about scheduled focus. Failure checks were resumed with `TECHYFELLOW_INQUIRY_OUTAGE_ONLY=1` after increasing their wait beyond the 15-second request deadline. These switches avoid repeating passed persistence/quota checks.

Actual checks cover admin list/detail visibility; invalid client input without POST; real server field rejection; double-click and a deliberately lost response *after genuine persistence*, followed by an unchanged retry with one saved lead; genuine 409 and intentional separate inquiry; actual 429 and recovery; actual owned-backend stop/recovery; retained values/no false receipt; type-specific CTA selection; direct published course preselection; keyboard submission/focus; 320/390/768/1440px overflow; mobile menu Escape/focus; reduced-motion focus; no session cookie/browser storage; desktop/mobile screenshots reviewed. API requests were never replaced with a mocked success. Browser transport fault injection was used for lost/conflicting responses. The rate-limit recovery test advanced browser time and reset only owned test counters; it did not change production limits.

Cleanup is guarded by the exact test URI, NODE_ENV and matching ownership marker:

```sh
docker exec -i techyfellow-step16-check-backend-1 node test/inquiry-fixtures.mjs cleanup < /tmp/techyfellow-step16-fixtures.json
docker compose -p techyfellow-step16-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step16.local.yml down
```

Guarded cleanup passed: exact synthetic database was dropped and verified empty, scoped container listing was empty afterward, and the persistent volume was retained. The private fixture and temporary override were removed; unrelated services were untouched. Sampled owned frontend/backend/Nginx logs excluded synthetic contact values/context and the private password. Real R2, deployment, email and comprehensive cross-browser/accessibility audits are NOT RUN. No usable Git metadata exists in this workspace, so the generated lockfile cannot be committed here.

Library API references: [React Hook Form 7.85.0 types](https://github.com/react-hook-form/react-hook-form/blob/v7.85.0/src/types/form.ts), [Zod schema API](https://zod.dev/api).
