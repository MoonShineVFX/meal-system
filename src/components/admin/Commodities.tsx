import { useCallback } from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'

import Button from '@/components/core/Button'
import Image from '@/components/core/Image'
import Table from '@/components/core/Table'
import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import Error from '@/components/core/Error'
import { settings, getMenuName } from '@/lib/common'
import { useFormDialog } from '@/components/form/FormDialog'

export default function Commodities() {
  const { showFormDialog, formDialog } = useFormDialog()
  const { data, error, isError, isLoading } = trpc.commodity.get.useQuery({
    includeMenus: true,
  })

  const handleAddCommodity = useCallback(() => {
    // show
    showFormDialog({
      title: '新增餐點',
      inputs: {
        image: {
          column: 1,
          label: '圖片',
          type: 'image',
          className: 'row-span-full',
        },
        name: {
          label: '名稱',
          type: 'text',
          attributes: {
            placeholder: '餐點名稱',
          },
          options: {
            required: '請輸入名稱',
          },
        },
        description: {
          label: '描述',
          type: 'textarea',
        },
        price: {
          label: '價錢',
          type: 'number',
          defaultValue: 0,
          options: {
            required: '請輸入價錢',
            min: { value: 0, message: '價錢不能小於 0' },
            max: { value: 9999, message: '價錢不能大於 9999' },
          },
        },
        categories: {
          label: '分類',
          column: 2,
          type: 'categories',
        },
        menus: {
          label: '菜單',
          column: 2,
          type: 'com',
        },
        optionSets: {
          label: '選項',
          column: 3,
          type: 'optionSets',
        },
      },
      useMutation: trpc.commodity.create.useMutation,
      onSubmit(formData, mutation) {
        console.log(formData)
        mutation.mutate({
          name: formData.name,
          price: formData.price,
          description: formData.description,
          optionSets: formData.optionSets,
          categoryIds: formData.categories,
          imageId: formData.image,
          menus: formData.menus,
        })
      },
      closeConfirm: {
        title: '取消新增餐點',
        content: '確定要取消新增餐點嗎？',
        cancel: true,
        cancelText: '繼續新增',
        confirmText: '確定取消',
        confirmButtonTheme: 'danger',
      },
    })
  }, [data]) // dev for frequent re-render

  const handleEditCommodity = useCallback((commodityId: number) => {
    console.log(commodityId)
  }, [])

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col p-8'>
        {/* Top */}
        <div className='flex justify-between'>
          <div>餐點</div>
          <div className='p-4'>
            <Button
              label='新增餐點'
              className='py-3 px-4'
              textClassName='font-bold'
              onClick={handleAddCommodity}
            />
          </div>
        </div>
        {/* Table */}
        <Table
          data={data}
          columns={[
            {
              name: '圖片',
              render: (row) => (
                <div className='relative aspect-square h-16 overflow-hidden rounded-2xl'>
                  <Image
                    className='object-cover'
                    src={row.image?.path ?? settings.RESOURCE_FOOD_PLACEHOLDER}
                    sizes='64px'
                    alt={row.name}
                  />
                </div>
              ),
            },
            {
              name: '名稱',
              sort: true,
              hint: (row) => row.name,
              render: (row) => (
                <button
                  className='group/edit flex items-center rounded-2xl p-2 hover:bg-black/5 active:scale-90'
                  onClick={() => handleEditCommodity(row.id)}
                >
                  {row.name}
                  <PencilIcon className='ml-1 inline h-3 w-3 stroke-1 text-stone-400 transition-transform group-hover/edit:rotate-45' />
                </button>
              ),
              sort: (a, b) => a.name.localeCompare(b.name), //TODO: fix ts error
            },
            {
              name: '價錢',
              sort: true,
              render: (row) => row.price,
            },
            {
              name: '描述',
              cellClassName: 'max-w-[30ch] overflow-hidden overflow-ellipsis',
              sort: true,
              render: (row) => row.description,
            },
            {
              name: '分類',
              sort: true,
              render: (row) => row.categories.map((c) => c.name).join(', '),
            },
            {
              name: '選項',
              sort: true,
              hint: (row) =>
                row.optionSets
                  ? row.optionSets
                      .map((o) => `${o.name}: ${o.options.join(', ')}`)
                      .join('\n')
                  : '無選項',
              render: (row) =>
                row.optionSets
                  ? row.optionSets
                      .map((o) => `${o.name}(${o.options.length})`)
                      .join(', ')
                  : '無選項',
            },
            {
              name: '菜單',
              cellClassName: 'max-w-[30ch] overflow-hidden overflow-ellipsis',
              sort: true,
              hint: (row) =>
                row.onMenus.length > 0
                  ? [...row.onMenus]
                      .reverse()
                      .map((com) => getMenuName(com.menu))
                      .join('\n')
                  : '無菜單',
              render: (row) =>
                row.onMenus.length > 0
                  ? [...row.onMenus]
                      .reverse()
                      .map((com) => getMenuName(com.menu))
                      .join(', ')
                  : '無菜單',
            },
          ]}
          idField='id'
          onSelectedIdsChange={(ids) => console.log(ids)}
        />
      </div>
      {formDialog}
    </div>
  )
}
