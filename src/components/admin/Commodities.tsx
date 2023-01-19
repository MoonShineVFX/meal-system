import Table from '@/components/core/Table'
import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import Error from '@/components/core/Error'

export default function Commodities() {
  const { data, error, isError, isLoading } = trpc.commodity.get.useQuery()

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  return (
    <Table
      data={{
        name: {
          value: 123,
          render: (arg) => <td>{arg}</td>,
        },
      }}
    />
  )
}
