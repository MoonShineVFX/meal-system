import { useEffect, useState, useCallback } from 'react'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

import { useDialog } from '@/components/core/Dialog'
import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import { CategoryDatas } from '@/lib/client/trpc'
import { useFormDialog } from '../core/FormDialog'
import SortableList from '@/components/core/SortableList'

type UniformCategories =
  | CategoryDatas
  | CategoryDatas[number]['childCategories']
type SubCategory = CategoryDatas[number]['childCategories'][number]

function CATEGORY_STRING(isRoot: boolean) {
  return isRoot ? '主分類' : '子分類'
}

export default function Categories() {
  const categoryQuery = trpc.category.get.useQuery()
  const commodityQuery = trpc.commodity.get.useQuery()
  const [selectedRootCategory, setSelectedRootCategory] = useState<
    CategoryDatas[number] | null
  >(null)
  const rootOrdersMutation = trpc.category.updateOrders.useMutation()
  const subOrdersMutation = trpc.category.updateOrders.useMutation()
  const { showFormDialog, formDialog } = useFormDialog()
  const { showDialog, dialog } = useDialog()

  // set selected root category
  useEffect(() => {
    const { data } = categoryQuery
    if (data) {
      if (selectedRootCategory) {
        const foundCategory = data.find(
          (rootCategory) => rootCategory.id === selectedRootCategory.id,
        )
        if (foundCategory) {
          setSelectedRootCategory(foundCategory)
          return
        }
      }
      setSelectedRootCategory(data[0])
    }
  }, [categoryQuery.data])

  /* Handles */
  // Reorders
  const handleReorder = useCallback(
    (reorderedCategories: UniformCategories) => {
      if (reorderedCategories.length === 0) return
      const isRoot = 'childCategories' in reorderedCategories[0]
      const mutation = isRoot ? rootOrdersMutation : subOrdersMutation
      mutation.mutate({
        ids: reorderedCategories.map((category) => category.id),
        type: isRoot ? 'root' : 'sub',
      })
    },
    [],
  )

  // Assign commodities
  const handleSubcategoryAssignCommodities = useCallback(
    (category: SubCategory) => {
      showFormDialog({
        title: `編輯屬於 ${category.name} 的餐點`,
        inputs: {
          commodityIds: {
            label: '餐點',
            defaultValue: commodityQuery
              .data!.filter((commodity) =>
                commodity.categories.some((cat) => cat.id === category.id),
              )
              .map((commodity) => commodity.id.toString()),
            data: commodityQuery.data!.map((commodity) => ({
              label: commodity.name,
              value: commodity.id.toString(),
            })),
            type: 'select',
            attributes: { multiple: true },
          },
        },
        useMutation: trpc.category.updateCommodities.useMutation,
        onSubmit(formData, mutation) {
          const commodityIds = formData.commodityIds.map((id) => parseInt(id))
          mutation.mutate({
            commodityIds,
            id: category.id,
          })
        },
      })
    },
    [commodityQuery.data],
  )

  // Rename
  const handleCategoryRename = useCallback(
    (category: UniformCategories[number]) => {
      const isRoot = 'childCategories' in category
      showFormDialog({
        title: `重新命名 ${CATEGORY_STRING(isRoot)}`,
        inputs: {
          categoryName: {
            label: '分類名稱',
            defaultValue: category.name,
            type: 'text',
            options: { required: '請輸入分類名稱' },
            attributes: { placeholder: category.name },
          },
        },
        useMutation: trpc.category.update.useMutation,
        onSubmit(formData, mutation) {
          mutation.mutate({
            id: category.id,
            name: formData.categoryName,
            type: isRoot ? 'root' : 'sub',
          })
        },
      })
    },
    [],
  )

  // Create
  const handleCategoryCreate = useCallback(
    (isRoot: boolean) => {
      if (!selectedRootCategory || !categoryQuery.data) return
      const order = isRoot
        ? categoryQuery.data.length
        : selectedRootCategory.childCategories.length
      showFormDialog({
        title: `新增 ${CATEGORY_STRING(isRoot)}`,
        inputs: {
          categoryName: {
            label: '分類名稱',
            type: 'text',
            options: { required: '請輸入分類名稱' },
          },
        },
        useMutation: trpc.category.create.useMutation,
        onSubmit(formData, mutation) {
          mutation.mutate({
            name: formData.categoryName,
            order: order,
            rootId: isRoot ? undefined : selectedRootCategory!.id,
          })
        },
      })
    },
    [selectedRootCategory, categoryQuery.data],
  )

  // Move
  const handleCategoriesMove = useCallback(
    (selectedIds: UniformCategories[number]['id'][]) => {
      showFormDialog({
        title: `移動 ${selectedIds.length} 個 子分類`,
        inputs: {
          rootCategoryId: {
            label: '主分類名稱',
            data: categoryQuery
              .data!.filter(
                (rootCategory) => rootCategory.id !== selectedRootCategory?.id,
              )
              .map((rootCategory) => ({
                label: rootCategory.name,
                value: rootCategory.id.toString(),
              })),
            type: 'select',
            options: { required: '請選擇要移動的主分類' },
          },
        },
        useMutation: trpc.category.updateRoot.useMutation,
        onSubmit(formData, mutation) {
          const rootCategoryId = formData.rootCategoryId
          mutation.mutate({
            ids: selectedIds,
            rootId: Number(rootCategoryId),
          })
        },
      })
    },
    [selectedRootCategory, categoryQuery.data],
  )

  // Delete
  const handleCategoriesDelete = useCallback(
    (selectedIds: UniformCategories[number]['id'][], isRoot: boolean) => {
      showDialog({
        title: `刪除 ${CATEGORY_STRING(isRoot)}`,
        content: `確定要刪除 ${selectedIds.length} 個${CATEGORY_STRING(
          isRoot,
        )}嗎？`,
        useMutation: trpc.category.deleteMany.useMutation,
        mutationOptions: {
          ids: selectedIds,
          type: isRoot ? 'root' : 'sub',
        },
        cancel: true,
      })
    },
    [],
  )

  // Filter
  if (categoryQuery.isError || commodityQuery.isError)
    return (
      <Error
        description={
          categoryQuery.error?.message ??
          commodityQuery.error?.message ??
          '未知錯誤'
        }
      />
    )
  if (categoryQuery.isLoading || commodityQuery.isLoading)
    return <SpinnerBlock />

  return (
    <div className='grid h-full grid-cols-3 gap-8 p-8'>
      {/* Root Categories */}
      <SortableList
        header='主分類'
        items={categoryQuery.data}
        childrenClassName={(category) =>
          category.id === selectedRootCategory?.id ? 'bg-stone-100' : ''
        }
        onReorder={handleReorder}
        onReordering={rootOrdersMutation.isLoading}
        onCreate={() => handleCategoryCreate(true)}
        onCreateLabel='新增主分類'
        onRename={handleCategoryRename}
        batchEditButtons={[
          {
            label: '刪除',
            onClick: (ids) => handleCategoriesDelete(ids, true),
            isDanger: true,
          },
        ]}
      >
        {(category) => (
          <button
            disabled={selectedRootCategory?.id === category.id}
            className='group/button ml-auto rounded-2xl p-2 text-sm text-stone-400 transition-opacity disabled:opacity-0 hover:bg-stone-100 active:scale-95'
            onClick={() => setSelectedRootCategory(category)}
          >
            {category.childCategories?.length} 個子分類
            <ChevronRightIcon className='inline h-4 w-4 stroke-1 transition-opacity group-disabled/button:opacity-0' />
          </button>
        )}
      </SortableList>
      {/* Sub Categories */}
      {selectedRootCategory !== null && (
        <SortableList
          key={`sub-cat-${selectedRootCategory.id}`}
          header={`${selectedRootCategory.name} (${selectedRootCategory.childCategories.length})`}
          items={selectedRootCategory.childCategories}
          onReorder={handleReorder}
          onReordering={subOrdersMutation.isLoading}
          onCreate={() => handleCategoryCreate(false)}
          onCreateLabel='新增子分類'
          onRename={handleCategoryRename}
          batchEditButtons={[
            {
              label: '刪除',
              onClick: (ids) => handleCategoriesDelete(ids, false),
              isDanger: true,
            },
            { label: '移動', onClick: handleCategoriesMove },
          ]}
        >
          {(category) => (
            <button
              className='ml-auto rounded-2xl p-2 text-sm text-stone-400 hover:bg-stone-100 active:scale-95'
              onClick={() => handleSubcategoryAssignCommodities(category)}
            >
              <span>{category._count?.commodities} 個餐點</span>
            </button>
          )}
        </SortableList>
      )}
      {formDialog}
      {dialog}
    </div>
  )
}
