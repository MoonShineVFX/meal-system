import { Popover, Transition } from '@headlessui/react'
import {
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  HomeIcon,
  PhoneIcon,
  ShoppingCartIcon,
  SquaresPlusIcon,
  WalletIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import {
  CalendarDaysIcon as CalendarDaysIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  HomeIcon as HomeIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  SquaresPlusIcon as SquaresPlusIconSolid,
  WalletIcon as WalletIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
} from '@heroicons/react/24/solid'
import { motion, useAnimationControls } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  memo,
  MouseEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react'

import Error from '@/components/core/Error'
import Image from '@/components/core/Image'
import Logo from '@/components/core/Logo'
import PriceNumber from '@/components/core/PriceNumber'
import Spinner from '@/components/core/Spinner'
import trpc from '@/lib/client/trpc'
import { generateCookie, settings, twData } from '@/lib/common'
import { twMerge } from 'tailwind-merge'
import { DropdownMenu, DropdownMenuItem } from '../core/DropdownMenu'

function useLogout() {
  const logoutMutation = trpc.user.logout.useMutation()
  const utils = trpc.useUtils()
  const router = useRouter()

  const logout = useCallback(() => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        const cookie = generateCookie(undefined)
        document.cookie = cookie

        await utils.invalidate()
        router.push('/login')
      },
    })
  }, [logoutMutation, router, utils])

  return { logout }
}

function Navigation() {
  const { data } = trpc.user.get.useQuery(undefined)
  const { logout } = useLogout()

  return (
    <div className='relative z-40 flex h-full items-center justify-evenly bg-white pb-[env(safe-area-inset-bottom)] shadow shadow-stone-300 sm:flex-col sm:items-start sm:justify-start sm:gap-6 sm:bg-stone-100 sm:p-4 sm:shadow-none lg:p-8'>
      {/* LOGO */}
      <div className='-order-2 hidden pl-2 sm:block'>
        <Logo className='h-8 w-auto text-yellow-500' />
      </div>
      <NavButton
        label='即時點餐'
        path='/live'
        icons={[HomeIcon, HomeIconSolid]}
        rememberQuery={true}
      />
      <NavButton
        label='預訂'
        path='/reserve'
        icons={[CalendarDaysIcon, CalendarDaysIconSolid]}
        numberBadge={<ReservationNumberBadge />}
        rememberQuery={true}
      />
      <NavButton
        label='購物車'
        path='/cart'
        icons={[ShoppingCartIcon, ShoppingCartIconSolid]}
        numberBadge={<CartNumberBadge />}
      />
      <NavButton
        label='訂單'
        path='/order'
        icons={[DocumentTextIcon, DocumentTextIconSolid]}
        numberBadge={<OrderNumberBadge />}
        rememberQuery={true}
      />
      <NavButton
        className='hidden sm:block'
        label='交易紀錄'
        path='/transaction'
        icons={[WalletIcon, WalletIconSolid]}
        rememberQuery={true}
      />
      <NavButton
        className='hidden sm:block'
        label='設定'
        path='/settings'
        icons={[Cog6ToothIcon, Cog6ToothIconSolid]}
        rememberQuery={true}
      />
      {data && ['ADMIN', 'STAFF'].includes(data.role) && (
        <>
          <div className='hidden h-[2px] w-full rounded bg-stone-300 sm:block'></div>
          <NavButton
            className='hidden sm:block'
            path='/pos'
            label='處理訂單'
            icons={[SquaresPlusIcon, SquaresPlusIconSolid]}
            numberBadge={<POSNumberBadge />}
            rememberQuery={true}
          />
          <NavButton
            className='hidden sm:block'
            label='管理後台'
            path='/admin'
            icons={[WrenchScrewdriverIcon, WrenchScrewdriverIconSolid]}
            rememberQuery={true}
          />
        </>
      )}
      {/* spacer */}
      <div className='mt-auto hidden sm:block' />
      {/* 如果需要使用 sm-block 顯示 */}
      <div className='mt-auto hidden w-full'>
        <DropdownMenu
          className='hidden w-full items-center justify-start gap-0 rounded-2xl py-2 px-3 text-base font-bold tracking-widest text-stone-500 hover:cursor-pointer hover:bg-stone-200 active:scale-95'
          label={
            <>
              <PhoneIcon className='h-5 w-5' />
              <span className='ml-4'>問題回報</span>
            </>
          }
        >
          <DropdownMenuItem
            className='text-sm'
            label={
              <div className='flex items-center gap-2'>
                <ChatBubbleBottomCenterIcon className='h-5 w-5' />
                Zulip 公會頻道
              </div>
            }
            onClick={() => {
              window.open(settings.ZULIP, '_blank')
            }}
          />
          <DropdownMenuItem
            className='text-sm'
            label={
              <div className='flex items-center gap-2'>
                <EnvelopeIcon className='h-5 w-5' />
                {settings.EMAIL}
              </div>
            }
            onClick={() => {
              window.open(`mailto:${settings.EMAIL}`, '_blank')
            }}
          />
        </DropdownMenu>
      </div>
      {/* 登出 */}
      <div
        className='hidden w-full cursor-pointer items-center rounded-2xl py-2 px-3 font-bold tracking-widest text-stone-500 hover:bg-stone-200 active:scale-95 sm:flex'
        onClick={logout}
      >
        <ArrowRightOnRectangleIcon className='h-5 w-5' />
        <span className='ml-4'>登出</span>
      </div>
      <ProfileButton className='sm:-order-1' />
    </div>
  )
}

