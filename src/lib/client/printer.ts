import { settings } from '@/lib/common'

type PrintItem = {
  orderId: number
  name: string
  options?: string[]
  user: string
  index: [number, number]
}

export async function print(props: {
  date: Date
  items: PrintItem[]
  onSuccess: () => void
  onError: (error: Error) => void
}) {
  try {
    if (props.items.length === 0) {
      throw new Error('No items to print')
    }

    if (settings.PRINTER_API_URL === undefined) {
      throw new Error('Printer API URL is not set')
    }

    const bodyData = props.items.map((item) => ({
      order_id: item.orderId,
      date: props.date,
      index: item.index,
      name: item.name,
      options: item.options ?? [],
      user: item.user,
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
