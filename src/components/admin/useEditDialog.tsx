import {
  Fragment,
  useEffect,
  useState,
  useMemo,
  InputHTMLAttributes,
} from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  useForm,
  SubmitHandler,
  Path,
  DeepPartial,
  RegisterOptions,
} from 'react-hook-form'

import Button from '@/components/core/Button'

/* Types */
type InputField = {
  label: string
  value: string | number | boolean
  options?: RegisterOptions
  attributes?: InputHTMLAttributes<HTMLInputElement>
}

type UseEditDialogProps = {
  title: string
  inputs: { [key: string]: InputField }
}

/* Main */
export default function useEditDialog<T extends UseEditDialogProps>({
  mutations,
}: {
  mutations?: { isLoading: boolean; isSuccess: boolean; reset: () => void }[]
}) {
  function showDialog<U extends T>(
    props: U,
    onSubmit: (formData: {
      [K in keyof U['inputs']]: U['inputs'][K]['value']
    }) => void,
  ) {
    setProps({ ...props, onSubmit })
    setIsDialogOpen(true)
  }

  /* types in function */
  type OnSubmitArgs = Parameters<typeof showDialog>[1]
  type Inputs = Parameters<OnSubmitArgs>[0]

  // Hooks
  const [props, setProps] = useState<
    (T & { onSubmit: OnSubmitArgs }) | undefined
  >(undefined)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
    if (!isDialogOpen) return
    reset(
      inputs.reduce((acc, input) => {
        return {
          ...acc,
          [input.name]: input.value,
        }
      }, {} as DeepPartial<Inputs>),
    )
  }, [isDialogOpen])

  // Close the dialog when the mutation is successful
  useEffect(() => {
    if (!mutations) return
    if (mutations.some((m) => m.isSuccess) && isDialogOpen) {
      setIsDialogOpen(false)
      mutations.forEach((m) => m.reset())
    }
  }, [mutations])

  // Handle submit
  const handleEdit: SubmitHandler<Inputs> = (formData) => {
    if (!props) return
    props.onSubmit(formData)
  }

  const dialog = (
    <Transition show={isDialogOpen} as={Fragment}>
      <Dialog onClose={() => setIsDialogOpen(false)} className='relative z-50'>
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
                <section className='ms-scroll overflow-y-auto py-6'>
                  {inputs.map((inputValue) => {
                    const error = errors[inputValue.name]

                    return (
                      <div
                        key={inputValue.name}
                        className='flex flex-col gap-1'
                      >
                        <label className='text-sm font-bold text-stone-500'>
                          {inputValue.label}
                          <span className='ml-[1ch] text-red-400'>
                            {/* @ts-ignore */}
                            {error && error.message}
                          </span>
                        </label>
                        <input
                          className='rounded-2xl border border-stone-300 bg-stone-50 p-2 px-3 focus:outline-yellow-500 disabled:opacity-75'
                          {...inputValue.attributes}
                          {...register(inputValue.name, inputValue.options)}
                        />
                      </div>
                    )
                  })}
                </section>
                {/* Buttons */}
                <section className='flex justify-end gap-6'>
                  <Button
                    label='取消'
                    textClassName='text-lg font-bold p-2 px-4'
                    theme='support'
                    type='button'
                    onClick={() => setIsDialogOpen(false)}
                  />
                  <Button
                    isDisabled={errors && Object.keys(errors).length > 0}
                    isLoading={mutations && mutations.some((m) => m.isLoading)}
                    isBusy={
                      mutations &&
                      mutations.some((m) => m.isLoading || m.isSuccess)
                    }
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

  return {
    showDialog,
    dialog,
  }
}
