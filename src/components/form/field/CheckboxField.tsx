import { FieldValues } from 'react-hook-form'
import { InputFieldProps } from './define'

export default function CheckboxField<T extends FieldValues>(
  props: InputFieldProps<'checkbox', T>,
) {
  return (
    <div className={props.formInput.className}>
      <label className='flex cursor-pointer items-center gap-2'>
        <input
          type='checkbox'
          className='focus:ring-none h-5 w-5 cursor-pointer rounded-lg border-stone-300 text-yellow-500 focus:ring-transparent'
          {...props.formInput.attributes}
          {...props.register(props.formInput.name, props.formInput.options)}
        />
        <span className='font-bold text-stone-500'>
          {props.formInput.label}
        </span>
        <span className='ml-[1ch] text-red-400'>{props.errorMessage}</span>
      </label>
    </div>
  )
}
