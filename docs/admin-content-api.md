# Protected content management APIs

Step 8 adds backend APIs only for projects, research, publications, team and courses. No UI, uploads, delete endpoints or deployment. The repeated/trailing-slash detail/action paths in the step specification are implemented as `/:id` and `/:id/{action}`; public details continue to use slugs.

All endpoints require an enabled session and explicit resource permissions. Browser clients include credentials. POST/PATCH require an exact configured Origin, JSON and `X-CSRF-Protection: 1`, following [authentication](authentication.md). Credentialed CORS now permits PATCH. Responses are non-cacheable and contain explicit DTOs; no MongoDB internals, session secrets or raw driver errors are returned.

## Routes

For each `{resource}` in `projects`, `research`, `publications`, `team`, `courses`:

| Method/path under /api/v1 | Permission | Behavior |
| --- | --- | --- |
| GET /admin/{resource} | resource:read | List all editorial states, with validated filters |
| GET /admin/{resource}/:id | resource:read | Inspect draft/published/archived content |
| POST /admin/{resource} | resource:edit | Create draft, revision 1; 201 |
| PATCH /admin/{resource}/:id | resource:edit | Edit draft; published edits additionally require resource:publish |
| POST /admin/{resource}/:id/publish | resource:publish | Publish valid draft; optional scheduled publishedAt |
| POST /admin/{resource}/:id/unpublish | resource:publish | Published → draft; clear publishedAt |
| POST /admin/{resource}/:id/archive | resource:edit | Draft/published → archived; published additionally requires resource:publish |

Other successful operations return 200. There is no hard delete or restoration. Archived records are inspectable but immutable and continue to reserve their unique slug. Publishing an already published record, unpublishing a non-published record or mutating archived content returns 409.

**Published-edit approach:** editing the published record in place requires both edit and publish permission, even when publishedAt is still in the future. The entire resulting record must satisfy publication validation. No separate draft copy is created. Editors must have a publisher unpublish content before they can edit it. Archive also requires publish permission when it changes public visibility.

## Role matrix

Each cell lists resource actions, not unrestricted admin access.

| Role | Projects | Research | Publications | Team | Courses |
| --- | --- | --- | --- | --- | --- |
| SUPER_ADMIN | read/edit/publish | read/edit/publish | read/edit/publish | read/edit/publish | read/edit/publish |
| CONTENT_EDITOR | read/edit | — | — | read/edit | — |
| RESEARCH_EDITOR | — | read/edit | read/edit | — | — |
| ACADEMY_MANAGER | — | — | — | — | read/edit |
| VIEWER | read | read | read | read | read |

VIEWER can inspect these explicitly permitted internal reads, including drafts, but still cannot use the general `/admin/access` probe or mutate content. Existing user-administration permissions remain unchanged; no user administration API is added here.

## Requests and revisions

Examples below are **synthetic documentation examples, not seeded company content**. Send the mutation headers above and the existing HttpOnly session cookie; no credentials or session tokens are included in examples.

Create an incomplete draft:

```http
POST /api/v1/admin/projects
Content-Type: application/json
X-CSRF-Protection: 1
Origin: http://localhost:8080
```

```json
{"slug":"synthetic-documentation-example","title":"Synthetic example only"}
```

Supply required publication content using the returned id and revision:

```http
PATCH /api/v1/admin/projects/:id
```

```json
{
  "revision": 1,
  "summary": "Synthetic example, not company content",
  "category": "Synthetic category",
  "problem": "Synthetic problem",
  "approach": "Synthetic approach",
  "technologies": [],
  "results": [],
  "media": []
}
```

Publish the updated draft:

```http
POST /api/v1/admin/projects/:id/publish
```

```json
{"revision":2}
```

Publish optionally accepts `publishedAt` as a real ISO UTC timestamp (`YYYY-MM-DDTHH:mm:ssZ` or with exactly three fractional digits). Omission uses server time. Future-dated published content remains hidden publicly until that time. Other actions accept exactly `{"revision":<current number>}`. Unpublish/archive and PATCH increment revision once; stale preconditions return 409. Read the latest DTO before resolving/retrying a conflict. Concurrent requests against one revision allow a single successful change/audit.

PATCH accepts `revision` solely as a precondition, never as a value to store. Status, publishedAt, id/_id, __v, timestamps, audit actor and other unknown/protected fields are rejected. Empty patches are rejected. Optional fields can be removed with JSON null; identity fields cannot be removed and publication-required fields cannot be removed from a published record. Arrays replace the whole array; dotted/operator updates and unknown nested fields are rejected. Values must have their actual JSON types; strings/numbers/booleans are not coerced.

New records start at revision 1. Existing records missing revision are read as revision 1, and the first successful mutation conditionally writes revision 2. No startup migration or production data modification occurs. Pre-existing records cannot acquire invented creation audits; subsequent changes are audited normally.

## Fields and publication validation

Create always requires a valid unique lowercase hyphenated slug and title (name for team). Drafts can omit the remaining publication fields. Every publish and published edit validates the entire candidate:

