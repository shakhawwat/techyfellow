# Progress

## Completed

- Steps 1–4: separate applications, Docker/Nginx and private MongoDB replica set; builds, runtime health, transactions and outage/recovery passed.
- Step 5: design system/guarded preview; frontend and Chrome desktop/mobile/keyboard checks passed, production preview 404.
- Step 6: published-only content APIs, DTO/query allowlists and explicit indexes; isolated public validation/visibility/index checks passed.
- Step 7: Argon2id, hashed opaque sessions, permissions, CSRF/CORS/throttling/audits and explicit bootstrap; isolated lifecycle/role/cookie checks passed.
- Step 8: protected five-resource CRUD/lifecycle, revision checks and transactional audits; actual flows/forced rollback/public regressions passed. Published edits require publish permission.
- Step 9: protected admin login, navigation, five editors and revision review; frontend builds and Chrome/real API workflow/roles/expiry/keyboard/mobile checks passed, synthetic data cleaned.
- Step 10: backend-controlled R2 image storage, scoped media schema/DTOs/APIs/audits, full decoding/re-encoding/limits, failed-upload reconciliation and ready-reference validation. Admin library, upload progress/error states, metadata edits and existing project gallery selection; exact approved image-host configuration. No cover/profile schema expansion, permanent deletion, local fallback or deployment.

- Step 11: server-rendered public homepage/layout, responsive shared navigation/footer, blueprint positioning, published API sections and bounded public-only cache. Admin remains separate; no remaining public pages, inquiry forms or checkout.

- Step 12: server-rendered projects/research/publications lists and details, URL-based API filters/pagination, editorial publication layout, readable technical fields and approved-image galleries. Homepage previews link to implemented routes. Bounded public caching, safe links/text/JSON-LD, metadata/canonical configuration, loading/empty/unavailable states and genuine detail 404s; no unrelated pages/modules or deployment.

- Step 13: all 14 solutions/consulting/institutional routes, typed proposed-scope configuration and shared templates. Audience/problems/capabilities, indicative deliverables, process/responsibilities, institutional procurement context and visible capstone academic responsibility. Navigation/homepage discovery, metadata/canonical breadcrumbs and native FAQs; no new backend modules, forms, bookings or deployment.

- Step 14: Academy/catalog/course details, About and team list/profile routes. Published API rendering with URL filters/pagination, curriculum/profile fields, approved safe links, real 404s, explicit empty/outage states, bounded caching, metadata/canonical/breadcrumbs and updated navigation/homepage previews. Unsupported enrollment facts/photos omitted; no backend modules, accounts/LMS/payments/forms or deployment.

- Step 15: seven typed inquiry submissions with independent acknowledgment/marketing consent, wire/text limits, honeypot, persistent throttling and indexed idempotency. Private lead list/detail/revision updates, eligible assignments, append-only notes and atomic audits. SUPER_ADMIN and lead-only SALES_MANAGER permissions; explicit environment-only manager command. Admin list/detail screens with filters/pagination/states, confirmation and preserved conflict input. No public forms, email or deployment.

- Step 16: `/build-with-us` and `/contact`, one typed React Hook Form/Zod form for seven existing inquiry types, published-course inline interest form and contextual research/consulting/institutional/Academy/homepage CTAs. Separate acknowledgment/marketing consent, bounded validation, allowlisted type prefill, per-payload retry keys, confirmed receipts, preserved input and accessible error/status/focus states. No backend application changes, email or deployment.

## Step 16 checks

