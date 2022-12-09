import Link from 'next/link'
import { useRouter } from 'next/router'

import type { CommodityOnMenu } from '@/lib/client/trpc'
import Image from '@/components/core/Image'
import { settings } from '@/lib/common'
import { PlusIcon } from '@heroicons/react/24/outline'

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
      <div className='group flex flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-lg shadow-stone-100 transition-all hover:shadow-stone-200'>
        {/* Image */}
        <section className='relative aspect-[4/3] overflow-hidden'>
          <Image
            className='object-cover transition-transform group-hover:scale-105'
            src={
              commodityOnMenu.commodity.image?.path ??
              settings.RESOURCE_FOOD_PLACEHOLDER
            }
            sizes='(max-width: 375px) 50vw, (max-width: 750px) 33vw, 180px'
            alt={commodityOnMenu.commodity.name}
          />
        </section>
        {/* Description */}
        <section className='flex grow flex-col gap-2 p-4 pt-2'>
          <h3 className='text-lg font-bold'>
            {commodityOnMenu.commodity.name}
          </h3>
          <div className='flex w-full grow items-center justify-between'>
            <h2 className='text font-bold text-yellow-500'>
              ${commodityOnMenu.commodity.price}
            </h2>
            <PlusIcon className='h-6 w-6 text-stone-400 transition-colors group-hover:text-yellow-500' />
          </div>
        </section>
      </div>
    </Link>
  )
}
