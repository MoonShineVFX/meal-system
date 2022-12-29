import z from 'zod'

import Menu from '@/components/menu/Menu'
import Cart from '@/components/cart/Cart'
import Reservations from '@/components/menu/Reservations'
import { GetServerSideProps } from 'next'

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
  return (
    <>
      <div className='flex h-full w-full'>
        <div className='w-full max-w-sm'>
          <Reservations />
        </div>
        <div className='w-full'>
          {props.reservationMenuId && (
            <Menu menuId={props.reservationMenuId} comId={props.comId} />
          )}
        </div>
        <div className='w-full max-w-sm'>
          <Cart />
        </div>
      </div>
    </>
  )
}
