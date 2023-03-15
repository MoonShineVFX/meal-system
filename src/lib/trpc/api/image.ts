import z from 'zod'

import { staffProcedure, router } from '../trpc'
import { getImage, createImage } from '@/lib/server/database'
import { settings } from '@/lib/common'

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
          apiKey: settings.BUNNY_API_KEY,
          url: settings.BUNNY_UPLOAD_URL,
        }
      }
    }),
  create: staffProcedure
    .input(
      z.object({
        id: z.string().min(1),
        path: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const image = await createImage({
        id: input.id,
        path: input.path,
      })

      return image
    }),
})
