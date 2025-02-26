import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

import Image from '@/components/core/Image'
import type { CommodityOnMenu } from '@/lib/client/trpc'
import { settings } from '@/lib/common'
import { useMenuNavigation } from './menu.navigation'

function LinkWrapper(props: {
  children: React.ReactNode
  com?: CommodityOnMenu
}) {
  const { menuId } = useMenuNavigation()

  return (
    <Link
      className='group-data-loading:pointer-events-none'
      href={{
        query: { c: props.com?.commodity.id, ...(menuId && { m: menuId }) },
      }}
      shallow
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
  const isUnavailable = (com?.unavailableReasons.length ?? 0) > 0

  return (
    <LinkWrapper com={com}>
      <div className='group/com flex flex-col overflow-hidden border-stone-100 bg-white transition-transform duration-150 hover:scale-[1.02] active:scale-95'>
        {/* Image */}
        <section className='px-4 py-2'>
          <div className='relative aspect-square overflow-hidden rounded-2xl group-data-loading:skeleton'>
            <Image
              className='object-cover group-hover/com:opacity-75 group-active/com:opacity-75 group-data-loading:hidden'
              src={
                com?.commodity.image?.path ?? settings.RESOURCE_FOOD_PLACEHOLDER
              }
              sizes='256px'
              alt={com?.commodity.name ?? '餐點圖片'}
            />
            {isUnavailable && (
              <div className='absolute inset-0 grid place-items-center bg-red-200/60'>
                <ExclamationTriangleIcon className='h-8 w-8 text-red-800' />
              </div>
            )}
          </div>
        </section>
        {/* Description */}
        <section className='flex w-full flex-col items-center gap-1 p-2'>
          <p className='text-sm text-stone-400'>
            {com ? (
              props.category
            ) : (
              <span className='skeleton rounded-xl'>分類</span>
            )}
          </p>
          <h2 className='text text-center indent-[0.1em] font-bold tracking-widest'>
            {com ? (
              com?.commodity.name
            ) : (
              <span className='skeleton rounded-xl'>餐點名稱</span>
            )}
          </h2>
          <h3 className='text-yellow-500'>
            {com ? (
              `$${com.commodity.price}`
            ) : (
              <span className='skeleton rounded-xl'>$100</span>
            )}
          </h3>
        </section>
      </div>
    </LinkWrapper>
  )
}
