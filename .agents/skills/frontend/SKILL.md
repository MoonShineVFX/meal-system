---
name: frontend
description: "Next.js pages-router UI: src/pages (admin/pos/order catch-all tab pages), src/components (admin, cart, menu, pos, form/field system, core), zustand store with _local/_session persistence (src/lib/client/store), trpc client types (MenuData, CartData, COM naming), image/R2 resources, Tailwind twData conventions."
---

# Frontend (Next.js pages router + Tailwind)

## Layer map

| Path | Role |
|---|---|
| `src/pages/_app.tsx` | Global shell: Navigation + overlays (`EventListener`, `AuthValidator`, `Notification`, `RouteProgress`), wrapped by `trpc.withTRPC` |
| `src/pages/{admin,pos,order}/[[...Args]].tsx` | Optional catch-all "tab" pages — path segment picks a tab, validated in `getServerSideProps` |
| `src/components/admin/*` | One component per admin tab |
| `src/components/form/` | `FormDialog` + declarative field system (`field/index.tsx`, `field/define.tsx`); base inputs in `form/base/` |
| `src/lib/client/trpc.ts` | tRPC client + ALL derived data types (`MenuData`, `CartData`, `POSLiveDatas`…) + global error-toast link |
| `src/lib/client/store/` | Zustand store (notification / ui / setting slices) |
| `src/lib/client/{printer,sw,pusher,r2}.ts` | POS label printer API, service-worker handler, pusher client, image upload |

## Conventions & invariants

- "COM" = CommodityOnMenu everywhere (`COMCard`, `COMDialog`, `MenuCOMField`).
- UI copy is Traditional Chinese; tab routing maps zh-TW names to URL paths. **Adding an admin tab** touches `TAB_NAMES`, `TAB_PATHS`, `dividers` and the render switch in `src/pages/admin/[[...adminArgs]].tsx` plus a new `src/components/admin/<Name>.tsx`.
- Zustand persistence is keyed by suffix: state keys ending `_local` persist to localStorage, `_session` to sessionStorage (custom `storage` in `store/index.ts`). A new persisted key needs BOTH the suffix and an entry in `partialize`. Unsuffixed keys are memory-only.
- Server state belongs in react-query via tRPC hooks; cache freshness is driven by Pusher events (see **realtime**) — do not add polling.
- Images use a custom Next loader; build URLs with `getResourceUrl()` / `getResourceUrlByWidth()` (`src/lib/common.ts`, size variants xs/sm/md/lg). Uploads go to Cloudflare R2 via presigned URLs (`src/lib/server/r2.ts` + `image` router).
- Tailwind state styling uses `twData({ selected, loading, busy, available })` which writes a `data-ui` attribute; variants target it (see `tailwind.config.cjs`). Merge classes with `twMerge`.
- Formatting: prettier with `semi: false`, single quotes, `prettier-plugin-tailwindcss`. No ESLint config — prettier is the only formatter.
- Root `/` redirects to `/live` (`next.config.js`).
