import { Tab } from '@headlessui/react'
import { Fragment } from 'react'
import { twMerge } from 'tailwind-merge'

export default function TabHeader<TTabNames extends readonly string[]>(props: {
  tabNames: TTabNames
  onChange?: (tabName: TTabNames[number]) => void
  className?: string
}) {
  return (
    <Tab.Group
      onChange={(index) => {
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
      </Tab.List>
    </Tab.Group>
  )
}
