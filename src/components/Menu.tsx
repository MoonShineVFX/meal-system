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
        <MenuButton path='/pay' icon={CalendarDaysIcon} />
        <MenuButton path='/' icon={HomeIcon} activeIcon={CurrencyDollarIcon} />
        <MenuButton path='/records' icon={ListBulletIcon} />
      </div>
    </div>
  )
}

export function MenuButton(props: {
  icon: React.FC<React.ComponentProps<'svg'>>
  path: string
  activeIcon?: React.FC<React.ComponentProps<'svg'>>
  className?: string
}) {
  const router = useRouter()
  const isActive = router.pathname === props.path
  const Icon = props.activeIcon && isActive ? props.activeIcon : props.icon

  return (
    <Link className={props.className} href={props.path}>
      <div
        data-ui={[isActive && 'active', props.activeIcon && 'main'].join(' ')}
        className='group flex items-center gap-4 rounded-full p-3 hover:bg-stone-200 data-main:mb-4 data-main:bg-stone-100 data-main:shadow  data-main:hover:bg-stone-200 data-active:data-main:bg-amber-400 data-active:data-main:hover:bg-amber-300'
      >
        <Icon className='h-7 w-7 stroke-1 text-stone-600 group-data-active:stroke-[1.5px] group-data-active:text-stone-800 group-data-main:h-8 group-data-main:w-8 group-data-main:text-stone-600  group-data-main:group-data-active:text-stone-800' />
      </div>
    </Link>
  )
}
