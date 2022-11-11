import TransactionList from '@/components/TransactionsList'
import { Tab } from '@headlessui/react'
import { Role } from '@prisma/client'

import { validateRole } from '@/utils/settings'
import trpc from '@/trpc/client/client'

export default function PageTransactions() {
  const { data: userData } = trpc.user.info.useQuery(undefined)

  if (!userData) return null

  const isStaff = validateRole(userData!.role, Role.STAFF)
  const isAdmin = validateRole(userData!.role, Role.ADMIN)

  return (
    <div className=''>
      <Tab.Group>
        <Tab.List className='fixed top-0 w-full max-w-lg border-b-2 bg-amber-400 px-4 pt-4 xs:rounded-b-xl'>
          <TransactionsTab text='交易紀錄' />
          {isStaff && <TransactionsTab text='收款紀錄' />}
          {isAdmin && <TransactionsTab text='全部' />}
        </Tab.List>
        <Tab.Panels className='mt-28 px-4 pb-20'>
          {/* User */}
          <Tab.Panel>
            <TransactionList />
          </Tab.Panel>
          {/* Staff */}
          {isStaff && (
            <Tab.Panel>
              <TransactionList role={Role.STAFF} />
            </Tab.Panel>
          )}
          {/* Server */}
          {isAdmin && (
            <Tab.Panel>
              <TransactionList role={Role.ADMIN} />
            </Tab.Panel>
          )}
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

function TransactionsTab(props: { text: string }) {
  return (
    <Tab className='group select-none px-1 py-1 text-lg tracking-widest text-stone-800/75 focus:outline-none ui-selected:border-b-4 ui-selected:border-stone-800 ui-selected:font-bold ui-selected:text-stone-800'>
      <div className='rounded-lg py-3 px-3 group-hover:bg-stone-800/10 group-active:bg-stone-800/10'>
        {props.text}
      </div>
    </Tab>
  )
}
