import { MenuType } from '@prisma/client'

import Title from '@/components/core/Title'
import Menu from '@/components/menu/Menu'

export default function PageIndex() {
  return (
    <>
      <Title prefix='點餐' />
      <div className='flex h-full w-full'>
        {/* Menu */}
        <Menu className='grow basis-1/2' type={MenuType.MAIN} />
        {/* Cart */}
        <section className='hidden max-w-md grow basis-1/5 bg-stone-100 xl:block'></section>
      </div>
    </>
  )
}
