import { NextPageContext } from 'next'
import Error from '@/components/core/Error'

export default function PageError({ statusCode }: { statusCode?: number }) {
  return (
    <Error
      title={statusCode?.toString()}
      description={statusCode ? '伺服器發生錯誤' : '客戶端發生錯誤'}
    />
  )
}

PageError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
