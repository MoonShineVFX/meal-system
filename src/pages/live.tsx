import { MenuType } from '@prisma/client'
import { useEffect, useState } from 'react'
import { useMediaQuery } from 'usehooks-ts'

import Cart from '@/components/cart/Cart'
import Menu from '@/components/menu/Menu'

export default function PageLive() {
  const [isXl, setIsXl] = useState(false)
  const matches = useMediaQuery('(min-width: 1280px)')

  // Trigger first render once
  useEffect(() => {
    setIsXl(matches)
  }, [matches])

  return (
    <>
      <div className='flex h-full w-full'>
        {/* Menu */}
        <Menu className='grow basis-1/2' type={MenuType.LIVE} />
        {/* Cart */}
        <section className='relative z-[1] hidden max-w-2xl grow basis-1/5 border-l border-stone-100 shadow-lg xl:block'>
          {isXl && <Cart />}
        </section>
      </div>
    </>
  )
}
