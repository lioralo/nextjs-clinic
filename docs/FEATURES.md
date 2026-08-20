# Product features

The app has three surfaces that share a database and brand, but not a layout.

- **Staff clinic** — App Shell with sidebar (`data-testid="clinic-sidebar"`). Below `md` the nav is an off-canvas drawer (`data-testid="open-menu"`). Roles `ADMIN` and `CLINICIAN`.
- **Patient portal** — Separate header, no clinic sidebar. Role `PATIENT` only.
- **Public** — Login, contact, accessibility statement, token booking. No session required.

Hebrew is the default. Every locale URL is `/{he|en}/...`.

## Staff clinic

| Path | Screen | Purpose |
|------|--------|---------|
| `/{locale}` | לוח הבקרה / Dashboard | Today and upcoming appointments (recurrence expanded), patient and waiting counts, pending cancellations |
| `/{locale}/patients` | מטופלים | CRM list with status filters (all / candidate+waiting / ongoing / archived) |
| `/{locale}/patients/new` | New patient | Create a record (`CANDIDATE` by default unless set otherwise) |
| `/{locale}/patients/[id]` | Patient file | Demographics, portal grant, resources, calendar jumps; `?section=logs` meeting notes; `?section=care` plans and assessments |
| `/{locale}/calendar` | יומן | Time-grid: appointments, vacancies, blocks, group sessions; **week** on desktop, **day** under 768px; booking popup (bottom sheet on phones); publish public booking link |
| `/{locale}/cancel-requests` | בקשות ביטול | Approve or reject portal cancel requests |
| `/{locale}/messages` | הודעות | Staff–patient threads and broadcasts |
| `/{locale}/groups` | קבוצות | Therapy groups, members, sessions, attendance |
| `/{locale}/resources` | משאבים | Resource library and assignment |
| `/{locale}/inquiries` | פניות | Public contact form submissions (mark read / delete) |
| `/{locale}/settings` | הגדרות | Staff TOTP setup |

### Patient file

- **Overview** — name, phone, email, status (`ONGOING`, `CANDIDATE`, `WAITING`, `ARCHIVED`), type (`PRIVATE`, `RESIDENCY`, `GROUP`, `INITIAL_INTAKE`), grant portal access (temp password, `forcePasswordChange`).
- **Logs (`?section=logs`)** — session notes; optional share-with-patient.
- **Care (`?section=care`)** — treatment plans + goals (progress 0–100, share-with-patient); PHQ-9 and GAD-7 take-and-score.

### Calendar behavior

- Clinic hours snap to 08:00–19:30 in 30-minute slots ([`src/lib/datetime.ts`](../src/lib/datetime.ts)).
- Event ids are `${id}__${isoStart}` so recurring occurrences stay unique in FullCalendar.
- Mutations support this-occurrence vs series (`this` / `series`), occupy vacancy, skip/move occurrence, and conflict checks.
- Staff can publish a public booking token; vacancies on that link become self-bookable.

## Patient portal

Layout: [`src/app/[locale]/(portal)/layout.tsx`](../src/app/[locale]/(portal)/layout.tsx). Patients never see the staff sidebar.

| Path | Screen |
|------|--------|
| `/{locale}/patient` | Upcoming meetings (request cancel), shared notes, groups, notifications, messages, assigned resources, **shared** treatment plans, portal PHQ-9/GAD-7 |
| `/{locale}/patient/change-password` | Forced after staff grant (`forcePasswordChange`) |
| `/{locale}/patient/security` | Portal TOTP setup |

Seeded portal login: `portal` / `portal-password` (not forced to change password).

## Public

| Path | Screen |
|------|--------|
| `/{locale}/login` | Standalone login (`data-testid="login-form"`). If 2FA is on, preflight (`POST /api/auth/preflight`) then OTP / recovery code |
| `/{locale}/contact` | Name + message; email **or** phone required. Creates a `ContactInquiry` and an in-app `CONTACT` notification. No SMTP on submit |
| `/{locale}/accessibility` | הצהרת נגישות (IS 5568-oriented statement) |
| `/{locale}/book/[token]` | Public vacancy booking; creates a waiting patient and occupies the slot |

Unauthenticated visits to staff or portal routes redirect to login. Patients hitting staff URLs go to `/patient`; staff hitting portal URLs go to the dashboard.

## Auth and 2FA

1. Login form POSTs `/api/auth/preflight` with username/password.
2. If `totpEnabled`, the form asks for a 6-digit TOTP or a recovery code.
3. NextAuth credentials authorize in [`src/lib/auth.ts`](../src/lib/auth.ts).
4. JWT session carries `id`, `role`, `patientId`, `forcePasswordChange`.

Seeded **admin has 2FA off** so e2e login stays simple. Staff and patients can enable TOTP in settings / security.

## Notifications and mail

In-app `Notification` rows cover system, broadcast, appointment, cancel, resource, and contact.

SMTP is optional. If `SMTP_HOST` is empty, [`src/lib/mail.ts`](../src/lib/mail.ts) logs and skips (portal grant still creates the user). Appointment reminder sends use the same helper when a patient has email and reminders enabled.

## Brand and accessibility

- Logo and icons come from the Flask clinic `static/` assets, served from `public/`.
- `ClinicBrand` is shared across staff, portal, and public chrome.
- `lang` / `dir` are set on `<html>` from locale (`he` → `rtl`, Heebo).
- Skip link, 44px chrome targets, form labels, and an accessibility statement are the IS 5568 basics in this codebase. The statement is not a certified audit.

## Out of scope

Not ported from Flask and not implemented: billing/receipts/Morning, Google OAuth/Docs/Calendar, IMAP inbox, encrypted backups, dark-mode toggle UI.
