import { useEffect, useState, useCallback } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
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
  const { data, error, isError, isLoading } = trpc.category.get.useQuery()
  const [selectedRootCategory, setSelectedRootCategory] = useState<
    CategoryDatas[number] | null
  >(null)

  // set selected root category
  useEffect(() => {
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
  }, [data])

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  return (
    <div className='flex h-full gap-8'>
      {/* Root Categories */}
      <div className='max-w-xs flex-1'>
        <CategoriesSortableList
          activeRootCategoryId={selectedRootCategory?.id}
          categories={data}
          onCategoryTailClick={(category) =>
            setSelectedRootCategory(category as CategoryDatas[number])
          }
        />
      </div>
      {/* Sub Categories */}
      <div className='max-w-xs flex-1'>
        {selectedRootCategory !== null && (
          <CategoriesSortableList
            rootCategory={selectedRootCategory}
            categories={selectedRootCategory.childCategories}
          />
        )}
      </div>
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
  // Delete
  const handleCategoryDelete = useCallback(() => {
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

  // Rename
  const handleCategoryRename = useCallback(
    (category: UniformCategory) => {
      showFormDialog({
        title: `重新命名 ${categoryString}`,
        inputs: {
          categoryName: {
            label: '分類名稱',
            value: category.name,
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
          value: '',
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

  return (
    <div className='h-full w-full'>
      {/* Header */}
      <div className='mb-4 flex items-center'>
        <p className='flex items-center text-lg font-bold'>
          {!isRoot && props.rootCategory?.name + ' '}
          {categoryString}
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
                onClick={handleCategoryDelete}
              />
              {!isRoot && (
                <Button
                  label='移動'
                  theme='support'
                  textClassName='text-sm text-stone-400 p-1'
                  className='disabled:opacity-50'
                  isDisabled={selectedIds.length === 0}
                />
              )}
            </>
          )}

          <Button
            label={isBatchEdit ? '完成編輯' : '批次編輯'}
            theme='support'
            textClassName='text-sm text-stone-400 p-1'
            onClick={() => setIsBatchEdit((prev) => !prev)}
          />
        </div>
      </div>
      {/* List */}
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
              className='group/rename ml-2 flex cursor-pointer items-center rounded-md disabled:pointer-events-none hover:bg-stone-100 active:scale-95'
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
                className='group/button ml-auto rounded-md text-sm text-stone-400 disabled:pointer-events-none hover:bg-stone-100 active:scale-95'
                onClick={() => props.onCategoryTailClick?.(category)}
              >
                {category.childCategories?.length} 個子分類
                <ChevronRightIcon className='inline h-4 w-4 stroke-1 transition-opacity group-disabled/button:opacity-0' />
              </button>
            ) : (
              <p className='ml-auto text-sm text-stone-400'>
                {!isRoot && <span>{category._count?.commodities} 個餐點</span>}
              </p>
            )}
          </DragItem>
        ))}
        {/* Footer */}
        {!isBatchEdit && (
          <li className='mt-2 flex justify-center'>
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
      </Reorder.Group>
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
      className='flex w-full items-center rounded-lg border bg-white p-2 shadow'
      dragListener={false}
      dragControls={controls}
    >
      {props.isBatchEdit ? (
        <CheckCircleIcon
          className={twMerge(
            'h-6 w-6 cursor-pointer text-stone-200',
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
