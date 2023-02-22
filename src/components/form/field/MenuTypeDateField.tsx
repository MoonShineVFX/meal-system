import { FieldValues } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { MenuType } from '@prisma/client'

import { InputFieldProps } from './define'
import Select from '../base/Select'
import DateInput from '../base/DateInput'
import { MenuTypeName } from '@/lib/common'

export default function MenuTypeDateField<T extends FieldValues>(
  props: InputFieldProps<'menuTypeDate', T>,
) {
  const [value, setValue] = useState<typeof props.formInput.defaultValue>(
    props.formInput.defaultValue,
  )
  const [menuType, setMenuType] = useState<MenuType | undefined>(undefined)
  const [hasChanged, setHasChanged] = useState(false)

  // set options
  useEffect(() => {
    props.useFormReturns.register(props.formInput.name, props.formInput.options)
  }, [])

  // set rfh value
  useEffect(() => {
    if (!hasChanged) return
    props.useFormReturns.setValue(
      props.formInput.name,
      value as Parameters<typeof props.useFormReturns.setValue>[1],
      { shouldDirty: true, shouldValidate: true },
    )
  }, [value, hasChanged])

  // on menuType change
  useEffect(() => {
    if (menuType === undefined) return
    setValue((prev) => {
      const prevData: Partial<NonNullable<typeof prev>> = prev
        ? { ...prev }
        : {}
      return ['LIVE', 'RETAIL'].includes(menuType)
        ? {
            ...prevData,
            type: menuType,
            date: null,
          }
        : {
            date: null,
            ...prevData,
            type: menuType,
          }
    })
  }, [menuType])

  return (
    <>
      <Select
        data={Object.entries(MenuTypeName).map(([value, label]) => ({
          label,
          value,
        }))}
        onChange={(e) => {
          setHasChanged(true)
          setMenuType(e.target.value as MenuType)
        }}
      />
      <DateInput
        disabled={
          menuType === undefined ||
          (menuType && ['LIVE', 'RETAIL'].includes(menuType))
        }
      />
    </>
  )
}
