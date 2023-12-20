import { useMemo, useState } from 'react'

import Error from '@/components/core/Error'
import Image from '@/components/core/Image'
import Table from '@/components/core/Table'
import trpc from '@/lib/client/trpc'
import { settings } from '@/lib/common'
import SearchBar from '@/components/core/SearchBar'

export default function Members() {
  // State
  const [searchKeyword, setSearchKeyword] = useState<string>('')

  // Trpc
  const { data, isError, error } = trpc.user.getStatistics.useQuery()

  const filteredMembers = useMemo(() => {
    if (!data) return []
    if (!searchKeyword || searchKeyword === '') return data

    return data.filter((user) =>
      user.name.toLowerCase().includes(searchKeyword.toLowerCase()),
    )
  }, [searchKeyword])

  if (isError) return <Error description={error.message} />

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-4 p-8'>
        {/* Top */}
        <div className='flex items-center gap-4'>
          <SearchBar
            placeholder='搜尋會員'
            isLoading={false}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
          />
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
              sort: true,
              name: '名稱',
              align: 'left',
              render: (user) => user.name,
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
              name: '權限',
              align: 'left',
              cellClassName: 'text-sm',
              render: (user) => user.authorities.join(', '),
            },
          ]}
        />
      </div>
    </div>
  )
}
