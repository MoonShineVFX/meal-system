import { MenuType } from '@prisma/client'

import Title from '@/components/core/Title'
import Menu from '@/components/menu/Menu'

export default function PageIndex() {
  return (
    <>
      <Title prefix='點餐' />
      <Menu type={MenuType.MAIN} />
    </>
  )
}