- PASS: `npm run lint --prefix frontend`, `npm run typecheck --prefix frontend`; focused lint of the guarded backend fixture helper. React Hook Form 7.85.0 / Zod 4.5.4 pinned with generated npm lockfile; production Docker image built with `npm ci` and `npm run build`. Initial sandbox host build failed on TypeScript `--showConfig`; final container build passed. Browser testing caught native fetch invocation and the implementation was corrected before successful verification.
- PASS: `node --test frontend/test/inquiry.test.mjs` — seven-type validation, consent/unknown/type-specific fields, lengths/calendar/payload bounds, safe prefill, concurrent-click suppression, unchanged/corrected/restored retry keys, strict acknowledgments, conflict restart and throttling. Simulated transport unit tests are distinguished from runtime checks.
- PASS: actual production frontend + existing verified backend through Nginx on loopback 12087, owned Compose project `techyfellow-step16-check`, exact replica-set DB `techyfellow_test_step16`. All seven types persisted and appeared in admin list/detail. Client invalid input produced no POST; genuine API field errors retained input and recovery worked.
- PASS: Chrome double-click plus lost response after real persistence followed by unchanged retry created one lead. Genuine 409 preserved input, required explicit separate-inquiry intent; genuine 429 preserved input, prevented premature retry and recovered. Actual owned-backend stop/recovery retained input without false success, then persisted once. Browser clock/counter manipulation was limited to isolated throttling recovery.
- PASS: contextual CTA types, direct published-course preselection, unknown-type fallback, type switching excludes inactive fields, separate unchecked marketing consent, cookie-free public requests and empty browser storage. Keyboard submission, error-summary/receipt focus, fresh inquiry reset, mobile menu Escape/focus, reduced-motion focus and noindex/no-referrer metadata. 320/390/768/1440px without overflow; `/tmp/techyfellow-step16-desktop.png` and `-mobile.png` visually reviewed. Sampled owned frontend/backend/Nginx logs exclude synthetic contact values/context and private password.
- PASS: `docker compose ... config --quiet`; guarded cleanup dropped and verified the exact synthetic DB empty. Scoped `down` removed owned containers/network; `ps --all --quiet` empty and persistent volume retained. Unrelated localhost:8080 service preserved; private fixture and ignored override removed. Commands, runner resume flags and retry/privacy limits: [inquiry-forms.md](inquiry-forms.md).
- NOT RUN: comprehensive accessibility/cross-browser audit (focused Chrome checks only). Email/provider/deployment checks are outside Step 16; no production-readiness claim.

## Step 20 prerequisite check

- Step 20 has not started: the required R1 gate is not satisfied.
- FAIL at the Step 20 gate: `npm run typecheck` from `backend/` returned TypeScript errors in `src/notifications/processor.ts` (lease-filter typing) and `src/notifications/worker.ts` (Mongoose model typing). These partial Step 17 typing errors were subsequently fixed for local startup. Step 17 is still not complete or fully verified.
- Required `docs/r1-acceptance.md` is absent. No separate store blueprint was found in the project tree; only the previously supplied Full Project Documentation is available. Steps 18–19 have no completion/acceptance record here.
- NOT RUN: catalog implementation, build/lint and isolated catalog database checks, because prerequisites failed. No catalog schemas/routes, deployment or real email delivery were added.

## Public navbar redesign

