import trpc from '@/trpc/client/client'
import { CircleStackIcon } from '@heroicons/react/20/solid'
import { BanknotesIcon } from '@heroicons/react/24/solid'
import { CurrencyDollarIcon } from '@heroicons/react/24/solid'
import { CurrencyType, Role, TransactionType } from '@prisma/client'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import CountUp from 'react-countup'
import { Fragment } from 'react'
import { ChevronUpIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { settings } from '@/utils/settings'

export default function PageIndex() {
  const { data: userData } = trpc.user.info.useQuery(undefined)
  const { data: transcationsData, hasNextPage } =
    trpc.trade.listTransactions.useInfiniteQuery(
      { role: Role.USER },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    )

  const hasTransactions =
    (transcationsData?.pages[0].transactions.length ?? 0) > 0

  return (
    <div className=''>
      {/* Fixed Area */}
      <div className='fixed top-0 -z-10 flex h-4/5 w-full max-w-lg flex-col gap-8 bg-amber-400 p-6'>
        {/* Prifile */}
        <div className='flex justify-end'>
          <button className='flex items-center gap-1 text-stone-700'>
            {userData?.name}
            <ChevronDownIcon className='w-5' />
          </button>
        </div>
        {/* Balance */}
        <div className='mx-auto'>
          {/* Credits */}
          <BalanceIndicator
            balance={userData?.credits ?? 0}
            currencyText='夢想幣'
            currencyIcon={'$'}
          />
          {/* Points */}
          <div className='mt-4 flex items-center justify-center gap-2'>
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
        <div className='mx-auto grid w-full max-w-md grid-cols-2 place-items-center gap-8'>
          <IndexButton icon={BanknotesIcon} text='儲值' />
          <IndexButton icon={CurrencyDollarIcon} text='付款' />
        </div>
      </div>
      {/* Trasactions Area */}
      <div
        data-ui={hasTransactions && 'active'}
        className='group fixed bottom-0 top-0 mt-[360px] rounded-t-3xl bg-stone-100 px-4 pb-20 shadow-xl data-active:static data-active:min-h-screen'
      >
        <div className='flex justify-center py-4'>
          <ChevronUpIcon className='w-8 text-stone-600' />
        </div>
        {hasTransactions ? (
          <div className='flex flex-col gap-4'>
            {transcationsData?.pages.map((page, idx) =>
              idx === 0 ? (
                <Fragment key={page.nextCursor}>
                  {page.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className='flex items-center gap-4 rounded-lg px-4 py-2 hover:bg-gray-200'
                    >
                      <div className='h-2 w-2 rounded-full bg-stone-800'></div>
                      {/* Date */}
                      <div className='flex flex-col'>
                        <div className='text-lg tracking-widest'>
                          {transaction.createdAt.toLocaleTimeString('zh-TW', {
                            hourCycle: 'h23',
                          })}
                        </div>
                      </div>
                      {/* Type */}
                      <div className=''>
                        {settings.TRANSACTION_NAME[transaction.type]}
                      </div>
                      {/* Balance change */}
                      <div className='flex grow flex-col items-end min-[460px]:flex-row min-[460px]:items-center min-[460px]:gap-2'>
                        <div
                          data-ui={
                            [
                              TransactionType.RECHARGE as string,
                              TransactionType.REFUND as string,
                            ].includes(transaction.type as string) && 'active'
                          }
                          className='grow text-right text-3xl font-bold before:content-["-"] data-active:text-green-500 data-active:before:content-["+"]'
                        >
                          {transaction.amount}
                        </div>
                        <div className='max-w-[8ch] grow text-left text-xs text-stone-500'>
                          {transaction.currency === CurrencyType.CREDIT
                            ? '夢想幣'
                            : '福利點數'}
                        </div>
                      </div>
                    </div>
                  ))}
                </Fragment>
              ) : null,
            )}
            {hasNextPage && (
              <div className='col-span-full flex justify-center p-8'>
                <Link
                  className='rounded-xl bg-stone-800 text-stone-100 hover:bg-amber-900'
                  href={'/records'}
                >
                  <p className='p-4'>更多交易紀錄</p>
                </Link>{' '}
              </div>
            )}
          </div>
        ) : (
          <div className='text-center'>
            <p>還沒有交易紀錄</p>
          </div>
        )}
      </div>
    </div>
  )
}

function IndexButton(props: {
  icon: React.FC<React.ComponentProps<'svg'>>
  text: string
}) {
  return (
    <button className='flex w-full max-w-[10rem] items-center justify-between rounded-xl bg-stone-800 py-4 px-5 shadow-lg hover:bg-amber-900'>
      <props.icon className='h-8 w-8 text-stone-100' />
      <div className='tracking-[0.5ch] text-stone-100'>{props.text}</div>
    </button>
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
          <div className='absolute -translate-x-full text-3xl text-amber-800'>
            {props.currencyIcon}
          </div>
          <CountUp end={props.balance} duration={0.5} preserveValue={true} />
        </h1>
      </div>
    </div>
  )
}