function ProfileButton(props: { className?: string }) {
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = trpc.user.get.useQuery(undefined)
  const menuQuery = trpc.menu.get.useQuery({
    type: 'LIVE',
  })
  const menuUpdateMutation = trpc.menu.createOrEdit.useMutation()
  const { logout } = useLogout()

  if (isLoading || menuQuery.isLoading) return <Spinner className='h-8 w-8' />
  if (isError || menuQuery.isError)
    return (
      <Error
        description={
          error?.message ?? menuQuery.error?.message ?? 'Unknown Error'
        }
      />
    )

  const isLiveMenuClosed =
    menuQuery.data &&
    menuQuery.data.closedDate !== null &&
    menuQuery.data.closedDate < new Date()

  return (
    <Popover className={`${props.className} relative z-40 sm:w-full`} as='ul'>
      <Popover.Button className='flex w-full items-center focus:outline-none active:scale-90 sm:pointer-events-none sm:rounded-2xl sm:p-2 sm:ui-open:bg-stone-200 sm:hover:bg-stone-200 sm:active:scale-95 sm:active:bg-stone-200'>
        {/* Profile Image */}
        <div className='grid h-12 w-12 place-content-center sm:h-auto sm:w-auto'>
          <div className='relative h-8 w-8 overflow-hidden rounded-full ring-0 ring-yellow-500 ui-open:ring-2 hover:ring-2 active:ring-2 sm:h-12 sm:w-12 sm:ui-open:ring-0 sm:hover:ring-0 sm:active:ring-0'>
            <Image
              alt='profile'
              src={
                user?.profileImage
                  ? user.profileImage.path
                  : settings.RESOURCE_PROFILE_PLACEHOLDER
              }
              sizes='64px'
            />
          </div>
        </div>
        {/* User Info */}
        <div className='hidden grow items-center px-2 sm:flex'>
          <div className='flex grow flex-col text-left'>
            <span className='tracking-widest'>{user?.name}</span>
            <Link href='/deposit' className='pointer-events-auto'>
              <div className='flex gap-2'>
                <span className='flex items-center gap-1'>
                  <CircleStackIcon className='h-3.5 w-3.5 text-yellow-500' />
                  <PriceNumber
                    className='text-sm text-stone-400 '
                    price={user?.pointBalance ?? 0}
                    isCurrency
                  />
                </span>
                <span className='flex items-center gap-1'>
                  <CurrencyDollarIcon className='h-3.5 w-3.5 text-yellow-500' />
                  <PriceNumber
                    className='text-sm text-stone-400 '
                    price={user?.creditBalance ?? 0}
                    isCurrency
                  />
                </span>
              </div>
            </Link>
          </div>
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
        <Popover.Panel className='absolute bottom-12 -right-2 z-10 min-w-[8em] rounded-2xl border border-stone-200 bg-white py-3 px-2 tracking-wider drop-shadow-md sm:left-0 sm:bottom-auto sm:top-1 sm:right-0'>
          {({ close }) => (
            <div onClick={() => close()}>
              {user && ['ADMIN', 'STAFF'].includes(user.role) && (
                <>
                  <Link
                    href='/pos'
                    className='block w-full cursor-pointer border-b border-stone-100 py-2 px-4 hover:bg-stone-100 active:bg-stone-100 sm:hidden'
                  >
                    處理訂單
                  </Link>
                  <div
                    onClick={() =>
                      menuUpdateMutation.mutate({
                        isEdit: true,
                        type: 'LIVE',
                        closedDate: isLiveMenuClosed ? null : new Date(),
                        liveMenuNotify: true,
                      })
                    }
                    className='block w-full cursor-pointer border-b border-stone-100 py-2 px-4 hover:bg-stone-100 active:bg-stone-100 sm:hidden'
                  >
                    {isLiveMenuClosed ? '開啟點餐' : '關閉點餐'}
                  </div>
                </>
              )}
              <Link
                href='/settings'
                className='block w-full cursor-pointer border-b border-stone-100 py-2 px-4 hover:bg-stone-100 active:bg-stone-100 sm:hidden'
              >
                設定
              </Link>
              <Link
                href='/transaction'
                className='block w-full cursor-pointer border-b border-stone-100 py-2 px-4 hover:bg-stone-100 active:bg-stone-100 sm:hidden'
              >
                交易紀錄
              </Link>
              <Link
                href='/deposit'
                className='block w-full cursor-pointer border-b border-stone-100 py-2 px-4 hover:bg-stone-100 active:bg-stone-100 sm:hidden'
              >
                儲值
              </Link>
              <div
                className='w-full cursor-pointer py-2 px-4 text-red-500 hover:bg-stone-100 active:bg-stone-100'
                onClick={logout}
              >
                登出
              </div>
              {/* Arrow */}
              <div className='absolute right-[0.875rem] bottom-0 h-4 w-10 translate-y-full overflow-hidden sm:hidden'>
                <div className='h-6 w-6 origin-top-right translate-x-4 -translate-y-1 rotate-45 border border-stone-200 bg-white'></div>
              </div>
            </div>
          )}
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
export default memo(Navigation)

type HeroIcon = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
    title?: string
    titleId?: string
  } & React.RefAttributes<SVGSVGElement>
>

function NavButton(props: {
  label: string
  icons: [HeroIcon, HeroIcon]
  path: string
  rememberQuery?: boolean
  className?: string
  numberBadge?: JSX.Element
  onClick?: MouseEventHandler<HTMLDivElement>
}) {
  const [pathWithQuery, setPathWithQuery] = useState<string | undefined>(
    undefined,
  )
  const router = useRouter()

  const isSelected =
    router.asPath.split('?')[0].split('/')[1] === props.path.replace('/', '')

  const NormalIcon = props.icons[0]

  useEffect(() => {
    if (isSelected && props.rememberQuery) {
      setPathWithQuery(router.asPath)
    }
  }, [router.asPath])

  return (
    <div
      className={twMerge('sm:w-full', props.className)}
      onClick={props.onClick}
    >
      <Link
        className='group inline-flex items-center justify-center sm:w-full sm:justify-start'
        href={isSelected ? props.path : pathWithQuery ?? props.path}
        {...twData({ selected: isSelected })}
      >
        {/* Mobile icon */}
        <NavIcon
          className='sm:hidden'
          isSelected={isSelected}
          icons={props.icons}
          numberBadge={props.numberBadge}
        />
        {/* Desktop label */}
        <div className='relative hidden grow items-center rounded-2xl py-2 px-3 font-bold tracking-widest text-stone-500 group-data-selected:text-white group-data-not-selected:hover:bg-stone-200 group-data-not-selected:active:scale-95 sm:flex'>
          {isSelected && (
            <motion.div
              layoutId='nav-selected'
              transition={{ type: 'spring', duration: 0.4 }}
              className='absolute inset-0 -z-10 rounded-2xl bg-stone-600'
            ></motion.div>
          )}

          <NormalIcon className='h-5 w-5' />
          <span className='ml-4'>{props.label}</span>
          {props.numberBadge && <div className='ml-2'>{props.numberBadge}</div>}
        </div>
      </Link>
    </div>
  )
}

function NavIcon(props: {
  className?: string
  isSelected: boolean
  icons: [HeroIcon, HeroIcon]
  numberBadge?: JSX.Element
}) {
  const Icon = props.isSelected ? props.icons[1] : props.icons[0]
  return (
    <div
      className={`group flex items-center rounded-full p-3 hover:bg-stone-100 active:bg-stone-100 ${props.className} relative active:scale-90`}
      {...twData({ selected: props.isSelected })}
    >
      {props.numberBadge && (
        <div className='absolute top-1 right-1'>{props.numberBadge}</div>
      )}
      <Icon className='h-6 w-6 stroke-1 group-data-selected:text-yellow-500' />
    </div>
  )
}

function NumberBadge(props: {
  number?: number
  isLoading?: boolean
  isError?: boolean
}) {
  const { number, isLoading, isError } = props
  const controls = useAnimationControls()
  const [isFirstData, setIsFirstData] = useState(false)

  useEffect(() => {
    if (number === undefined) return
    if (!isFirstData) {
      setIsFirstData(true)
      return
    }

    controls.start({
      scale: [0, 1],
      transition: { type: 'spring', bounce: 0.5, duration: 0.4 },
    })
  }, [number])

  if (isLoading)
    return <Spinner className='h-4 w-4 text-stone-500 sm:h-5 sm:w-5' />

  if (isError)
    return (
      <ExclamationCircleIcon className='h-4 w-4 text-red-400 sm:h-5 sm:w-5' />
    )

  if (number === 0) return null

  return (
    <motion.div
      animate={controls}
      className='flex h-4 justify-center rounded-full bg-yellow-500 -indent-[0.05em] font-mono text-xs tracking-tighter text-yellow-900 group-data-selected:bg-stone-300 group-data-selected:text-stone-600 sm:h-5 sm:rounded-md sm:text-sm'
    >
      <span className='px-1'>{number}</span>
    </motion.div>
  )
}

function CartNumberBadge() {
  const { data, isLoading, isError } = trpc.cart.get.useQuery()
  return (
    <NumberBadge
      number={data?.cartItems.reduce((acc, item) => acc + item.quantity, 0)}
      isLoading={isLoading}
      isError={isError}
    />
  )
}

function OrderNumberBadge() {
  const { data, isLoading, isError } = trpc.order.getBadgeCount.useQuery()
  return <NumberBadge number={data} isLoading={isLoading} isError={isError} />
}

function ReservationNumberBadge() {
  const { data, isLoading, isError } =
    trpc.menu.getReservationsForUser.useQuery()
  return (
    <NumberBadge
      number={data?.length}
      isLoading={isLoading}
      isError={isError}
    />
  )
}

function POSNumberBadge() {
  const { data, isLoading, isError } = trpc.pos.getLive.useQuery({
    type: 'live',
  })
  return (
    <NumberBadge
      number={data?.filter((order) => order.timeDishedUp === null).length}
      isLoading={isLoading}
      isError={isError}
    />
  )
}
