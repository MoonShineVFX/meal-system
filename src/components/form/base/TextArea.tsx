import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.InputHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => {
  const { className, ...rest } = props

  return (
    <textarea
      ref={ref}
      className={twMerge(
        'ms-scroll mx-1 max-h-72 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 placeholder:text-stone-300 focus:border-yellow-500 focus:ring-yellow-500',
        className,
      )}
      {...rest}
    />
  )
})

export default TextArea
