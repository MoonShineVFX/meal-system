import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { FieldValues } from 'react-hook-form'
import { XMarkIcon, PlusIcon, LinkIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'

import { InputFieldProps, COMData } from './define'
import { useFormDialog } from '@/components/form/FormDialog'
import NumberInput from '../base/NumberInput'
import trpc from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import Table from '@/components/core/Table'
import { OptionSet } from '@/lib/common'
import TextInput from '../base/TextInput'
import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'

type ExistCOMData = Extract<COMData, { commodityId: number }>
type NewCOMData = Extract<COMData, { commodity: { name: string } }>

const BatchEditProps = ['價錢', '選項', '每人限購', '總數'] as const

export default function COMField<T extends FieldValues>(
  props: InputFieldProps<'com', T>,
) {
  const [comDatas, setComDatas] = useState<COMData[]>(
    props.formInput.defaultValue ?? [],
  )
  const { showFormDialog, formDialog } = useFormDialog()
  const existCOMIds = useMemo(() => {
    return comDatas
      .filter((comData) => !('commodity' in comData))
      .map((comData) => (comData as ExistCOMData).commodityId)
  }, [comDatas])
  const { data, isError, isLoading } = trpc.commodity.get.useQuery({
    includeIds:
      props.formInput.defaultValue
        ?.filter((comData) => 'commodityId' in comData)
        .map((comData) => (comData as ExistCOMData).commodityId) ?? undefined,
  })
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [newComDataId, setNewComDataId] = useState(Number.MAX_SAFE_INTEGER)

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

  const handleEditOptionSets = useCallback(
    (commodityId: number) => {
      const comData = comDatas.find(
        (comData) => comData.commodityId === commodityId,
      )! as NewCOMData
      showFormDialog({
        title: '選項設定',
        inputs: {
          optionSets: {
            label: '選項',
            type: 'optionSets',
            defaultValue: comData.commodity.optionSets,
          },
        },
        useMutation: undefined,
        onSubmit: (data) => {
          setComDatas((prev) =>
            prev.map((comData) => {
              if (comData.commodityId === commodityId) {
                return {
                  ...comData,
                  commodity: {
                    ...(comData as NewCOMData).commodity,
                    optionSets: data.optionSets,
                  },
                }
              }
              return comData
            }),
          )
        },
      })
    },
    [comDatas],
  )

  if (isError || isLoading) return <Spinner className='h-12 w-12' />

  return (
    <>
      <section className='flex items-center justify-between'>
        <button
          className='flex w-fit items-center rounded-2xl p-2 text-sm text-stone-400 hover:bg-stone-100 active:scale-95'
          type='button'
          onClick={handleSelectFromExist}
        >
          <LinkIcon className='mr-2 h-4 w-4' />
          從現有餐點選擇
          {existCOMIds.length > 0 && ` (${existCOMIds.length})`}
        </button>
        {selectedIds.length > 0 && (
          <DropdownMenu className='' label='批次編輯'>
            {BatchEditProps.map((p) => {
              const hasExist = selectedIds.some((id) => {
                const comData = comDatas.find(
                  (comData) => comData.commodityId === id,
                )
                return comData && !('commodity' in comData)
              })
              if (['價錢', '選項'].includes(p) && hasExist) return null
              return <DropdownMenuItem key={p} label={p} />
            })}
            <DropdownMenuItem
              label={<span className='text-red-400'>刪除</span>}
              onClick={() => {
                setComDatas(
                  comDatas.filter((_, index) => !selectedIds.includes(index)),
                )
                setSelectedIds([])
              }}
            />
          </DropdownMenu>
        )}
      </section>
      <section className='flex h-full grow flex-col gap-2'>
        <Table
          data={comDatas}
          idField='commodityId'
          size='sm'
          onSelectedIdsChange={setSelectedIds}
          columns={[
            {
              name: '名稱',
              align: 'left',
              unhidable: true,
              colClassName: 'text-sm p-3',
              cellClassName: 'text-sm p-3',
              render: (row) => {
                const isExist = !('commodity' in row)
                if (isExist) {
                  return (
                    <span className='flex items-center'>
                      <LinkIcon className='mr-2 h-4 w-4 text-stone-400' />
                      {data.find((com) => com.id === row.commodityId)?.name}
                    </span>
                  )
                }
                return (
                  <EditableField
                    isEditInit={row.commodity.name.length === 0}
                    nonEditClassName='hover:bg-yellow-100'
                    editClassName='bg-yellow-100'
                    onChange={(value) => {
                      if (
                        value.length === 0 &&
                        comDatas.indexOf(row) === comDatas.length - 1
                      ) {
                        const newComDatas = [...comDatas]
                        newComDatas.pop()
                        setComDatas(newComDatas)
                        return
                      }
                      setComDatas((prev) =>
                        prev.map((comData) => {
                          if (comData.commodityId === row.commodityId) {
                            return {
                              ...comData,
                              commodity: {
                                ...(comData as NewCOMData).commodity,
                                name: value,
                              },
                            }
                          }
                          return comData
                        }),
                      )
                    }}
                  >
                    <TextInput
                      className='max-w-[10ch] text-sm'
                      defaultValue={row.commodity.name}
                    />
                  </EditableField>
                )
              },
            },
            {
              name: '價錢',
              align: 'right',
              unhidable: true,
              colClassName: 'text-sm p-3',
              cellClassName: 'text-sm p-3',
              render: (row) => {
                const isExist = !('commodity' in row)
                if (isExist) {
                  return data.find((com) => com.id === row.commodityId)!.price
                }
                return (
                  <EditableField
                    nonEditClassName='hover:bg-yellow-100'
                    editClassName='bg-yellow-100'
                    onChange={(value) => {
                      const numberValue = parseInt(value)
                      setComDatas((prev) =>
                        prev.map((comData) => {
                          if (comData.commodityId === row.commodityId) {
                            return {
                              ...comData,
                              commodity: {
                                ...(comData as NewCOMData).commodity,
                                price: isNaN(numberValue)
                                  ? 0
                                  : Math.max(Math.min(numberValue, 9999), 0),
                              },
                            }
                          }
                          return comData
                        }),
                      )
                    }}
                  >
                    <NumberInput
                      hideSpinner
                      className='mx-0 w-[5ch] p-0 text-right text-sm'
                      defaultValue={row.commodity.price}
                    />
                  </EditableField>
                )
              },
            },
            {
              name: '選項',
              colClassName: 'text-sm p-3',
              cellClassName: 'text-sm p-3',
              render: (row) => {
                const isExist = !('commodity' in row)
                let optionSets: OptionSet[] | undefined
                if (isExist) {
                  optionSets = data.find(
                    (com) => com.id === row.commodityId,
                  )!.optionSets
                } else {
                  optionSets = row.commodity.optionSets
                }

                const text =
                  optionSets && optionSets.length > 0
                    ? optionSets
                        .map((o) => `${o.name}(${o.options.length})`)
                        .join(', ')
                    : '無選項'

                if (isExist) return text
                return (
                  <button
                    className='-m-2 cursor-pointer rounded-2xl p-2 hover:bg-yellow-100 active:scale-95'
                    onClick={() => handleEditOptionSets(row.commodityId)}
                  >
                    {text}
                  </button>
                )
              },
            },
            {
              name: '限購',
              align: 'right',
              unhidable: true,
              colClassName: 'text-sm p-3',
              cellClassName: 'text-sm p-3',
              render: (row) => (
                <EditableField
                  nonEditClassName='hover:bg-yellow-100'
                  editClassName='bg-yellow-100'
                  onChange={(value) => {
                    const numberValue = parseInt(value)
                    setComDatas((prev) =>
                      prev.map((comData) => {
                        if (comData.commodityId === row.commodityId) {
                          return {
                            ...comData,
                            limitPerUser: isNaN(numberValue)
                              ? 0
                              : Math.max(Math.min(numberValue, 999), 0),
                          }
                        }
                        return comData
                      }),
                    )
                  }}
                >
                  <NumberInput
                    hideSpinner
                    className='mx-0 w-[4ch] p-0 text-right text-sm'
                    defaultValue={row.limitPerUser}
                  />
                </EditableField>
              ),
            },
            {
              name: '總數',
              align: 'right',
              unhidable: true,
              colClassName: 'text-sm p-3',
              cellClassName: 'text-sm p-3',
              render: (row) => (
                <EditableField
                  nonEditClassName='hover:bg-yellow-100'
                  editClassName='bg-yellow-100'
                  onChange={(value) => {
                    const numberValue = parseInt(value)
                    setComDatas((prev) =>
                      prev.map((comData) => {
                        if (comData.commodityId === row.commodityId) {
                          return {
                            ...comData,
                            stock: isNaN(numberValue)
                              ? 0
                              : Math.max(Math.min(numberValue, 999), 0),
                          }
                        }
                        return comData
                      }),
                    )
                  }}
                >
                  <NumberInput
                    hideSpinner
                    className='mx-0 w-[4ch] p-0 text-right text-sm'
                    defaultValue={row.stock}
                  />
                </EditableField>
              ),
            },
            {
              name: '',
              unhidable: true,
              colClassName: 'text-sm p-3',
              cellClassName: 'text-sm p-3',
              render: (row) => (
                <button
                  className='rounded-full p-1 hover:bg-red-100 active:scale-90'
                  onClick={() => {
                    setComDatas((prev) =>
                      prev.filter(
                        (comData) => comData.commodityId !== row.commodityId,
                      ),
                    )
                  }}
                >
                  <XMarkIcon className='h-4 w-4 text-red-400' />
                </button>
              ),
            },
          ]}
          footer={() => (
            <div className='absolute inset-x-0 flex h-16 w-full items-center justify-center p-4'>
              <button
                className='flex w-fit items-center rounded-2xl p-2 text-sm text-stone-400 hover:bg-stone-100 active:scale-95'
                type='button'
                onClick={() => {
                  if (comDatas.length > 0) {
                    const lastComData = comDatas[comDatas.length - 1]
                    if (
                      'commodity' in lastComData &&
                      lastComData.commodity.name === ''
                    ) {
                      return
                    }
                  }
                  setComDatas([
                    ...comDatas,
                    {
                      commodityId: newComDataId,
                      commodity: { name: '', price: 0, optionSets: [] },
                      limitPerUser: 0,
                      stock: 0,
                    },
                  ])
                  setNewComDataId(newComDataId - 1)
                }}
              >
                <PlusIcon className='mr-2 h-4 w-4' />
                新增
              </button>
            </div>
          )}
        />
        {formDialog}
      </section>
    </>
  )
}

function EditableField(props: {
  isEditInit?: boolean
  onChange?: (value: string) => void
  children: JSX.Element
  nonEditClassName?: string
  editClassName?: string
}) {
  const [isEdit, setIsEdit] = useState(props.isEditInit ?? false)
  const inputRef = useRef<HTMLInputElement>(null)

  // autofocus
  useEffect(() => {
    if (!isEdit || !inputRef.current) return
    inputRef.current.focus()
  }, [isEdit, inputRef.current])

  // applyedit
  const applyEdit = useCallback(() => {
    if (!inputRef.current) return
    const value = inputRef.current.value.trim()
    props.onChange?.(value)
    setIsEdit(false)
  }, [inputRef.current, props.onChange])

  return (
    <div onMouseDown={() => setIsEdit(true)} onClick={() => setIsEdit(true)}>
      {React.cloneElement(props.children, {
        className: twMerge(
          'ml-1 rounded-md border-transparent p-1 placeholder:text-stone-300 bg-transparent',
          !isEdit && 'cursor-text hover:bg-stone-100',
          !isEdit && props.nonEditClassName,
          isEdit && 'bg-stone-100',
          isEdit && props.editClassName,
          props.children.props.className,
        ),
        ref: inputRef,
        disabled: !isEdit,
        onBlur: applyEdit,
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') applyEdit()
        },
      })}
    </div>
  )
}
