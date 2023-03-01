import { useState, useEffect, useCallback, useMemo } from 'react'
import { FieldValues } from 'react-hook-form'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'

import { InputFieldProps, COMData } from './define'
import { useFormDialog } from '@/components/form/FormDialog'
import NumberInput from '../base/NumberInput'
import trpc from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'

type ExistCOMData = Extract<COMData, { commodityId: number }>
// type NewCOMData = Extract<COMData, { commodity: { name: string } }>

export default function COMField<T extends FieldValues>(
  props: InputFieldProps<'com', T>,
) {
  const [comDatas, setComDatas] = useState<COMData[]>(
    props.formInput.defaultValue ?? [],
  )
  const { showFormDialog, formDialog } = useFormDialog()
  const existCOMIds = useMemo(() => {
    return comDatas
      .filter((com) => 'commodityId' in com)
      .map((com) => (com as ExistCOMData).commodityId)
  }, [comDatas])
  const { data, isError, isLoading } = trpc.commodity.get.useQuery({
    includeIds:
      props.formInput.defaultValue
        ?.filter((comData) => 'commodityId' in comData)
        .map((comData) => (comData as ExistCOMData).commodityId) ?? undefined,
  })

  // set rfh value
  useEffect(() => {
    props.useFormReturns.setValue(
      props.formInput.name,
      comDatas as Parameters<typeof props.useFormReturns.setValue>[1],
      {
        shouldDirty: props.formInput.defaultValue
          ? comDatas !== props.formInput.defaultValue
          : comDatas.length > 0,
      },
    )
  }, [comDatas])

  const handleSelectFromExist = useCallback(() => {
    showFormDialog({
      title: '從現有餐點選擇',
      className: 'h-[70vh]',
      inputs: {
        commodityIds: {
          label: '餐點',
          type: 'commodities',
          defaultValue: existCOMIds,
          className: 'h-full',
        },
      },
      useMutation: undefined,
      onSubmit: (data) => {
        const existCOMDatas = data.commodityIds.map((id) => {
          if (existCOMIds.includes(id)) {
            return comDatas.find(
              (comData) =>
                'commodityId' in comData && comData.commodityId === id,
            ) as ExistCOMData
          }
          return {
            commodityId: id,
            limitPerUser: 0,
            stock: 0,
          }
        })
        setComDatas([
          ...existCOMDatas,
          ...comDatas.filter((comData) => 'commodity' in comData),
        ])
      },
    })
  }, [comDatas, existCOMIds])

  if (isError || isLoading) return <Spinner className='h-12 w-12' />

  return (
    <div className='flex flex-col gap-2'>
      <button
        className='flex w-fit items-center rounded-2xl p-2 text-sm text-stone-400 hover:bg-stone-100 active:scale-95'
        type='button'
        onClick={handleSelectFromExist}
      >
        從現有餐點選擇
        {existCOMIds.length > 0 && ` (${existCOMIds.length})`}
        <PlusIcon className='ml-2 h-4 w-4' />
      </button>
      <button
        className='flex w-fit items-center rounded-2xl p-2 text-sm text-stone-400 hover:bg-stone-100 active:scale-95'
        type='button'
        onClick={handleSelectFromExist}
      >
        新增
        {existCOMIds.length > 0 && ` (${existCOMIds.length})`}
        <PlusIcon className='ml-2 h-4 w-4' />
      </button>
      {comDatas.map((comData) => {
        return (
          <div
            key={
              'commodity' in comData
                ? 'new_' + comData.commodity.name
                : comData.commodityId
            }
            className='rounded-2xl border p-3'
          >
            <div className='flex items-center justify-between'>
              <h1>
                {'commodity' in comData
                  ? comData.commodity.name
                  : data.find((d) => d.id === comData.commodityId)?.name}
              </h1>
              <button
                type='button'
                className='rounded-full p-1 text-stone-400 hover:bg-stone-200 active:scale-90'
              >
                <XMarkIcon className='h-5 w-5' />
              </button>
            </div>

            <div className='flex flex-col gap-2 py-2'>
              <div className='flex items-center justify-between gap-2'>
                <label className='whitespace-nowrap text-sm text-stone-400'>
                  總數
                </label>
                <NumberInput
                  className='w-1/2 rounded-md py-1 px-2 text-right'
                  value={comData.stock}
                  min={0}
                  max={999}
                />
              </div>
              <div className='flex items-center  justify-between gap-2'>
                <label className='whitespace-nowrap text-sm text-stone-400'>
                  每人限購
                </label>
                <NumberInput
                  className='w-1/2 rounded-md py-1 px-2 text-right'
                  min={0}
                  max={comData.stock === 0 ? 999 : comData.stock}
                  value={comData.limitPerUser}
                />
              </div>
            </div>
          </div>
        )
      })}
      {formDialog}
    </div>
  )
}
