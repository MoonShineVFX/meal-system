import { useEffect, useState } from 'react'
import { FieldValues } from 'react-hook-form'

import SearchBar from '@/components/core/SearchBar'
import Spinner from '@/components/core/Spinner'
import trpc from '@/lib/client/trpc'
import CheckBox from '../base/CheckBox'
import { InputFieldProps } from './define'

export default function CommoditiesField<T extends FieldValues>(
  props: InputFieldProps<'commodities', T>,
) {
  const [commoditiesIds, setCommoditiesIds] = useState<number[]>(
    props.formInput.defaultValue ?? [],
  )
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [onlyShowSelected, setOnlyShowSelected] = useState<boolean>(false)
  const {
    data = [],
    isError,
    isLoading,
  } = trpc.commodity.getList.useQuery({
    includeIds: props.formInput.defaultValue ?? undefined,
    onlyFromSupplierId: props.formInput.data?.onlyFromSupplierId,
  })

  // set rfh value
  useEffect(() => {
    props.useFormReturns.setValue(
      props.formInput.name,
      commoditiesIds as Parameters<typeof props.useFormReturns.setValue>[1],
      {
        shouldDirty: props.formInput.defaultValue
          ? commoditiesIds !== props.formInput.defaultValue
          : commoditiesIds.length > 0,
      },
    )
  }, [commoditiesIds])

  if (isError || isLoading) return <Spinner className='h-12 w-12' />

  return (
    <div className='flex h-full flex-col gap-4'>
      <SearchBar
        className='mx-1'
        placeholder='搜尋餐點'
        isLoading={false}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
      />
      <label className='ml-auto flex w-fit cursor-pointer items-center gap-2'>
        <CheckBox
          className='h-4 w-4 rounded-lg'
          checked={onlyShowSelected}
          onChange={(e) => setOnlyShowSelected(e.target.checked)}
        />
        <span className='text-sm font-bold text-stone-500'>只顯示已選取</span>
      </label>
      <div className='relative grow'>
        <div className='ms-scroll absolute inset-0 flex flex-col gap-2 overflow-y-auto'>
          {data
            .map((commodity) => ({
              ...commodity,
              selected: commoditiesIds.includes(commodity.id),
            }))
            .filter((commodity) => {
              const selectedFilter = onlyShowSelected
                ? commodity.selected
                : true
              const keywordFilter =
                searchKeyword !== ''
                  ? commodity.name.includes(searchKeyword)
                  : true
              return selectedFilter && keywordFilter
            })
            .map((commodity) => (
              <label
                className='flex cursor-pointer items-center gap-4 rounded-2xl border p-2 hover:bg-stone-100 active:scale-95'
                key={commodity.id}
              >
                <CheckBox
                  checked={commodity.selected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCommoditiesIds([...commoditiesIds, commodity.id])
                    } else {
                      setCommoditiesIds(
                        commoditiesIds.filter(
                          (commodityId) => commodityId !== commodity.id,
                        ),
                      )
                    }
                  }}
                />
                <span className='font-bold text-stone-500'>
                  {commodity.name}
                </span>
              </label>
            ))}
        </div>
      </div>
    </div>
  )
}
