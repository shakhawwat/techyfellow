# Techy Fellow supervisor handover

Prepared 2026-10-09 (Asia/Dhaka) from the existing source at
`/media/sharlok-holmes/project/techyfellow/website/techyfellow`.
No deployment, application redesign, authentication change or runtime-data migration was performed.
This is a **source handover**, not a ready-to-upload `public_html` application.
Read `SUPERVISOR_CHECKLIST.md` for the checks actually performed and launch dependencies.
Historical README/progress statements describe earlier snapshots; this document and the checklist
record the inspected handover snapshot. In particular, `/store/kits` now exists as a concept catalogue.

## Implemented functionality and limits

- Next.js App Router / React / TypeScript public website: homepage banners and carousels,
  Solutions, Consulting, institutional pathways, research/publications/projects listings and
  details, Academy/courses, About/team, Contact and Build With Us. Dynamic public pages use
  the server-only content API; published records are distinct from preview/demo fallbacks.
- Public signup/login, session-aware navigation and logout. Backend registration creates MEMBER
  accounts without admin grants. Public and admin authentication share the current browser's
  cookie session; either logout revokes it. Password hashing, strict input checks, CSRF/origin
  controls, throttling and private authorization are implemented.
- One local “Techy Fellow Help” / “Website FAQ assistant” in the public layout, including login
  and signup; admin is excluded. FAQs and messaging remain local in the tab, state persists
  during public client navigation, and account changes/logout discard the conversation.
  It is not live AI or human support and must never request passwords or verification codes.
- NestJS/Mongoose APIs, health/live and health/ready, explicit indexes, protected admin content
  management with publish/unpublish/archive, revision checks and transactional audit records.
  Custom admin media and private inquiry/lead management with role-specific permissions.
- Persisted typed inquiries and idempotent acknowledgments; reference receipt does not confirm
  a booking, enrollment, mentor, collaboration, delivery or purchase.
- R2 image-storage integration, validated image uploads, media references and explicit
  reconciliation command. Uploads are unavailable until the complete configuration is supplied.
- Durable inquiry notification jobs and account-verification queue/worker are implemented.
  Local delivery is disabled. Mocked delivery/disabled-mode tests do not establish real delivery.
- `/store/kits` is an illustrative six-kit catalogue with estimated components/prices and inquiry
  actions. Checkout, orders, stock, payment, confirmed purchases, enrollment and LMS are absent.
- Verification backend exists; verification screens, resend and password recovery are unfinished.
  Real R2/email delivery, public TLS and full enabled inquiry-worker retry/lease acceptance need
  separate verification. Verified company contacts, legal/privacy copy, domain and asset rights
  require client approval. No real admin credentials were created for this handover.

## Package contents and exclusions

The ZIP includes frontend/backend source and tests, both npm lockfiles, Dockerfiles and
`.dockerignore` files, four inspected root Compose configurations, Nginx config, DB scripts,
README, existing deployment/administration records, `.env.example` templates and public assets.
`PACKAGE_MANIFEST.sha256` inventories the included files. A SHA-256 sidecar accompanies the ZIP.

Excluded: node_modules, `.next`, dist/out/build/coverage, caches, logs, tsbuildinfo, real `.env`
files, account/agent/Git metadata, credential files, backups/dumps and user-upload directories.
`backend/test/account-compose.yml` contains explicitly synthetic test settings, not credentials
for any deployed service; it must never be used as production configuration.

**Asset finding:** `frontend/public/brand/logo.jpeg` is an Office/Word ZIP document masquerading
as a JPEG. It is unused by source and is omitted from the handover ZIP. Its private-document
contents are not reproduced. The working copy was left unchanged: remove/quarantine it before
any public deployment of that working copy. The navbar uses `icon_logo.jpeg` and `logo.mp4`.
See `docs/handover-assets.md` for the review inventory and remaining license/consent checks.
The source package intentionally contains no runtime database/content exports or user uploads.

## Local startup

Node requirement in both packages: >=20.19.0. Existing Dockerfiles pin Node 22.22.3.
Use Docker Engine and a Compose plugin supporting `ports: !override`.
From the extracted project root:

```sh
docker compose -p techyfellow-dev -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.run.local.yml config --quiet
docker compose -p techyfellow-dev -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.run.local.yml up -d --build --wait --wait-timeout 180
docker compose -p techyfellow-dev -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.run.local.yml exec -T backend npm run db:indexes
```

