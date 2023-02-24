import { FieldValues } from 'react-hook-form'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MenuType } from '@prisma/client'
import { twMerge } from 'tailwind-merge'

import { InputFieldProps } from './define'
import Select from '../base/Select'
import DateInput from '../base/DateInput'
import DatetimeInput from '../base/DatetimeInput'
import { MenuTypeName } from '@/lib/common'

type MenuTypeValue = {
  type: MenuType | undefined
  date: string | null
  publishedDate: string | null
  closedDate: string | null
}

export default function MenuTypeDateField<T extends FieldValues>(
  props: InputFieldProps<'menuTypeDate', T>,
) {
  const [value, setValue] = useState<MenuTypeValue>(
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
  }, [value])

  // handle date change
  const handleDateChange = useCallback(
    (reservationDateValue: string) => {
      const isReservation =
        value.type && !['LIVE', 'RETAIL'].includes(value.type)
      if (!isReservation) return

      const reservationDate = new Date(reservationDateValue)

      // set published date on reservation date's last week friday 12:00
      const publishedDate = new Date(reservationDate)
      publishedDate.setDate(
        reservationDate.getDate() - reservationDate.getDay() - 2,
      )
      publishedDate.setHours(12 + 8, 0, 0, 0)
      // set closed date on one day before reservation date at 18:00
      const closedDate = new Date(reservationDate)
      closedDate.setDate(reservationDate.getDate() - 1)
      closedDate.setHours(18 + 8, 0, 0, 0)

      setValue((prev) => ({
        ...prev,
        publishedDate: publishedDate.toISOString().split('.')[0],
        closedDate: closedDate.toISOString().split('.')[0],
      }))
    },
    [value],
  )

  const isReservation = value.type && !['LIVE', 'RETAIL'].includes(value.type)

  return (
    <div className='flex flex-col gap-4'>
      <Select
        data={Object.entries(MenuTypeName).map(([value, label]) => ({
          label,
          value,
        }))}
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
          disabled={!isReservation}
          value={value?.date ?? ''}
          onChange={(e) => {
            setValue({
              ...value,
              date: e.target.value === '' ? null : e.target.value,
            })
            handleDateChange(e.target.value)
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
        <DatetimeInput
          ref={publishedDateRef}
          className='text-sm'
          disabled={!isReservation}
          value={value?.publishedDate ?? ''}
          onChange={(e) =>
            setValue({
              ...value,
              publishedDate: e.target.value === '' ? null : e.target.value,
            })
          }
        />
      </div>
      <div className='flex flex-col gap-1'>
        <label className='text-sm font-bold text-stone-500'>關閉時間</label>
        <DatetimeInput
          ref={closedDateRef}
          className='text-sm'
          value={value?.closedDate ?? ''}
          onChange={(e) =>
            setValue({
              ...value,
              closedDate: e.target.value === '' ? null : e.target.value,
            })
          }
        />
      </div>
    </div>
  )
}
