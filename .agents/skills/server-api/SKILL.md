---
name: server-api
description: "tRPC API layer and REST util endpoints: src/lib/trpc/api/* routers, src/lib/trpc/trpc.ts procedures (commonProcedure/userProcedure/staffProcedure/adminProcedure), rate limiting via meta, meal_token cookie auth, external AUTH_API login/AD sync, and src/pages/api/utils/* endpoints (recharge, sync-users, menu-publish-notify, complete-dishedup)."
---

# Server API (tRPC + REST utils)

## Layer map

| Path | Role |
|---|---|
| `src/lib/trpc/trpc.ts` | Context (`userLite` from `meal_token` cookie via `getUserLite`) + procedure builders |
| `src/lib/trpc/api/router.ts` | `appRouter` — one sub-router per domain; register new routers here |
| `src/lib/trpc/api/*.ts` | Routers: thin zod validation + auth, delegate to `src/lib/server/database/*` (see **database**), then `emitPusherEvent` (see **realtime**) |
| `src/pages/api/trpc/[trpc].ts` | Next.js adapter |
| `src/pages/api/utils/*.ts` | REST endpoints called by external schedulers (Cronicle / Cloud Scheduler) |

## Invariants

- Procedure ladder: `commonProcedure` (rate limit only) → `userProcedure` (logged in) → `staffProcedure` → `adminProcedure`. Role check is weight-based (`validateRole`: ADMIN 100 ≥ STAFF 50 ≥ USER 10), so admins pass staff checks. Fine-grained flags (e.g. `CLIENT_ORDER`) use `validateAuthority` from `src/lib/common.ts`.
- Rate limiting is opt-in per procedure via `.meta({ rateLimit: { perSecond?, perMinute? } })` — implemented in the `commonProcedure` middleware, backed by `src/lib/server/rate-limiter.ts`.
- All user-facing error messages are Traditional Chinese strings (e.g. `'未登入'`, `'權限不足'`); the client error link (`src/lib/client/trpc.ts`) displays them verbatim as notifications.
- Login does NOT validate passwords locally for normal users: `user.login` POSTs to the external `AUTH_API_URL` service, then `ensureUser` upserts the local row. `/api/utils/sync-users` pulls the AD user list from `AUTH_API_URL/ad`.
- `order.addFromCart` serializes order creation through a global `PQueue({ concurrency: 1 })` (`src/lib/server/queue.ts`) to avoid stock race conditions. Keep new stock-mutating paths behind this queue.
- `src/pages/api/utils/recharge` and `menu-publish-notify` require `Authorization: Bearer ${AUTH_API_TOKEN}`. **Warning:** `complete-dishedup.ts` and `sync-users.ts` only check the HTTP method, no auth header — existing behavior, don't assume they're protected.

## Recipes

- **New API domain:** create `src/lib/trpc/api/<name>.ts` exporting a `router({...})`, register in `router.ts`, put DB logic in `src/lib/server/database/<name>.ts` and re-export it from `database/index.ts`. Client types for outputs are declared in `src/lib/client/trpc.ts` (`RouterOutput[...]` aliases).
- **New mutation:** after the DB call, emit the matching `PUSHER_EVENT` to `PUSHER_CHANNEL.STAFF` and/or `PUSHER_CHANNEL.USER(id)` — see **realtime** for the event/invalidation contract.
