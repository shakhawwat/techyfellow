# Public homepage

Static positioning is in `frontend/src/content/home.ts`, based on section 5 of the supplied Full Project Documentation. No approved photographs, contact channels, legal organization details or canonical domain are supplied; CSS decoration and availability messages avoid invented facts. Homepage metadata uses the verified public brand only.

The public route group covers implemented public pages; admin and development preview retain separate layouts. Navigation uses `/solutions`, `/research`, `/academy`, `/consulting`, `/about` and real homepage `#store`/`#inquiry` destinations. Original homepage anchors remain available. Institutional links resolve to `/institutional`. Projects/research/publications/course/team previews now link to their implemented detail routes; the course prefix is `/academy/courses`. Store checkout, enrollment and inquiry submission remain explicitly unavailable.

## Data and caching

`CONTENT_API_BASE_URL` is server-only runtime configuration. Use `http://127.0.0.1:4000/api/v1` for host-run development and `http://backend:4000/api/v1` in Compose. Fixed projects/research/publications/courses/team list requests use a two-second timeout, omit credentials, reject redirects and never forward incoming cookies. Backend published-only filtering remains authoritative; frontend validates dates/DTO shape and rejects explicit unpublished status defensively.

Homepage HTML is dynamically server-rendered. Each process caches only successful public list snapshots for 60 seconds with in-flight deduplication. An editorial change can remain visible within that bounded window. Expired snapshots are removed before refresh; errors are not cached and never serve stale/mock content. Admin/session requests retain their existing no-store behavior. Approved project images require the exact configured HTTPS media host and supported media path; there are no fallback photos.

## Verification

From `frontend/`: `npm run lint`, `npm run typecheck`, `npm run build`. From the project root: `node --test frontend/test/public-content.test.mjs` (explicit simulated fetch/clock, not provider connectivity).

Actual runtime checks used production application images with the development private replica set in project `techyfellow-step11-check`, loopback port 12082 and database `techyfellow_test_step11`. The temporary `.step11-check.yml` selected production frontend/backend targets, backend NODE_ENV=test, the exact isolated URI, explicitly empty R2 settings, allowed localhost:12082 origin and loopback-only Nginx port. Both merged standard Compose configurations validated independently.

`backend/test/homepage-fixtures.mjs` accepts seed/empty/cleanup, requires the exact isolated test URI and ownership marker, and reads random synthetic-admin credentials only from private stdin. Fixtures cover published/draft/archived/future records across all five resources. `frontend/test/homepage-browser.mjs` requires that owned stack, `TECHYFELLOW_UI_FIXTURES` (private JSON path), `TECHYFELLOW_UI_ARTIFACTS`, optional `TECHYFELLOW_PLAYWRIGHT_MODULE` and `TECHYFELLOW_CHROME_PATH`; run with `node frontend/test/homepage-browser.mjs`. It tests actual APIs, SSR, all anchors, mobile/keyboard/reduced motion and real admin sessions. It empties only owned content and stops/restarts only the owned backend/frontend to test failure states; cleanup is still required afterward.

All these checks passed. Desktop/mobile screenshot review completed. Owned fixture cleanup verified the test database empty; project-scoped down preserved the volume and unrelated services. Private credentials/temporary override were removed. Approved-host images, full accessibility/cross-browser audit and deployment checks were NOT RUN. See progress.md for actual results.
