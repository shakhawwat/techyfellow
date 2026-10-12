# Inquiry backend and private lead management

Step 15 implements submissions and `/admin/leads` list/detail screens only. No public form, email, booking, enrollment, accounts or deployment. Static public inquiry messages remain accurate: website forms/contact channels are not available yet. Field groups and workflow follow section 10 of the supplied Full Project Documentation.

## Public submission contract

`POST /api/v1/leads` accepts a flat JSON object. Send the existing exact allowlisted `Origin`, `Content-Type: application/json`, `X-CSRF-Protection: 1`, and a required `Idempotency-Key` of 16–128 ASCII letters/digits/underscores/hyphens. Generate a fresh random UUID/key per intentional inquiry and reuse it only for retries. CORS allows this header only for configured origins; sessions are not required for submission. Do not put contact information or keys in URL parameters.

Common required fields: `type`, `name` (1–120 characters), valid `email` (up to 254, trimmed/lowercased), and `consent: true` acknowledging inquiry handling. Optional `phone` (6–40 characters, digits and conventional phone punctuation), `organization` (up to 200), `marketingConsent` (boolean, default false), `website` (honeypot, must be absent/blank), and `source` (`website`, `solutions`, `research`, `academy`, `institutional`, `contact`; default website).

`consent` is independent of marketing opt-in. Neither value confirms services, enrollment, schedules or marketing delivery. No email integration exists. Do not preselect marketing opt-in in future forms.

| Type | Minimum additional field | Other accepted fields |
| --- | --- | --- |
| engineering | problem | projectType, budgetRange, timeline, description |
| research | domain | currentStage, expectedDeliverable, availableDataHardware |
| mentorship | requestedHelp | university, department, area, teamSize, stage |
| institutional | institution | participantCount, topics, date, deliveryMode, location |
| training | topics | institution, participantCount, date, deliveryMode, location |
| course-interest | course (lowercase course slug) | cohort, experienceLevel, contactPreference |
| contact | message | none |

Only the selected type's fields are accepted. Minimized mandatory fields collect enough context to triage; budgets, dates, organizations, phone numbers and academic information are otherwise optional. `problem`, `description`, `requestedHelp`, `message`, `availableDataHardware`, `expectedDeliverable` allow up to 4000 characters; `topics` 2000; other typed strings 200. Counts are integers 1–10000. Date is an actual YYYY-MM-DD calendar date. Requested `deliveryMode`: online/offline/hybrid/to-discuss. Contact preference: email/phone; phone preference requires a phone. Course/cohort/date values express the caller's interest, not verified availability or a scheduled offering.

Wire JSON is limited to 16 KiB, including whitespace (before parsing, with Express route-case handling). Unknown fields, nested payloads, public status/owner/notes/revision/timestamps/internal properties, invalid types and prohibited control characters are rejected. Nonempty honeypot returns sanitized 400, persists no lead and produces no fake success reference. Honeypot/field errors return safe field names only; values and driver details are never echoed.

Clearly synthetic request example (documentation only):

```json
{
  "type": "engineering",
  "name": "Synthetic person",
  "email": "synthetic@example.invalid",
  "problem": "Synthetic monitoring inquiry",
  "projectType": "iot",
  "timeline": "To discuss",
  "consent": true,
  "marketingConsent": false,
  "source": "solutions"
}
```

After an acknowledged majority write, 201 returns only `{data:{reference:"TF-<24 random uppercase hex characters>",status:"received"}}`. Reference is random, not derived from contact data or MongoDB IDs. `received` acknowledges the original submission; it does not expose its current internal workflow. No public GET/list/detail endpoint exists.

A unique indexed SHA-256 key digest and normalized-payload fingerprint are stored privately with the lead. Equivalent normalized retries return the original acknowledgment without another lead, including concurrent first submissions. The same key with a different normalized payload returns 409. Key digests/fingerprints are excluded from all DTOs and are never logged. Idempotency lasts for the retained lead's lifetime; no expiry removes its uniqueness. A failed/unconfirmed request must retain its key for a safe retry. Rate limits still apply to retries.

Persistent atomic counters: 30 parsed attempts per Express client IP and 5 valid submissions/retries per normalized email, per fixed 15-minute window. Invalid parsed inquiries consume the IP allowance. Counter keys are digests; TTL deletes expired windows. The next request returns 429/Retry-After: 900. Database failures fail closed with 503, without an acknowledgment. Digests are not a claim of anonymous data.

