# Public-content image media

Step 10 adds backend-controlled R2 storage, protected media APIs and `/admin/media`. Only the existing project `media` array supports image integration, so project gallery selection is added. No cover/profile schema fields, uploads for documents/video, permanent deletion, or public website pages are introduced.

## Configuration and delivery

Backend-only settings: `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `MEDIA_PUBLIC_BASE_URL`. Supply real values only through secure process environment or an untracked deployment environment file. Compose forwards these runtime settings to the backend, never the frontend or build arguments. Templates contain empty placeholders. Endpoint is an exact approved Cloudflare account HTTPS S3 endpoint, optionally with the bucket's jurisdiction suffix; region is `auto`. Use bucket-scoped Object Read & Write test credentials for provider verification. No default credential chain, browser credentials, presigned upload or local-storage fallback is used.

All five storage settings must be present to enable upload. Missing settings keep the rest of the application running and produce HTTP 503 from upload; the media list exposes only `uploadAvailable: false` and safe limits. Malformed provided endpoints/public origins or limits fail startup without printing values. SDK/driver exceptions never enter client responses or logs.

Limits: `MEDIA_MAX_BYTES=5242880` (5 MiB, maximum configurable 20 MiB), `MEDIA_MAX_DIMENSION=8192` (maximum 16384), `MEDIA_MAX_PIXELS=40000000` (maximum 100000000). Nginx permits a bounded 21 MiB body only on the exact upload route; Multer enforces the configured file limit, one file/two bounded text fields. Other API body limits remain unchanged. Decoding is bounded by a five-second Sharp processing timeout and pixel limits. Storage commands have fifteen-second abort deadlines and bounded retries.

Configure an approved public HTTPS R2 custom domain as `MEDIA_PUBLIC_BASE_URL`, with no path, query or credentials. Images in this bucket are public-content assets even while unlinked or used by a draft. Do not use this bucket for private files. Configure bucket/custom-domain delivery in Cloudflare separately; this step does not provision it. Keep endpoint/bucket namespace stable for existing records and reconciliation.

Set frontend `NEXT_PUBLIC_MEDIA_HOST` to that exact hostname, without scheme, port, path or wildcard. It is public build-time configuration, also passed as a Compose frontend build argument. Rebuild frontend after changing it. Next Image allows only HTTPS, that hostname, default port, `/techyfellow/media/**` and no query. Empty host permits no remote previews. Client checks the same host plus randomized key format; failed image delivery displays an explicit error. No arbitrary remote-host permissions are granted.

Dependency pins: backend `@aws-sdk/client-s3@3.1146.0` and `sharp@0.35.5`, with generated npm lockfile. Frontend dependencies are unchanged. Implementation follows [Cloudflare's AWS SDK v3 R2 example](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/) and [Sharp's constructor/security options](https://sharp.pixelplumbing.com/api-constructor/).

## API and permissions

All routes require existing cookie sessions. GET supports configured-origin handling; mutations require exact allowlisted Origin and `X-CSRF-Protection: 1`. Only `POST /api/v1/admin/media/upload` accepts multipart rather than JSON; the exception is handler metadata, not a global relaxation. Login/logout and other mutations retain JSON-only CSRF rules.

| Endpoint | Input | Required permission |
| --- | --- | --- |
| GET `/api/v1/admin/media` | required resource, page/limit, status, sort | `{resource}:read` |
| GET `/api/v1/admin/media/:id` | 24-hex ID | stored resource's read permission |
| POST `/api/v1/admin/media/upload` | multipart `file`, `resource`, `altText` | any existing edit grant at guard, plus specified resource edit |
| PATCH `/api/v1/admin/media/:id` | JSON `revision`, `altText` only | any edit grant at guard, plus stored resource edit |

SUPER_ADMIN can use all scopes; existing editors/managers use only their assigned content scopes. VIEWER has scoped read access and cannot upload/edit. Unknown query/body fields and malformed IDs are rejected. Resource scope, storage key, filename, MIME, dimensions, uploader, size and status cannot be changed through PATCH. Only ready media allows metadata edits. Stale revision/state returns 409.

List defaults: page 1, limit 20/max 100, status ready, sort `-createdAt`; allowed statuses ready/uploading/failed, other sort `filename`. Lists return `data`, `pagination`, and safe upload settings. Details/mutations return `data`. DTOs expose ID, normalized filename, inferred MIME, stored size/dimensions, alt text, scope, uploader ID, status, revision and timestamps. Only ready records can have a delivery URL. Storage keys and private R2 configuration are excluded.

Example request bodies (synthetic IDs/descriptions only):

```json
{"revision":2,"altText":"Synthetic cyan rectangle used for isolated verification"}
```

A project image reference uses the existing contract:

```json
{"media":[{"reference":"000000000000000000000001","type":"image","altText":"Meaningful description in this project's context"}],"revision":3}
```

The example ID is a placeholder, not a valid persisted asset. Create/edit/publish validates every reference against an existing ready image scoped to projects. SVG/documents/video, arbitrary filenames/URLs, missing or unready IDs, and insufficient alt text are rejected. Publication status/revision permissions remain Step 8's policy. New references use media IDs, not storage keys. Contextual project alt text is independent of library alt metadata, so metadata editing does not silently alter published content.

Existing schema enum fields remain for storage compatibility; new project writes/publishing accept only validated ready image references. Previously stored unsupported/unresolved references are not delivered as images by public DTO enrichment and require explicit correction before edit/publish. Unpublish/archive still work. Public status/date filtering is unchanged; ready project references add safe URL, dimensions and MIME, excluding internal fields. No automatic content migration or company seeding occurs.

## Validation, auditing and recovery

Magic bytes plus Sharp format inspection accept only JPEG/PNG/WebP. Full decode/re-encode validates pixels, rejects corrupt/truncated or multi-frame content, strips metadata/trailing bytes, and normalizes the safe basename/extension. Supplied MIME and filename extension do not determine acceptance. Input and normalized output both respect the byte limit. Dimensions/pixel counts are checked before and after rotation/encoding. Alt text requires 3–500 trimmed characters with letters/numbers and no control characters; editors must supply an appropriate description of meaningful content.

Random 128-bit object keys use `techyfellow/media/<random>.<jpg|png|webp>`. The initial uploading record and upload-start audit commit together before storage. Only successful PUT permits a transaction committing ready state and upload-ready audit. Metadata/revision and actor audit also commit atomically. Media audits record actor, action, resource, media ID, revision and timestamp, without credentials/session data. Indexes are created only through the existing explicit `npm run db:indexes`; production auto-indexing stays disabled.

On failure, a transaction first claims uploading → failed with an audit. Only after confirming non-ready state does cleanup delete that failed key. If database outcome is ambiguous or unavailable, cleanup retains the record/key and never deletes a potentially ready asset. If cleanup fails, `cleanupPending` remains recorded. No ready → failed transition or ready-asset deletion API exists.

From backend/, with stable intended storage/database environment securely supplied:

```sh
npm run build
npm run db:indexes
npm run media:reconcile
```

Reconciliation is explicit, never startup automation. Each run checks up to 100 non-ready records older than fifteen minutes, conditionally marks stale uploading records failed with an audit, and retries failed-key cleanup. It also revisits failed keys previously cleaned, covering late completion after an aborted/ambiguous PUT. Ready assets are excluded and preserved. Failed records/audits remain as reconciliation evidence. Repeat periodically until handled; investigate database/R2 availability rather than deleting records manually. The command emits counts/safe failures only. Monitor sustained failures and use the same bucket namespace; no background scheduler is introduced.

## Frontend behavior

The library shows upload transport progress separately from server validation/storage confirmation, limits, retryable errors, ready/pending/failed views, pagination and metadata revision review. It does not use local object URLs as persisted previews. Missing configuration disables the upload button explicitly. Failed requests retain inputs; an uncertain upload advises reviewing the library before retry. Metadata 409 retains description and offers review of the actual latest revision. Project forms select only ready project images, store contextual alt text and remove references without deleting assets. VIEWER controls remain read-only; backend authorization is authoritative.

## Verification

`node --test test/media-validation.test.mjs` uses real image decoding and explicitly simulated SDK transport checks. `test/media.integration.test.mjs` requires NODE_ENV=test, the exact `mongodb://mongodb:27017/techyfellow_test_step10?replicaSet=rs0`, an empty database, and private JSON stdin with random 32-hex runId and five synthetic role users (`synthetic-step10-<role>@example.invalid`, random passwords). It creates ownership/indexes, checks the real unconfigured backend, then starts a private localhost test Nest app whose storage boundary is explicitly simulated. MongoDB/HTTP/audit failures are real; R2 connectivity is not proved. It leaves synthetic data briefly for browser checks, or drops its owned DB on failure.

The optional `frontend/test/media-browser.mjs` targets only loopback `http://localhost:12081`, using externally supplied Playwright/Chrome and private fixture/artifact environment paths as in Step 9. Synthetic ready records come from the test boundary; the actual application storage remains unconfigured and displays no successful remote preview. `backend/test/media-cleanup.mjs` accepts the same JSON stdin, verifies the exact database/ownership runId and drops only that test database. Remove private fixtures and temporary override afterward; use project-scoped down without deleting volumes/unrelated services.

Provider upload, authenticated object retrieval, public delivery and real cleanup require configured isolated R2 test credentials/domain and are **NOT RUN** here. Simulated tests do not prove R2 connectivity. Actual commands/results and cleanup are in [progress](progress.md).
