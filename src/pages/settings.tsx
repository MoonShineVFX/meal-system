import { UserRole } from '@prisma/client'
import { useEffect, useState } from 'react'

import Toggle from '@/components/form/base/Toggle'
import TextInput from '@/components/form/base/TextInput'
import { SpinnerBlock } from '@/components/core/Spinner'
import trpc from '@/lib/client/trpc'
import { validateRole } from '@/lib/common'
import { useStore } from '@/lib/client/store'
import { useDialog } from '@/components/core/Dialog'
import Button from '@/components/core/Button'

export default function Settings() {
  const userQuery = trpc.user.get.useQuery(undefined)
  const userTokenQuery = trpc.user.getToken.useQuery(undefined)
  const updateUserTokenMutation = trpc.user.updateToken.useMutation()
  const testPushMutation = trpc.user.testPushNotification.useMutation()
  const {
    printerApi,
    setPrinterApi,
    qrcodeAutoCheckout,
    posNotificationSound,
    setQRCodeAutoCheckout,
    setPOSNotificationSound,
  } = useStore((state) => ({
    printerApi: state.printerAPI_local,
    setPrinterApi: state.setPrinterAPI,
    qrcodeAutoCheckout: state.qrcodeAutoCheckout_local,
    posNotificationSound: state.posNotificationSound_local,
    setQRCodeAutoCheckout: state.setQRCodeAutoCheckout,
    setPOSNotificationSound: state.setPOSNotificationSound,
  }))
  const [isPushApiSupported, setIsPushApiSupported] = useState(false)
  const { showDialog, dialog } = useDialog()

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    ) {
      setIsPushApiSupported(true)
    }
  }, [])

  return (
    <div className='relative h-full w-full'>
      <div className='ms-scroll absolute inset-0 flex justify-center overflow-y-auto overflow-x-hidden'>
        <div className='h-min min-h-full max-w-lg grow p-4 lg:p-8'>
          <h1 className='mb-4 text-xl font-bold lg:mb-8'>設定</h1>
          <div className='flex flex-col gap-4 lg:gap-6'>
            {/* 開啟通知 */}
            {isPushApiSupported && Notification.permission !== 'granted' && (
              <OptionField
                title='開啟通知權限'
                description='允許通知權限，當您訂單有更新時，會收到通知，以及顯示即時數字在圖示上。'
                loading={false}
                checked={false}
                onChange={(checked) => {
                  if (checked) {
                    if (Notification.permission === 'denied') {
                      showDialog({
                        title: '無法開啟通知',
                        content: '您已經拒絕了通知權限，請至瀏覽器設定開啟。',
                      })
                      return
                    }
                    Notification.requestPermission().then((permission) => {
                      if (permission === 'granted') {
                        window.location.reload()
                      }
                    })
                  }
                }}
              />
            )}
            {isPushApiSupported &&
              Notification.permission === 'granted' &&
              userTokenQuery.data && (
                <>
                  <OptionField
                    title='背景通知'
                    description='當您訂單有更新時，就算 App 不在前景也會收到通知。'
                    loading={updateUserTokenMutation.isLoading}
                    checked={userTokenQuery.data.notificationEnabled}
                    onChange={(checked) => {
                      updateUserTokenMutation.mutate({
                        notificationEnabled: checked,
                      })
                    }}
                  >
                    {userTokenQuery.data.notificationEnabled || true ? (
                      <Button
                        className='ml-auto mt-2 p-2'
                        label='測試通知'
                        textClassName='text-sm'
                        onClick={() => testPushMutation.mutate()}
                        isBusy={testPushMutation.isLoading}
                        isLoading={testPushMutation.isLoading}
                      />
                    ) : null}
                  </OptionField>
                  {'setAppBadge' in navigator && (
                    <OptionField
                      title='App 圖示數量標籤'
                      description='顯示處理中的即時訂單數量在 APP 圖示上。'
                      loading={userTokenQuery.isLoading}
                      checked={userTokenQuery.data.badgeEnabled}
                      onChange={(checked) => {
                        updateUserTokenMutation.mutate({
                          badgeEnabled: checked,
                        })
                        if (!checked) {
                          if (
                            'clearAppBadge' in navigator &&
                            typeof navigator.clearAppBadge === 'function'
                          ) {
                            navigator.clearAppBadge()
                          }
                        }
                      }}
                    />
                  )}
                </>
              )}
            {/* 自動結帳 */}
            <OptionField
              title='QRCode 自動結帳'
              description='當您掃描 QRCode 付款時，系統會自動結帳，無需再按結帳按鈕。'
              checked={qrcodeAutoCheckout}
              loading={false}
              onChange={setQRCodeAutoCheckout}
            />
            {/* 管理員 */}
            {userQuery.data?.role &&
              validateRole(userQuery.data.role, UserRole.STAFF) && (
                <>
                  {/* 訂單通知音效 */}
                  <OptionField
                    title='訂單通知音效'
                    description='當有新訂單時，系統會發出通知音效。'
                    loading={false}
                    checked={posNotificationSound}
                    onChange={setPOSNotificationSound}
                  />
                  <div className='my-4 h-[2px] bg-stone-200'></div>
                  {/* 標籤機設定 */}
                  <OptionField
                    title='自訂標籤機 API 網址'
                    description='覆蓋預設的標籤機 API 網址，此設定存放在個別裝置。'
                    loading={false}
                    checked={printerApi.enabled ?? false}
                    onChange={(checked) =>
                      setPrinterApi({
                        ...printerApi,
                        enabled: checked,
                      })
                    }
                  >
                    {printerApi.enabled ? (
                      <div className='flex w-full justify-end'>
                        <TextInput
                          className='mt-2 w-full max-w-md'
                          placeholder='http://localhost:5000'
                          value={printerApi.url}
                          onChange={(event) =>
                            setPrinterApi({
                              ...printerApi,
                              url: event.target.value,
                            })
                          }
                        />
                      </div>
                    ) : null}
                  </OptionField>
                </>
              )}
          </div>
        </div>
      </div>
      {dialog}
    </div>
  )
}

function OptionField(props: {
  title: string
  description: string
  loading: boolean
  children?: JSX.Element | JSX.Element[] | null
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <section>
      <div className='flex'>
        <div className='grow'>
          <h2 className='mb-1 text-lg font-bold'>{props.title}</h2>
          <p className='text-xs text-stone-400'>{props.description}</p>
        </div>
        <div className='w-16 pl-4 text-right'>
          {props.loading ? (
            <SpinnerBlock text='' className='h-6 w-6' />
          ) : (
            <Toggle
              checked={props.checked}
              onChange={(event) => props.onChange(event.target.checked)}
            />
          )}
        </div>
      </div>
      {props.children}
    </section>
  )
}
