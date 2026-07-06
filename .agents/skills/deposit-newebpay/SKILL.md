---
name: deposit-newebpay
description: "NewebPay (藍新金流) deposit/儲值 flow: src/lib/server/deposit/newebpay.ts (createMPGRequest AES/SHA encryption, handleTradeNotify), src/pages/api/deposit/newebpay/{notify,return}.ts callbacks, Deposit model and DepositStatus transitions, DEPOSIT_RATIO credit conversion, src/pages/deposit pages."
---

# Deposit flow (NewebPay 藍新金流)

## Flow

1. `deposit.create` (tRPC, see **server-api**) → `createDeposit` makes a `Deposit` row (status `PENDING`, id = base36 timestamp + random) and `createMPGRequest` builds the MPG form: trade params AES-encrypted with `NEWEBPAY_HASH_KEY/IV` + SHA checksum (`crypto-js`).
2. Client (`src/pages/deposit.tsx`) auto-submits that form to `${NEWEBPAY_API_URL}/MPG/mpg_gateway`.
3. NewebPay calls back:
   - `src/pages/api/deposit/newebpay/notify.ts` — server-to-server, authoritative; decrypts and hands to `handleTradeNotify` → `updateDeposit`.
   - `src/pages/api/deposit/newebpay/return.ts` — user browser redirect back to `/deposit/[depositId]`.
4. `updateDeposit` (`src/lib/server/database/deposit.ts`) is the ONLY place status transitions happen, inside one prisma transaction:
   - `PENDING → SUCCESS`: `rechargeUserBalanceBase` credits `deposit.amount * DEPOSIT_RATIO` as **creditBalance** (a `DEPOSIT` transaction linked via `depositId`).
   - `SUCCESS → REFUND`: `refundUserBalanceBase` decrements credit.
   - `FAILED` covers cancel/failure. Transitions also emit `DEPOSIT_*` pusher events (see **realtime**).
5. Reconciliation: `getAndUpdateTradeInfo` queries NewebPay's trade-info API for stuck `PENDING` deposits (used by `deposit.get`/admin refresh).

## Invariants

- Never mark a deposit SUCCESS outside `updateDeposit`; the status guard (`PENDING` precondition) is what makes the notify callback idempotent when NewebPay retries.
- Amount limits `DEPOSIT_MIN_AMOUNT`/`DEPOSIT_MAX_AMOUNT` and `DEPOSIT_RATIO` live in `settings` (`src/lib/common.ts`); ratio is env-overridable, default 1.0.
- All NewebPay credentials/URLs come from env (`NEWEBPAY_*`); the notify URL must be publicly reachable — local dev cannot receive callbacks, use the admin deposits tab's manual refresh (trade-info query) instead.
