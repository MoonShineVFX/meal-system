import 'dotenv/config'
import {
  PUSHER_CHANNEL,
  PUSHER_EVENT,
  PusherEventPayload,
} from '../src/lib/common/pusher'
import { emitPusherEvent } from '../src/lib/server/pusher'

const EVENTS: PusherEventPayload[] = [
  { type: PUSHER_EVENT.POS_ADD, skipNotify: true },
  { type: PUSHER_EVENT.MENU_ADD, skipNotify: true },
  { type: PUSHER_EVENT.MENU_UPDATE, skipNotify: true },
  { type: PUSHER_EVENT.SUPPLIER_ADD, skipNotify: true },
  { type: PUSHER_EVENT.SUPPLIER_UPDATE, skipNotify: true },
  { type: PUSHER_EVENT.COMMODITY_ADD, skipNotify: true },
  { type: PUSHER_EVENT.COMMODITY_UPDATE, skipNotify: true },
  { type: PUSHER_EVENT.CATEGORY_ADD, skipNotify: true },
  { type: PUSHER_EVENT.CATEGORY_UPDATE, skipNotify: true },
  { type: PUSHER_EVENT.OPTION_SETS_ADD, skipNotify: true },
  { type: PUSHER_EVENT.OPTION_SETS_UPDATE, skipNotify: true },
]

async function main() {
  console.log('Starting staff signal trigger...')
  console.log('Press Ctrl+C to stop\n')

  const emitNextEvent = async () => {
    console.log(`[${new Date().toLocaleTimeString()}] Emitting events`)

    const emitResults = await Promise.all(
      EVENTS.map((event) => emitPusherEvent(PUSHER_CHANNEL.STAFF, event)),
    )

    console.log(
      `[${new Date().toLocaleTimeString()}] Emitted ${
        emitResults.length
      } events`,
    )
    console.log(
      `[${new Date().toLocaleTimeString()}] Success: ${
        emitResults.filter((result) => result).length
      }`,
    )
    console.log(
      `[${new Date().toLocaleTimeString()}] Failed: ${
        emitResults.filter((result) => !result).length
      }`,
    )
  }

  await emitNextEvent()

  setInterval(emitNextEvent, 10000)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
