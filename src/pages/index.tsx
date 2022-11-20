import Link from 'next/link'
import { CircleStackIcon } from '@heroicons/react/20/solid'
import { BanknotesIcon } from '@heroicons/react/24/solid'
import { CurrencyDollarIcon } from '@heroicons/react/24/solid'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { ChevronUpIcon } from '@heroicons/react/24/outline'
import CountUp from 'react-countup'
import { Popover, Transition } from '@headlessui/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'

import TransactionList from '@/components/TransactionsList'
import Payment from '@/components/Payment'
import { generateCookie } from '@/lib/common'
import { userAtom } from '@/components/AuthValidator'

export default function PageIndex() {
  const user = useAtomValue(userAtom)
  const router = useRouter()
  const [isOpenPayment, setIsOpenPayment] = useState(false)

  useEffect(() => {
    setIsOpenPayment(router.query.pay === '')
  }, [router.query.pay])

  const handleLogout = () => {
    const cookie = generateCookie(undefined)
    document.cookie = cookie
    window.location.href = '/login'
  }

  return (
    <div className=''>
      {/* Payment */}
      <Payment isOpen={isOpenPayment} />
      {/* Fixed Area */}
      <div className='fixed top-0 -z-10 flex h-4/5 w-full max-w-lg flex-col gap-8 bg-amber-400 p-4'>
        {/* Profile */}
        <div className='flex justify-end'>
          <Popover className='relative'>
            <Popover.Button className='flex select-none items-center rounded-md p-1 tracking-widest text-stone-800 hover:bg-stone-800/10 focus:outline-none active:bg-stone-800/10 ui-open:rounded-b-none ui-open:bg-stone-100 ui-open:text-stone-400'>
              {user?.name}
              <ChevronDownIcon className='w-5 ui-open:rotate-180' />
            </Popover.Button>
            <Transition
              enter='transition duration-100 ease-out'
              enterFrom='scale-y-0'
              enterTo='scale-y-100'
            >
              <Popover.Panel className='absolute right-0 left-0 overflow-hidden rounded-b-md bg-stone-100 pt-2 shadow-lg'>
                <button
                  onClick={handleLogout}
                  className='flex w-full flex-col items-center p-2 text-center hover:bg-stone-200 active:bg-stone-200'
                >
                  登出
                </button>
              </Popover.Panel>
            </Transition>
          </Popover>
        </div>
        {/* Balance */}
        <div className='mx-auto'>
          {/* Credits */}
          <BalanceIndicator
            balance={user?.credits ?? 0}
            currencyText='夢想幣'
            currencyIcon={'$'}
          />
          {/* Points */}
          <div className='mt-4 flex w-full grow items-center justify-center gap-2'>
            <CircleStackIcon className='h-4 w-4 text-amber-800' />
            <p className='text-lg font-semibold text-stone-800'>
              <CountUp
                end={user?.points ?? 0}
                duration={0.5}
                preserveValue={true}
              />
            </p>
            <div className='w-4'></div>
          </div>
        </div>
        {/* Operation */}
        <div className='mx-auto grid w-full max-w-md grid-cols-2 place-items-center gap-8'>
          <IndexButton icon={BanknotesIcon} text='儲值' path='/recharge' />
          <IndexButton icon={CurrencyDollarIcon} text='付款' path='/?pay' />
        </div>
      </div>
      {/* Trasactions Area */}
      <div className='mt-[352px] min-h-screen w-full max-w-lg rounded-t-3xl bg-stone-100 px-4 pb-20 shadow-xl'>
        <div className='flex justify-center py-4'>
          <ChevronUpIcon className='w-8 text-stone-600' />
        </div>
        <TransactionList isIndex={true} />
      </div>
    </div>
  )
}

function IndexButton(props: {
  icon: React.FC<React.ComponentProps<'svg'>>
  text: string
  path: string
}) {
  return (
    <Link
      href={props.path}
      shallow={props.path.startsWith('/?')}
      className='flex w-full max-w-[10rem] items-center justify-between rounded-xl bg-stone-800 py-4 px-5 shadow-lg hover:bg-amber-900 active:bg-amber-900'
    >
      <props.icon className='h-8 w-8 text-stone-100' />
      <div className='text-lg tracking-[0.5ch] text-stone-100'>
        {props.text}
      </div>
    </Link>
  )
}

function BalanceIndicator(props: {
  balance: number
  currencyText: string
  currencyIcon: JSX.Element | string
  className?: string
}) {
  return (
    <div className={props.className}>
      <h3 className='mb-2 text-center font-bold tracking-[0.5ch] text-stone-800'>
        {props.currencyText}
      </h3>
      <div className='relaitve flex justify-center'>
        <h1 className='text-6xl font-semibold tracking-widest text-stone-800'>
          <div className='absolute translate-y-3 -translate-x-full text-3xl text-amber-800'>
            {props.currencyIcon}
          </div>
          <CountUp end={props.balance} duration={0.5} preserveValue={true} />
        </h1>
      </div>
    </div>
  )
}
