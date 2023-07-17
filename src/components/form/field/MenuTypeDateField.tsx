import { FieldValues } from 'react-hook-form'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { MenuType } from '@prisma/client'
import { twMerge } from 'tailwind-merge'

import { InputFieldProps, MenuDateTypeData } from './define'
import Select from '../base/Select'
import DateInput from '../base/DateInput'
import { MenuTypeName } from '@/lib/common'
import trpc from '@/lib/client/trpc'

function convertInputDateValueToDate(value: string | null) {
  if (!value) return null
  if (value === '') return null
  if (!value.includes('T')) value += 'T00:00:00'

  return new Date(value)
}

function convertDateToInputDateValue(
  date: Date | null | undefined,
  dateTime: boolean = false,
) {
  if (!date) return ''
  const offsetIsoDate = new Date(date.getTime() + 8 * 60 * 60000)
  if (dateTime) return offsetIsoDate.toISOString().split('.')[0]
  return offsetIsoDate.toISOString().split('T')[0]
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
type MenuTypeDateInputState = PartialBy<MenuDateTypeData, 'type'>

export default function MenuTypeDateField<T extends FieldValues>(
  props: InputFieldProps<'menuTypeDate', T>,
) {
  const [value, setValue] = useState<MenuTypeDateInputState>(
    props.formInput.defaultValue ?? {
      type: undefined,
      date: null,
      publishedDate: null,
      closedDate: null,
    },
  )
  const reservationDateRef = useRef<HTMLInputElement>(null)
  const publishedDateRef = useRef<HTMLInputElement>(null)
  const closedDateRef = useRef<HTMLInputElement>(null)
  const reservationMenusQuery = trpc.menu.getReservationsSince.useQuery({
    // three months ago from now and remove time
    date: new Date(
      new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000).setHours(
        0,
        0,
        0,
        0,
      ),
    ),
  })
  const invalidDates = useMemo(() => {
    if (!reservationMenusQuery.data) return []
    if (!value.type) return []
    const dates = reservationMenusQuery.data
      .filter((menu) => value.type === menu.type && menu.date)
      .map((menu) => menu.date!)
    return dates
  }, [reservationMenusQuery.data, value.type])

  // set options
  useEffect(() => {
    props.useFormReturns.register(props.formInput.name, props.formInput.options)
  }, [])

  // set rfh value
  useEffect(() => {
    if (!value.type) return
    const isReservation = value.type && !['LIVE', 'RETAIL'].includes(value.type)
    if (
      isReservation &&
      (!value.date || !value.publishedDate || !value.closedDate)
    ) {
      if (reservationDateRef.current && !value.date) {
        reservationDateRef.current.focus()
      } else if (publishedDateRef.current && !value.publishedDate) {
        publishedDateRef.current.focus()
      } else if (closedDateRef.current && !value.closedDate) {
        closedDateRef.current.focus()
      }
      props.useFormReturns.setError(props.formInput.name, {
        type: 'custom',
        message: '請提供下列日期',
      })
      return
    }
    props.useFormReturns.setValue(
      props.formInput.name,
      {
        type: value.type,
        date: isReservation ? value.date : null,
        publishedDate: isReservation ? value.publishedDate : null,
        closedDate: value.closedDate,
      } as Parameters<typeof props.useFormReturns.setValue>[1],
      { shouldDirty: true, shouldValidate: true },
    )
  }, [
    value,
    reservationDateRef.current,
    publishedDateRef.current,
    closedDateRef.current,
  ])

  // handle date change
  const handleDateChange = useCallback(
    (reservationDate: Date | null) => {
      if (!reservationDate) return

      const isReservation =
        value.type && !['LIVE', 'RETAIL'].includes(value.type)
      if (!isReservation) return

      // set published date on reservation date's last week friday 12:00
      const publishedDate = new Date(reservationDate)
      publishedDate.setDate(
        reservationDate.getDate() - reservationDate.getDay() - 2,
      )
      publishedDate.setHours(12, 0, 0, 0)
      // set closed date on one day before reservation date at 18:00
      const closedDate = new Date(reservationDate)
      closedDate.setDate(reservationDate.getDate() - 1)
      closedDate.setHours(18, 0, 0, 0)

      setValue((prev) => ({
        ...prev,
        publishedDate: publishedDate,
        closedDate: closedDate,
      }))
    },
    [value],
  )

  const isReservation = value.type && !['LIVE', 'RETAIL'].includes(value.type)

  return (
    <div className='flex flex-col gap-4'>
      <Select
        defaultValue={value.type}
        data={Object.entries(MenuTypeName).map(([value, label]) => ({
          label,
          value,
        }))}
        disabled={props.formInput.data?.isEdit}
        onChange={(e) => {
          const menuType = e.target.value as MenuType
          const isReservation = !['LIVE', 'RETAIL'].includes(menuType)
          setValue({
            ...value,
            ...(!isReservation && { closedDate: null }),
            type: menuType,
          })
        }}
      />
      <div className='flex flex-col gap-1'>
        <label
          className={twMerge(
            'text-sm font-bold text-stone-500',
            !isReservation && 'opacity-50',
          )}
        >
          預訂日期
        </label>
        <DateInput
          ref={reservationDateRef}
          className='text-sm'
          invalidDates={invalidDates}
          disabled={!isReservation || props.formInput.data?.isEdit}
          value={convertDateToInputDateValue(value?.date)}
          onChange={(e) => {
            const date = convertInputDateValueToDate(e.target.value)
            setValue({
              ...value,
              date,
            })
            handleDateChange(date)
          }}
        />
      </div>
      <div className='flex flex-col gap-1'>
        <label
          className={twMerge(
            'text-sm font-bold text-stone-500',
            !isReservation && 'opacity-50',
          )}
        >
          發佈時間
        </label>
        <DateInput
          ref={publishedDateRef}
          className='text-sm'
          includeTime={true}
          disabled={!isReservation}
          value={convertDateToInputDateValue(value?.publishedDate, true)}
          onChange={(e) =>
            setValue({
              ...value,
              publishedDate: convertInputDateValueToDate(e.target.value),
            })
          }
        />
      </div>
      <div className='flex flex-col gap-1'>
        <label className='text-sm font-bold text-stone-500'>關閉時間</label>
        <DateInput
          ref={closedDateRef}
          className='text-sm'
          includeTime={true}
          value={convertDateToInputDateValue(value?.closedDate, true)}
          onChange={(e) =>
            setValue({
              ...value,
              closedDate: convertInputDateValueToDate(e.target.value),
            })
          }
        />
      </div>
    </div>
  )
}
