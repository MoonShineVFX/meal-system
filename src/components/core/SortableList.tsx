import { useEffect, useState, useCallback } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { PencilIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { twMerge } from 'tailwind-merge'

import Button from '@/components/core/Button'
import Spinner from '@/components/core/Spinner'

type SortableItem = {
  id: number | string
  name?: string
}

type BatchEditButton<TSortableItem extends SortableItem> = {
  label: string
  isDanger?: boolean
  onClick: (ids: TSortableItem['id'][]) => void
}

export default function SortableList<
  TSortableItem extends SortableItem,
>(props: {
  header: string
  className?: string
  childrenClassName?: string | ((item: TSortableItem) => string)
  items: TSortableItem[]
  children?:
    | ((item: TSortableItem) => JSX.Element)
    | ((item: TSortableItem) => JSX.Element[])
  onReorder?: (items: TSortableItem[]) => void
  onReordering?: boolean
  onCreate?: () => void
  onCreateLabel?: string
  onRename?: (item: TSortableItem) => void
  batchEditButtons?: BatchEditButton<TSortableItem>[]
}) {
  // Hooks
  const [orderedItems, setOrderedItems] = useState<TSortableItem[]>(props.items)
  const [isBatchEdit, setIsBatchEdit] = useState(false)
  const [selectedIds, setSelectedIds] = useState<TSortableItem['id'][]>([])
  const [updateItemsTimout, setUpdatItemsTimout] = useState<
    NodeJS.Timeout | undefined
  >(undefined)

  // Clean up selected ids when edit mode changed
  useEffect(() => {
    setSelectedIds([])
  }, [isBatchEdit])

  // Exit edit mode when changed
  useEffect(() => {
    setIsBatchEdit(false)
  }, [orderedItems])

  // Assign categories and filter selected ids when props changed
  useEffect(() => {
    // Check if items are the same
    if (props.items.length === orderedItems.length) {
      const isSame = props.items.every((item) => {
        const targetItem = orderedItems.find((i) => i.id === item.id)
        if (!targetItem) {
          return false
        }
        return Object.keys(item).every((key) => {
          if (key === 'order') return true // Ignore order
          const k = key as keyof TSortableItem
          return targetItem[k] === item[k]
        })
      })
      if (isSame) {
        return
      }
    }

    setOrderedItems(props.items)

    const newIds = props.items.map((item) => item.id)
    setSelectedIds((selectedIds) =>
      selectedIds.filter((id) => newIds.includes(id)),
    )
  }, [props.items])

  // Reorder
  const handleItemsReorder = useCallback(
    (reorderedItems: TSortableItem[]) => {
      setOrderedItems(reorderedItems)
      if (updateItemsTimout) {
        clearTimeout(updateItemsTimout)
      }
      setUpdatItemsTimout(
        setTimeout(() => {
          props.onReorder?.(reorderedItems)
        }, 500),
      )
    },
    [updateItemsTimout, props.onReorder],
  )

  return (
    <div className={twMerge('flex h-full w-full flex-col', props.className)}>
      {/* Header */}
      <div className='mb-4 flex items-center'>
        <p className='flex items-center text-lg font-bold'>
          {props.header}
          {props.onReordering && (
            <Spinner className='ml-2 inline h-4 w-4 text-stone-400' />
          )}
        </p>
        <div className='ml-auto flex justify-end'>
          {isBatchEdit &&
            props.batchEditButtons &&
            props.batchEditButtons.map((buttonData, index) => (
              <Button
                key={index}
                spinnerClassName='h-4 w-4'
                label={buttonData.label}
                theme='support'
                textClassName={twMerge(
                  'text-sm text-stone-400 p-1',
                  buttonData.isDanger && 'text-red-400',
                )}
                className='disabled:opacity-50'
                isDisabled={selectedIds.length === 0}
                onClick={() => buttonData.onClick(selectedIds)}
              />
            ))}

          {props.batchEditButtons && (
            <Button
              label={isBatchEdit ? '完成' : '編輯'}
              theme='support'
              textClassName='text-sm text-stone-400 p-1'
              onClick={() => setIsBatchEdit((prev) => !prev)}
            />
          )}
        </div>
      </div>
      {/* List */}
      <div className='ms-scroll h-full flex-1 overflow-y-auto'>
        <Reorder.Group
          axis='y'
          className='flex flex-col gap-2'
          values={orderedItems}
          onReorder={handleItemsReorder}
        >
          {orderedItems.map((item) => (
            // Category items
            <DragItem
              key={item.id}
              className={
                typeof props.childrenClassName === 'function'
                  ? props.childrenClassName(item)
                  : props.childrenClassName
              }
              value={item}
              isBatchEdit={isBatchEdit}
              isSelected={selectedIds.includes(item.id)}
              onSelectChange={(id, checked) => {
                if (checked) {
                  setSelectedIds((prev) => [...prev, id])
                } else {
                  setSelectedIds((prev) =>
                    prev.filter((selectedId) => selectedId !== id),
                  )
                }
              }}
            >
              <>
                <button
                  disabled={isBatchEdit}
                  className='group/rename ml-2 flex cursor-pointer items-center rounded-2xl p-2 disabled:pointer-events-none hover:bg-stone-100 active:scale-95'
                  onClick={() => props.onRename?.(item)}
                >
                  {item.name ?? item.id}
                  {!isBatchEdit && (
                    <PencilIcon className='ml-1 inline h-3 w-3 stroke-1 text-stone-400 transition-transform group-hover/rename:rotate-45' />
                  )}
                </button>
                <div
                  className={twMerge(
                    'flex flex-1 items-center',
                    isBatchEdit && 'pointer-events-none opacity-60',
                  )}
                >
                  {props.children?.(item)}
                </div>
              </>
            </DragItem>
          ))}
        </Reorder.Group>
        {/* Footer */}
        {!isBatchEdit && props.onCreate && (
          <div
            className={twMerge(
              'mt-2 flex justify-center',
              props.items.length === 0 && 'mt-0',
            )}
          >
            <Button
              onClick={props.onCreate}
              label={
                <p className='flex items-center p-2 text-sm'>
                  {props.onCreateLabel ?? '新增'}{' '}
                  <PlusIcon className='inline h-4 w-4' />
                </p>
              }
              theme='support'
            />
          </div>
        )}
      </div>
    </div>
  )
}

function DragItem<TSortableItem extends SortableItem>(props: {
  children: JSX.Element | JSX.Element[]
  value: TSortableItem
  isBatchEdit?: boolean
  isSelected?: boolean
  onSelectChange?: (id: TSortableItem['id'], isChecked: boolean) => void
  className?: string
}) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={props.value}
      className={twMerge(
        'flex w-full items-center rounded-lg border bg-white p-2 pl-4 shadow',
        props.className,
      )}
      dragListener={false}
      dragControls={controls}
    >
      {props.isBatchEdit ? (
        <CheckCircleIcon
          className={twMerge(
            'h-6 w-6 cursor-pointer text-stone-200 active:scale-90',
            !props.isSelected && 'hover:text-yellow-400',
            props.isSelected && 'text-yellow-500',
          )}
          onClick={() =>
            props.onSelectChange?.(props.value.id, !props.isSelected)
          }
        />
      ) : (
        <Bars3Icon
          className='h-6 w-6 cursor-grab text-stone-300'
          onPointerDown={(e) => controls.start(e)}
        />
      )}
      {props.children}
    </Reorder.Item>
  )
}