Open `http://localhost:8081`, `/admin/login`, `/api/v1/health/live` and `/api/v1/health/ready`.
The local override binds loopback only, allowlists localhost:8081/3000 and forces live email off.
Port 8080 belongs to an unrelated application in the original workspace; leave it alone.
The private `mongodb` service initializes a single-node rs0 replica set; named volume
`techyfellow-dev_mongodb-data` persists. No account or verified company content is seeded at startup.
To stop only your own local project, use the same Compose arguments with `down`; do not use
`--volumes` or global Docker prune. The delivered snapshot was prepared without stopping the
original local system.

Host development is optional: `npm ci` separately in frontend and backend; use the host commands
in README. Backend process environment must be exported explicitly; `.env.example` is not loaded.
A host backend needs a reachable replica set. Default MongoDB Compose networking is private;
README documents the optional loopback host mapping. Frontend direct-host API setting is
`NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1`; same-origin Nginx uses `/api/v1`.

## Production builds and checks

Run from each application directory:

```sh
npm ci
npm run lint
npm run typecheck
npm run build
```

Frontend: `node --test test/*.test.mjs`.
Backend after build:

```sh
node --test test/account-policy.test.mjs test/auth-policy.test.mjs test/configuration-health.test.mjs test/public-query.test.mjs test/lead-validation.test.mjs test/admin-content-validation.test.mjs test/media-validation.test.mjs
```

Backend integration tests require exact guarded synthetic database names and empty test databases.
Do not run them against the runtime/production database. `backend/test/account-compose.yml` is
an existing private ephemeral fixture for account/auth tests. The remaining test requirements
are documented in docs and in each test prelude; media/lead tests additionally consume generated
synthetic stdin fixtures. Browser scripts may require Playwright and their documented fixture
inputs; no browser dependency is included or added to package.json. The handover used installed
Chrome for a targeted read-only browser check. Consult the checklist for scope and failures.
After building, host `npm start` starts an app; container frontend runs standalone `server.js`,
backend runs `dist/main.js`, and the separate worker runs `npm run worker:email`.

## Environment variables and secure transfer

Templates at root, frontend and backend enumerate supported variables. Values in templates are
placeholders. Compose reads root environment/optional untracked root `.env` for interpolation;
it passes only declared settings to containers. Real files remain outside versioned/build contexts.

| Variable(s) | Consumer and requirement |
| --- | --- |
| `NODE_ENV`, `PORT` | Runtime; production and ports 3000 frontend / 4000 backend are set by Compose. |
| `MONGODB_URI` | Backend/worker secret; production requires a reachable authenticated MongoDB replica set or sharded cluster supporting transactions. Include provider-specific TLS/replica options. Never browser-side. |
| `AUTH_ALLOWED_ORIGINS` | Backend/worker; exact HTTPS frontend origins in production, comma-separated; no wildcards/path. |
| `AUTH_SESSION_TTL_SECONDS` | Backend; 900–86400, default 28800. |
| `AUTH_TRUSTED_PROXY_IPS` | Backend; verified literal proxy IPs only, default empty. Review forwarding and client-IP throttling before launch. |
| `NEXT_PUBLIC_API_BASE_URL` | Non-secret frontend **build-time** API base, default `/api/v1`. Rebuild when changed. |
| `CONTENT_API_BASE_URL` | Server-only frontend runtime base ending `/api/v1`, default `http://backend:4000/api/v1` in Compose; no credentials/query/fragment. |
| `PUBLIC_SITE_URL` | Server-only frontend; approved canonical HTTPS origin, empty until confirmed. |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Backend-only media setup; endpoint is approved HTTPS S3-compatible R2 endpoint, keys bucket-scoped. |
| `MEDIA_PUBLIC_BASE_URL` | Backend; one approved public HTTPS origin, no path/query. |
| `NEXT_PUBLIC_MEDIA_HOST` | Non-secret frontend **build-time** hostname matching that media origin; no scheme/path/port/wildcard. Rebuild when changed. |
| `MEDIA_MAX_BYTES`, `MEDIA_MAX_DIMENSION`, `MEDIA_MAX_PIXELS` | Backend; defaults 5242880, 8192, 40000000; see media.md for limits. |
| `EMAIL_ENABLED` | Backend/worker; false until authorized real-delivery verification; exact true/false. |
| `RESEND_API_KEY`, `EMAIL_FROM`, `LEAD_NOTIFICATION_TO`, `ADMIN_BASE_URL` | Backend/worker only; verified sender, authorized internal recipient(s), exact HTTPS URL ending `/admin`; required for enabled inquiry notifications. |
| `ACCOUNT_VERIFICATION_KEY` | Backend/worker secret; 64 lowercase hex characters (AES-256 key). Needed with sender to queue verification, plus provider key and enabled delivery to send. |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | Explicit bootstrap process only; never frontend/runtime defaults or build args. |
| `SALES_MANAGER_EMAIL`, `SALES_MANAGER_PASSWORD` | Explicit operator creation command only; see docs/leads.md. |