Existing `AUTH_TRUSTED_PROXY_IPS` remains narrow and defaults to trusting none. With that default, callers behind Nginx share the proxy IP allowance; forwarded headers do not bypass limits. Before public use, verify/pin immediate proxy IPs, ensure that proxy supplies/sanitizes forwarding headers, and configure only those literal addresses. No automatic subnet/hop/trust-all setting was added.

## Protected APIs and permissions

| Role | Leads read/manage/owner eligibility | Existing content/media grants |
| --- | --- | --- |
| SUPER_ADMIN | All / all / eligible when enabled | Unchanged |
| SALES_MANAGER | All / all / eligible when enabled | None |
| CONTENT_EDITOR, RESEARCH_EDITOR, ACADEMY_MANAGER, VIEWER | None / none / ineligible | Unchanged |

All routes require an enabled cookie session and centralized permissions. Anonymous requests return 401; forbidden roles 403. Every mutation also follows the existing CSRF/origin contract. Responses are no-store. No user-management UI or public contact-data read is introduced.

- `GET /api/v1/admin/leads`: defaults page=1, limit=20 (maximum 100), sort=-createdAt. Allowlisted filters: type, status, ownerId (24-hex ID or `unassigned`), exact reference. Sort: createdAt/-createdAt/updatedAt/-updatedAt, with ID tie-breaking. Unknown/repeated/structured filters are rejected. Lists return data plus pagination; private list DTOs include contact name/email but omit inquiry payload/notes/hashes.
- `GET /api/v1/admin/leads/owners`: lead-manage permission, page/limit only; paginated enabled SUPER_ADMIN/SALES_MANAGER IDs, email and role. Passwords/sessions are excluded. UI supports loading additional owner pages.
- `GET /api/v1/admin/leads/:id`: validated MongoDB ID; private detail DTO adds provided phone/organization/structured inquiry/consent/source and append-only notes. Missing lead returns 404.
- `PATCH /api/v1/admin/leads/:id`: accepts only positive `revision` plus `status`, `ownerId` (eligible enabled ID or null to unassign), and/or `note` (nonblank text, maximum 4000). Contact fields and prior notes are immutable through this endpoint. Maximum 1000 notes per lead. Reject protected/unknown fields with 400, invalid owner 400, missing record 404, stale revision/illegal transition/no-op/note-cap conflict 409.

Example update body (replace with an actual saved revision):

```json
{"revision":1,"status":"triaged","ownerId":null,"note":"Synthetic internal triage note"}
```

Workflow: received → triaged → contacted → qualified → proposal → won/lost/closed. Closing is allowed from any active status; lost from qualified/proposal. Won/lost/closed cannot reopen or change status. Authorized assignment and append-only notes remain available on terminal records. New inquiries always start received, unassigned, with no notes and revision 1.

Each successful admin update increments the revision and inserts its actor/action/resource/lead ID/revision/changed field names/timestamp audit in the **same bounded MongoDB transaction**, with majority commit. Audit records contain no contact values, note text or session data. Failed audits/transactions leave no partial lead change. Schema indexes disable automatic creation; run explicit `npm run db:indexes` before accepting submissions, after building with the intended database/configuration securely supplied. The command now includes leads, unique reference/key indexes, query indexes, TTL counters and unique lead/revision audits.

## Explicit sales-manager administration

From backend, with intended MongoDB/environment configuration securely supplied:

```sh
npm run build
npm run db:indexes
# Supply SALES_MANAGER_EMAIL and SALES_MANAGER_PASSWORD through a secure operator environment.
# Do not put credential values in command arguments, shell history, source or documentation.
npm run auth:create-sales-manager
```

This database-operator command creates a new enabled SALES_MANAGER using the existing Argon2id policy. It is never imported/called at startup. Password policy matches bootstrap (12–128 characters, maximum 1024 UTF-8 bytes). It normalizes email, checks/creates the unique index and refuses any existing normalized account, including an administrator; it does not overwrite or silently elevate anyone. Existing SUPER_ADMIN bootstrap remains unchanged. Operator database credentials authorize this explicit command; no new role-edit endpoint is exposed.

## Admin interface

