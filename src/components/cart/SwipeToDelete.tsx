import { twMerge } from 'tailwind-merge'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function SwipeToDelete(props: {
  children: JSX.Element
  portalId: string
  onDelete: () => void
  coreRef: React.RefObject<HTMLElement>
  referenceElement?: HTMLElement
  isDisabled?: boolean
  isInvalid?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const [isSwipped, setIsSwipped] = useState(false)

  // set root height to core height
  useEffect(() => {
    if (!rootRef.current || !props.coreRef.current) return
    const handleResize = () => {
      if (!rootRef.current || !props.coreRef.current) return
      rootRef.current.style.height = `${props.coreRef.current.offsetHeight}px`
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [rootRef, props.coreRef])

  // blur when disabled
  useEffect(() => {
    handleBlur()
  }, [props.isDisabled])

  // focus when scrolling
  useEffect(() => {
    if (!scrollRef.current || !rootRef.current) return
    const handleScroll = () => {
      if (!scrollRef.current || !rootRef.current) return
      if (scrollRef.current.scrollLeft <= 0) {
        if (isSwipped) setIsSwipped(false)
      } else if (scrollRef.current.scrollLeft > 0) {
        if (!isSwipped) {
          setIsSwipped(true)
          rootRef.current.focus()
        }
      }
      handleClick()
    }
    scrollRef.current.addEventListener('scroll', handleScroll)
    return () => scrollRef.current?.removeEventListener('scroll', handleScroll)
  }, [scrollRef, rootRef, isSwipped])

  // move portal to reference position
  const handleClick = () => {
    if (!rootRef.current || !props.referenceElement || !portalRef.current)
      return

    const buttonRect = props.referenceElement.getBoundingClientRect()
    const rootRect = rootRef.current.getBoundingClientRect()

    portalRef.current.style.top = `${
      buttonRect.y - rootRect.y + buttonRect.height
    }px`
    portalRef.current.style.left = `${buttonRect.x - rootRect.x}px`
    portalRef.current.style.width = `${buttonRect.width}px`
    portalRef.current.style.height = '0px'
  }

  const handleDelete = () => {
    if (props.isDisabled) return
    props.onDelete()
  }

  const handleBlur = () => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
  }

  return (
    <motion.div
      layout
      transition={{ duration: 0.2 }}
      ref={rootRef}
      className='relative w-full focus:outline-none'
      onClick={handleClick}
      onBlur={handleBlur}
      tabIndex={0}
    >
      {/* Padding */}
      <div className='absolute inset-y-0 right-0 w-1/2 bg-red-400'></div>
      {/* Main */}
      <div
        ref={scrollRef}
        className='absolute inset-0 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scrollbar-none'
      >
        <div className='relative flex h-full w-full'>
          <div className='w-full shrink-0 snap-end'>
            <div
              className={twMerge(
                'absolute flex w-full bg-white',
                props.isInvalid && 'bg-red-50',
              )}
            >
              {props.children}
            </div>
          </div>
          <div className='w-4 shrink-0 bg-white'></div>
          <div
            className={twMerge(
              'flex w-1/5 shrink-0 cursor-pointer snap-end items-center justify-center bg-red-400 hover:bg-red-300 active:bg-red-300',
              props.isDisabled && 'bg-gray-400',
            )}
            onClick={handleDelete}
          >
            <p className='indent-[0.05em] tracking-wider text-white'>刪除</p>
          </div>
        </div>
      </div>
      {/* Portal */}
      <div
        id={props.portalId}
        className='absolute inset-0 w-0'
        ref={portalRef}
      ></div>
    </motion.div>
  )
}