Transfer real DB/R2/email credentials, encryption key, admin password and recovery material
**separately** through an approved password manager/secret vault with named recipients and least
privilege. Do not send secrets inside this ZIP, source comments, browser settings, chat logs,
command arguments, screenshots or general email attachments. Confirm access and rotate temporary
handover credentials after receipt. Store an encrypted recovery copy of the verification key;
changing/loss of that key prevents decrypting already queued verification codes. Never use the
synthetic key/sender in the test Compose fixture for a real account system.

## Database and secure administration

Development initialization is `scripts/mongodb-init.js`: initialize rs0 only when absent, wait
for writable primary, refuse incompatible existing configuration. It does not reconfigure/reset
existing data. Production Compose does not start MongoDB; provision a secure external replica
set with transactions, TLS, authentication, network restrictions and appropriate backup support.

Auto-index creation is disabled. Run `npm run db:indexes` before allowing account/content/inquiry
traffic. This explicit repeatable command creates content, user/session/throttle/audit, account
verification/job, lead, media and notification indexes without dropping indexes. Resolve any
pre-existing duplicate unique fields separately; do not “fix” them by deleting data automatically.
Readiness (DB ping) must be checked in addition to container liveness.

Bootstrap inserts one enabled SUPER_ADMIN and refuses an existing normalized email. It does
not elevate an existing user and never runs automatically. Use a strong unique password (backend
accepts 12–128 characters with a byte limit) and a verified responsible administrator's email.
On a trusted Bash operator terminal, with production runtime configuration already securely
supplied, read credentials without placing their values in command arguments/history:

```sh
read -r -p 'Administrator email: ' BOOTSTRAP_ADMIN_EMAIL
read -r -s -p 'Administrator password: ' BOOTSTRAP_ADMIN_PASSWORD
printf '\n'
export BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
docker compose -p techyfellow-prod -f docker-compose.yml -f docker-compose.prod.yml run --rm --no-deps -e BOOTSTRAP_ADMIN_EMAIL -e BOOTSTRAP_ADMIN_PASSWORD backend npm run auth:bootstrap
unset BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
```

First run the same production `run --rm --no-deps backend npm run db:indexes` command with
intended DB secrets already injected. Verify admin login, role boundaries and logout over HTTPS.
No bootstrap/password-reset action was performed against the working local database.
Public/admin sessions share a cookie; explain this to operators. Account assistance never handles
passwords/codes in the local FAQ chat. See docs/authentication.md, accounts.md and leads.md.

## Media and email operations

Provision the approved bucket/domain and bucket-scoped credentials; configure backend media
settings and the matching frontend public hostname, then rebuild frontend. Verify real upload,
image decoding, metadata, published references and permissions with approved test assets; do not
confuse the simulated storage test with real R2 connectivity. `npm run media:reconcile` is an
explicit backend operator command for failed/stuck upload cleanup, not an automatic scheduler.
No permanent-delete UI or general document/video upload workflow is implemented.

Provision a verified Resend sender/domain, authorized recipients and HTTPS admin URL; securely
supply provider key and account-verification encryption key to backend **and** worker. Start one
supervised persistent notification worker with restart/health monitoring. Keep `EMAIL_ENABLED=false`
until recipient authorization and inbox/delivery tests are complete. Queue persistence and disabled
processing were checked separately; full enabled inquiry retry/lease/terminal-failure acceptance
and real verification delivery remain launch dependencies. Decide how old queued jobs will be
handled before enabling delivery, to avoid unintentionally notifying about historical inquiries.

## Hosting assessment and Docker/VPS deployment route

Client plan: EBN Ultimate-A shared hosting with **no shell access**. Node.js, Docker and persistent
worker support are unconfirmed. The ZIP cannot be certified compatible with that plan. Obtain
written provider confirmation; a static-file/PHP-only plan cannot run this full system unchanged.

