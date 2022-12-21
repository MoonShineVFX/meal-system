import { ReactNode } from 'react'
import { useRef, useState, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

const CLOSE_TRIGGER_THRESHOLD_RATIO = 0.5

export default function Swiper(props: {
  children: ReactNode
  onClose: () => void
  breakingPoint?: number
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const handlerRef = useRef<HTMLDivElement>(null)
  const [isScrollInCore, setIsScrollInCore] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)

  // Detect media query
  useEffect(() => {
    if (!props.breakingPoint) return
    const matchMedia = window.matchMedia(
      `(min-width: ${props.breakingPoint}px)`,
    )
    const handleMediaQueryChange = () => {
      if (matchMedia.matches && !isDisabled) {
        setIsDisabled(true)
      } else if (!matchMedia.matches && isDisabled) {
        setIsDisabled(false)
      }
    }
    handleMediaQueryChange()

    matchMedia.addEventListener('change', handleMediaQueryChange)
    return () => {
      if (!props.breakingPoint) return
      matchMedia.removeEventListener('change', handleMediaQueryChange)
    }
  }, [props.breakingPoint])

  // Scroll to core when open
  useEffect(() => {
    if (!parentRef.current || !coreRef.current) return

    if (!isClosing) {
      parentRef.current.scrollTo({
        top: window.innerHeight,
      })
    }
  }, [parentRef.current, coreRef.current, isClosing])

  // Detect scroll to topmost and close
  useEffect(() => {
    if (!parentRef.current || isClosing) return
    const handleParentScroll = () => {
      if (!parentRef.current) return

      if (
        parentRef.current.scrollTop <=
        window.innerHeight * CLOSE_TRIGGER_THRESHOLD_RATIO
      ) {
        setIsClosing(true)
        props.onClose()
        return
      }
    }

    parentRef.current.addEventListener('scroll', handleParentScroll)
    return () => {
      parentRef.current?.removeEventListener('scroll', handleParentScroll)
    }
  }, [parentRef.current, isClosing])

  // Detect core scroll to bottom and put white bg behind for overscrolling
  useEffect(() => {
    if (!coreRef.current || !handlerRef.current) return
    const handleCoreScroll = () => {
      if (!coreRef.current || !handlerRef.current) return

      const scrollY = coreRef.current.scrollTop

      if (scrollY >= 0) {
        if (!isScrollInCore) setIsScrollInCore(true)
        if (handlerRef.current.style.display === 'block')
          handlerRef.current.style.display = 'none'
      } else if (scrollY < 0) {
        if (isScrollInCore) setIsScrollInCore(false)
        if (handlerRef.current.style.display === 'none')
          handlerRef.current.style.display = 'block'
      }
    }

    coreRef.current.addEventListener('scroll', handleCoreScroll)
    return () => {
      coreRef.current?.removeEventListener('scroll', handleCoreScroll)
    }
  }, [coreRef.current, isScrollInCore, handlerRef.current])

  // Initial HandlerRef
  useEffect(() => {
    if (!handlerRef.current) return
    handlerRef.current.style.display = 'none'
  }, [handlerRef.current])

  if (isDisabled) return <>{props.children}</>

  return (
    <div
      ref={parentRef}
      className={twMerge(
        'relative h-full w-full snap-y snap-mandatory overflow-y-auto scrollbar-none',
      )}
    >
      {/* Spacer */}
      <div className='absolute h-full w-full snap-start'></div>
      {/* BG for over scroll */}
      <div
        className={twMerge(
          'absolute top-[150%] h-1/2 w-full bg-white',
          !isScrollInCore && 'hidden',
        )}
      ></div>
      {/* Core */}
      <div
        ref={coreRef}
        className={
          'absolute top-full h-full w-full snap-start overflow-y-auto pt-4 scrollbar-none'
        }
      >
        {props.children}
      </div>
      {/* Parent scroll handler */}
      <div
        ref={handlerRef}
        className='absolute top-full z-10 aspect-square w-full'
      ></div>
    </div>
  )
}
