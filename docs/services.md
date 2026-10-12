# Solutions, consulting and institutional pages

Step 13 adds three indexes and eleven detail routes:

- `/solutions`: robotics, iot-embedded, ai-vision, automation, prototyping.
- `/consulting`: capstone, research, startup.
- `/institutional`: schools, universities, industry.

## Content and templates

`frontend/src/content/services.ts` holds typed groups, service definitions, content blocks, client responsibilities, proposed deliverables, FAQs and inquiry copy. Shared `ServiceGroupPage`/`ServicePage` templates reuse the existing Section/Card/Badge components and responsive navy/cyan/light tokens. Three allowlisted dynamic slug routes share those templates; unknown slugs use group-specific not-found views and genuine HTTP 404s.

The supplied `Techy_Fellow_Full_Project_Documentation.docx` is outside this project at `/media/sharlok-holmes/project/techyfellow/doc/`. Sections 2, 4, 5 and 10 supply audiences, route names, required service/institutional sections, academic responsibility and inquiry context. Its separately referenced original landing/store blueprint files are not supplied. Expanded copy describes **proposed discussion scopes**, not verified capabilities, completed engagements, prices, availability, guarantees or certifications. Deliverables remain indicative until a brief is agreed. Capstone academic responsibility is visible in its own section, not hidden in an accordion.

The shared process describes clarifying a brief, reviewing scope, agreeing work and reviewing agreed outputs. Institutional pages cover lab planning, workshops/training, research collaboration and procurement discussion requirements. No quote submission, booking, lead form, commerce or new backend module is introduced.

## Related work and inquiry destinations

A service may carry explicitly curated `{kind: 'projects' | 'research', slug}` references in its configuration. An editor must confirm actual relevance before adding one. The template deduplicates/caps references at six and resolves them through the existing server-only published detail loader with its bounded 60-second public cache. Missing/unpublished/unavailable records are omitted, and the whole section is omitted when nothing resolves. There is no keyword matching, implicit category inference, fabricated work or mock fallback. No approved references have been supplied, so all current arrays are empty and no related API calls are needed. Positive related-work rendering with approved company references is not claimed as verified.

Every inquiry CTA leads to the actual `/#inquiry` destination, which explicitly says submission/contact channels are not yet available. It does not confirm a booking. Main/footer navigation now uses `/solutions`, `/research` and `/consulting`; Since Step 14, Academy uses `/academy` and Company `/about`; Store/Build With Us retain their implemented homepage anchors. Homepage overview/service/consulting/institutional links expose the new routes. Institutions are also discoverable from Solutions pages, without expanding the fixed seven-label main navigation.

Metadata derives from each typed title/summary. Canonical URLs and absolute BreadcrumbList JSON-LD use the existing optional verified server-only `PUBLIC_SITE_URL`; neither is invented when the origin is unset. Service pages do not declare offers, prices, organizational awards or completed outcomes in structured data. Native FAQ disclosure controls support keyboard use; existing menu focus management/reduced-motion behavior is reused.

## Verification

Frontend `npm run lint` and `npm run typecheck` passed. The production image built through the existing frontend Dockerfile using `npm ci` and `npm run build`. No dependencies/lockfiles, backend application code or checked-in Docker configuration changed.

Runtime checks used isolated project `techyfellow-step13-check`, loopback 12084 and exact database `techyfellow_test_step13`, through an ignored temporary `docker-compose.step13.local.yml`. Frontend used the production target; the existing verified Step 12 backend production image was reused with NODE_ENV=test, the private replica-set URI, allowed localhost:12084 origin and explicitly empty R2 settings. `PUBLIC_SITE_URL=https://techyfellow.example.invalid` was test-only.

```sh
# The ignored override configures the owned test environment described above.
docker compose -p techyfellow-step13-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step13.local.yml build frontend
docker compose -p techyfellow-step13-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step13.local.yml up -d --no-build --wait --wait-timeout 180
docker compose -p techyfellow-step13-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step13.local.yml exec -T backend mkdir -p test
docker compose -p techyfellow-step13-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step13.local.yml cp backend/test/services-fixtures.mjs backend:/app/test/services-fixtures.mjs
# Private stdin JSON: random 32-hex runId, synthetic-step13-admin@example.invalid and a randomly generated test password.
# Keep it outside source with restrictive permissions; never put credentials in arguments.
docker compose -p techyfellow-step13-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step13.local.yml exec -T backend node test/services-fixtures.mjs seed < /tmp/techyfellow-step13-fixtures.json
docker compose -p techyfellow-step13-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step13.local.yml restart frontend
# Set TECHYFELLOW_PLAYWRIGHT_MODULE, TECHYFELLOW_UI_FIXTURES and TECHYFELLOW_UI_ARTIFACTS to local tooling/private fixture/artifact paths.
node frontend/test/services-browser.mjs
docker compose -p techyfellow-step13-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step13.local.yml exec -T backend node test/services-fixtures.mjs cleanup < /tmp/techyfellow-step13-fixtures.json
docker compose -p techyfellow-step13-check -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.step13.local.yml down
```

The helper refuses any other database/environment, requires an empty DB for seed and an ownership marker for cleanup. Published/draft/archived/future records and the administrator are explicitly synthetic. Matching Robotics category/domain strings do not establish service relevance. The browser suite checks all 14 routes, every rendered internal destination, metadata/breadcrumbs, unknown slugs, all-route mobile overflow, keyboard/menu/FAQ/reduced-motion behavior and existing real public/admin flows. It stops only the owned backend to verify scopes remain readable without a fake related section, then restarts it. Scope and related-data caches remain separate. Screenshots are outside the repository at `/tmp/techyfellow-step13-browser/artifacts`.

See progress.md for actual results/cleanup. Full accessibility/cross-browser audits, positive approved-reference rendering and deployment are not verified in this step.
