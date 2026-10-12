# Academy, About and Team

## Routes and content

Step 14 adds `/academy`, `/academy/courses`, `/academy/courses/[slug]`, `/about`, `/team` and `/team/[slug]`. Shared public templates, design tokens, navigation/footer and static configuration in `frontend/src/content/public-pages.ts` are reused. Academy previews at most three published courses. About uses the supplied Full Project Documentation's engineering/research positioning with Academy and consulting alongside; no history, awards, partnerships or team counts are invented. Separately referenced landing/store source blueprints are unavailable.

| Source | Displayed fields | Supported filters/sorts |
| --- | --- | --- |
| `/api/v1/courses` | Title, summary, level, prerequisites, syllabus modules/topics, duration in hours/weeks, delivery mode | level, deliveryMode; publishedAt/title, with descending forms |
| `/api/v1/team` | Name, summary, biography, expertise, approved HTTPS profile links | expertise; publishedAt/name, with descending forms |

Lists retain page/limit in URL parameters: page >= 1, default limit 20, maximum 100. Unknown/repeated parameters and unsupported filters/sorts are rejected. Examples: `/academy/courses?level=beginner&deliveryMode=live-online&sort=title`, `/team?expertise=Robotics&sort=name&page=2`. Empty results have explicit messages.

The current course DTO has no verified instructor, price, cohort or hardware fields. The team schema has no profile-image field. These are omitted, including unknown fields in raw responses; no new backend schema or placeholder image is introduced. Publishing remains the editorial approval boundary. Backend-approved profile links are additionally restricted to HTTPS without URL credentials. Biography and curriculum are escaped text, not injected HTML.

Course pages explicitly state that enrollment, payments and certification are not implemented and no scheduled cohort is offered here. Mentorship links resolve to the existing proposed `/consulting/capstone` scope, with student responsibility stated. Inquiry CTAs resolve to actual `/#inquiry` information; no submission, application or booking is implied. Academy/Company navigation uses `/academy` and `/about`; homepage course/team previews link to their real details.

## Rendering, caching and metadata

Existing server-only `CONTENT_API_BASE_URL` supplies fixed published-only endpoints, with two-second deadlines, omitted credentials and no redirected fetches. Existing successful-public-snapshot caching uses a 60-second TTL, 128-entry process LRU and bounded in-flight requests. Newly published/edited/unpublished content can take up to 60 seconds to change in an existing snapshot. Expired snapshots are discarded; errors/404s are not cached or replaced by stale/mock records. Admin/session data remains uncached. Restarting a frontend clears its process cache.

Missing/unpublished/draft/archived/future detail responses from the API become genuine HTTP 404s. Outages or invalid DTOs show a separate unavailable state, with noindex and no canonical, intentionally returning 200 rather than claiming content is missing. List-only loading boundaries preserve genuine detail status codes.

Metadata uses actual content/SEO fields. Canonical and absolute breadcrumb URLs require the existing verified HTTPS `PUBLIC_SITE_URL`, or a safe editorial canonical URL. No organization domain is invented. Course JSON-LD includes available title/summary/level/publication date, without offers, instructors or scheduled course instances. Person JSON-LD uses approved biography/expertise/profile links, without photos, fabricated affiliations or credentials.

## Verification and repeatability

PASS: frontend `npm run lint`, `npm run typecheck`; `node --test frontend/test/public-content.test.mjs frontend/test/public-pages.test.mjs`, followed by focused newly added course/team unit cases. Focused ESLint passed for the new browser and fixture helpers. Existing pinned dependencies/lockfiles are unchanged.

The production frontend Dockerfile built successfully with `npm ci` and `npm run build`. The verified existing Step 12 backend image was reused unchanged. Actual Chrome checks ran against isolated Compose project `techyfellow-step14-check`, loopback 12085, NODE_ENV=test, exact private replica-set database `techyfellow_test_step14`, empty R2 configuration and allowed origin `http://localhost:12085`. `PUBLIC_SITE_URL=https://techyfellow.example.invalid` was explicitly test-only. The ignored temporary override selected production application targets; standard Docker configurations were preserved.

```sh
# Only with the owned temporary test override described above:
docker compose -p techyfellow-step14-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step14.local.yml build frontend
docker compose -p techyfellow-step14-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step14.local.yml up -d --no-build --wait --wait-timeout 180
docker compose -p techyfellow-step14-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step14.local.yml exec -T backend mkdir -p test
docker compose -p techyfellow-step14-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step14.local.yml cp backend/test/academy-team-fixtures.mjs backend:/app/test/academy-team-fixtures.mjs
# Private stdin JSON: random 32-hex runId, synthetic-step14-admin@example.invalid,
# randomly generated password. Keep outside source with restrictive permissions.
docker compose -p techyfellow-step14-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step14.local.yml exec -T backend node test/academy-team-fixtures.mjs seed < /tmp/techyfellow-step14-fixtures.json
docker compose -p techyfellow-step14-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step14.local.yml restart frontend
# Set TECHYFELLOW_PLAYWRIGHT_MODULE, TECHYFELLOW_UI_FIXTURES and
# TECHYFELLOW_UI_ARTIFACTS to local tooling/private fixture/artifact paths.
node frontend/test/academy-team-browser.mjs
docker compose -p techyfellow-step14-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step14.local.yml exec -T backend node test/academy-team-fixtures.mjs cleanup < /tmp/techyfellow-step14-fixtures.json
docker compose -p techyfellow-step14-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step14.local.yml down
```

PASS: all six server-rendered routes, published curriculum/profile fields, pagination, URL filters, draft/archived/future exclusion, genuine missing/unpublished 404s, metadata/canonicals/breadcrumbs, safe escaped biography/approved external links, omission of unsupported facts/photos, navigation/homepage previews/CTAs. All routes checked at 320/390/768/1440px without overflow; keyboard skip/filter/menu Escape/focus and reduced-motion checks passed. Desktop and 390px screenshots visually reviewed at `/tmp/techyfellow-step14-browser/artifacts`.

PASS: existing public projects/research/publications lists/details, service route and actual admin login/session restoration/logout. Empty collections and a stopped owned backend verified honest empty/outage states without mock/stale data. The helper restricts database/environment and ownership, seeds explicitly synthetic records and cleans them afterward. Cleanup dropped and verified the exact test database empty; scoped down removed only verification containers/network, preserving the MongoDB volume and unrelated services. Private fixture/temporary override removed.

NOT RUN: profile-image delivery (no supported field or approved assets), external profile-host connectivity (synthetic invalid domains), comprehensive accessibility/cross-browser audit and deployment. Chrome/build results do not establish accessibility compliance or production readiness.
