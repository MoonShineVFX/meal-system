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
import CheckBox from '@/components/form/base/CheckBox'

type Layout<T extends object[]> = {
  name: string
  unhidable?: boolean
  hideByDefault?: boolean
  colClassName?: string
  cellClassName?: string
  hint?: (row: T[number]) => string
  render: (row: T[number]) => number | string | JSX.Element
  sort?: ((a: T[number], b: T[number]) => number) | boolean
  align?: 'left' | 'center' | 'right'
}[]

export default function Table<
  T extends object[],
  K extends keyof T[number],
>(props: {
  data: T
  columns: Layout<T>
  idField?: K
  onSelectedIdsChange?: (ids: T[number][K][]) => void
  onDataFilter?: (data: T[number][]) => T
  footer?: JSX.Element
  size?: 'sm'
  emptyIndicator?: JSX.Element
}) {
  const [selectedIds, setSelectedIds] = useState<T[number][K][]>([])
  const [tableData, setTableData] = useState<T[number][]>(props.data)
  const [sortColumn, setSortColumn] = useState<
    { name: Layout<T>[number]['name']; type: 'asc' | 'desc' } | undefined
  >(undefined)
  const [filterColumns, setFilterColumns] = useState<
    Layout<T>[number]['name'][]
  >(props.columns.filter((col) => col.hideByDefault).map((col) => col.name))
  const tableHeaderRef = React.useRef<HTMLTableRowElement>(null)

  // Sort and filter tableData
  useEffect(() => {
    let tableData = [...props.data]

    // If sort
    if (sortColumn) {
      const col = props.columns.find((col) => col.name === sortColumn.name)
      if (!col) {
        console.warn('Column not found to sort')
      } else if (typeof col.sort === 'function') {
        if (sortColumn.type === 'asc') {
          tableData = [...props.data].sort(col.sort).reverse()
        } else if (sortColumn.type === 'desc') {
          tableData = [...props.data].sort(col.sort)
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
          tableData = sortedData.reverse()
        } else if (sortColumn.type === 'desc') {
          tableData = sortedData
        }
      }
    }

    // If filter
    if (props.onDataFilter) {
      tableData = props.onDataFilter(tableData)
    }

    setTableData(tableData)
  }, [props.data, sortColumn, props.onDataFilter])

  // onchange selected ids
  useEffect(() => {
    if (props.onSelectedIdsChange) {
      props.onSelectedIdsChange(selectedIds)
    }
  }, [selectedIds])

  // clean selected ids when data changes
  useEffect(() => {
    setSelectedIds([])
  }, [props.data])

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

  const isAllTableDataSelected =
    selectedIds.length === tableData.length &&
    tableData.length > 0 &&
    tableData.every((row) => selectedIds.includes(row[props.idField!]))

  return (
    <div className='h-full w-fit min-w-full overflow-hidden rounded-2xl border'>
      <TableVirtuoso
        className='ms-scroll'
        data={tableData}
        increaseViewportBy={4}
        fixedHeaderContent={() => (
          // Header
          <tr className='bg-stone-100 shadow' ref={tableHeaderRef}>
            {/* ContextMenu */}
            <ContextMenu parentRef={tableHeaderRef}>
              {props.columns.map((col, index) => {
                if (col.unhidable) return null
                const isFiltered = filterColumns.includes(col.name)
                return (
                  <ContextMenuItem
                    key={col.name + index}
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
                  <CheckBox
                    ref={(input) => {
                      if (input) {
                        input.indeterminate =
                          selectedIds.length > 0 && !isAllTableDataSelected
                      }
                    }}
                    className={twMerge(
                      'peer/checkbox mr-1 h-5 w-5 disabled:opacity-50',
                      props.size === 'sm' && 'h-4 w-4',
                    )}
                    checked={isAllTableDataSelected}
                    disabled={tableData.length === 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(
                          tableData.map(
                            (row: T[number]) => row[props.idField!],
                          ),
                        )
                      } else {
                        setSelectedIds([])
                      }
                    }}
                  />
                  <span
                    className={twMerge(
                      'text-sm font-normal peer-disabled/checkbox:opacity-50',
                      props.size === 'sm' && 'hidden',
                    )}
                  >
                    全選
                  </span>
                </label>
              </th>
            )}
            {props.columns
              .filter((col) => !filterColumns.includes(col.name))
              .map((col, index) => {
                const renderType = tableData[0]
                  ? typeof col.render(tableData[0])
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
                    key={col.name + index}
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
                        col.align === 'center' && 'justify-center',
                        col.align === 'right' && 'justify-end',
                        col.align === 'left' && 'justify-start',
                        col.sort && 'cursor-pointer',
                        sortType && sortType !== 'none' && 'font-bold',
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
        itemContent={(_, row: T[number]) => (
          <>
            {/* Row */}
            {/* select */}
            {props.idField && (
              <td
                key='select'
                className={twMerge(
                  'p-4 text-center',
                  props.size === 'sm' && 'p-1',
                )}
              >
                <CheckBox
                  className={twMerge(
                    'h-6 w-6',
                    props.size === 'sm' && 'h-4 w-4',
                  )}
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
              .map((col, index) => {
                const content = col.render(row)
                const hint = col.hint
                  ? col.hint(row)
                  : typeof content === 'string'
                  ? content
                  : typeof content === 'number'
                  ? content.toString()
                  : undefined
                return (
                  <td
                    key={col.name + index}
                    className={twMerge(
                      'whitespace-nowrap p-4',
                      'even:bg-stone-50 group-hover/row:bg-yellow-50',
                      props.idField &&
                        selectedIds.includes(row[props.idField!]) &&
                        'bg-yellow-100 even:bg-yellow-100 group-hover/row:bg-yellow-100',
                      typeof content === 'string' && 'text-left',
                      typeof content === 'number' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.align === 'left' && 'text-left',
                      col.cellClassName,
                    )}
                    title={hint}
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
            <>
              <tr
                {...rest}
                className={twMerge(
                  'group/row hover:bg-yellow-50',
                  props.idField &&
                    selectedIds.includes(
                      tableData[rest['data-item-index']][props.idField!],
                    ) &&
                    'bg-yellow-100 hover:bg-yellow-100',
                )}
                style={style}
              />
            </>
          ),
          // Body
          TableBody: React.forwardRef(({ style, children, ...rest }, ref) => (
            <tbody
              className='divide-y divide-stone-200'
              {...rest}
              ref={ref}
              style={style}
              children={
                <>
                  {/* Content */}
                  {children}
                  {/* Empty */}
                  {tableData.length === 0 &&
                    (props.emptyIndicator ?? (
                      <tr className='relative w-full'>
                        <td className='absolute inset-x-0 py-8 text-center tracking-widest text-stone-400'>
                          沒有資料
                        </td>
                      </tr>
                    ))}
                  {/* Footer */}
                  {props.footer && <tr>{props.footer}</tr>}
                </>
              }
            />
          )),
        }}
      />
    </div>
  )
}
