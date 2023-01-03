import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { XCircleIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

import {
  useStore,
  NotificationType,
  NotificationPayload,
} from '@/lib/client/store'

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
    <div className='pointer-events-none fixed inset-0 top-4 z-40 flex flex-col items-center gap-6 md:top-6 lg:top-8'>
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationPod key={notification.id} notification={notification} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function NotificationPod(props: { notification: NotificationPayload }) {
  const { notification } = props
  const removeNotification = useStore((state) => state.removeNotification)
  const router = useRouter()
  const [Icon, iconStyle] = iconMap[notification.type]

  const handleOnClick = useCallback(() => {
    if (notification.link) {
      router.push(notification.link)
    }
    removeNotification(notification.id)
  }, [])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -64, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.3 }}
      transition={{ duration: 0.4, type: 'spring' }}
      className='pointer-events-auto flex cursor-pointer items-center gap-2 rounded-2xl border border-stone-300 bg-white py-3 px-4 shadow-lg lg:p-4'
      onClick={handleOnClick}
    >
      <Icon className={`h-5 w-5 ${iconStyle}`} />
      <p className='tracking-wider text-stone-700'>{notification.message}</p>
    </motion.div>
  )
}
