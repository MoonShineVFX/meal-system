import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

const CheckBox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  const { className, ...rest } = props

  return (
    <input
      type='checkbox'
      ref={ref}
      className={twMerge(
        'focus:ring-none h-5 w-5 cursor-pointer rounded-lg border-stone-300 text-yellow-500 focus:ring-transparent hover:bg-stone-100',
        className,
      )}
      {...rest}
    />
  )
})

export default CheckBox
