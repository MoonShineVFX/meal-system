import { useEffect, useState } from 'react'
import { Reorder } from 'framer-motion'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useDebounce } from 'usehooks-ts'

import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import { CategoryDatas } from '@/lib/client/trpc'

export default function Categories() {
  const { data, error, isError, isLoading } = trpc.category.get.useQuery()
  const [rootCategories, setRootCategories] = useState<CategoryDatas>([])
  const reorderedCategories = useDebounce(rootCategories, 500)

  // Reorder root categories
  useEffect(() => {
    if (reorderedCategories) {
      if (
        data?.map((category) => category.id).join(',') !==
        reorderedCategories.map((category) => category.id).join(',')
      ) {
        console.log('call reorder api')
      }
    }
  }, [reorderedCategories])

  // Apply data for reorder
  useEffect(() => {
    if (data) {
      setRootCategories(data)
    }
  }, [data])

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  return (
    <div>
      <Reorder.Group
        axis='y'
        className='flex flex-col gap-1'
        values={data}
        onReorder={setRootCategories}
      >
        {rootCategories.map((rootCategory) => (
          <Reorder.Item
            key={rootCategory.id}
            value={rootCategory}
            className='cursor-drag flex w-full max-w-xs items-center rounded-lg border bg-white p-2 shadow'
          >
            <Bars3Icon className='h-5 w-5 text-stone-300' />

            <p className='ml-2'>{rootCategory.name}</p>
            <p className='ml-auto text-sm text-stone-400'>
              {rootCategory.childCategories.length} 個子分類
            </p>
          </Reorder.Item>
        ))}
        <li>新增主分類</li>
      </Reorder.Group>
    </div>
  )
}
