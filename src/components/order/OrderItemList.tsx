import { useState, useEffect, useRef, useCallback } from 'react'
import { twMerge } from 'tailwind-merge'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

import { OrderItems } from '@/lib/client/trpc'
import Image from '@/components/core/Image'
import { settings } from '@/lib/common'

const SCROLL_WIDTH = 256

export default function OrderItemList(props: { orderItems?: OrderItems }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)
  const [scrollState, setScrollState] = useState<'left' | 'middle' | 'right'>(
    'right',
  )

  // detect scrollable when window resize
  useEffect(() => {
    const handleResize = () => {
      if (scrollRef.current) {
        setIsScrollable(
          scrollRef.current.scrollWidth > scrollRef.current.clientWidth,
        )
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [scrollRef])

  // set scroll state when scroll
  useEffect(() => {
    if (!isScrollable) return
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        if (scrollLeft <= 0) {
          setScrollState('left')
        } else if (scrollLeft + clientWidth + 1 >= scrollWidth) {
          setScrollState('right')
        } else {
          setScrollState('middle')
        }
      }
    }
    handleScroll()
    scrollRef.current?.addEventListener('scroll', handleScroll)
    return () => scrollRef.current?.removeEventListener('scroll', handleScroll)
  }, [scrollRef, isScrollable])

  const handleFaderClick = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const { scrollLeft } = scrollRef.current
    if (direction === 'left') {
      scrollRef.current.scrollTo({
        left: Math.max(0, scrollLeft - SCROLL_WIDTH),
        behavior: 'smooth',
      })
    } else {
      scrollRef.current.scrollTo({
        left: Math.min(
          scrollRef.current.scrollWidth,
          scrollLeft + SCROLL_WIDTH,
        ),
        behavior: 'smooth',
      })
    }
  }, [])

  return (
    <section className='relative select-none'>
      <div
        ref={scrollRef}
        className={twMerge('w-full overflow-x-auto scrollbar-none')}
      >
        <div className='flex w-max gap-6'>
          {(
            props.orderItems ?? ([...Array(2).fill(undefined)] as undefined[])
          ).map((item, index) => (
            // Order Item
            <div className='group/item flex gap-4' key={item?.id ?? index}>
              {/* Image */}
              <div className='relative z-0 my-auto aspect-square h-fit w-[4rem] overflow-hidden rounded-full group-data-loading:skeleton lg:w-[6rem]'>
                <Image
                  className='object-cover group-data-loading:hidden'
                  src={item?.image?.path ?? settings.RESOURCE_FOOD_PLACEHOLDER}
                  sizes='(max-width: 1024px) 640px, 1280px'
                  alt={item?.name ?? 'food'}
                  fill
                />
                <div className='absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/item:opacity-100 group-active/item:opacity-100'>
                  <p className='indent-[0.05em] font-bold tracking-wider text-white lg:text-xl'>
                    ${item?.price ?? 50}
                  </p>
                </div>
              </div>
              {/* Content */}
              <div className='flex flex-col gap-2'>
                {/* Title */}
                <div className='rounded-xl indent-[0.05em] font-bold tracking-wider group-data-loading:skeleton'>
                  {`${item?.name ?? '各種餐點'} x ${item?.quantity ?? 1}`}
                </div>
                {/* Options */}
                <div className='flex flex-col gap-0.5 lg:gap-1'>
                  {(item
                    ? Object.values(item.options).flatMap((value) =>
                        Array.isArray(value) ? value : [value],
                      )
                    : ([...Array(2).fill(undefined)] as undefined[])
                  ).map((option, index) => (
                    <span
                      key={option ?? index}
                      className='w-fit whitespace-nowrap rounded-xl text-xs text-stone-400 group-data-loading:skeleton lg:text-sm'
                    >
                      {option ?? '選項'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Fader */}
      <div
        className={twMerge(
          'pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-white to-transparent',
          (scrollState === 'left' || !isScrollable) && 'hidden',
        )}
      >
        <ChevronLeftIcon
          className='pointer-events-auto absolute left-0 top-1/2 h-10 w-10 -translate-y-1/2 cursor-pointer rounded-full p-2 text-stone-400 transition-transform hover:scale-125 hover:bg-stone-200/40 active:scale-95'
          onClick={() => handleFaderClick('left')}
        />
      </div>
      <div
        className={twMerge(
          'pointer-events-none absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-white to-transparent',
          (scrollState === 'right' || !isScrollable) && 'hidden',
        )}
      >
        <ChevronRightIcon
          className='pointer-events-auto absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 cursor-pointer rounded-full p-2 text-stone-400 transition-transform hover:scale-125 hover:bg-stone-200/40 active:scale-95'
          onClick={() => handleFaderClick('right')}
        />
      </div>
    </section>
  )
}
