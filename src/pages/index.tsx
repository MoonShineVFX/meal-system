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
    <div className='absolute inset-0 bottom-12 flex flex-col justify-end bg-teal-200 p-4'>
      <p>TEST</p>
    </div>
  )
}
