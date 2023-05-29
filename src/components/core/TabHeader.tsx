import { Tab } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

export default function TabHeader<TTabNames extends readonly string[]>(props: {
  tabNames: TTabNames
  onChange?: (tabName: TTabNames[number]) => void
  className?: string
  clear?: boolean
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (props.clear) {
      setSelectedIndex(props.tabNames.length)
    } else if (selectedIndex === props.tabNames.length) {
      setSelectedIndex(0)
    }
  }, [props.clear])

  return (
    <Tab.Group
      selectedIndex={selectedIndex}
      onChange={(index) => {
        setSelectedIndex(index)
        if (index < props.tabNames.length)
          props.onChange?.(props.tabNames[index])
      }}
    >
      <Tab.List
        className={twMerge(
          'overflow-hidden rounded-2xl border border-stone-300',
          props.className,
        )}
      >
        {props.tabNames.map((tabName, index) => (
          <Tab as={Fragment} key={`tab-${index}`}>
            {({ selected }) => (
              <button
                className={twMerge(
                  'px-4 py-2 hover:bg-stone-100 active:scale-95',
                  selected &&
                    'pointer-events-none bg-yellow-100 font-bold hover:bg-yellow-100',
                )}
              >
                {tabName}
              </button>
            )}
          </Tab>
        ))}
        <Tab key={`tab-${props.tabNames.length}`}></Tab>
      </Tab.List>
    </Tab.Group>
  )
}
