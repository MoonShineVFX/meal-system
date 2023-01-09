import { CircleStackIcon } from '@heroicons/react/24/outline'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

import Button from '@/components/core/Button'
import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import { twData } from '@/lib/common'

export default function Wallet() {
  const { data, isError, error, isLoading } = trpc.user.get.useQuery()

  if (isError) return <Error description={error.message} />

  return (
    <div
      className='group grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] grid-rows-none place-content-start gap-4 bg-white p-4 lg:p-8 lg:pb-4'
      {...twData({ loading: isLoading })}
    >
      {/* Balance */}
      <div className='grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-4'>
        <div className='flex items-center gap-4'>
          <CircleStackIcon className='h-6 w-6 shrink-0 text-yellow-500' />
          <div className='flex flex-col whitespace-nowrap'>
            <h3 className='rounded-xl text-sm font-bold text-stone-500 group-data-loading:skeleton'>
              點數
            </h3>
            <h1 className='w-fit rounded-xl text-xl font-bold text-stone-600 group-data-loading:skeleton'>
              {data?.pointBalance ?? 50}
            </h1>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <CurrencyDollarIcon className='h-6 w-6 shrink-0 text-yellow-500' />
          <div className='flex flex-col whitespace-nowrap'>
            <h3 className='rounded-xl text-sm font-bold text-stone-500 group-data-loading:skeleton'>
              夢想幣
            </h3>
            <h1 className='w-fit rounded-xl text-xl font-bold text-stone-600 group-data-loading:skeleton'>
              ${data?.creditBalance ?? 50}
            </h1>
          </div>
        </div>
      </div>
      {/* Action */}
      <div className='grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] place-content-evenly justify-center gap-4'>
        <Button
          className='h-12 group-data-loading:skeleton'
          textClassName='font-bold text-lg'
          label='儲值'
        />
      </div>
    </div>
  )
}
