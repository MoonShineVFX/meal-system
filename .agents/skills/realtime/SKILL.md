---
name: realtime
description: "Realtime + notifications: Pusher channels and PUSHER_EVENT enum (src/lib/common/pusher.ts), emitPusherEvent/emitPusherWebhook (src/lib/server/pusher.ts), EventListener.tsx react-query invalidation map, web push notifications/badges (src/lib/server/webpush.ts), Cronicle scheduled menu-publish notify (src/lib/server/cronicle.ts)."
---

# Realtime events & notifications

## The Pusher contract

- Shared constants live in `src/lib/common/pusher.ts`. Channels: `public-message`, `private-user-message-<userId>`, `private-staff-message` (via `PUSHER_CHANNEL.PUBLIC / .USER(id) / .STAFF`). Every payload is sent under the single event name `PUSHER_EVENT_NOTIFY = 'notify'`; the payload's `type` field (enum `PUSHER_EVENT`) is the real discriminator.
- `PUSHER_EVENT` values are Traditional-Chinese user-facing strings — they double as the default toast message when the payload has no `message` and `skipNotify` is not set.
- Private channels authenticate through `src/pages/api/pusher/auth.ts`.

## Event flow (three files per new event)

1. Add the value to `PUSHER_EVENT` in `src/lib/common/pusher.ts`.
2. Server: `emitPusherEvent(channel, { type, message?, skipNotify?, link?, notificationType? })` from the tRPC mutation (see **server-api**). Emissions are fire-and-forget (not awaited for correctness; failures only log).
3. Client: add a `case` in the switch in `src/components/overlays/EventListener.tsx` that invalidates the affected react-query caches (`utils.<router>.<proc>.invalidate()`). An event without a case still shows a toast but refreshes nothing.

Gotchas in `EventListener.tsx`:
- `CATEGORY_*` and `OPTION_SETS_*` cases are intentionally empty (invalidation there caused admin forms to reset mid-edit); those caches are invalidated in the mutations' `onSuccess` instead.
- `MENU_LIVE_UPDATE` deliberately falls through into `MENU_RESERVATION_UPDATE`.

## Webhook channel

`emitPusherWebhook('ORDER_ADD', order)` publishes raw orders on the `webhook` channel for external consumers (kitchen printer / staff signal). `scripts/staff-signal-trigger.ts` (`pnpm test:signal`) is the manual test trigger.

## Web push (background notifications)

`webPusher` (`src/lib/server/webpush.ts`) sends VAPID web-push with two payload types: `notification` and `badge` (order count). Subscriptions live on `UserToken` rows; a failed push deletes the subscription. Client side is `src/lib/client/sw.ts` + the subscription wiring in `EventListener.tsx`.

## Cronicle (external cron)

`src/lib/server/cronicle.ts` is a REST client for a Cronicle server. There is exactly ONE managed event (`CRONICLE_EVENT_MENU_NOTIFY` env id): `upsertMenu` calls `updateMenuPublishNotifyEvent` to re-point its timing at the next menu `publishedDate`, which then POSTs `/api/utils/menu-publish-notify`. Daily point recharge (`/api/utils/recharge`) and dished-up completion (`/api/utils/complete-dishedup`) are triggered by external schedulers, not from this codebase.
