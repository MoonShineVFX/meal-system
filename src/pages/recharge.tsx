import trpc from '@/utils/trpc'
import { FormEvent } from 'react'

interface RechargeFormElements extends HTMLFormControlsCollection {
  targetUserId: HTMLSelectElement
  amount: HTMLInputElement
}

interface RechargeFormElement extends HTMLFormElement {
  readonly elements: RechargeFormElements
}

export default function PageRecharge() {
  const userInfoQuery = trpc.user.info.useQuery(undefined, {
    retry: false,
    refetchOnMount: false,
  })
  const rechargeMutation = trpc.trade.recharge.useMutation()

  const handleRecharge = async (event: FormEvent<RechargeFormElement>) => {
    event.preventDefault()
    const targetUserId = event.currentTarget.elements.targetUserId.value
    const amount = event.currentTarget.elements.amount.value
    rechargeMutation.mutate(
      { targetUserId, amount: parseInt(amount) },
      {
        onSuccess: async () => userInfoQuery.refetch(),
      }
    )
  }

  if (userInfoQuery.status !== 'success') return <div>loading</div>
  if (userInfoQuery.data.role !== 'ADMIN')
    return <div>you are not an admin</div>

  return (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-center text-3xl">Recharge</h1>
      <form className="flex flex-col gap-4" onSubmit={handleRecharge}>
        <select name="targetUserId">
          <option value="wang">王小明</option>
          <option value="mei">孫小美</option>
        </select>
        <input name="amount" type="number" min={1} max={1000000} />
        <button type="submit" className="p-2 border-2">
          Charge
        </button>
      </form>
    </div>
  )
}
