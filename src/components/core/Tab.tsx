import { motion } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import { useRouter } from 'next/router'

import { twData } from '@/lib/common'

export default function Tab<T extends readonly string[]>(props: {
  tabNames: T
  tabLinks?: string[]
  currentTabName: T[number] | null
  onClick?: (tabName: T[number]) => void
  disableLoading?: boolean
}) {
  const router = props.tabLinks ? useRouter() : null

  return (
    <ul className='absolute z-10 flex w-full gap-4 overflow-x-auto bg-white/80 p-4 py-2 shadow backdrop-blur lg:static lg:w-max lg:flex-col lg:bg-transparent lg:p-8 lg:pr-0 lg:shadow-none lg:backdrop-blur-none'>
      {props.tabNames.map((tabName, index) => (
        <li
          key={`tab-${index}`}
          className={twMerge(
            'relative w-fit shrink-0 cursor-pointer rounded-2xl px-2 py-1 text-stone-500 data-selected:pointer-events-none data-selected:text-yellow-900 data-not-selected:hover:bg-stone-600/10 data-not-selected:active:scale-95 data-not-selected:active:bg-stone-600/10 lg:data-not-selected:hover:bg-stone-100 lg:data-not-selected:active:bg-stone-100',
            !props.disableLoading && 'group-data-loading:skeleton',
          )}
          onClick={() => {
            if (props.tabLinks) {
              router!.push(props.tabLinks[index])
            } else {
              props.onClick?.(tabName)
            }
          }}
          {...twData({
            selected: props.currentTabName === tabName,
          })}
        >
          {props.currentTabName === tabName && (
            <motion.div
              className='absolute inset-0 -z-10 rounded-2xl bg-yellow-500'
              transition={{ type: 'spring', duration: 0.4 }}
              layoutId={props.tabNames.join('-')}
            ></motion.div>
          )}
          <p className='whitespace-nowrap text-justify indent-[0.1em] text-sm font-bold tracking-widest sm:text-base'>
            {tabName}
          </p>
        </li>
      ))}
    </ul>
  )
}
