import { useState, useEffect } from 'react'
import { FieldValues } from 'react-hook-form'

import { InputFieldProps, MenuIntroData } from './define'
import TextInput from '../base/TextInput'
import TextArea from '../base/TextArea'
import CheckBox from '../base/CheckBox'
import { useStore } from '@/lib/client/store'
import trpc from '@/lib/client/trpc'
import Select from '../base/Select'
import { SpinnerBlock } from '@/components/core/Spinner'

export default function MenuIntroField<T extends FieldValues>(
  props: InputFieldProps<'menuIntro', T>,
) {
  const supplierQuery = trpc.supplier.getList.useQuery({})
  const setFormCreateSupplier = useStore(
    (state) => state.setFormMenuCreateSupplier,
  )
  const setFormSupplier = useStore((state) => state.setFormMenuSupplier)
  const [introData, setIntroData] = useState<MenuIntroData>(
    props.formInput.defaultValue ?? {
      name: undefined,
      description: undefined,
      createSupplier: false,
      supplierId: undefined,
    },
  )

  // set options for rfh and error detection
  useEffect(() => {
    props.useFormReturns.register(props.formInput.name, props.formInput.options)
    setFormCreateSupplier(introData.createSupplier)
    if (supplierQuery.data) {
      setFormSupplier(
        supplierQuery.data.find((s) => s.id === introData.supplierId) ?? null,
      )
    }
  }, [supplierQuery.data])

  // set rfh value
  useEffect(() => {
    if (!supplierQuery.data) return
    setFormCreateSupplier(introData.createSupplier)
    setFormSupplier(
      supplierQuery.data.find((s) => s.id === introData.supplierId) ?? null,
    )
    if (introData.createSupplier && !introData.name) {
      props.useFormReturns.setError(props.formInput.name, {
        type: 'custom',
        message: '請填寫店家名稱',
      })
      return
    }
    props.useFormReturns.clearErrors(props.formInput.name)

    props.useFormReturns.setValue(
      props.formInput.name,
      introData as Parameters<typeof props.useFormReturns.setValue>[1],
      {
        shouldDirty: props.formInput.defaultValue
          ? introData !== props.formInput.defaultValue
          : introData.name !== null || introData.description !== null,
        shouldValidate: true,
      },
    )
  }, [introData, supplierQuery.data])

  if (supplierQuery.isError || supplierQuery.isLoading) {
    return <SpinnerBlock />
  }

  return (
    <div className='flex flex-col gap-2'>
      <TextInput
        disabled={
          !introData.createSupplier && introData.supplierId !== undefined
        }
        value={introData.name ?? ''}
        onChange={(e) =>
          setIntroData({
            ...introData,
            name: e.target.value.length > 0 ? e.target.value : undefined,
          })
        }
        className='mx-1 px-3'
        placeholder={
          introData.createSupplier ? '店家名稱 (必填)' : '菜單名稱 (可選)'
        }
      />
      <TextArea
        disabled={
          !introData.createSupplier && introData.supplierId !== undefined
        }
        value={introData.description ?? ''}
        onChange={(e) =>
          setIntroData({
            ...introData,
            description: e.target.value.length > 0 ? e.target.value : undefined,
          })
        }
        placeholder={`${introData.createSupplier ? '店家' : '菜單'}描述 (可選)`}
      />
      <Select
        value={introData.supplierId?.toString() ?? '-1'}
        disabled={
          introData.createSupplier ||
          props.formInput.data?.disableCreateSupplier
        }
        data={[
          {
            label: introData.supplierId ? '無店家' : '讀取店家',
            value: '-1',
          },
          ...supplierQuery.data.map((supplier) => ({
            label: supplier.name,
            value: supplier.id.toString(),
          })),
        ]}
        onChange={(e) => {
          const supplier = supplierQuery.data.find(
            (s) => s.id === parseInt(e.target.value),
          )
          setIntroData((prev) => ({
            ...prev,
            name: supplier?.name ?? props.formInput.defaultValue?.name ?? '',
            description:
              supplier?.description ??
              props.formInput.defaultValue?.description ??
              '',
            supplierId:
              e.target.value === '-1' ? undefined : parseInt(e.target.value),
          }))
        }}
      />
      {(props.formInput.data === undefined ||
        !props.formInput.data.disableCreateSupplier) && (
        <label className='ml-auto flex cursor-pointer items-center gap-2'>
          <CheckBox
            onChange={(e) => {
              const hasSelectedSupplier = introData.supplierId !== undefined
              setIntroData((prev) => ({
                ...prev,
                name: hasSelectedSupplier ? '' : prev.name,
                description: hasSelectedSupplier ? '' : prev.description,
                supplierId: undefined,
                createSupplier: e.target.checked,
              }))
            }}
          />
          <span className='text-sm font-bold text-stone-500'>新增為店家</span>
        </label>
      )}
    </div>
  )
}
