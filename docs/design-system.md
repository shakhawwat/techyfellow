# Frontend design system

Step 5 implements shared UI foundations only. The public homepage remains minimal. Backend code, Dockerfiles and Compose behavior were not changed. The Full Project Documentation was not available; the user's Step 5 requirements supplied the specification for this step.

## Preview

From frontend/:

```sh
npm ci
npm run dev
```

Open http://localhost:3000/design-system. All content and navigation destinations are explicitly labeled demo-only. Form validation and loading use local state/timers; no API requests are made. The server route requires NODE_ENV=development and returns notFound otherwise. Production HTTP verification returned 404 for /design-system and /design-system/, with no preview markup.

## Tokens and typography

Tailwind CSS 4.3.3 uses CSS-first semantic variables and @theme inline in src/app/globals.css. Light and dark data-theme scopes provide background, surfaces, foreground, muted text, borders, accents, focus, error and success tokens. Section supports light, dark and navy tones; components inherit their scoped colors. Card radius is 16px; control radius is 12px.

The requested navy/white/light/cyan/research palette is preserved. Cyan is used with navy button text; darker cyan text is used on light surfaces. Muted text and validation feedback have separate tokens. Geist Sans and Geist Mono are locally bundled through pinned geist@1.7.2, with system font fallbacks; builds do not fetch Google Fonts. Icons use pinned lucide-react@1.52.0, consistent size/stroke and decorative aria-hidden attributes.

## Shared components

- Container: bounded responsive content width.
- Section: semantic themed section containing a Container. Supply aria-labelledby when appropriate.
- Button: native button with primary/secondary/ghost/research variants, disabled/loading behavior and loadingLabel. It defaults to type=button.
- Card: article surface with default/research variants.
- Badge: neutral/accent/research/success inline status/annotation.
- TextField, TextAreaField, SelectField: require an id and visible label; optional hint/error; associate descriptions and aria-invalid. Native refs are supported by React 19.
- Navbar and Footer: take explicit navigation links. Seven requested labels are exported from components/layout/navigation.ts. No unfinished business routes are implied.

Native controls and dialog cover this step; no shadcn components or unused primitive packages were installed.

## Interaction and verification

Focus outlines remain visible, application mobile controls have at least 44px targets, and reduced-motion preferences disable animations/transitions. The mobile menu opens as a modal dialog, focuses Close, wraps Tab/Shift+Tab, closes with Escape/Close/backdrop, restores trigger focus and moves focus to an in-page target on selection. Desktop resize dismisses an open menu and restores a visible focus target. Background scroll is restored on dismissal.

Actual Chrome 153 checks with temporary Playwright 1.63.0 covered desktop/mobile screenshots, 320/390/768/1024/1280/1440 widths without horizontal overflow, keyboard activation and outlines, hover/disabled/loading states, form labels/error associations/first-invalid focus, menu behavior, reduced motion, production exclusion and rendered dark-label/error colors. Next.js developer-tool controls were excluded from application touch-target measurements. A native-dialog Tab escape and nested dark-field/card paragraph color conflicts were found, fixed and successfully rechecked. Temporary servers/browser were stopped.

Eleven selected semantic text-color pairs were calculated at 4.5:1 or better, including primary/research buttons and light/dark text/errors. These are targeted checks, not full accessibility compliance evidence. Screen-reader testing and a full accessibility audit were not run.

Frontend checks: npm run lint, npm run typecheck, npm run build. The updated generated npm lockfile matches pinned dependencies; Git metadata remains unavailable for committing it.

References: [Tailwind theme variables](https://tailwindcss.com/docs/theme), [Next.js fonts](https://nextjs.org/docs/app/api-reference/components/font), [Lucide React](https://lucide.dev/guide/react/).
