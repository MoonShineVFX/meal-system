import { memo, useState, useCallback, useEffect } from 'react'
import {
  useForm,
  SubmitHandler,
  UseFormRegister,
  Control,
  useController,
  FieldErrors,
  FieldValues,
  FieldError,
} from 'react-hook-form'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/24/outline'
import { MinusIcon } from '@heroicons/react/24/outline'
import { UserPlusIcon } from '@heroicons/react/20/solid'
import { Square3Stack3DIcon } from '@heroicons/react/20/solid'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

import { settings, OptionSet, twData, OrderOptions } from '@/lib/common'
import Image from '@/components/core/Image'
import Button from '@/components/core/Button'
import type { CommodityOnMenu } from '@/lib/client/trpc'
import { useStore } from '@/lib/client/store'
import trpc from '@/lib/client/trpc'

type FormInputs = {
  quantity: number
  options: OrderOptions
}

function COMDialogContent(props: {
  onClose: () => void
  com: CommodityOnMenu
}) {
  const addCartMutation = trpc.cart.add.useMutation()
  const { com } = props
  const [isLimited, setIsLimited] = useState(false)
  const menu = useStore((state) => state.currentMenu)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormInputs>({
    defaultValues: {
      quantity: 1,
      options: com.commodity.optionSets
        ?.filter((optionSet) => optionSet.multiSelect)
        .reduce(
          (acc: OrderOptions, optionSet) => ({
            ...acc,
            [optionSet.name]: [],
          }),
          {},
        ),
    },
  })

  // Reset selected option sets when commodity changes
  useEffect(() => {
    if (com) {
      setIsLimited(com.limitPerUser > 0 || com.stock > 0)
      reset()
    }
  }, [com])

  const handleCreateCartItem: SubmitHandler<FormInputs> = useCallback(
    async (formData) => {
      addCartMutation.mutate(
        {
          commodityId: com.commodity.id,
          menuId: menu!.id,
          quantity: formData.quantity,
          options: formData.options,
        },
        {
          onSuccess: async () => {
            props.onClose()
          },
        },
      )
    },
    [],
  )

  const isUnavailable =
    (menu?.unavailableReasons.length ?? 0) + com.unavailableReasons.length > 0

  return (
    <section
      className='ms-scroll relative mx-auto flex h-auto w-full flex-col overflow-hidden rounded-t-2xl bg-white pb-4 sm:gap-4 sm:rounded-none sm:p-4 sm:max-md:h-full sm:max-md:overflow-y-auto md:h-auto md:max-w-xl md:flex-row md:gap-0 md:rounded-2xl md:p-0 md:shadow-2xl'
      onClick={(event) => event.stopPropagation()}
    >
      {/* Close button */}
      <button
        className='absolute right-4 top-4 z-30 rounded-full bg-black/10 p-1 hover:bg-black/20 active:bg-black/20 active:bg-stone-100 sm:right-5 sm:top-5 md:bg-transparent md:hover:bg-stone-100'
        onClick={props.onClose}
      >
        <XMarkIcon className='h-8 w-8 stroke-1 text-white md:text-stone-500' />
      </button>
      {/* Image */}
      <section className='mx-auto h-min w-full p-4 pb-0 sm:p-0 md:m-4 md:mr-0 md:shrink md:basis-2/5 md:p-4 lg:m-6 lg:mr-0 lg:p-6'>
        <div className='relative aspect-[4/3] overflow-hidden rounded-xl md:aspect-square md:rounded-2xl'>
          <Image
            style={{ WebkitTouchCallout: 'none' }}
            draggable={false}
            className='object-cover'
            src={
              com.commodity.image?.path ?? settings.RESOURCE_FOOD_PLACEHOLDER
            }
            sizes='(max-width: 375px) 100vw, (max-width: 750px) 75vw, 640px'
            alt={com.commodity.name ?? 'food placeholder'}
          />
        </div>
      </section>
      {/* Form */}
      <form
        className='ms-scroll group flex shrink-0 grow flex-col gap-6 p-4 pb-0 @container/detail sm:p-0 md:overflow-y-auto md:p-4 lg:p-6'
        {...twData({ available: !isUnavailable })}
        onSubmit={handleSubmit(handleCreateCartItem)}
      >
        {/* Info */}
        <header className='flex flex-col gap-2 lg:gap-4'>
          <h1 className='text-2xl font-bold tracking-widest text-stone-800'>
            {com.commodity.name}
          </h1>
          <h2 className='text-xl tracking-wider text-yellow-500 lg:-mt-2'>
            ${com.commodity.price}
          </h2>
          {com.commodity.description !== '' && (
            <p className='text-stone-500'>{com.commodity.description}</p>
          )}
        </header>
        {/* Metadata */}
        {isLimited && (
          <div className='flex flex-col gap-2 text-sm'>
            {com.stock > 0 && (
              <div className='flex items-center gap-2'>
                <Square3Stack3DIcon className='h-4 w-4 text-stone-300' />
                <p className='tracking-wider text-stone-500'>{`限量 ${com.stock} 份`}</p>
              </div>
            )}
            {com.limitPerUser > 0 && (
              <div className='flex items-center gap-2'>
                <UserPlusIcon className='h-4 w-4 text-stone-300' />
                <p className='tracking-wider text-stone-500'>{`每人限點 ${com.limitPerUser} 份`}</p>
              </div>
            )}
          </div>
        )}
        <div className='border-b border-stone-200'></div>
        {/* Option Sets */}
        <main className='flex flex-col gap-4 group-data-not-available:pointer-events-none group-data-not-available:opacity-60'>
          {com.commodity.optionSets
            .sort((a, b) => a.order - b.order)
            .map((optionSet) => (
              <OptionSetForm
                key={optionSet.name}
                optionSet={optionSet}
                register={register}
                errors={errors}
              />
            ))}
        </main>
        {/* Spacer For sm */}
        <div className='-my-3 shrink grow'></div>
        {/* Quantity */}
        <section className='relative flex shrink-0 select-none justify-center group-data-not-available:pointer-events-none group-data-not-available:hidden'>
          <QuantityInput
            control={control}
            isUnavailable={isUnavailable}
            maxQuantity={Math.min(
              com.maxQuantity,
              menu?.maxQuantity ?? Infinity,
            )}
            register={register}
          />
        </section>
        {/* Unavailable message */}
        {isUnavailable && (
          <section className='flex flex-col gap-1 rounded-2xl bg-red-50 p-4 text-red-400'>
            <div className='flex items-center gap-2'>
              <ExclamationTriangleIcon className='h-5 w-5 text-red-400' />
              無法加入購物車
            </div>
            <ul className='flex flex-col gap-1 text-red-300'>
              {[
                ...(menu?.unavailableReasons ?? []),
                ...com.unavailableReasons,
              ].map((reason) => (
                <li className='ml-7 text-sm' key={reason}>
                  {reason}
                </li>
              ))}
            </ul>
          </section>
        )}
        {/* Submit */}
        <footer className='flex shrink-0 flex-col gap-4 sm:flex-row-reverse'>
          <Button
            isBusy={addCartMutation.isLoading || addCartMutation.isSuccess}
            isLoading={addCartMutation.isLoading || addCartMutation.isSuccess}
            isDisabled={isUnavailable}
            className='h-12 grow sm:basis-3/5'
            type='submit'
            textClassName='font-bold'
            label={isUnavailable ? '無法訂購' : '加到購物車'}
          />
          <Button
            label='返回'
            className='h-12 grow sm:basis-2/5'
            theme='support'
            onClick={props.onClose}
          />
        </footer>
      </form>
    </section>
  )
}

