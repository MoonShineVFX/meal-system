import { FieldValues } from 'react-hook-form'

import { InputFieldProps } from './define'
import TextArea from '../base/TextArea'

export default function TextAreaField<T extends FieldValues>(
  props: InputFieldProps<'textarea', T>,
) {
  return (
    <TextArea
      type='text'
      className={props.formInput.coreClassName}
      {...props.useFormReturns.register(
        props.formInput.name,
        props.formInput.options,
      )}
    />
  )
}
