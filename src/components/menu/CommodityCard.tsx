import type { RouterOutput } from '@/lib/client/trpc'
import Button from '@/components/core/Button'

import Image from '@/components/core/Image'
import { settings } from '@/lib/common'

type CommodityOnMenu = RouterOutput['menu']['get']['commoditiesOnMenu'][0]

export default function CommodityCard(props: {
  commodityOnMenu: CommodityOnMenu
}) {
  const { commodityOnMenu } = props

  return (
    <div className='flex w-full shrink-0 gap-4 overflow-hidden rounded-2xl bg-gray-200 p-4'>
      <div className='relative aspect-square w-2/5 overflow-hidden rounded-2xl'>
        <Image
          className='object-cover'
          src={
            commodityOnMenu.commodity.imageUrl ??
            settings.RESOURCE_FOOD_PLACEHOLDER
          }
          sizes='(max-width: 375px) 100vw, 320px'
          alt={commodityOnMenu.commodity.name}
        />
      </div>
      <div className='flex grow flex-col'>
        <h3 className='text-xl font-bold text-gray-600'>
          {commodityOnMenu.commodity.name}
        </h3>
        <div className='flex w-full grow items-end justify-between'>
          <p className='text-xl font-bold text-violet-500'>
            ${commodityOnMenu.overridePrice ?? commodityOnMenu.commodity.price}
          </p>
          <Button
            className='h-8 w-8 rounded-full'
            textClassName='text-xl'
            text='＋'
          />
        </div>
      </div>
    </div>
  )
}
