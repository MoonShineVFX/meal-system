import { useState, useEffect } from 'react'
import { FieldValues } from 'react-hook-form'

import { InputFieldProps, MenuIntroData } from './define'
import TextInput from '../base/TextInput'
import TextArea from '../base/TextArea'
import CheckBox from '../base/CheckBox'
import { useStore } from '@/lib/client/store'

export default function MenuIntroField<T extends FieldValues>(
  props: InputFieldProps<'menuIntro', T>,
) {
  const setFormCreateSupplier = useStore(
    (state) => state.setFormMenuCreateSupplier,
  )
  const [introData, setIntroData] = useState<MenuIntroData>(
    props.formInput.defaultValue ?? {
      name: undefined,
      description: undefined,
      createSupplier: false,
    },
  )

  // set options for rfh and error detection
  useEffect(() => {
    props.useFormReturns.register(props.formInput.name, props.formInput.options)
    setFormCreateSupplier(introData.createSupplier)
  }, [])

  // set rfh value
  useEffect(() => {
    setFormCreateSupplier(introData.createSupplier)
    if (introData.createSupplier && !introData.name) {
      props.useFormReturns.setError(props.formInput.name, {
        type: 'custom',
        message: '請填寫店家名稱',
      })
      return
    }

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
  }, [introData])

  return (
    <div className='flex flex-col gap-2'>
      <TextInput
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
        value={introData.description ?? ''}
        onChange={(e) =>
          setIntroData({
            ...introData,
            description: e.target.value.length > 0 ? e.target.value : undefined,
          })
        }
        placeholder={`${introData.createSupplier ? '店家' : '菜單'}描述 (可選)`}
      />
      {(props.formInput.data === undefined ||
        !props.formInput.data.disableCreateSupplier) && (
        <label className='ml-auto flex cursor-pointer items-center gap-2'>
          <CheckBox
            onChange={(e) =>
              setIntroData({
                ...introData,
                createSupplier: e.target.checked,
              })
            }
          />
          <span className='text-sm font-bold text-stone-500'>新增為店家</span>
        </label>
      )}
    </div>
  )
}
