import { useEffect, useState, useCallback } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useDebounce } from 'usehooks-ts'
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
import useEditDialog from './useEditDialog'

export default function Categories() {
  // Queries
  const { data, error, isError, isLoading } = trpc.category.get.useQuery()
  const updateRootOrdersMutation = trpc.category.updateOrders.useMutation()
  const updateSubOrdersMutation = trpc.category.updateOrders.useMutation()
  const updateMutation = trpc.category.update.useMutation()
  const createMutation = trpc.category.create.useMutation()
  const deleteMutation = trpc.category.deleteMany.useMutation()

  // Reorder hooks
  const [rootCategories, setRootCategories] = useState<CategoryDatas>([])
  const [subCategories, setSubCategories] = useState<{
    rootName?: string
    rootId?: number
    categories: CategoryDatas[number]['childCategories']
  }>({ categories: [] })
  const reorderedRootCategories = useDebounce(rootCategories, 500)
  const reorderedSubCategories = useDebounce(subCategories, 500)

  // Dialog hooks
  const { showEditDialog, editDialog } = useEditDialog({
    mutations: [createMutation, updateMutation],
  })
  const { showDialog, dialog } = useDialog()

  // Batch edit hooks
  const [isSubBatchEdit, setIsSubBatchEdit] = useState(false)
  const [selectedSubIds, setSelectedSubIds] = useState<number[]>([])

  // Reorder root categories
  useEffect(() => {
    if (
      reorderedRootCategories &&
      reorderedRootCategories.map((category) => category.id) !==
        rootCategories.map((category) => category.id)
    ) {
      updateRootOrdersMutation.mutate({
        ids: reorderedRootCategories.map((category) => category.id),
        type: 'root',
      })
    }
  }, [reorderedRootCategories])

  // Reorder sub categories
  useEffect(() => {
    if (
      reorderedSubCategories &&
      reorderedSubCategories.categories.map((category) => category.id) !==
        subCategories.categories.map((category) => category.id)
    ) {
      updateSubOrdersMutation.mutate({
        ids: reorderedSubCategories.categories.map((category) => category.id),
        type: 'sub',
      })
    }
  }, [reorderedSubCategories])

  // Exist edit mode when changed
  useEffect(() => {
    setIsSubBatchEdit(false)
  }, [subCategories])

  // Assign data to rootCategories
  useEffect(() => {
    if (data) {
      setRootCategories(data)
      if (data[0]) {
        setSubCategories({
          rootName: data[0].name,
          rootId: data[0].id,
          categories: data[0].childCategories,
        })
      }
    }
  }, [data])

  // Handlers
  const handleRootCategoryRename = useCallback(
    (rootCategory: CategoryDatas[number]) => {
      showEditDialog(
        {
          title: '重新命名 主分類',
          inputs: {
            rootCategoryName: {
              label: '分類名稱',
              value: rootCategory.name,
              options: { required: '請輸入分類名稱' },
              attributes: { placeholder: rootCategory.name },
            },
          },
        },
        (formData) => {
          updateMutation.mutate({
            id: rootCategory.id,
            name: formData.rootCategoryName,
            type: 'root',
          })
        },
      )
    },
    [showEditDialog, updateMutation],
  )

  const handleSubCategoryRename = useCallback(
    (subCategory: CategoryDatas[number]['childCategories'][number]) => {
      showEditDialog(
        {
          title: `重新命名 ${subCategories.rootName} 子分類`,
          inputs: {
            subCategoryName: {
              label: '分類名稱',
              value: subCategory.name,
              options: { required: '請輸入分類名稱' },
              attributes: { placeholder: subCategory.name },
            },
          },
        },
        (formData) => {
          updateMutation.mutate({
            id: subCategory.id,
            name: formData.subCategoryName,
            type: 'sub',
          })
        },
      )
    },
    [showEditDialog, updateMutation],
  )

  const handleRootCategoryCreate = useCallback(() => {
    showEditDialog(
      {
        title: '新增 主分類',
        inputs: {
          rootCategoryName: {
            label: '分類名稱',
            value: '',
            options: { required: '請輸入分類名稱' },
          },
        },
      },
      (formData) => {
        createMutation.mutate({
          name: formData.rootCategoryName,
          order: data?.length,
        })
      },
    )
  }, [showEditDialog, createMutation, data])

  const handleSubCategoryCreate = useCallback(() => {
    showEditDialog(
      {
        title: `新增 ${subCategories.rootName} 子分類`,
        inputs: {
          subCategoryName: {
            label: '分類名稱',
            value: '',
            options: { required: '請輸入分類名稱' },
          },
        },
      },
      (formData) => {
        createMutation.mutate({
          name: formData.subCategoryName,
          rootId: subCategories.rootId,
          order: data?.find((cat) => cat.id === subCategories.rootId)
            ?.childCategories.length,
        })
      },
    )
  }, [showEditDialog, createMutation, data])

  const handleSubCategoryDelete = useCallback(() => {
    showDialog({
      title: '刪除子分類',
      content: `確定要刪除 ${selectedSubIds.length} 個子分類嗎？`,
      onClose(isConfirm) {
        console.log('isConfirm', isConfirm)
        if (isConfirm) {
          deleteMutation.mutate({
            ids: selectedSubIds,
            type: 'sub',
          })
        }
      },
      cancel: true,
    })
  }, [selectedSubIds])

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  return (
    <div className='flex h-full gap-8'>
      {/* Root Categories */}
      <div className='max-w-xs flex-1'>
        <div className='mb-4 flex items-center'>
          <p className='items-center text-lg font-bold'>
            主分類
            {updateRootOrdersMutation.isLoading && (
              <Spinner className='ml-2 inline h-4 w-4 text-stone-400' />
            )}
          </p>
          <div className='ml-auto justify-end'>
            <Button
              className=''
              label='刪除'
              theme='support'
              textClassName='text-sm text-red-400 p-1'
            />
          </div>
        </div>
        <Reorder.Group
          axis='y'
          className='flex flex-col gap-2'
          values={rootCategories}
          onReorder={setRootCategories}
        >
          {rootCategories.map((rootCategory) => (
            <DragItem key={rootCategory.id} value={rootCategory}>
              <button
                className='group/rename ml-2 flex cursor-pointer items-center rounded-md hover:bg-stone-100 active:scale-95'
                onClick={() => handleRootCategoryRename(rootCategory)}
              >
                {rootCategory.name}
                <PencilIcon className='ml-1 inline h-3 w-3 stroke-1 text-stone-400 transition-transform group-hover/rename:rotate-45' />
              </button>
              <button
                disabled={subCategories.rootId === rootCategory.id}
                className='group/button ml-auto rounded-md text-sm text-stone-400 disabled:pointer-events-none hover:bg-stone-100 active:scale-95'
                onClick={() =>
                  setSubCategories({
                    rootName: rootCategory.name,
                    rootId: rootCategory.id,
                    categories: rootCategory.childCategories,
                  })
                }
              >
                {rootCategory.childCategories.length} 個子分類
                <ChevronRightIcon className='inline h-4 w-4 stroke-1 transition-opacity group-disabled/button:opacity-0' />
              </button>
            </DragItem>
          ))}
          <li className='mt-2 flex justify-center'>
            <Button
              onClick={handleRootCategoryCreate}
              label={
                <p className='flex items-center p-1 text-sm'>
                  新增主分類 <PlusIcon className='inline h-4 w-4' />
                </p>
              }
              theme='support'
            />
          </li>
        </Reorder.Group>
      </div>
      {/* Sub Categories */}
      <div className='max-w-xs flex-1'>
        <div className='mb-4 flex items-center'>
          <p className='items-center text-lg font-bold'>
            {subCategories.rootName}子分類
            {updateSubOrdersMutation.isLoading && (
              <Spinner className='ml-2 inline h-4 w-4 text-stone-400' />
            )}
          </p>
          <div className='ml-auto flex justify-end'>
            {isSubBatchEdit && (
              <>
                <Button
                  isLoading={deleteMutation.isLoading}
                  spinnerClassName='h-4 w-4'
                  label='刪除'
                  theme='support'
                  textClassName='text-sm text-red-400 p-1'
                  className='disabled:opacity-50'
                  isDisabled={selectedSubIds.length === 0}
                  onClick={handleSubCategoryDelete}
                />
                <Button
                  label='移動'
                  theme='support'
                  textClassName='text-sm text-stone-400 p-1'
                  className='disabled:opacity-50'
                  isDisabled={selectedSubIds.length === 0}
                />
              </>
            )}

            <Button
              label={isSubBatchEdit ? '完成編輯' : '批次編輯'}
              theme='support'
              textClassName='text-sm text-stone-400 p-1'
              onClick={() => setIsSubBatchEdit((prev) => !prev)}
            />
          </div>
        </div>
        <Reorder.Group
          axis='y'
          className='flex flex-col gap-2'
          values={subCategories.categories}
          onReorder={(categories) =>
            setSubCategories((prev) => ({ ...prev, categories }))
          }
        >
          {subCategories.categories.map((subCategory) => (
            <DragItem
              key={subCategory.id}
              value={subCategory}
              isBatchEdit={isSubBatchEdit}
              isSelected={selectedSubIds.includes(subCategory.id)}
              onSelectChange={(id, checked) => {
                if (checked) {
                  setSelectedSubIds((prev) => [...prev, id])
                } else {
                  setSelectedSubIds((prev) =>
                    prev.filter((selectedId) => selectedId !== id),
                  )
                }
              }}
            >
              <button
                disabled={isSubBatchEdit}
                className='group/rename ml-2 flex cursor-pointer items-center rounded-md disabled:pointer-events-none hover:bg-stone-100 active:scale-95'
                onClick={() => handleSubCategoryRename(subCategory)}
              >
                {subCategory.name}
                {!isSubBatchEdit && (
                  <PencilIcon className='ml-1 inline h-3 w-3 stroke-1 text-stone-400 transition-transform group-hover/rename:rotate-45' />
                )}
              </button>
              <p className='ml-auto text-sm text-stone-400'>
                {subCategory._count.commodities} 個餐點
              </p>
            </DragItem>
          ))}
          {!isSubBatchEdit && (
            <li className='mt-2 flex justify-center'>
              <Button
                onClick={handleSubCategoryCreate}
                label={
                  <p className='flex items-center p-1 text-sm'>
                    新增子分類 <PlusIcon className='inline h-4 w-4' />
                  </p>
                }
                theme='support'
              />
            </li>
          )}
        </Reorder.Group>
      </div>
      {editDialog}
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
