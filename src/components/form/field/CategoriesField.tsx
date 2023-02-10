import { useState } from 'react'
import { FieldValues, UseFormSetValue } from 'react-hook-form'

import { BaseLabel, InputFieldProps } from './define'
import trpc from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import { DdMenu, DdMenuItem } from '@/components/core/DropdownMenu'

export default function CategoriesField<T extends FieldValues>(
  props: Omit<InputFieldProps<'categories', T>, 'register' | 'errorMessage'> & {
    setValue: UseFormSetValue<T>
  },
) {
  const [categoriesIds, setCategoriesIds] = useState<number[]>(
    props.formInput.defaultValue ?? [],
  )
  const { data, isError, isLoading } = trpc.category.get.useQuery()

  if (isError || isLoading) return <Spinner className='h-12 w-12' />

  return (
    <div className={props.formInput.className}>
      <BaseLabel label={props.formInput.label}>
        <DdMenu label='新增分類'>
          {data.map((category) => (
            <DdMenu label={category.name}>
              {category.childCategories.map((subCategory) =>
                categoriesIds.includes(subCategory.id) ? null : (
                  <DdMenuItem
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
            </DdMenu>
          ))}
        </DdMenu>
      </BaseLabel>
    </div>
  )
}
