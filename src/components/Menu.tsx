import {
  HomeIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon,
  CakeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Menu() {
  return (
    <div className='fixed bottom-0 flex h-16 w-full justify-center bg-stone-100 shadow-2xl md:static md:block md:h-screen md:shadow'>
      <div className='flex w-full max-w-md items-center justify-between px-4 pt-0 md:flex-col md:items-stretch md:gap-2 md:p-8'>
        <MenuButton
          className='hidden md:block'
          path='/'
          text='首頁'
          icon={HomeIcon}
        />
        <MenuButton path='/records' text='交易紀錄' icon={ListBulletIcon} />
        <MenuButton path='/pay' text='預訂餐點' icon={CalendarDaysIcon} />
        <MenuButton
          className='md:hidden'
          path='/'
          text='首頁'
          icon={HomeIcon}
          mainIcon={CurrencyDollarIcon}
        />
        <MenuButton path='/recharge' text='下午茶' icon={CakeIcon} />
        <MenuButton
          path='/staffRecords'
          text='設定'
          icon={AdjustmentsHorizontalIcon}
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
        className='group flex items-center gap-4 p-3 transition-colors data-main:mb-5 data-main:rounded-full data-main:bg-stone-100 data-main:shadow-lg data-active:data-main:bg-amber-500 data-active:data-main:hover:bg-amber-400 md:rounded-xl md:p-2 md:hover:bg-stone-200'
      >
        <Icon className='h-7 w-7 text-stone-400 transition-colors group-hover:text-stone-600 group-data-active:text-amber-500 group-data-main:h-10 group-data-main:w-10 group-data-main:group-data-active:text-amber-50' />
        <h3 className='hidden grow font-bold text-stone-500 group-hover:text-stone-700 group-data-active:text-amber-600 md:block'>
          {props.text}
        </h3>
      </div>
    </Link>
  )
}
