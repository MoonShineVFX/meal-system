import Link from 'next/link'
import { useRouter } from 'next/router'
import { Popover, Transition } from '@headlessui/react'

import { HomeIcon as HomeIconSolid } from '@heroicons/react/24/solid'
import { CalendarDaysIcon as CalendarDaysIconSolid } from '@heroicons/react/24/solid'
import { DocumentTextIcon as DocumentTextIconSolid } from '@heroicons/react/24/solid'
import { WalletIcon as WalletIconSolid } from '@heroicons/react/24/solid'
import { HomeIcon } from '@heroicons/react/24/outline'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { WalletIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

import { useStore } from '@/lib/client/store'
import { generateCookie } from '@/lib/common'
import { settings, twData } from '@/lib/common'
import Logo from '@/components/Logo'

export default function Menu() {
  const router = useRouter()

  if (router.pathname === '/login') return null

  return (
    <nav className='fixed bottom-0 z-40 flex h-16 w-full justify-center bg-gray-100 sm:inset-y-0 sm:bottom-auto sm:h-full sm:w-64 sm:flex-col sm:justify-start sm:gap-8 sm:border-r sm:border-gray-300 sm:bg-gray-200 sm:px-8 sm:py-8'>
      {/* Logo */}
      <div className='hidden pl-2 sm:block'>
        <Logo className='h-8 w-auto text-violet-400' />
      </div>
      {/* Main links */}
      <div className='flex h-full w-full items-center justify-evenly py-1 sm:flex-col sm:items-start sm:justify-start sm:gap-6'>
        <MenuButton path='/' label='點餐' icons={[HomeIcon, HomeIconSolid]} />
        <MenuButton
          label='預訂 / 下午茶'
          path='/reserve'
          icons={[CalendarDaysIcon, CalendarDaysIconSolid]}
        />
        <MenuButton
          label='訂單紀錄'
          path='/orders'
          icons={[DocumentTextIcon, DocumentTextIconSolid]}
        />
        <MenuButton
          label='錢包'
          path='/transaction'
          icons={[WalletIcon, WalletIconSolid]}
        />
        <ProfileButton className='sm:order-first' />
      </div>
    </nav>
  )
}

function ProfileButton(props: { className?: string }) {
  const user = useStore((state) => state.user)

  const handleLogout = () => {
    const cookie = generateCookie(undefined)
    document.cookie = cookie
    window.location.href = '/login'
  }

  return (
    <Popover className={`${props.className} relative sm:w-full`}>
      {({ open }) => (
        <>
          <Popover.Button className='flex w-full items-center focus:outline-none sm:rounded-md sm:p-2 sm:hover:bg-gray-300 sm:active:bg-gray-300 sm:ui-open:bg-gray-300'>
            <div className='h-8 w-8 overflow-hidden rounded-full border border-gray-300 outline outline-0 outline-violet-500 hover:outline-2 active:outline-2 ui-open:outline-2 sm:h-12 sm:w-12 sm:outline-none'>
              <img src='/resource/profile-dummy.png' />
            </div>
            <div className='hidden grow items-center gap-1 rounded-md pl-2 text-gray-500 sm:flex'>
              <div className='flex grow flex-col text-left'>
                <span className='tracking-widest'>{user?.name}</span>
                <span className='text-sm text-gray-400'>@{user?.id}</span>
              </div>
              <ChevronDownIcon className='h-6 w-6 text-gray-400 transition-transform ui-open:rotate-180 ui-open:text-gray-500' />
            </div>
          </Popover.Button>
          <Transition
            enter='transition duration-100 ease-out'
            enterFrom='transform scale-y-50 opacity-0'
            enterTo='transform scale-y-100 opacity-100'
            leave='transition duration-75 ease-out'
            leaveFrom='transform scale-y-100 opacity-100'
            leaveTo='transform scale-y-50 opacity-0'
          >
            <Popover.Panel className='absolute bottom-12 -right-2 z-10 min-w-[7em] rounded-md border-[1px] border-gray-300 bg-gray-100 py-2 tracking-wider text-gray-500 shadow-md sm:left-0 sm:bottom-auto sm:top-1 sm:right-0 sm:text-sm'>
              <div className='w-full cursor-pointer py-2 px-4 hover:bg-gray-200 active:bg-gray-200'>
                <a href={settings.REPORT_URL} target='_blank'>
                  回報問題
                </a>
              </div>
              <div
                className='w-full cursor-pointer py-2 px-4 text-red-400 hover:bg-gray-200 active:bg-gray-200'
                onClick={handleLogout}
              >
                登出
              </div>
              <div className='absolute right-2 bottom-0 h-4 w-10 translate-y-full overflow-hidden sm:hidden'>
                <div className='h-6 w-6 origin-top-right translate-x-4 -translate-y-1 rotate-45 border border-gray-300 bg-gray-100'></div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}

function MenuButton(props: {
  label: string
  icons: [
    React.FC<React.ComponentProps<'svg'>>,
    React.FC<React.ComponentProps<'svg'>>,
  ]
  path: string
}) {
  const router = useRouter()

  const isShallow = props.path.includes('?')
  const isSelected = isShallow
    ? router.query.logout === ''
    : router.pathname.split('/')[1] === props.path.replace('/', '')

  const NormalIcon = props.icons[0]

  return (
    <Link
      data-ui={twData({ selected: isSelected })}
      className='group inline-flex items-center justify-center data-selected:cursor-default sm:w-full sm:justify-start'
      href={{
        pathname: isShallow ? router.pathname : props.path,
        query: isShallow
          ? { ...router.query, [props.path.replace('?', '')]: null }
          : undefined,
      }}
      shallow={props.path.includes('?')}
    >
      {/* Mobile icon */}
      <MenuIcon
        className='sm:hidden'
        isSelected={isSelected}
        icons={props.icons}
      />
      {/* Desktop label */}
      <div className='hidden grow items-center rounded-md py-2 px-2 font-bold tracking-widest text-gray-500 group-data-selected:bg-gray-300 group-data-selected:text-gray-600 group-data-not-selected:hover:bg-gray-300/50 group-data-not-selected:hover:text-gray-600 group-data-not-selected:active:bg-gray-300 sm:flex'>
        <NormalIcon className='h-5 w-5' />
        <span className='ml-4'>{props.label}</span>
      </div>
    </Link>
  )
}

function MenuIcon(props: {
  className?: string
  isSelected: boolean
  icons: [
    React.FC<React.ComponentProps<'svg'>>,
    React.FC<React.ComponentProps<'svg'>>,
  ]
}) {
  const Icon = props.isSelected ? props.icons[1] : props.icons[0]
  return (
    <div
      data-ui={twData({ selected: props.isSelected })}
      className={`group flex items-center rounded-full p-3 hover:bg-gray-200 active:bg-gray-200 ${props.className}`}
    >
      <Icon className='h-6 w-6 stroke-1 text-gray-600 group-data-selected:text-violet-500' />
    </div>
  )
}
