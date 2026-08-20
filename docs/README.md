# Documentation index

This folder describes the Next.js clinic app as it exists in this repository (not the older Flask `Private_Clinic` UI).

| Document | Audience | What it covers |
|----------|----------|----------------|
| [LOCAL-RUNNER.md](LOCAL-RUNNER.md) | Developers | `npm run local`: pull, migrate, seed, start, debug |
| [TESTING.md](TESTING.md) | Developers | Vitest, Playwright, CI, mobile checklist, debug |
| [FEATURES.md](FEATURES.md) | Product / clinic staff | Screens, roles, and user flows |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Developers | Layouts, services, auth, data model, i18n |
| [OPERATIONS.md](OPERATIONS.md) | Developers / operators | Environment, mail, ops troubleshooting |

Copy strings for the UI live in [`src/lib/copy.ts`](../src/lib/copy.ts) (`t(locale, en, he)`). Default locale is `he` in [`src/i18n/routing.ts`](../src/i18n/routing.ts).
