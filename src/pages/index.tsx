import trpc from '@/trpc/client/client'
import { CircleStackIcon } from '@heroicons/react/20/solid'
import { BanknotesIcon } from '@heroicons/react/24/solid'
import { CurrencyDollarIcon } from '@heroicons/react/24/solid'
import { Role } from '@prisma/client'
import { Fragment } from 'react'
import CountUp from 'react-countup'

export default function PageIndex() {
  const { data: userData } = trpc.user.info.useQuery(undefined)
  const {
    data: transcationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.trade.listTransactions.useInfiniteQuery(
    { role: Role.USER },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  )

  return (
    <div className='flex min-h-full w-full flex-col items-center bg-amber-400 md:mt-2'>
      {/* Yellow Area */}
      <div className='fixed top-0 w-full bg-amber-400 p-6 pb-36 md:static md:pb-10'>
        <div className='mb-4 flex justify-end md:hidden'>
          <button className='flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-xl font-bold text-stone-700 shadow-lg'>
            {userData?.name[0]}
          </button>
        </div>
        {/* Balance */}
        <div className='mx-auto max-w-md md:grid md:grid-cols-2 md:gap-16'>
          {/* Credits */}
          <BalanceIndicator
            balance={userData?.credits ?? 0}
            currencyText='夢想幣'
            currencyIcon={'$'}
          />
          {/* Points */}
          <BalanceIndicator
            className='hidden md:block'
            balance={userData?.points ?? 0}
            currencyText='福利點數'
            currencyIcon={<CircleStackIcon className='mt-2 mr-1 h-5 w-6' />}
          />
          <div className='mt-4 flex items-center justify-center gap-2 md:hidden'>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-stone-800'>
              <CircleStackIcon className='h-5 w-5 text-amber-100' />
            </div>
            <p className='text-lg font-semibold'>
              <CountUp
                end={userData?.points ?? 0}
                duration={0.5}
                preserveValue={true}
              />
            </p>
          </div>
        </div>
        {/* Operation */}
        <div className='mx-auto mt-8 grid w-full max-w-md grid-cols-2 place-items-center gap-8'>
          <IndexButton icon={BanknotesIcon} text='儲值' />
          <IndexButton icon={CurrencyDollarIcon} text='付款' />
        </div>
      </div>
      {/* White Area */}
      <div className='z-10 mt-[370px] w-full grow rounded-t-3xl bg-stone-100 px-4 pt-10 pb-20 shadow-2xl md:mt-0 md:pb-0'>
        {transcationsData?.pages.map((page) => (
          <Fragment key={page.nextCursor}>
            {page.records.map((transaction) => (
              <div
                key={transaction.id}
                className='mb-8 flex items-center justify-between gap-4 rounded-full p-2 px-4 shadow'
              >
                <div className='text-lg text-stone-500'>
                  {transaction.createdAt.toLocaleDateString()}
                </div>
                <div>{transaction.type}</div>
                <div>{transaction.currency}</div>
                <div>{transaction.amount}</div>
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function IndexButton(props: {
  icon: React.FC<React.ComponentProps<'svg'>>
  text: string
}) {
  return (
    <div className='flex w-full max-w-[10rem] items-center justify-between rounded-3xl bg-stone-800 py-4 px-5 shadow-lg'>
      <props.icon className='h-10 w-10 text-stone-100' />
      <div className='text-stone-100'>{props.text}</div>
    </div>
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
      <h3 className='mb-2 text-center tracking-[0.5ch] text-amber-800'>
        {props.currencyText}
      </h3>
      <div className='relaitve flex justify-center'>
        <h1 className='text-6xl font-semibold tracking-wider text-stone-800'>
          <div className='absolute -translate-x-full text-3xl text-amber-900'>
            {props.currencyIcon}
          </div>
          <CountUp end={props.balance} duration={0.5} preserveValue={true} />
        </h1>
      </div>
    </div>
  )
}
