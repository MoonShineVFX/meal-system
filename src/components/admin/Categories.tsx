import { useCallback, useEffect, useState, startTransition } from 'react'
import { Reorder } from 'framer-motion'
import { Bars3Icon } from '@heroicons/react/24/outline'

import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import { CategoryDatas } from '@/lib/client/trpc'

export default function Categories() {
  const { data, error, isError, isLoading } = trpc.category.get.useQuery()
  const [rootCategories, setRootCategories] = useState<CategoryDatas>([])
  const [isReordered, setIsReordered] = useState(false)

  const handleReorder = useCallback((categories: CategoryDatas) => {
    if (!isReordered) {
      setIsReordered(true)
      console.log('set true')
    }
    setRootCategories(categories)
  }, [])

  const handleReorderComplete = useCallback(() => {
    startTransition(() => {
      if (isReordered) {
        console.log('reorder complete')
        setIsReordered(false)
      }
    })
  }, [])

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
            onLayoutAnimationComplete={handleReorderComplete}
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
