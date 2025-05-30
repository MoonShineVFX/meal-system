import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { FieldValues } from 'react-hook-form'

import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'
import Spinner from '@/components/core/Spinner'
import trpc from '@/lib/client/trpc'
import { InputFieldProps } from './define'

export default function CategoriesField<T extends FieldValues>(
  props: InputFieldProps<'categories', T>,
) {
  const [categoriesIds, setCategoriesIds] = useState<number[]>(
    props.formInput.defaultValue ?? [],
  )
  const { data, isError, isLoading } = trpc.category.get.useQuery()

  // set rfh value
  useEffect(() => {
    props.useFormReturns.setValue(
      props.formInput.name,
      categoriesIds as Parameters<typeof props.useFormReturns.setValue>[1],
      {
        shouldDirty: props.formInput.defaultValue
          ? categoriesIds !== props.formInput.defaultValue
          : categoriesIds.length > 0,
      },
    )
  }, [categoriesIds])

  if (isError || isLoading) return <Spinner className='h-12 w-12' />

  return (
    // Category list
    <div className='flex w-full flex-wrap gap-2'>
      {categoriesIds.map((id) => {
        const category = (data ?? [])
          .find((category) =>
            category.childCategories.some(
              (subCategory) => subCategory.id === id,
            ),
          )
          ?.childCategories.find((subCategory) => subCategory.id === id)
        return (
          <div
            key={id}
            className='flex items-center gap-2 rounded-2xl border bg-stone-100 px-2 py-1'
          >
            <span>{category?.name}</span>
            <button
              type='button'
              className='rounded-full p-1 text-stone-400 hover:bg-stone-200 active:scale-90'
              onClick={() =>
                setCategoriesIds((prevIds) =>
                  prevIds.filter((prevId) => prevId !== id),
                )
              }
            >
              <XMarkIcon className='h-4 w-4' />
            </button>
          </div>
        )
      })}
      {/* Dropdown */}
      <DropdownMenu
        label={
          <span className='flex items-center'>
            新增
            <PlusIcon className='h-4 w-4' />
          </span>
        }
        className='text-stone-400'
      >
        {(data ?? []).map((category) =>
          category.childCategories.filter(
            (subCategory) => !categoriesIds.includes(subCategory.id),
          ).length === 0 ? null : (
            <DropdownMenu label={category.name} key={category.id}>
              {category.childCategories.map((subCategory) =>
                categoriesIds.includes(subCategory.id) ? null : (
                  <DropdownMenuItem
                    key={subCategory.id}
                    label={subCategory.name}
                    onClick={() =>
                      setCategoriesIds((prevIds) => [
                        ...prevIds,
                        subCategory.id,
                      ])
                    }
                  />
                ),
              )}
            </DropdownMenu>
          ),
        )}
      </DropdownMenu>
    </div>
  )
}
