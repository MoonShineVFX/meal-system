import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

const NumberInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { hideSpinner?: boolean }
>((props, ref) => {
  const { className, hideSpinner, ...rest } = props

  return (
    <input
      ref={ref}
      type='number'
      className={twMerge(
        'mx-1 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 placeholder:text-stone-300 focus:border-yellow-500 focus:ring-yellow-500',
        hideSpinner && 'no-spin',
        className,
      )}
      {...rest}
    />
  )
})

export default NumberInput
