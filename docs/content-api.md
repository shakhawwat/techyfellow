# Read-only content APIs

Step 6 adds schemas and public reads only. The user's Step 6 requirements define this implementation; Full Project Documentation was located during Step 11. There are no public writes, seed commands, uploads or frontend integration. Step 8 adds [protected admin content writes](admin-content-api.md); public routes remain read-only. Step 7 adds separate backend admin authentication; these public reads remain anonymous. Research stage is separate from editorial publication status.

## Routes and responses

| Collection | List (optional trailing slash) | Detail |
| --- | --- | --- |
| Projects | GET /api/v1/projects | GET /api/v1/projects/:slug |
| Research projects | GET /api/v1/research | GET /api/v1/research/:slug |
| Publications | GET /api/v1/publications | GET /api/v1/publications/:slug |
| Team members | GET /api/v1/team | GET /api/v1/team/:slug |
| Courses | GET /api/v1/courses | GET /api/v1/courses/:slug |

The repeated trailing-slash entries in the step request are interpreted as lists plus slug detail routes, consistent with its detail visibility requirements. A record is public only when status=published and publishedAt is a date no later than the request cutoff. Draft, archived, future-dated, undated and missing details return the same 404.

Lists return `{data: [...], pagination: {page, limit, total, totalPages}}`. Empty lists are real empty results with total=0 and totalPages=0. Details return `{data: ...}`. Page defaults to 1; limit defaults to 20 and must be <=100. Values must be positive decimal integers without leading zeros; unsafe numeric offsets are rejected. Stable sorting uses slug as a tie-breaker. Unknown parameters, repeated/structured values, unsupported sorts and invalid enum/numeric filters return 400. Detail routes accept no query parameters.

## Supported filters and sorts

All lists accept page, limit and sort. Sorting accepts the field or its `-field` descending form; default is -publishedAt.

| API | Exact-match filters | Sort fields |
| --- | --- | --- |
| projects | category, technology (technologies array) | publishedAt, title |
| research | domain, researchStage | publishedAt, title |
| publications | author (authors array), venue, year (integer 1–9999) | publishedAt, title, year |
| team | expertise (array) | publishedAt, name |
| courses | level, deliveryMode | publishedAt, title |

Text filters are case-sensitive, trimmed strings of 1–200 characters without control characters. Filters are constructed from fixed server-side fields and scalar $eq values; input objects/operators never become MongoDB queries. No status, arbitrary field filtering, regex search or raw MongoDB sorting is supported.

```sh
# Through local Nginx, when port 8080 is available. No company content is seeded.
curl --fail 'http://localhost:8080/api/v1/projects?page=1&limit=20&sort=-publishedAt'
curl --fail 'http://localhost:8080/api/v1/research?researchStage=active'
curl --fail 'http://localhost:8080/api/v1/courses?level=beginner&deliveryMode=self-paced'
# Replace the placeholder with a genuinely published slug; it may otherwise return 404.
curl --fail 'http://localhost:8080/api/v1/projects/replace-with-published-slug'
```

Public content errors use `{error: {code, message}}`: 400 BAD_REQUEST, 404 NOT_FOUND, 503 SERVICE_UNAVAILABLE, or 500 INTERNAL_ERROR. Messages are fixed and exclude stack traces, driver/URI details and raw request values. Database failures yield 503, never invented data. Existing health responses remain unchanged.

## Storage fields

All five collections have unique-per-collection lowercase hyphenated slugs (max 160), summary (max 2000), editorial status=draft/published/archived (default draft), publishedAt, automatic createdAt/updatedAt and optional SEO `{title, description, canonicalUrl}`. Published records require publishedAt. Schemas enforce their fields; timestamps/publication dates are not invented.

- Projects: required title, category, problem, approach; technologies/results string arrays; media references `{reference, type: image|video|document, altText}`. References describe assets only; no upload or media-serving endpoint is added.
- Research: required title/domain; methods string array; researchStage=planned/active/paused/completed (default planned); contributors `{name, teamSlug?}`. Contributor names/references are stored public attribution, without exposing private team fields.
- Publications: required title, nonempty authors string array, venue, integer year (1–9999); optional DOI (`10.<4–9 digits>/<suffix>`) and publisherUrl.
- Team: required name/biography; expertise string array; profileLinks `{label, url, approved}`. Approval defaults to false. Only explicitly approved HTTPS links without embedded credentials are returned.
- Courses: required title, level=beginner/intermediate/advanced, deliveryMode=self-paced/live-online/in-person/hybrid and duration `{value: positive finite number, unit: hours|weeks}`; prerequisites string array and syllabus `{title, topics: string[]}`.

URLs must be HTTPS with no embedded credentials. Human publishing workflows must supply actual approved content; this step does not assert any company results or courses exist.

Explicit public DTOs expose slug, title (name for team), summary, publishedAt, SEO and the relevant content fields above. They exclude _id, __v, editorial status, createdAt/updatedAt, approval flags, arbitrary storage fields and nested internal metadata. Profile links are projected to label/url only.

## Explicit indexes

Auto-indexing/auto-creation remain disabled. From backend/:

```sh
npm run build
# Supply NODE_ENV and MONGODB_URI securely for the intended database.
npm run db:indexes
```

The command validates configuration and calls createIndexes for each collection. Since Steps 7–8 it also creates authentication and protected content audit/admin indexes; see [admin APIs](admin-content-api.md). It creates the explicit authentication indexes described in [authentication documentation](authentication.md). It creates the unique slug index, editorial/publication/date and title/name indexes, and indexes for supported filters. It can be repeated; it does not drop indexes, delete records or resolve duplicate slugs. Existing duplicates must be reviewed and corrected by an authorized operator before unique indexing succeeds. Production index creation is an explicit operator task, not part of app startup or this step's tests. Never print a credential-bearing URI or run the command against production without authorization.

## Isolated verification

Backend checks: `npm run lint`, `npm run typecheck`, `npm run build`, then `node --test test/public-query.test.mjs`. Integration checks use `npm run test:content` only in a private container with NODE_ENV=test and the exact URI `mongodb://mongodb:27017/techyfellow_test_step6?replicaSet=rs0`. The test refuses any other URI/environment or a nonempty test database. Fixtures are labeled Synthetic and never seeded into the application's development or production database. The test runs the actual index command, tests API visibility/validation/DTOs/duplicates, and removes its owned test database in finally.

To reproduce from techyfellow/, create a temporary untracked docker-compose.step6.local.yml:

```yaml
services:
  backend:
    environment:
      NODE_ENV: test
      MONGODB_URI: mongodb://mongodb:27017/techyfellow_test_step6?replicaSet=rs0
```

Use a new isolated Compose project, preserving unrelated services:

```sh
docker compose -p techyfellow-step6-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step6.local.yml up -d --build --wait --wait-timeout 180 backend mongodb mongodb-init
docker compose -p techyfellow-step6-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step6.local.yml exec -T backend npm run test:content
docker compose -p techyfellow-step6-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step6.local.yml down
```

Keep the volume; omit --volumes. Remove the temporary override afterward. Production or real development data is never needed for this check.

References: [Mongoose schemas/indexes](https://mongoosejs.com/docs/guide.html), [NestJS controllers](https://docs.nestjs.com/controllers), [exception filters](https://docs.nestjs.com/exception-filters).
