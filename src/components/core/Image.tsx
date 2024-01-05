import NextImage, { ImageProps } from 'next/image'
import { useState } from 'react'

import { getResourceUrlByWidth } from '@/lib/common'

const imageLoader = ({
  src,
  width,
}: {
  src: string
  width: number
  quality?: number
}) => {
  return `${getResourceUrlByWidth(width)}/image/${src}`
}

export default function Image(
  props: ImageProps & { blurWidth?: number; blurHeight?: number },
) {
  const { className, blurWidth, blurHeight, ...rest } = props
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <>
      {!isLoaded && <div className='skeleton h-full w-full'></div>}
      <NextImage
        {...rest}
        className={className}
        onLoadingComplete={() => setIsLoaded(true)}
        loader={imageLoader}
        fill={true}
      />
    </>
  )
}
