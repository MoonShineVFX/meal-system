import Head from 'next/head'

import { settings } from '@/lib/common'

export default function Title(props: { prefix?: string }) {
  return (
    <Head>
      <title>
        {props.prefix ? `${props.prefix} | ${settings.TITLE}` : settings.TITLE}
      </title>
    </Head>
  )
}
