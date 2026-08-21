# Operations and debugging

## Environment

Copy [`.env.example`](../.env.example) to `.env.local`.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes | SQLite URL, default `file:./dev.db` |
| `NEXTAUTH_URL` | yes | Origin, e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | yes | JWT signing secret |
| `ADMIN_USERNAME` | seed | Created on first `npm run db:seed` if missing |
| `ADMIN_PASSWORD` | seed | Same; default `admin-password` |
| `SMTP_HOST` | no | If empty, mail is skipped (logged) |
| `SMTP_PORT` | no | Default `587` |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | no | SMTP auth |
| `SMTP_FROM_EMAIL` | no | From address |
| `SMTP_SECURE` | no | Set `1` for TLS-on-connect |

Prisma still loads `.env` / `.env.local` via [`src/lib/prisma.ts`](../src/lib/prisma.ts). Never commit real secrets.

## Database

```bash
npm run db:migrate   # prisma migrate dev && prisma generate
npm run db:seed      # admin, Test Patient, portal user, assessment types
```

SQLite files (`*.db*`) are gitignored. After pulling new migrations, `npm run local:update` (or `npm run local`) applies them with `prisma migrate deploy`. Use `npm run db:migrate` when you are authoring a new migration.

Seeded accounts:

- Staff: `admin` / `admin-password` (no TOTP)
- Portal: `portal` / `portal-password` linked to **Test Patient**

Granting portal access from a patient file generates a new temp password and sets `forcePasswordChange`.

## Local runner

Use this after `git pull` or a fresh clone so install, migrations, and seed stay in sync:

```bash
npm run local              # update + start http://localhost:3000
npm run local:update       # pull, npm install, migrate deploy, seed
npm run local:dev          # start only
npm run local:check        # unit tests + production build
npm run local:e2e          # update + Playwright
```

Implementation: [`scripts/local-run.mjs`](../scripts/local-run.mjs) (Windows `cmd` / PowerShell / macOS / Linux). Full command/flag/debug notes: [LOCAL-RUNNER.md](LOCAL-RUNNER.md). It copies `.env.example` → `.env.local` when missing, skips `git pull` if the tree is dirty, and applies migrations with `prisma migrate deploy` (non-interactive, same as CI). Use `npm run db:migrate` only when **creating** a new migration.

If npm says `Missing script: "local"`, run `git checkout main` then `git pull origin main`.

```bash
npm run local -- --no-pull --kill-port
```

- App: http://localhost:3000 → `/he`
- Login: http://localhost:3000/he/login
- English: swap `he` for `en` (locale toggle keeps the rest of the path)

Production:

```bash
npm run build
npm start
```

`next build` must see a valid `DATABASE_URL` if any route queries Prisma at build time; this app’s pages are dynamic (`ƒ` in the build output).

## Tests

```bash
npm test          # Vitest
npm run e2e       # Playwright, Desktop Chrome, one worker
npm run e2e:headed
npm run e2e:report
npx next build    # typecheck + compile
```

GitHub Actions (`.github/workflows/test.yml`) on `main` and pull requests: migrate + seed, unit tests, Playwright, upload `playwright-report` and `test-results` (screenshots and video).

Playwright starts `npm run dev` unless something already listens on `:3000` (`reuseExistingServer` when `CI` is unset). If e2e hangs on login:

1. Confirm seed ran and `admin` exists.
2. Confirm `NEXTAUTH_SECRET` matches the running server.
3. The login helper polls for a `session-token` cookie and retries (dev compile race).

Useful test ids: `login-form`, `clinic-sidebar`, `logout`, `clinic-logo`, `clinic-calendar`, `contact-form`, `patient-home`.

## Debugging checklist

| Symptom | Likely cause | What to check |
|---------|--------------|----------------|
| Login UI succeeds, then bounce to login | Session cookie not set / secret mismatch | `.env.local` `NEXTAUTH_SECRET` and `NEXTAUTH_URL`; retry; watch Network for `/api/auth/callback/credentials` |
| Staff URL shows portal or vice versa | Role on JWT | `User.role`; middleware in `middleware.ts` |
| Calendar empty / mutations 401 | Not logged in as staff; CSRF | `e2e/auth.ts` cookie poll; POST `/api/calendar` |
| Duplicate FullCalendar keys | Recurring ids | Events must use `${id}__${iso}` from `toCalendarEvent` |
| Hebrew font looks like Latin | `dir` not on `<html>` | `x-locale` header; View Source `html lang dir` |
| Sidebar missing on mobile | Drawer closed | Hamburger in top bar; `clinic-sidebar` is off-canvas until open |
| Mail never arrives | SMTP unset | Expected: `[mail skip]` in server logs |
| Contact form “works” but staff list empty | Different DB file | Same `DATABASE_URL` for seed, dev, and e2e |
| TOTP rejected | Clock / recovery | 6 digits, 30s window; recovery codes are one-time hashes |
| `prisma` client missing | Generate not run | `npx prisma generate` after schema pull |
| `Missing script: "local"` | Checkout behind `main` | `git checkout main` then `git pull origin main`; `npm run` should list `local` |
| Port 3000 in use | Leftover `next dev` | `npm run local -- --kill-port` or stop the other process |

Server logs: Next dev terminal. Prisma warns in development. Mail errors print `[mail error]`.

## Layout / RTL debug

1. `/he/login` — `html[lang=he][dir=rtl]`, Heebo, logo (`clinic-logo`).
2. Staff dashboard — sidebar on the **right**, active nav on לוח הבקרה.
3. Narrow viewport — menu button, overlay, drawer from the right, Escape closes.
4. Locale toggle — `/he/patients` ↔ `/en/patients`.

## Security notes for operators

- Change `NEXTAUTH_SECRET` and admin password outside local dev.
- SQLite is a single file; treat `dev.db` as sensitive (patient data).
- Public booking tokens are capability URLs; deactivate the link in the calendar UI when done.
- Contact inquiries store message bodies in SQLite; they are not emailed unless you add that later.
- 2FA issuer string in TOTP URIs is `Clinic` ([`src/lib/totp.ts`](../src/lib/totp.ts)); changing it invalidates existing authenticator entries.

## Support contacts in-product

Accessibility coordinator named on `/{locale}/accessibility` points people at the public contact form. Inquiries appear under staff פניות.
