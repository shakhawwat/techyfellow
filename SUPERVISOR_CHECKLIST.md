# Supervisor checklist — Techy Fellow

Date: 2026-10-09, Asia/Dhaka. Scope: source handover; no deployment, redesign or runtime data changes.
Current instructions: `HANDOVER.md`. Historical `README.md` and `docs/progress.md` are included
for provenance; older statements about missing Store pages/controls are not current acceptance results.

## Verification results

| Check | Result | Evidence / scope |
| --- | --- | --- |
| Frontend lint | PASS | `npm run lint`, exit 0. |
| Frontend typecheck | PASS | `npm run typecheck`, generated routes + TypeScript, exit 0. |
| Frontend local tests | PASS | `node --test test/*.test.mjs`, all 4 test files pass: inquiry, media hostname, public content and public pages. |
| Frontend production build | PASS | `npm run build`, exit 0; standalone SSR routes preserved. Host sandbox required escalation for Next's build subprocess. |
| Backend lint/typecheck/production build | PASS | `npm run lint`, `npm run typecheck`, `npm run build`, each exit 0. |
| Backend policy/validation/config tests | PASS | 7 test files: account, auth, health/config, public query, lead input, protected content input and media validation. |
| Production Docker image builds | PASS | Both existing Dockerfiles, target production; pinned npm lockfiles / clean `npm ci`; images built without starting a production deployment. |
| Compose validation | PASS | Existing local development pair plus local override; production pair with non-secret DB/origin placeholders. Placeholder validation is not connectivity/hosting verification. |
| Account integration | PASS | Existing guarded account suite on ephemeral rs0; registration/privilege boundaries, sessions, verification lifecycle and mocked delivery; live email off. |
| Admin auth and production-mode policy integration | PASS | Existing auth and auth-production suites, isolated synthetic databases; production-mode cookie/proxy behavior over private HTTP, not public TLS. |
| Published-content integration | PASS | Real API and MongoDB on the guarded Step 6 test database. |
| Protected admin-content integration | PASS | Guarded Step 8 suite including permissions, lifecycle/revisions and transactional audits. |
| Inquiry/lead integration | PASS | Guarded Step 15 suite plus `leads-final.integration.mjs` wire/privacy/concurrency checks and ownership-verified cleanup. Ran against isolated test API, not the production image or runtime DB. |
| Media integration | PASS | Existing Step 10 suite: actual HTTP/transactions and image validation; R2 transport simulated. Guarded cleanup confirmed. |
| Disabled notification-worker behavior | PASS | `local-start-smoke.mjs`: owned test DB, inquiry/job persistence, idempotent retries, zero provider calls while disabled; test DB removed. |
| Public help launcher placement | PASS | Installed Chrome: exactly 1 on /, /solutions, /research, /academy, /contact, /store/kits, /login, /signup, /about, /team; 0 on /admin/login. |
| Help navigation and keyboard | PASS | Open/history and minimized/history survive Next client navigation; Escape closes and restores launcher focus. |
| Help mobile placement | PASS | Launcher/panel bounds at 320, 390, 768px; no horizontal page overflow on checked account page; synthetic fixed bottom notice clearance; reduced-motion transition disabled. |
| Latest banner/team changes | PASS | Chrome: first banner numbered indicators/Pause control absent; center profile clear, neighbor blur reduced after hover/focus settled. |
| Public asset audit | PASS | See docs/handover-assets.md. Unused disguised Word document excluded; 25 actual JPEGs and one MP4 retained with original bytes. |
| Working local runtime preserved | PASS | Original service container identities unchanged; five long-running services healthy, initializer remains exited 0; public/account/admin-login pages and API live/ready returned 200. Temporary verification project removed; original techyfellow-dev left running. |
| ZIP inventory, exclusion and checksum audit | PASS | ZIP integrity tested; source/assets/templates/Docker/Compose/docs required entries present; no real env files, dependency/build trees, logs, backups/uploads or disguised document included; per-file manifest and external ZIP checksum validated. |

## Failed attempts, resolved verification setup issues and warnings

These attempts are recorded rather than concealed; the passing results above refer to completed retries.
Application source was not changed to make tests pass.

- FAIL, initial temporary admin-content runner: CORS preflight returned 404 instead of 204 because
  its temporary origin list omitted localhost:3000. Corrected only test-runner origins; suite passed.
- FAIL, initial media runner: missing synthetic stdin `users` fixture; corrected only temporary
  generated input. A cleanup assertion also failed because the failing suite had already removed
  its owned test DB. The completed retry verified ownership and cleanup successfully.
- FAIL, media retry: isolated MongoDB terminated (exit 139) with `TooManyFilesOpen`, causing
  `MongoNetworkError`. Retried using **test-only** MongoDB nofile soft/hard 65536; suite passed.
  No working runtime limits or database settings were changed. Provider must confirm suitable limits.
- Temporary snap-Docker verification override first placed under /tmp was inaccessible to Compose;
  used a temporary project-root override, then removed it. This was a runner path issue.
- Browser-runner attempts failed on DOM serialization, nested selector quoting and an immediate
  blur assertion while hover/focus/transition state was unsettled. Corrected the temporary CDP
  script and allowed state to settle; the final targeted browser run passed.
