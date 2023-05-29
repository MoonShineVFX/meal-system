import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { FieldValues } from 'react-hook-form'
import {
  XMarkIcon,
  PlusIcon,
  LinkIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
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
import type { FormInput } from '@/components/form/field'
import { useStore } from '@/lib/client/store'

type ExistCOMData = Extract<COMData, { commodityId: number }>
type NewCOMData = Extract<COMData, { commodity: { name: string } }>

const BatchEditProps = ['價錢', '選項', '每人限購', '總數'] as const

export default function COMField<T extends FieldValues>(
  props: InputFieldProps<'com', T>,
) {
  const supplier = useStore((state) => state.formMenuSupplier)
  const isCreateSupplier = useStore((state) => state.formMenuCreateSupplier)
  const [comDatas, setComDatas] = useState<COMData[]>(
    props.formInput.defaultValue ?? [],
  )
  const { showFormDialog, formDialog } = useFormDialog()
  const existCOMIds = useMemo(() => {
    return comDatas
      .filter((comData) => !('commodity' in comData))
      .map((comData) => (comData as ExistCOMData).commodityId)
  }, [comDatas])
  const { data, isError, isLoading } = trpc.commodity.getList.useQuery({
    includeIds:
      props.formInput.defaultValue
        ?.filter((comData) => 'commodityId' in comData)
        .map((comData) => (comData as ExistCOMData).commodityId) ?? undefined,
    onlyFromSupplierId: supplier?.id,
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
        shouldValidate: true,
      },
    )
  }, [comDatas])

  // clean exist com data if isSupplier is true
  useEffect(() => {
    if (isCreateSupplier) {
      setComDatas((prev) => prev.filter((comData) => 'commodity' in comData))
    }
  }, [isCreateSupplier])

  // set default value if supplier is changed
  useEffect(() => {
    if (!data) return
    if (!supplier) {
      setComDatas([])
      return
    }
    setComDatas(
      data.map((com) => ({
        commodityId: com.id,
        limitPerUser: 0,
        stock: 0,
      })),
    )
  }, [data])

  const handleSelectFromExist = useCallback(() => {
    showFormDialog({
      title: supplier ? '從店家餐點選擇' : '從現有餐點選擇',
      className: 'h-[70vh]',
      inputs: {
        commodityIds: {
          label: '餐點',
          type: 'commodities',
          defaultValue: existCOMIds,
          className: 'h-full',
          data: {
            onlyFromSupplierId: supplier?.id,
          },
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
  }, [comDatas, existCOMIds, supplier])

  const handleEditOptionSets = useCallback(
    (commodityId: number) => {
      const comData = comDatas.find(
        (comData) => comData.commodityId === commodityId,
      )! as NewCOMData
      showFormDialog({
        title: '選項設定',
        inputs: {
          optionSets: {
            label: '',
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

  const handleBatchEditCommodity = useCallback(
    (property: typeof BatchEditProps[number]) => {
      const newSelectedComDatas = comDatas.filter(
        (comData) =>
          selectedIds.includes(comData.commodityId) && 'commodity' in comData,
      ) as NewCOMData[]
      const prices = newSelectedComDatas
        .map((c) => (c as NewCOMData).commodity.price)
        .sort((a, b) => a - b)
      const limitByUsers = comDatas
        .map((c) => c.limitPerUser)
        .sort((a, b) => a - b)
      const stocks = comDatas.map((c) => c.stock).sort((a, b) => a - b)
      const sharedOptionSets = newSelectedComDatas
        .map((c) =>
          c.commodity.optionSets.map((os) => ({
            ...os,
            key: `${os.name}-${os.options.join('-')}-${
              os.multiSelect ? 'true' : 'false'
            }`,
          })),
        )
        .reduce((p, c) => p.filter((e) => c.some((ce) => ce.key === e.key)))

      const inputs = {
        price: {
          defaultValue: 0,
          label: `價錢 (所選: $${prices[0]} ~ $${prices[prices.length - 1]})`,
          type: 'number',
          options: {
            min: { value: 0, message: '價錢不能小於 0' },
            max: { value: 9999, message: '價錢不能大於 9999' },
          },
          hide: property !== '價錢',
        },
        limitByUser: {
          defaultValue: 0,
          label: `每人限購 (所選: ${limitByUsers[0]} ~ ${
            limitByUsers[limitByUsers.length - 1]
          })`,
          type: 'number',
          options: {
            min: { value: 0, message: '數量不能小於 0' },
            max: { value: 999, message: '數量不能大於 999' },
          },
          hide: property !== '每人限購',
        },
        stock: {
          defaultValue: 0,
          label: `總數 (所選: ${stocks[0]} ~ ${stocks[stocks.length - 1]})`,
          type: 'number',
          options: {
            min: { value: 0, message: '數量不能小於 0' },
            max: { value: 999, message: '數量不能大於 999' },
          },
          hide: property !== '總數',
        },
        removeUnshared: {
          label: '移除非共同的選項',
          type: 'checkbox',
          defaultValue: false,
          hide: property !== '選項',
        },
        optionSets: {
          label: '共同選項',
          type: 'optionSets',
          defaultValue: sharedOptionSets,
          hide: property !== '選項',
        },
      } as const satisfies Record<string, FormInput>

      showFormDialog({
        title: '批次編輯餐點',
        inputs,
        useMutation: undefined,
        onSubmit: (formData) => {
          if (property === '價錢') {
            setComDatas((prev) =>
              prev.map((comData) => {
                if (!selectedIds.includes(comData.commodityId)) return comData
                return {
                  ...comData,
                  commodity: {
                    ...(comData as NewCOMData).commodity,
                    price: formData.price,
                  },
                }
              }),
            )
          } else if (property === '每人限購') {
            setComDatas((prev) =>
              prev.map((comData) => {
                if (!selectedIds.includes(comData.commodityId)) return comData
                return {
                  ...comData,
                  limitPerUser: formData.limitByUser,
                }
              }),
            )
          } else if (property === '總數') {
            setComDatas((prev) =>
              prev.map((comData) => {
                if (!selectedIds.includes(comData.commodityId)) return comData
                return {
                  ...comData,
                  stock: formData.stock,
                }
              }),
            )
          } else if (property === '選項') {
            setComDatas((prev) =>
              prev.map((comData) => {
                if (!selectedIds.includes(comData.commodityId)) return comData
                let newOptionSets: OptionSet[]
                if (formData.removeUnshared) {
                  newOptionSets = formData.optionSets
                } else {
                  newOptionSets = [
                    ...(comData as NewCOMData).commodity.optionSets
                      .map((os) => ({
                        ...os,
                        key: `${os.name}-${os.options.join('-')}-${
                          os.multiSelect ? 'true' : 'false'
                        }`,
                      }))
                      .filter(
                        (os) =>
                          !sharedOptionSets.some((sos) => sos.key === os.key) &&
                          !formData.optionSets.some(
                            (sos) => sos.name === os.name,
                          ),
                      ),
                    ...formData.optionSets,
                  ]
                }
                return {
                  ...comData,
                  commodity: {
                    ...(comData as NewCOMData).commodity,
                    optionSets: newOptionSets,
                  },
                }
              }),
            )
          }
        },
        closeConfirm: {
          title: `取消編輯`,
          content: `確定要取消批次編輯嗎？`,
          cancel: true,
          cancelText: '繼續',
          confirmText: '確定取消',
          confirmButtonTheme: 'danger',
        },
      })
    },
    [comDatas, selectedIds, setComDatas],
  )

  if (isError || isLoading) return <Spinner className='h-12 w-12' />

  return (
    <>
      <section className='flex items-center'>
        <button
          className='flex w-fit items-center rounded-2xl p-2 text-sm text-stone-400 disabled:pointer-events-none disabled:opacity-50 hover:bg-stone-100 active:scale-95'
          type='button'
          onClick={handleSelectFromExist}
          disabled={isCreateSupplier}
        >
          <LinkIcon className='mr-2 h-4 w-4' />
          {supplier ? '從店家餐點選擇' : '從現有餐點選擇'}
          {existCOMIds.length > 0 && ` (${existCOMIds.length})`}
        </button>

        <DropdownMenu
          className='ml-auto'
          label='批次編輯'
          disabled={selectedIds.length < 2}
        >
          {BatchEditProps.map((p) => {
            const hasExist = selectedIds.some((id) => {
              const comData = comDatas.find(
                (comData) => comData.commodityId === id,
              )
              return comData && !('commodity' in comData)
            })
            if (['價錢', '選項'].includes(p) && hasExist) return null
            return (
              <DropdownMenuItem
                key={p}
                label={p}
                onClick={() => handleBatchEditCommodity(p)}
              />
            )
          })}
          <DropdownMenuItem
            label={<span className='text-red-400'>刪除</span>}
            onClick={() => {
              setComDatas(
                comDatas.filter(
                  (comData) => !selectedIds.includes(comData.commodityId),
                ),
              )
            }}
          />
        </DropdownMenu>
      </section>
      <section className='flex h-full grow flex-col gap-2'>
        <Table
          data={comDatas}
          idField='commodityId'
          size='sm'
          onSelectedIdsChange={setSelectedIds}
          emptyIndicator={<></>}
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
                      className='max-w-[12ch] overflow-hidden text-ellipsis text-sm disabled:pointer-events-auto disabled:opacity-100'
                      defaultValue={row.commodity.name}
                      title={row.commodity.name}
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
                  return (
                    data.find((com) => com.id === row.commodityId)?.price ?? -1
                  )
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
                  )?.optionSets
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
              name: '', // duplicate button
              unhidable: true,
              colClassName: 'text-sm p-3',
              cellClassName: 'text-sm p-3',
              render: (row) => (
                <button
                  className='rounded-full p-1 hover:bg-stone-200 active:scale-90'
                  onClick={() => {
                    const isExist = !('commodity' in row)
                    let commodity: NewCOMData['commodity']
                    if (isExist) {
                      commodity = data.find(
                        (com) => com.id === row.commodityId,
                      )!
                    } else {
                      commodity = row.commodity
                    }
                    setComDatas([
                      ...comDatas,
                      {
                        commodityId: newComDataId,
                        commodity: {
                          name: commodity.name + '-複製',
                          price: commodity.price,
                          optionSets: commodity.optionSets,
                        },
                        limitPerUser: row.limitPerUser,
                        stock: row.stock,
                      },
                    ])
                    setNewComDataId(newComDataId - 1)
                  }}
                >
                  <DocumentDuplicateIcon className='h-4 w-4 text-stone-400' />
                </button>
              ),
            },
            {
              name: '', // delete button
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
          footer={
            <td className='absolute inset-x-0 flex h-16 w-full items-center justify-center p-4'>
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
            </td>
          }
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
          if (e.key === 'Enter') {
            applyEdit()
            e.preventDefault()
            e.stopPropagation()
          }
        },
      })}
    </div>
  )
}
