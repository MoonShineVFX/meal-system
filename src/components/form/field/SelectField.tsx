import { FieldValues } from 'react-hook-form'

import { InputFieldProps } from './define'
import Select from '../base/Select'

export default function SelectField<T extends FieldValues>(
  props: InputFieldProps<'select', T>,
) {
  return (
    <Select
      data={props.formInput.data}
      className={props.formInput.coreClassName}
      {...props.formInput.attributes}
      {...props.useFormReturns.register(
        props.formInput.name,
        props.formInput.options,
      )}
    />
  )
}
