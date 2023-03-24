import { settings } from '@/lib/common'

type PrintItem = {
  name: string
  options?: string[]
}

export async function print(props: {
  orderId: number
  date: Date
  items: PrintItem[]
  user: string
  onSuccess: () => void
  onError: (error: Error) => void
}) {
  try {
    if (props.items.length === 0) {
      throw new Error('No items to print')
    }

    const bodyData = props.items.map((item, index) => ({
      order_id: props.orderId,
      date: props.date,
      index: [index + 1, props.items.length],
      name: item.name,
      options: item.options ?? [],
      user: props.user,
    }))
    const response = await fetch(`${settings.PRINTER_API_URL}/api/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    })

    if (response.ok) {
      props.onSuccess()
    } else {
      props.onError(new Error(await response.text()))
    }
  } catch (error) {
    if (error instanceof Error) {
      props.onError(error)
    } else {
      props.onError(new Error('Unknown error'))
    }
  }
}