- Complete: public-only `PublicNavbar` and scoped CSS module; admin/design-system Navbar, footer, hero, backend and Docker remain unchanged. Existing Geist/container/tokens reused; no dependencies added. Polished wordmark used because no approved logo asset is supplied.
- Home → Solutions → Research → Academy → Consulting → Store preview → Company → Build With Us. Click-based disclosure dropdowns link only to existing routes; Workshops omitted. Exact Home matching, section/child indicators and working `/#store` preview retained.
- Sticky navy header, low-opacity non-interactive grid confined to its bounds, white text/cyan CTA, 180ms restrained transitions, opaque blur fallback and stronger scrolled shadow without height changes. 76px desktop / 64px mobile; mobile switch below 1280px, expandable native-dialog panel, full-width CTA, focus trapping/restoration, Escape/outside/route/resize dismissal and scroll locking. Public-only anchor offset does not alter admin styling.
- PASS: frontend `npm run lint`, `npm run typecheck`, final `npm run build`; focused lint of the browser runner. Chrome at 320/390/768/1024/1279/1280/1440px: no overflow, height/breakpoint checks, dropdown order/click/arrow keys/Escape/outside behavior, exact Home and related-route active states, sticky shadow/height and Store anchor clearance. Mobile expansion, focus trap/return, route/resize dismissal, scroll unlock, reduced motion and visible keyboard focus passed. Initial programmatic-focus assertion was corrected to test actual keyboard input; runner resumed with `TECHYFELLOW_NAVBAR_FOCUS_ONLY=1` to avoid repeating passed flows.
- PASS: all 22 navbar destinations resolve; minimum mobile controls 44px, scroll locking preserves wordmark geometry, admin retains its original anchor offset/login UI, no JavaScript or hydration console errors. Desktop/tablet/320px screenshots `/tmp/techyfellow-navbar-{desktop,tablet,mobile}.png` visually reviewed. Browser runner: `TECHYFELLOW_PLAYWRIGHT_MODULE=/tmp/techyfellow-step5-browser/node_modules/playwright/index.mjs node frontend/test/public-navbar-browser.mjs`.
- Preview remains http://localhost:8081; existing services left running, email disabled, no deployment. Chrome verification is not a comprehensive accessibility or cross-browser audit.

## Navbar hover refinement

- Refined only public-navbar hover styles: cyan text/highlight and animated underline, submenu arrows, restrained CTA shadow, 180ms transitions and reduced-motion support. Layout, routes, sticky behavior and mobile disclosure mechanics preserved.
- Fine-pointer desktop hover opens after 120ms and closes after 200ms, with a transparent gap bridge. One open group; pending timers canceled on switching, clicks, Escape, navigation and unmount. Hover does not move focus; focused submenu links remain available when the pointer leaves.
- PASS: frontend `npm run lint`, `npm run typecheck`, `npm run build`. An initial React/native pointer-event type collision was corrected; typecheck and build subsequently passed.
- PASS: local Chrome pointer bridge, rapid switching, delayed dismissal, pending cancellation, click toggle, keyboard arrows/Escape, reduced motion and touch menu expansion/scroll unlock. Reproduce from frontend: `TECHYFELLOW_PLAYWRIGHT_MODULE=/tmp/techyfellow-step5-browser/node_modules/playwright/index.mjs node test/public-navbar-hover-browser.mjs`. No data created, services stopped or deployment performed.

## Navbar logo video

- Verified `public/brand/logo.mp4` exists (368 × 368). Public navbar uses `/brand/logo.mp4`, muted autoplay/inline once per document, without loop/controls. Reserved 48px mobile/56px desktop media dimensions preserve aspect ratio; accessible home link is “Techy Fellow — Home”.
- Existing valid `icon_logo.jpeg` supplies the static fallback; text covers image failure. `logo.jpeg` is a Word document despite its extension and is not used. Reduced motion skips playback; rejection/error/loading timeout shows fallback. Client navigation and rerenders do not replay; full reload permits playback.
- PASS: frontend lint/typecheck/production build; Chrome actual playback/end fallback, reload versus client navigation, unchanged logo box, reduced motion, simulated autoplay rejection/media-network failure and 320px mobile playback/menu. Test: `TECHYFELLOW_PLAYWRIGHT_MODULE=/tmp/techyfellow-step5-browser/node_modules/playwright/index.mjs node test/navbar-logo-browser.mjs` from frontend. No backend changes or deployment.

## Navbar typography and underline refinement

- Public navbar labels use weight 600; submenu/overview links use 500. Desktop cyan underline grows from the left over 200ms on hover/keyboard focus and remains visible for active routes or open disclosures. Mobile active rows use a static inset cyan indicator. Absolute underline placement preserves geometry; reduced motion makes changes immediate.
- PASS: frontend `npm run lint`, `npm run typecheck`, `npm run build`. Local Chrome verified weights, underline color/origin/timing, hover/keyboard focus, open submenu, Home exact matching and all five section route groups, unchanged label dimensions, reduced motion and 320px mobile height/overflow/static indicator. No logo, route, submenu timing, backend or deployment changes.

