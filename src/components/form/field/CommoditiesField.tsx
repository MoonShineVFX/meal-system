import { useState, useEffect } from 'react'
import { FieldValues, UseFormSetValue } from 'react-hook-form'

import { BaseLabel, InputFieldProps } from './define'
import trpc from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import SearchBar from '@/components/core/SearchBar'

export default function CommoditiesField<T extends FieldValues>(
  props: Omit<
    InputFieldProps<'commodities', T>,
    'register' | 'errorMessage'
  > & {
    setValue: UseFormSetValue<T>
  },
) {
  const [commoditiesIds, setCommoditiesIds] = useState<number[]>(
    props.formInput.defaultValue ?? [],
  )
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [onlyShowSelected, setOnlyShowSelected] = useState<boolean>(false)
  const { data, isError, isLoading } = trpc.commodity.get.useQuery()

  // set rfh value
  useEffect(() => {
    props.setValue(
      props.formInput.name,
      commoditiesIds as Parameters<typeof props.setValue>[1],
    )
  }, [commoditiesIds])

  // set commodities ids first time
  useEffect(() => {
    if (data) {
      setCommoditiesIds(
        data
          .filter((commodity) =>
            commodity.categories.some(
              (category) => category.id === props.formInput.data, // data is category id
            ),
          )
          .map((commodity) => commodity.id),
      )
    }
  }, [data])

  if (isError || isLoading) return <Spinner className='h-12 w-12' />

  return (
    <div className={props.formInput.className}>
      <BaseLabel label={props.formInput.label}>
        <div className='flex h-full flex-col gap-4'>
          <SearchBar
            className='mx-1'
            placeholder='搜尋餐點'
            isLoading={false}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
          />
          <label className='ml-auto flex w-fit cursor-pointer items-center gap-2'>
            <input
              type='checkbox'
              className='focus:ring-none h-4 w-4 cursor-pointer rounded-lg border-stone-300 text-yellow-500 focus:ring-transparent'
              checked={onlyShowSelected}
              onChange={(e) => setOnlyShowSelected(e.target.checked)}
            />
            <span className='text-sm font-bold text-stone-500'>
              只顯示已選取
            </span>
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
                    <input
                      type='checkbox'
                      className='focus:ring-none h-5 w-5 cursor-pointer rounded-lg border-stone-300 text-yellow-500 focus:ring-transparent'
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
      </BaseLabel>
    </div>
  )
}
