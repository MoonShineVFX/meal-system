import Link from 'next/link'
import { useRouter } from 'next/router'

import type { CommodityOnMenu } from '@/lib/client/trpc'
import Image from '@/components/core/Image'
import { settings } from '@/lib/common'

function LinkWrapper(props: {
  children: React.ReactNode
  com?: CommodityOnMenu
}) {
  const router = useRouter()
  return (
    <Link
      className='group-data-loading/menu:pointer-events-none'
      href={{
        pathname: router.pathname,
        query: {
          ...router.query,
          commodityId: props.com?.commodity.id,
        },
      }}
    >
      {props.children}
    </Link>
  )
}

export default function COMCard(props: {
  com?: CommodityOnMenu
  category: string
}) {
  const { com } = props

  return (
    <LinkWrapper com={com}>
      <div className='group flex flex-col overflow-hidden border-stone-100 bg-white'>
        {/* Image */}
        <section className='p-4 pb-2'>
          <div className='relative aspect-square overflow-hidden rounded-2xl group-data-loading/menu:skeleton'>
            <Image
              className='object-cover transition-transform group-hover:opacity-75 group-active:opacity-75 group-data-loading/menu:hidden'
              src={
                com?.commodity.image?.path ?? settings.RESOURCE_FOOD_PLACEHOLDER
              }
              sizes='(max-width: 375px) 50vw, (max-width: 750px) 33vw, 180px'
              alt={com?.commodity.name ?? '餐點圖片'}
            />
          </div>
        </section>
        {/* Description */}
        <section className='flex w-full flex-col items-center gap-1 p-2'>
          <p className='text-sm text-stone-400'>
            {com ? (
              props.category
            ) : (
              <span className='skeleton rounded-md text-transparent'>分類</span>
            )}
          </p>
          <h2 className='text indent-[0.1em] font-bold tracking-widest'>
            {com ? (
              com?.commodity.name
            ) : (
              <span className='skeleton rounded-md text-transparent'>
                餐點名稱
              </span>
            )}
          </h2>
          <h3 className='text-yellow-500'>
            {com ? (
              `$${com.commodity.price}`
            ) : (
              <span className='skeleton rounded-md text-transparent'>$100</span>
            )}
          </h3>
        </section>
      </div>
    </LinkWrapper>
  )
}