## Navbar background refinement

- Changed only public navbar background CSS: desktop navy opacity .75 with 12px supported backdrop blur, .92 after scrolling; mobile .92/.96. Unsupported blur retains opaque navy. Thin cyan-tinted border, subtle shadow, 4% grid and sparse static circuit accents. Decoration alone is clipped/noninteractive; header overflow stays visible for dropdowns. No height, logo, navigation or backend changes.
- PASS: frontend lint/typecheck/production build; Chrome sticky scrolling/unchanged heights, opacity/blur, decoration clipping, dropdown hit-testing/navigation, mobile opaque panel/320px overflow, reduced motion. Desktop/mobile screenshots inspected for readability. Unsupported-browser fallback supplied in base CSS; runtime in an unsupported browser NOT RUN (Chrome supports blur). No deployment.

## Homepage hero slider

- Replaced only the first homepage hero with Engineering, Research and Academy slides using supplied copy and existing CTA routes. Reuses Container/Button/Lucide; typed copy kept separate. Navy CSS grid/circuit visuals are decorative; no new images/dependencies/backend changes. Navbar and remaining sections preserved.
- Shared-grid slide sizing reserves the tallest slide at each breakpoint. 450ms fade; inactive slides are inert and aria-hidden. Six-second autoplay pauses on hover/focus/document-hidden; manual controls pause until explicitly resumed. Reduced motion disables autoplay/fades. No automatic live announcements or touch-scroll interception.
- PASS: frontend lint/typecheck/production build; real Chrome six-second autoplay, hover/focus pause, persistent manual pause/resume, keyboard/indicators, all CTA hrefs, hidden-slide inertness, desktop and 320/390/768px height/overflow, reduced motion. Simulated document visibility events verified pause/recovery; real background-tab behavior NOT RUN. Desktop/mobile screenshots visually inspected. Browser test from frontend: `TECHYFELLOW_PLAYWRIGHT_MODULE=/tmp/techyfellow-step5-browser/node_modules/playwright/index.mjs node test/hero-slider-browser.mjs`.
- Required assets: none; CSS decoration used instead of unavailable approved hero imagery. No deployment.

## Hero editorial redesign

- Changed only hero markup/styles: removed graphic panel/circuit visuals and large control bar; shared-container left-aligned 600px copy, 48–72px desktop / 32–42px mobile type, prominent CTA and discreet bottom controls. Existing slide copy/routes, pause/autoplay/inert/reduced-motion logic retained. Desktop height reaches 680px; mobile is content-driven with shared slide sizing.
- Missing: approved robotics/hardware/lab banner photography. Project assets contain only logos/video (logo.jpeg is not a real image). Plain navy gradient remains intentionally; photographic background/overlay and image crops cannot be completed/verified without approved assets. No substitute company imagery generated.
- PASS: frontend lint/typecheck/final production build; Chrome controls/keyboard/manual pause, three CTA targets, stable per-viewport slide heights, 320/390/768px overflow and reduced motion. Fresh desktop/mobile screenshots inspected at `/tmp/techyfellow-editorial-desktop.png` and `/tmp/techyfellow-editorial-mobile.png`. Preview `http://localhost:8081`. Navbar and following sections preserved; no deployment.

## Supplied slider banner images

- Verified and inspected unchanged supplied JPEGs: b1 2400×1713 hardware, b2 5120×2880 circuit-head artwork, b3 4069×2160 network artwork; no embedded headings. Assigned `/banner/b1.jpg`, `/banner/b2.jpg`, `/banner/b3.jpg` in order using Next Image/fill with stable frame dimensions and first-slide-only priority.
- Desktop uses full-width cover positioning with left text gradient; mobile uses a separate 16:9 frame and contain to preserve entire images, with copy below and no image overlay. Slider behavior, navbar and following sections unchanged. Original-file SHA-256 verification PASS.
- PASS: frontend lint/typecheck/production build; Chrome all three image loads/order, priority, desktop/mobile sizing/stable heights, keyboard/manual pause and reduced motion. All three desktop and 320px previews visually inspected for image content/readability; 390px previews captured. Preview `http://localhost:8081`. No missing banner assets or deployment.

