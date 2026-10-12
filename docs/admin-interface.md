# Admin interface

Step 9 adds `/admin/login`, a protected `/admin` workspace, and list/new/edit routes for projects, research, publications, team and courses. It reuses Step 5 tokens/components, Geist and Lucide. No application content or metrics are seeded.

## Configuration

Use existing `npm ci` installations; no dependencies changed. Start development using [deployment commands](deployment.md), then visit `http://localhost:8080/admin/login`. Provision accounts with the explicit [bootstrap procedure](authentication.md). There are no default credentials. If port 8080 is occupied, use a free loopback port in an untracked override.

For independent host processes, start the configured backend on 4000, then from frontend:

```sh
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1 npm run dev
```

`NEXT_PUBLIC_API_BASE_URL` defaults to `/api/v1` for same-origin Nginx. It is public and compiled at build time, forwarded as a Compose Docker build argument for frontend builds/development. Rebuild after changing it; production runtime changes do not rewrite browser assets. Never include secrets. Absolute URLs require `/api/v1`, no credentials/query/fragment, and HTTPS in production; HTTP localhost absolute URLs are allowed in development only.

Fetch includes cookie credentials. JSON mutations send `X-CSRF-Protection: 1`; the browser supplies Origin. Configure exact frontend scheme/host/port in backend `AUTH_ALLOWED_ORIGINS`; credentialed CORS preflights use existing allowlists. See authentication docs for HttpOnly/Secure production cookies, localhost settings and narrow proxy trust. Prefer same-origin HTTPS in production; no deployment/TLS work is included here.

## Access and workflow

Protected children mount only after `/auth/me` and `/admin/access` verify access. The backend deliberately excludes VIEWER from the access probe, so a verified VIEWER uses its documented five read-only grants. Every content request still requires authoritative backend authorization. Visibility restoration rechecks access. A 401 hides protected content and redirects to fixed `/admin/login`; successful login returns to `/admin`, ignoring arbitrary redirect parameters.

Passwords and session tokens are never stored in localStorage or application-managed cookies. Password state clears after each login attempt. Logout waits for confirmed server revocation and reports failures.

| Role | Collections | Draft create/edit/archive | Publish/unpublish and published edits |
| --- | --- | --- | --- |
| SUPER_ADMIN | All five | All five | All five |
| CONTENT_EDITOR | Projects, team | Projects, team | None |
| RESEARCH_EDITOR | Research, publications | Research, publications | None |
| ACADEMY_MANAGER | Courses | Courses | None |
| VIEWER | All five | None | None |

New content starts as draft. Slug/title or name are required immediately; publication fields are additionally required to publish. Typed optional fields include SEO, media references, contributors, approved profile links and syllabus entries. There are no uploads. Research stage is independent of status.

Published edits require publish permission, matching Step 8: editors must ask a publisher to unpublish before editing. Archived records are read-only. Publish/unpublish/archive require confirmation. Publishing optionally schedules a future time. All updates/actions send revisions; success appears only after a valid response.

On 409, input stays unchanged. Review fetches the actual latest saved record and compares changed fields. Reload confirms discarding input. Keep changes adopts the latest revision and merges changed top-level fields for an explicit subsequent save; nested arrays/objects are reviewed as whole fields. Duplicate draft slugs offer review/opening the existing record while retaining input.

Loading, empty, validation, API error and confirmed-success states are explicit. Transport failure does not prove transaction failure: reload/review before retrying. Unsaved input is memory-only, with an unload warning; navigation, session expiry or reload can discard it. There is no persistent draft cache or mock fallback.

Admin metadata/headers specify noindex/nofollow, and robots.txt disallows `/admin`; no public sitemap is introduced. Indexing directives supplement the session gate. The development preview remains 404 in production.

## Opt-in browser verification

`frontend/test/admin-browser.mjs` and `admin-browser-extra.mjs` use an externally supplied Playwright installation and Chrome, without application dependencies. They target only project `techyfellow-step9-check`, port 12080, production frontend, test backend, allowed origin `http://localhost:12080`, private replica set and exact `mongodb://mongodb:27017/techyfellow_test_step9?replicaSet=rs0`. Supply a temporary `.step9-check.yml`; never target existing application data.

The guarded backend helper accepts JSON via stdin: random 32-hex runId and five users with all roles, synthetic emails matching `synthetic-step9-[a-z_]+@example.invalid`, and independently generated random passwords. Keep this fixture file outside the repository, mode 0600. `seed` refuses a nonempty database, creates indexes and ownership marker. `expire` affects only a selected owned synthetic user. `cleanup` drops only the exact owned test database. Credentials are never logged; the helper never starts automatically.

With the isolated stack running, fixtures privately generated, and artifacts directory created:

```sh
docker compose -p techyfellow-step9-check -f docker-compose.yml -f docker-compose.dev.yml -f .step9-check.yml exec -T backend node test/admin-ui-fixtures.mjs seed < "$TECHYFELLOW_UI_FIXTURES"
TECHYFELLOW_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs TECHYFELLOW_UI_FIXTURES=/private/path/fixtures.json TECHYFELLOW_UI_ARTIFACTS=/absolute/path/artifacts node frontend/test/admin-browser.mjs
TECHYFELLOW_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs TECHYFELLOW_UI_FIXTURES=/private/path/fixtures.json TECHYFELLOW_UI_ARTIFACTS=/absolute/path/artifacts node frontend/test/admin-browser-extra.mjs
docker compose -p techyfellow-step9-check -f docker-compose.yml -f docker-compose.dev.yml -f .step9-check.yml exec -T backend node test/admin-ui-fixtures.mjs cleanup < "$TECHYFELLOW_UI_FIXTURES"
docker compose -p techyfellow-step9-check -f docker-compose.yml -f docker-compose.dev.yml -f .step9-check.yml down
```

Run scripts sequentially once per fresh fixture set; content state/login throttling require owned cleanup/reseed before repeats. The extra script expires the synthetic VIEWER session using the guarded helper. Request abortion explicitly tests transport failure; successful content operations use actual APIs/MongoDB. Remove private fixture files/override afterward, retain volumes/unrelated services. Chrome checks cover selected widths/keyboard behavior; full accessibility/cross-browser audits are not implied. Actual results: [progress](progress.md).

Step 10 adds the [media library and project gallery selection](media.md). Existing media-reference text entry is replaced by ready-image selection. Cover/profile fields are not added to other collections.

Step 15 adds [private lead list/detail screens](leads.md) for SUPER_ADMIN and SALES_MANAGER. Existing content roles receive no lead access; SALES_MANAGER has no content/media access.
