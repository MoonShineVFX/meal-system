import { TRPCError, initTRPC } from '@trpc/server'

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure

// const isAuthed = t.middleware(({ next, ctx }) => {
//   if (!ctx.session?.user?.email) {
//     throw new TRPCError({
//       code: 'UNAUTHORIZED',
//     });
//   }
//   return next({
//     ctx: {
//       session: ctx.session,
//     },
//   });
// });

// export const protectedProcedure = t.procedure.use(isAuthed);
