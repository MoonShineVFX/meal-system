import Spinner from './Spinner'
import { twMerge } from 'tailwind-merge'
import { twData } from '@/lib/common'

const themes: Record<string, string> = {
  main: 'bg-violet-500 hover:bg-violet-600 active:bg-violet-600 data-busy:bg-violet-400 data-busy:hover:bg-violet-400 text-violet-50 shadow-md',
  secondary:
    'bg-gray-100 border border-gray-300 hover:bg-violet-100 active:bg-violet-100 data-busy:bg-violet-100 data-busy:hover:bg-violet-100 text-violet-500 shadow-md',
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
