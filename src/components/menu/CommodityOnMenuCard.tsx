import Link from 'next/link'
import { useRouter } from 'next/router'

import type { RouterOutput } from '@/lib/client/trpc'
import Button from '@/components/core/Button'
import Image from '@/components/core/Image'
import { settings } from '@/lib/common'
import { PlusIcon } from '@heroicons/react/24/outline'

type CommodityOnMenu = RouterOutput['menu']['get']['commoditiesOnMenu'][0]

export default function CommodityOnMenuCard(props: {
  commodityOnMenu: CommodityOnMenu
}) {
  const { commodityOnMenu } = props
  const router = useRouter()

  return (
    <Link
      href={{
        pathname: router.pathname,
        query: {
          ...router.query,
          commodityId: commodityOnMenu.commodity.id,
        },
      }}
    >
      <div className='flex gap-4 overflow-hidden rounded-2xl bg-gray-100 p-4 shadow-md'>
        <div className='relative w-2/5 overflow-hidden rounded-xl'>
          <Image
            className='object-cover'
            src={
              commodityOnMenu.commodity.image?.path ??
              settings.RESOURCE_FOOD_PLACEHOLDER
            }
            sizes='(max-width: 375px) 50vw, (max-width: 750px) 33vw, 150px'
            alt={commodityOnMenu.commodity.name}
          />
        </div>
        <div className='flex grow flex-col'>
          <h3 className='min-h-[3em] text-xl font-bold'>
            {commodityOnMenu.commodity.name}
          </h3>
          <div className='flex w-full grow items-end justify-between'>
            <p className='text-xl font-bold text-violet-500'>
              $
              {commodityOnMenu.overridePrice ?? commodityOnMenu.commodity.price}
            </p>
            <Button
              className='h-8 w-8 rounded-full'
              label={<PlusIcon className='h-5 w-5' />}
              theme='secondary'
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
