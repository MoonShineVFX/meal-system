import { Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'

import Button from '@/components/core/Button'
import { OptionSetForm } from '@/components/menu/COMDialogContent'
import type { CartItems } from '@/lib/client/trpc'
import { useUpdateCartMutation } from '@/lib/client/trpc.hooks'
import { OrderOptions, generateOptionsKey } from '@/lib/common'

type FormInputs = {
  options: OrderOptions
}

export default function CartItemOptionsDialog(props: {
  open: boolean
  onClose: () => void
  cartItem?: CartItems[0]
}) {
  const [cartItem, setCartItem] = useState<CartItems[0]>()
  const com = cartItem?.commodityOnMenu
  const { handleSubmit, setValue, watch, control } = useForm<FormInputs>()
  const updateCartMutation = useUpdateCartMutation()

  useEffect(() => {
    if (props.cartItem) {
      setCartItem(props.cartItem)
      setValue('options', props.cartItem.options)
      updateCartMutation.reset()
    }
  }, [props.cartItem])

  const handleUpdateCartItemOptions: SubmitHandler<FormInputs> = useCallback(
    async (formData) => {
      if (!props.cartItem) return
      updateCartMutation.mutate(
        {
          commodityId: props.cartItem.commodityId,
          menuId: props.cartItem.menuId,
          quantity: props.cartItem.quantity,
          options: formData.options,
          optionsKey: props.cartItem.optionsKey,
        },
        {
          onSuccess: () => {
            props.onClose()
          },
        },
      )
    },
    [props.cartItem],
  )

  const CurrentOptionsKey = generateOptionsKey(watch().options ?? {})

  return (
    <Transition show={props.open} className='absolute inset-0 z-0'>
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
        <div className='absolute inset-0 bg-black/30'></div>
      </Transition.Child>
      {/* Dialog */}
      <div
        className='ms-scroll absolute inset-0 flex flex-col items-center justify-center overflow-y-auto'
        onClick={props.onClose}
      >
        <Transition.Child
          className='absolute inset-x-0 top-0 flex min-h-full items-center justify-center p-4 lg:p-6'
          enter='ease-out duration-200'
          enterFrom='opacity-0 scale-75'
          enterTo='opacity-100 scale-100'
          leave='ease-in duration-100'
          leaveFrom='opacity-100 scale-100'
          leaveTo='opacity-0 scale-75'
        >
          <form
            className='relative flex max-w-md shrink flex-col gap-4 rounded-2xl bg-white p-4 shadow-2xl lg:gap-6 lg:p-6'
            onSubmit={handleSubmit(handleUpdateCartItemOptions)}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type='button'
              className='absolute right-4 top-4 rounded-full p-1 hover:bg-stone-100 active:bg-stone-100'
              onClick={props.onClose}
            >
              <XMarkIcon className='h-8 w-8 stroke-1 text-stone-500' />
            </button>
            {/* Content */}
            <h1 className='text-xl font-bold text-stone-800'>
              {com?.commodity.name}
            </h1>
            <main className='flex flex-col gap-4'>
              {com?.commodity.optionSets
                .sort((a, b) => a.order - b.order)
                .map((optionSet) => (
                  <OptionSetForm
                    key={optionSet.name}
                    optionSet={optionSet}
                    control={control}
                  />
                ))}
            </main>
            {/* Submit */}
            <footer className='mt-4 flex shrink-0 flex-col gap-4 @2xl/cart:flex-row-reverse'>
              <Button
                isDisabled={CurrentOptionsKey === props.cartItem?.optionsKey}
                isBusy={
                  updateCartMutation.isPending || updateCartMutation.isSuccess
                }
                isLoading={
                  updateCartMutation.isPending || updateCartMutation.isSuccess
                }
                className='h-12 grow @2xl/cart:basis-3/5'
                type='submit'
                textClassName='font-bold'
                label='更改選項'
              />
              <Button
                label='返回'
                className='h-10 grow @2xl/cart:basis-2/5'
                theme='support'
                onClick={props.onClose}
              />
            </footer>
          </form>
        </Transition.Child>
      </div>
    </Transition>
  )
}
