import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { CommodityOnMenu } from '@/lib/client/trpc'
import Image from '@/components/core/Image'
import { settings } from '@/lib/common'

function LinkWrapper(props: {
  children: React.ReactNode
  com?: CommodityOnMenu
}) {
  const [pathName, setPathName] = useState<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!props.com) return
    const pathNames = window.location.pathname.split('/')
    const navName = pathNames[1]

    if (navName === 'live') {
      setPathName(`/live/${props.com.commodity.id}`)
    } else if (navName === 'reserve') {
      setPathName(`/reserve/${pathNames[2]}/${props.com.commodity.id}`)
    }
  }, [props.com])

  return (
    <Link className='group-data-loading:pointer-events-none' href={pathName}>
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
      <div className='group/com flex flex-col overflow-hidden border-stone-100 bg-white transition-transform duration-150 hover:scale-[1.02] active:scale-95'>
        {/* Image */}
        <section className='px-4 py-2'>
          <div className='relative aspect-square overflow-hidden rounded-2xl group-data-loading:skeleton'>
            <Image
              className='object-cover group-hover/com:opacity-75 group-active/com:opacity-75 group-data-loading:hidden'
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
              <span className='skeleton rounded-xl'>分類</span>
            )}
          </p>
          <h2 className='text indent-[0.1em] font-bold tracking-widest'>
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
