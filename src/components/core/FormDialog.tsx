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

type InputField = {
  label: string
  options?: RegisterOptions
} & (TextInput | SelectInput | CheckboxInput)

type FormInputsProps = { [key: string]: InputField }

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
      if (!input.defaultValue) return acc
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
                <section className='ms-scroll flex flex-col gap-4 overflow-y-auto py-6'>
                  {inputs.map((inputItem) => {
                    const error = errors[inputItem.name]
                    const errorMessage = error?.message as string | undefined

                    switch (inputItem.type) {
                      // Text
                      case 'text':
                        return (
                          <div
                            key={inputItem.name}
                            className='flex flex-col gap-1'
                          >
                            <label className='text-sm font-bold text-stone-500'>
                              {inputItem.label}
                              <span className='ml-[1ch] text-red-400'>
                                {errorMessage}
                              </span>
                            </label>
                            <input
                              type='text'
                              className='mx-1 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 placeholder:text-stone-300 focus:border-yellow-500 focus:ring-yellow-500'
                              {...inputItem.attributes}
                              {...register(inputItem.name, inputItem.options)}
                            />
                          </div>
                        )
                      // Select
                      case 'select':
                        return (
                          <div
                            key={inputItem.name}
                            className='flex flex-col gap-1'
                          >
                            <label className='text-sm font-bold text-stone-500'>
                              {inputItem.label}
                              <span className='ml-[1ch] text-red-400'>
                                {/* @ts-ignore */}
                                {error && error.message}
                              </span>
                            </label>
                            <select
                              className='ms-scroll mx-1 rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 focus:border-yellow-500 focus:ring-yellow-500'
                              {...inputItem.attributes}
                              {...register(inputItem.name, {
                                ...inputItem.options,
                              })}
                            >
                              {inputItem.data.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      // Checkbox
                      case 'checkbox':
                        return (
                          <div
                            key={inputItem.name}
                            className='flex items-center gap-2'
                          >
                            <input
                              type='checkbox'
                              className='focus:ring-none h-5 w-5 rounded-lg border-stone-300 text-yellow-500 focus:ring-transparent'
                              {...inputItem.attributes}
                              {...register(inputItem.name, inputItem.options)}
                            />
                            <label className='font-bold text-stone-500'>
                              {inputItem.label}
                              <span className='ml-[1ch] text-red-400'>
                                {errorMessage}
                              </span>
                            </label>
                          </div>
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
