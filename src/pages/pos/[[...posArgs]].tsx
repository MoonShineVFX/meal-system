import { GetServerSideProps } from 'next'
import z from 'zod'

import Title from '@/components/core/Title'
import Tab from '@/components/core/Tab'
import POSLiveList from '@/components/pos/POSLiveList'
import POSReservationList from '@/components/pos/POSReservationList'

const posArgsSchema = z.array(z.string()).length(1).optional()

const TAB_NAMES = ['待處理', '已出餐', '已完成', '今日預訂'] as const
type TabName = typeof TAB_NAMES[number]
const TAB_PATHS = ['live', 'dishedUp', 'archived', 'reservation'] as const
type TabPath = typeof TAB_PATHS[number]
const TAB_LINKS = TAB_PATHS.map((path) => `/pos/${path}`)

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { posArgs } = context.params as { posArgs?: string[] }

  const result = posArgsSchema.safeParse(posArgs)
  if (!result.success) {
    return {
      notFound: true,
    }
  }

  let tabName: TabName

  if (!posArgs) {
    // for default
    tabName = TAB_NAMES[0]
  } else {
    const foundIndex = TAB_PATHS.indexOf(posArgs[0] as TabPath)
    if (foundIndex !== -1) {
      tabName = TAB_NAMES[foundIndex]
    } else {
      tabName = TAB_NAMES[0]
    }
  }

  return {
    props: {
      tabName,
    },
  }
}

export default function POSPage(props: { tabName: TabName }) {
  const currentTabName = props.tabName

  return (
    <>
      <Title prefix='處理訂單' />
      <div className='group relative flex h-full w-full data-loading:pointer-events-none'>
        {/* Categories */}
        <Tab
          tabNames={TAB_NAMES}
          currentTabName={currentTabName}
          tabLinks={TAB_LINKS}
          disableLoading={true}
        />
        {/* Pos */}
        <div className='relative grow'>
          {currentTabName !== '今日預訂' ? (
            <POSLiveList tabName={currentTabName} />
          ) : (
            <POSReservationList />
          )}
        </div>
      </div>
    </>
  )
}
