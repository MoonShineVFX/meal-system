import { useState, useEffect } from 'react'
import { FieldValues, UseFormSetValue } from 'react-hook-form'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'

import { BaseLabel, InputFieldProps } from './define'
import trpc from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'

export default function CategoriesField<T extends FieldValues>(
  props: Omit<InputFieldProps<'categories', T>, 'register' | 'errorMessage'> & {
    setValue: UseFormSetValue<T>
  },
) {
  const [categoriesIds, setCategoriesIds] = useState<number[]>(
    props.formInput.defaultValue ?? [],
  )
  const { data, isError, isLoading } = trpc.category.get.useQuery()

  // set rfh value
  useEffect(() => {
    props.setValue(
      props.formInput.name,
      categoriesIds as Parameters<typeof props.setValue>[1],
      { shouldDirty: true },
    )
  }, [categoriesIds])

  if (isError || isLoading) return <Spinner className='h-12 w-12' />

  return (
    <div className={props.formInput.className}>
      <BaseLabel label={props.formInput.label}>
        {/* Category list */}
        <div className='flex w-full flex-wrap gap-2'>
          {categoriesIds.map((id) => {
            const category = data
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
            {data.map((category) =>
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
      </BaseLabel>
    </div>
  )
}
