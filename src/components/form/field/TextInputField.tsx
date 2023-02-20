import { FieldValues } from 'react-hook-form'
import { InputFieldProps } from './define'
import TextInput from '../base/TextInput'

export default function TextInputField<T extends FieldValues>(
  props: InputFieldProps<'text', T>,
) {
  return (
    <TextInput
      type='text'
      className={props.formInput.coreClassName}
      {...props.formInput.attributes}
      {...props.useFormReturns.register(
        props.formInput.name,
        props.formInput.options,
      )}
    />
  )
}
