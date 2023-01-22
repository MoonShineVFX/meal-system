import { PhotoIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import {
  Fragment,
  useEffect,
  useState,
  useMemo,
  InputHTMLAttributes,
  useCallback,
} from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  useForm,
  SubmitHandler,
  Path,
  DeepPartial,
  RegisterOptions,
  UseFormRegister,
  FieldValues,
  FieldPath,
} from 'react-hook-form'

import { UseMutationResult } from '@/lib/client/trpc'
import Button from '@/components/core/Button'

/* Types */
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
  data: { value: string; label: string }[]
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
  defaultValue?: never
  data?: never
  type: 'image'
  attributes?: InputHTMLAttributes<HTMLInputElement>
}

type FormInput = {
  label: string
  options?: RegisterOptions
  className?: string
} & (
  | TextInput
  | SelectInput
  | CheckboxInput
  | TextAreaInput
  | NumberInput
  | ImageInput
)

type FormInputsProps = { [key: string]: FormInput }

type FormData<TInputs extends FormInputsProps> = {
  [K in keyof TInputs]: TInputs[K]['type'] extends 'text'
    ? string
    : TInputs[K]['type'] extends 'select'
    ? Extract<TInputs[K], { type: 'select' }>['attributes'] extends undefined
      ? NonNullable<TInputs[K]['data']>[number]['value']
      : NonNullable<
          Extract<TInputs[K], { type: 'select' }>['attributes']
        >['multiple'] extends true
      ? NonNullable<TInputs[K]['data']>[number]['value'][]
      : NonNullable<TInputs[K]['data']>[number]['value']
    : TInputs[K]['type'] extends 'checkbox'
    ? boolean
    : never
}

type ExpandRecursively<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T

type FormDialogProps<
  T extends () => UseMutationResult,
  U extends FormInputsProps,
> = {
  open: boolean
  onClose: () => void
  title: string
  className?: string
  inputs: U
  useMutation: T
  onSubmit: (
    formData: ExpandRecursively<FormData<U>>,
    mutation: ReturnType<T>,
  ) => void
}

/* Main */
export default function FormDialog<
  T extends () => UseMutationResult,
  U extends FormInputsProps,
>(props: FormDialogProps<T, U>) {
  /* types in function */
  type Inputs = FormData<U>

  // Hooks
  const mutation = props.useMutation() as ReturnType<T>

  // Add key to input.name
  const inputs = useMemo(() => {
    if (!props) return []
    return Object.entries(props.inputs).map(([key, value]) => ({
      ...value,
      name: key as Path<Inputs>,
    }))
  }, [props])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Inputs>()

  // Reset state
  useEffect(() => {
    if (!props.open) return
    const defaultValues = inputs.reduce((acc, input) => {
      if (input.defaultValue === undefined) return acc
      return {
        ...acc,
        [input.name]: input.defaultValue,
      }
    }, {} as DeepPartial<Inputs>)
    reset(defaultValues)
  }, [props.open])

  // Close the dialog when the mutation is successful
  useEffect(() => {
    if (mutation.isSuccess && props.open) {
      props.onClose()
      mutation.reset()
    }
  }, [mutation])

  // Handle submit
  const handleEdit: SubmitHandler<Inputs> = (formData) => {
    if (!props) return
    props.onSubmit(formData as ExpandRecursively<FormData<U>>, mutation)
  }

  return (
    <Transition show={props.open} as={Fragment} appear={true}>
      <Dialog onClose={props.onClose} className='relative z-50'>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-200'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-100'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black/30'></div>
        </Transition.Child>
        {/* Dialog */}
        <div className='fixed inset-0 flex items-center justify-center p-4 sm:p-8'>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-200'
            enterFrom='opacity-0 scale-75'
            enterTo='opacity-100 scale-100'
            leave='ease-in duration-100'
            leaveFrom='opacity-100 scale-100'
            leaveTo='opacity-0 scale-75'
          >
            <Dialog.Panel className='min-w-[16rem] rounded-2xl bg-white p-6 shadow-lg'>
              <Dialog.Title className='text-lg font-bold'>
                {props?.title}
              </Dialog.Title>
              <form onSubmit={handleSubmit(handleEdit)}>
                {/* Inputs */}
                <section
                  className={twMerge(
                    'ms-scroll flex flex-col gap-4 overflow-y-auto py-6',
                    props.className,
                  )}
                >
                  {inputs.map((formInput) => {
                    const error = errors[formInput.name]
                    const errorMessage = error?.message as string | undefined

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
                          />
                        )
                    }
                  })}
                </section>
                {/* Buttons */}
                <section className='flex justify-end gap-6'>
                  {!mutation.isLoading && !mutation.isSuccess && (
                    <Button
                      label='取消'
                      textClassName='text-lg font-bold p-2 px-4'
                      theme='support'
                      type='button'
                      onClick={props.onClose}
                    />
                  )}
                  <Button
                    isDisabled={errors && Object.keys(errors).length > 0}
                    isLoading={mutation.isLoading || mutation.isSuccess}
                    isBusy={mutation.isLoading || mutation.isSuccess}
                    label='確定'
                    textClassName='text-lg font-bold p-2 px-4'
                    theme='main'
                    type='submit'
                  />
                </section>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

