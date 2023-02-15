import { InputHTMLAttributes } from 'react'
import { RegisterOptions } from 'react-hook-form'
import { UseFormRegister, FieldValues, FieldPath } from 'react-hook-form'
import { twMerge } from 'tailwind-merge'

import { OptionSet } from '@/lib/common'

/* Types */
export type COMData = {
  menuId: number
  limitPerUser: number
  stock: number
}

// Inputs
type LabelInput = {
  defaultValue?: never
  data?: never
  type: 'label'
  attributes?: never
}
type CheckboxInput = {
  defaultValue?: boolean
  data?: never
  type: 'checkbox'
  attributes?: InputHTMLAttributes<HTMLInputElement>
}
type TextInput = {
  defaultValue?: string
  data?: never
  type: 'text'
  attributes?: InputHTMLAttributes<HTMLInputElement>
}
type SelectInput = {
  defaultValue?: string | string[]
  data: (
    | { label: string; value: string }
    | { label: string; children: { label: string; value: string }[] }
  )[]
  type: 'select'
  attributes?: InputHTMLAttributes<HTMLSelectElement>
}
type TextAreaInput = {
  defaultValue?: string
  data?: never
  type: 'textarea'
  attributes?: InputHTMLAttributes<HTMLTextAreaElement>
}
type NumberInput = {
  defaultValue?: number
  data?: never
  type: 'number'
  attributes?: InputHTMLAttributes<HTMLInputElement>
}
type ImageInput = {
  defaultValue?: string
  data?: never
  type: 'image'
  attributes?: never
}
type OptionSetsInput = {
  defaultValue?: OptionSet[]
  data?: never
  type: 'optionSets'
  attributes?: never
}
type CategoriesInput = {
  defaultValue?: number[]
  data?: never
  type: 'categories'
  attributes?: never
}
type COMInput = {
  defaultValue?: COMData[]
  data?: never
  type: 'com'
  attributes?: never
}
type CommoditiesInput = {
  defaultValue?: number[]
  data: number // category id
  type: 'commodities'
  attributes?: never
}

export type FormInput = {
  label: string
  options?: RegisterOptions
  className?: string
  coreClassName?: string
  column?: number
  hide?: boolean
} & (
  | TextInput
  | SelectInput
  | CheckboxInput
  | TextAreaInput
  | NumberInput
  | ImageInput
  | OptionSetsInput
  | CategoriesInput
  | COMInput
  | CommoditiesInput
  | LabelInput
)

export type FormInputsProps = { [key: string]: FormInput }

export type FormData<TInputs extends FormInputsProps> = {
  [K in keyof TInputs]: TInputs[K]['type'] extends 'text'
    ? string
    : TInputs[K]['type'] extends 'select'
    ? Extract<TInputs[K], { type: 'select' }>['attributes'] extends undefined
      ? string
      : NonNullable<
          Extract<
            Extract<TInputs[K], { type: 'select' }>,
            { type: 'select' }
          >['attributes']
        >['multiple'] extends true
      ? string[]
      : string
    : TInputs[K]['type'] extends 'checkbox'
    ? boolean
    : TInputs[K]['type'] extends 'textarea'
    ? string
    : TInputs[K]['type'] extends 'number'
    ? number
    : TInputs[K]['type'] extends 'image'
    ? string
    : TInputs[K]['type'] extends 'optionSets'
    ? OptionSet[]
    : TInputs[K]['type'] extends 'categories'
    ? number[]
    : TInputs[K]['type'] extends 'com'
    ? COMData[]
    : TInputs[K]['type'] extends 'commodities'
    ? number[]
    : never
}

// Field
export type InputFieldProps<
  TType extends FormInput['type'],
  TFieldValues extends FieldValues,
> = {
  errorMessage?: string
  formInput: Extract<FormInput, { type: TType }> & {
    name: FieldPath<TFieldValues>
  }
  register: UseFormRegister<TFieldValues>
}

/* Components */
export function BaseLabel(props: {
  label: string
  errorMessage?: string
  children?: JSX.Element | JSX.Element[]
  className?: string
}) {
  return (
    <div className='flex h-full flex-col gap-1'>
      <label
        className={twMerge('text-sm font-bold text-stone-500', props.className)}
      >
        {props.label}
        <span className='ml-[1ch] text-red-400'>{props.errorMessage}</span>
      </label>
      {props.children}
    </div>
  )
}