Session verification precedes lead screens. Navigation/home cards show Leads only with its grants; SALES_MANAGER sees no content or media actions. Existing content-role visibility remains unchanged. Lists provide filtering, pagination, loading/empty/error/retry states. Details show escaped inquiry text and private notes, eligible owner selection and only valid workflow transitions. Save requires confirmation and an API-confirmed result. 409 preserves unsaved input, offers latest revision review, and requires explicit adoption or discard before retry. Transport errors retain input without a success message. Existing cookie/no-localStorage/CSRF behavior and fixed expired-session redirect are reused. Admin noindex/robots exclusion covers these routes.

## Verification commands

Actual checks use only project `techyfellow-step15-check`, loopback 12086, exact private replica-set DB `techyfellow_test_step15`, NODE_ENV=test and empty R2 configuration. A temporary ignored `docker-compose.step15.local.yml` selects production builds, overrides the isolated URI and allows only localhost:12086/8080 origins. Credentials are random synthetic test values, passed in private stdin JSON outside source. Helpers refuse different environments/databases; seed requires an empty DB, resumed tests and cleanup require its ownership marker.

```sh
# Backend: npm run lint; npm run typecheck; npm run build
node --test backend/test/lead-validation.test.mjs backend/test/auth-policy.test.mjs
# Frontend: npm run lint; npm run typecheck
# With the owned temporary test override described above:
docker compose -p techyfellow-step15-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step15.local.yml build frontend backend
docker compose -p techyfellow-step15-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step15.local.yml up -d --no-build --wait --wait-timeout 180
docker compose -p techyfellow-step15-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step15.local.yml exec -T backend mkdir -p test
docker compose -p techyfellow-step15-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step15.local.yml cp backend/test/leads.integration.test.mjs backend:/app/test/leads.integration.test.mjs
docker compose -p techyfellow-step15-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step15.local.yml cp backend/test/leads-cleanup.mjs backend:/app/test/leads-cleanup.mjs
docker compose -p techyfellow-step15-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step15.local.yml cp backend/test/leads-final.integration.mjs backend:/app/test/leads-final.integration.mjs
# Private JSON contains a random 32-hex runId and random test password (24+ characters).
docker compose -p techyfellow-step15-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step15.local.yml exec -T backend node test/leads.integration.test.mjs < /tmp/techyfellow-step15-fixtures.json
# Set TECHYFELLOW_PLAYWRIGHT_MODULE, TECHYFELLOW_UI_FIXTURES, TECHYFELLOW_UI_ARTIFACTS.
node frontend/test/leads-browser.mjs
docker compose -p techyfellow-step15-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step15.local.yml exec -T backend node test/leads-final.integration.mjs < /tmp/techyfellow-step15-fixtures.json
docker compose -p techyfellow-step15-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step15.local.yml exec -T backend node test/leads-cleanup.mjs cleanup < /tmp/techyfellow-step15-fixtures.json
docker compose -p techyfellow-step15-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step15.local.yml down
```

Use direct `node` for the integration file so its private stdin reaches the test process; `node --test` workers do not forward that input. For a failed runner, `TECHYFELLOW_LEAD_TEST_PHASE=permissions` resumes only the later owned API checks; `TECHYFELLOW_LEAD_UI_PHASE=layout` resumes later browser checks. Both require preserved matching fixtures. The guarded helper's `reset-login-throttles` action clears only owned synthetic login counters exhausted by runner retries. No production data or unrelated services are involved. Full accessibility/cross-browser audits and deployment remain unverified. See progress.md for actual outcomes.

Actual results: lint/typecheck/builds and unit cases passed. API checks passed for all seven types, unknown/internal/invalid inputs, separate consent, concurrent/retried idempotency, role restrictions, owners/status/notes, stale revisions, actual forced transaction rollback, rates/proxy handling and explicit manager creation/refusal. Chrome verified list/detail pagination/filter/empty states, real saves/conflict review, escaped notes, session/role behavior, keyboard/mobile widths and actual outage recovery. Final-image checks confirmed case/trailing-slash wire limits, preflight/health, concurrent 200/409 writes with one audit and private-safe acknowledgment after closure. Sampled owned frontend/backend/Nginx logs excluded synthetic contact values/messages/notes and private password. Owned data was dropped and verified empty; scoped containers/network and private inputs/override were removed, volumes retained. Screenshots at `/tmp/techyfellow-step15-browser/artifacts` were visually reviewed.

Runner corrections did not establish passing application checks: integration resumed after supplying the required media-scope query to its permission assertion; Chrome resumed after correcting native-option attachment and waits to exceed the existing 15-second API deadline. Passed earlier mutation checks were retained rather than repeated on changed fixtures. No production-readiness, full accessibility or cross-browser claim is made.
