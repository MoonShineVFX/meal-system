import { ReactNode } from 'react'
import { useRef, useState, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

const CLOSE_TRIGGER_THRESHOLD_RATIO = 0.5

export default function SwipeableContent(props: {
  children: ReactNode
  onClose: () => void
  breakingPoint?: number
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const [isCloseable, setIsCloseable] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [isDisabled, setIsDisabled] = useState(true)

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
    if (!scrollRef.current || !coreRef.current) return

    if (!isClosing) {
      scrollRef.current.scrollTo({
        top: window.innerHeight,
      })
    }
  }, [scrollRef.current, coreRef.current, isClosing, isDisabled])

  // Scroll behavior
  useEffect(() => {
    if (!scrollRef.current || !coreRef || isClosing) return
    const handleScroll = () => {
      if (!scrollRef.current || !coreRef.current) return

      const scrollY = coreRef.current.getBoundingClientRect().top

      if (
        scrollRef.current.scrollTop <=
        window.innerHeight * CLOSE_TRIGGER_THRESHOLD_RATIO
      ) {
        setIsClosing(true)
        props.onClose()
        return
      }

      if (scrollY >= 0 && !isCloseable) {
        setIsCloseable(true)
      } else if (scrollY < 0 && isCloseable) {
        setIsCloseable(false)
      }
    }

    scrollRef.current.addEventListener('scroll', handleScroll)
    return () => {
      if (!scrollRef.current || !coreRef) return
      scrollRef.current.removeEventListener('scroll', handleScroll)
    }
  }, [scrollRef.current, coreRef.current, isCloseable, isDisabled, isClosing])

  if (isDisabled) return <>{props.children}</>

  return (
    <div
      ref={scrollRef}
      className={twMerge(
        'h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-none',
      )}
    >
      <div className={twMerge('h-screen', isCloseable && 'snap-start')}></div>
      <div ref={coreRef} className={'snap-start pt-8'}>
        {props.children}
      </div>
    </div>
  )
}
