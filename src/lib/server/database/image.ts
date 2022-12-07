import { prisma } from './define'

export async function createImage(
  width: number,
  height: number,
  prefix?: string,
  path?: string,
) {
  if (!path && !prefix) {
    throw new Error('Either path or prefix must be provided')
  }
  if (!path) {
    path = 'placeholder'
  }

  const image = await prisma.image.create({
    data: {
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
