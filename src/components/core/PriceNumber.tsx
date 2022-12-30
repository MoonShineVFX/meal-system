import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { twMerge } from 'tailwind-merge'

export default function PriceNumber(props: {
  price: number
  className?: string
  isPayment?: boolean
  isNotEnough?: boolean
  isCurrency?: boolean
}) {
  const priceRef = useRef<HTMLSpanElement>(null)
  const [isInitialMount, setIsInitialMount] = useState(true)

  useEffect(() => {
    if (!priceRef.current) return
    const currentPrice = Number(priceRef.current.textContent)
    const controls = animate(currentPrice, props.price, {
      duration: isInitialMount ? 0 : 0.3,
      onUpdate: (value) => {
        if (!priceRef.current) return
        priceRef.current.textContent = value.toFixed(0)
      },
    })
    if (isInitialMount) setIsInitialMount(false)
    return () => controls.stop()
  }, [props.price, priceRef.current])

  const prefix = props.isPayment ? (props.price > 0 ? '-' : '') : ''

  return (
    <p
      className={twMerge(
        'rounded-xl font-bold group-data-loading:skeleton group-data-loading:min-w-[2em]',
        props.isCurrency && 'text-yellow-500',
        props.isNotEnough && 'text-red-400',
        props.className,
      )}
    >
      {prefix}
      {!props.isCurrency && !props.isPayment && '$'}
      <span ref={priceRef}>0</span>
    </p>
  )
}
