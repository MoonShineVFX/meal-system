import Link from 'next/link'
import { useRouter } from 'next/router'

import { HomeIcon as HomeIconSolid } from '@heroicons/react/24/solid'
import { CalendarDaysIcon as CalendarDaysIconSolid } from '@heroicons/react/24/solid'
import { DocumentTextIcon as DocumentTextIconSolid } from '@heroicons/react/24/solid'
import { WalletIcon as WalletIconSolid } from '@heroicons/react/24/solid'
import { UserIcon as UserIconSolid } from '@heroicons/react/24/solid'
import { HomeIcon } from '@heroicons/react/24/outline'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { WalletIcon } from '@heroicons/react/24/outline'
import { UserIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

import { useStore } from '@/lib/client/store'

export default function Menu() {
  const router = useRouter()

  if (router.pathname === '/login') return null

  return (
    <nav className='fixed bottom-0 z-40 flex h-16 w-full justify-center bg-gray-100 drop-shadow-2xl sm:static sm:items-center sm:justify-between sm:px-8 sm:drop-shadow-none'>
      {/* Logo */}
      <h1 className='hidden flex-shrink-0 text-xl font-bold sm:block'>
        夢想支付
      </h1>
      {/* Main links */}
      <div className='flex h-full w-full items-center justify-evenly py-1 md:justify-center md:gap-8'>
        <MenuButton path='/' label='點餐' icons={[HomeIcon, HomeIconSolid]} />
        <MenuButton
          label='預訂'
          path='/reserve'
          icons={[CalendarDaysIcon, CalendarDaysIconSolid]}
        />
        <MenuButton
          label='訂單'
          path='/orders'
          icons={[DocumentTextIcon, DocumentTextIconSolid]}
        />
        <MenuButton
          label='錢包'
          path='/wallet'
          icons={[WalletIcon, WalletIconSolid]}
        />
        <ProfileButton className='sm:hidden' />
      </div>
      {/* Profile */}
      <ProfileButton className='hidden shrink-0 sm:block' />
    </nav>
  )
}

function ProfileButton(props: { className?: string }) {
  const user = useStore((state) => state.user)

  return (
    <button className={`${props.className}`} title='logout'>
      <MenuIcon
        className='sm:hidden'
        isSelected={true}
        icons={[UserIcon, UserIconSolid]}
      />
      <div className='hidden items-center gap-1 rounded-md p-2 text-gray-500 hover:bg-gray-200 active:bg-gray-200 sm:flex'>
        <span className='hidden pl-1 text-sm tracking-widest sm:block'>
          {user?.name}
        </span>
        <ChevronDownIcon className='h-5 w-5 stroke-[1px]' />
      </div>
    </button>
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
    : router.pathname === props.path

  const NormalIcon = props.icons[0]

  return (
    <Link
      data-ui={isSelected ? 'selected' : 'not-selected'}
      className='group inline-flex h-full items-center justify-center data-selected:cursor-default'
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
      <div className='hidden h-full sm:inline-flex sm:flex-col'>
        <div className='flex h-full min-w-[5em] items-center justify-center rounded-md text-center tracking-widest text-gray-500 group-data-selected:text-teal-500 group-data-not-selected:hover:bg-gray-200 group-data-not-selected:hover:text-gray-600 group-data-not-selected:active:bg-gray-200'>
          <NormalIcon className='h-5 w-5 stroke-[1px]' />
          <span className='ml-2'>{props.label}</span>
        </div>
        <div className='-mb-[3px] h-[3px] w-full bg-teal-500 group-data-not-selected:hidden'></div>
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
      data-ui={props.isSelected ? 'selected' : 'not-selected'}
      className={`group flex items-center rounded-full p-3 hover:bg-gray-200 active:bg-gray-200 ${props.className}`}
    >
      <Icon className='h-6 w-6 stroke-1 text-gray-600 group-data-selected:text-teal-500' />
    </div>
  )
}
