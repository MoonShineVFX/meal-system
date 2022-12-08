import Spinner from './Spinner'
import { twMerge } from 'tailwind-merge'
import { twData } from '@/lib/common'

const themes: Record<string, string> = {
  main: 'bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-400 data-busy:bg-yellow-600 data-busy:hover:bg-yellow-600 text-yellow-900 shadow-md data-busy:text-black',
  secondary:
    'bg-white border border-stone-200 hover:bg-stone-100 active:bg-stone-100 data-busy:bg-stone-200 data-busy:hover:bg-stone-200 shadow-md',
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
}) {
  const label =
    typeof props.label === 'string' ? (
      <p className={props.textClassName}>{props.label}</p>
    ) : (
      props.label
    )
  const labelOnSuccess =
    typeof props.labelOnSuccess === 'string' ? (
      <p className={props.textClassName}>{props.labelOnSuccess}</p>
    ) : (
      props.labelOnSuccess
    )
  const content = props.isSuccess ? (
    labelOnSuccess
  ) : props.isLoading ? (
    <Spinner className={props.spinnerClassName ?? 'h-6 w-6'} />
  ) : (
    label
  )
  const themeColor = themes[props.theme ?? 'main']

  return (
    <button
      disabled={props.isDisabled}
      data-ui={twData({ busy: props.isBusy })}
      className={twMerge(
        `flex items-center justify-center rounded-2xl tracking-widest`,
        themeColor,
        props.className,
      )}
      type={props.type ?? 'button'}
      onClick={props.onClick}
    >
      {content}
    </button>
  )
}
