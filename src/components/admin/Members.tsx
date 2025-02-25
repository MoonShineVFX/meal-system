import { useCallback, useMemo, useState } from 'react'

import Error from '@/components/core/Error'
import Image from '@/components/core/Image'
import SearchBar from '@/components/core/SearchBar'
import Table from '@/components/core/Table'
import CheckBox from '@/components/form/base/CheckBox'
import trpc from '@/lib/client/trpc'
import { settings } from '@/lib/common'
import { twMerge } from 'tailwind-merge'
import Button from '../core/Button'

export default function Members() {
  // State
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [showDeactivated, setShowDeactivated] = useState<boolean>(false)

  // Trpc
  const { data, isError, error } = trpc.user.getStatistics.useQuery({
    showDeactivated,
  })
  const updateUserAuthority = trpc.user.updateAuthority.useMutation()

  const filteredMembers = useMemo(() => {
    if (!data) return []
    if (!searchKeyword || searchKeyword === '') return data

    return data.filter((user) =>
      user.name.toLowerCase().includes(searchKeyword.toLowerCase()),
    )
  }, [searchKeyword, data])

  const handleMemberClientOrder = useCallback(
    async (userId: string, enabled: boolean) => {
      updateUserAuthority.mutate({
        userId,
        authority: 'CLIENT_ORDER',
        enabled,
      })
    },
    [updateUserAuthority],
  )

  if (isError) return <Error description={error.message} />

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-4 p-8'>
        {/* Top */}
        <div className='flex items-center gap-4'>
          {/* search */}
          <SearchBar
            placeholder='搜尋會員'
            isLoading={false}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
          />
          {/* deactivated */}
          <label className='mr-auto flex cursor-pointer items-center gap-2'>
            <CheckBox
              checked={showDeactivated}
              onChange={(e) => setShowDeactivated(e.target.checked)}
            />
            <span className='text-sm font-bold text-stone-500'>
              顯示已停用會員
            </span>
          </label>
        </div>
        {/* Table */}
        <Table
          data={filteredMembers}
          columns={[
            {
              name: '圖片',
              render: (user) => (
                <div className='relative aspect-square h-8 overflow-hidden rounded-full'>
                  <Image
                    alt='profile'
                    src={
                      user.profileImage
                        ? user.profileImage.path
                        : settings.RESOURCE_PROFILE_PLACEHOLDER
                    }
                    sizes='64px'
                  />
                </div>
              ),
            },
            {
              sort: (a, b) => a.name.localeCompare(b.name),
              name: '名稱',
              align: 'left',
              render: (user) =>
                user.isDeactivated ? (
                  <p className='text-red-400'>{user.name}</p>
                ) : (
                  user.name
                ),
            },
            {
              sort: true,
              name: '點數',
              align: 'right',
              render: (user) => user.pointBalance,
            },
            {
              sort: true,
              name: '夢想幣',
              align: 'right',
              render: (user) => user.creditBalance,
            },
            {
              sort: true,
              name: '下單數',
              align: 'left',
              render: (user) => user._count.orders,
            },
            {
              sort: true,
              name: '身分',
              align: 'left',
              cellClassName: 'text-sm font-bold',
              render: (user) => user.role,
            },
            {
              name: '客戶招待權限',
              align: 'left',
              cellClassName: 'text-sm',
              render: (user) => {
                const canClientOrder = user.authorities.includes('CLIENT_ORDER')

                return (
                  <Button
                    textClassName='px-3 py-1 text-sm'
                    className={twMerge(
                      'disabled:opacity-50 hover:bg-stone-200',
                      canClientOrder
                        ? 'bg-amber-400 text-amber-800 hover:bg-amber-500'
                        : 'bg-stone-100 text-stone-400',
                    )}
                    label={canClientOrder ? '已開通' : '未開通'}
                    theme='secondary'
                    onClick={() =>
                      handleMemberClientOrder(user.id, !canClientOrder)
                    }
                    isLoading={
                      updateUserAuthority.isPending &&
                      updateUserAuthority.variables?.userId === user.id
                    }
                  />
                )
              },
            },
            {
              hideByDefault: true,
              name: '狀態',
              align: 'left',
              cellClassName: 'text-sm',
              sort: (a, b) => {
                if (a.isDeactivated && !b.isDeactivated) return 1
                if (!a.isDeactivated && b.isDeactivated) return -1
                return 0
              },
              render: (user) =>
                user.isDeactivated ? (
                  <p className='text-red-400'>已停用</p>
                ) : (
                  '啟用中'
                ),
            },
          ]}
        />
      </div>
    </div>
  )
}
