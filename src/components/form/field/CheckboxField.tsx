import { FieldValues } from 'react-hook-form'

import { InputFieldProps } from './define'
import CheckBox from '../base/CheckBox'

export default function CheckboxField<T extends FieldValues>(
  props: InputFieldProps<'checkbox', T>,
) {
  return (
    <label className='flex cursor-pointer items-center gap-2'>
      <CheckBox
        {...props.formInput.attributes}
        {...props.useFormReturns.register(
          props.formInput.name,
          props.formInput.options,
        )}
      />
      <span className='font-bold text-stone-500'>{props.formInput.label}</span>
    </label>
  )
}
