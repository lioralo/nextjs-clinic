# Clinic app updates

This is the product history of **this** Next.js repo (`nextjs-clinic`), not the older Flask clinic. Dates are merge / PR time on GitHub.

Seeded logins (unless you overrode env): staff `admin` / `admin-password`, portal `portal` / `portal-password`.

## On `main` after this change set

Staff clinic, patient portal, and public booking/contact share one SQLite database and Hebrew-first chrome.

| Area | What you can do |
|------|-----------------|
| CRM | Patient list by status, file with demographics, meeting logs, care (plans + questionnaires) |
| Calendar | Week grid, recurrence this-vs-series, vacancies, public booking token |
| Portal | Messages, assigned resources, cancel requests, shared plans, take questionnaires |
| Ops | Groups/attendance, cancel queue, contact inquiries, SMTP-optional mail |
| Clinical | Staff-editable PHQ-9 / GAD-7 (and CSV/TSV imports), TOTP 2FA |
| UI | Full-width clinic pages, dialogs for short actions, resource **folder tree** |
| Dev | `npm run local`, Playwright + GitHub Actions, RTL/brand |

## Landed pull requests

### 1 — CRM, week calendar, meeting logs

Patients, notes, FullCalendar week view, conflict checks, recurrence expansion.

### 3 — Calendar conflicts, this-vs-series, public self-booking

Occupying vacancies, skip/move one occurrence, public `/{locale}/book/[token]` for waiting patients.

### 4 — Calendar popup, patient links, standalone login

Booking UI in a popup, patient file ↔ calendar, login page outside the staff shell, layout/middleware role guards.

### 5 — Portal ops

Portal users, cancel queue, staff–patient messaging, optional SMTP, therapy groups, resource library + assignment.

### 6 — Treatment plans, assessments, 2FA, public contact

Plans/goals (share with patient), PHQ-9/GAD-7 takes, TOTP + recovery codes, public contact → staff inquiries.

### 7 — Logo and Hebrew-first chrome

Flask static assets in `public/`, shared `ClinicBrand`, RTL-safe layout, accessibility statement.

### 2 / CI — Visible Playwright

Screenshots, video, HTML report, GitHub Actions on `main` and PRs (migrate, seed, unit, e2e).

### 8 — Local runner

`npm run local` pulls (ff-only), installs, `prisma migrate deploy`, seeds, starts `next dev`. Debug: `local:check` / `local:e2e`. See [LOCAL-RUNNER.md](LOCAL-RUNNER.md).

## This drop (PR 12) — full-bleed, dialogs, questionnaires, folders

**Layout.** Clinic routes use the full main column (`w-full min-w-0`). Settings stay narrow. Public/login unchanged.

**Dialogs.** Shared [`Dialog`](../src/components/ui/dialog.tsx) for short work instead of long page forms:

- Patient file: edit demographics, portal grant, assign/unassign resources
- Cancel queue: approve / reject confirm
- Inquiries: delete confirm
- Meeting log delete confirm

**Questionnaires.** [`/{locale}/questionnaires`](../src/app/[locale]/(clinic)/questionnaires/page.tsx):

- Seeded PHQ-9 and GAD-7 stored as `AssessmentType.definitionJson`
- Create / edit / deactivate; CSV/TSV import (Sheets **Download → CSV** or Docs table paste)
- No Google OAuth
- Takes snapshot question text on `Assessment.questionsJson`

**Resources.** `ResourceFolder` tree on the staff library. Portal only sees assigned files the patient is allowed to view.

**CI / debug (this branch).**

1. **RSC crash on patient file** — Next.js cannot pass a *plain* function (for example `unassign={(id) => action.bind(...)}`) into a Client Component. Bind `"use server"` actions **inside** [`patient-ops-dialogs.tsx`](../src/components/patient-ops-dialogs.tsx). Symptom: `Functions cannot be passed directly to Client Components`.
2. **PHQ-9 e2e** — A controlled `<select value={...}>` can ignore Playwright `selectOption`. Use `defaultValue` + `onChange`, wait for `input[name="q_8"]` (nine items, 0-based), then fill.
3. **Portal assign / cancel e2e** — Open the dialog first (`open-assign-resource`, then `assign-resource`; `approve-cancel` then confirm in `approve-cancel-dialog`). Calendar events may sit on the next week; click `.fc-next-button` if needed.

## Still open (not in this merge)

| PR | Intent |
|----|--------|
| [#9](https://github.com/lioralo/nextjs-clinic/pull/9) | Narrow-viewport clinic UI + extra testing/debug docs |
| [#10](https://github.com/lioralo/nextjs-clinic/pull/10) | `npm run local` from Windows `cmd` (Node runner, no bash) |
| [#11](https://github.com/lioralo/nextjs-clinic/pull/11) | Seed **resets** admin/portal passwords; visible login errors |

Until #11 lands, `npm run db:seed` **does not** change an existing admin password. If login fails locally, delete the user row or hash a new password in SQLite.

## Intentionally not built

Billing/Morning, Google OAuth/Docs/Calendar, IMAP, encrypted backups, live Google Sheets sync, CRM bulk archive, save toasts.
