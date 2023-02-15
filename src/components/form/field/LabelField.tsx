import { FieldValues } from 'react-hook-form'
import { InputFieldProps, BaseLabel } from './define'

export default function LabelField<T extends FieldValues>(
  props: Omit<InputFieldProps<'label', T>, 'register' | 'errorMessage'>,
) {
  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        className={props.formInput.className}
      ></BaseLabel>
    </div>
  )
}
