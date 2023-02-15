import { twMerge } from 'tailwind-merge'
import { Fragment, useEffect, useState, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm, SubmitHandler, Path, DeepPartial } from 'react-hook-form'

import { useDialog } from '@/components/core/Dialog'
import { UseMutationResult } from '@/lib/client/trpc'
import Button from '@/components/core/Button'

import type { FormInput, FormInputsProps, FormData } from './field'
import { FormField } from './field'

type ExpandRecursively<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T

type FormDialogProps<
  T extends (() => UseMutationResult) | undefined,
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
    mutation: T extends undefined ? never : ReturnType<Extract<T, Function>>,
  ) => void
  closeConfirm?: Parameters<ReturnType<typeof useDialog>['showDialog']>[0]
}

/* Main */
export default function FormDialog<
  T extends (() => UseMutationResult) | undefined,
  U extends FormInputsProps,
>(props: FormDialogProps<T, U>) {
  /* types in function */
  type Inputs = FormData<U>

  // Hooks
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setValue,
  } = useForm<Inputs>()
  const [columns, setColumns] = useState(1)
  const mutation = props.useMutation
    ? (props.useMutation() as ReturnType<Extract<T, Function>>)
    : undefined
  const { dialog: closingDialog, showDialog: showClosingDialog } = useDialog()

  // Add key to input.name
  const [inputs, setInputs] = useState<(FormInput & { name: Path<Inputs> })[]>(
    [],
  )

  useEffect(() => {
    if (!props) return
    let maxColumn = 1
    setInputs(
      Object.entries(props.inputs).map(([key, value]) => {
        if (value.column && value.column > maxColumn) {
          maxColumn = value.column
        }
        return {
          ...value,
          column: maxColumn,
          name: key as Path<Inputs>,
        }
      }),
    )
    setColumns(maxColumn)
  }, [props])

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
  }, [props.open, inputs])

  // Close the dialog when the mutation is successful
  useEffect(() => {
    if (mutation && mutation.isSuccess && props.open) {
      props.onClose()
      mutation.reset()
    }
  }, [mutation])

  // Handle submit
  const handleEdit: SubmitHandler<Inputs> = (formData) => {
    if (!props) return
    if (mutation) {
      props.onSubmit(
        formData as ExpandRecursively<FormData<U>>,
        mutation as Parameters<typeof props.onSubmit>[1],
      )
    } else {
      props.onSubmit(
        formData as ExpandRecursively<FormData<U>>,
        undefined as Parameters<typeof props.onSubmit>[1],
      )
      props.onClose()
    }
  }

  // Handle close
  const handleClose = useCallback(() => {
    if (props.closeConfirm && isDirty) {
      showClosingDialog({
        ...props.closeConfirm,
        onConfirm: () => {
          props.onClose()
        },
      })
    } else {
      props.onClose()
    }
  }, [isDirty, props.closeConfirm, props.onClose])

  return (
    <Transition show={props.open} as={Fragment} appear={true}>
      <Dialog onClose={handleClose} className='relative z-50'>
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
            <Dialog.Panel className='ms-scroll max-h-full max-w-[47rem] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg'>
              <Dialog.Title className='text-lg font-bold'>
                {props?.title}
              </Dialog.Title>
              <form onSubmit={handleSubmit(handleEdit)}>
                {/* Inputs */}
                <section
                  className={twMerge(
                    'ms-scroll grid gap-4 gap-x-8 py-6',
                    props.className,
                  )}
                  style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  }}
                >
                  {[...Array(columns).keys()].map((column) => (
                    // Column
                    <div key={column} className='flex grow flex-col gap-4'>
                      {inputs.map((formInput) => {
                        if (formInput.column !== column + 1) return null

                        const error = errors[formInput.name]
                        const errorMessage = error?.message as
                          | string
                          | undefined

                        return (
                          <FormField
                            key={formInput.name}
                            formInput={formInput}
                            register={register}
                            setValue={setValue}
                            errorMessage={errorMessage}
                          />
                        )
                      })}
                    </div>
                  ))}
                </section>
                {/* Buttons */}
                <section className='flex justify-end gap-6'>
                  {(mutation === undefined ||
                    (!mutation.isLoading && !mutation.isSuccess)) && (
                    <Button
                      label='取消'
                      textClassName='text-lg font-bold p-2 px-4'
                      theme='support'
                      type='button'
                      onClick={handleClose}
                    />
                  )}
                  <Button
                    isDisabled={errors && Object.keys(errors).length > 0}
                    isLoading={mutation?.isLoading || mutation?.isSuccess}
                    isBusy={mutation?.isLoading || mutation?.isSuccess}
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
        {closingDialog}
      </Dialog>
    </Transition>
  )
}

/* Show command */
type ShowFormDialogProps<
  T extends (() => UseMutationResult) | undefined,
  U extends FormInputsProps,
> = Omit<FormDialogProps<T, U>, 'open' | 'onClose'>

export function useFormDialog<
  T extends (() => UseMutationResult) | undefined,
  U extends FormInputsProps,
>() {
  const [isOpenDialog, setIsOpenDialog] = useState(false)
  const [props, setProps] = useState<ShowFormDialogProps<T, U> | undefined>(
    undefined,
  )
  const [iterCount, setIterCount] = useState(0)

  const showFormDialog = useCallback(
    <TT extends T, UU extends U>(thisProps: ShowFormDialogProps<TT, UU>) => {
      setProps(thisProps as ShowFormDialogProps<T, U>)
      setIsOpenDialog(true)
      setIterCount((prev) => prev + 1)
    },
    [],
  )

  const formDialog = props ? (
    <FormDialog
      key={iterCount}
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
