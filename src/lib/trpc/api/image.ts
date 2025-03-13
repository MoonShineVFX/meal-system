import z from 'zod'

import { createImage, getImage } from '@/lib/server/database'
import { generateSignedUrl } from '@/lib/server/r2'
import { router, staffProcedure } from '../trpc'

export const ImageRouter = router({
  get: staffProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const image = await getImage({ id: input.id })

      if (image) {
        return {
          isFound: true,
          image: image,
        }
      } else {
        return {
          isFound: false,
          signedUrl: await generateSignedUrl(input.id),
        }
      }
    }),
  create: staffProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const image = await createImage({
        id: input.id,
      })

      return image
    }),
})