Required provider capabilities for this source:

1. Supported Linux host/architecture able to run the pinned Node 22 images (or supported Node
   >=20.19 with production npm/native argon2/sharp dependencies), persistent Next.js and NestJS
   processes, process supervision, restart policies and health checks.
2. Docker Engine and Compose with multi-stage builds, private service networking, port publishing,
   bind mounts, non-root processes and `!override` support; administrative SSH or an equivalent
   provider-managed build/exec/Compose workflow. No-shell file upload alone is insufficient.
3. A separate, continuously running notification worker; cron/request-only execution is not
   equivalent. Ability to inspect failures, run explicit index/bootstrap/reconcile commands
   securely, schedule backups and restore releases without exposing secrets.
4. Authenticated TLS MongoDB with replica-set/sharded transaction support, unique/TTL indexes,
   writable primary, private/allowlisted network access and backups. A standalone DB is insufficient.
5. Reverse proxy routing `/api/` to backend and other paths to Next.js, correct trusted forwarding,
   request-body support up to the configured image limit, secure cookies/custom CSRF headers and
   optional dev WebSocket upgrades. Private ports 3000/4000 must stay private.
6. Domain DNS control; public HTTPS/certificate renewal/HTTP redirect, configurable proxy headers
   and firewall. The supplied Nginx config listens on HTTP only; TLS adaptation is required.
7. Outbound DNS/TLS access to npm/container registries during builds, MongoDB, approved R2 endpoint
   and Resend; approved public media delivery domain. Appropriate resource/disk/file-descriptor
   capacity, logs with retention, monitoring and operator support. Resources must be load-tested.

Existing route: use a VPS/container-capable provider with these capabilities. Review
`docs/deployment.md`, provision secure external MongoDB and secrets, validate the production pair,
build immutable release images, initialize indexes/bootstrap explicitly, and configure HTTPS.
Example **operator workflow, not executed by handover**:

```sh
docker compose -p techyfellow-prod -f docker-compose.yml -f docker-compose.prod.yml config --quiet
docker compose -p techyfellow-prod -f docker-compose.yml -f docker-compose.prod.yml build frontend backend notification-worker
# Run indexes and explicit secure bootstrap as above before opening public traffic.
docker compose -p techyfellow-prod -f docker-compose.yml -f docker-compose.prod.yml up -d --wait --wait-timeout 180
```

