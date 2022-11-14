import {
  HomeIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Menu() {
  const router = useRouter()

  if (router.pathname === '/login') return null

  return (
    <div className='fixed bottom-0 z-40 flex h-16 w-full justify-center'>
      <div className='flex w-full max-w-xl items-center justify-evenly rounded-t-xl bg-stone-100 drop-shadow-2xl'>
        <MenuButton path='/recharge' icon={CalendarDaysIcon} />
        <MenuButton path='/' icon={HomeIcon} mainIcon={CurrencyDollarIcon} />
        <MenuButton path='/transactions' icon={ListBulletIcon} />
      </div>
    </div>
  )
}

export function MenuButton(props: {
  icon: React.FC<React.ComponentProps<'svg'>>
  path: string
  mainIcon?: React.FC<React.ComponentProps<'svg'>>
  className?: string
}) {
  const router = useRouter()
  const isActive = router.pathname === props.path
  const Icon = props.mainIcon && isActive ? props.mainIcon : props.icon
  const isMain = props.mainIcon ? true : false
  const isPay = isActive && isMain

  return (
    <Link
      className={props.className}
      href={isPay ? '/?pay' : props.path} // Use activeIcon to define main
      shallow={isPay}
    >
      <div
        data-ui={[isActive && 'active', isMain && 'main'].join(' ')}
        className='group flex items-center gap-4 rounded-full p-3 hover:bg-stone-200 active:bg-stone-200 data-main:bg-stone-100 data-main:hover:bg-stone-200 data-main:active:bg-stone-200 data-active:data-main:bg-amber-400 data-active:data-main:hover:bg-amber-300 data-active:data-main:active:bg-amber-300'
      >
        <Icon className='h-7 w-7 stroke-1 text-stone-600 group-data-active:stroke-[1.5px] group-data-active:text-stone-800 group-data-main:h-8 group-data-main:w-8 group-data-main:text-stone-600  group-data-main:group-data-active:text-stone-800' />
      </div>
    </Link>
  )
}