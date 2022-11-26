import { GetServerSideProps } from 'next'
import QRCode from 'qrcode'
import { useState, useEffect } from 'react'

import trpc from '@/lib/client/trpc'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { orderNo } = context.params as { orderNo: string }

  return {
    props: {
      orderNo: orderNo,
    },
  }
}

export default function PageTwmpDeposit(props: { orderNo: string }) {
  const { data, isError, isLoading } = trpc.twmp.getDeposit.useQuery({
    twmpDepositId: props.orderNo,
  })
  const [qrcodeUrl, setQrcodeUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!data || !data.qrcode) return
    QRCode.toDataURL(data.qrcode).then(setQrcodeUrl)
  }, [data?.qrcode])

  if (isLoading) {
    return <>orderno: Loading...</>
  }

  if (isError) {
    return <>orderno: Error</>
  }

  if (data === null) {
    return <>orderno: Not found</>
  }

  if (data.callbackUrl) {
    return <>orderno: Redirecting...{data.callbackUrl}</>
  }

  return (
    <div>
      <h1>PageTwmpDeposit</h1>
      <p>orderNo: {props.orderNo}</p>
      <img src={qrcodeUrl} />
    </div>
  )
}
