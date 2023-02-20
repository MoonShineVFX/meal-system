import { FieldValues } from 'react-hook-form'
import { useEffect, useState } from 'react'

import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'
import { InputFieldProps } from './define'

export default function SelectField<T extends FieldValues>(
  props: InputFieldProps<'select', T>,
) {
  const [selectedValue, setSelectedValue] = useState<
    typeof props.formInput.data[number]['value'] | undefined
  >(props.formInput.defaultValue)

  useEffect(() => {
    if (selectedValue) {
      props.useFormReturns.clearErrors(props.formInput.name)
      props.useFormReturns.setValue(
        props.formInput.name,
        selectedValue as Parameters<typeof props.useFormReturns.setValue>[1],
        { shouldDirty: true },
      )
    } else {
      if (props.formInput.attributes?.required) {
        props.useFormReturns.setError(props.formInput.name, {
          type: 'required',
          message: '請選擇項目',
        })
      }
    }
  }, [selectedValue])

  return (
    <DropdownMenu
      label={
        props.formInput.data.find((option) => option.value === selectedValue)
          ?.label ??
        props.formInput.attributes?.placeholder ??
        '請選擇項目'
      }
    >
      {props.formInput.data.map((option) => (
        <DropdownMenuItem
          key={option.value}
          label={option.label}
          onClick={() => setSelectedValue(option.value)}
        />
      ))}
    </DropdownMenu>
  )
}
