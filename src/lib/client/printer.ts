import { settings, OptionValue, getOptionName } from '@/lib/common'

type PrintItem = {
  orderId: number
  name: string
  options?: OptionValue[]
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
      options: item.options
        ? item.options.map((o) => {
            const name = getOptionName(o)
            const price = typeof o === 'string' ? 0 : o.price

            if (price > 0) return `${name} $${price}`
            return name
          })
        : [],
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
