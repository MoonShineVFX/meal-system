import { twMerge } from 'tailwind-merge'
import { useState, useEffect } from 'react'

const layout = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['clear:清除', '0', 'backspace:←'],
  ['cancel:取消', 'ok:付款'],
]

export default function VirtualNumpad(props: {
  onChange: (value: number) => void
  onAccept: () => void
  onCancel: () => void
  maxValue?: number
}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    props.onChange(value)
  }, [value])

  const handleKeyPressed = (key: string, isSpecial: boolean) => {
    if (isSpecial) {
      switch (key) {
        case 'clear':
          setValue(0)
          break
        case 'backspace':
          setValue((value) => Math.floor(value / 10))
          break
        case 'cancel':
          props.onCancel()
          break
        case 'ok':
          props.onAccept()
          break
      }
    } else {
      setValue((value) =>
        Math.min(value * 10 + parseInt(key), props.maxValue || Infinity),
      )
    }
  }

  return (
    <div
      className='flex flex-col gap-2 rounded-t-xl bg-amber-400 p-4'
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      {layout.map((row, i) => (
        <div key={`row-${i}`} className='flex justify-between gap-2'>
          {row.map((key) => (
            <VirtualKey key={key} keyString={key} onClick={handleKeyPressed} />
          ))}
        </div>
      ))}
    </div>
  )
}

function VirtualKey(props: {
  keyString: string
  onClick?: (key: string, isSpecial: boolean) => void
}) {
  const [key, label] = props.keyString.split(':')
  const isSpecial = label !== undefined
  const labelString = label || key

  return (
    <button
      onClick={() => props.onClick?.(key, isSpecial)}
      className={twMerge(
        'grow basis-0 rounded-md bg-stone-100 py-2 indent-[0.5ch] text-3xl tracking-[0.5ch] shadow-md hover:bg-stone-200 active:bg-stone-200',
        labelString.length > 1 && 'text-xl',
        isSpecial && 'text-stone-500',
        (key === 'cancel' || key === 'ok') && 'mt-4 rounded-xl py-4',
        key === 'ok' &&
          'ml-4 bg-stone-800 text-stone-100 hover:bg-amber-900 active:bg-amber-900',
        key === 'cancel' &&
          'bg-stone-200 hover:bg-stone-300 active:bg-stone-300',
      )}
    >
      {labelString}
    </button>
  )
}
