import {
  useStore,
  NotificationType,
  NotificationPayload,
} from '@/lib/client/store'
import { useEffect, useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { XCircleIcon } from '@heroicons/react/24/outline'

import { settings } from '@/lib/common'

/* Type */
const iconMap = {
  [NotificationType.SUCCESS]: [CheckCircleIcon, 'text-green-500'],
  [NotificationType.ERROR]: [XCircleIcon, 'text-red-500'],
  [NotificationType.INFO]: [ExclamationCircleIcon, 'text-yellow-400'],
}

/* Component */
export default function Notification() {
  const notifications = useStore((state) => state.notifications)

  return (
    <div className='pointer-events-none fixed inset-0 z-40 flex justify-center'>
      {notifications.map((notification, i) => (
        <NotificationPod
          key={notification.id}
          notification={notification}
          index={i}
        />
      ))}
    </div>
  )
}

function NotificationPod(props: {
  notification: NotificationPayload
  index: number
}) {
  const { notification } = props
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsOpen(true), 100)
    setTimeout(
      () => setIsOpen(false),
      settings.NOTIFICATION_DURATION_MS - settings.NOTIFICATION_DELAY_MS,
    )
  }, [])

  const [Icon, iconStyle] = iconMap[notification.type]
  const isDesktop = window.innerWidth > 1024
  const targetLength = isOpen ? (isDesktop ? 5.625 : 4.5) : 0 // border padding
  const gap =
    props.index !== 0
      ? ` + (100% + ${isDesktop ? 1.5 : 1}rem) * ${props.index}`
      : ''

  return (
    <div
      className='absolute top-0 flex items-center gap-1 rounded-2xl border border-stone-300 bg-white py-3 px-4 shadow-lg transition-all lg:p-4'
      style={{
        transform: `translateY(calc(${targetLength}rem - 100%${gap}))`,
        transitionDuration: `${settings.NOTIFICATION_DELAY_MS}ms`,
        opacity: isOpen ? 1 : 0,
      }}
    >
      <Icon className={`h-5 w-5 ${iconStyle}`} />
      <p className='text-stone-700'>{notification.message}</p>
    </div>
  )
}
