import { useEffect, useState } from 'react'
import { MenuType } from '@prisma/client'
import { useMediaQuery } from 'usehooks-ts'
import dynamic from 'next/dynamic'
import { GetServerSideProps } from 'next'

import Title from '@/components/core/Title'
import Menu from '@/components/menu/Menu'

const DynamicCart = dynamic(() => import('@/components/cart/Cart'), {
  ssr: false,
})

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { indexArgs } = context.params as { indexArgs?: string[] }

  let comId: number | undefined = undefined
  if (
    Array.isArray(indexArgs) &&
    indexArgs.length > 0 &&
    indexArgs[0].match(/^\d+$/)
  ) {
    comId = parseInt(indexArgs[0])
  }

  return {
    props: {
      comId,
    },
  }
}

export default function PageIndex(props: { comId?: number }) {
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
        <Menu
          className='grow basis-1/2'
          type={MenuType.MAIN}
          comId={props.comId}
        />
        {/* Cart */}
        <section className='relative z-[1] hidden max-w-2xl grow basis-1/5 border-l border-stone-100 shadow-lg xl:block'>
          {matches && firstRendered && <DynamicCart />}
        </section>
      </div>
    </>
  )
}
