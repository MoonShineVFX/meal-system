import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

const Toggle = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
    label?: string
    size?: 'sm' | 'md' | 'lg'
  }
>((props, ref) => {
  const { label, size, ...rest } = props

  return (
    <label className='relative inline-flex cursor-pointer items-center'>
      <input
        type='checkbox'
        value=''
        className='peer sr-only'
        ref={ref}
        {...rest}
      />
      <div
        className={twMerge(
          "peer h-6 w-11 rounded-full bg-stone-300 after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-yellow-400 peer-checked:after:translate-x-full peer-checked:after:border-white",
          size === 'sm' && 'h-5 w-9 after:h-4 after:w-4',
          size === 'lg' && 'h-7 w-14 after:h-6 after:w-6',
        )}
      ></div>
      {label && (
        <span className='ml-3 text-sm font-medium text-stone-400'>{label}</span>
      )}
    </label>
  )
})

export default Toggle
