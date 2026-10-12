# Academy management

The existing admin session and permission policy protects `/admin/academy` and all management APIs. SUPER_ADMIN and ACADEMY_MANAGER have course-edit permissions; publishing retains the existing `courses:publish` requirement (SUPER_ADMIN). MEMBER accounts remain denied. The previously observed local denial was a member session, not an origin mismatch: the actual browser origin `http://localhost:8081` is already configured. No accounts were promoted or passwords reset.

## Routes

- `/admin/academy`: actual course/enrollment/order/scholarship/redemption counts and state breakdowns.
- `/admin/academy/courses`: searchable, paginated courses filtered by draft/published/archived state.
- `/admin/academy/courses/new` and `/admin/academy/courses/[id]`: existing course CRUD plus structured learning configuration.
- `/admin/academy/scholarships`: existing generator, identifier/label/recipient/state search, revocation, redemption details and administrative audits.
- `/admin/academy/enrollments`: actual records and authorized grant/revoke with a required reason.
- `/admin/academy/orders`: actual single/multiple-course orders, learners, totals and statuses. No manual paid-status action.

The old `/admin/courses`, `/admin/academy-access` and `/admin/media` remain available. The Academy management API under `/api/v1/admin/academy/management` orchestrates existing content CRUD, Academy access configuration, orders, enrollment, code generation and media storage; there is no second enrollment/order/promo model.

## Create and upload a course

1. Use an existing authorized administrator account. Choose **Create course**, enter title/slug, descriptions, category, level, outcomes, audience, prerequisites, tools and approved instructor information.
2. Enter approved BDT prices and optional sale dates. Blank regular price is unconfigured, zero is explicitly free. Existing regular/sale values are loaded unchanged. Server validation stores integer paisa and keeps the existing best-single-discount policy.
3. Choose **Upload / choose thumbnail** or **Upload / add gallery image**. This reuses the existing course-scoped JPEG/PNG/WebP image library, upload progress, decoded image/file-size validation and sanitized filename handling. Only ready, course-owned references can be saved. Existing approved Academy image paths are also accepted.
4. Add/reorder modules and lessons. Each new record receives a stable ID. Supply actual descriptions, text or private MP4/WebM file keys, known durations and private resource file keys (PDF/TXT/ZIP). The first lesson is saved as public; every subsequent lesson requires enrollment. A supplied YouTube embed belongs only to the public introduction. Missing files remain missing and are never fabricated.
5. Save draft, preview the entered metadata/curriculum, then explicitly publish the **saved** course using an authorized publishing role. Publication validates required content metadata and learning configuration. Enabling purchase additionally requires complete, supplied content and configured prices. Archive retains the course ID, orders and enrollments. Slugs with linked Academy records cannot be changed.

