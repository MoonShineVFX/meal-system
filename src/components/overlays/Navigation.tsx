import Link from 'next/link'
import { memo } from 'react'
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
import { ShoppingCartIcon as ShoppingCartIconSolid } from '@heroicons/react/24/solid'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'

import Image from '@/components/core/Image'
import { useStore } from '@/lib/client/store'
import { generateCookie } from '@/lib/common'
import { settings, twData } from '@/lib/common'
import Logo from '@/components/core/Logo'
import { twMerge } from 'tailwind-merge'
import trpc from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'

function Navigation() {
  return (
    <ul className='relative z-40 flex h-full items-center justify-evenly bg-white shadow shadow-stone-300 sm:flex-col sm:items-start sm:justify-start sm:gap-6 sm:bg-stone-100 sm:p-4 sm:shadow-none lg:p-8'>
      {/* LOGO */}
      <li className='-order-2 hidden pl-2 sm:block'>
        <Logo className='h-8 w-auto text-yellow-500' />
      </li>
      <NavButton path='/' label='點餐' icons={[HomeIcon, HomeIconSolid]} />
      <NavButton
        label='預訂 / 下午茶'
        path='/reserve'
        icons={[CalendarDaysIcon, CalendarDaysIconSolid]}
      />
      <NavButton
        label='購物車'
        path='/cart'
        icons={[ShoppingCartIcon, ShoppingCartIconSolid]}
      />
      <NavButton
        label='訂單紀錄'
        path='/orders'
        icons={[DocumentTextIcon, DocumentTextIconSolid]}
      />
      <NavButton
        className='hidden sm:block'
        label='錢包'
        path='/transaction'
        icons={[WalletIcon, WalletIconSolid]}
      />
      <ProfileButton className='sm:-order-1' />
    </ul>
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
    <Popover className={`${props.className} relative z-40 sm:w-full`} as='ul'>
      <Popover.Button className='flex w-full items-center focus:outline-none sm:rounded-2xl sm:p-2 sm:hover:bg-stone-200 sm:active:bg-stone-200 sm:ui-open:bg-stone-200'>
        {/* Profile Image */}
        <div className='grid h-12 w-12 place-content-center sm:h-auto sm:w-auto'>
          <div className='relative h-8 w-8 overflow-hidden rounded-full border border-stone-300 ring-0 ring-yellow-500 hover:ring-2 active:ring-2 ui-open:ring-2 sm:h-12 sm:w-12 sm:hover:ring-0 sm:active:ring-0 sm:ui-open:ring-0'>
            <Image
              alt='profile'
              src={
                user.profileImage
                  ? user.profileImage.path
                  : settings.RESOURCE_PROFILE_PLACEHOLDER
              }
              sizes='64px'
            />
          </div>
        </div>
        {/* User Info */}
        <div className='hidden grow items-center pl-2 sm:flex'>
          <div className='flex grow flex-col text-left'>
            <span className='indent-[0.1em] tracking-widest'>{user?.name}</span>
            <span className='text-sm text-stone-400'>@{user?.id}</span>
          </div>
          <ChevronDownIcon className='h-6 w-6 text-stone-400 transition-transform ui-open:rotate-180' />
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
        <Popover.Panel className='absolute bottom-12 -right-2 z-10 min-w-[8em] rounded-2xl border-[0.0625rem] border-stone-200 bg-white py-3 px-2 indent-[0.05em] tracking-wider drop-shadow-md sm:left-0 sm:bottom-auto sm:top-1 sm:right-0'>
          <Link
            href='/transaction'
            className='block w-full cursor-pointer rounded-xl border-b border-stone-100 py-2 px-4 hover:bg-stone-100 active:bg-stone-100 sm:hidden'
          >
            錢包
          </Link>
          <div
            className='w-full cursor-pointer rounded-xl py-2 px-4 text-red-500 hover:bg-stone-100 active:bg-stone-100'
            onClick={handleLogout}
          >
            登出
          </div>
          {/* Arrow */}
          <div className='absolute right-[0.875rem] bottom-0 h-4 w-10 translate-y-full overflow-hidden sm:hidden'>
            <div className='h-6 w-6 origin-top-right translate-x-4 -translate-y-1 rotate-45 border border-stone-200 bg-white'></div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
export default memo(Navigation)

function NavButton(props: {
  label: string
  icons: [
    React.FC<React.ComponentProps<'svg'>>,
    React.FC<React.ComponentProps<'svg'>>,
  ]
  path: string
  className?: string
}) {
  const router = useRouter()

  const isShallow = props.path.includes('?')
  const isSelected = isShallow
    ? router.query.logout === ''
    : router.pathname.split('/')[1] === props.path.replace('/', '')

  const NormalIcon = props.icons[0]

  const isCart = props.path === '/cart'

  return (
    <ul className={twMerge('sm:w-full', props.className)}>
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
          cartBadge={isCart}
        />
        {/* Desktop label */}
        <div className='hidden grow items-center rounded-2xl py-2 px-3 indent-[0.1em] font-bold tracking-widest text-stone-500 group-data-selected:bg-stone-600 group-data-selected:text-white group-data-not-selected:hover:bg-stone-200 group-data-not-selected:active:bg-stone-200 sm:flex'>
          <NormalIcon className='h-5 w-5' />
          <span className='ml-4'>{props.label}</span>
          {isCart && (
            <div className='ml-2'>
              <CartBadge />
            </div>
          )}
        </div>
      </Link>
    </ul>
  )
}

function NavIcon(props: {
  className?: string
  isSelected: boolean
  icons: [
    React.FC<React.ComponentProps<'svg'>>,
    React.FC<React.ComponentProps<'svg'>>,
  ]
  cartBadge?: boolean
}) {
  const Icon = props.isSelected ? props.icons[1] : props.icons[0]
  return (
    <div
      data-ui={twData({ selected: props.isSelected })}
      className={`group flex items-center rounded-full p-3 hover:bg-stone-200 active:bg-stone-200 ${props.className} relative`}
    >
      <div className='absolute top-1 right-1'>
        {props.cartBadge && <CartBadge />}
      </div>
      <Icon className='h-6 w-6 stroke-1 group-data-selected:text-yellow-500' />
    </div>
  )
}

function CartBadge() {
  const { data, isLoading, isError } = trpc.menu.getCart.useQuery()

  if (isLoading)
    return <Spinner className='h-4 w-4 text-stone-500 sm:h-5 sm:w-5' />
  if (isError)
    return (
      <ExclamationCircleIcon className='h-4 w-4 text-red-400 sm:h-5 sm:w-5' />
    )
  if (data.cartItems.length === 0) return null

  return (
    <div className='flex h-4 w-4 justify-center rounded-full bg-yellow-500 -indent-[0.05em] text-xs tracking-tighter text-white group-data-selected:bg-stone-300 group-data-selected:text-stone-500 sm:h-5 sm:w-5 sm:rounded-md sm:text-sm'>
      {data.cartItems.length}
    </div>
  )
}
