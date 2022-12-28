import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import z from 'zod'

import { encodeCallbackCode } from '@/lib/server/twmp'

const querySchema = z.object({
  acqBank: z.string().min(1),
  terminalID: z.string().min(1),
  merchantId: z.string().min(1),
  orderNumber: z.string().cuid(),
  cardPlan: z.string().min(1),
  responseCode: z.string().min(1),
  verifyCode: z.string().min(1),
})

export const getServerSideProps: GetServerSideProps = async (context) => {
  let errorMessage = undefined

  try {
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
      errorMessage = '驗證碼錯誤'
    } else if (query.responseCode !== '0000') {
      errorMessage = `交易錯誤: 代碼 [${query.responseCode}]`
    } else {
      return {
        props: {
          twmpDepositId: query.orderNumber,
        },
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      errorMessage = '網址參數錯誤'
    } else if (error instanceof Error) {
      errorMessage = error.message
    } else {
      errorMessage = '未知錯誤'
    }
  }

  return {
    props: {
      errorMessage: errorMessage,
    },
  }
}

export default function PageTwmpResult(props: {
  twmpDepositId?: string
  errorMessage?: string
}) {
  const router = useRouter()

  useEffect(() => {
    if (!props.errorMessage && props.twmpDepositId) {
      router.push(`/twmp/${props.twmpDepositId}?callback=true`)
    } else {
      router.replace(router.asPath, undefined, { shallow: true })
    }
  }, [])

  if (props.errorMessage || !props.twmpDepositId) {
    return <div>errmsg: {props.errorMessage}</div>
  }

  return (
    <div>
      <h1>{props.twmpDepositId} 轉址中</h1>
    </div>
  )
}