Thumbnail/image uploads require existing R2 configuration: `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `MEDIA_PUBLIC_BASE_URL`; the frontend approved host is `NEXT_PUBLIC_MEDIA_HOST`. Secrets stay server-side. These are not currently configured locally.

**Private video/resource uploads are unsupported by the existing public-image uploader.** No fake video upload endpoint or new storage provider was added. Approved private files must be provisioned by an operator on a private backend volume outside frontend/public/static directories, with `ACADEMY_MEDIA_ROOT` set to its absolute directory. The existing enrollment-checked, real-path-validated media endpoints deliver those files. This root is currently unconfigured. Secure private hosting is required before production paid delivery; YouTube URLs remain shareable and do not provide paid-video protection.

## Generate and export scholarship codes

On **Scholarships**, click **Generate 100% scholarship code**; label and expiry are optional under Advanced. The older batch workflow remains on `/admin/academy-access`. Leave course restrictions blank for any **purchasable** Academy course, or enter eligible published course slugs explicitly. Choose one code or a batch of up to 100. Defaults are 100% scholarship, one total use and one use per account. Reuse requires explicitly enabling it and setting usage limits. Optional recipient restrictions keep existing email verification rules.

Codes use the existing cryptographic random generator and unique SHA-256 hash index. Only the authorized generation response contains plaintext. Copy individual/all codes or use **Export CSV once** for that generated batch; plaintext is kept only in component memory and is lost on Hide, replacement or page exit. CSV stores identifier and code; retain it privately. The server cannot recover plaintext from hashes. Audit records identify generation/revocation actors and code identifiers without raw codes.

A recipient logs in, selects one eligible course, applies the code and confirms using the existing individual-course/cart flow. Apply does not enroll. Confirmation atomically creates the scholarship order, consumes the code and enrolls the selected course; default any-course codes do not unlock the catalog. Existing idempotency, transaction retries, course-specific media authorization and concurrent limits remain enforced. Partial balances require verified payment; no provider is configured, so paid checkout remains blocked.

## Validation

Frontend/backend lint, typecheck and build; isolated Nest/Mongo integration suites covering permissions, draft edits/publication validation, image validation/unavailable storage and ready course-media association, exact prices, any-course codes, expiry/revocation, atomic concurrent redemption/retries, audited grant/revoke and cross-course access. Real Chrome checks exercise the editor, preview, reorder/stable IDs, publication/archive, generator/copy/one-time CSV export, existing Academy cart/commerce and desktop/mobile layout.

Remote R2 upload/delivery, production private-video upload/hosting and provider sandbox payment: NOT RUN (unconfigured/unsupported). No production codes/accounts/enrollments were created, no live charges or deployment.

## Simplified Academy workflow

The Academy course editor now keeps title, category, level, description, outcomes, requirements, prices, thumbnail selection and module/lesson copy/paste fields in the main form. Slugs are suggested from the title. Existing instructor, gallery, sale dates, text/resources, known durations, delivery/access terms, purchase availability and state actions are retained under Advanced options. Existing known-duration publication validation remains; add the supplied duration under Advanced before publishing. Existing prices and stable identifiers remain unchanged unless explicitly edited.

Each video lesson accepts supported HTTPS YouTube/Vimeo URLs or one empty iframe embed. The server extracts and canonicalizes the source, rejecting unsupported hosts, scripts, handlers, duplicate source attributes and malformed markup. Only a controlled iframe with server-validated `src` is rendered; pasted HTML is never persisted or rendered. Preview validation does not save or publish. Enrollment checks still guard every restricted lesson/media request, and public curriculum responses omit protected embed identifiers/URLs. Public/unlisted embeds are shareable; these do not provide private paid-video protection. Provider references: [YouTube embed documentation](https://developers.google.com/youtube/player_parameters) and [Vimeo unlisted embed hash](https://help.vimeo.com/hc/en-us/articles/12426470858001-Embedded-player-displays-This-video-does-not-exist-message).

On `/admin/academy/scholarships`, click **Generate 100% scholarship code** with no required options. Defaults are any purchasable course, one course redemption and no expiry. Optional label, expiry, course restrictions and recipient are under Advanced. “Saved” appears only after a confirmed backend response. Copy immediately; later lists show identifier, status and selected course only. Existing advanced batch generator/CSV remain on `/admin/academy-access`.

The simple generator binds an idempotency key to the authorized admin and request parameters. Cryptographic output is derived using the existing server-only `ACCOUNT_VERIFICATION_KEY` and a generation-specific namespace; only code hashes and private generation metadata are stored. Immediate retries within 15 minutes reproduce the same response without another code/audit. After that window, retries return saved identifiers with no plaintext, requiring explicit revocation/replacement rather than silently generating another code. Public/list APIs and logs never include plaintext or private generation keys. The local server key was securely configured in ignored `.env`; production must supply its own persistent server-only key. Existing sessions are not reset.

The recipient still logs in, selects a purchasable course, applies the code and confirms the zero-total order. Applying alone does not enroll. Existing atomic redemption/order/enrollment, concurrent limits, safe retries and course-specific lesson checks remain active. Optional expiry is genuinely absent in storage rather than simulated by a distant date.
