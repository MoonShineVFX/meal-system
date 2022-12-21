import { useState, useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

import { OrderItems } from '@/lib/client/trpc'
import Image from '@/components/core/Image'
import { settings } from '@/lib/common'

export default function OrderItemList(props: { orderItems: OrderItems }) {
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
        } else if (scrollLeft + clientWidth >= scrollWidth) {
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

  return (
    <section className='relative'>
      <div
        ref={scrollRef}
        className={twMerge(
          'sm:ms-scroll w-full overflow-x-auto max-sm:scrollbar-none',
          isScrollable && 'sm:pb-4',
        )}
      >
        <div className='flex w-fit gap-4'>
          {props.orderItems.map((item) => (
            <div className='flex flex-col items-center gap-2' key={item.id}>
              <div className='relative mx-2 aspect-square w-14 overflow-hidden rounded-full'>
                <Image
                  className='object-cover'
                  src={item.image?.path ?? settings.RESOURCE_FOOD_PLACEHOLDER}
                  sizes='(max-width: 640px) 64px, 128px'
                  alt={item.name}
                  fill
                />
              </div>
              <div className='indent-[0.05em] text-xs tracking-wider text-stone-500'>
                {`${item.name} x ${item.quantity}`}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Fader */}
      <div
        className={twMerge(
          'absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-white to-transparent',
          (scrollState === 'left' || !isScrollable) && 'hidden',
        )}
      >
        <ChevronLeftIcon className='absolute -left-2 top-1/2 h-6 w-6 -translate-y-1/2 text-stone-400' />
      </div>
      <div
        className={twMerge(
          'absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-white to-transparent',
          (scrollState === 'right' || !isScrollable) && 'hidden',
        )}
      >
        <ChevronRightIcon className='absolute -right-2 top-1/2 h-6 w-6 -translate-y-1/2 text-stone-400' />
      </div>
    </section>
  )
}
