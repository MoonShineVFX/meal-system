import z from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { useMediaQuery } from 'usehooks-ts'
import { ReceiptPercentIcon } from '@heroicons/react/24/outline'
import { GetServerSideProps } from 'next'
import { useEffect, useState } from 'react'

import Menu from '@/components/menu/Menu'
import Cart from '@/components/cart/Cart'
import Reservations from '@/components/menu/Reservations'

const reserveArgsSchema = z
  .array(z.string().regex(/^\d+$/))
  .min(1)
  .max(2)
  .optional()

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { reserveArgs } = context.params as {
    reserveArgs?: string[]
  }

  const result = reserveArgsSchema.safeParse(reserveArgs)
  if (!result.success) {
    return {
      notFound: true,
    }
  }

  let reservationMenuId: number | undefined
  let comId: number | undefined
  if (reserveArgs) {
    reservationMenuId = parseInt(reserveArgs[0])
    if (reserveArgs.length === 2) {
      comId = parseInt(reserveArgs[1])
    }
  }

  return {
    props: {
      reservationMenuId,
      comId,
    },
  }
}

export default function PageReserve(props: {
  reservationMenuId?: number
  comId?: number
}) {
  const [isLg, setIsLg] = useState(false)
  const matches = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    setIsLg(matches)
  }, [matches])

  return (
    <>
      <div className='flex h-full w-full'>
        <AnimatePresence initial={false} mode='popLayout'>
          {(isLg || !props.reservationMenuId) && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: isLg ? 0 : 0.3, type: 'spring' }}
              className='w-full lg:max-w-sm'
              key='reservation-list'
            >
              <Reservations activeMenuId={props.reservationMenuId} />
            </motion.div>
          )}
          {(isLg || props.reservationMenuId) && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: isLg ? 0 : 0.3, type: 'spring' }}
              className='w-full flex-1 lg:relative lg:z-[1] lg:min-w-[32rem] lg:shadow-lg'
              key={`reservation-menu-${props.reservationMenuId}`}
            >
              {props.reservationMenuId ? (
                // Menu
                <Menu
                  menuId={props.reservationMenuId}
                  comId={props.comId}
                  fromReserve
                />
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
          <div
            className='relative z-[2] hidden w-full max-w-md shadow-lg 2xl:block'
            key='reservation-cart'
          >
            <Cart />
          </div>
        </AnimatePresence>
      </div>
    </>
  )
}