Root production `MONGODB_URI` and `AUTH_ALLOWED_ORIGINS` are mandatory. Use a reviewed deployment
port/TLS override; default 127.0.0.1:8080 is only a loopback HTTP foundation. If an outer TLS proxy
is used, review the supplied Nginx `$scheme` forwarding and verified trust chain rather than
trusting arbitrary forwarded headers. Confirm real HTTPS cookie, CSRF, redirects, media and
readiness checks before launch. Do not combine development and production overrides.
Node/Docker deployment behavior is described in [Next.js deployment documentation](https://nextjs.org/docs/app/getting-started/deploying).

## Static frontend export: separate change proposal, not performed

The current configuration is `output: 'standalone'`, not export. Numerous public routes and admin
layout use `force-dynamic`; list/contact pages consume runtime search parameters, dynamic details
have no complete `generateStaticParams`, published content is loaded at runtime and Next Image
uses server optimization. A switch to `output: 'export'` alone would not preserve behavior.
A static presentation frontend is feasible only after a separately approved implementation:

- Choose a content snapshot/rebuild workflow and enumerate every static detail/service slug, or
  redesign dynamic details/lists as client API rendering with explicit routing/404 behavior.
- Replace dynamic server rendering/query handling with build-time or client logic and preserve
  pagination/filter/contact-prefill behavior; accept that new published records need rebuilds
  unless a client-data architecture is implemented.
- Use an approved image loader/CDN or unoptimized images; move runtime headers/404/routing and
  caching rules to the static host. Review API-driven canonical metadata and search indexing.
- Keep NestJS, MongoDB, media administration, authenticated account/admin APIs, inquiries and
  the notification worker on another compatible host. Review authenticated frontend routes,
  HTTPS API routing, exact origins, credentialed requests and shared-site cookie requirements.
  Prefer same-origin API reverse proxy; arbitrary cross-site cookies are not assumed to work.
- Public frontend may contain only non-secret API/media URLs. Database/R2/provider/encryption
  secrets remain entirely server-side. Recheck all workflows, accessibility and authentication.

No static export, static build or feature removal was performed. [Next.js static-export limits](https://nextjs.org/docs/app/guides/static-exports)
confirm runtime-only features need redesign. Hosting just static files does not host the backend.

## Backup, restore and rollback procedures

Assign owners, retention, encryption/access controls and recovery-time/recovery-point targets
before launch. Backups contain personal/account/lead data and must never be included in the
source ZIP or stored under frontend/public. This handover did not take a runtime backup or test
restoration/rollback.

Back up MongoDB collections **and indexes**, R2 objects and their metadata/reference relationship,
release image digests/source checksums/lockfiles, approved public assets, Nginx/Compose configs
and separately encrypted secret/key recovery material. Prefer provider-supported consistent
snapshots/PITR. For logical DB backups use compatible MongoDB Database Tools and a restrictive
secret config file outside the project; do not put a URI/password in command-line history.
For a single-application logical dump, use a maintenance window with API/admin writes and worker
writes paused and resumed by the designated operator:

```sh
mongodump --config /secure/mongodb-backup.yml --db techyfellow --archive=/secure/backups/techyfellow.archive.gz --gzip
```

The config contains securely supplied connection/auth details and is readable only by its owner.
Do not combine a database-filtered dump with `--oplog`; use provider snapshots or a properly scoped
full-replica-set/oplog procedure if online point-in-time consistency is needed. Verify encryption,
archive integrity and a restore drill into an **isolated empty target**, never the working DB:

```sh
mongorestore --config /secure/mongodb-restore-test.yml --archive=/secure/backups/techyfellow.archive.gz --gzip --nsInclude='techyfellow.*'
```

Do not use `--drop` against the working database or overlay a live database. Recheck indexes,
transactions, public/media references, admin permissions and readiness in isolation. Keep sessions
revoked/traffic fenced during disaster recovery; queued jobs must be reviewed before re-enabling
email to prevent unintended repeat delivery. Restore the matching verification key securely.
See [mongodump](https://www.mongodb.com/docs/database-tools/mongodump/) and
[mongorestore](https://www.mongodb.com/docs/database-tools/mongorestore/) for tool constraints.

Before each release, retain previous immutable image digests and a verified DB/media snapshot.
Build/tag on a suitable machine, test privately, then switch the reviewed production configuration
only after authorization. To roll back code, select the previous frontend/backend/worker image
set plus compatible configuration and rebuild/restart only that production project. Never delete
volumes/prune as rollback. Assess schema/data compatibility first; code rollback does not undo DB
writes. If data recovery is necessary, restore to a fresh isolated DB, validate, then switch the
backend/worker URI through the secure configuration workflow. Health, account/admin, inquiries,
media and queue behavior must be checked before reopening traffic. Record the operator and result.

## Preview content to replace or approve before launch

- `frontend/src/components/public/company-data.ts`: fictional demo team names/roles, supplied
  illustrative portraits and demoRating values (~8.4–8.8). They are not verified staff or reviews.
- `academy-data.ts`: demo course summaries/curricula, example BDT prices/original prices and
  computed discounts; approval is needed for real course/prerequisite/enrollment claims.
- `kit-data.ts` / `/store/kits`: six concept kits, illustrative components, quantities/unit prices,
  totals/images; not stock, binding quotations or purchasable offers.
- `home-research-data.ts`: research concepts/team-status examples and fictional publication
  layouts/citations (“Example Journal”, 2026); replace with approved records.
- `home-mentorship-store.tsx`: proposed mentor profiles, preparation/scoping examples and no
  confirmed mentor/session availability. Preserve academic-integrity boundaries.
- `frontend/src/content/footer-socials.ts`: generic Facebook, LinkedIn, Instagram, YouTube, X,
  GitHub, TikTok and WhatsApp homepages are preview destinations. Supply verified company
  profiles/business number or separately approve removing unavailable links.
- `frontend/src/content/services.ts` and home/public copy: proposed scopes and example claims;
  agree actual deliverables, terms, availability, legal/privacy/contact information and branding.
- Confirm licenses and consent for all banner photographs, portrait subjects, logo and video.
  These approvals cannot be established from local filenames or the existence of the assets.

Keep preview labels honest until each replacement/approval is completed. The handover preserves
current UI/functionality and does not silently convert previews into verified offers.
