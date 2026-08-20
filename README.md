# קליניקת ליאור אלוני / Lior Aloni Clinic

Hebrew-first clinic app: staff CRM and week calendar, a separate patient portal, and public booking/contact. Built with **Next.js 16** (App Router), **React 19**, **Prisma + SQLite**, and **NextAuth** credentials.

Default locale is Hebrew (`/he`). `/` redirects there.

## Quick start

One command (pulls `origin`, installs, migrates, seeds, starts the app):

```bash
npm run local
```

Flags: `npm run local -- --no-pull` (skip git), `--no-seed`, `--kill-port` (free 3000).

First clone, same thing after `git clone` + `cd nextjs-clinic`. If npm scripts are not available yet:

```bash
bash scripts/local-run.sh
```

Manual steps (equivalent):

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000/he/login](http://localhost:3000/he/login).

| Role | Username | Password |
|------|----------|----------|
| Staff admin | `admin` | `admin-password` |
| Seeded portal user | `portal` | `portal-password` |

Override the admin account with `ADMIN_USERNAME` / `ADMIN_PASSWORD` before `npm run db:seed`.

## What to read next

| Doc | Contents |
|-----|----------|
| [docs/README.md](docs/README.md) | Index of all documentation |
| [docs/LOCAL-RUNNER.md](docs/LOCAL-RUNNER.md) | One-command local update and run |
| [docs/FEATURES.md](docs/FEATURES.md) | Staff, portal, and public product surfaces |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Routes, auth, data, i18n, calendar |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Env, SMTP, tests, troubleshooting |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run local` | **Local runner:** git pull, install, migrate, seed, `next dev` |
| `npm run local:update` | Apply repo updates only (no server) |
| `npm run local:dev` | Start the app after env is in place |
| `npm run local:check` | Unit tests + `next build` |
| `npm run local:e2e` | Update, then Playwright |
| `npm run dev` | Next.js 16 dev server (Turbopack) |
| `npm run build` / `npm start` | Production build and server |
| `npm run db:migrate` | Prisma migrate + generate |
| `npm run db:seed` | Admin, sample patient, portal user, PHQ-9/GAD-7 types |
| `npm test` | Vitest unit tests |
| `npm run e2e` | Playwright (starts `npm run dev` if needed) |
| `npm run e2e:headed` | Playwright with a visible browser |
| `npm run e2e:report` | Open the last HTML report |
| `npm run lint` | ESLint |

## Stack

- UI: App Router route groups `(clinic)`, `(portal)`, `(public)`; teal brand tokens; Heebo for RTL
- Auth: NextAuth JWT credentials, optional TOTP, middleware role split
- Data: SQLite via Prisma + `@libsql/client`
- Calendar: FullCalendar week time-grid, server mutations in `src/lib/calendar-mutations.ts`

## Not in this app

Billing/receipts, Google OAuth/Docs/Calendar, IMAP, and encrypted backups are intentionally out of scope.
