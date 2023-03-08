import { useCallback, useState } from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'

import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import Error from '@/components/core/Error'
import SearchBar from '@/components/core/SearchBar'
import Table from '@/components/core/Table'
import Button from '@/components/core/Button'
import { getMenuName } from '@/lib/common'
import { useFormDialog } from '@/components/form/FormDialog'
import CheckBox from '@/components/form/base/CheckBox'
import { useDialog } from '@/components/core/Dialog'
import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'

export default function Menus() {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const { showFormDialog, formDialog } = useFormDialog()
  const [isIncludeClosed, setIsIncludeClosed] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const { data, error, isError, isLoading } = trpc.menu.getActives.useQuery({
    includeClosed: isIncludeClosed,
    withDetails: true,
  })
  const { showDialog, dialog } = useDialog()

  const handleEditMenu = useCallback(
    (
      menu?: Extract<NonNullable<typeof data>[number], { _count: any }>,
      isEdit: boolean = false,
    ) => {
      const title = isEdit ? '編輯菜單' : '新增菜單'
      showFormDialog({
        title,
        inputs: {
          name: {
            label: '名稱',
            type: 'text',
            defaultValue: menu?.name,
            attributes: {
              placeholder: '菜單名稱 (可選)',
            },
          },
          description: {
            defaultValue: menu?.description,
            label: '描述',
            type: 'textarea',
            attributes: {
              style: { minHeight: '9rem' },
            },
          },
          limitPerUser: {
            defaultValue: menu?.limitPerUser ?? 0,
            label: '每人限購數量',
            type: 'number',
          },
          typeDate: {
            label: '類型',
            type: 'menuTypeDate',
            defaultValue:
              isEdit && menu
                ? {
                    type: menu.type,
                    date: menu.date,
                    publishedDate: menu.publishedDate,
                    closedDate: menu.closedDate,
                  }
                : undefined,
            options: {
              required: '請選擇類型 / 日期',
            },
          },
          coms: {
            column: 2,
            label: '餐點',
            type: 'com',
            className: 'h-full',
            defaultValue: menu
              ? menu.commodities.map((com) => ({
                  commodityId: com.commodity.id,
                  limitPerUser: com.limitPerUser,
                  stock: com.stock,
                }))
              : undefined,
          },
        },
        style: {
          gridTemplateColumns: '1fr 3fr',
        },
        useMutation: trpc.menu.createOrEdit.useMutation,
        onSubmit(formData, mutation) {
          console.log(formData)
          mutation.mutate({
            ...formData,
            type: formData.typeDate.type,
            date: formData.typeDate.date,
            publishedDate: formData.typeDate.publishedDate,
            closedDate: formData.typeDate.closedDate,
            isEdit: isEdit,
          })
        },
        closeConfirm: {
          title: `取消${title}`,
          content: `確定要取消${title}嗎？`,
          cancel: true,
          cancelText: '繼續',
          confirmText: '確定取消',
          confirmButtonTheme: 'danger',
        },
      })
    },
    [],
  )

  // Delete
  const handleMenusDelete = useCallback(
    (selectedIds: number[]) => {
      if (!data) return
      showDialog({
        title: '刪除菜單',
        content:
          selectedIds.length > 1
            ? `確定要刪除 ${selectedIds.length} 個菜單嗎？`
            : `確定要刪除 ${
                data.find((c) => c.id === selectedIds[0])!.name
              } 嗎？`,
        useMutation: trpc.menu.deleteMany.useMutation,
        mutationOptions: {
          ids: selectedIds,
        },
        cancel: true,
        confirmButtonTheme: 'danger',
      })
    },
    [data],
  )

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

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
            <CheckBox
              checked={isIncludeClosed}
              onChange={(e) => setIsIncludeClosed(e.target.checked)}
            />
            <span className='text-sm font-bold text-stone-500'>
              顯示已關閉菜單
            </span>
          </label>
          {selectedIds.length > 0 && (
            <Button
              label='刪除'
              className='py-3 px-2'
              textClassName='font-bold text-red-400'
              theme='support'
              onClick={() => handleMenusDelete(selectedIds)}
            />
          )}
          <Button
            label='新增菜單'
            className='py-3 px-4'
            textClassName='font-bold'
            onClick={() => handleEditMenu()}
          />
        </div>
        {/* Table */}
        <Table
          data={
            data.sort((a, b) => {
              const isAReserved = !['live', 'retail'].includes(a.type)
              const isBReserved = !['live', 'retail'].includes(b.type)
              if (isAReserved && !isBReserved) return 1
              if (!isAReserved && isBReserved) return -1
              return b.id - a.id
            }) as Extract<typeof data[number], { _count: any }>[]
          }
          idField='id'
          onSelectedIdsChange={setSelectedIds}
          columns={[
            {
              name: '名稱',
              align: 'left',
              unhidable: true,
              hint: (row) => getMenuName(row) || '未命名',
              render: (row) => (
                <DropdownMenu
                  className='group/edit flex items-center rounded-2xl p-2 text-base hover:bg-black/5 active:scale-90'
                  label={
                    <>
                      {getMenuName(row) ?? '未命名'}
                      <PencilIcon className='ml-1 inline h-3 w-3 stroke-1 text-stone-400 transition-transform group-hover/edit:rotate-45' />
                    </>
                  }
                >
                  <DropdownMenuItem
                    label='編輯'
                    onClick={() => handleEditMenu(row, true)}
                  />
                  <DropdownMenuItem
                    label='引用'
                    onClick={() => handleEditMenu(row)}
                  />
                  <DropdownMenuItem
                    label={<span className='text-red-400'>刪除</span>}
                    onClick={() => handleMenusDelete([row.id])}
                  />
                </DropdownMenu>
              ),
              sort: true,
            },
            {
              name: '狀態',
              render: (row) =>
                row.closedDate && new Date() > row.closedDate
                  ? '已關閉'
                  : row.publishedDate && new Date() < row.publishedDate
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
              name: '餐點數',
              render: (row) => row.commodities.length,
              hint: (row) =>
                row.commodities.map((c) => c.commodity.name).join('\n'),
              sort: true,
            },
            {
              name: '訂購數',
              render: (row) => row._count.orders,
              sort: true,
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
      {formDialog}
      {dialog}
    </div>
  )
}
