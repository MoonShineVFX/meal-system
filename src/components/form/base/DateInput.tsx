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
import { useIsFirstRender } from 'usehooks-ts'

import TextInput from './TextInput'
import {
  CalendarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

const DateInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> &
    Pick<Parameters<typeof DatePicker>[0], 'includeTime'> & {
      invalidDates?: Date[]
    }
>((props, ref) => {
  const { className, value, includeTime, invalidDates, ...rest } = props
  const [isOpenPicker, setIsOpenPicker] = useState<boolean>(false)
  const [dateValue, setDateValue] = useState<Date | undefined>(undefined)
  const textRef = useRef<HTMLInputElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dateString = useMemo(() => {
    if (!dateValue) return ''
    const year = dateValue.getFullYear()
    const month = dateValue.getMonth() + 1
    const day = dateValue.getDate()

    if (!includeTime) {
      return `${year}-${month.toString().padStart(2, '0')}-${day
        .toString()
        .padStart(2, '0')}`
    }

    const hour = dateValue.getHours()
    const minute = dateValue.getMinutes()
    return `${year}-${month.toString().padStart(2, '0')}-${day
      .toString()
      .padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`
  }, [dateValue, includeTime])
  const invalidTimes = useMemo(() => {
    if (!invalidDates) return []
    return invalidDates.map((date) => date.getTime())
  }, [invalidDates])
  const minTime = useMemo(() => {
    if (!rest.min) return undefined
    const date = new Date(rest.min)
    if (isNaN(date.getTime())) return undefined
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  }, [rest.min])
  const maxTime = useMemo(() => {
    if (!rest.max) return undefined
    const date = new Date(rest.max)
    if (isNaN(date.getTime())) return undefined
    date.setHours(23, 59, 59, 999)
    return date.getTime()
  }, [rest.max])

  // Detect Value Change
  useEffect(() => {
    if (typeof value !== 'string') return
    const newDate = new Date(value)
    if (isNaN(newDate.getTime())) {
      setDateValue(undefined)
    } else {
      setDateValue(newDate)
    }
  }, [value])

  // Update raw input value
  useEffect(() => {
    if (!inputRef.current) return
    // Accessing the value setter directly to trigger event listeners
    const valueSetter = Object.getOwnPropertyDescriptor(
      inputRef.current,
      'value',
    )?.set
    const prototype = Object.getPrototypeOf(inputRef.current)
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      'value',
    )?.set
    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter?.call(inputRef.current, dateString)
    } else {
      valueSetter?.call(inputRef.current, dateString)
    }
    inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
  }, [dateString, inputRef.current])

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
    let dateString = `${year}/${month.toString().padStart(2, '0')}/${day
      .toString()
      .padStart(2, '0')}`
    if (includeTime) {
      dateString += ` ${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}`
    }
    textRef.current.value = dateString
  }, [textRef.current, dateValue, includeTime])

  useEffect(() => {
    updateTextInputValue()
  }, [dateValue])

  const handleTextChanged = useCallback(
    (text: string) => {
      const date = new Date(text)
      const time = date.getTime()
      if (
        isNaN(time) ||
        (minTime && time < minTime) ||
        (maxTime && time > maxTime) ||
        invalidTimes.includes(new Date(date).setHours(0, 0, 0, 0))
      ) {
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
    <div
      className={twMerge(
        'relative w-full',
        rest.disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <input
        ref={(r) => {
          inputRef.current = r
          if (typeof ref === 'function') {
            ref(r)
          } else if (ref) {
            ref.current = r
          }
        }}
        type={includeTime ? 'datetime-local' : 'date'}
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
              handleTextChanged(textRef.current?.value || '')
              event.preventDefault()
              event.stopPropagation()
            }
          },
          placeholder: includeTime ? '選擇日期與時間' : '選擇日期',
          className: 'w-full pl-12',
        })}
      />
      <FloatingPortal>
        {isOpenPicker && (
          <DatePicker
            key='memo-date-picker'
            date={dateValue}
            onDateChange={setDateValue}
            includeTime={includeTime}
            invalidTimes={invalidTimes}
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
    includeTime?: boolean
    invalidTimes?: number[]
    minTime?: number
    maxTime?: number
  }
>((props, ref) => {
  const isFirst = useIsFirstRender()
  const {
    date: propDate,
    onDateChange,
    includeTime,
    invalidTimes,
    minTime,
    maxTime,
    ...rest
  } = props
  const [pickDate, setPickDate] = useState<Date>(new Date())
  const hourRef = useRef<HTMLDivElement | null>(null)
  const minuteRef = useRef<HTMLDivElement | null>(null)

  const [pageLayer, setPageLayer] = useState<'decade' | 'year' | 'month'>(
    'month',
  )
  const [pageDecade, setPageDecade] = useState<number>(
    Math.floor(new Date().getFullYear() / 10) * 10,
  )
  const [pageYear, setPageYear] = useState<number>(new Date().getFullYear())
  const [pageMonth, setPageMonth] = useState<number>(new Date().getMonth())

  const centerHoursMinutes = useCallback(
    (instant: boolean) => {
      if (hourRef.current && minuteRef.current && propDate) {
        const hours = propDate.getHours()
        const minutes = propDate.getMinutes()
        const hourElement = hourRef.current.children[
          hours + 1
        ] as HTMLDivElement
        const minuteElement = minuteRef.current.children[
          minutes + 1
        ] as HTMLDivElement
        if (!hourElement || !minuteElement) return
        hourRef.current.scrollTo({
          top:
            hourElement.offsetTop -
            hourRef.current.offsetHeight / 2 +
            hourElement.offsetHeight / 2,
          behavior: instant ? 'auto' : 'smooth',
        })
        minuteRef.current.scrollTo({
          top:
            minuteElement.offsetTop -
            minuteRef.current.offsetHeight / 2 +
            minuteElement.offsetHeight / 2,
          behavior: instant ? 'auto' : 'smooth',
        })
      }
    },
    [propDate, hourRef.current, minuteRef.current],
  )

  useEffect(() => {
    if (pageLayer === 'month') {
      centerHoursMinutes(true)
    }
  }, [pageLayer])

  useEffect(() => {
    if (
      !propDate ||
      isNaN(propDate.getTime()) ||
      propDate.getTime() === pickDate.getTime()
    )
      return

    setPickDate(propDate)
    setPageDecade(Math.floor(propDate.getFullYear() / 10) * 10)
    setPageYear(propDate.getFullYear())
    setPageMonth(propDate.getMonth())

    centerHoursMinutes(isFirst)
  }, [propDate, pickDate, hourRef.current, minuteRef.current])

  const handlePageChange = useCallback(
    (isForward: boolean) => {
      switch (pageLayer) {
        case 'decade':
          setPageDecade((year) => year + (isForward ? 10 : -10))
          break
        case 'year':
          setPageYear((month) => month + (isForward ? 1 : -1))
          break
        case 'month':
          const newMonth = pageMonth + (isForward ? 1 : -1)
          if (newMonth < 0) {
            setPageYear((month) => month - 1)
            setPageMonth(11)
          } else if (newMonth > 11) {
            setPageYear((month) => month + 1)
            setPageMonth(0)
          } else {
            setPageMonth(newMonth)
          }
          break
      }
    },
    [pageLayer, pageMonth],
  )

  const handleHeaderClick = useCallback(() => {
    switch (pageLayer) {
      case 'decade':
        break
      case 'year':
        setPageDecade(Math.floor(pageYear / 10) * 10)
        setPageLayer('decade')
        break
      case 'month':
        setPageLayer('year')
        break
    }
  }, [pageLayer, pageYear])

  const handleYearClick = useCallback((year: number) => {
    setPageYear(year)
    setPageLayer('year')
  }, [])

  const handleMonthClick = useCallback((month: number) => {
    setPageMonth(month)
    setPageLayer('month')
  }, [])

  const handleDayClick = useCallback(
    (dayDate: Date, keepTime?: boolean) => {
      const newDate = new Date(pickDate)
      newDate.setFullYear(dayDate.getFullYear())
      newDate.setMonth(dayDate.getMonth())
      newDate.setDate(dayDate.getDate())
      if (keepTime) {
        newDate.setHours(dayDate.getHours())
        newDate.setMinutes(dayDate.getMinutes())
      }

      setPageLayer('month')
      onDateChange?.(newDate)
    },
    [pickDate],
  )

  return (
    <div ref={ref} {...rest}>
      <div className='flex'>
        {/* Main */}
        <div>
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
                disabled={pageLayer === 'decade'}
                onClick={handleHeaderClick}
              >
                {pageLayer === 'decade' && `${pageDecade} - ${pageDecade + 9}`}
                {pageLayer === 'year' && `${pageYear}年`}
                {pageLayer === 'month' &&
                  `${new Date(pageYear, pageMonth).toLocaleString('default', {
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
          {pageLayer === 'decade' && (
            <div className='grid grid-cols-4 gap-1'>
              {Array.from({ length: 10 }).map((_, index) => (
                <button
                  key={`year-${pageDecade + index}`}
                  className={twMerge(
                    'rounded-lg px-2 py-1 hover:bg-stone-200 active:scale-90',
                    pageDecade + index === pickDate.getFullYear() &&
                      'bg-yellow-400 hover:bg-yellow-500',
                  )}
                  onClick={() => handleYearClick(pageDecade + index)}
                >
                  {pageDecade + index}
                </button>
              ))}
            </div>
          )}
          {/* month picker */}
          {pageLayer === 'year' && (
            <div className='grid grid-cols-4 gap-1'>
              {Array.from({ length: 12 }).map((_, index) => (
                <button
                  key={`month-${pageYear + index}`}
                  className={twMerge(
                    'rounded-lg px-2 py-1 hover:bg-stone-200 active:scale-90',
                    pageYear === pickDate.getFullYear() &&
                      index === pickDate.getMonth() &&
                      'bg-yellow-400 hover:bg-yellow-500',
                  )}
                  onClick={() => handleMonthClick(index)}
                >
                  {new Date(pageYear, index).toLocaleString('default', {
                    month: 'short',
                  })}
                </button>
              ))}
            </div>
          )}
          {/* day picker */}
          {pageLayer === 'month' && (
            <div className={twMerge('relative grid grid-cols-7 gap-1')}>
              {/* main */}
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
                const date = new Date(pageYear, pageMonth, 1)
                const dayOfWeek = date.getDay()
                date.setDate(index - dayOfWeek + 1)
                date.setHours(0, 0, 0, 0)

                const isCurrentMonth = date.getMonth() === pageMonth
                const isSelectedDate =
                  date.getFullYear() === pickDate.getFullYear() &&
                  date.getMonth() === pickDate.getMonth() &&
                  date.getDate() === pickDate.getDate() &&
                  propDate !== undefined

                const thisTime = date.getTime()
                const isInvalid =
                  (minTime && thisTime < minTime) ||
                  (maxTime && thisTime > maxTime) ||
                  (invalidTimes && invalidTimes.includes(thisTime))

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
                      isSelectedDate && 'bg-yellow-400 hover:bg-yellow-500',
                      isInvalid &&
                        'pointer-events-none text-red-400 opacity-50',
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
              onClick={() => handleDayClick(new Date(), true)}
            >
              今天
            </button>
          </div>
        </div>
        {/* time picker */}
        {pageLayer === 'month' && includeTime && (
          <div className='mt-12 ml-4 flex border-l pl-4'>
            <div className='relative h-full w-8'>
              <div
                ref={hourRef}
                className='absolute inset-0 overflow-y-auto scrollbar-none'
              >
                <div className='h-1/2 w-full'></div>
                {Array.from({ length: 24 }).map((_, index) => (
                  <button
                    key={`hour-${index}`}
                    className={twMerge(
                      'rounded-md p-1 text-center font-mono text-lg text-stone-400 hover:bg-stone-200 hover:text-stone-500 active:scale-90',
                      index === pickDate.getHours() &&
                        propDate !== undefined &&
                        'bg-yellow-400 text-stone-600 hover:bg-yellow-500',
                    )}
                    onClick={() => {
                      const date = new Date(pickDate)
                      date.setHours(index)
                      onDateChange?.(date)
                    }}
                  >
                    {index.toString().padStart(2, '0')}
                  </button>
                ))}
                <div className='h-1/2 w-full'></div>
              </div>
            </div>
            <div className='relative h-full w-8 border-l border-dashed border-stone-100'>
              <div
                ref={minuteRef}
                className='absolute inset-0 overflow-y-auto pl-1 scrollbar-none'
              >
                <div className='h-1/2 w-full'></div>
                {Array.from({ length: 60 }).map((_, index) => (
                  <button
                    key={`min-${index}`}
                    className={twMerge(
                      'rounded-md p-1 text-center font-mono text-lg text-stone-400 hover:bg-stone-200 hover:text-stone-500 active:scale-90',
                      index === pickDate.getMinutes() &&
                        propDate !== undefined &&
                        'bg-yellow-400 text-stone-600 hover:bg-yellow-500',
                    )}
                    onClick={() => {
                      const date = new Date(pickDate)
                      date.setMinutes(index)
                      onDateChange?.(date)
                    }}
                  >
                    {index.toString().padStart(2, '0')}
                  </button>
                ))}
                <div className='h-1/2 w-full'></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default DateInput
