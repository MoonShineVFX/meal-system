import { NextPageContext } from 'next'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function PageError({ statusCode }: { statusCode: number }) {
  return (
    <div className='grid h-full w-full place-content-center'>
      <div className='flex flex-col items-center gap-2'>
        <ExclamationCircleIcon className='h-16 w-16 font-bold text-red-400' />
        {statusCode && <p className='text-lg font-bold'>{statusCode}</p>}
        <p className='text-stone-500'>
          {statusCode ? `伺服器發生錯誤` : '客戶端發生錯誤'}
        </p>
      </div>
    </div>
  )
}

PageError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
