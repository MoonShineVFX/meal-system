import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Menu } from '@prisma/client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FieldValues } from 'react-hook-form'

import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'
import Spinner from '@/components/core/Spinner'
import trpc from '@/lib/client/trpc'
import { getMenuName } from '@/lib/common'
import NumberInput from '../base/NumberInput'
import { InputFieldProps, MenuCOMData } from './define'

export default function MenuCOMField<T extends FieldValues>(
  props: InputFieldProps<'menucom', T>,
) {
  const [comDatas, setComDatas] = useState<MenuCOMData[]>(
    props.formInput.defaultValue ?? [],
  )
  const {
    data = [],
    isError,
    isLoading,
  } = trpc.menu.getActives.useQuery({
    includeIds:
      props.formInput.defaultValue?.map((comData) => comData.menuId) ??
      undefined,
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

  const retailMenus = useMemo(() => {
    if (!data) return []

    const comDatasMenuIds = comDatas.map((comData) => comData.menuId)
    return data.filter(
      (menu) => menu.date === null && !comDatasMenuIds.includes(menu.id),
    )
  }, [data, comDatas])

  const reservationMenus = useMemo(() => {
    if (!data) return undefined

    const comDatasMenuIds = comDatas.map((comData) => comData.menuId)
    const reservationData = data.filter(
      (menu) => menu.date !== null && !comDatasMenuIds.includes(menu.id),
    )
    if (reservationData.length === 0) return undefined

    return reservationData.reduce((acc, menu) => {
      const dateKey = menu.date!.toLocaleDateString('zh-TW', {
        month: 'long',
        day: 'numeric',
      })
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(menu)
      return acc
    }, {} as Record<string, Menu[]>)
  }, [data, comDatas])

  const handleAddCOMdata = useCallback(
    (menuId: number) => {
      setComDatas((prevIds) => [
        ...prevIds,
        { menuId, limitPerUser: 0, stock: 0 },
      ])
    },
    [setComDatas],
  )

  if (isError || isLoading) return <Spinner className='h-12 w-12' />

  return (
    <>
      <div className='flex flex-col gap-2'>
        {comDatas
          .map((comData) => {
            const menu = data.find((menu) => menu.id === comData.menuId)
            if (!menu) return null
            return {
              ...comData,
              date: menu.date,
              name: getMenuName(menu),
            }
          })
          .filter((comData) => comData !== null)
          .sort((a, b) => {
            if (!a || !b) return 0
            if (!a.date && !b.date) return b.menuId - a.menuId
            if (!a.date && b.date) return -1
            if (a.date && !b.date) return 1
            if (a.date && b.date) {
              if (b.date.getTime() - a.date.getTime() === 0) {
                return a.menuId - b.menuId
              }
              return b.date.getTime() - a.date.getTime()
            }
            return b.menuId - a.menuId
          })
          .map((comDataOpt) => {
            const comData = comDataOpt!
            return (
              <div key={comData.menuId} className='rounded-2xl border p-3'>
                <div className='flex items-center justify-between'>
                  <h1>{comData.name}</h1>
                  <button
                    type='button'
                    className='rounded-full p-1 text-stone-400 hover:bg-stone-200 active:scale-90'
                    onClick={() =>
                      setComDatas((prevIds) =>
                        prevIds.filter(
                          (prevId) => prevId.menuId !== comData.menuId,
                        ),
                      )
                    }
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
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        setComDatas((prevDatas) =>
                          prevDatas.map((prevData) => {
                            if (prevData.menuId === comData.menuId) {
                              return {
                                ...prevData,
                                stock: value,
                                limitPerUser:
                                  value !== 0
                                    ? Math.min(value, prevData.limitPerUser)
                                    : prevData.limitPerUser,
                              }
                            }
                            return prevData
                          }),
                        )
                      }}
                    />
                  </div>
                  <div className='flex items-center justify-between gap-2'>
                    <label className='whitespace-nowrap text-sm text-stone-400'>
                      每人限購
                    </label>
                    <NumberInput
                      className='w-1/2 rounded-md py-1 px-2 text-right'
                      min={0}
                      max={comData.stock === 0 ? 999 : comData.stock}
                      value={comData.limitPerUser}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        setComDatas((prevDatas) =>
                          prevDatas.map((prevData) => {
                            if (prevData.menuId === comData.menuId) {
                              return { ...prevData, limitPerUser: value }
                            }
                            return prevData
                          }),
                        )
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
      </div>
      {/* Dropdown */}
      <DropdownMenu
        label={
          <span className='flex items-center'>
            新增
            <PlusIcon className='h-4 w-4' />
          </span>
        }
        className='text-stone-400'
      >
        {retailMenus.length > 0 && (
          <DropdownMenu label='即時 / 零售'>
            {retailMenus.map((menu) => (
              <DropdownMenuItem
                key={menu.id}
                label={getMenuName(menu) ?? '未命名'}
                onClick={() => handleAddCOMdata(menu.id)}
              />
            ))}
          </DropdownMenu>
        )}
        {reservationMenus &&
          Object.entries(reservationMenus).map(([dateKey, menus]) => (
            <DropdownMenu key={dateKey} label={dateKey}>
              {menus.map((menu) => (
                <DropdownMenuItem
                  key={menu.id}
                  label={getMenuName(menu) ?? '未命名'}
                  onClick={() => handleAddCOMdata(menu.id)}
                />
              ))}
            </DropdownMenu>
          ))}
      </DropdownMenu>
    </>
  )
}
