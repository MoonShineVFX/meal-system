import { twMerge } from 'tailwind-merge'
import { useEffect, Dispatch, SetStateAction } from 'react'

const layout = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['clear:↺', '0', 'backspace:⌫'],
  ['cancel:取消', 'ok:{accept}'],
]

export default function VirtualNumpad(props: {
  setValue: Dispatch<SetStateAction<number>>
  onAccept: () => void
  onCancel: () => void
  acceptText?: string
  maxValue?: number
  disabledAccept?: boolean
}) {
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [props.disabledAccept])

  /* Callback */
  const clearValue = () => {
    props.setValue(0)
  }

  const removeValue = () => {
    props.setValue((value) => Math.floor(value / 10))
  }

  const addValue = (addString: string) => {
    props.setValue((value) =>
      Math.min(value * 10 + parseInt(addString), props.maxValue || Infinity),
    )
  }

  // Keyboard click
  const handleKeyDown = (event: KeyboardEvent) => {
    event.preventDefault()
    switch (event.key) {
      case 'Backspace':
        removeValue()
        break
      case 'Enter':
        if (!props.disabledAccept) props.onAccept()
        break
      case 'Escape':
        props.onCancel()
        break
      case ' ':
        clearValue()
        break
      default:
        if (event.key >= '0' && event.key <= '9') {
          addValue(event.key)
        }
        break
    }
  }

  // Mouse or touch click
  const handleKeyClicked = (key: string, isSpecial: boolean) => {
    if (isSpecial) {
      switch (key) {
        case 'clear':
          clearValue()
          break
        case 'backspace':
          removeValue()
          break
        case 'cancel':
          props.onCancel()
          break
        case 'ok':
          props.onAccept()
          break
        default:
          break
      }
    } else {
      addValue(key)
    }
  }

  return (
    <div
      className='flex flex-col gap-2 bg-stone-300 p-4'
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      {layout.map((row, i) => (
        <div key={`row-${i}`} className='flex justify-between gap-2'>
          {row.map((key) => (
            <VirtualKey
              key={key}
              keyString={
                // Replace {accept} with props.acceptText
                key === 'ok:{accept}'
                  ? key.replace('{accept}', props.acceptText ?? '付款')
                  : key
              }
              onClick={handleKeyClicked}
              disabled={props.disabledAccept && key === 'ok:{accept}'}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function VirtualKey(props: {
  keyString: string
  onClick?: (key: string, isSpecial: boolean) => void
  disabled?: boolean
}) {
  const [key, label] = props.keyString.split(':')
  const isSpecial = label !== undefined
  const labelString = label ?? key

  return (
    <button
      onClick={() => {
        if (!props.disabled) props.onClick?.(key, isSpecial)
      }}
      data-ui={props.disabled ? 'not-active' : 'active'}
      className={twMerge(
        'grow basis-0 rounded-md bg-stone-100 py-1 indent-[0.5ch] text-2xl tracking-[0.5ch] shadow data-active:hover:bg-stone-200 data-active:active:bg-stone-200 data-not-active:cursor-not-allowed data-not-active:opacity-10',
        // Lower font color for special keys
        isSpecial &&
          'bg-stone-200 text-stone-500 data-active:hover:bg-stone-300 data-active:active:bg-stone-300',
        // Bottom key style
        (key === 'cancel' || key === 'ok') && 'mt-2 rounded-xl py-3 text-lg',
        key === 'ok' &&
          'ml-2 bg-stone-800 text-stone-100 data-active:hover:bg-amber-900 data-active:active:bg-amber-900',
      )}
    >
      {labelString}
    </button>
  )
}
