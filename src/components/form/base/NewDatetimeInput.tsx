import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { forwardRef } from 'react'
import {
  useFloating,
  FloatingPortal,
  autoUpdate,
  useDismiss,
  useInteractions,
  offset,
  shift,
  autoPlacement,
} from '@floating-ui/react'
import { twMerge } from 'tailwind-merge'

import TextInput from './TextInput'
import {
  CalendarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

const DatetimeInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  const { className, value, ...rest } = props
  const [isOpenPicker, setIsOpenPicker] = useState<boolean>(false)
  const [dateValue, setDateValue] = useState<Date | undefined>(
    typeof value === 'string' ? new Date(value) : undefined,
  )
  const textRef = useRef<HTMLInputElement | null>(null)
  const dateString = useMemo(() => {
    if (!dateValue) return ''
    const year = dateValue.getFullYear()
    const month = dateValue.getMonth() + 1
    const day = dateValue.getDate()
    const hour = dateValue.getHours()
    const minute = dateValue.getMinutes()
    return `${year}-${month.toString().padStart(2, '0')}-${day
      .toString()
      .padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`
  }, [dateValue])

  // Floating UI
  const { refs, context, x, y, strategy } = useFloating({
    open: isOpenPicker,
    onOpenChange: setIsOpenPicker,
    middleware: [
      offset(8),
      shift(),
      autoPlacement({
        allowedPlacements: ['top', 'bottom'],
      }),
    ],
    whileElementsMounted: autoUpdate,
  })
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useDismiss(context),
  ])

  const updateTextInputValue = useCallback(() => {
    if (!textRef.current) return
    if (!dateValue) {
      textRef.current.value = ''
      return
    }

    const year = dateValue.getFullYear()
    const month = dateValue.getMonth() + 1
    const day = dateValue.getDate()
    const hour = dateValue.getHours()
    const minute = dateValue.getMinutes()
    const dateString = `${year}/${month.toString().padStart(2, '0')}/${day
      .toString()
      .padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`
    textRef.current.value = dateString
  }, [textRef.current, dateValue])

  useEffect(() => {
    updateTextInputValue()
  }, [dateValue])

  const handleTextChanged = useCallback(
    (text: string) => {
      const date = new Date(text)
      if (date.toString() === 'Invalid Date') {
        updateTextInputValue()
        return
      }

      if (date === dateValue) {
        updateTextInputValue() // force update text input value if date is same
      } else {
        setDateValue(date)
      }
    },
    [dateValue],
  )

  return (
    <div className='relative w-full'>
      <input
        ref={ref}
        value={dateString}
        type='datetime-local'
        className='sr-only'
        {...rest}
      />
      <div className='absolute inset-y-0 left-4 flex items-center'>
        <CalendarIcon className='w-6' />
      </div>
      <TextInput
        ref={(r) => {
          textRef.current = r
          refs.setReference(r)
        }}
        {...getReferenceProps({
          onFocus: () => {
            setIsOpenPicker(true)
          },
          onBlur: () => {
            handleTextChanged(textRef.current?.value || '')
          },
          onKeyDown: (event) => {
            if (event.key === 'Enter') {
              // setIsOpenPicker(false)
              handleTextChanged(textRef.current?.value || '')
            }
          },
          placeholder: '選擇日期',
          className: 'w-full pl-12',
        })}
      />
      <FloatingPortal>
        {isOpenPicker && (
          <DatePicker
            date={dateValue}
            onDateChange={setDateValue}
            {...getFloatingProps({
              ref: refs.setFloating,
              className:
                'z-50 rounded-2xl border border-stone-200 bg-white p-4 shadow-md',
              style: {
                position: strategy,
                left: x ?? 0,
                top: y ?? 0,
              },
            })}
          />
        )}
      </FloatingPortal>
    </div>
  )
})

const DatePicker = forwardRef<
  HTMLInputElement,
  React.HTMLAttributes<HTMLDivElement> & {
    date?: Date
    onDateChange?: (date: Date | undefined) => void
  }
