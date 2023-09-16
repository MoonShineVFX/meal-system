import { twMerge } from 'tailwind-merge'

export default function OptionPrice(props: {
  price: number
  className?: string
  dollarSign?: boolean
}) {
  if (props.price === 0) return null
  return (
    <span
      className={twMerge(
        'text-yellow-500',
        props.price < 0 && 'text-green-500',
        props.className,
      )}
    >
      {props.price > 0 ? (props.dollarSign ? '' : '+') : '-'}
      {props.dollarSign && '$'}
      {Math.abs(props.price)}
    </span>
  )
}
