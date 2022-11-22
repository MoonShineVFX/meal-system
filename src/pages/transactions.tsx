import TransactionList from '@/components/TransactionsList'
import { Tab } from '@headlessui/react'
import { Role } from '@prisma/client'
import { Transition } from '@headlessui/react'

import { validateRole } from '@/lib/common'
import { useStore } from '@/lib/client/store'

export default function PageTransactions() {
  const user = useStore((state) => state.user)

  if (!user) return null

  const isStaff = validateRole(user.role, Role.STAFF)
  const isAdmin = validateRole(user.role, Role.ADMIN)

  return (
    <div>
      <Tab.Group>
        <Tab.List className='fixed top-0 z-10 w-full max-w-lg border-b-2 bg-amber-400 px-4 pt-4 xs:rounded-b-xl'>
          <TransactionsTab text='交易紀錄' />
          {isStaff && <TransactionsTab text='收款紀錄' />}
          {isAdmin && <TransactionsTab text='全部' />}
        </Tab.List>
        <Tab.Panels className='pt-[5rem] pb-16'>
          {/* User */}
          <TransactionsPanel>
            <TransactionList />
          </TransactionsPanel>
          {/* Staff */}
          {isStaff && (
            <TransactionsPanel>
              <TransactionList role={Role.STAFF} />
            </TransactionsPanel>
          )}
          {/* Server */}
          {isAdmin && (
            <TransactionsPanel>
              <TransactionList role={Role.ADMIN} />
            </TransactionsPanel>
          )}
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

function TransactionsTab(props: { text: string }) {
  return (
    <Tab className='group select-none px-1 py-1 text-lg tracking-widest text-stone-800/75 focus:outline-none ui-selected:border-b-4 ui-selected:border-stone-800 ui-selected:font-bold ui-selected:text-stone-800'>
      <div className='rounded-lg py-3 px-2 group-hover:bg-stone-800/10 group-active:bg-stone-800/10'>
        {props.text}
      </div>
    </Tab>
  )
}

function TransactionsPanel(props: { children: React.ReactNode }) {
  return (
    <Tab.Panel>
      <Transition
        appear={true}
        show={true}
        enter='transition-all duration-200'
        enterFrom='opacity-0'
        enterTo='opacity-100'
        leave='transition-opacity duration-200'
        leaveFrom='opacity-100'
        leaveTo='opacity-0'
      >
        {props.children}
      </Transition>
    </Tab.Panel>
  )
}
