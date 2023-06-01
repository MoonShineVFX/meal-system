import { useCallback, useState } from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'

import trpc, { SupplierDatas } from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import SearchBar from '@/components/core/SearchBar'
import Table from '@/components/core/Table'
import { SpinnerBlock } from '@/components/core/Spinner'
import { useFormDialog } from '@/components/form/FormDialog'
import { useDialog } from '@/components/core/Dialog'
import Button from '@/components/core/Button'
import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'

export default function Suppliers() {
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const { data, isError, error, isLoading } = trpc.supplier.getList.useQuery({
    countCOMs: true,
  })
  const { showFormDialog, formDialog } = useFormDialog()
  const { showDialog, dialog } = useDialog()

  const handleSupplierCreateOrEdit = useCallback(
    (supplier?: SupplierDatas[number]) => {
      const isEdit = !!supplier
      showFormDialog({
        title: isEdit ? '編輯店家' : '新增店家',
        inputs: {
          name: {
            label: '店家名稱',
            type: 'text',
            defaultValue: isEdit ? supplier!.name : '',
          },
          description: {
            label: '描述 (可選)',
            type: 'textarea',
            defaultValue: isEdit ? supplier!.description : '',
          },
        },
        useMutation: trpc.supplier.createOrEdit.useMutation,
        onSubmit(formData, mutation) {
          mutation.mutate({
            name: formData.name,
            description: formData.description,
            id: isEdit ? supplier!.id : undefined,
          })
        },
      })
    },
    [],
  )

  const handleSuppliersDelete = useCallback(
    (ids: number[]) => {
      if (!data) return
      showDialog({
        title: '刪除店家',
        content:
          ids.length > 1
            ? `確定要刪除 ${ids.length} 個店家嗎？`
            : `確定要刪除 ${data.find((c) => c.id === ids[0])!.name} 嗎？`,
        useMutation: trpc.supplier.deleteMany.useMutation,
        mutationOptions: {
          ids: ids,
        },
        cancel: true,
        confirmButtonTheme: 'danger',
      })
    },
    [data],
  )

  if (isError) return <Error description={error.message} />

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-4 p-8'>
        {/* Top */}
        <div className='flex items-center gap-4'>
          <SearchBar
            placeholder='搜尋店家'
            className='mr-auto'
            isLoading={isLoading}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
          />
          {selectedIds.length > 0 && (
            <Button
              label='刪除'
              className='py-3 px-2'
              textClassName='font-bold text-red-400'
              theme='support'
              onClick={() => handleSuppliersDelete(selectedIds)}
            />
          )}
          <Button
            label='新增店家'
            className='py-3 px-4'
            textClassName='font-bold'
            onClick={handleSupplierCreateOrEdit}
          />
        </div>
        {/* Table */}
        {isLoading ? (
          <SpinnerBlock />
        ) : (
          <Table
            data={data as Extract<SupplierDatas[number], { _count: object }>[]}
            onDataFilter={(suppliers) => {
              if (searchKeyword === '') return suppliers
              return suppliers.filter(
                (supplier) =>
                  supplier.name.includes(searchKeyword) ||
                  supplier.description.includes(searchKeyword),
              )
            }}
            idField='id'
            onSelectedIdsChange={setSelectedIds}
            columns={[
              {
                name: '名稱',
                align: 'left',
                sort: true,
                render: (supplier) => (
                  <DropdownMenu
                    className='group/edit flex items-center rounded-2xl p-2 text-base hover:bg-black/5 active:scale-90'
                    label={
                      <>
                        {supplier.name}
                        <PencilIcon className='ml-1 inline h-3 w-3 stroke-1 text-stone-400 transition-transform group-hover/edit:rotate-45' />
                      </>
                    }
                  >
                    <DropdownMenuItem
                      label='編輯'
                      onClick={() => handleSupplierCreateOrEdit(supplier)}
                    />
                    <DropdownMenuItem
                      label={<span className='text-red-400'>刪除</span>}
                      onClick={() => handleSuppliersDelete([supplier.id])}
                    />
                  </DropdownMenu>
                ),
              },
              {
                name: '描述',
                cellClassName: 'max-w-[30ch] overflow-hidden overflow-ellipsis',
                align: 'left',
                sort: true,
                render: (supplier) => supplier.description,
              },
              {
                name: '餐點數量',
                align: 'right',
                sort: true,
                render: (supplier) => supplier._count.commodities,
              },
              {
                name: '菜單數量',
                align: 'right',
                sort: true,
                render: (supplier) => supplier._count.menus,
              },
            ]}
          />
        )}
      </div>
      {formDialog}
      {dialog}
    </div>
  )
}
