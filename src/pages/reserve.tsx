import { ReceiptPercentIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useIsomorphicLayoutEffect, useMediaQuery } from 'usehooks-ts'

import Cart from '@/components/cart/Cart'
import Menu from '@/components/menu/Menu'
import Reservations from '@/components/menu/Reservations'
import { useMenuNavigation } from '@/components/menu/menu.navigation'

export default function PageReserve() {
  const [isLg, setIsLg] = useState<boolean | undefined>(undefined)
  const matches = useMediaQuery('(min-width: 1024px)')
  const { menuId } = useMenuNavigation()

  useIsomorphicLayoutEffect(() => {
    setIsLg(matches)
  }, [matches])

  return (
    <>
      <div className='flex h-full w-full'>
        <AnimatePresence initial={false} mode='popLayout'>
          {(isLg || !menuId) && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: isLg ? 0 : 0.3, type: 'spring' }}
              className='w-full lg:max-w-sm'
              key='reservation-list'
            >
              <Reservations activeMenuId={menuId ?? undefined} />
            </motion.div>
          )}
          {(isLg || menuId) && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: isLg ? 0 : 0.3, type: 'spring' }}
              className='w-full flex-1 lg:relative lg:z-[1] lg:min-w-[32rem] lg:shadow-lg'
              key={`reservation-menu-${menuId}`}
            >
              {menuId ? (
                // Menu
                <Menu menuId={menuId} fromReserve />
              ) : (
                // Empty
                <div className='flex h-full flex-col items-center justify-center gap-4'>
                  <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                    <ReceiptPercentIcon className='h-12 w-12 text-stone-400' />
                  </div>
                  <h1 className='indent-[0.1em] text-lg font-bold tracking-widest text-stone-500'>
                    請選擇要預訂的日期與時段
                  </h1>
                </div>
              )}
            </motion.div>
          )}
          {isLg !== undefined && (
            <div
              className='relative z-[2] hidden w-full max-w-md shadow-lg 2xl:block'
              key='reservation-cart'
            >
              <Cart />
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