export default memo(COMDialogContent)

export function OptionSetForm<
  T extends FieldValues & { options: OrderOptions },
>(props: {
  optionSet: OptionSet
  register: UseFormRegister<T>
  errors: FieldErrors<T>
}) {
  // react-hook-form typed bug hotfix
  const typedOptions = props.errors.options as
    | Record<string, FieldError>
    | undefined
  const typedRegister = props.register as unknown as UseFormRegister<{
    options: OrderOptions
  }>

  const { optionSet } = props
  const error = typedOptions?.[optionSet.name]

  return (
    <section className='flex flex-col gap-2'>
      <h3 className='text font-bold'>
        {optionSet.name}
        <span className='ml-2 text-sm font-normal text-red-400'>
          {error && error.message}
        </span>
      </h3>
      <div className='flex flex-wrap gap-2'>
        {props.optionSet.options.map((optionName) => (
          <label key={optionName}>
            <input
              className='peer hidden'
              type={optionSet.multiSelect ? 'checkbox' : 'radio'}
              value={optionName}
              {...typedRegister(`options.${optionSet.name}`, {
                required: !optionSet.multiSelect && '請選擇一個選項',
              })}
            />
            <div className='m-[0.0625rem] cursor-pointer rounded-2xl border border-stone-300 py-2 px-3 indent-[0.05em] text-sm tracking-wider peer-checked:m-0 peer-checked:border-2 peer-checked:border-yellow-500 hover:border-stone-400 active:border-stone-400'>
              {optionName}
            </div>
          </label>
        ))}
      </div>
    </section>
  )
}

function QuantityInput(props: {
  register: UseFormRegister<FormInputs>
  maxQuantity: number
  isUnavailable: boolean
  control: Control<FormInputs>
}) {
  const { field } = useController({ name: 'quantity', control: props.control })
  const handleQuantityButtonClick = useCallback(
    (action: 'INCREASE' | 'DECREASE') => {
      switch (action) {
        case 'INCREASE':
          field.onChange(field.value + 1)
          break
        case 'DECREASE':
          field.onChange(field.value - 1)
          break
      }
    },
    [field],
  )

  return (
    <div className='flex items-center gap-2 rounded-full bg-stone-100 p-1'>
      <input
        type='number'
        className='hidden'
        {...props.register('quantity', {
          min: 1,
          max: props.maxQuantity,
        })}
        required
      />
      <button
        type='button'
        onClick={() => handleQuantityButtonClick('DECREASE')}
        disabled={field.value <= 1}
        className='rounded-full p-1 text-stone-500 disabled:pointer-events-none disabled:text-stone-300 hover:bg-stone-200 active:bg-stone-200'
      >
        <MinusIcon className='h-5 w-5' />
      </button>
      <p className='min-w-[1.2em] text-center text-xl text-stone-500'>
        {field.value}
      </p>
      <button
        type='button'
        onClick={() => handleQuantityButtonClick('INCREASE')}
        disabled={props.isUnavailable || field.value >= props.maxQuantity}
        className='rounded-full p-1 text-stone-500 disabled:pointer-events-none disabled:text-stone-300 hover:bg-stone-200 active:bg-stone-200'
      >
        <PlusIcon className='h-5 w-5' />
      </button>
    </div>
  )
}
