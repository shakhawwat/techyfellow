# Public projects, research and publications

Step 12 adds list/detail routes for `/projects`, `/research` and `/publications`, linked from homepage previews. Existing public API DTOs supply all technical content; there is no seed/mock fallback in the application. Projects show problem, approach, technologies, documented results and approved images when available. Research stage describes the research lifecycle separately from editorial publication. Publications use an editorial list and author/venue/year detail layout.

Step 14 extends the same loader/templates to `/academy/courses` and `/team`; see [Academy and team contracts](academy-team.md). API resource paths remain `/api/v1/courses` and `/api/v1/team`.

## Filtering and rendering

Filters mirror the API: projects category/technology, research domain/researchStage, publications author/venue/year. Lists use API page/limit/sort (default page 1, limit 20, maximum 100). Forms reset page to 1; pagination preserves every selected filter/sort/limit in URL parameters. Filters are exact and case-sensitive. Unknown/repeated/structured parameters, invalid numbers and unsupported sorts/stages show a validation message and noindex; they never reach a database query through raw input.

Public lists/details render on the server through `CONTENT_API_BASE_URL`, using fixed resource paths, a two-second deadline, omitted cookies and no redirects. Successful snapshots reuse the homepage's 60-second TTL with a 128-entry LRU per frontend process and bounded in-flight requests. HTML is dynamic; admin/session data is never stored in this cache. Newly published or changed content can take up to 60 seconds to appear; unpublished content can remain in an existing snapshot for that same bounded window. Restarting a frontend clears its process cache. Expired snapshots are discarded before refreshing; failures and missing records are not cached or replaced with stale content.

API 404 alone triggers `notFound()`; outages/malformed responses display an explicit unavailable state with noindex and no canonical. Outage views intentionally return 200, not an invented 404. Invalid slug syntax is rejected locally. List-only loading boundaries avoid committing a streamed 200 before detail visibility is known. Metadata streaming is disabled via `htmlLimitedBots: /.*/` so detail metadata can establish genuine 404 status before output, including normal browser user agents. Admin metadata is static and its existing client-side session gate remains unchanged. See [Next.js not-found status behavior](https://nextjs.org/docs/app/api-reference/file-conventions/not-found) and [metadata streaming controls](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#streaming-metadata).

## Canonical URLs, links and images

Optionally set server-only runtime `PUBLIC_SITE_URL` to a **verified HTTPS origin**, without path/query/fragment/credentials/port. Compose forwards it separately from browser build-time variables. No deployment domain is assumed. Lists generate canonical URLs from normalized selections when the origin exists. Details prefer a valid published SEO canonical URL, otherwise derive one from the verified origin; absent both, canonical is omitted honestly. Metadata uses published title/summary or SEO. Breadcrumbs and CreativeWork/ScholarlyArticle JSON-LD use actual fields only; absolute structured URLs require available canonical/origin. JSON-LD escapes HTML delimiters.

Technical strings are rendered as text, never HTML. Publisher URLs require HTTPS and no credentials; DOI links require the supported identifier syntax and a fixed HTTPS doi.org resolver. Publishing editors must verify identifiers and publisher destinations before publication. Protocol checks do not prove a paper's existence, provenance or third-party availability. Synthetic verification links are never production content.

Project galleries show only API image references accepted by the exact approved `NEXT_PUBLIC_MEDIA_HOST` and randomized media path. Images have supplied meaningful alt text, dimensions, responsive sizing and visible captions. Simple figures remain keyboard-readable without a carousel or hidden controls; unsupported/unapproved assets are omitted. No fake photos are introduced. Configuring public delivery still requires the Step 10 approved host/provider setup.

## Checks and isolated fixtures

From frontend/: `npm run lint`, `npm run typecheck`, `npm run build`. From the project root: `node --test frontend/test/public-content.test.mjs frontend/test/public-pages.test.mjs` (explicit simulated fetch/clock assertions, not real connectivity).

Actual Chrome/API checks used production images and the private development replica set in project `techyfellow-step12-check`, loopback 12083, NODE_ENV=test and exact URI `mongodb://mongodb:27017/techyfellow_test_step12?replicaSet=rs0`. A temporary ignored `docker-compose.step12.local.yml` selected production build targets, the isolated backend URI/origin, empty R2 settings and frontend `PUBLIC_SITE_URL=https://techyfellow.example.invalid` (explicit test-only canonical origin).

With that owned configuration:

```sh
docker compose -p techyfellow-step12-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step12.local.yml up -d --build --wait --wait-timeout 240
docker compose -p techyfellow-step12-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step12.local.yml exec -T backend mkdir -p test
docker compose -p techyfellow-step12-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step12.local.yml cp backend/test/public-pages-fixtures.mjs backend:/app/test/public-pages-fixtures.mjs
# Provide a private JSON stdin file containing a random 32-hex runId; no production credentials are needed.
docker compose -p techyfellow-step12-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step12.local.yml exec -T backend node test/public-pages-fixtures.mjs seed < /tmp/techyfellow-step12-fixtures.json
docker compose -p techyfellow-step12-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step12.local.yml restart frontend
# Set TECHYFELLOW_PLAYWRIGHT_MODULE, TECHYFELLOW_UI_FIXTURES and TECHYFELLOW_UI_ARTIFACTS to local tooling/private fixture/artifact paths.
node frontend/test/public-pages-browser.mjs
docker compose -p techyfellow-step12-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step12.local.yml exec -T backend node test/public-pages-fixtures.mjs cleanup < /tmp/techyfellow-step12-fixtures.json
docker compose -p techyfellow-step12-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step12.local.yml down
```

The fixture helper refuses another database/environment and uses an ownership marker; seed requires an empty database. Optional `restore` requires that marker and empty owned content collections. All fixtures explicitly say Synthetic. The browser suite tests data/404s first, then layout/empty/outage; `TECHYFELLOW_UI_PHASE=layout` resumes the latter phase after a test correction. Failure-state checks restart only the owned frontend to clear cached snapshots; clock-based tests verify TTL independently. Cleanup preserves volumes and unrelated services. Remove the temporary override and fixture file afterward. Actual outcomes are recorded in progress.md; no deployment or real company data is involved.
