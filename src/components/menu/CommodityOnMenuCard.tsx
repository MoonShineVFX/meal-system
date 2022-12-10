import Link from 'next/link'
import { useRouter } from 'next/router'

import type { CommodityOnMenu } from '@/lib/client/trpc'
import Image from '@/components/core/Image'
import { settings } from '@/lib/common'

export default function CommodityOnMenuCard(props: {
  commodityOnMenu: CommodityOnMenu
  category: string
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
      <div className='group flex flex-col overflow-hidden border-stone-100 bg-white'>
        {/* Image */}
        <section className='relative aspect-square overflow-hidden rounded-md'>
          <Image
            className='object-cover transition-transform group-hover:opacity-75 group-active:opacity-75'
            src={
              commodityOnMenu.commodity.image?.path ??
              settings.RESOURCE_FOOD_PLACEHOLDER
            }
            sizes='(max-width: 375px) 50vw, (max-width: 750px) 33vw, 180px'
            alt={commodityOnMenu.commodity.name}
          />
        </section>
        {/* Description */}
        <section className='flex w-full flex-col items-center gap-1 p-2'>
          <p className='text-sm text-stone-400'>{props.category}</p>
          <h2 className='text indent-[0.1em] font-bold tracking-widest'>
            {commodityOnMenu.commodity.name}
          </h2>
          <h3 className='text-yellow-500'>
            ${commodityOnMenu.commodity.price}
          </h3>
        </section>
      </div>
    </Link>
  )
}