## Slider left-to-right transition

- Added 450ms left-to-right banner motion with restrained text motion, retaining slider controls/images/routes. Reduced motion disables both translation and animation. Navbar and remaining sections untouched.
- PASS: frontend lint/typecheck/production build; Chrome verified negative-to-zero incoming translation, settled position, 320px overflow and immediate reduced-motion changes. No deployment.

## Darker navbar background

- Increased only public navbar navy opacity: desktop .94/.97 on scroll; mobile .97/.99. Blur, opaque fallback, decoration and all navigation/slider behavior preserved.
- PASS: frontend lint/typecheck/build; Chrome verified desktop/mobile initial and scrolled background values. No deployment.

## Reference-guided navbar and hero refinement

- Visually inspected actual rendered Linear, Nothing (after region-dialog dismissal) and Halden Partners reference pages in Chrome. Halden failed web extraction but rendered successfully in Chrome. Screenshots `/tmp/techyfellow-reference-{linear,halden}.png` and `/tmp/techyfellow-reference-nothing-home.png`. No reference assets/fonts copied.
- Scoped navbar/hero changes only: charcoal surfaces, off-white text, fine neutral borders/indicators, reduced blur, removed navbar grid/circuit decoration. Cyan retained mainly for CTAs/focus. Hero uses clearer Geist Sans hierarchy plus existing Geist Mono numbered eyebrows/indicators. Supplied banner files are hash-identical; desktop overlay/mobile complete-image presentation preserved. Logo video and all navigation/slider logic retained.
- PASS: frontend lint/typecheck/build; Chrome image/order/priority/desktop/mobile size and reduced motion; navbar hover timer bridge/rapid switching/click/keyboard/Escape/touch/scroll unlock. Updated old browser-test heading selector to target the accessible heading rather than all three slide DOM headings. Fresh desktop/mobile screenshots visually inspected. Preview `http://localhost:8081`. No dependencies, backend changes, lower-section redesign or deployment.

## Approved opening sections — static hero and audience pathways

- Replaced slider with approved “From research. / To working systems.” static hero, two real actions and unchanged b1 hardware image (2400×1713) shown uncropped. All three supplied images inspected; no embedded banner copy. Text precedes image on mobile. Local charcoal/mono/sans styling only.
- Replaced former four-pillar overview with approved three audience panels directly below hero. Removed unused slider component/styles/content and obsolete slider-only browser test after confirming no other component consumers. Remaining homepage sections and API fetching unchanged.
- PASS: frontend lint/typecheck/final build; Chrome desktop and 320/390/768px layout, complete image ratio, three equal/stacked panels, all five CTA routes HTTP 200, keyboard focus/reduced motion/no horizontal overflow. Desktop/mobile previews inspected. Preserved-file and remaining-markup hashes passed. Preview `http://localhost:8081`. No dependencies or deployment. Next: Featured engineering work.

## Slider restored by user request

- Restored the previous three-image slider, original slide copy/CTAs, left-to-right transitions and accessible autoplay/pause controls. Static replacement removed from rendered homepage; new audience pathways retained below slider. Navbar and remaining sections preserved.
- PASS: frontend lint/typecheck/build; Chrome image order/load, first-only priority, stable desktop/mobile sizing, keyboard/manual pause and reduced motion. Preview `http://localhost:8081`; no deployment.

## Find Your Direction section redesign

