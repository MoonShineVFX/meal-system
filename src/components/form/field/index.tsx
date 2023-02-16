import {
  FieldValues,
  UseFormSetValue,
  UseFormRegister,
  FieldPath,
} from 'react-hook-form'

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
import LabelField from './LabelField'

export function FormField<TFieldValues extends FieldValues>(props: {
  formInput: FormInput & {
    name: FieldPath<TFieldValues>
  }
  register: UseFormRegister<TFieldValues>
  setValue: UseFormSetValue<TFieldValues>
  errorMessage?: string
}) {
  const { formInput, register, errorMessage, setValue } = props

  if (formInput.hide) return null

  switch (formInput.type) {
    // Text
    case 'text':
      return (
        <TextInputField
          key={formInput.name}
          errorMessage={errorMessage}
          formInput={formInput}
          register={register}
        />
      )
    // Textarea
    case 'textarea':
      return (
        <TextAreaField
          key={formInput.name}
          errorMessage={errorMessage}
          formInput={formInput}
          register={register}
        />
      )
    // Select
    case 'select':
      return (
        <SelectField
          key={formInput.name}
          errorMessage={errorMessage}
          formInput={formInput}
          register={register}
        />
      )
    // Checkbox
    case 'checkbox':
      return (
        <CheckboxField
          key={formInput.name}
          errorMessage={errorMessage}
          formInput={formInput}
          register={register}
        />
      )
    // Number
    case 'number':
      return (
        <NumberField
          key={formInput.name}
          errorMessage={errorMessage}
          formInput={formInput}
          register={register}
        />
      )
    // Image
    case 'image':
      return (
        <ImageField
          key={formInput.name}
          errorMessage={errorMessage}
          formInput={formInput}
          register={register}
          setValue={setValue}
        />
      )
    // OptionSets
    case 'optionSets':
      return (
        <OptionSetsField
          key={formInput.name}
          formInput={formInput}
          setValue={setValue}
        />
      )
    // Categories
    case 'categories':
      return (
        <CategoriesField
          key={formInput.name}
          formInput={formInput}
          setValue={setValue}
        />
      )
    // COM
    case 'com':
      return (
        <COMField
          key={formInput.name}
          formInput={formInput}
          setValue={setValue}
        />
      )
    // Commodities
    case 'commodities':
      return (
        <CommoditiesField
          key={formInput.name}
          formInput={formInput}
          setValue={setValue}
        />
      )
    // Label
    case 'label':
      return <LabelField key={formInput.name} formInput={formInput} />
    default:
      return null
  }
}

export * from './define'