| Resource | Additional publication-required fields |
| --- | --- |
| All | nonempty summary and server-controlled publishedAt |
| Projects | category, problem, approach |
| Research | domain, researchStage (defaults to planned; independent of editorial status) |
| Publications | nonempty authors, venue, integer year 1–9999 |
| Team | biography |
| Courses | level, deliveryMode, positive duration value/unit |

Editable fields and enum values follow [content schemas](content-api.md): category/problem/approach/technologies/results/media; domain/methods/researchStage/contributors; authors/venue/year/doi/publisherUrl; biography/expertise/profileLinks; level/prerequisites/syllabus/deliveryMode/duration; common slug/title-or-name/summary/SEO. Array defaults remain empty; author names cannot be empty. Profile-link approval flags are available in authorized admin DTOs, while public DTOs include only approved safe links. All supplied URLs require HTTPS without embedded credentials.

Bounds: slug/name 160 characters, title/venue 200, summary 2000, category/domain 100, long text 10000, array length 100, general string-array items 500; nested field bounds mirror schemas, URL 2048, duration value at most 1000000. Unknown fields at any depth fail 400. Existing public DTOs and published/status/time filtering are unchanged.

## Lists and responses

`GET /api/v1/admin/projects?page=1&limit=20&status=draft&sort=-updatedAt&category=Synthetic%20category`

Page >=1; limit defaults to 20 and is at most 100. Allowed filters: exact status (`draft|published|archived`), slug and the resource-specific filters documented for public APIs. No implicit public status/time predicate is applied to admin reads. Supported sorts: slug, createdAt, updatedAt, publishedAt, revision, title (name for team), and year for publications. Prefix one field with `-` for descending; default `-updatedAt`, with stable slug tie-breaker. Unknown/repeated/operator-shaped parameters fail 400. Only list handlers permit these query parameters; details/mutations reject query strings.

Details/mutations return `{data:{id,slug,titleOrName,status,revision,createdAt,updatedAt,publishedAt?,...allowedContentFields}}`; the actual title/name key follows the resource. Lists return `{data:[...],pagination:{page,limit,total,totalPages}}`. Incomplete drafts omit missing optional fields. Internal/nested MongoDB metadata is explicitly excluded.

Errors use `{error:{code,message,fields?}}`: 400 invalid id/body/query or publication requirements (safe field paths where available), 401 missing/expired/revoked/disabled session, 403 insufficient permissions/CSRF, 404 missing content, 409 unique-slug/stale-revision/invalid-transition conflict. Database/transaction/audit-write failures return sanitized 503 with no partial transaction commit. Unknown routes retain safe 404s. For anonymous mutations, valid CSRF headers are needed to reach the authentication check; invalid CSRF returns 403 first.

## Transactions, audits and explicit indexes

Each mutation writes its content change and a `content_audits` record in the **same session/transaction**, using snapshot reads, majority writes, primary preference, a 5-second transaction timeout and bounded database operations. Audit records contain actor ID, action, resource, content ID, resulting revision and server timestamp, with no credentials or request bodies. They are append-only through these APIs; no audit write/read endpoint is exposed. Transaction retries re-read state and revision before committing.

Run `npm run build` and `npm run db:indexes` from backend/ with the intended database configuration securely supplied. This explicit command now includes content audit uniqueness `(resource,contentId,revision)`, actor/time indexes and admin list indexes in addition to existing slug/public/auth indexes. No auto-indexing, automatic migration or index deletion. MongoDB must support transactions (replica set or supported sharded deployment); unsupported/unavailable databases fail closed, with no non-transactional fallback.

## Isolated checks

After build, `node --test test/admin-content-validation.test.mjs` checks validation/permissions/DTO projection. For integration, create an untracked project-root `docker-compose.step8.local.yml`:

```yaml
services:
  backend:
    environment:
      NODE_ENV: test
      MONGODB_URI: mongodb://mongodb:27017/techyfellow_test_step8?replicaSet=rs0
      AUTH_ALLOWED_ORIGINS: http://localhost:3000,http://localhost:8080
      AUTH_TRUSTED_PROXY_IPS: ""
```

```sh
docker compose -p techyfellow-step8-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step8.local.yml up -d --build --wait --wait-timeout 180 backend mongodb mongodb-init
docker compose -p techyfellow-step8-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step8.local.yml exec -T backend npm run test:admin-content
docker compose -p techyfellow-step8-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step8.local.yml down
```

The test refuses any other environment/URI or a nonempty database, creates only clearly synthetic fixtures/random credentials, and cleans its owned database. It tests real concurrent writes and temporarily rejects audit inserts through a validator on the isolated audit collection to verify rollback after content writes. The validator is restored in finally. Never run against production. Shutdown preserves persistent volumes; remove the temporary override afterward. Actual results are in progress.md.

References: [Mongoose transactions](https://mongoosejs.com/docs/transactions.html), [MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/).
