import { twMerge } from 'tailwind-merge'
import { FieldValues, FieldPath, UseFormReturn } from 'react-hook-form'

import type { FormInput } from './define'
import TextInputField from './TextInputField'
import TextAreaField from './TextAreaField'
import SelectField from './SelectField'
import CheckboxField from './CheckboxField'
import NumberField from './NumberField'
import ImageField from './ImageField'
import OptionSetsField from './OptionSetsField'
import CategoriesField from './CategoriesField'
import COMField from './COMField'
import CommoditiesField from './CommoditiesField'
import DateField from './DateField'
import MenuTypeDateField from './MenuTypeDateField'
import DatetimeField from './DatetimeField'

export function FormField<TFieldValues extends FieldValues>(props: {
  formInput: FormInput & {
    name: FieldPath<TFieldValues>
  }
  useFormReturns: UseFormReturn<TFieldValues>
}) {
  const { formInput, useFormReturns } = props

  const error = useFormReturns.formState.errors[formInput.name]
  const errorMessage = error?.message as string | undefined

  if (formInput.hide) return null

  let content: JSX.Element | null
  switch (formInput.type) {
    // Text
    case 'text':
      content = (
        <TextInputField formInput={formInput} useFormReturns={useFormReturns} />
      )
      break
    // Textarea
    case 'textarea':
      content = (
        <TextAreaField formInput={formInput} useFormReturns={useFormReturns} />
      )
      break
    // Select
    case 'select':
      content = (
        <SelectField formInput={formInput} useFormReturns={useFormReturns} />
      )
      break
    // Checkbox
    case 'checkbox':
      content = (
        <CheckboxField formInput={formInput} useFormReturns={useFormReturns} />
      )
      break
    // Number
    case 'number':
      content = (
        <NumberField formInput={formInput} useFormReturns={useFormReturns} />
      )
      break
    // Image
    case 'image':
      content = (
        <ImageField formInput={formInput} useFormReturns={useFormReturns} />
      )
      break
    // OptionSets
    case 'optionSets':
      content = (
        <OptionSetsField
          formInput={formInput}
          useFormReturns={useFormReturns}
        />
      )
      break
    // Categories
    case 'categories':
      content = (
        <CategoriesField
          formInput={formInput}
          useFormReturns={useFormReturns}
        />
      )
      break
    // COM
    case 'com':
      content = (
        <COMField formInput={formInput} useFormReturns={useFormReturns} />
      )
      break
    // Commodities
    case 'commodities':
      content = (
        <CommoditiesField
          formInput={formInput}
          useFormReturns={useFormReturns}
        />
      )
      break
    // Label
    case 'label':
      content = null
      break
    // Date
    case 'date':
      content = (
        <DateField formInput={formInput} useFormReturns={useFormReturns} />
      )
      break
    // MenuTypeDate
    case 'menuTypeDate':
      content = (
        <MenuTypeDateField
          formInput={formInput}
          useFormReturns={useFormReturns}
        />
      )
      break
    // Datetime
    case 'datetime':
      content = (
        <DatetimeField formInput={formInput} useFormReturns={useFormReturns} />
      )
      break
    default:
      content = null
  }

  return (
    <div className={twMerge('flex h-full flex-col gap-1', formInput.className)}>
      {formInput.type !== 'checkbox' && (
        <label
          className={twMerge(
            'text-sm font-bold text-stone-500',
            formInput.type === 'label' && props.formInput.coreClassName,
          )}
        >
          {formInput.label}
          <span className='ml-[1ch] text-red-400'>{errorMessage}</span>
        </label>
      )}
      {content}
    </div>
  )
}

export * from './define'
