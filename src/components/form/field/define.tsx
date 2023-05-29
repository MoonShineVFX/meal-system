import { InputHTMLAttributes } from 'react'
import {
  RegisterOptions,
  FieldValues,
  FieldPath,
  UseFormReturn,
} from 'react-hook-form'

import { MenuType } from '@prisma/client'
import { OptionSet } from '@/lib/common'

/* Types */
export type MenuCOMData = {
  menuId: number
  limitPerUser: number
  stock: number
}
export type COMData =
  | {
      commodityId: number
      limitPerUser: number
      stock: number
    }
  | {
      commodityId: number
      limitPerUser: number
      stock: number
      commodity: {
        name: string
        price: number
        optionSets: OptionSet[]
      }
    }
export type MenuDateTypeData = {
  type: MenuType
  date: Date | null
  publishedDate: Date | null
  closedDate: Date | null
}
export type MenuIntroData = {
  name: string | undefined
  description: string | undefined
  createSupplier: boolean
  supplierId?: number
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
  defaultValue?: string
  data: { label: string; value: string }[]
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
type DateInput = {
  defaultValue?: string
  data?: never
  type: 'date'
  attributes?: InputHTMLAttributes<HTMLInputElement>
}
type DatetimeInput = {
  defaultValue?: string
  data?: never
  type: 'datetime'
  attributes?: InputHTMLAttributes<HTMLInputElement>
}
// Extend Inputs
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
type MenuCOMInput = {
  defaultValue?: MenuCOMData[]
  data?: never
  type: 'menucom'
  attributes?: never
}
type CommoditiesInput = {
  defaultValue?: number[]
  data?: {
    onlyFromSupplierId?: number
  }
  type: 'commodities'
  attributes?: never
}
type MenuTypeDateInput = {
  defaultValue?: MenuDateTypeData
  data?: never
  type: 'menuTypeDate'
  attributes?: never
}
type COMInput = {
  defaultValue?: COMData[]
  data?: never
  type: 'com'
  attributes?: never
}
type MenuIntroInput = {
  defaultValue?: MenuIntroData
  data?: {
    disableCreateSupplier: boolean
  }
  type: 'menuIntro'
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
  | MenuCOMInput
  | CommoditiesInput
  | LabelInput
  | DateInput
  | MenuTypeDateInput
  | DatetimeInput
  | COMInput
  | MenuIntroInput
)

export type InferFormInputData<TFormInput extends FormInput> =
  TFormInput['type'] extends 'text'
    ? string
    : TFormInput['type'] extends 'select'
    ? string
    : TFormInput['type'] extends 'checkbox'
    ? boolean
    : TFormInput['type'] extends 'textarea'
    ? string
    : TFormInput['type'] extends 'number'
    ? number
    : TFormInput['type'] extends 'image'
    ? string
    : TFormInput['type'] extends 'optionSets'
    ? OptionSet[]
    : TFormInput['type'] extends 'categories'
    ? number[]
    : TFormInput['type'] extends 'menucom'
    ? MenuCOMData[]
    : TFormInput['type'] extends 'commodities'
    ? number[]
    : TFormInput['type'] extends 'date'
    ? string
    : TFormInput['type'] extends 'menuTypeDate'
    ? MenuDateTypeData
    : TFormInput['type'] extends 'datetime'
    ? string
    : TFormInput['type'] extends 'com'
    ? COMData[]
    : TFormInput['type'] extends 'menuIntro'
    ? MenuIntroData
    : never

export type FormInputsProps = { [key: string]: FormInput }

export type FormData<TInputs extends FormInputsProps> = {
  [K in keyof TInputs]: InferFormInputData<TInputs[K]>
}

// Field
export type InputFieldProps<
  TType extends FormInput['type'],
  TFieldValues extends FieldValues,
> = {
  formInput: Extract<FormInput, { type: TType }> & {
    name: FieldPath<TFieldValues>
  }
  useFormReturns: UseFormReturn<TFieldValues>
}
