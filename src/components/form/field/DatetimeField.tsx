import { FieldValues } from 'react-hook-form'
import { InputFieldProps } from './define'

import DateInput from '../base/DateInput'

export default function DatetimeField<T extends FieldValues>(
  props: InputFieldProps<'datetime', T>,
) {
  return (
    <DateInput
      includeTime={true}
      className={props.formInput.coreClassName}
      {...props.formInput.attributes}
      {...props.useFormReturns.register(
        props.formInput.name,
        props.formInput.options,
      )}
    />
  )
}
