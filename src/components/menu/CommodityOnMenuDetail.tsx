import { Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

import Title from '@/components/core/Title'
import { settings, OptionSet, twData } from '@/lib/common'
import Image from '@/components/core/Image'
import Button from '@/components/core/Button'
import type { CommodityOnMenu } from '@/lib/client/trpc'

type SelectedOptionSet = Record<string, string[]>
type OptionClickHandler = (
  optionSetName: string,
  optionName: string,
  action: 'ADD' | 'REMOVE' | 'REPLACE',
) => void

export default function CommodityOnMenuDetail(props: {
  isOpen: boolean
  onClose: () => void
  commodityOnMenu?: CommodityOnMenu
}) {
  const { commodityOnMenu } = props
  const [selectedOptionSets, setSelectedOptionSets] =
    useState<SelectedOptionSet>({})
  const [quantity, setQuantity] = useState(1)

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

  const handleQuantityButtonClick = (action: 'INCREASE' | 'DECREASE') => {
    const offset = action === 'INCREASE' ? 1 : -1
    setQuantity((prev) => Math.max(1, prev + offset))
  }
  const handleOptionButtonClick: OptionClickHandler = (
    optionSetName,
    optionName,
    action,
  ) => {
    setSelectedOptionSets((prev) => {
      const selectedOptions = prev[optionSetName]
      const newSelectedOptions = (() => {
        switch (action) {
          case 'ADD':
            return [...selectedOptions, optionName]
          case 'REMOVE':
            return selectedOptions.filter((o) => o !== optionName)
          case 'REPLACE':
            return [optionName]
        }
      })()
      return {
        ...prev,
        [optionSetName]: newSelectedOptions,
      }
    })
  }

  return (
    <>
      {props.isOpen && commodityOnMenu && (
        <Title prefix={commodityOnMenu.commodity.name} />
      )}
      <Transition
        show={props.isOpen}
        className={twMerge(
          'absolute inset-0 z-40 grid grid-cols-1 grid-rows-1',
          !props.isOpen && 'pointer-events-none',
        )}
        onClick={props.onClose}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-100'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-75'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='col-start-1 row-start-1 bg-black/30' />
        </Transition.Child>
        {/* Dialog */}
        <Transition.Child
          enter='transition duration-200 ease-out'
          enterFrom='transform translate-y-full sm:translate-y-0 sm:scale-50 sm:opacity-0'
          enterTo='transform translate-y-0 sm:scale-100 sm:opacity-100'
          leave='transition duration-100 ease-out'
          leaveFrom='transform translate-y-0 sm:scale-100 sm:opacity-100'
          leaveTo='transform translate-y-full sm:translate-y-0 sm:scale-50 sm:opacity-0'
          className='col-start-1 row-start-1 flex flex-col justify-center'
        >
          {commodityOnMenu && (
            <div
              className='mx-auto mt-8 flex h-full w-full flex-col gap-4 overflow-auto rounded-t-2xl bg-gray-100 p-4 sm:mt-0 sm:h-auto sm:max-h-[80%] sm:max-w-4xl sm:rounded-2xl'
              onClick={(event) => event.preventDefault()}
            >
              {/* Image */}
              <div className='relative mt-2 aspect-[4/3] shrink-0 overflow-hidden rounded-2xl'>
                <Image
                  className='object-cover'
                  src={
                    commodityOnMenu.commodity.image?.path ??
                    settings.RESOURCE_FOOD_PLACEHOLDER
                  }
                  sizes='(max-width: 375px) 50vw, (max-width: 750px) 33vw, 150px'
                  alt={commodityOnMenu.commodity.name ?? 'food placeholder'}
                />
              </div>
              {/* Info */}
              <div className='flex flex-col gap-2'>
                <p className='text-3xl font-bold text-gray-800'>
                  {commodityOnMenu.commodity.name}
                </p>
                <p className='text-2xl font-bold text-violet-500'>
                  ${commodityOnMenu.commodity.price}
                </p>
                <p>{commodityOnMenu.commodity.description}</p>
              </div>
              {/* Option Sets */}
              <div className='flex flex-col gap-4'>
                {(commodityOnMenu.commodity.optionSets as OptionSet[]).map(
                  (optionSet) => (
                    <OptionSet
                      key={optionSet.name}
                      optionSet={optionSet}
                      selectedOptions={selectedOptionSets[optionSet.name]}
                      onClick={handleOptionButtonClick}
                    />
                  ),
                )}
              </div>
              {/* Quantity */}
              <div className='flex shrink-0 justify-center'>
                <button onClick={() => handleQuantityButtonClick('DECREASE')}>
                  {' '}
                  -{' '}
                </button>
                <span>{quantity}</span>
                <button onClick={() => handleQuantityButtonClick('INCREASE')}>
                  {' '}
                  +{' '}
                </button>
              </div>
              {/* Add to cart */}
              <div className='flex h-12 shrink-0 gap-4'>
                <Button
                  className='grow'
                  label='返回'
                  theme='secondary'
                  onClick={props.onClose}
                />
                <Button className='grow' label='加到購物車' />
              </div>
            </div>
          )}
        </Transition.Child>
      </Transition>
    </>
  )
}

function OptionSet(props: {
  optionSet: OptionSet
  selectedOptions: string[]
  onClick: OptionClickHandler
}) {
  const { optionSet } = props

  return (
    <div className='flex flex-col gap-2'>
      <p className='text font-bold text-gray-800'>{optionSet.name}</p>
      <div className='flex flex-wrap gap-2'>
        {props.optionSet.options.map((optionName) => {
          const isSelected = props.selectedOptions.includes(optionName)
          return (
            <button
              data-ui={twData({
                selected: isSelected,
              })}
              onClick={() =>
                props.onClick(
                  optionSet.name,
                  optionName,
                  optionSet.multiSelect
                    ? isSelected
                      ? 'REMOVE'
                      : 'ADD'
                    : 'REPLACE',
                )
              }
              className='m-[1px] rounded-2xl border border-gray-300 py-2 px-3 data-selected:m-0 data-selected:border-2 data-selected:border-violet-500'
              key={optionName}
            >
              {optionName}
            </button>
          )
        })}
      </div>
    </div>
  )
}
