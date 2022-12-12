import { CircleStackIcon } from '@heroicons/react/24/outline'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

import Button from '@/components/core/Button'
import { useStore } from '@/lib/client/store'

export default function Wallet() {
  const user = useStore((state) => state.user)

  return (
    <div className='grid grid-cols-[repeat(auto-fit,minmax(13.75rem,1fr))] grid-rows-none place-content-start gap-4 bg-white p-4'>
      {/* Balance */}
      <div className='grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-[0.0625rem] bg-stone-300'>
        <div className='flex items-center gap-4 bg-white p-4'>
          <CircleStackIcon className='h-8 w-8 shrink-0 text-yellow-500' />
          <div className='flex flex-col whitespace-nowrap'>
            <h3 className='text-sm font-bold text-stone-500'>福利點數</h3>
            <h1 className='text-2xl font-bold text-stone-700'>
              {user?.pointBalance}
            </h1>
          </div>
        </div>
        <div className='flex items-center gap-4 bg-white p-4'>
          <CurrencyDollarIcon className='h-8 w-8 shrink-0 text-yellow-500' />
          <div className='flex flex-col whitespace-nowrap'>
            <h3 className='text-sm font-bold text-stone-500'>夢想幣</h3>
            <h1 className='text-2xl font-bold text-stone-700'>
              ${user?.creditBalance}
            </h1>
          </div>
        </div>
      </div>
      {/* Action */}
      <div className='grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] place-content-evenly justify-center gap-4'>
        <Button className='h-12' textClassName='font-bold' label='儲值' />
        <Button
          className='h-12'
          textClassName='font-bold'
          label='區塊鏈紀錄'
          theme='secondary'
        />
      </div>
    </div>
  )
}
