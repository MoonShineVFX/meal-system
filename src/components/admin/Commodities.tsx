import Table, {td} from '@/components/core/Table'
import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import Error from '@/components/core/Error'

export default function Commodities() {
  const { data, error, isError, isLoading } = trpc.commodity.get.useQuery()

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  console.log(data)

  return (
    <Table
      data={[
        td({
          name: 'Name',
          value: 'nwow',
          render: (value) => <span>{value}</span>,
        }),
        td({
          name: 'Name',
          value: 123,
          render: (value) => <span>{value}</span>,
        }),
      ]}
    />
  )
}
