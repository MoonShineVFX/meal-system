import Spinner from './Spinner'
import { twMerge } from 'tailwind-merge'

type ThemeColor = {
  text: string
  base: string
  hover: string
  disabled: string
}

const theme: Record<string, ThemeColor> = {
  main: {
    text: 'text-gray-100',
    base: 'bg-violet-500',
    hover: 'bg-violet-600',
    disabled: 'bg-violet-400',
  },
}

export default function Button(props: {
  className?: string
  isDisabled?: boolean
  isLoading?: boolean
  isSuccess?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  text: string
  textOnSuccess?: string
  textClassName?: string
  spinnerClassName?: string
  theme?: keyof typeof theme
}) {
  const content = props.isSuccess ? (
    <p className={props.textClassName}>{props.textOnSuccess ?? props.text}</p>
  ) : props.isLoading ? (
    <Spinner className={props.spinnerClassName ?? 'h-6 w-6'} />
  ) : (
    <p className={props.textClassName}>{props.text}</p>
  )
  const themeColor = theme[props.theme ?? 'main']
  console.log('render button')

  return (
    <button
      disabled={props.isDisabled}
      className={twMerge(
        `flex items-center justify-center rounded-md ${themeColor.base} tracking-widest ${themeColor.text} hover:${themeColor.hover} active:${themeColor.hover} disabled:${themeColor.disabled} disabled:hover:${themeColor.disabled}`,
        props.className,
      )}
      type={props.type ?? 'button'}
    >
      {content}
    </button>
  )
}
