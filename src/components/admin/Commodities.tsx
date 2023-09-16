import { useCallback, useState, useEffect } from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'
import QRCode from 'qrcode'

import TabHeader from '@/components/core/TabHeader'
import Button from '@/components/core/Button'
import Image from '@/components/core/Image'
import Table from '@/components/core/Table'
import trpc, { CommodityDatas } from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import Error from '@/components/core/Error'
import {
  settings,
  getMenuName,
  OrderOptions,
  getOptionName,
} from '@/lib/common'
import { useFormDialog } from '@/components/form/FormDialog'
import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'
import SearchBar from '@/components/core/SearchBar'
import type { FormInput } from '@/components/form/field'
import { useDialog } from '@/components/core/Dialog'
import { OptionSetForm } from '@/components/menu/COMDialogContent'
import { useForm } from 'react-hook-form'
import Select from '@/components/form/base/Select'

const BatchEditProps = ['價錢', '分類', '選項', '菜單'] as const
const TabNames = ['全部', '即時', '自助', '預訂'] as const

export default function Commodities() {
  const { showFormDialog, formDialog } = useFormDialog()
  const [supplierId, setSupplierId] = useState<number | undefined>(undefined)
  const { data, error, isError, isLoading } = trpc.commodity.getList.useQuery({
    includeMenus: true,
    onlyFromSupplierId: supplierId,
    includeStatistics: true,
  })
  const supplierQuery = trpc.supplier.getList.useQuery({})
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const { showDialog, dialog } = useDialog()
  const [tabName, setTabName] = useState<typeof TabNames[number]>('全部')

  const handleEditCommodity = useCallback(
    async (commodity?: NonNullable<typeof data>[number]) => {
      if (!supplierQuery.data) return
      const isEdit = !!commodity
      const title = commodity ? '編輯餐點' : '新增餐點'

      // show
      showFormDialog({
        title,
        inputs: {
          image: {
            column: 1,
            label: '圖片',
            type: 'image',
            className: 'row-span-full',
            defaultValue: commodity?.image?.id,
          },
          name: {
            label: '名稱',
            type: 'text',
            defaultValue: commodity?.name,
            attributes: {
              placeholder: '餐點名稱',
            },
            options: {
              required: '請輸入名稱',
            },
          },
          description: {
            defaultValue: commodity?.description,
            label: '描述',
            type: 'textarea',
            attributes: {
              style: { minHeight: '9rem' },
            },
          },
          price: {
            defaultValue: commodity?.price ?? 0,
            label: '價錢',
            type: 'number',
            options: {
              required: '請輸入價錢',
              min: { value: 0, message: '價錢不能小於 0' },
              max: { value: 9999, message: '價錢不能大於 9999' },
            },
          },
          supplier: {
            defaultValue: commodity?.supplierId
              ? commodity.supplierId.toString()
              : !isEdit && supplierId
              ? supplierId.toString()
              : '',
            disabled: isEdit,
            data: [
              ...(commodity?.supplier
                ? [
                    {
                      value: commodity.supplierId!.toString(),
                      label: commodity.supplier.name,
                    },
                  ]
                : []),
              { value: '', label: '無' },
              ...supplierQuery
                .data!.filter((s) => s.id !== commodity?.supplierId)
                .map((s) => ({
                  value: s.id.toString(),
                  label: s.name,
                })),
            ],
            attributes: {
              defaultValue: commodity?.supplierId
                ? commodity.supplierId.toString()
                : !isEdit && supplierId
                ? supplierId.toString()
                : '',
              disabled: isEdit,
            },
            label: '店家',
            type: 'select',
          },
          categories: {
            label: '分類',
            column: 2,
            type: 'categories',
            defaultValue: commodity?.categories.map((c) => c.id),
          },
          menus: {
            label: '菜單',
            column: 2,
            type: 'menucom',
            defaultValue: commodity?.onMenus.map((com) => ({
              menuId: com.menu.id,
              limitPerUser: com.limitPerUser,
              stock: com.stock,
            })),
          },
          optionSets: {
            label: '選項',
            column: 3,
            type: 'optionSets',
            defaultValue: commodity?.optionSets,
          },
        },
        useMutation: commodity
          ? trpc.commodity.update.useMutation
          : trpc.commodity.create.useMutation,
        onSubmit(formData, mutation) {
          if (commodity) {
            ;(
              mutation as ReturnType<typeof trpc.commodity.update.useMutation>
            ).mutate({
              id: commodity.id,
              name: formData.name,
              price: formData.price,
              description: formData.description,
              optionSets: formData.optionSets,
              categoryIds: formData.categories,
              imageId: formData.image,
              menus: formData.menus,
              supplierId:
                formData.supplier === '' || formData.supplier === undefined
                  ? undefined
                  : parseInt(formData.supplier),
            })
          } else {
            ;(
              mutation as ReturnType<typeof trpc.commodity.create.useMutation>
            ).mutate({
              name: formData.name,
              price: formData.price,
              description: formData.description,
              optionSets: formData.optionSets,
              categoryIds: formData.categories,
              imageId: formData.image,
              menus: formData.menus,
              supplierId:
                formData.supplier === ''
                  ? undefined
                  : parseInt(formData.supplier),
            })
          }
        },
        closeConfirm: {
          title: `取消${title}`,
          content: `確定要取消${title}嗎？`,
          cancel: true,
          cancelText: '繼續',
          confirmText: '確定取消',
          confirmButtonTheme: 'danger',
        },
      })
    },
    [supplierQuery.data, supplierId],
  )

  const handleBatchEditCommodity = useCallback(
    (selectedIds: number[], property: typeof BatchEditProps[number]) => {
      if (!data) return
      const commodities = data.filter((c) => selectedIds.includes(c.id))
      const prices = commodities.map((c) => c.price).sort((a, b) => a - b)
      const sharedCategories = commodities
        .map((c) => c.categories.map((c) => c.id))
        .reduce((p, c) => p.filter((e) => c.includes(e)))
      const sharedMenus = commodities
        .map((c) =>
          c.onMenus.map((com) => ({
            menuId: com.menu.id,
            limitPerUser: com.limitPerUser,
            stock: com.stock,
            key: `${com.menu.id}-${com.limitPerUser}-${com.stock}`,
          })),
        )
        .reduce((p, c) => p.filter((e) => c.some((ce) => ce.key === e.key)))
      const sharedOptionSets = commodities
        .map((c) =>
          c.optionSets.map((os) => ({
            ...os,
            key: `${os.name}-${os.options.join('-')}-${
              os.multiSelect ? 'true' : 'false'
            }`,
          })),
        )
        .reduce((p, c) => p.filter((e) => c.some((ce) => ce.key === e.key)))

      const inputs = {
        priceLabel: {
          className: 'text-sm text-stone-400',
          label: `所選餐點價錢範圍 $${prices[0]} ~ $${
            prices[prices.length - 1]
          }`,
          type: 'label',
          hide: property !== '價錢',
        },
        offsetPrice: {
          defaultValue: 0,
          label: `微調價錢 (0 不調整)`,
          type: 'number',
          options: {
            min: { value: -9999, message: '價錢不能小於 -9999' },
            max: { value: 9999, message: '價錢不能大於 9999' },
          },
          hide: property !== '價錢',
        },
        replacePrice: {
          defaultValue: 0,
          label: `取代價錢 (0 不取代)`,
          type: 'number',
          options: {
            min: { value: 0, message: '價錢不能小於 0' },
            max: { value: 9999, message: '價錢不能大於 9999' },
          },
          hide: property !== '價錢',
        },
        removeUnshared: {
          label: '移除非共同的值',
          type: 'checkbox',
          defaultValue: false,
          hide: property === '價錢',
        },
        categories: {
          label: '共同分類',
          type: 'categories',
          defaultValue: sharedCategories,
          hide: property !== '分類',
        },
        menus: {
          label: '共同菜單',
          type: 'menucom',
          defaultValue: sharedMenus,
          hide: property !== '菜單',
        },
        optionSets: {
          label: '共同選項',
          type: 'optionSets',
          defaultValue: sharedOptionSets,
          hide: property !== '選項',
        },
      } as const satisfies Record<string, FormInput>

      // show
      showFormDialog({
        title: '批次編輯餐點',
        inputs,
        useMutation: trpc.commodity.updateMany.useMutation,
        onSubmit(formData, mutation) {
          mutation.mutate(
            commodities.map((c) => ({
              id: c.id,
              price:
                property === '價錢'
                  ? formData.replacePrice !== 0
                    ? formData.replacePrice + formData.offsetPrice
                    : Math.max(c.price + formData.offsetPrice, 0)
                  : undefined,
              categoryIds:
                property === '分類'
                  ? formData.removeUnshared
                    ? formData.categories
                    : [
                        ...c.categories
                          .map((c) => c.id)
                          .filter((id) => !sharedCategories.includes(id)),
                        ...formData.categories,
                      ]
                  : undefined,
              optionSets:
                property === '選項'
                  ? formData.removeUnshared
                    ? formData.optionSets
                    : [
                        ...c.optionSets
                          .map((os) => ({
                            ...os,
                            key: `${os.name}-${os.options.join('-')}-${
                              os.multiSelect ? 'true' : 'false'
                            }`,
                          }))
                          .filter(
                            (os) =>
                              !sharedOptionSets.some(
                                (sos) => sos.key === os.key,
                              ) &&
                              !formData.optionSets.some(
                                (sos) => sos.name === os.name,
                              ),
                          ),
                        ...formData.optionSets,
                      ]
                  : undefined,
              menus:
                property === '菜單'
                  ? formData.removeUnshared
                    ? formData.menus
                    : [
                        ...c.onMenus
                          .map((com) => ({
                            menuId: com.menu.id,
                            limitPerUser: com.limitPerUser,
                            stock: com.stock,
                            key: `${com.menu.id}-${com.limitPerUser}-${com.stock}`,
                          }))
                          .filter(
                            (c) =>
                              !sharedMenus.some((sm) => sm.key === c.key) &&
                              !formData.menus.some(
                                (m) => m.menuId === c.menuId,
                              ),
                          ),
                        ...formData.menus,
                      ]
                  : undefined,
            })),
          )
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
    [data],
  )

  const handleCommoditiesDelete = useCallback(
    (ids: number[]) => {
      if (!data) return
      showDialog({
        title: '刪除餐點',
        content:
          ids.length > 1
            ? `確定要刪除 ${ids.length} 個餐點嗎？`
            : `確定要刪除 ${data.find((c) => c.id === ids[0])!.name} 嗎？`,
        useMutation: trpc.commodity.deleteMany.useMutation,
        mutationOptions: {
          ids: ids,
        },
        cancel: true,
        confirmButtonTheme: 'danger',
      })
    },
    [data],
  )

  const handleQRCodeGenerate = useCallback(
    async (commodity: NonNullable<typeof data>[number]) => {
      showDialog({
        title: '付款碼',
        icon: null,
        content: (
          <>
            <QRCodeGenerator commodity={commodity} />
          </>
        ),
      })
    },
    [],
  )

  if (isError || supplierQuery.isError)
    return (
      <Error
        description={
          error?.message ?? supplierQuery.error?.message ?? '未知錯誤'
        }
      />
    )
  if (supplierQuery.isLoading) return <SpinnerBlock />

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-4 p-8'>
        {/* Top */}
        <div className='flex flex-wrap items-center gap-4'>
          <SearchBar
            placeholder='搜尋餐點'
            isLoading={false}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
          />
          <TabHeader
            className='flex-shrink-0 flex-grow-0'
            tabNames={TabNames}
            onChange={(tabName) => {
              setSupplierId(undefined)
              setTabName(tabName)
            }}
            clear={supplierId !== undefined}
          />
          <Select
            className='mr-auto w-40 whitespace-nowrap'
            value={supplierId ? supplierId.toString() : ''}
            data={[
              { label: '無指定店家', value: '' },
              ...supplierQuery.data.map((s) => ({
                label: s.name,
                value: s.id.toString(),
              })),
            ]}
            selectedClassName='bg-yellow-100'
            onChange={async (e) => {
              setSupplierId(
                e.target.value === '' ? undefined : parseInt(e.target.value),
              )
            }}
          />
          {selectedIds.length > 0 && (
            <Button
              label='刪除'
              className='py-3 px-2'
              textClassName='font-bold text-red-400'
              theme='support'
              onClick={() => handleCommoditiesDelete(selectedIds)}
            />
          )}
          {selectedIds.length > 0 && (
            <DropdownMenu
              className='whitespace-nowrap py-3 text-base font-bold'
              label='批次編輯'
              disabled={selectedIds.length < 2}
            >
              {BatchEditProps.map((p) => (
                <DropdownMenuItem
                  key={p}
                  label={p}
                  onClick={() => handleBatchEditCommodity(selectedIds, p)}
                />
              ))}
            </DropdownMenu>
          )}
          <Button
            label='新增餐點'
            className='py-3 px-4'
            textClassName='font-bold'
            onClick={() => handleEditCommodity()}
          />
        </div>
        {/* Table */}
        {isLoading ? (
          <SpinnerBlock />
        ) : (
          <Table
            data={data}
            onDataFilter={
              searchKeyword === '' && tabName === '全部'
                ? undefined
                : (data) =>
                    data
                      .filter((c) => {
                        if (tabName === '全部' || supplierId !== undefined)
                          return true
                        if (tabName === '即時')
                          return c.onMenus.some((m) => m.menu.type === 'LIVE')
                        if (tabName === '自助')
                          return c.onMenus.some((m) => m.menu.type === 'RETAIL')
                        if (tabName === '預訂')
                          return c.onMenus.some((m) => m.menu.date !== null)
                      })
                      .filter((c) => {
                        if (searchKeyword === '') return true
                        return (
                          c.name.includes(searchKeyword) ||
                          c.description.includes(searchKeyword) ||
                          c.categories.some((c) =>
                            c.name.includes(searchKeyword),
                          ) ||
                          c.optionSets.some(
                            (os) =>
                              os.name.includes(searchKeyword) ||
                              os.options.some((o) => {
                                const name = getOptionName(o)
                                name.includes(searchKeyword)
                              }),
                          )
                        )
                      })
            }
            columns={[
              {
                name: '圖片',
                render: (row) => (
                  <div className='relative aspect-square h-16 overflow-hidden rounded-2xl'>
                    <Image
                      className='object-cover'
                      src={
                        row.image?.path ?? settings.RESOURCE_FOOD_PLACEHOLDER
                      }
                      sizes='64px'
                      alt={row.name}
                    />
                  </div>
                ),
              },
              {
                name: '名稱',
                align: 'left',
                unhidable: true,
                hint: (row) => row.name,
                render: (row) => (
                  <DropdownMenu
                    className='group/edit flex items-center rounded-2xl p-2 text-base hover:bg-black/5 active:scale-90'
                    label={
                      <>
                        {row.name}
                        <PencilIcon className='ml-1 inline h-3 w-3 stroke-1 text-stone-400 transition-transform group-hover/edit:rotate-45' />
                      </>
                    }
                  >
                    <DropdownMenuItem
                      label='編輯'
                      onClick={() => handleEditCommodity(row)}
                    />
                    {row.onMenus.some((c) => c.menu.type === 'RETAIL') && (
                      <DropdownMenuItem
                        label='付款碼'
                        onClick={() => handleQRCodeGenerate(row)}
                      />
                    )}
                    <DropdownMenuItem
                      label={<span className='text-red-400'>刪除</span>}
                      onClick={() => handleCommoditiesDelete([row.id])}
                    />
                  </DropdownMenu>
                ),
                sort: (a, b) => a.name.localeCompare(b.name),
              },
              {
                name: '價錢',
                sort: true,
                render: (row) => row.price,
              },
              {
                name: '描述',
                hideByDefault: true,
                cellClassName:
                  'text-sm max-w-[30ch] overflow-hidden overflow-ellipsis',
                sort: true,
                render: (row) => row.description,
              },
              {
                name: '分類',
                sort: true,
                render: (row) => row.categories.map((c) => c.name).join(', '),
              },
              {
                name: '選項',
                sort: true,
                cellClassName: 'text-sm',
                hint: (row) =>
                  row.optionSets
                    ? row.optionSets
                        .map(
                          (o) =>
                            `${o.name}: ${o.options
                              .map((ot) => getOptionName(ot))
                              .join(', ')}`,
                        )
                        .join('\n')
                    : '無選項',
                render: (row) =>
                  row.optionSets
                    ? row.optionSets
                        .map((o) => `${o.name}(${o.options.length})`)
                        .join(', ')
                    : '無選項',
              },
              {
                name: '菜單',
                cellClassName:
                  'max-w-[30ch] overflow-hidden overflow-ellipsis text-sm',
                sort: true,
                hint: (row) =>
                  row.onMenus.length > 0
                    ? [...row.onMenus]
                        .reverse()
                        .map((com) => getMenuName(com.menu))
                        .join('\n')
                    : '無菜單',
                render: (row) =>
                  row.onMenus.length > 0
                    ? [...row.onMenus]
                        .reverse()
                        .map((com) => getMenuName(com.menu))
                        .join(', ')
                    : '無菜單',
              },
              {
                name: '創建日期',
                render: (row) => row.createdAt.toLocaleDateString(),
                cellClassName: 'text-sm',
                hint: (row) => row.createdAt.toLocaleString(),
                sort: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
                hideByDefault: true,
              },
              {
                name: '修改日期',
                render: (row) => row.updatedAt.toLocaleDateString(),
                cellClassName: 'text-sm',
                hint: (row) => row.updatedAt.toLocaleString(),
                sort: (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
                hideByDefault: true,
              },
              {
                name: '當日銷量',
                render: (row) => (
                  <p>
                    {row.statistics.day?._sum.quantity ?? 0}
                    <span className='pl-2 text-xs text-yellow-400'>
                      ${row.statistics.day?._sum.price ?? 0}
                    </span>
                  </p>
                ),
                cellClassName: 'text-sm',
                sort: (a, b) =>
                  (a.statistics.day?._sum.quantity ?? 0) -
                  (b.statistics.day?._sum.quantity ?? 0),
              },
              {
                name: '當週銷量',
                render: (row) => (
                  <p>
                    {row.statistics.week?._sum.quantity ?? 0}
                    <span className='pl-2 text-xs text-yellow-400'>
                      ${row.statistics.week?._sum.price ?? 0}
                    </span>
                  </p>
                ),
                cellClassName: 'text-sm',
                sort: (a, b) =>
                  (a.statistics.week?._sum.quantity ?? 0) -
                  (b.statistics.week?._sum.quantity ?? 0),
                hideByDefault: true,
              },
              {
                name: '當月銷量',
                render: (row) => (
                  <p>
                    {row.statistics.month?._sum.quantity ?? 0}
                    <span className='pl-2 text-xs text-yellow-400'>
                      ${row.statistics.month?._sum.price ?? 0}
                    </span>
                  </p>
                ),
                cellClassName: 'text-sm',
                sort: (a, b) =>
                  (a.statistics.month?._sum.quantity ?? 0) -
                  (b.statistics.month?._sum.quantity ?? 0),
                hideByDefault: true,
              },
            ]}
            idField='id'
            onSelectedIdsChange={setSelectedIds}
          />
        )}
      </div>
      {formDialog}
      {dialog}
    </div>
  )
}

function QRCodeGenerator(props: {
  commodity: CommodityDatas[number]
  width?: number
}) {
  const { control, watch } = useForm<{ options: OrderOptions }>({
    defaultValues: {
      options: props.commodity.optionSets.reduce((acc, os) => {
        acc[os.name] = os.multiSelect ? [] : getOptionName(os.options[0])
        return acc
      }, {} as OrderOptions),
    },
  })
  const formValue = watch()
  const trpcContext = trpc.useContext()
  const qrCodeWidth = props.width ?? 640

  const [options, setOptions] = useState<OrderOptions>({})
  const [qrCodeUrl, setQRCodeUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    const thisOptions = formValue.options
    if (JSON.stringify(thisOptions) !== JSON.stringify(options)) {
      setOptions({ ...thisOptions })
    }
  }, [formValue])

  useEffect(() => {
    async function getQRCode() {
      const cipher = await trpcContext.menu.getQRCodeCipher.fetch({
        commodityId: props.commodity.id,
        menuId: props.commodity.onMenus.find((m) => m.menu.type === 'RETAIL')!
          .menu.id,
        options: options,
      })

      const url = `${window.location.origin}/qrcode?key=${cipher}`
      console.debug('QR Code: ', url)

      try {
        const qrCodeUrl = await QRCode.toDataURL(url, { width: qrCodeWidth })
        setQRCodeUrl(qrCodeUrl)
      } catch (error) {
        console.error(error)
        return undefined
      }
    }
    getQRCode()
  }, [options])

  return (
    <div className='flex gap-4'>
      <div style={{ width: 160 }}>
        <div className='aspect-square w-full'>
          {qrCodeUrl ? <img src={qrCodeUrl} /> : <SpinnerBlock />}
        </div>
      </div>
      <div className='flex flex-col gap-4'>
        {props.commodity.optionSets
          .sort((a, b) => a.order - b.order)
          .map((optionSet) => (
            <OptionSetForm
              key={optionSet.name}
              optionSet={optionSet}
              control={control}
            />
          ))}
      </div>
    </div>
  )
}
