import { twMerge } from 'tailwind-merge'
import { FieldValues } from 'react-hook-form'

import { InputFieldProps, BaseLabel } from './define'

export default function SelectField<T extends FieldValues>(
  props: InputFieldProps<'select', T>,
) {
  const selectSize = props.formInput.data.reduce(
    (acc, curr) => acc + ('children' in curr ? curr.children.length + 1 : 1),
    0,
  )
  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        errorMessage={props.errorMessage}
      >
        <select
          className={twMerge(
            'ms-scroll mx-1 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 focus:border-yellow-500 focus:ring-yellow-500',
            props.formInput.coreClassName,
          )}
          size={selectSize}
          {...props.formInput.attributes}
          {...props.register(props.formInput.name, {
            ...props.formInput.options,
          })}
        >
          {props.formInput.data.map((optionData) => {
            if ('children' in optionData) {
              return (
                <optgroup key={optionData.label} label={optionData.label}>
                  {optionData.children.map((child) => (
                    <option key={child.value} value={child.value}>
                      {child.label}
                    </option>
                  ))}
                </optgroup>
              )
            }
            return (
              <option key={optionData.value} value={optionData.value}>
                {optionData.label}
              </option>
            )
          })}
        </select>
      </BaseLabel>
    </div>
  )
}
