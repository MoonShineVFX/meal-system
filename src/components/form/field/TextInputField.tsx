import { FieldValues } from 'react-hook-form'
import { InputFieldProps, BaseLabel } from './define'

export default function TextInputField<T extends FieldValues>(
  props: InputFieldProps<'text', T>,
) {
  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        errorMessage={props.errorMessage}
      >
        <input
          type='text'
          className='mx-1 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 placeholder:text-stone-300 focus:border-yellow-500 focus:ring-yellow-500'
          {...props.formInput.attributes}
          {...props.register(props.formInput.name, props.formInput.options)}
        />
      </BaseLabel>
    </div>
  )
}
