import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import z from 'zod'

import { encodeCallbackCode } from '@/lib/server/twmp'

const querySchema = z.object({
  acqBank: z.string().min(1),
  terminalID: z.string().min(1),
  merchantId: z.string().min(1),
  orderNumber: z.string().min(1),
  cardPlan: z.string().min(1),
  responseCode: z.string().min(1),
  verifyCode: z.string().min(1),
})

export const getServerSideProps: GetServerSideProps = async (context) => {
  const query = querySchema.parse(context.query)
  const verifyCode = encodeCallbackCode(
    query.acqBank,
    query.cardPlan,
    query.merchantId,
    query.orderNumber,
    query.responseCode,
    query.terminalID,
  )

  if (verifyCode !== query.verifyCode) {
    throw new Error('VerifyCode mismatch')
  }

  return {
    props: {
      twmpDepositId: query.orderNumber,
    },
  }
}

export default function PageTwmpResult(props: { twmpDepositId: string }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(router.pathname, undefined, { shallow: true })
  }, [])

  return (
    <div>
      <h1>{props.twmpDepositId}</h1>
    </div>
  )
}
