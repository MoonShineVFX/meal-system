import { FieldValues } from 'react-hook-form'
import { InputFieldProps } from './define'

import DatetimeInput from '../base/DatetimeInput'

export default function DatetimeField<T extends FieldValues>(
  props: InputFieldProps<'datetime', T>,
) {
  return (
    <DatetimeInput
      className={props.formInput.coreClassName}
      {...props.formInput.attributes}
      {...props.useFormReturns.register(
        props.formInput.name,
        props.formInput.options,
      )}
    />
  )
}
