import { UserRole } from '@prisma/client'
import { useEffect, useState } from 'react'

import Toggle from '@/components/form/base/Toggle'
import TextInput from '@/components/form/base/TextInput'
import { SpinnerBlock } from '@/components/core/Spinner'
import trpc from '@/lib/client/trpc'
import { validateRole } from '@/lib/common'

export default function Settings() {
  const userQuery = trpc.user.get.useQuery(undefined)
  const userSettingsMutation = trpc.user.updateSettings.useMutation()
  const [customPrinterApi, setCustomPrinterApi] = useState<{
    enabled: boolean
    url: string
  }>(
    typeof window !== 'undefined' &&
      localStorage &&
      localStorage.getItem('customPrinterApi')
      ? JSON.parse(localStorage.getItem('customPrinterApi')!)
      : {
          enabled: false,
          url: 'http://localhost:5000',
        },
  )

  useEffect(() => {
    localStorage.setItem('customPrinterApi', JSON.stringify(customPrinterApi))
  }, [customPrinterApi])

  return (
    <div className='relative h-full w-full'>
      <div className='ms-scroll absolute inset-0 flex justify-center overflow-y-auto overflow-x-hidden'>
        <div className='h-min min-h-full max-w-5xl grow p-4 lg:p-8'>
          <h1 className='mb-4 text-xl font-bold'>設定</h1>
          <div className='flex flex-col gap-4'>
            {/* 自動結帳 */}
            <OptionField
              title='QRCode 自動結帳'
              description='當您掃描 QRCode 付款時，系統會自動結帳，無需再按結帳按鈕。'
              loading={
                userQuery.data?.settings === undefined ||
                userSettingsMutation.isError
              }
              checked={userQuery.data?.settings?.qrcodeAutoCheckout ?? false}
              onChange={(checked) =>
                userSettingsMutation.mutate({ qrcodeAutoCheckout: checked })
              }
            />
            {/* 管理員 */}
            {userQuery.data?.role &&
              validateRole(userQuery.data.role, UserRole.STAFF) && (
                <>
                  {/* 訂單通知音效 */}
                  <OptionField
                    title='訂單通知音效'
                    description='當有新訂單時，系統會發出通知音效。'
                    loading={
                      userQuery.data?.settings === undefined ||
                      userSettingsMutation.isError
                    }
                    checked={
                      userQuery.data?.settings?.notificationSound ?? false
                    }
                    onChange={(checked) =>
                      userSettingsMutation.mutate({
                        notificationSound: checked,
                      })
                    }
                  />
                  {/* 標籤機設定 */}
                  <OptionField
                    title='自訂標籤機 API 網址'
                    description='覆蓋預設的標籤機 API 網址，此設定存放在個別裝置。'
                    loading={
                      userQuery.data?.settings === undefined ||
                      userSettingsMutation.isError
                    }
                    checked={customPrinterApi.enabled ?? false}
                    onChange={(checked) =>
                      setCustomPrinterApi((prev) => ({
                        ...prev,
                        enabled: checked,
                      }))
                    }
                  >
                    {customPrinterApi.enabled ? (
                      <TextInput
                        className='mt-2 w-full'
                        placeholder='http://localhost:5000'
                        value={customPrinterApi.url}
                        onChange={(event) =>
                          setCustomPrinterApi((prev) => ({
                            ...prev,
                            url: event.target.value,
                          }))
                        }
                      />
                    ) : null}
                  </OptionField>
                </>
              )}
          </div>
        </div>
      </div>
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
