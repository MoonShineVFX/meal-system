import { useEffect, useState } from 'react'
import { MenuType } from '@prisma/client'
import { useMediaQuery } from 'usehooks-ts'
import dynamic from 'next/dynamic'

import Title from '@/components/core/Title'
import Menu from '@/components/menu/Menu'

const DynamicCart = dynamic(() => import('@/components/cart/Cart'), {
  ssr: false,
})

export default function PageIndex() {
  const [firstRendered, setFirstRendered] = useState(false)
  const matches = useMediaQuery('(min-width: 1280px)')

  // Trigger first render once
  useEffect(() => {
    setFirstRendered(true)
  }, [])

  return (
    <>
      <Title prefix='點餐' />
      <div className='flex h-full w-full'>
        {/* Menu */}
        <Menu className='grow basis-1/2' type={MenuType.MAIN} />
        {/* Cart */}
        <section className='relative z-[1] hidden max-w-2xl grow basis-1/5 border-l border-stone-100 shadow-lg xl:block'>
          {matches && firstRendered && <DynamicCart />}
        </section>
      </div>
    </>
  )
}