- Integration output contains Mongoose deprecation warnings for `new` on findOneAndUpdate;
  tests pass. Schedule a separately reviewed compatibility cleanup, preserving behavior.
- Asset `banner/idea2.jpg` is 12000×7685 (92,220,000 pixels); image tooling emitted a large-image
  warning. Approve an optimized derivative/performance review before launch; original bytes retained.

## Unavailable or out-of-scope checks

| Check | Result | Launch dependency / limitation |
| --- | --- | --- |
| EBN Ultimate-A actual Node/Docker/worker capabilities | NOT RUN | Client reports no shell; provider confirmation and operational workflow absent. No EBN login/deployment attempted. |
| Public DNS/HTTPS/certificate renewal/cookie behavior | NOT RUN | Approved domain, edge/proxy configuration and public infrastructure not supplied. |
| Real R2 upload/delivery/CDN | NOT RUN | Approved isolated bucket/domain and scoped real credentials not supplied; storage tests are simulated. |
| Real Resend/inbox verification | NOT RUN | Approved sender/recipient/provider credentials absent; local delivery intentionally disabled. |
| Full enabled inquiry email retry/lease/terminal-failure acceptance | NOT RUN | Disabled smoke and mocked account delivery do not cover the complete enabled inquiry-worker acceptance suite. |
| Live-user browser registration/login/logout/verification | NOT RUN | No real account/credential was created or supplied; endpoint integration tested independently with synthetic accounts. |
| Help account-context reset in authenticated browser | NOT RUN | Source has account-keyed reset; actual authenticated frontend logout scenario was not performed during handover. |
| Full existing browser-script matrix / all viewport/pages | NOT RUN | Targeted installed-Chrome checks only; no new Playwright dependency or runtime-content fixtures installed. |
| Real mobile keyboard/notch/safe-area hardware | NOT RUN | Emulated viewport bounds and visual-viewport CSS reviewed; no physical device tests. |
| Production-image end-to-end runtime / soak/load/failover | NOT RUN | Images built; original dev stack retained and isolated test-mode/production-mode policy checks only. |
| Backup restoration / release rollback drill | NOT RUN | Procedures documented; no runtime backup, restore, release switch or data deletion performed. |
| Static export | NOT RUN | Current source requires server runtimes; separate redesign proposal in HANDOVER.md, no feature removal. |
| Asset licenses/portrait consent/company legal facts | NOT RUN | Local file inspection cannot establish approval, ownership, consent or verified business facts. |
| Video audio/content beyond sampled frames | NOT RUN | MP4 decoded and three frames visually inspected; no full soundtrack/transcript review. |

## Supervisor acceptance and launch dependencies

- [ ] Confirm the source ZIP checksum and compare its per-file manifest before distributing/building.
- [ ] Read HANDOVER.md and allocate named development, deployment, backup, security and content owners.
- [ ] Obtain written EBN confirmation of **every** required capability listed in HANDOVER.md.
      If unavailable, approve a compatible VPS/container host; do not upload this source to public_html
      expecting it to run. A separate static-front-end proposal still requires externally hosted APIs/worker/DB.
- [ ] Provision authenticated transaction-capable MongoDB with TLS, network rules, snapshots and restore access.
- [ ] Supply secrets through an approved separate secure transfer; keep them out of the ZIP/browser/build args.
      Do not reuse test fixture keys. Confirm secret/key recovery and revocation/rotation ownership.
- [ ] Configure exact production origins, canonical domain, HTTPS, verified proxy trust and image/API routing.
- [ ] Create explicit indexes and securely bootstrap the intended administrator; verify HTTPS role boundaries.
- [ ] Configure and verify real R2 and approved media domain, then rebuild frontend for the matching public hostname.
- [ ] Configure approved email sender/recipient/provider and persistent worker; approve handling of existing
      queued jobs; complete real inbox and enabled-worker acceptance before enabling delivery.
- [ ] Resolve/approve verification UI, resend/password recovery and account assistance expectations.
- [ ] Replace/approve fictional team profiles, portrait consent, demo ratings, publication/research concepts,
      course/kit prices/discounts, mentor availability and generic social links; see exact sources in HANDOVER.md.
- [ ] Approve company identity/contact/privacy/legal/terms, brand/photo/video licenses and optimized images.
- [ ] Remove/quarantine the disguised `frontend/public/brand/logo.jpeg` in any original working copy before
      deployment. It is already absent from the clean source ZIP and was not deleted from the local system.
- [ ] Agree that concept kits have no checkout/stock/payments and Academy has no LMS/confirmed enrollment;
      schedule those features separately if required rather than claiming they exist.
- [ ] Perform physical-mobile, full browser, live-user, load/security/soak and failover checks on staging.
- [ ] Complete backup/restore and release rollback drills with compatible DB/media/key snapshots.
- [ ] Obtain explicit launch authorization only after the dependencies/checks are satisfied. No deployment
      is included in this handover.

## Evidence handling

Raw execution output and temporary generated fixtures were kept outside the ZIP under
`/tmp/techyfellow-handover-checks` on the preparation machine. They are not durable shipped evidence
and contain no intentionally supplied live credentials. This checklist is the portable result record.
The ZIP omits logs, databases, real accounts and uploads. Repository Git metadata is unusable in
this workspace; source integrity is recorded with file checksums rather than a claimed commit ID.
