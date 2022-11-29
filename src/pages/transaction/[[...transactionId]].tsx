import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useState } from 'react'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { transactionId } = context.params as { transactionId: string[] }
  console.log('re render')

  return {
    props: {
      transactionId: transactionId
        ? transactionId.length > 0
          ? transactionId[0]
          : undefined
        : undefined,
    },
  }
}

export default function PageTransaction(props: { transactionId?: string }) {
  const [testState, setTestState] = useState(0)

  return (
    <div>
      <h1 onClick={() => setTestState((prev) => prev + 1)}>PageTransaction</h1>
      <ul>
        <li>
          <Link href={'/transaction/123'}>123</Link>
        </li>
        <li>
          <Link href={'/transaction/456'}>456</Link>
        </li>
        <li>
          <Link href={'/transaction/789'}>789</Link>
        </li>
      </ul>
      <p>transactionId: {props.transactionId}</p>
      <p>testState: {testState}</p>
    </div>
  )
}
