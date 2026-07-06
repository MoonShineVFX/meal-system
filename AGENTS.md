# meal-system

Internal cafeteria ordering system ("夢想發光吧") for MoonShineVFX: employees order meals with a dual-currency wallet (daily points + deposited credits), staff run a POS, admins manage menus/commodities/members. One Next.js 14 (pages router) app — React 18 + tRPC v11 + Prisma (PostgreSQL) + Pusher realtime + web push — built into a single Docker container deployed to Cloud Run.

## Where to look

| Touching… | Read first |
|---|---|
| tRPC routers, procedures/auth/rate limits, `src/pages/api/utils/*` | **server-api** |
| `prisma/`, `src/lib/server/database/*`, balances/transactions, seeds | **database** |
| Pusher events, `EventListener` invalidation, web push, Cronicle jobs | **realtime** |
| Pages, components, zustand store, forms, images, Tailwind conventions | **frontend** |
| Deposit/儲值, NewebPay callbacks, `DepositStatus` | **deposit-newebpay** |

Skills live in `.agents/skills/<name>/SKILL.md`; `.claude/` only contains symlinks to them.

## Working agreement

- If a change contradicts a SKILL.md, update that SKILL.md in the same change — stale skills are worse than none.
- Keep this file thin; architectural detail belongs in the skills.

## Repo-wide invariants

- Package manager is **pnpm** (pinned in `package.json`). Dev server: `pnpm dev` (port 8086).
- No tests and no ESLint. Format with prettier (`semi: false`, single quotes, Tailwind class sorting) — match it; don't introduce semicolons.
- TypeScript path alias `@/*` → `src/*`. Shared client+server code goes in `src/lib/common.ts` / `src/lib/common/` only; `src/lib/server/**` must never be imported from client code.
- All runtime config is read through the `settings` object in `src/lib/common.ts` — add new env vars there, not scattered `process.env` reads. Only `NEXT_PUBLIC_*` vars reach the client.
- All user-facing strings (UI, tRPC error messages, Pusher event names) are Traditional Chinese.
- Deploys are automatic: pushing `main` builds the Dockerfile and deploys to Cloud Run (`.github/workflows/entry.yml`). Work on a branch and PR into `main`.
- After changing `prisma/schema.prisma`, run `pnpm db-migrate` (dev) and `pnpm db-generate`; never hand-edit `prisma/migrations/`.
