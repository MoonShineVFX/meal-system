import { GetServerSideProps } from 'next'
import z from 'zod'

import Bonus from '@/components/admin/Bonus'
import Categories from '@/components/admin/Categories'
import Commodities from '@/components/admin/Commodities'
import Deposits from '@/components/admin/Deposits'
import Members from '@/components/admin/Members'
import Menus from '@/components/admin/Menus'
import OptionSets from '@/components/admin/OptionSets'
import Orders from '@/components/admin/Orders'
import Suppliers from '@/components/admin/Suppliers'
import Transactions from '@/components/admin/Transactions'
import Tab from '@/components/core/Tab'
import Title from '@/components/core/Title'

const TAB_NAMES = [
  '餐點',
  '菜單',
  '店家',
  '分類',
  '選項',
  '訂單',
  '交易',
  '儲值',
  '獎勵',
  '會員'
] as const
// type TabName = typeof TAB_NAMES[number]
const TAB_PATHS = [
  'commodities',
  'menus',
  'suppliers',
  'categories',
  'optionsets',
  'orders',
  'transactions',
  'deposits',
  'bonus',
  'members'
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
          dividers={[2, 4, 8]}
        />
        <div className='relative h-full grow'>
          <div className='absolute inset-0 sm:pt-[2rem] lg:pt-0'>
            {tabName === '餐點' && <Commodities />}
            {tabName === '菜單' && <Menus />}
            {tabName === '店家' && <Suppliers />}
            {tabName === '分類' && <Categories />}
            {tabName === '選項' && <OptionSets />}
            {tabName === '訂單' && <Orders />}
            {tabName === '交易' && <Transactions />}
            {tabName === '儲值' && <Deposits />}
            {tabName === '獎勵' && <Bonus />}
            {tabName === '會員' && <Members />}
          </div>
        </div>
      </div>
    </>
  )
}
