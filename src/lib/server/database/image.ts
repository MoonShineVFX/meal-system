import { settings } from '@/lib/common'

import { prisma } from './define'

/* Check Image */
export async function getImage(props: { id: string }) {
  const image = await prisma.image.findUnique({
    where: {
      id: props.id,
    },
  })

  return image
}

/* Create Image */
type CreateImageArgs = {
  id: string
}
export async function createImage({ id }: CreateImageArgs) {
  return await prisma.image.create({
    data: {
      id,
      path: `${settings.RESOURCE_UPLOAD_PATH}/${id}`,
    },
  })
}
