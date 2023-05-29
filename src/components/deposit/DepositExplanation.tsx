import trpc from '@/lib/client/trpc'
import { settings } from '@/lib/common'

export default function DepositExplanation() {
  const metaQuery = trpc.deposit.getMeta.useQuery()

  return (
    <>
      <p className='mt-2 text-sm text-stone-400'>
        - 儲值台幣與夢想幣的比值是
        <span className='mx-1 text-base font-bold text-yellow-500'>
          1:{metaQuery.data?.ratio ?? '?'}
        </span>
        ，離職時可提領回薪資帳戶。
      </p>
      <p className='mt-2 text-sm text-stone-400'>
        - 點數為每工作日發放，每月一日歸零。結帳時優先折抵，不夠才會扣除夢想幣，
        <span className='font-bold'>取消訂單不會退還</span>。
      </p>
      <p className='mt-2 text-sm text-stone-400'>
        - 有任何問題請使用下列管道：
        <a
          className='rounded-2xl p-1 font-bold text-stone-500 hover:bg-stone-100'
          href={settings.ZULIP}
          target='_blank'
        >
          Zulip 公會頻道
        </a>
        、營運部、或來信
        <a
          className='rounded-2xl p-1 font-bold text-stone-500 hover:bg-stone-100'
          href={`mailto:${settings.EMAIL}`}
          target='_blank'
        >
          {settings.EMAIL}
        </a>
        詢問。
      </p>
    </>
  )
}
