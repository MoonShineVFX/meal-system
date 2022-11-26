import { NextPageContext } from 'next'

export default function PageError({ statusCode }: { statusCode: number }) {
  return (
    <div className={`text-center text-red-500`}>
      {statusCode ? `伺服器發生錯誤 [代碼:${statusCode}]` : '客戶端發生錯誤'}
    </div>
  )
}

PageError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
