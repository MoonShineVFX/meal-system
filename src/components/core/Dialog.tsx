import { Dialog, Transition } from '@headlessui/react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import Button from '@/components/core/Button'
import { useStore } from '@/lib/client/store'
import type { UseMutationResult } from '@/lib/client/trpc'

type DialogProps<T extends UseMutationResult> = {
  open: boolean
  onClose: () => void
  title: string
  content: JSX.Element | string
  contentClassName?: string
  confirmText?: string
  confirmButtonTheme?: Parameters<typeof Button>[0]['theme']
  cancel?: boolean
  cancelText?: string
  icon?: 'info' | 'warning' | 'success' | null
  useMutation?: () => T
  mutationOptions?: Parameters<T['mutate']>[0]
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  as?: 'form' | 'div'
  panelProps?: Parameters<typeof Dialog.Panel>[0]
  sectionClassName?: string
}

export default function DialogCore<T extends UseMutationResult>(
  props: DialogProps<T>,
) {
  const buttonState = useStore((state) => state.dialogButtonState)
  const setButtonState = useStore((state) => state.setDialogButtonState)
  const { className: panelClassName, ...panelPropsRest } =
    props.panelProps ?? {}
  const mutation = props.useMutation ? props.useMutation() : undefined
  const handleConfirm = useCallback(() => {
    if (mutation && props.mutationOptions) {
      mutation.mutate(props.mutationOptions, {
        onSuccess: () => {
          props.onClose()
        },
      })
      return
    }
    if (props.onConfirm) {
      const result = props.onConfirm()
      if (result instanceof Promise) {
        setButtonState('loading')
        result.then(() => {
          setButtonState('success')
          props.onClose()
        })
      } else {
        props.onClose()
      }
    } else {
      props.onClose()
    }
  }, [mutation, props.mutationOptions, props.onClose, setButtonState])

  useEffect(() => {
    mutation?.reset()
    setButtonState('null')
  }, [props.open])

  const isLoading =
    mutation?.isPending ||
    mutation?.isSuccess ||
    buttonState === 'loading' ||
    buttonState === 'success'

  return (
    <Transition show={props.open} as={Fragment} appear={true}>
      <Dialog
        onClose={() => {
          if (!isLoading) props.onClose()
        }}
        className='relative z-50'
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-200'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-100'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black/30'></div>
        </Transition.Child>
        {/* Dialog */}
        <div className='fixed inset-0 flex items-center justify-center p-4 sm:p-8'>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-200'
            enterFrom='opacity-0 scale-75'
            enterTo='opacity-100 scale-100'
            leave='ease-in duration-100'
            leaveFrom='opacity-100 scale-100'
            leaveTo='opacity-0 scale-75'
          >
            <Dialog.Panel
              as={props.as}
              className={twMerge(
                'mx-auto flex max-w-md flex-col gap-6 rounded-2xl bg-white p-6 shadow-lg',
                panelClassName,
              )}
              {...panelPropsRest}
            >
              <section
                className={twMerge('sm:flex sm:gap-4', props.sectionClassName)}
              >
                <div
                  className={twMerge(
                    'mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                    (props.icon === 'warning' || props.icon === undefined) &&
                      'bg-red-100',
                    props.icon === 'info' && 'bg-yellow-100',
                    props.icon === 'success' && 'bg-green-100',
                    props.icon === null && 'hidden',
                  )}
                >
                  {(props.icon === 'warning' || props.icon === undefined) && (
                    <ExclamationTriangleIcon className='h-8 w-8 text-red-600' />
                  )}
                  {props.icon === 'info' && (
                    <InformationCircleIcon className='h-8 w-8 text-yellow-500' />
                  )}
                  {props.icon === 'success' && (
                    <CheckCircleIcon className='h-8 w-8 text-green-500' />
                  )}
                </div>
                <div className='mt-2 flex flex-col items-center gap-2 sm:mt-0 sm:items-start'>
                  <Dialog.Title className='text-lg font-bold tracking-wider sm:indent-[0.05em]'>
                    {props.title}
                  </Dialog.Title>
                  <div
                    className={twMerge(
                      'text-center text-sm text-stone-400 sm:text-start',
                      props.contentClassName,
                    )}
                  >
                    {props.content}
                  </div>
                </div>
              </section>
              {/* Buttons */}
              <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-4'>
                {props.cancel && (
                  <Button
                    onClick={() => {
                      props.onCancel?.()
                      props.onClose()
                    }}
                    className='h-10 grow font-bold disabled:opacity-50 sm:max-w-[50%]'
                    label={props.cancelText ?? '取消'}
                    theme='support'
                    isDisabled={isLoading}
                  ></Button>
                )}
                <Button
                  isDisabled={buttonState === 'disabled'}
                  isLoading={isLoading}
                  isBusy={isLoading}
                  onClick={handleConfirm}
                  className={twMerge(
                    'h-10 grow font-bold',
                    props.cancel && 'sm:max-w-[50%]',
                    isLoading && 'pointer-events-none',
                  )}
                  textClassName='fond-bold'
                  label={props.confirmText ?? '確認'}
                  theme={props.confirmButtonTheme ?? 'main'}
                  type={props.as === 'form' ? 'submit' : 'button'}
                ></Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

type ShowDialogProps<T extends UseMutationResult> = Omit<
  DialogProps<T>,
  'open' | 'onClose'
> &
  Partial<Pick<DialogProps<T>, 'onClose'>>

export function useDialog() {
  const [isOpenDialog, setIsOpenDialog] = useState(false)
  const [props, setProps] = useState<
    ShowDialogProps<UseMutationResult> | undefined
  >(undefined)

  const showDialog = useCallback(
    <T extends UseMutationResult>(thisProps: ShowDialogProps<T>) => {
      setProps(thisProps)
      setIsOpenDialog(true)
    },
    [],
  )

  const dialog = props ? (
    <DialogCore
      {...props}
      open={isOpenDialog}
      onClose={() => {
        props.onClose?.()
        setIsOpenDialog(false)
      }}
    />
  ) : null

  return { dialog, showDialog }
}
