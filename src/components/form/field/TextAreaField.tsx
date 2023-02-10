import { FieldValues } from 'react-hook-form'

import { InputFieldProps, BaseLabel } from './define'

export default function TextAreaField<T extends FieldValues>(
  props: InputFieldProps<'textarea', T>,
) {
  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        errorMessage={props.errorMessage}
      >
        <textarea
          type='text'
          className='ms-scroll mx-1 max-h-72 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 placeholder:text-stone-300 focus:border-yellow-500 focus:ring-yellow-500'
          {...props.formInput.attributes}
          {...props.register(props.formInput.name, props.formInput.options)}
        />
      </BaseLabel>
    </div>
  )
}