/* Show command */
type ShowFormDialogProps<
  T extends () => UseMutationResult,
  U extends FormInputsProps,
> = Omit<FormDialogProps<T, U>, 'open' | 'onClose'>

export function useFormDialog<
  T extends () => UseMutationResult,
  U extends FormInputsProps,
>() {
  const [isOpenDialog, setIsOpenDialog] = useState(false)
  const [props, setProps] = useState<ShowFormDialogProps<T, U> | undefined>(
    undefined,
  )

  const showFormDialog = useCallback(
    <TT extends T, UU extends U>(thisProps: ShowFormDialogProps<TT, UU>) => {
      setProps(thisProps as ShowFormDialogProps<T, U>)
      setIsOpenDialog(true)
    },
    [],
  )

  const formDialog = props ? (
    <FormDialog
      {...props}
      open={isOpenDialog}
      onClose={() => setIsOpenDialog(false)}
    />
  ) : null

  return {
    showFormDialog,
    formDialog,
  }
}

/* Input Fields */
// Types
type InputFieldProps<
  TType extends FormInput['type'],
  TFieldValues extends FieldValues,
> = {
  errorMessage?: string
  formInput: Extract<FormInput, { type: TType }> & {
    name: FieldPath<TFieldValues>
  }
  register: UseFormRegister<TFieldValues>
}

// Components
function BaseLabel(props: {
  label: string
  errorMessage?: string
  children?: JSX.Element
}) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-sm font-bold text-stone-500'>
        {props.label}
        <span className='ml-[1ch] text-red-400'>{props.errorMessage}</span>
      </label>
      {props.children}
    </div>
  )
}

function TextInputField<T extends FieldValues>(
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

function TextAreaField<T extends FieldValues>(
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

function SelectField<T extends FieldValues>(
  props: InputFieldProps<'select', T>,
) {
  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        errorMessage={props.errorMessage}
      >
        <select
          className='ms-scroll mx-1 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 focus:border-yellow-500 focus:ring-yellow-500'
          {...props.formInput.attributes}
          {...props.register(props.formInput.name, {
            ...props.formInput.options,
          })}
        >
          {props.formInput.data.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </BaseLabel>
    </div>
  )
}

function CheckboxField<T extends FieldValues>(
  props: InputFieldProps<'checkbox', T>,
) {
  return (
    <div className={props.formInput.className}>
      <label className='flex cursor-pointer items-center gap-2'>
        <input
          type='checkbox'
          className='focus:ring-none h-5 w-5 rounded-lg border-stone-300 text-yellow-500 focus:ring-transparent'
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

function NumberField<T extends FieldValues>(
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

function ImageField<T extends FieldValues>(props: InputFieldProps<'image', T>) {
  return (
    <div className={props.formInput.className}>
      <BaseLabel
        label={props.formInput.label}
        errorMessage={props.errorMessage}
      >
        <label className='flex aspect-square cursor-pointer flex-col justify-center rounded-2xl border border-stone-300 bg-stone-50 p-4 text-center text-sm'>
          <PhotoIcon className='mx-auto h-10 w-10 text-stone-300' />
          <div className='mt-2'>
            <span className='text-yellow-500'>上傳檔案</span>
            <input
              type='file'
              accept='image/*'
              className='sr-only'
              {...props.formInput.attributes}
              {...props.register(props.formInput.name, props.formInput.options)}
            />
            <span>或拖曳至此處</span>
          </div>
        </label>
      </BaseLabel>
    </div>
  )
}
