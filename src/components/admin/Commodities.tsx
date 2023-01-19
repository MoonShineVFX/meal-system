import Image from '@/components/core/Image'
import Table from '@/components/core/Table'
import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import Error from '@/components/core/Error'
import { settings } from '@/lib/common'

export default function Commodities() {
  const { data, error, isError, isLoading } = trpc.commodity.get.useQuery()

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 p-8'>
        <Table
          data={data}
          columns={[
            {
              name: '圖片',
              render: (row) => (
                <div className='relative aspect-square h-16 overflow-hidden rounded-2xl'>
                  <Image
                    className='object-cover'
                    src={row.image?.path ?? settings.RESOURCE_FOOD_PLACEHOLDER}
                    sizes='64px'
                    alt={row.name}
                  />
                </div>
              ),
            },
            {
              name: '名稱',
              cellClassName: 'min-w-[18ch]',
              sort: true,
              render: (row) => row.name,
            },
            {
              name: '描述',
              cellClassName: 'max-w-[30ch] overflow-hidden overflow-ellipsis',
              sort: true,
              render: (row) => row.description,
            },
            {
              name: '價錢',
              sort: true,
              render: (row) => row.price * 10000000000000,
            },
          ]}
        />
      </div>
    </div>
  )
}
