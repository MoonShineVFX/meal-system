import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

const DatetimeInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  const { className, ...rest } = props

  return (
    <input
      ref={ref}
      type='datetime-local'
      className={twMerge(
        'rounded-2xl border-stone-300 bg-stone-50 text-stone-600 focus:border-yellow-500 focus:ring-yellow-500 disabled:opacity-50',
        className,
      )}
      {...rest}
    />
  )
})

export default DatetimeInput
