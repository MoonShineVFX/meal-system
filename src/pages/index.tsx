import Title from '@/components/core/Title'
import Menu from '@/components/menu/Menu'

export default function PageIndex() {
  return (
    <>
      <Title prefix='點餐' />
      <Menu type='MAIN' date={new Date()} />
    </>
  )
}
