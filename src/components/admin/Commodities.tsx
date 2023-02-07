import { useCallback, useState } from 'react'

import Button from '@/components/core/Button'
import Image from '@/components/core/Image'
import Table from '@/components/core/Table'
import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import Error from '@/components/core/Error'
import { settings, getMenuName } from '@/lib/common'
import { useFormDialog } from '@/components/core/FormDialog'

export default function Commodities() {
  const { showFormDialog, formDialog } = useFormDialog()
  const { data, error, isError, isLoading } = trpc.commodity.get.useQuery()
  const [isLoadingDialog, setIsLoadingDialog] = useState(false)
  const context = trpc.useContext()

  const handleAddCommodity = useCallback(async () => {
    // query needed data
    setIsLoadingDialog(true)
    const categoryData = await context.category.get.fetch()
    const menuData = await context.menu.getActives.fetch({})
    setIsLoadingDialog(false)

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
          type: 'select',
          data: categoryData.map((category) => ({
            label: category.name,
            children: category.childCategories.map((childCategory) => ({
              label: childCategory.name,
              value: childCategory.id.toString(),
            })),
          })),
          attributes: { multiple: true },
        },
        menus: {
          label: '菜單',
          column: 2,
          type: 'select',
          data: [
            {
              label: '即時 / 零售',
              children: menuData
                .filter((menu) => menu.date === null)
                .map((menu) => ({
                  label: getMenuName(menu)!,
                  value: menu.id.toString(),
                })),
            },
            {
              label: '預訂',
              children: menuData
                .filter((menu) => menu.date !== null)
                .map((menu) => ({
                  label: getMenuName(menu)!,
                  value: menu.id.toString(),
                })),
            },
          ],
          attributes: { multiple: true },
        },
        optionSets: {
          label: '選項',
          column: 3,
          type: 'optionSets',
        },
      },
      useMutation: trpc.optionSet.create.useMutation,
      onSubmit(formData, mutation) {
        console.log(formData)
        // mutation.mutate({})
      },
    })
  }, [data]) // dev for frequent re-render

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
              isLoading={isLoadingDialog}
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
              cellClassName: 'min-w-[18ch]',
              sort: true,
              render: (row) => row.name,
            },
            {
              name: '描述',
              cellClassName: 'max-w-[30ch] overflow-hidden overflow-ellipsis',
              sort: true,
              render: (row) => row.description,
            },
            {
              name: '價錢',
              sort: true,
              render: (row) => row.price,
            },
          ]}
        />
      </div>
      {formDialog}
    </div>
  )
}
