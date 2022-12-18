import React, { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { ChevronUpIcon } from '@heroicons/react/20/solid'

export function ScrollFader(props: {
  children: JSX.Element
  faderHeight?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState<
    'top' | 'middle' | 'bottom' | 'none'
  >('top')

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const { scrollTop, scrollHeight, clientHeight } = ref.current
      if (scrollHeight <= clientHeight) {
        setScrollState('none')
      } else if (scrollTop <= 0) {
        setScrollState('top')
      } else if (scrollTop + clientHeight >= scrollHeight) {
        setScrollState('bottom')
      } else {
        setScrollState('middle')
      }
    }
    handleScroll()
    ref.current?.addEventListener('scroll', handleScroll)
    return () => {
      ref.current?.removeEventListener('scroll', handleScroll)
    }
  }, [ref])

  return (
    <>
      <div
        className={twMerge(
          'pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-white',
          props.faderHeight ?? 'h-[10vh]',
          ['top', 'none'].includes(scrollState) && 'hidden',
        )}
      >
        <ChevronUpIcon className='absolute top-0 left-1/2 h-4 w-4 -translate-x-1/2 text-stone-400' />
      </div>
      {React.cloneElement(props.children, { ref: ref })}
      <div
        className={twMerge(
          'pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white',
          props.faderHeight ?? 'h-[10vh]',
          ['bottom', 'none'].includes(scrollState) && 'hidden',
        )}
      >
        <ChevronDownIcon className='absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 text-stone-400' />
      </div>
    </>
  )
}
