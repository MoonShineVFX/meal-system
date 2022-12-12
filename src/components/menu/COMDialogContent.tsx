import { memo, useState, useCallback, useEffect } from 'react'
import {
  useForm,
  SubmitHandler,
  UseFormRegister,
  Control,
  useController,
  FieldErrorsImpl,
} from 'react-hook-form'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/24/outline'
import { MinusIcon } from '@heroicons/react/24/outline'
import { UserPlusIcon } from '@heroicons/react/20/solid'
import { Square3Stack3DIcon } from '@heroicons/react/20/solid'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

import { settings, OptionSet, twData, CommodityOptions } from '@/lib/common'
import Image from '@/components/core/Image'
import Button from '@/components/core/Button'
import type { CommodityOnMenu } from '@/lib/client/trpc'
import { useStore, NotificationType } from '@/lib/client/store'
import trpc from '@/lib/client/trpc'

type FormInputs = {
  quantity: number
  options: CommodityOptions
}

function COMDialogContent(props: {
  onClose: () => void
  com: CommodityOnMenu
}) {
  const addCartMutation = trpc.menu.addComToCart.useMutation()
  const addNotification = useStore((state) => state.addNotification)
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
      options: (com.commodity.optionSets as OptionSet[])
        ?.filter((optionSet) => optionSet.multiSelect)
        .reduce(
          (acc: CommodityOptions, optionSet) => ({
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
          onError: async (error) => {
            addNotification({
              type: NotificationType.ERROR,
              message: error.message,
            })
          },
        },
      )
    },
    [],
  )

  const isUnavailable =
    (menu?.unavailableReasons.length ?? 0) + com.unavailableReasons.length > 0

  const isBusy = addCartMutation.isLoading || addCartMutation.isSuccess

  return (
    <section
      className='relative mx-auto flex h-auto w-full flex-col overflow-hidden rounded-t-2xl bg-white pb-4 sm:gap-4 sm:rounded-none sm:p-4 sm:max-md:h-full sm:max-md:overflow-y-auto md:h-auto md:max-w-3xl md:flex-row md:gap-0 md:rounded-2xl md:p-0 md:shadow-2xl'
      onClick={(event) => event.stopPropagation()}
    >
      {/* Close button */}
      <button
        className='absolute right-3 top-3 z-30 rounded-full bg-black/10 p-1 hover:bg-black/20 active:bg-black/20 active:bg-stone-100 sm:right-5 sm:top-5 md:bg-transparent md:hover:bg-stone-100'
        onClick={props.onClose}
      >
        <XMarkIcon className='h-8 w-8 stroke-1 text-white md:text-stone-500' />
      </button>
      {/* Image */}
      <section className='relative aspect-[4/3] h-min shrink-0 overflow-hidden sm:aspect-square sm:rounded-2xl sm:max-md:w-48 md:m-4 md:mr-0 md:shrink md:basis-2/5 lg:m-8 lg:mr-0'>
        <Image
          style={{ WebkitTouchCallout: 'none' }}
          draggable={false}
          className='object-cover'
          src={com.commodity.image?.path ?? settings.RESOURCE_FOOD_PLACEHOLDER}
          sizes='(max-width: 375px) 100vw, (max-width: 750px) 75vw, 640px'
          alt={com.commodity.name ?? 'food placeholder'}
        />
      </section>
      {/* Form */}
      <form
        className='group flex shrink-0 grow flex-col gap-8 p-4 @container/detail sm:p-0 md:overflow-y-auto md:p-4 lg:p-8'
        data-ui={twData({ available: !isUnavailable })}
        onSubmit={handleSubmit(handleCreateCartItem)}
      >
        {/* Info */}
        <header className='flex flex-col gap-2 lg:gap-4'>
          <h1 className='indent-[0.1em] text-3xl font-bold tracking-widest text-stone-800'>
            {com.commodity.name}
          </h1>
          <h2 className='indent-[0.05em] text-2xl tracking-wider text-yellow-500 lg:-mt-2'>
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
                <p className='indent-[0.05em] tracking-wider text-stone-500'>{`限量 ${com.stock} 份`}</p>
              </div>
            )}
            {com.limitPerUser > 0 && (
              <div className='flex items-center gap-2'>
                <UserPlusIcon className='h-4 w-4 text-stone-300' />
                <p className='indent-[0.05em] tracking-wider text-stone-500'>{`每人限點 ${com.limitPerUser} 份`}</p>
              </div>
            )}
          </div>
        )}
        <div className='border-b border-stone-200'></div>
        {/* Option Sets */}
        <main className='flex flex-col gap-4 group-data-not-available:pointer-events-none group-data-not-available:opacity-60'>
          {(com.commodity.optionSets as OptionSet[]).map((optionSet) => (
            <OptionSet
              key={optionSet.name}
              optionSet={optionSet}
              register={register}
              errors={errors}
            />
          ))}
        </main>
        {/* Spacer For sm */}
        <div className='-my-4 shrink grow'></div>
        {/* Quantity */}
        <section className='relative flex shrink-0 select-none justify-center group-data-not-available:pointer-events-none group-data-not-available:hidden'>
          <QuantityInput
            control={control}
            isUnavailable={isUnavailable}
            maxQuantity={com.maxQuantity}
            register={register}
          />
        </section>
        {/* Unavailable message */}
        {isUnavailable && (
          <section className='flex flex-col gap-1 rounded-md bg-stone-100 p-4 text-stone-500'>
            <div className='flex items-center gap-2'>
              <ExclamationTriangleIcon className='h-5 w-5 text-yellow-400' />
              無法加入購物車
            </div>
            <ul className='flex flex-col gap-1 text-stone-400'>
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
        <footer className='flex shrink-0 flex-col gap-4 @xs/detail:flex-row-reverse'>
          <Button
            isBusy={isBusy}
            isLoading={addCartMutation.isLoading || addCartMutation.isSuccess}
            isDisabled={isUnavailable}
            className='h-12 grow @xs/detail:basis-3/5'
            type='submit'
            textClassName='font-bold'
            label={isUnavailable ? '無法訂購' : '加到購物車'}
          />
          <Button
            label='返回'
            className='h-12 grow @xs/detail:basis-2/5'
            theme='support'
            onClick={props.onClose}
          />
        </footer>
      </form>
    </section>
  )
}

export default memo(COMDialogContent)

function OptionSet(props: {
  optionSet: OptionSet
  register: UseFormRegister<FormInputs>
  errors: FieldErrorsImpl<FormInputs>
}) {
  const { optionSet } = props
  const error = props.errors.options?.[optionSet.name]

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
              {...props.register(`options.${optionSet.name}`, {
                required: !optionSet.multiSelect && '請選擇一個選項',
              })}
            />
            <div className='m-[0.0625rem] cursor-pointer rounded-2xl border border-stone-300 py-2 px-3 indent-[0.05em] text-sm tracking-wider hover:border-stone-400 active:border-stone-400 peer-checked:m-0 peer-checked:border-2 peer-checked:border-yellow-500'>
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
        className='rounded-full p-1 text-stone-500 hover:bg-stone-200 active:bg-stone-200 disabled:pointer-events-none disabled:text-stone-300'
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
        className='rounded-full p-1 text-stone-500 hover:bg-stone-200 active:bg-stone-200 disabled:pointer-events-none disabled:text-stone-300'
      >
        <PlusIcon className='h-5 w-5' />
      </button>
    </div>
  )
}