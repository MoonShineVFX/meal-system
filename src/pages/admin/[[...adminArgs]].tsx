import z from 'zod'
import { GetServerSideProps } from 'next'

import Tab from '@/components/core/Tab'
import Title from '@/components/core/Title'
import Categories from '@/components/admin/Categories'
import OptionSets from '@/components/admin/OptionSets'
import Commodities from '@/components/admin/Commodities'
import Menus from '@/components/admin/Menus'
import Deposits from '@/components/admin/Deposits'

const TAB_NAMES = [
  '餐點',
  '菜單',
  '分類',
  '選項',
  '訂單',
  '交易',
  '儲值',
] as const
// type TabName = typeof TAB_NAMES[number]
const TAB_PATHS = [
  'commodities',
  'menus',
  'categories',
  'optionsets',
  'orders',
  'transactions',
  'deposits',
] as const
type TabPath = typeof TAB_PATHS[number]
const TAB_LINKS = TAB_PATHS.map((path) => `/admin/${path}`)

const adminArgsSchema = z.array(z.string()).length(1).optional()

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { adminArgs } = context.params as { adminArgs?: string[] }

  const result = adminArgsSchema.safeParse(adminArgs)
  if (!result.success) {
    return {
      notFound: true,
    }
  }

  if (adminArgs && !TAB_PATHS.includes(adminArgs[0] as TabPath)) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      tabPath: adminArgs ? adminArgs[0] : undefined,
    },
  }
}

export default function PageAdmin(props: { tabPath?: TabPath }) {
  const tabName = props.tabPath
    ? TAB_NAMES[TAB_PATHS.indexOf(props.tabPath)]
    : TAB_NAMES[0]

  return (
    <>
      <Title prefix={`${tabName ? tabName + ' - ' : ''}管理後台`} />
      <div className='relative flex h-full w-full'>
        <Tab
          tabNames={TAB_NAMES}
          currentTabName={tabName}
          tabLinks={TAB_LINKS}
        />
        <div className='relative h-full grow'>
          <div className='absolute inset-0'>
            {tabName === '餐點' && <Commodities />}
            {tabName === '菜單' && <Menus />}
            {tabName === '分類' && <Categories />}
            {tabName === '選項' && <OptionSets />}
            {tabName === '儲值' && <Deposits />}
          </div>
        </div>
      </div>
    </>
  )
}
