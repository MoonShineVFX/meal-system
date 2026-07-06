---
name: database
description: "Prisma schema, migrations, and the data-access layer: prisma/schema.prisma, prisma/migrations, pnpm db-migrate/db-generate/db-seed, src/lib/server/database/* (transaction, order, menu, cart, user, deposit, bonus), point vs credit balances, TransactionType, OrderStatus, MenuType, soft-delete isDeleted, fixed LIVE/RETAIL menus, optionSets Json fields."
---

# Database layer (Prisma + PostgreSQL)

## Layer map

| Path | Role |
|---|---|
| `prisma/schema.prisma` | Source of truth; migrate with `pnpm db-migrate`, regen client with `pnpm db-generate` |
| `src/lib/server/database/define.ts` | Prisma singleton (`prisma`), cached on `global` in dev |
| `src/lib/server/database/index.ts` | Re-exports every module; also exports the client as `prismaClient` |
| `src/lib/server/database/transaction.ts` | Balance mutations: `rechargeUserBalance(Base)`, `chargeUserBalance(Base)`, `refundUserBalance(Base)` |
| `src/lib/server/database/order.ts` | `createOrderFromCart`, `createOrderFromRetail`, `updateOrderStatus`, `completeDishedUpOrders` |
| `src/lib/server/database/menu.ts` | `upsertMenu` (wires Cronicle publish-notify, see **realtime**), `getMenuWithComs`, COM add/remove |
| `prisma/helpers/seed/` | Seed scripts; `prisma/helpers/scripts/` one-off maintenance scripts, run via `prisma/cmd.ts` (edit its import, then `pnpm cmd`) |

## Money invariants

- Two currencies on `User`: `pointBalance` (daily-recharged allowance, expires by recycle) and `creditBalance` (paid deposits). `CurrencyType` in `src/lib/common.ts`.
- Every balance change MUST pair the `user.update` increment/decrement with a `Transaction` row, inside one `prisma.$transaction`. Use the `*Base` variants (they accept a `client`) when composing into a larger transaction — e.g. `updateDeposit` calls `rechargeUserBalanceBase` with `creditAmount = deposit.amount * DEPOSIT_RATIO`.
- System accounts: `_server` (`SERVER_USER_ID`) is source/target for server-issued transactions; `_client` (`SERVER_CLIENTORDER_ID`) for client-order treats.
- `TransactionType.REFUND` exists in the enum but user-initiated refunds are not implemented (schema comment); it is only used for deposit refunds.

## Schema gotchas

- Soft delete via `isDeleted` on `Commodity`, `Menu`, `CommodityOnMenu`, `Supplier`, `Bonus` — queries must filter it; nothing is hard-deleted except cart items and tokens.
- Fixed singleton menus: `MENU_LIVE_ID = 1` (LIVE) and `MENU_RETAIL_ID = 2` (RETAIL) in `settings`; `deleteMenu` refuses these ids. Reservation menus are identified by `(date, type)` instead.
- `Order.status` was added later; the `time*` columns (`timePreparing/DishedUp/Completed/Canceled`) are still the underlying record — `ORDER_STATUS_MAP` in `src/lib/common.ts` maps between them. Set both when changing status.
- `optionSets` / `options` columns are untyped `Json`; type them with `ConvertPrismaJson<T>` from `src/lib/common.ts` after fetching.
- `OrderRecord.menuType` is a reserved string field, currently always `"LIVE"` (recent-purchase memory for the live menu).
