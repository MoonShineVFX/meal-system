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
  width?: number
  height?: number
  prefix?: string
  path?: string
  id?: string
}
export async function createImage({
  width,
  height,
  prefix,
  path,
  id,
}: CreateImageArgs) {
  if (!path && !prefix) {
    throw new Error('Either path or prefix must be provided')
  }
  if (!path) {
    path = 'placeholder'
  }

  const image = await prisma.image.create({
    data: {
      id,
      path,
      width,
      height,
    },
  })

  if (path !== 'placeholder') {
    return image
  }

  return await prisma.image.update({
    where: {
      id: image.id,
    },
    data: {
      path: `${prefix}/${image.id}`,
    },
  })
}
