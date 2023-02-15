import React, { useCallback, useState, useEffect } from 'react'
import { TableVirtuoso } from 'react-virtuoso'
import { twMerge } from 'tailwind-merge'
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'

import { ContextMenu, ContextMenuItem } from './ContextMenu'

type Layout<T extends object[]> = {
  name: string
  unhidable?: boolean
  colClassName?: string
  cellClassName?: string
  hint?: (row: T[number]) => string
  render: (row: T[number]) => number | string | JSX.Element
  sort?: ((a: T[number], b: T[number]) => number) | boolean
}[]

export default function Table<
  T extends object[],
  K extends keyof T[number],
>(props: {
  data: T
  columns: Layout<T>
  idField?: K
  onSelectedIdsChange?: (ids: T[number][K][]) => void
}) {
  const [selectedIds, setSelectedIds] = useState<T[number][K][]>([])
  const [data, setData] = useState<T[number][]>(props.data)
  const [sortColumn, setSortColumn] = useState<
    { name: Layout<T>[number]['name']; type: 'asc' | 'desc' } | undefined
  >(undefined)
  const [filterColumns, setFilterColumns] = useState<
    Layout<T>[number]['name'][]
  >([])
  const contextMenuRef = React.useRef<HTMLTableRowElement>(null)

  // Sort data
  useEffect(() => {
    if (!sortColumn) {
      setData(props.data)
      return
    }

    const col = props.columns.find((col) => col.name === sortColumn.name)
    if (!col) {
      setData(props.data)
      console.warn('Column not found to sort')
      return
    }

    if (typeof col.sort === 'function') {
      if (sortColumn.type === 'asc') {
        setData([...props.data].sort(col.sort))
      } else if (sortColumn.type === 'desc') {
        setData([...props.data].sort(col.sort).reverse())
      }
    } else if (col.sort === true) {
      const sortedData = [...props.data].sort((a, b) => {
        const aRender = col.render(a)
        if (typeof aRender === 'string') {
          return aRender.localeCompare(col.render(b) as string)
        }
        return (col.render(a) as number) - (col.render(b) as number)
      })
      if (sortColumn.type === 'asc') {
        setData(sortedData)
      } else if (sortColumn.type === 'desc') {
        setData(sortedData.reverse())
      }
    }
  }, [props.data, sortColumn])

  // onchange selected ids
  useEffect(() => {
    if (props.onSelectedIdsChange) {
      props.onSelectedIdsChange(selectedIds)
    }
  }, [selectedIds])

  // Toggle sort column
  const handleSortColumn = useCallback(
    (columnName: string) => {
      if (!sortColumn || sortColumn.name !== columnName) {
        setSortColumn({ name: columnName, type: 'asc' })
        return
      } else if (sortColumn.name === columnName) {
        if (sortColumn.type === 'asc') {
          setSortColumn({ name: columnName, type: 'desc' })
          return
        } else if (sortColumn.type === 'desc') {
          setSortColumn(undefined)
          return
        }
      }
    },
    [sortColumn],
  )

  return (
    <div className='h-full w-fit min-w-full overflow-hidden rounded-2xl border'>
      <TableVirtuoso
        className='ms-scroll'
        data={data}
        increaseViewportBy={4}
        fixedHeaderContent={() => (
          // Header
          <tr className='bg-stone-100 shadow' ref={contextMenuRef}>
            {/* ContextMenu */}
            <ContextMenu parentRef={contextMenuRef}>
              {props.columns.map((col) => {
                if (col.unhidable) return null
                const isFiltered = filterColumns.includes(col.name)
                return (
                  <ContextMenuItem
                    key={col.name}
                    label={
                      <span
                        className={twMerge(
                          'flex items-center gap-2',
                          isFiltered && 'text-stone-400',
                        )}
                      >
                        {isFiltered ? (
                          <EyeSlashIcon className='h-4 w-4' />
                        ) : (
                          <EyeIcon className='h-4 w-4' />
                        )}
                        {col.name}
                      </span>
                    }
                    onClick={() => {
                      if (isFiltered) {
                        setFilterColumns(
                          filterColumns.filter((name) => name !== col.name),
                        )
                      } else {
                        setFilterColumns([...filterColumns, col.name])
                      }
                    }}
                  />
                )
              })}
            </ContextMenu>
            {/* Select field */}
            {props.idField && (
              <th
                key='select'
                role='col'
                className={'whitespace-nowrap p-4 hover:bg-stone-200'}
              >
                <label className='flex cursor-pointer items-center'>
                  <input
                    className='focus:ring-none mr-1 h-5 w-5 cursor-pointer rounded-md border-stone-300 text-yellow-500 focus:ring-transparent'
                    type='checkbox'
                    checked={selectedIds.length === data.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(data.map((row) => row[props.idField!]))
                      } else {
                        setSelectedIds([])
                      }
                    }}
                  />
                  <span className='text-sm font-normal'>全選</span>
                </label>
              </th>
            )}
            {props.columns
              .filter((col) => !filterColumns.includes(col.name))
              .map((col) => {
                const renderType = data[0]
                  ? typeof col.render(data[0])
                  : 'string'
                let sortType: 'asc' | 'desc' | 'none' | undefined
                if (col.sort) {
                  if (sortColumn?.name === col.name) {
                    sortType = sortColumn.type
                  } else {
                    sortType = 'none'
                  }
                } else {
                  sortType = undefined
                }

                return (
                  <th
                    key={col.name}
                    role='col'
                    className={twMerge(
                      'whitespace-nowrap p-4 hover:bg-stone-200',
                      col.colClassName,
                    )}
                  >
                    <div
                      className={twMerge(
                        'flex items-center font-normal',
                        renderType === 'string' && 'justify-start',
                        renderType === 'number' && 'justify-end',
                        renderType === 'object' && 'justify-center',
                        col.sort && 'cursor-pointer',
                      )}
                      onClick={() => handleSortColumn(col.name)}
                    >
                      {col.name}
                      {/* Sort icon */}
                      {sortType === 'asc' && (
                        <ChevronDownIcon className='h-4 w-4' />
                      )}
                      {sortType === 'desc' && (
                        <ChevronUpIcon className='h-4 w-4' />
                      )}
                      {sortType === 'none' && (
                        <ChevronUpDownIcon className='h-4 w-4' />
                      )}
                    </div>
                  </th>
                )
              })}
            <th className='w-full hover:bg-stone-200'></th>
          </tr>
        )}
        itemContent={(_, row) => (
          <>
            {/* Row */}
            {/* select */}
            {props.idField && (
              <td key='select' className='p-4 text-center'>
                <input
                  className='focus:ring-none h-6 w-6 cursor-pointer rounded-lg border-stone-300 text-yellow-500 focus:ring-transparent'
                  type='checkbox'
                  checked={selectedIds.includes(row[props.idField])}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds([...selectedIds, row[props.idField!]])
                    } else {
                      setSelectedIds(
                        selectedIds.filter((id) => id !== row[props.idField!]),
                      )
                    }
                  }}
                />
              </td>
            )}
            {/* content */}
            {props.columns
              .filter((col) => !filterColumns.includes(col.name))
              .map((col) => {
                const content = col.render(row)
                const hint = col.hint ? col.hint(row) : undefined
                return (
                  <td
                    key={col.name}
                    className={twMerge(
                      'whitespace-nowrap p-4',
                      typeof content === 'string' && 'text-left',
                      typeof content === 'number' && 'text-right',
                      col.cellClassName,
                    )}
                    title={
                      hint ??
                      (typeof content === 'string' ? content : undefined)
                    }
                  >
                    {col.render(row)}
                  </td>
                )
              })}
            {/* filler */}
            <td className='w-full'></td>
          </>
        )}
        components={{
          // Table
          Table: ({ style, ...props }) => (
            <table
              {...props}
              className='divide-y divide-stone-200'
              style={style}
            />
          ),
          TableRow: ({ style, ...rest }) => (
            <tr
              {...rest}
              className={twMerge(
                'hover:bg-stone-100',
                props.idField &&
                  selectedIds.includes(
                    data[rest['data-item-index']][props.idField!],
                  ) &&
                  'bg-yellow-50 hover:bg-yellow-100',
              )}
              style={style}
            />
          ),
          // Body
          TableBody: React.forwardRef(({ style, ...props }, ref) => (
            <tbody
              className='divide-y divide-stone-200'
              {...props}
              ref={ref}
              style={style}
            />
          )),
        }}
      />
    </div>
  )
}
