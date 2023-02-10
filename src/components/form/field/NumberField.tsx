import { FieldValues } from 'react-hook-form'

import { BaseLabel, InputFieldProps } from './define'

export default function NumberField<T extends FieldValues>(
  props: InputFieldProps<'number', T>,
) {
  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        errorMessage={props.errorMessage}
      >
        <input
          type='number'
          className='mx-1 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 placeholder:text-stone-300 focus:border-yellow-500 focus:ring-yellow-500'
          min={
            typeof props.formInput.options?.min === 'number'
              ? props.formInput.options.min
              : typeof props.formInput.options?.min === 'string'
              ? parseInt(props.formInput.options?.min)
              : props.formInput.options?.min?.value !== undefined
              ? props.formInput.options?.min?.value
              : undefined
          }
          max={
            typeof props.formInput.options?.max === 'number'
              ? props.formInput.options.max
              : typeof props.formInput.options?.max === 'string'
              ? parseInt(props.formInput.options?.max)
              : props.formInput.options?.max?.value !== undefined
              ? props.formInput.options?.max?.value
              : undefined
          }
          {...props.formInput.attributes}
          {...props.register(props.formInput.name, {
            valueAsNumber: true,
            ...props.formInput.options,
          })}
        />
      </BaseLabel>
    </div>
  )
}
