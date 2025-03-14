import { PencilIcon } from '@heroicons/react/24/outline'
import { useCallback, useState } from 'react'

import Button from '@/components/core/Button'
import { useDialog } from '@/components/core/Dialog'
import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'
import Error from '@/components/core/Error'
import SearchBar from '@/components/core/SearchBar'
import { SpinnerBlock } from '@/components/core/Spinner'
import Table from '@/components/core/Table'
import { useFormDialog } from '@/components/form/FormDialog'
import CheckBox from '@/components/form/base/CheckBox'
import trpc, { MenuActiveDatas } from '@/lib/client/trpc'
import { getMenuName } from '@/lib/common'

function getSortWeight(menu: MenuActiveDatas[number]) {
  let weight = 0
  switch (menu.type) {
    case 'LIVE':
      weight = 4133910600000
      break
    case 'RETAIL':
      weight = 4133910500000
      break
    case 'BREAKFAST':
      weight = 0.9
      break
    case 'LUNCH':
      weight = 0.8
      break
    case 'TEA':
      weight = 0.7
      break
    case 'DINNER':
      weight = 0.6
      break
  }
  if (menu.date) {
    weight += menu.date.getTime()
  }

  return weight
}

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
  const menuUpdateMutation = trpc.menu.createOrEdit.useMutation()

  const handleEditMenu = useCallback(
    (
      menu?: Extract<NonNullable<typeof data>[number], { _count: any }>,
      isEdit: boolean = false,
    ) => {
      const title = isEdit ? '編輯菜單' : '新增菜單'

      showFormDialog({
        title,
        inputs: {
          intro: {
            defaultValue: {
              name: menu?.name,
              description: menu?.description,
              createSupplier: false,
              supplierId:
                menu?.supplierId === null ? undefined : menu?.supplierId,
            },
            data: isEdit
              ? {
                  disableCreateSupplier: true,
                }
              : undefined,
            label: '基本資料',
            type: 'menuIntro',
          },
          limitPerUser: {
            defaultValue: menu?.limitPerUser ?? 0,
            label: '每人限購數量',
            type: 'number',
          },
          typeDate: {
            label: '類型',
            type: 'menuTypeDate',
            data: {
              isEdit: isEdit,
            },
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
            data: {
              isEdit: isEdit,
            },
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
          mutation.mutate({
            ...formData,
            name: formData.intro.name,
            description: formData.intro.description,
            type: formData.typeDate.type,
            date: formData.typeDate.date,
            publishedDate: formData.typeDate.publishedDate,
            closedDate: formData.typeDate.closedDate,
            createSupplier: formData.intro.createSupplier,
            supplierId: formData.intro.supplierId,
            isEdit: isEdit,
            id: menu?.id,
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
            data?.sort((a, b) => {
              return getSortWeight(b) - getSortWeight(a)
            }) as Extract<NonNullable<typeof data>[number], { _count: any }>[]
          }
          idField='id'
          onSelectedIdsChange={setSelectedIds}
          onDataFilter={
            searchKeyword === ''
              ? undefined
              : (rows) =>
                  rows.filter((row) =>
                    getMenuName(row)?.includes(searchKeyword),
                  )
          }
          columns={[
            {
              name: '名稱',
              align: 'left',
              unhidable: true,
              hint: (row) => getMenuName(row) || '未命名',
              render: (row) => {
                const isMenuClosed =
                  row.closedDate !== null && row.closedDate < new Date()
                return (
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
                    {['LIVE', 'RETAIL'].includes(row.type) && (
                      <DropdownMenuItem
                        label={isMenuClosed ? '開啟' : '關閉'}
                        onClick={() =>
                          menuUpdateMutation.mutate({
                            isEdit: true,
                            type: row.type,
                            closedDate: isMenuClosed ? null : new Date(),
                            liveMenuNotify: true,
                          })
                        }
                      />
                    )}
                    {!['LIVE', 'RETAIL'].includes(row.type) && (
                      <DropdownMenuItem
                        label={<span className='text-red-400'>刪除</span>}
                        onClick={() => handleMenusDelete([row.id])}
                      />
                    )}
                  </DropdownMenu>
                )
              },
              sort: true,
            },
            {
              name: '狀態',
              render: (row) =>
                row.closedDate && new Date() > row.closedDate ? (
                  <p className='text-red-300'>已關閉</p>
                ) : row.publishedDate && new Date() < row.publishedDate ? (
                  <p className='text-stone-400'>未發佈</p>
                ) : (
                  <p className='text-green-400'>公開</p>
                ),
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
                row.limitPerUser === 0 ? (
                  <p className='text-sm text-stone-400'>無限制</p>
                ) : (
                  row.limitPerUser
                ),
            },
            {
              name: '發佈時間',
              align: 'right',
              cellClassName: 'text-sm',
              render: (row) =>
                row.publishedDate?.toLocaleString('zh-TW', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: false,
                }) ?? <p className='text-stone-400'>未設定</p>,
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
              cellClassName: 'text-sm',
              render: (row) =>
                row.closedDate?.toLocaleString('zh-TW', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: false,
                }) ?? <p className='text-stone-400'>未設定</p>,
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
