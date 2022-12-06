import type { RouterOutput } from '@/lib/client/trpc'

import Image from '@/components/core/Image'
import { settings } from '@/lib/common'

type CommodityOnMenu = RouterOutput['menu']['get']['commoditiesOnMenu'][0]

export default function CommodityCard(props: {
  commodityOnMenu: CommodityOnMenu
}) {
  return (
    <div className='w-full max-w-xs'>
      <h1>{props.commodityOnMenu.commodity.name}</h1>
      <div className='relative aspect-square'>
        <Image
          fill={true}
          src={
            props.commodityOnMenu.commodity.imageUrl ??
            settings.RESOURCE_FOOD_PLACEHOLDER
          }
          sizes='(max-width: 400px) 100vw, (max-width: 550x) 75vw, 33vw'
          alt={props.commodityOnMenu.commodity.name}
        />
      </div>
    </div>
  )
}
