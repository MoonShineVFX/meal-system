import type { RouterOutput } from '@/lib/client/trpc'
import Image from 'next/image'

import { settings } from '@/lib/common'
type CommodityOnMenu = RouterOutput['menu']['get']['commoditiesOnMenu'][0]

export default function CommodityCard(props: {
  commodityOnMenu: CommodityOnMenu
}) {
  return (
    <div>
      <div>
        <Image
          placeholder='blur'
          blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAPUlEQVR4nGMQl5RqCHVemOuWZcbD4MzA8P/Nuf8/70ZIMTBYMzD0pbr/f39rcaAgQ4gyY7Wbyv/tjbtCGQDhwROLXp66yAAAAABJRU5ErkJggg=='
          src={
            props.commodityOnMenu.commodity.imageUrl
              ? `${settings.IMAGE_RESOURCE_URL}/${props.commodityOnMenu.commodity.imageUrl}`
              : ''
          }
          width={640}
          height={640}
          alt={props.commodityOnMenu.commodity.name}
        />
      </div>
    </div>
  )
}
