import trpc from '@/trpc/client/client'
import { CircleStackIcon } from '@heroicons/react/20/solid'
import { BanknotesIcon } from '@heroicons/react/24/solid'
import { CurrencyDollarIcon } from '@heroicons/react/24/solid'
import { Role } from '@prisma/client'
import { Fragment } from 'react'
import CountUp from 'react-countup'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { ChevronUpIcon } from '@heroicons/react/24/outline'

export default function PageIndex() {
  const { data: userData } = trpc.user.info.useQuery(undefined)

  return (
    <div className='fixed top-0 left-0 right-0 bottom-20 flex flex-col p-4'>
      {/* Profile */}
      <div className='flex w-full justify-end'>
        <button className='flex items-center gap-2 text-lg font-bold'>
          <p>{userData?.name}</p>
          <ChevronDownIcon className='h-6 w-6' />
        </button>
      </div>
      <div className='my-4 ml-auto w-4/5 border-t-[1px] border-stone-700'></div>
      {/* Balance */}
      <div className='py-4 text-3xl font-bold'>Balance</div>
      <div className='flex flex-col justify-between gap-4'>
        <div className='flex shrink flex-col gap-2 rounded-lg bg-stone-300 p-6 shadow-xl'>
          <div>
            <CircleStackIcon className='h-10 w-10' />
          </div>
          <h1 className='tracking-[0.5ch]'>福利點數</h1>
          <div className='mt-0 flex justify-end gap-2 text-4xl font-semibold'>
            <p className='text-xl'>$</p>
            <CountUp
              end={userData?.points ?? 0}
              preserveValue={true}
              duration={0.5}
            />
          </div>
        </div>
        <div className='flex shrink flex-col gap-2 rounded-lg bg-violet-400 p-6 shadow-xl'>
          <div>
            <CurrencyDollarIcon className='h-10 w-10' />
          </div>
          <h1 className='tracking-[0.5ch]'>夢想幣</h1>
          <div className='mt-0 flex justify-end gap-2 text-4xl font-semibold'>
            <p className='text-xl'>$</p>
            <CountUp
              end={userData?.credits ?? 0}
              preserveValue={true}
              duration={0.5}
            />
          </div>
          <div className='mt-2 flex justify-end'>
            <button className='rounded-md bg-stone-800 py-2 px-4 text-violet-200'>
              儲值
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
