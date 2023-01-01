import { useEffect, useState } from 'react'
import { MenuType } from '@prisma/client'
import { useMediaQuery } from 'usehooks-ts'
import { GetServerSideProps } from 'next'
import z from 'zod'

import Menu from '@/components/menu/Menu'
import Cart from '@/components/cart/Cart'

const liveArgsSchema = z.array(z.string().regex(/^\d+$/)).length(1).optional()

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { liveArgs } = context.params as { liveArgs?: string[] }

  const result = liveArgsSchema.safeParse(liveArgs)
  if (!result.success) {
    return {
      notFound: true,
    }
  }

  let comId: number | undefined = undefined
  if (liveArgs) {
    comId = parseInt(liveArgs[0])
  }

  return {
    props: {
      comId,
    },
  }
}

export default function PageLive(props: { comId?: number }) {
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
        <Menu
          className='grow basis-1/2'
          type={MenuType.LIVE}
          comId={props.comId}
        />
        {/* Cart */}
        <section className='relative z-[1] hidden max-w-2xl grow basis-1/5 border-l border-stone-100 shadow-lg xl:block'>
          {isXl && <Cart />}
        </section>
      </div>
    </>
  )
}
