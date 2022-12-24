import React, { useEffect, useRef, useState } from 'react'
import { useFloating, offset, flip, shift, arrow } from '@floating-ui/react-dom'
import { twMerge } from 'tailwind-merge'

export default function Tooltip(props: {
  className?: string
  children: JSX.Element
  content: string | JSX.Element
  disabled?: boolean
}) {
  const arrowRef = useRef<HTMLDivElement | null>(null)
  const hoverRef = useRef<HTMLElement | null>(null)
  const [isHover, setIsHover] = useState(false)
  const { x, y, reference, floating, strategy, middlewareData, placement } =
    useFloating({
      placement: 'top',
      middleware: [
        offset(16),
        flip({ padding: 16 }),
        shift({ padding: 16 }),
        arrow({ element: arrowRef }),
      ],
    })

  useEffect(() => {
    if (!hoverRef.current) return
    const handlePointerEnter = () => setIsHover(true)
    const handlePointerLeave = () => setIsHover(false)
    hoverRef.current.addEventListener('pointerenter', handlePointerEnter)
    hoverRef.current.addEventListener('pointerleave', handlePointerLeave)
    hoverRef.current.addEventListener('pointercancel', handlePointerLeave)
    return () => {
      hoverRef.current?.removeEventListener('pointerenter', handlePointerEnter)
      hoverRef.current?.removeEventListener('pointerleave', handlePointerLeave)
      hoverRef.current?.removeEventListener('pointercancel', handlePointerLeave)
    }
  }, [hoverRef])

  if (props.disabled) return props.children

  return (
    <>
      {React.cloneElement(props.children, {
        ref: (ref: HTMLElement) => {
          reference(ref), (hoverRef.current = ref)
        },
        className: twMerge(
          props.children.props.className as string | undefined,
          'select-none',
        ),
      })}
      {isHover && (
        <div
          className={twMerge(
            'pointer-events-none z-10 rounded-2xl border border-stone-200 bg-white p-4 drop-shadow-lg',
            props.className,
          )}
          ref={floating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            width: 'max-content',
          }}
        >
          {props.content}
          <div
            ref={arrowRef}
            style={{
              transform: 'scaleX(0.6) rotate(45deg)',
              left: middlewareData.arrow?.x ?? 0,
              [placement === 'top' ? 'bottom' : 'top']:
                (middlewareData.arrow?.y ?? 0) - 8,
            }}
            className='absolute h-4 w-4 bg-white'
          />
        </div>
      )}
    </>
  )
}
