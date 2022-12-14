import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

import Button from '@/components/core/Button'

export default function DialogCore(props: {
  open: boolean
  onClose: (isConfirm: boolean | undefined) => void
  title: string
  content: JSX.Element | string
  cancel?: boolean
}) {
  return (
    <Transition show={props.open} as={Fragment}>
      <Dialog onClose={props.onClose} className='relative z-50'>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black/30'></div>
        </Transition.Child>
        {/* Dialog */}
        <div className='fixed inset-0 flex items-center justify-center p-4 sm:p-8'>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0 scale-95'
            enterTo='opacity-100 scale-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100 scale-100'
            leaveTo='opacity-0 scale-95'
          >
            <Dialog.Panel className='mx-auto flex max-w-md flex-col gap-4 rounded-2xl bg-white p-4 shadow-lg sm:p-6'>
              <section className='sm:flex sm:gap-4'>
                <div className='mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100'>
                  <ExclamationTriangleIcon className='h-6 w-6 text-red-600' />
                </div>
                <div className='mt-2 flex flex-col items-center gap-2 sm:mt-0 sm:items-start'>
                  <Dialog.Title className='text-lg font-bold tracking-wider sm:indent-[0.05em]'>
                    {props.title}
                  </Dialog.Title>
                  <div className='text-center text-sm text-stone-400 sm:text-start'>
                    {props.content}
                  </div>
                </div>
              </section>
              {/* Buttons */}
              <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-4'>
                {props.cancel && (
                  <Button
                    onClick={() => props.onClose(false)}
                    className='h-12 grow font-bold sm:max-w-[50%]'
                    label='取消'
                    theme='support'
                  ></Button>
                )}
                <Button
                  onClick={() => props.onClose(true)}
                  className='h-10 grow font-bold sm:max-w-[50%]'
                  textClassName='fond-bold'
                  label='確認'
                  theme='main'
                ></Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
