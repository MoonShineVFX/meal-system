import { Transition } from '@headlessui/react'
import { Fragment, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

import Title from '@/components/core/Title'
import type { CommodityOnMenu } from '@/lib/client/trpc'
import CommodityOnMenuDetailContent from './CommodityOnMenuDetailContent'
import SwipeableContent from '../core/SwipeableContent'

export default function CommodityOnMenuDetail(props: {
  isOpen: boolean
  onClose: () => void
  commodityOnMenu?: CommodityOnMenu
}) {
  const { commodityOnMenu } = props

  // Reset state
  useEffect(() => {
    if (!props.isOpen) return
  }, [props.isOpen])

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
        as='section'
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-200'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-150'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='col-start-1 row-start-1 bg-black/50' />
        </Transition.Child>
        {/* Dialog */}
        <Transition.Child
          enter='transition duration-200 ease-out'
          enterFrom='transform max-sm:translate-y-full sm:scale-50 sm:opacity-0'
          enterTo='transform max-sm:translate-y-0 sm:scale-100 sm:opacity-100'
          leave='transition duration-150 ease-out'
          leaveFrom='transform max-sm:translate-y-0 sm:scale-100 sm:opacity-100'
          leaveTo='transform max-sm:translate-y-full sm:scale-50 sm:opacity-0'
          className='col-start-1 row-start-1 flex transform-gpu flex-col justify-center md:p-4 lg:p-8'
        >
          {props.commodityOnMenu && (
            <SwipeableContent onClose={props.onClose} breakingPoint={640}>
              <CommodityOnMenuDetailContent
                onClose={props.onClose}
                commodityOnMenu={props.commodityOnMenu}
              />
            </SwipeableContent>
          )}
        </Transition.Child>
      </Transition>
    </>
  )
}
