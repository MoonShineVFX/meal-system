import { useRouter } from 'next/router'
import VirtualNumpad from './VirtualNumpad'
import { useState } from 'react'
import trpc from '@/trpc/client/client'
import { Transition } from '@headlessui/react'

export default function Payment(props: { isOpen: boolean }) {
  const router = useRouter()
  const { data: userData } = trpc.user.info.useQuery(undefined)
  const [paymentAmount, setPaymentAmount] = useState(0)

  const handleClose = () => {
    router.push('/')
  }

  return (
    <Transition
      show={props.isOpen}
      enter='transition-opacity duration-150'
      enterFrom='opacity-0'
      enterTo='opacity-100'
      leave='transition-opacity duration-150'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
      onClick={handleClose}
      className='fixed inset-0 z-50 select-none bg-stone-800/50 backdrop-blur-[2px]'
    >
      <div className='mx-auto flex h-full w-full max-w-lg flex-col'>
        <Transition.Child
          enter='transition-all duration-150'
          enterFrom='scale-75'
          enterTo='scale-100'
          leave='transition-all duration-150'
          leaveFrom='scale-100'
          leaveTo='scale-75'
          className='flex grow flex-col justify-center'
        >
          {/* Panel */}
          <div className='mx-8 flex flex-col rounded-xl bg-stone-100 p-6'>
            <div className='text-center text-2xl'>付款金額</div>
            <div className='text-center text-6xl'>{paymentAmount}</div>
          </div>
        </Transition.Child>
        {/* Keyboard */}
        <Transition.Child
          enter='transition-all duration-150'
          enterFrom='translate-y-full'
          enterTo='translate-y-0'
          leave='transition-all duration-150'
          leaveFrom='translate-y-0'
          leaveTo='translate-y-full'
        >
          <VirtualNumpad
            onChange={setPaymentAmount}
            onAccept={() => console.log('pay')}
            onCancel={handleClose}
            maxValue={(userData?.credits ?? 0) + (userData?.points ?? 0)}
          />
        </Transition.Child>
      </div>
    </Transition>
  )
}
