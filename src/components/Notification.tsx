import { atom, useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { XCircleIcon } from '@heroicons/react/24/outline'

import { settings } from '@/lib/common'

/* Type */
export enum NotificationType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  INFO = 'INFO',
}

export type NotificationMessage = {
  type: NotificationType
  message: string
  time: number
}

const iconMap = {
  [NotificationType.SUCCESS]: [CheckCircleIcon, 'text-green-500'],
  [NotificationType.ERROR]: [XCircleIcon, 'text-red-500'],
  [NotificationType.INFO]: [ExclamationCircleIcon, 'text-yellow-500'],
}

/* State */
const notificationAtom = atom<NotificationMessage[]>([])
export const addNotificationAtom = atom(
  null,
  async (get, set, message: Omit<NotificationMessage, 'time'>) => {
    const now = new Date().getTime()
    const newNotificationMessage = { ...message, time: now }
    set(notificationAtom, [newNotificationMessage, ...get(notificationAtom)])
    setTimeout(
      () =>
        set(
          notificationAtom,
          get(notificationAtom).filter((message) => message.time !== now),
        ),
      settings.NOTIFICATION_DURATION,
    )
  },
)

/* Component */
export default function Notification() {
  const [notifications] = useAtom(notificationAtom)

  return (
    <div className='pointer-events-none fixed inset-0 flex justify-center'>
      {notifications.map((notification, i) => (
        <NotificationPod
          key={notification.time}
          notification={notification}
          index={i}
        />
      ))}
    </div>
  )
}

function NotificationPod(props: {
  notification: NotificationMessage
  index: number
}) {
  const { notification } = props
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsOpen(true), 100)
    setTimeout(
      () => setIsOpen(false),
      settings.NOTIFICATION_DURATION - settings.NOTIFICATION_DELAY,
    )
  }, [])

  const [Icon, iconStyle] = iconMap[notification.type]
  const targetY = isOpen ? 60 : 0 // top padding
  const gap = props.index !== 0 ? ` + (100% + 12px) * ${props.index}` : '' // gap

  return (
    <div
      className='absolute top-0 flex items-center gap-1 rounded-xl border-[1px] border-stone-200 bg-stone-100 py-2 px-3 text-stone-700 shadow-lg transition-all'
      style={{
        transform: `translateY(calc(${targetY}px - 100%${gap}))`,
        transitionDuration: `${settings.NOTIFICATION_DELAY}ms`,
        opacity: isOpen ? 1 : 0,
      }}
    >
      <Icon className={`h-5 w-5 ${iconStyle}`} />
      <p className='text-stone-700'>{notification.message}</p>
    </div>
  )
}
