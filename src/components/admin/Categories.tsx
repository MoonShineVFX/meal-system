import { useEffect, useState, useCallback } from 'react'
import { Reorder } from 'framer-motion'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useDebounce } from 'usehooks-ts'
import { PencilIcon } from '@heroicons/react/24/outline'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/24/outline'

import Button from '@/components/core/Button'
import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import { CategoryDatas } from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import useEditDialog from './useEditDialog'

export default function Categories() {
  const { data, error, isError, isLoading } = trpc.category.get.useQuery()
  const updateRootOrdersMutation = trpc.category.updateOrders.useMutation()
  const updateSubOrdersMutation = trpc.category.updateOrders.useMutation()
  const updateMutation = trpc.category.update.useMutation()
  const createMutation = trpc.category.create.useMutation()
  const [rootCategories, setRootCategories] = useState<CategoryDatas>([])
  const [subCategories, setSubCategories] = useState<{
    rootName?: string
    rootId?: number
    categories: CategoryDatas[number]['childCategories']
  }>({ categories: [] })
  const reorderedRootCategories = useDebounce(rootCategories, 500)
  const reorderedSubCategories = useDebounce(subCategories, 500)
  const { showDialog, dialog } = useEditDialog({
    mutations: [createMutation, updateMutation],
  })

  // Reorder root categories
  useEffect(() => {
    if (
      reorderedRootCategories &&
      reorderedRootCategories.map((category) => category.id) !==
        rootCategories.map((category) => category.id)
    ) {
      updateRootOrdersMutation.mutate({
        categoriesIds: reorderedRootCategories.map((category) => category.id),
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
        categoriesIds: reorderedSubCategories.categories.map(
          (category) => category.id,
        ),
        type: 'sub',
      })
    }
  }, [reorderedSubCategories])

  const handleRootCategoryRename = useCallback(
    (rootCategory: CategoryDatas[number]) => {
      showDialog(
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
    [showDialog, updateMutation],
  )

  const handleSubCategoryRename = useCallback(
    (subCategory: CategoryDatas[number]['childCategories'][number]) => {
      showDialog(
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
    [showDialog, updateMutation],
  )

  const handleRootCategoryCreate = useCallback(() => {
    showDialog(
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
  }, [showDialog, createMutation, data])

  const handleSubCategoryCreate = useCallback(() => {
    showDialog(
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
  }, [showDialog, createMutation, data])

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

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  return (
    <div className='flex h-full gap-8'>
      {/* Root Categories */}
      <div className='max-w-xs flex-1'>
        <h1 className='mb-4 flex items-center text-lg font-bold'>
          主分類
          {updateRootOrdersMutation.isLoading && (
            <Spinner className='ml-2 inline h-4 w-4 text-stone-400' />
          )}
        </h1>
        <Reorder.Group
          axis='y'
          className='flex flex-col gap-2'
          values={rootCategories}
          onReorder={setRootCategories}
        >
          {rootCategories.map((rootCategory) => (
            <Reorder.Item
              key={rootCategory.id}
              value={rootCategory}
              className='cursor-drag flex w-full cursor-grab items-center rounded-lg border bg-white p-2 shadow'
            >
              <Bars3Icon className='h-5 w-5 text-stone-300' />
              <button
                className='group/rename ml-2 cursor-pointer rounded-md hover:bg-stone-100 active:scale-95'
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
            </Reorder.Item>
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
        <h1 className='mb-4 text-lg font-bold'>
          {subCategories.rootName}子分類
          {updateSubOrdersMutation.isLoading && (
            <Spinner className='ml-2 inline h-4 w-4 text-stone-400' />
          )}
        </h1>
        <Reorder.Group
          axis='y'
          className='flex flex-col gap-2'
          values={subCategories.categories}
          onReorder={(categories) =>
            setSubCategories((prev) => ({ ...prev, categories }))
          }
        >
          {subCategories.categories.map((subCategory) => (
            <Reorder.Item
              key={subCategory.id}
              value={subCategory}
              className='cursor-drag flex w-full cursor-grab items-center rounded-lg border bg-white p-2 shadow'
            >
              <Bars3Icon className='h-5 w-5 text-stone-300' />
              <button
                className='group/rename ml-2 cursor-pointer rounded-md hover:bg-stone-100 active:scale-95'
                onClick={() => handleSubCategoryRename(subCategory)}
              >
                {subCategory.name}
                <PencilIcon className='ml-1 inline h-3 w-3 stroke-1 text-stone-400 transition-transform group-hover/rename:rotate-45' />
              </button>
              <p className='ml-auto text-sm text-stone-400'>
                {subCategory._count.commodities} 個餐點
              </p>
            </Reorder.Item>
          ))}
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
        </Reorder.Group>
      </div>
      {dialog}
    </div>
  )
}