- Changed only audience component/local styles: deliberate two-line heading with static muted-to-bright emphasis; three equal charcoal cards with Lucide BriefcaseBusiness/GraduationCap/FlaskConical, 16px corners, confined faint texture and one full-card relative link each. Copy/order/location preserved.
- Added 210ms hover/keyboard focus states (3px lift/arrow travel), and native IntersectionObserver/Web Animations one-time 12px/500ms reveal with 90ms stagger. Base content is visible; reduced motion skips/cancels reveal and lift.
- PASS: frontend lint/typecheck/build; Chrome desktop/mobile appearance, equal/stacked cards, all three destinations 200, keyboard focus, hover, no repeat reveal, reduced motion and JavaScript-disabled visibility. Hashes confirm hero/navbar/homepage/global styles/content unchanged. Preview `http://localhost:8081`; no dependency/backend/deployment changes.

## Current local runtime

- Running: `techyfellow-dev` frontend/backend/MongoDB/Nginx/notification-worker; five healthy services, initializer exited 0. Nginx binds only `127.0.0.1:8081`; unrelated localhost:8080 service and existing volumes preserved. Runtime database has no admin account; no credentials or company content invented. Stack deliberately left running.
- Fixed startup: notification typing, worker watch entry point, missing Compose worker service, MongoDB heartbeat while paused, and ordered transactional multi-job creation. PASS: backend lint/typecheck/build and dev/prod merged Compose validation. Live delivery forced off with empty provider settings in retained ignored local override.
- PASS: documented Compose startup/index commands; Nginx homepage/admin-login and all 25 implemented frontend routes; five public APIs; live/ready 200 expected JSON; MongoDB ping/rs0 writable primary; missing details 404. Chrome homepage/store-anchor/login fields/anonymous redirect/inquiry/mobile checks passed without JS exceptions.
- PASS: isolated synthetic inquiry/job persistence and deduplicated retries; disabled processing retains unsent jobs with zero provider calls. Guarded test DB cleaned; real runtime data untouched. Details and exact commands: [local-run.md](local-run.md).
- NOT RUN: actual admin credential sign-in (no supplied credentials/users), live email/R2 delivery, enabled-worker acceptance tests and deployment. Store catalog/routes remain unimplemented (observed 404s); Step 17 and R1 acceptance remain unfinished.

## Blockers/limitations

- Real R2 verification needs isolated bucket-scoped test credentials and approved public domain. Uploads remain explicitly unavailable without complete configuration; public previews require the matching build-time hostname.
- Full Project Documentation located at `../../doc/Techy_Fellow_Full_Project_Documentation.docx` (relative to the project root); public scopes use its audience, route and section guidance; expanded service copy is explicitly proposed. Separately referenced original landing/store blueprints are not supplied. Usable Git metadata remains unavailable; existing generated lockfiles cannot be committed here.
- Existing unrelated service occupies localhost:8080; Step 16 checks used 12087. EBN/TLS remain unverified; MongoDB is development-only. Reconciliation is an explicit operator command, not an automatic scheduler. See docs/media.md for API/configuration/recovery details.

- Approved images and verified contact/legal/domain details are unavailable; the homepage uses CSS decoration and explicit availability messages, without fabricated facts.

## Next

- Step 17 — durable inquiry email notifications.

## Engineering services and featured projects refinement

- Changed only the two homepage sections and their new local component/styles: charcoal 2×2/stacked service panels, Bot/Radio/Cpu/FlaskConical, approved heading/cyan accent, fine angular details, edge circuitry and soft background seams. Retained supporting copy, section order, matching existing service links and both section CTAs; research engineering stays unlinked because no matching solutions route exists.
- Preserved published-project loading and approved-image filtering. Up to three actual records render as one large feature and two compact previews; records without approved images remain text-led. Compact FolderOpen empty state and distinct unavailable state retain existing messages. Native one-time reveal, reduced motion and visible keyboard focus; no dependencies, backend/API or other section changes, no deployment.
- PASS: frontend lint/typecheck/production build (host build required sandbox escalation); Chrome 1440/390/320px grid/stacking, no overflow, real empty state, keyboard focus, reduced motion and all five link destinations; desktop/mobile section screenshots inspected. Isolated render checks passed populated/empty/error branches, three-record cap, detail links and approved-image gate without database writes. Local stack remains healthy at http://localhost:8081 with emails disabled.
- NOT RUN: live populated project/image and backend-failure browser scenarios; runtime project list is empty and no runtime data or backend availability was changed for testing.

