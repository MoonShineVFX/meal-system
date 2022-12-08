import Link from 'next/link'
import { useRouter } from 'next/router'

import type { RouterOutput } from '@/lib/client/trpc'
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
      <div className='flex flex-col gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow'>
        <div className='relative aspect-[4/3] overflow-hidden rounded-2xl'>
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
        <div className='flex grow flex-col gap-1'>
          <h3 className='text-xl font-bold'>
            {commodityOnMenu.commodity.name}
          </h3>
          <div className='flex w-full grow items-center justify-between'>
            <p className='text-xl font-bold text-yellow-500'>
              ${commodityOnMenu.commodity.price}
            </p>
            <PlusIcon className='h-6 w-6 text-stone-400' />
          </div>
        </div>
      </div>
    </Link>
  )
}
