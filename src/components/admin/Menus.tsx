import { useState } from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'

import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import Error from '@/components/core/Error'
import SearchBar from '@/components/core/SearchBar'
import Table from '@/components/core/Table'
import Button from '@/components/core/Button'
import { getMenuName } from '@/lib/common'

export default function Menus() {
  const [isIncludeClosed, setIsIncludeClosed] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const { data, error, isError, isLoading } = trpc.menu.getActives.useQuery({
    includeClosed: isIncludeClosed,
    withDetails: true,
  })

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  const now = new Date()

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-4 p-8'>
        {/* Top */}
        <div className='flex items-center gap-4'>
          <SearchBar
            placeholder='搜尋菜單'
            isLoading={false}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
          />
          <label className='mr-auto flex cursor-pointer items-center gap-2'>
            <input
              type='checkbox'
              className='focus:ring-none h-5 w-5 cursor-pointer rounded-lg border-stone-300 text-yellow-500 focus:ring-transparent'
              checked={isIncludeClosed}
              onChange={(e) => setIsIncludeClosed(e.target.checked)}
            />
            <span className='font-bold text-stone-500'>顯示已關閉菜單</span>
          </label>
          <Button
            label='新增菜單'
            className='py-3 px-4'
            textClassName='font-bold'
          />
        </div>
        {/* Table */}
        <Table
          data={data as Extract<typeof data[number], { _count: any }>[]}
          idField='id'
          columns={[
            {
              name: '顯示名稱',
              align: 'left',
              unhidable: true,
              hint: (row) => getMenuName(row) || '未命名',
              render: (row) => (
                <button className='group/edit flex items-center rounded-2xl p-2 hover:bg-black/5 active:scale-90'>
                  {getMenuName(row)}
                  <PencilIcon className='ml-1 inline h-3 w-3 stroke-1 text-stone-400 transition-transform group-hover/edit:rotate-45' />
                </button>
              ),
              sort: true,
            },
            {
              name: '狀態',
              render: (row) =>
                row.closedDate && now > row.closedDate
                  ? '已關閉'
                  : row.publishedDate && now < row.publishedDate
                  ? '未發佈'
                  : '公開',
              sort: true,
            },
            {
              name: '描述',
              cellClassName: 'max-w-[30ch] overflow-hidden overflow-ellipsis',
              sort: true,
              render: (row) => row.description,
              hideByDefault: true,
            },
            {
              name: '每人限點',
              align: 'right',
              sort: true,
              render: (row) =>
                row.limitPerUser === 0 ? '無限制' : row.limitPerUser,
            },
            {
              name: '發佈時間',
              align: 'right',
              render: (row) =>
                row.publishedDate?.toLocaleString('zh-TW', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: false,
                }) ?? '未設定',
              hint: (row) => row.publishedDate?.toLocaleString() ?? '未設定',
              sort: (a, b) => {
                if (!a.publishedDate && !b.publishedDate) return 0
                if (!a.publishedDate) return 1
                if (!b.publishedDate) return -1
                return a.publishedDate.getTime() - b.publishedDate.getTime()
              },
            },
            {
              name: '訂購數',
              render: (row) => row._count.orders,
              sort: true,
            },
            {
              name: '關閉時間',
              align: 'right',
              render: (row) =>
                row.closedDate?.toLocaleString('zh-TW', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: false,
                }) ?? '未設定',
              hint: (row) => row.closedDate?.toLocaleString() ?? '未設定',
              sort: (a, b) => {
                if (!a.closedDate && !b.closedDate) return 0
                if (!a.closedDate) return 1
                if (!b.closedDate) return -1
                return a.closedDate.getTime() - b.closedDate.getTime()
              },
            },
            {
              name: '創建日期',
              render: (row) => row.createdAt.toLocaleDateString(),
              hint: (row) => row.createdAt.toLocaleString(),
              sort: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
              hideByDefault: true,
            },
            {
              name: '修改日期',
              render: (row) => row.updatedAt.toLocaleDateString(),
              hint: (row) => row.updatedAt.toLocaleString(),
              sort: (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
              hideByDefault: true,
            },
          ]}
        />
      </div>
    </div>
  )
}
