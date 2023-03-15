import { FieldValues } from 'react-hook-form'
import { InputFieldProps } from './define'

import DateInput from '../base/DateInput'

export default function DateField<T extends FieldValues>(
  props: InputFieldProps<'date', T>,
) {
  return (
    <DateInput
      className={props.formInput.coreClassName}
      {...props.formInput.attributes}
      {...props.useFormReturns.register(
        props.formInput.name,
        props.formInput.options,
      )}
    />
  )
}
