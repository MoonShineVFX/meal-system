import { useCallback, useEffect, useState } from 'react'
import { FieldValues } from 'react-hook-form'

import Button from '@/components/core/Button'
import { useDialog } from '@/components/core/Dialog'
import SearchBar from '@/components/core/SearchBar'
import Spinner from '@/components/core/Spinner'
import trpc from '@/lib/client/trpc'
import CheckBox from '../base/CheckBox'
import { InputFieldProps } from './define'
import { settings } from '@/lib/common'
import { twMerge } from 'tailwind-merge'

export default function UsersField<T extends FieldValues>(
  props: InputFieldProps<'users', T>,
) {
  const { dialog, showDialog } = useDialog()
  const [userIds, setUserIds] = useState<string[]>(
    props.formInput.defaultValue ?? [],
  )

  const handleDialogOpen = useCallback(() => {
    showDialog({
      title: '選擇使用者',
      panelProps: { className: 'h-[70vh]' },
      sectionClassName: 'grow',
      contentClassName: 'grow',
      content: (
        <UsersFieldBase
          {...props}
          value={userIds}
          onChange={(userIds) => setUserIds(userIds)}
          isInDialog
        />
      ),
      confirmText: '關閉',
      icon: null,
    })
  }, [userIds])

  if (!props.formInput.data?.newDialog) return UsersFieldBase(props)

  return (
    <div>
      <Button
        className='w-full py-2'
        label={`選擇使用者 (${userIds.length})`}
        onClick={handleDialogOpen}
      />
      {dialog}
    </div>
  )
}

export function UsersFieldBase<T extends FieldValues>(
  props: InputFieldProps<'users', T> & {
    isInDialog?: boolean
    value?: string[]
    onChange?: (userIds: string[]) => void
  },
) {
  const [userIds, setUserIds] = useState<string[]>(
    props.value ?? props.formInput.defaultValue ?? [],
  )
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [onlyShowSelected, setOnlyShowSelected] = useState<boolean>(false)

  const { data, isError, isLoading } = trpc.user.getList.useQuery()

  // set rfh value
  useEffect(() => {
    props.useFormReturns.setValue(
      props.formInput.name,
      userIds as Parameters<typeof props.useFormReturns.setValue>[1],
      {
        shouldDirty: props.formInput.defaultValue
          ? userIds !== props.formInput.defaultValue
          : userIds.length > 0,
      },
    )
  }, [userIds])

  if (isError || isLoading) return <Spinner className='h-12 w-12' />

  return (
    <div className='flex h-full grow flex-col gap-4'>
      <SearchBar
        className='mx-1'
        placeholder='搜尋使用者'
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
          {data.map((user) => {
            const isSelected = userIds.includes(user.id)
            const isDefault = props.formInput.defaultValue?.includes(user.id)

            // Filter
            if (onlyShowSelected && !isSelected) return null
            if (searchKeyword !== '' && !user.name.includes(searchKeyword))
              return null
            if (
              user.id === settings.SERVER_USER_ID ||
              user.id === settings.SERVER_CLIENTORDER_ID
            )
              return null

            return (
              <label
                className={twMerge(
                  'flex cursor-pointer items-center gap-4 rounded-2xl border p-2 hover:bg-stone-100 active:scale-95',
                  props.formInput.data?.onlyIncrease &&
                    isDefault &&
                    'pointer-events-none opacity-50',
                )}
                key={user.id}
              >
                <CheckBox
                  checked={isSelected}
                  onChange={(e) => {
                    let newIds: string[] = []
                    if (e.target.checked) {
                      newIds = [...userIds, user.id]
                    } else {
                      newIds = userIds.filter((userId) => userId !== user.id)
                    }
                    setUserIds(newIds)
                    props.onChange?.(newIds)
                  }}
                  disabled={isDefault && props.formInput.data?.onlyIncrease}
                />
                <span className='font-bold text-stone-500'>{user.name}</span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