>((props, ref) => {
  const { date: propDate, onDateChange, ...rest } = props
  const [pickRange, setPickRange] = useState<'year' | 'month' | 'day'>('day')
  const [pickDate, setPickDate] = useState<Date>(propDate || new Date())

  const [pageYear, setPageYear] = useState<number>(
    Math.floor((propDate ?? new Date()).getFullYear() / 10) * 10,
  )
  const [pageMonth, setPageMonth] = useState<number>(
    (propDate ?? new Date()).getFullYear(),
  )
  const [pageDay, setPageDay] = useState<number>(
    (propDate ?? new Date()).getMonth(),
  )

  const handlePageChange = useCallback(
    (isForward: boolean) => {
      switch (pickRange) {
        case 'year':
          setPageYear((year) => year + (isForward ? 10 : -10))
          break
        case 'month':
          setPageMonth((month) => month + (isForward ? 1 : -1))
          break
        case 'day':
          const newMonth = pageDay + (isForward ? 1 : -1)
          if (newMonth < 0) {
            setPageMonth((month) => month - 1)
            setPageDay(11)
          } else if (newMonth > 11) {
            setPageMonth((month) => month + 1)
            setPageDay(0)
          } else {
            setPageDay(newMonth)
          }
          break
      }
    },
    [pickRange, pageDay],
  )

  const handleHeaderClick = useCallback(() => {
    switch (pickRange) {
      case 'year':
        break
      case 'month':
        setPageYear(Math.floor(pageMonth / 10) * 10)
        setPickRange('year')
        break
      case 'day':
        setPickRange('month')
        break
    }
  }, [pickRange, pageMonth])

  const handleYearClick = useCallback((year: number) => {
    setPageMonth(year)
    setPickRange('month')
  }, [])

  const handleMonthClick = useCallback((month: number) => {
    setPageDay(month)
    setPickRange('day')
  }, [])

  const handleDayClick = useCallback((newDate: Date) => {
    setPickRange('day')
    setPageDay(newDate.getMonth())
    setPageMonth(newDate.getFullYear())
    setPickDate(newDate)
    onDateChange?.(newDate)
  }, [])

  return (
    <div ref={ref} {...rest}>
      {/* pagination */}
      <div className='mb-4 flex'>
        <button
          className='rounded-full p-1 disabled:pointer-events-none disabled:opacity-50 hover:bg-stone-200 active:scale-90'
          onClick={() => handlePageChange(false)}
        >
          <ArrowLeftIcon className='w-5' />
        </button>
        <div className='grow text-center'>
          <button
            className='rounded-lg px-2 py-1 disabled:pointer-events-none hover:bg-stone-200 active:scale-90'
            disabled={pickRange === 'year'}
            onClick={handleHeaderClick}
          >
            {pickRange === 'year' && `${pageYear} - ${pageYear + 9}`}
            {pickRange === 'month' && `${pageMonth}年`}
            {pickRange === 'day' &&
              `${new Date(pageMonth, pageDay).toLocaleString('default', {
                year: 'numeric',
                month: 'short',
              })}`}
          </button>
        </div>
        <button
          className='rounded-full p-1 disabled:pointer-events-none disabled:opacity-50 hover:bg-stone-200 active:scale-90'
          onClick={() => handlePageChange(true)}
        >
          <ArrowRightIcon className='w-6' />
        </button>
      </div>
      {/* year picker */}
      {pickRange === 'year' && (
        <div className='grid grid-cols-4 gap-1'>
          {Array.from({ length: 10 }).map((_, index) => (
            <button
              key={`year-${pageYear + index}`}
              className={twMerge(
                'rounded-lg px-2 py-1 hover:bg-stone-200 active:scale-90',
                pageYear + index === pickDate.getFullYear() && 'bg-stone-200',
              )}
              onClick={() => handleYearClick(pageYear + index)}
            >
              {pageYear + index}
            </button>
          ))}
        </div>
      )}
      {/* month picker */}
      {pickRange === 'month' && (
        <div className='grid grid-cols-4 gap-1'>
          {Array.from({ length: 12 }).map((_, index) => (
            <button
              key={`month-${pageMonth + index}`}
              className={twMerge(
                'rounded-lg px-2 py-1 hover:bg-stone-200 active:scale-90',
                pageMonth === pickDate.getFullYear() &&
                  index === pickDate.getMonth() &&
                  'bg-stone-200',
              )}
              onClick={() => handleMonthClick(index)}
            >
              {new Date(pageMonth, index).toLocaleString('default', {
                month: 'short',
              })}
            </button>
          ))}
        </div>
      )}
      {/* day picker */}
      {pickRange === 'day' && (
        <div className='grid grid-cols-7 gap-1'>
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={`day-${index}`}
              className='flex items-center justify-center text-sm text-gray-500'
            >
              {new Date(2012, 0, index + 1).toLocaleString('default', {
                weekday: 'short',
              })}
            </div>
          ))}
          {Array.from({ length: 42 }).map((_, index) => {
            const date = new Date(pageMonth, pageDay, 1)
            const dayOfWeek = date.getDay()
            date.setDate(index - dayOfWeek + 1)
            const isCurrentMonth = date.getMonth() === pageDay

            const isSelectedDate =
              date.getFullYear() === pickDate.getFullYear() &&
              date.getMonth() === pickDate.getMonth() &&
              date.getDate() === pickDate.getDate() &&
              propDate !== undefined

            // remove next month row
            // if (
            //   date.getMonth() === pageDay + 1 &&
            //   date.getDay() < date.getDate()
            // ) {
            //   console.log(dayOfWeek, date.getDate())
            //   return null
            // }

            return (
              <button
                key={`day-${index}`}
                className={twMerge(
                  'flex items-center justify-center rounded-lg px-2 py-1 text-sm hover:bg-stone-200 active:scale-90',
                  !isCurrentMonth && 'text-stone-300',
                  isSelectedDate && 'bg-stone-200',
                )}
                onClick={() => handleDayClick(date)}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      )}
      {/* Utilities */}
      <div className='mt-4 flex justify-between'>
        <button
          className='rounded-lg px-2 py-1 text-sm text-red-400 hover:bg-stone-200 active:scale-90'
          onClick={() => onDateChange?.(undefined)}
        >
          清除
        </button>
        <button
          className='rounded-lg px-2 py-1 text-sm hover:bg-stone-200 active:scale-90'
          onClick={() => handleDayClick(new Date())}
        >
          今天
        </button>
      </div>
    </div>
  )
})

export default DatetimeInput
