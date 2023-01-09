import Spinner from './Spinner'
import { twMerge } from 'tailwind-merge'
import { twData } from '@/lib/common'
import { motion } from 'framer-motion'

const themes = {
  main: 'bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-400 data-busy:bg-yellow-600 data-busy:hover:bg-yellow-600 text-yellow-900 shadow data-busy:text-black disabled:opacity-50',
  secondary:
    'bg-white border border-stone-200 hover:bg-stone-50 active:bg-stone-50 data-busy:bg-stone-100 data-busy:hover:bg-stone-100 shadow',
  support:
    'hover:bg-stone-100 active:bg-stone-100 data-busy:bg-stone-200 data-busy:hover:bg-stone-200',
  danger:
    'bg-red-400 hover:bg-red-300 active:bg-red-300 data-busy:bg-red-500 data-busy:hover:bg-red-500 text-white shadow data-busy:text-red-200 disabled:opacity-50',
}

export default function Button(props: {
  className?: string
  isDisabled?: boolean
  isBusy?: boolean
  isLoading?: boolean
  isSuccess?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  label: string | JSX.Element
  labelOnSuccess?: string | JSX.Element
  textClassName?: string
  spinnerClassName?: string
  theme?: keyof typeof themes
  title?: string
}) {
  const themeColor = themes[props.theme ?? 'main']
  const isBusy = props.isBusy ?? props.isLoading ?? false

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 600,
        damping: 10,
      }}
      disabled={props.isDisabled ?? isBusy ?? false}
      className={twMerge(
        `relative flex items-center justify-center rounded-2xl indent-[0.1em] tracking-widest focus:outline-none disabled:pointer-events-none`,
        themeColor,
        props.className,
      )}
      type={props.type ?? 'button'}
      onClick={props.onClick}
      title={props.title}
      {...twData({ busy: isBusy })}
    >
      <span
        className={twMerge(
          (props.isLoading || (props.isSuccess && props.labelOnSuccess)) &&
            'invisible',
          props.textClassName,
        )}
      >
        {props.label}
      </span>
      <span
        className={twMerge(
          'absolute hidden',
          props.textClassName,
          props.isSuccess && 'block',
        )}
      >
        {props.labelOnSuccess}
      </span>
      <Spinner
        className={twMerge(
          'absolute hidden h-6 w-6',
          props.isLoading && 'block',
          props.spinnerClassName,
        )}
      />
    </motion.button>
  )
}
