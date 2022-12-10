import { memo, useState, useEffect, useCallback } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/24/outline'
import { MinusIcon } from '@heroicons/react/24/outline'

import { settings, OptionSet } from '@/lib/common'
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
    }
  }, [commodityOnMenu])

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
      <form className='flex shrink-0 grow flex-col gap-4 p-4 @container/detail sm:p-0 md:overflow-y-auto'>
        {/* Info */}
        <header className='mb-4 flex flex-col gap-2 border-b border-stone-200'>
          <h1 className='text-3xl font-bold text-stone-800'>
            {commodityOnMenu.commodity.name}
          </h1>
          <h2 className='text-3xl text-stone-500'>
            ${commodityOnMenu.commodity.price}
          </h2>
          {commodityOnMenu.commodity.description !== '' && (
            <p className='text-stone-500'>
              {commodityOnMenu.commodity.description}
            </p>
          )}
        </header>
        {/* Option Sets */}
        <main className='flex flex-col gap-4'>
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
        <div className='shrink grow'></div>
        {/* Quantity */}
        <section className='my-4 flex shrink-0 justify-center'>
          <div className='flex items-center gap-2 rounded-full bg-stone-100 p-1'>
            <input
              type='number'
              className='hidden'
              min='1'
              value={quantity}
              readOnly
            />
            <button
              type='button'
              onClick={() => handleQuantityButtonClick('DECREASE')}
              className='rounded-full p-2 text-stone-500 hover:bg-stone-200 active:bg-stone-200'
            >
              <MinusIcon className='h-6 w-6' />
            </button>
            <p className='min-w-[1.2em] text-center text-xl text-stone-500'>
              {quantity}
            </p>
            <button
              type='button'
              onClick={() => handleQuantityButtonClick('INCREASE')}
              className='rounded-full p-2 text-stone-500 hover:bg-stone-200 active:bg-stone-200'
            >
              <PlusIcon className='h-6 w-6' />
            </button>
          </div>
        </section>
        {/* Buttons */}
        <footer className='flex shrink-0 flex-col gap-4 @xs/detail:flex-row-reverse'>
          <Button
            className='h-12 grow'
            type='submit'
            textClassName='font-bold'
            label='加到購物車'
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
            <div className='m-[1px] cursor-pointer rounded-2xl border border-stone-300 py-2 px-3 hover:border-stone-400 active:border-stone-400 peer-checked:m-0 peer-checked:border-2 peer-checked:border-yellow-500'>
              {optionName}
            </div>
          </label>
        ))}
      </div>
    </section>
  )
}

const OptionSetMemo = memo(OptionSet)
