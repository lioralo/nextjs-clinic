# Testing and debugging

How to verify this clinic app locally and in CI, including **phone-width** layouts. Product surfaces: [FEATURES.md](FEATURES.md). Env and SMTP: [OPERATIONS.md](OPERATIONS.md). One-command local run: [LOCAL-RUNNER.md](LOCAL-RUNNER.md).

## What to run

| Command | What it covers |
|---------|----------------|
| `npm test` | Vitest unit tests (`src/lib/*.test.ts`) |
| `npx next build` | Typecheck + production compile |
| `npm run local:check` | `npm test` then `next build` (runner) |
| `npm run e2e` | Playwright, Chromium, starts `npm run dev` on port 3000 if needed |
| `npm run e2e:headed` | Same, visible browser |
| `npm run e2e:report` | Last HTML report (`playwright-report/`) |
| `npx playwright test e2e/mobile.spec.ts` | Phone viewport only (iPhone 13 preset) |
| `npm run local:e2e` | Update (pull/install/migrate/seed) then Playwright |

Seeded logins used by e2e:

- Staff: `admin` / `admin-password`
- Portal: `portal` / `portal-password`

The database file must be the same one the dev server uses (`DATABASE_URL`, default `file:./dev.db`). After a schema pull, `npm run local:update` (or `npx prisma migrate deploy` + `npm run db:seed`).

## Unit tests (Vitest)

Config lives in `vitest.config.ts`. Tests sit next to the modules they cover (`src/lib/*.test.ts`): copy, locale, auth-adjacent services, calendar mutations, TOTP, mail skip path, CRM filters.

```bash
npm test                 # one shot
npx vitest               # watch
npx vitest src/lib/totp.test.ts
```

Failures here are logic bugs, not UI. Fix the service under test; do not skip to Playwright.

## End-to-end (Playwright)

Config: [`playwright.config.ts`](../playwright.config.ts).

- **Browser:** Desktop Chrome by default (`devices["Desktop Chrome"]`), one worker, no retries.
- **Artifacts:** screenshot `on`, video `on`, trace `retain-on-failure`. Output: `test-results/` and `playwright-report/`.
- **Server:** `webServer` runs `npm run dev` unless something already listens on `http://localhost:3000` (`reuseExistingServer` when `CI` is unset).

Specs in [`e2e/`](../e2e/):

| File | Covers |
|------|--------|
| `smoke.spec.ts` | Login logo/RTL, seeded CRM, notes, calendar grid |
| `calendar-booking.spec.ts` | Book / occupy / conflict / public link |
| `portal-ops.spec.ts` | Patient portal messages, resources, cancel request |
| `clinical-ops.spec.ts` | Plans, assessments, contact form, TOTP |
| `mobile.spec.ts` | iPhone 13 viewport: hamburger, RTL drawer, calendar time-grid |

Login helper [`e2e/auth.ts`](../e2e/auth.ts) posts CSRF/session first, then fills the form, waits for `/he` + dashboard heading, and **retries until a `session-token` cookie exists**. First `next dev` compile can finish the UI login without persisting the cookie.

Useful `data-testid` hooks (keep these if you restyle chrome):

`login-form`, `clinic-logo`, `clinic-sidebar`, `open-menu`, `logout`, `clinic-calendar`, `open-booking-panel`, `booking-panel`, `close-booking-panel`, `contact-form`, `patient-home`, `locale-toggle`.

### Phone viewport

`mobile.spec.ts` uses `test.use({ ...devices["iPhone 13"] })` (390×844). It does **not** duplicate the whole suite — that would double CI time. Desktop specs stay on Desktop Chrome.

What it asserts:

1. After staff login, `open-menu` is visible (`md:hidden` hamburger).
2. Opening the drawer sets `aria-expanded="true"`; a sidebar link (יומן) navigates.
3. Calendar still mounts `.fc` / `.fc-timegrid` (day view on a narrow screen is still a time-grid).
4. Public login form stays inside the viewport width.

Manual phone checklist (Chrome DevTools device mode or a real phone on the LAN):

