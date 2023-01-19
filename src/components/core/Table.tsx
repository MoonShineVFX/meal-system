import React, { useCallback, useState, useEffect } from 'react'
import { TableVirtuoso } from 'react-virtuoso'
import { twMerge } from 'tailwind-merge'
import { ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { ChevronUpIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

type Layout<T extends object[]> = ({
  name: string
  colClassName?: string
  cellClassName?: string
} & (
  | {
      render: (row: T[number]) => number | string
      sort?: boolean // Only render primitive can be sorted defaultly
    }
  | {
      render: (row: T[number]) => number | string | JSX.Element
      sort?: (a: T[number], b: T[number]) => number
    }
))[]

export default function Table<T extends object[]>(props: {
  data: T
  columns: Layout<T>
}) {
  const [data, setData] = useState<T[number][]>(props.data)
  const [sortColumn, setSortColumn] = useState<
    { name: Layout<T>[number]['name']; type: 'asc' | 'desc' } | undefined
  >(undefined)

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
    <TableVirtuoso
      className='ms-scroll'
      data={data}
      fixedHeaderContent={() => (
        // Header
        <tr className='divide-stone-200 bg-stone-100'>
          {props.columns.map((col) => {
            const renderType = data[0] ? typeof col.render(data[0]) : 'string'
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
                  {sortType === 'desc' && <ChevronUpIcon className='h-4 w-4' />}
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
          {props.columns.map((col) => {
            const content = col.render(row)
            return (
              <td
                key={col.name}
                className={twMerge(
                  'whitespace-nowrap p-4',
                  typeof content === 'string' && 'text-left',
                  typeof content === 'number' && 'text-right',
                  col.cellClassName,
                )}
                title={typeof content === 'string' ? content : undefined}
              >
                {col.render(row)}
              </td>
            )
          })}
        </>
      )}
      components={{
        // Table
        Table: ({ style, ...props }) => (
          <div className='w-fit min-w-full overflow-hidden rounded-2xl border'>
            <table
              {...props}
              className='divide-y divide-stone-200'
              style={style}
            />
          </div>
        ),
        // Body
        TableBody: React.forwardRef(({ style, ...props }, ref) => (
          <tbody className='divide-y divide-stone-200' {...props} ref={ref} />
        )),
      }}
    />
  )
}
