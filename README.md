# קליניקת ליאור אלוני / Lior Aloni Clinic

Hebrew-first clinic app: staff CRM and week calendar, a separate patient portal, and public booking/contact. Built with **Next.js 16** (App Router), **React 19**, **Prisma + SQLite**, and **NextAuth** credentials.

Default locale is Hebrew (`/he`). `/` redirects there.

## Quick start

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
| [docs/FEATURES.md](docs/FEATURES.md) | Staff, portal, and public product surfaces |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Routes, auth, data, i18n, calendar |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Env, SMTP, tests, troubleshooting |

## Scripts

| Command | Purpose |
|---------|---------|
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