- [ ] Viewport meta is `width=device-width` (root `viewport` export in `src/app/layout.tsx`). Do not disable pinch-zoom.
- [ ] Hebrew `/he`: sidebar drawer opens from the **right**; overlay tap and Escape close it; `html.nav-open` stops background scroll.
- [ ] Touch targets ~44px (`min-h-11`): hamburger, logout, locale toggle, CRM chips, primary buttons.
- [ ] Inputs are 16px so iOS Safari does not zoom on focus.
- [ ] Patients table scrolls **inside** `.table-scroll`; the page does not pan sideways.
- [ ] Calendar on a phone: day time-grid by default, toolbar wraps, booking panel is a **bottom sheet**.
- [ ] Public header, portal header, and footers clear the iOS safe area (`env(safe-area-inset-*)`).
- [ ] Login, contact, and portal home wrap; no clipped primary actions.

## CI

[`.github/workflows/test.yml`](../.github/workflows/test.yml) on `main` and pull requests:

1. `npm ci`
2. Copy `.env.example` → `.env.local`, `prisma generate`, `migrate deploy`, seed
3. `npm test`
4. Playwright Chromium + `npm run e2e`
5. Upload `playwright-report` and `test-results` (screenshots, video)

CI sets `CI=true`, so Playwright **does not** reuse an existing server. It always starts a fresh `next dev`.

The workflow does not call `scripts/local-run.sh` (that script is interactive-git friendly). Keep the CI steps in sync when you change migrate/seed.

## Debug

### App will not start / empty data

| Symptom | Check |
|---------|--------|
| Port 3000 in use | Stop the other `next dev`, or `npm run local -- --kill-port` |
| Login UI works, then bounce to login | `.env.local` `NEXTAUTH_SECRET` and `NEXTAUTH_URL` must match the running process |
| No admin / empty CRM | Seed against the same `DATABASE_URL`; `npm run db:seed` |
| Prisma client missing | `npx prisma generate` after a schema pull |
| Contact “sent” but staff list empty | Dev server and browser are on a different DB file |

More rows: [OPERATIONS.md](OPERATIONS.md#debugging-checklist) and [LOCAL-RUNNER.md](LOCAL-RUNNER.md#debug).

### Playwright hangs on login

1. Seed ran (`admin` exists).
2. `NEXTAUTH_SECRET` on the **running** server matches `.env.local`.
3. Watch the Next terminal for the first compile of `/api/auth/*`; the helper retries on purpose.
4. Open `test-results/` — screenshot + video show whether the form submitted.

```bash
npx playwright test --debug                  # inspector, step through
PWDEBUG=1 npx playwright test e2e/smoke.spec.ts
npx playwright test e2e/mobile.spec.ts --headed
npx playwright show-report
npx playwright show-trace test-results/**/trace.zip
```

`reuseExistingServer` is off in CI and on locally. If a leftover server is broken, kill port 3000 rather than fighting the helper.

### Layout / RTL / mobile

1. View Source on `/he/login`: `html[lang=he][dir=rtl]`.
2. Staff desktop: sidebar on the **right**.
3. Width &lt; 768px: hamburger (`data-testid="open-menu"`), overlay, drawer from the inline-start side (`start-0` + RTL translate).
4. Locale toggle keeps the rest of the path (`/he/patients` ↔ `/en/patients`).
5. Calendar: `useNarrowScreen` switches FullCalendar `timeGridDay` ↔ `timeGridWeek` (initial view alone only applies on first mount).

Server logs: the `next dev` terminal. Mail skip lines print `[mail skip]`; SMTP failures `[mail error]`.

## Adding tests

- **Logic** → Vitest next to the module. No DOM unless the unit is UI-free.
- **A staff/portal click-path** → extend an existing `e2e/*.spec.ts`. Reuse `login()` from `e2e/auth.ts`.
- **Chrome that only matters under ~768px** → add an assertion in `e2e/mobile.spec.ts`, not a second Playwright project.
- Keep `data-testid` values stable; CSS class churn should not break e2e.