## Public account backend — Step 1 (2026-10-08)

- Added `/api/v1/account/register`, `/login`, `/logout`, `/me` and `/verify-email`; exact server validation, normalized unique email, existing Argon2id, insert-only MEMBER with zero admin grants, safe responses and no marketing consent. Public/admin cookie sessions are explicitly shared; rotation and either logout revoke the current browser session. Existing admin grants and `/auth` response shapes are preserved.
- Added one-hour single-use hashed verification codes, transactional consumption and an encrypted account-verification delivery queue using the existing provider/worker. Optional backend-only `ACCOUNT_VERIFICATION_KEY` and approved sender are required to queue; provider configuration and explicit EMAIL_ENABLED=true are required to deliver. Unconfigured/disabled verification never marks users verified. Added `requireVerifiedMember` for future sensitive transactions, with no payments/enrollment or frontend screens introduced. Contract and isolated commands: [accounts.md](accounts.md).
- PASS: backend lint/typecheck/build; account/auth/configuration/public-query plus lead/admin-content/media validation suites; isolated registration/duplicate/concurrent uniqueness and privilege-field tests; MEMBER denial of admin routes; login/logout/rotation/expiry/disabled accounts; CSRF/trusted origins/email/IP throttling; shared admin/public logout; hashed/encrypted tokens, mocked delivery, replay/expiry/concurrent consumption and disabled-account verification rollback. Existing unmodified admin-auth and production-mode cookie/proxy-throttle integration suites passed.
- Tests ran on a private Compose network with temporary MongoDB storage, exact empty synthetic DB guards and EMAIL_ENABLED=false. Delivery was mocked; no runtime accounts were created, overwritten or verified. Synthetic databases were removed by their owning tests; the private test stack was stopped afterward. Added a portable private-only test fixture and npm test:account command.
- Created verification indexes through the existing explicit non-destructive command. Cleared an orphan development watcher port conflict by restarting only the local backend/worker. Five original services remain healthy at http://localhost:8081; live/ready 200 and anonymous `/account/me` 401. Existing MongoDB volumes and unrelated services were preserved; no deployment.
- Blocker: local EMAIL_FROM/provider settings and ACCOUNT_VERIFICATION_KEY are missing and EMAIL_ENABLED remains false. Real verification delivery/inbox checks and browser HTTPS/TLS are NOT RUN. Verification UI and resend/recovery are future work; missing-config accounts remain unverified.
- Next: Public signup/login screens.

## Public navbar account controls (2026-10-08)

- Added session-aware public navigation: Log in/Create account, compact named user disclosure and CSRF-protected logout. Neutral loading state and retry on session-service errors; mobile actions stay inside navigation. Desktop navigation begins at 1440px with a locally wider container to avoid crowding. Existing logo/dropdown/sticky behavior and admin authentication are preserved.
- Added minimal `/login` and `/signup` forms connected to the existing public account API, including password confirmation, generic errors and honest verification availability. Cookie credentials only; no localStorage/session-token storage. No account page was invented. Public/admin sessions remain shared as documented in accounts.md; navbar logout revokes that same current session.
- PASS: frontend lint/typecheck/production build. Browser account fixtures verified logged-out/logged-in controls, login, failed/successful logout, credentials/CSRF headers, signup validation/payload and verification notice; responsive navigation/no overflow at 1440/1400/1024/390/320px; authenticated mobile disclosure, Escape/focus restoration and logout. No live accounts or data were created for frontend checks.
- NOT RUN: live-user frontend registration/login/logout and verification email delivery. Existing backend integration tests cover the actual endpoints separately. Live email stays disabled; no deployment or backend changes.
