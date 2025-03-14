import { UserRole } from '@prisma/client'
import { useEffect, useState } from 'react'

import Button from '@/components/core/Button'
import Divider from '@/components/core/Divider'
import { useDialog } from '@/components/core/Dialog'
import { SpinnerBlock } from '@/components/core/Spinner'
import TextInput from '@/components/form/base/TextInput'
import Toggle from '@/components/form/base/Toggle'
import { useStore } from '@/lib/client/store'
import trpc from '@/lib/client/trpc'
import { validateRole } from '@/lib/common'

export default function Settings() {
  // TRPC
  const utils = trpc.useUtils()
  const userQuery = trpc.user.get.useQuery(undefined)
  const userTokenQuery = trpc.user.getToken.useQuery(undefined)
  const updateUserTokenMutation = trpc.user.updateToken.useMutation({
    onSuccess: () => {
      utils.user.getToken.invalidate()
    },
  })
  const updateUserSettingsMutation = trpc.user.updateSettings.useMutation({
    onSuccess: () => {
      utils.user.get.invalidate()
    },
  })
  const testPushMutation = trpc.user.testPushNotification.useMutation()

  // State
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
            <Divider text='通知' />
            {/* 開啟通知 */}
            {isPushApiSupported &&
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission !== 'granted' && (
                <OptionField
                  title='開啟通知權限'
                  description='允許通知權限，當您的訂單或菜單有更新時，會收到通知，以及顯示即時數字在圖示上。'
                  loading={false}
                  checked={false}
                  onChange={(checked) => {
                    if (checked) {
                      if (
                        typeof window !== 'undefined' &&
                        'Notification' in window &&
                        Notification.permission === 'denied'
                      ) {
                        showDialog({
                          title: '無法開啟通知',
                          content: '您已經拒絕了通知權限，請至瀏覽器設定開啟。',
                        })
                        return
                      }
                      if (
                        typeof window !== 'undefined' &&
                        'Notification' in window
                      ) {
                        Notification.requestPermission().then((permission) => {
                          if (permission === 'granted') {
                            window.location.reload()
                          }
                        })
                      }
                    }
                  }}
                />
              )}
            {isPushApiSupported &&
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted' &&
              userTokenQuery.data && (
                <>
                  <OptionField
                    title='背景通知'
                    description='當您的訂單或菜單有更新時，就算 App 不在前景也會收到通知。'
                    loading={updateUserTokenMutation.isPending}
                    checked={userTokenQuery.data.notificationEnabled}
                    onChange={(checked) => {
                      updateUserTokenMutation.mutate({
                        notificationEnabled: checked,
                      })
                    }}
                  >
                    {userTokenQuery.data.notificationEnabled ? (
                      <Button
                        className='ml-auto mt-2 p-2'
                        label='測試通知'
                        textClassName='text-sm'
                        onClick={() => testPushMutation.mutate()}
                        isBusy={testPushMutation.isPending}
                        isLoading={testPushMutation.isPending}
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
            {/* 菜單更新通知 */}
            <OptionField
              title='菜單更新通知'
              description='當即時點餐狀態變更時，會收到通知。'
              checked={userQuery.data?.optMenuNotify ?? false}
              loading={
                updateUserSettingsMutation.isPending || userQuery.isLoading
              }
              onChange={(checked) => {
                updateUserSettingsMutation.mutate({
                  optMenuNotify: checked,
                })
              }}
            />
            {/* 自動結帳 */}
            <Divider text='結帳' />
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
                  <Divider text='管理員設定' />
                  {/* 訂單通知音效 */}
                  <OptionField
                    title='訂單通知音效'
                    description='當有新訂單時，系統會發出通知音效。'
                    loading={false}
                    checked={posNotificationSound}
                    onChange={setPOSNotificationSound}
                  />
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
  className?: string
}) {
  return (
    <section className={props.className}>
      <div className='flex'>
        <div className='grow'>
          <h2 className='mb-1 text-lg font-bold'>{props.title}</h2>
          <p className='text-xs text-stone-400'>{props.description}</p>
        </div>
        <div className='relative ml-4 h-fit w-fit text-right'>
          {props.loading && (
            <div className='absolute inset-0 z-[1] bg-white/70'>
              <SpinnerBlock text='' className='h-6 w-6' />
            </div>
          )}
          <Toggle
            checked={props.checked}
            onChange={(event) => props.onChange(event.target.checked)}
            disabled={props.loading}
          />
        </div>
      </div>
      {props.children}
    </section>
  )
}
