import trpc from '@/utils/trpc'

export default function PagePay() {
  const userInfoQuery = trpc.user.info.useQuery(undefined, {
    retry: false,
    refetchOnMount: false,
  })

  if (userInfoQuery.status !== 'success') return <div>loading</div>

  return (
    <div className="w-full flex justify-center">
      <form className="flex flex-col gap-8">
        <input
          name="currency"
          type="number"
          min={Math.min(userInfoQuery.data?.credits, 1)}
          max={userInfoQuery.data?.credits}
        />
        <button type="submit" className="p-2 border-2">
          pay
        </button>
      </form>
    </div>
  )
}
