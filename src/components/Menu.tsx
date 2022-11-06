import {
  HomeIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Menu() {
  return (
    <div className='fixed bottom-0 z-50 flex h-16 w-full justify-center bg-stone-100 md:inset-y-0 md:h-full md:w-[18rem] md:rounded-t-none md:drop-shadow-none'>
      <div className='flex w-full max-w-md items-center justify-evenly px-4 pt-0 md:my-16 md:flex-col md:items-stretch md:justify-start md:gap-10 md:border-r-[1px] md:border-stone-700 md:pl-10 md:pr-20'>
        <MenuButton
          className='hidden md:block'
          path='/'
          text='首頁'
          icon={HomeIcon}
        />
        <MenuButton path='/records' text='交易紀錄' icon={ListBulletIcon} />
        <MenuButton
          className='md:hidden'
          path='/'
          text='首頁'
          icon={HomeIcon}
          mainIcon={CurrencyDollarIcon}
        />
        <MenuButton path='/pay' text='預訂餐點' icon={CalendarDaysIcon} />
        <MenuButton
          className='mt-auto hidden border-t-[1px] border-dashed border-stone-700 pt-16 md:block'
          path='/login'
          text='登出'
          icon={UserMinusIcon}
        />
      </div>
    </div>
  )
}

export function MenuButton(props: {
  icon: React.FC<React.ComponentProps<'svg'>>
  text: string
  path: string
  mainIcon?: React.FC<React.ComponentProps<'svg'>>
  className?: string
}) {
  const router = useRouter()
  const isActive = router.pathname === props.path
  const Icon = props.mainIcon && isActive ? props.mainIcon : props.icon

  return (
    <Link className={props.className} href={props.path}>
      <div
        data-ui={[isActive && 'active', props.mainIcon && 'main'].join(' ')}
        className='group flex items-center gap-4 border-stone-300 p-3 transition-colors data-active:hover:bg-stone-800 data-main:mb-4 data-main:rounded-full data-main:border-[1px] data-main:bg-stone-100 data-active:data-main:border-transparent data-active:data-main:bg-emerald-300 data-active:data-main:hover:bg-emerald-200 md:rounded-md md:p-1 md:px-2 md:hover:bg-stone-300 md:data-active:bg-stone-800'
      >
        <Icon className='h-6 w-6 stroke-1 text-stone-500 transition-colors group-hover:text-stone-700 group-data-active:stroke-[1.5px] group-data-active:text-stone-700 group-data-main:h-9 group-data-main:w-9 group-data-main:text-stone-500  group-data-main:group-data-active:text-stone-700 md:group-data-active:text-stone-200' />
        <h3 className='hidden grow text-sm font-bold tracking-[0.5ch] text-stone-800 transition-colors group-hover:text-stone-700 group-data-active:text-stone-200 md:block'>
          {props.text}
        </h3>
      </div>
    </Link>
  )
}
