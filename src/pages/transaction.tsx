import { BanknotesIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { useIsomorphicLayoutEffect, useMediaQuery } from 'usehooks-ts'

import Title from '@/components/core/Title'
import TransactionDetail from '@/components/transaction/TransactionDetail'
import TransactionList from '@/components/transaction/TransactionList'
import Wallet from '@/components/transaction/Wallet'
import { parseAsInteger, useQueryState } from 'nuqs'

export default function PageTransaction() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isLg, setIsLg] = useState<boolean | undefined>(undefined)
  const matches = useMediaQuery('(min-width: 1024px)')
  const [transactionId] = useQueryState(
    't',
    parseAsInteger.withOptions({ history: 'push' }),
  )

  useIsomorphicLayoutEffect(() => {
    setIsLg(matches)
  }, [matches])

  return (
    <>
      <Title prefix='交易紀錄' />
      <div className='group flex h-full'>
        <AnimatePresence initial={false} mode='popLayout'>
          {/* Transaction List */}
          {(isLg || !transactionId) && (
            <motion.section
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: isLg ? 0 : 0.3, type: 'spring' }}
              className='w-full @container lg:grid lg:w-1/2'
              key='transaction-list'
            >
              <div className='relative h-full'>
                <div
                  ref={scrollRef}
                  className='ms-scroll absolute inset-0 grid grid-rows-[min-content_auto] overflow-y-auto @xl:grid-cols-[minmax(0,max-content)_minmax(0,1fr)] @xl:grid-rows-none'
                >
                  <Wallet />
                  <TransactionList
                    activeTransactionId={transactionId ?? undefined}
                    scrollRef={scrollRef}
                  />
                </div>
              </div>
            </motion.section>
          )}
          {/* Transaction Detail */}
          {(isLg || transactionId) && (
            <motion.section
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: isLg ? 0 : 0.3, type: 'spring' }}
              className='relative z-[1] w-full shadow-lg lg:w-1/2'
              key={`transaction-detail-${transactionId}`}
            >
              {transactionId ? (
                <TransactionDetail transactionId={transactionId} />
              ) : (
                <div className='flex h-full flex-col items-center justify-center gap-4'>
                  <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                    <BanknotesIcon className='h-12 w-12 text-stone-400' />
                  </div>
                  <h1 className='indent-[0.1em] text-lg font-bold tracking-widest text-stone-500'>
                    請選擇交易紀錄
                  </h1>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
