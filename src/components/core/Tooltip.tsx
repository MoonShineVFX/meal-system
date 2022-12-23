import React, { useState } from 'react'
import { usePopper } from 'react-popper'
import { twMerge } from 'tailwind-merge'

export default function Tooltip(props: {
  className?: string
  children: JSX.Element
  content: string | JSX.Element
  disabled?: boolean
}) {
  const [referenceElement, setReferenceElement] = useState(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  )
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top',
    modifiers: [
      { name: 'offset', options: { offset: [0, 16] } },
      { name: 'preventOverflow', options: { padding: 16 } },
    ],
  })

  if (props.disabled) return props.children

  return (
    <>
      {React.cloneElement(props.children, {
        ref: setReferenceElement,
        className: twMerge(
          props.children.props.className as string | undefined,
          'peer select-none',
        ),
      })}
      <div
        className={twMerge(
          'pointer-events-none rounded-2xl border border-stone-200 bg-white p-4 opacity-0 shadow-lg transition-opacity duration-200 peer-hover:opacity-100 peer-active:opacity-100',
          props.className,
        )}
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        {props.content}
      </div>
    </>
  )
}
