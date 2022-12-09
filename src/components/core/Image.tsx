import NextImage, { ImageProps } from 'next/image'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { settings } from '@/lib/common'

const imageLoader = ({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) => {
  return `${settings.RESOURCE_URL}/image/${src}?width=${width}&quality=${
    quality || 75
  }`
}

export default function Image(
  props: ImageProps & { blurWidth?: number; blurHeight?: number },
) {
  const { className, blurWidth, blurHeight, ...rest } = props
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <>
      {!isLoaded && (
        <img
          className={twMerge('absolute inset-0 h-full w-full', className)}
          src={makeShimmer(props.blurWidth ?? 100, props.blurHeight ?? 50)}
        />
      )}
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

/* Shimmer */

const SHIMMER_COLOR_A = '#d6d3d1'
const SHIMMER_COLOR_B = '#a8a29e'

const generateSvg = (w: number, h: number) => `
<svg width='${w}' height='${h}' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>
  <defs>
    <linearGradient id='g'>
      <stop stop-color='${SHIMMER_COLOR_A}' offset='0%' />
      <stop stop-color='${SHIMMER_COLOR_B}' offset='50%' />
      <stop stop-color='${SHIMMER_COLOR_A}' offset='100%' />
    </linearGradient>
  </defs>
  <rect width='${w}' height='${h}' fill='${SHIMMER_COLOR_A}' />
  <rect id='r' width='${w}' height='${h}' fill='url(#g)' />
  <animate xlink:href='#r' attributeName='x' from='-${w}' to='${w}' dur='1.0s' repeatCount='indefinite' />
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

function makeShimmer(width: number, height: number) {
  return `data:image/svg+xml;base64,${toBase64(generateSvg(width, height))}`
}
