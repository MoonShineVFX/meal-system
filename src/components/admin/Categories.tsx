import { useEffect, useState, useCallback } from 'react'
import {
  Reorder,
  useDragControls,
  AnimatePresence,
  motion,
} from 'framer-motion'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { PencilIcon } from '@heroicons/react/24/outline'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { twMerge } from 'tailwind-merge'

import { useDialog } from '@/components/core/Dialog'
import Button from '@/components/core/Button'
import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import { CategoryDatas } from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import { useFormDialog } from '../core/FormDialog'

export default function Categories() {
  const categoryQuery = trpc.category.get.useQuery()
  const commodityQuery = trpc.commodity.get.useQuery()
  const [selectedRootCategory, setSelectedRootCategory] = useState<
    CategoryDatas[number] | null
  >(null)
  const { showFormDialog, formDialog } = useFormDialog()

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

  const handleSubcategoryAssignCommodities = useCallback(
    (category: UniformCategory) => {
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
    <div className='flex h-full gap-8 p-8'>
      {/* Root Categories */}
      <div className='max-w-sm flex-1'>
        <CategoriesSortableList
          activeRootCategoryId={selectedRootCategory?.id}
          categories={categoryQuery.data}
          onCategoryTailClick={(category) =>
            setSelectedRootCategory(category as CategoryDatas[number])
          }
        />
      </div>
      {/* Sub Categories */}
      <AnimatePresence initial={false} mode='popLayout'>
        <motion.div
          key={selectedRootCategory?.id ?? 'none'}
          initial={{ x: '-33%', opacity: 0, scale: 0.75 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className='max-w-sm flex-1'
        >
          {selectedRootCategory !== null && (
            <CategoriesSortableList
              rootCategory={selectedRootCategory}
              rootCategories={categoryQuery.data}
              categories={selectedRootCategory.childCategories}
              onCategoryTailClick={handleSubcategoryAssignCommodities}
            />
          )}
        </motion.div>
      </AnimatePresence>
      {formDialog}
    </div>
  )
}

type UniformCategory = {
  id: number
  name: string
  order: number
  _count?: { commodities: number }
  childCategories?: {}[]
}

function CategoriesSortableList(props: {
  activeRootCategoryId?: number
  rootCategory?: CategoryDatas[number]
  rootCategories?: CategoryDatas
  categories: UniformCategory[]
  onCategoryTailClick?: (category: UniformCategory) => void
}) {
  const isRoot = props.rootCategory === undefined
  const categoryString = isRoot ? '主分類' : '子分類'

  // Hooks
  const [orderedCategories, setOrderedCategories] = useState<UniformCategory[]>(
    props.categories,
  )
  const [isBatchEdit, setIsBatchEdit] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [updateOrdersTimout, setUpdateOrdersTimout] = useState<
    NodeJS.Timeout | undefined
  >(undefined)
  const updateOrdersMutation = trpc.category.updateOrders.useMutation()

  const { showDialog, dialog } = useDialog()
  const { showFormDialog, formDialog } = useFormDialog()

  // Clean up selected ids when edit mode changed
  useEffect(() => {
    setSelectedIds([])
  }, [isBatchEdit, props.rootCategory?.id])

  // Exit edit mode when changed
  useEffect(() => {
    setIsBatchEdit(false)
  }, [orderedCategories, props.rootCategory])

  // Assign categories and filter selected ids when props changed
  useEffect(() => {
    setOrderedCategories(props.categories)

    const newIds = props.categories.map((category) => category.id)
    setSelectedIds((selectedIds) =>
      selectedIds.filter((id) => newIds.includes(id)),
    )
  }, [props.categories])

  /* Handles */
  // Rename
  const handleCategoryRename = useCallback(
    (category: UniformCategory) => {
      showFormDialog({
        title: `重新命名 ${categoryString}`,
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
    [showFormDialog],
  )

  // Create
  const handleCategoryCreate = useCallback(() => {
    showFormDialog({
      title: `新增 ${categoryString}`,
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
          order: props.categories.length,
          rootId: isRoot ? undefined : props.rootCategory?.id,
        })
      },
    })
  }, [showFormDialog, props.categories, props.rootCategory])

  // Reorder
  const handleCategoriesReorder = useCallback(
    (reorderedCategories: UniformCategory[]) => {
      setOrderedCategories(reorderedCategories)
      if (updateOrdersTimout) {
        clearTimeout(updateOrdersTimout)
      }
      setUpdateOrdersTimout(
        setTimeout(() => {
          updateOrdersMutation.mutate({
            ids: reorderedCategories.map((category) => category.id),
            type: isRoot ? 'root' : 'sub',
          })
        }, 500),
      )
    },
    [updateOrdersTimout],
  )

  // Move
  const handleCategoriesMove = useCallback(() => {
    showFormDialog({
      title: `移動 ${selectedIds.length} 個 子分類`,
      inputs: {
        rootCategoryId: {
          label: '主分類名稱',
          data: props
            .rootCategories!.filter(
              (rootCategory) => rootCategory.id !== props.rootCategory?.id,
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
  }, [selectedIds])

  // Delete
  const handleCategoriesDelete = useCallback(() => {
    showDialog({
      title: `刪除${categoryString}`,
      content: `確定要刪除 ${selectedIds.length} 個${categoryString}嗎？`,
      useMutation: trpc.category.deleteMany.useMutation,
      mutationOptions: {
        ids: selectedIds,
        type: isRoot ? 'root' : 'sub',
      },
      cancel: true,
    })
  }, [selectedIds])

  return (
    <div className='flex h-full w-full flex-col'>
      {/* Header */}
      <div className='mb-4 flex items-center'>
        <p className='flex items-center text-lg font-bold'>
          {isRoot
            ? categoryString
            : `${props.rootCategory?.name} (${props.categories.length})`}
          {updateOrdersMutation.isLoading && (
            <Spinner className='ml-2 inline h-4 w-4 text-stone-400' />
          )}
        </p>
        <div className='ml-auto flex justify-end'>
          {isBatchEdit && (
            <>
              <Button
                spinnerClassName='h-4 w-4'
                label='刪除'
                theme='support'
                textClassName='text-sm text-red-400 p-1'
                className='disabled:opacity-50'
                isDisabled={selectedIds.length === 0}
                onClick={handleCategoriesDelete}
              />
              {!isRoot && (
                <Button
                  label='移動'
                  theme='support'
                  textClassName='text-sm text-stone-400 p-1'
                  className='disabled:opacity-50'
                  isDisabled={selectedIds.length === 0}
                  onClick={handleCategoriesMove}
                />
              )}
            </>
          )}

          <Button
            label={isBatchEdit ? '完成' : '編輯'}
            theme='support'
            textClassName='text-sm text-stone-400 p-1'
            onClick={() => setIsBatchEdit((prev) => !prev)}
          />
        </div>
      </div>
      {/* List */}
      <div className='ms-scroll h-full flex-1 overflow-y-auto'>
        <Reorder.Group
          axis='y'
          className='flex flex-col gap-2'
          values={orderedCategories}
          onReorder={handleCategoriesReorder}
        >
          {orderedCategories.map((category) => (
            // Category items
            <DragItem
              key={category.id}
              value={category}
              isBatchEdit={isBatchEdit}
              isSelected={selectedIds.includes(category.id)}
              onSelectChange={(id, checked) => {
                if (checked) {
                  setSelectedIds((prev) => [...prev, id])
                } else {
                  setSelectedIds((prev) =>
                    prev.filter((selectedId) => selectedId !== id),
                  )
                }
              }}
            >
              <button
                disabled={isBatchEdit}
                className='group/rename ml-2 flex cursor-pointer items-center rounded-2xl p-2 disabled:pointer-events-none hover:bg-stone-100 active:scale-95'
                onClick={() => handleCategoryRename(category)}
              >
                {category.name}
                {!isBatchEdit && (
                  <PencilIcon className='ml-1 inline h-3 w-3 stroke-1 text-stone-400 transition-transform group-hover/rename:rotate-45' />
                )}
              </button>
              {isRoot ? (
                <button
                  disabled={props.activeRootCategoryId === category.id}
                  className='group/button ml-auto rounded-2xl p-2 text-sm text-stone-400 transition-opacity disabled:opacity-0 hover:bg-stone-100 active:scale-95'
                  onClick={() => props.onCategoryTailClick?.(category)}
                >
                  {category.childCategories?.length} 個子分類
                  <ChevronRightIcon className='inline h-4 w-4 stroke-1 transition-opacity group-disabled/button:opacity-0' />
                </button>
              ) : (
                <button
                  className='ml-auto rounded-2xl p-2 text-sm text-stone-400 hover:bg-stone-100 active:scale-95'
                  onClick={() => props.onCategoryTailClick?.(category)}
                >
                  {!isRoot && (
                    <span>{category._count?.commodities} 個餐點</span>
                  )}
                </button>
              )}
            </DragItem>
          ))}
        </Reorder.Group>
        {/* Footer */}
        {!isBatchEdit && (
          <li className='mt-2 flex justify-center first:mt-0'>
            <Button
              onClick={handleCategoryCreate}
              label={
                <p className='flex items-center p-2 text-sm'>
                  新增{categoryString} <PlusIcon className='inline h-4 w-4' />
                </p>
              }
              theme='support'
            />
          </li>
        )}
      </div>
      {formDialog}
      {dialog}
    </div>
  )
}

function DragItem(props: {
  children: JSX.Element | JSX.Element[]
  value: { id: number }
  isBatchEdit?: boolean
  isSelected?: boolean
  onSelectChange?: (id: number, isChecked: boolean) => void
}) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={props.value}
      className='flex w-full items-center rounded-lg border bg-white p-2 pl-4 shadow'
      dragListener={false}
      dragControls={controls}
    >
      {props.isBatchEdit ? (
        <CheckCircleIcon
          className={twMerge(
            'h-6 w-6 cursor-pointer text-stone-200 active:scale-90',
            !props.isSelected && 'hover:text-yellow-400',
            props.isSelected && 'text-yellow-500',
          )}
          onClick={() =>
            props.onSelectChange?.(props.value.id, !props.isSelected)
          }
        />
      ) : (
        <Bars3Icon
          className='h-6 w-6 cursor-grab text-stone-300'
          onPointerDown={(e) => controls.start(e)}
        />
      )}
      {props.children}
    </Reorder.Item>
  )
}
