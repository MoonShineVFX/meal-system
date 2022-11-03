import trpc from '@/trpc/client/client'
import { CurrencyType } from '@prisma/client'
import { useState, FormEvent } from 'react'

interface ChargeFormElements extends HTMLFormControlsCollection {
  currency: HTMLSelectElement
  amount: HTMLInputElement
}

interface ChargeFormElement extends HTMLFormElement {
  readonly elements: ChargeFormElements
}

export default function PagePay() {
  const userInfoQuery = trpc.user.info.useQuery(undefined)
  const chargeMutation = trpc.trade.charge.useMutation()
  const trpcContext = trpc.useContext()
  const [currency, setCurrency] = useState<CurrencyType>(CurrencyType.POINT)

  const handleCharge = async (event: FormEvent<ChargeFormElement>) => {
    event.preventDefault()
    const currency = event.currentTarget.elements.currency.value
    const amount = event.currentTarget.elements.amount.value
    chargeMutation.mutate(
      {
        amount: parseInt(amount),
        currency: currency as CurrencyType,
      },
      {
        onSuccess: () => trpcContext.user.info.invalidate(),
      }
    )
  }

  if (userInfoQuery.status !== 'success') return <div>loading</div>

  const maxPaymentAmount =
    userInfoQuery.data[currency === 'POINT' ? 'points' : 'credits']

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <h1 className="text-3xl">Pay</h1>
      <form className="flex flex-col gap-8" onSubmit={handleCharge}>
        <select
          name="currency"
          value={currency}
          onChange={(event) => setCurrency(event.target.value as CurrencyType)}
        >
          <option value="POINT">Point</option>
          <option value="CREDIT">Credit</option>
        </select>
        <input
          name="amount"
          type="number"
          min={Math.min(maxPaymentAmount, 1)}
          max={Math.max(maxPaymentAmount, 1)}
        />
        <button type="submit" className="p-2 border-2">
          pay
        </button>
      </form>
    </div>
  )
}
