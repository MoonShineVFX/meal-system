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

import Image from '@/components/core/Image'
import { useStore } from '@/lib/client/store'
import { generateCookie } from '@/lib/common'
import { settings, twData } from '@/lib/common'
import Logo from '@/components/core/Logo'

export default function Navigation() {
  return (
    <div className='flex h-full items-center justify-evenly bg-gray-100 shadow sm:flex-col sm:items-start sm:justify-start sm:gap-6 sm:bg-gray-200 sm:px-8 sm:py-8 sm:shadow-none'>
      {/* LOGO */}
      <div className='-order-2 hidden pl-2 sm:block'>
        <Logo className='h-8 w-auto text-violet-400' />
      </div>
      {/*  */}
      <NavButton path='/' label='點餐' icons={[HomeIcon, HomeIconSolid]} />
      <NavButton
        label='預訂 / 下午茶'
        path='/reserve'
        icons={[CalendarDaysIcon, CalendarDaysIconSolid]}
      />
      <NavButton
        label='訂單紀錄'
        path='/orders'
        icons={[DocumentTextIcon, DocumentTextIconSolid]}
      />
      <NavButton
        label='錢包'
        path='/transaction'
        icons={[WalletIcon, WalletIconSolid]}
      />
      <ProfileButton className='sm:-order-1' />
      {/* </div> */}
    </div>
  )
}

function ProfileButton(props: { className?: string }) {
  const user = useStore((state) => state.user)

  const handleLogout = () => {
    const cookie = generateCookie(undefined)
    document.cookie = cookie
    window.location.href = '/login'
  }

  if (!user) return null

  return (
    <Popover className={`${props.className} relative z-40 sm:w-full`}>
      <Popover.Button className='flex w-full items-center focus:outline-none sm:rounded-2xl sm:p-2 sm:hover:bg-gray-300 sm:active:bg-gray-300 sm:ui-open:bg-gray-300'>
        <div className='grid h-12 w-12 place-content-center sm:h-auto sm:w-auto'>
          <div className='relative h-8 w-8 overflow-hidden rounded-full border border-gray-300 ring-0 ring-violet-500 hover:ring-2 active:ring-2 ui-open:ring-2 sm:h-12 sm:w-12 sm:hover:ring-0 sm:active:ring-0 sm:ui-open:ring-0'>
            <Image
              alt='profile'
              src={settings.RESOURCE_PROFILE_PLACEHOLDER}
              sizes='32px'
            />
          </div>
        </div>
        <div className='hidden grow items-center pl-2 sm:flex'>
          <div className='flex grow flex-col text-left'>
            <span className='tracking-widest'>{user?.name}</span>
            <span className='text-sm text-gray-400'>@{user?.id}</span>
          </div>
          <ChevronDownIcon className='h-6 w-6 text-gray-400 transition-transform ui-open:rotate-180' />
        </div>
      </Popover.Button>
      <Transition
        enter='transition duration-100 ease-out'
        enterFrom='transform scale-50 opacity-0'
        enterTo='transform scale-100 opacity-100'
        leave='transition duration-75 ease-out'
        leaveFrom='transform scale-100 opacity-100'
        leaveTo='transform scale-50 opacity-0'
      >
        <Popover.Panel className='absolute bottom-12 -right-2 z-10 min-w-[7em] rounded-2xl border-[1px] border-gray-300 bg-gray-100 py-3 tracking-wider text-gray-500 drop-shadow-md sm:left-0 sm:bottom-auto sm:top-1 sm:right-0'>
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
          {/* Arrow */}
          <div className='absolute right-[14px] bottom-0 h-4 w-10 translate-y-full overflow-hidden sm:hidden'>
            <div className='h-6 w-6 origin-top-right translate-x-4 -translate-y-1 rotate-45 border border-gray-300 bg-gray-100'></div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}

function NavButton(props: {
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
      className='group inline-flex items-center justify-center sm:w-full sm:justify-start'
      href={{
        pathname: isShallow ? router.pathname : props.path,
        query: isShallow
          ? { ...router.query, [props.path.replace('?', '')]: null }
          : undefined,
      }}
      shallow={props.path.includes('?')}
    >
      {/* Mobile icon */}
      <NavIcon
        className='sm:hidden'
        isSelected={isSelected}
        icons={props.icons}
      />
      {/* Desktop label */}
      <div className='hidden grow items-center rounded-2xl py-2 px-3 font-bold tracking-widest text-gray-500 group-data-selected:bg-gray-300 group-data-selected:text-gray-600 group-data-not-selected:hover:bg-gray-300/50 group-data-not-selected:hover:text-gray-600 group-data-not-selected:active:bg-gray-300 sm:flex'>
        <NormalIcon className='h-5 w-5' />
        <span className='ml-4'>{props.label}</span>
      </div>
    </Link>
  )
}

function NavIcon(props: {
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
