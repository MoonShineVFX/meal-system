import { memo, useState, useEffect, useCallback } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/24/outline'
import { MinusIcon } from '@heroicons/react/24/outline'
import { UserPlusIcon } from '@heroicons/react/20/solid'
import { Square3Stack3DIcon } from '@heroicons/react/20/solid'

import { settings, OptionSet, twData } from '@/lib/common'
import Image from '@/components/core/Image'
import Button from '@/components/core/Button'
import type { CommodityOnMenu } from '@/lib/client/trpc'

type SelectedOptionSet = Record<string, string[]>

function CommodityOnMenuDetailContent(props: {
  onClose: () => void
  commodityOnMenu: CommodityOnMenu
}) {
  const { commodityOnMenu } = props
  const [selectedOptionSets, setSelectedOptionSets] =
    useState<SelectedOptionSet>({})
  const [quantity, setQuantity] = useState(1)
  const [isValidateStock, setIsValidateStock] = useState(false)
  const [isValidateLimitPerUser, setIsValidateLimitPerUser] = useState(false)
  const [maxOrderQuantity, setMaxOrderQuantity] = useState(0)

  // Reset state
  useEffect(() => {
    setQuantity(1)
  }, [])

  // Reset selected option sets when commodity changes
  useEffect(() => {
    if (commodityOnMenu) {
      setSelectedOptionSets(
        (commodityOnMenu.commodity.optionSets as OptionSet[]).reduce(
          (acc, optionSet) => ({
            ...acc,
            [optionSet.name]: [],
          }),
          {},
        ),
      )

      setIsValidateStock(commodityOnMenu.stock !== 0)
      setIsValidateLimitPerUser(commodityOnMenu.limitPerUser !== 0)
      setMaxOrderQuantity(
        Math.min(
          commodityOnMenu.stock !== 0
            ? commodityOnMenu.stock - commodityOnMenu.orderedCount.total
            : 99,
          commodityOnMenu.limitPerUser !== 0
            ? commodityOnMenu.limitPerUser - commodityOnMenu.orderedCount.user
            : 99,
        ),
      )
    }
  }, [commodityOnMenu])

  // Set quantity to maxOrderQuantity when it changes
  useEffect(() => {
    setQuantity((prev) => Math.min(prev, maxOrderQuantity))
  }, [maxOrderQuantity])

  const handleQuantityButtonClick = useCallback(
    (action: 'INCREASE' | 'DECREASE') => {
      const offset = action === 'INCREASE' ? 1 : -1
      setQuantity((prev) => Math.max(1, prev + offset))
    },
    [],
  )

  return (
    <section
      className='relative mx-auto flex h-auto w-full flex-col overflow-hidden rounded-t-2xl bg-white pb-4 sm:gap-4 sm:rounded-none sm:p-4 md:h-auto md:max-w-3xl md:flex-row md:rounded-2xl md:shadow-2xl lg:gap-8 lg:p-8'
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
      <section className='relative aspect-[4/3] h-min shrink-0 overflow-hidden sm:aspect-square sm:shrink sm:rounded-2xl md:basis-2/5'>
        <Image
          style={{ WebkitTouchCallout: 'none' }}
          draggable={false}
          className='object-cover'
          src={
            commodityOnMenu.commodity.image?.path ??
            settings.RESOURCE_FOOD_PLACEHOLDER
          }
          sizes='(max-width: 375px) 100vw, (max-width: 750px) 75vw, 640px'
          alt={commodityOnMenu.commodity.name ?? 'food placeholder'}
        />
      </section>
      {/* Form */}
      <form
        className='group flex shrink-0 grow flex-col gap-8 p-4 @container/detail sm:p-0 md:overflow-y-auto'
        data-ui={twData({ available: maxOrderQuantity !== 0 })}
      >
        {/* Info */}
        <header className='flex flex-col gap-2'>
          <h1 className='indent-[0.1em] text-3xl font-bold tracking-widest text-stone-800'>
            {commodityOnMenu.commodity.name}
          </h1>
          <h2 className='indent-[0.05em] text-3xl tracking-wider text-yellow-500'>
            ${commodityOnMenu.commodity.price}
          </h2>
          {commodityOnMenu.commodity.description !== '' && (
            <p className='text-stone-500'>
              {commodityOnMenu.commodity.description}
            </p>
          )}
        </header>
        {/* Metadata */}
        {(isValidateStock || isValidateLimitPerUser) && (
          <div className='flex flex-col gap-2'>
            {isValidateStock && (
              <div className='flex items-center gap-2'>
                <Square3Stack3DIcon className='h-4 w-4 text-stone-300' />
                <p className='indent-[0.05em] tracking-wider text-stone-500'>{`限量 ${commodityOnMenu.stock} 份`}</p>
                {commodityOnMenu.orderedCount.total >=
                  commodityOnMenu.stock && (
                  <p className='text-red-400'>已售完</p>
                )}
              </div>
            )}
            {isValidateLimitPerUser && (
              <div className='flex items-center gap-2'>
                <UserPlusIcon className='h-4 w-4 text-stone-300' />
                <p className='indent-[0.05em] tracking-wider text-stone-500'>{`每人限點 ${commodityOnMenu.limitPerUser} 份`}</p>
                {commodityOnMenu.orderedCount.user >=
                  commodityOnMenu.limitPerUser && (
                  <p className='text-red-400'>已達購買上限</p>
                )}
              </div>
            )}
          </div>
        )}
        <div className='border-b border-stone-200'></div>
        {/* Option Sets */}
        <main className='flex flex-col gap-4 group-data-not-available:pointer-events-none group-data-not-available:opacity-50'>
          {(commodityOnMenu.commodity.optionSets as OptionSet[]).map(
            (optionSet) => (
              <OptionSetMemo
                key={optionSet.name}
                optionSet={optionSet}
                selectedOptions={selectedOptionSets[optionSet.name]}
              />
            ),
          )}
        </main>
        {/* Spacer For sm */}
        <div className='-my-4 shrink grow'></div>
        {/* Quantity */}
        <section className='flex shrink-0 select-none justify-center group-data-not-available:pointer-events-none group-data-not-available:opacity-50'>
          <div className='flex items-center gap-2 rounded-full bg-stone-100 p-1'>
            <input type='number' className='hidden' value={quantity} readOnly />
            <button
              type='button'
              onClick={() => handleQuantityButtonClick('DECREASE')}
              disabled={quantity <= 1}
              className='rounded-full p-1 text-stone-500 hover:bg-stone-200 active:bg-stone-200 disabled:pointer-events-none disabled:text-stone-300'
            >
              <MinusIcon className='h-5 w-5' />
            </button>
            <p className='min-w-[1.2em] text-center text-xl text-stone-500'>
              {quantity}
            </p>
            <button
              type='button'
              onClick={() => handleQuantityButtonClick('INCREASE')}
              disabled={quantity === maxOrderQuantity}
              className='rounded-full p-1 text-stone-500 hover:bg-stone-200 active:bg-stone-200 disabled:pointer-events-none disabled:text-stone-300'
            >
              <PlusIcon className='h-5 w-5' />
            </button>
          </div>
        </section>
        {/* Buttons */}
        <footer className='flex shrink-0 flex-col gap-4 @xs/detail:flex-row-reverse'>
          <Button
            isDisabled={maxOrderQuantity === 0}
            className='h-12 grow'
            type='submit'
            textClassName='font-bold'
            label={maxOrderQuantity === 0 ? '無法購買' : '加到購物車'}
          />
          <Button
            label='返回'
            className='h-12 grow'
            theme='support'
            onClick={props.onClose}
          />
        </footer>
      </form>
    </section>
  )
}

export default memo(CommodityOnMenuDetailContent)

function OptionSet(props: { optionSet: OptionSet; selectedOptions: string[] }) {
  const { optionSet } = props

  return (
    <section className='flex flex-col gap-2'>
      <h3 className='text font-bold'>{optionSet.name}</h3>
      <div className='flex flex-wrap gap-2'>
        {props.optionSet.options.map((optionName) => (
          <label key={optionName}>
            <input
              className='peer hidden'
              type={optionSet.multiSelect ? 'checkbox' : 'radio'}
              name={optionSet.name}
              value={optionName}
            />
            <div className='m-[1px] cursor-pointer rounded-2xl border border-stone-300 py-2 px-3 indent-[0.05em] text-sm tracking-wider hover:border-stone-400 active:border-stone-400 peer-checked:m-0 peer-checked:border-2 peer-checked:border-yellow-500'>
              {optionName}
            </div>
          </label>
        ))}
      </div>
    </section>
  )
}

const OptionSetMemo = memo(OptionSet)
