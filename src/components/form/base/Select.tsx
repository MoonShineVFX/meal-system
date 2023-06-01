import { forwardRef, useEffect, useRef, useCallback, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const Select = forwardRef<
  HTMLSelectElement,
  React.InputHTMLAttributes<HTMLSelectElement> & {
    data: { label: string; value: string }[]
    selectedClassName?: string
  }
>((props, ref) => {
  const { className, data, value, selectedClassName, ...rest } = props
  const selectRef = useRef<HTMLSelectElement>(null)
  const [selectedValue, setSelectedValue] = useState<
    string | number | readonly string[] | undefined
  >(selectRef.current?.value ?? props.defaultValue ?? '')

  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(selectRef.current)
      } else {
        ref.current = selectRef.current
      }
    }
  }, [selectRef.current])

  // watch for changes to ref's value
  useEffect(() => {
    const handleChange = () => {
      setSelectedValue(selectRef.current?.value ?? '')
    }
    selectRef.current?.addEventListener('change', handleChange)
    return () => {
      selectRef.current?.removeEventListener('change', handleChange)
    }
  }, [selectRef.current])

  // watch for changes to props.value
  useEffect(() => {
    if (props.value !== undefined) {
      setSelectedValue(props.value)
    }
  }, [props.value])

  const handleSetValue = useCallback(
    (value: string) => {
      if (!selectRef.current) return
      selectRef.current.value = value
      selectRef.current.dispatchEvent(
        new Event('input', { bubbles: true, cancelable: true }),
      )
      selectRef.current.dispatchEvent(
        new Event('change', { bubbles: true, cancelable: false }),
      )
    },
    [selectRef.current],
  )

  return (
    <>
      <select ref={selectRef} className='sr-only' {...rest}>
        {!props.defaultValue && <option value={undefined}></option>}
        {data.map((option) => (
          <option key={option.value} value={option.value}></option>
        ))}
      </select>
      <DropdownMenu
        disabled={rest.disabled}
        className={twMerge(
          'flex w-full justify-center border border-stone-300 bg-stone-50 p-2 text-base hover:bg-stone-200',
          className,
          selectedValue && selectedClassName,
          rest.disabled && 'pointer-events-none',
        )}
        label={
          <span className='relative w-full'>
            {data.find((option) => option.value === selectedValue)?.label ??
              props.placeholder ??
              '請選擇一個選項'}
            <ChevronDownIcon className='absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-stone-500' />
          </span>
        }
        floating={{
          placement: 'bottom',
        }}
      >
        {data.map((option) => (
          <DropdownMenuItem
            key={option.value}
            label={option.label}
            onClick={() => handleSetValue(option.value)}
            className={twMerge(
              option.value === selectedValue && 'bg-yellow-100',
            )}
          />
        ))}
      </DropdownMenu>
    </>
  )
})

export default Select
