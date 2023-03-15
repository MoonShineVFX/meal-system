import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  const { className, ...rest } = props

  return (
    <input
      ref={ref}
      type='text'
      className={twMerge(
        'mx-[1px] rounded-2xl border border-stone-300 bg-stone-50 py-2 px-4 placeholder:text-stone-400 focus:border-yellow-500 focus:ring-yellow-500',
        className,
      )}
      {...rest}
    />
  )
})

export default TextInput
