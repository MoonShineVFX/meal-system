import { TransactionType } from '@prisma/client'
import { settings } from './settings'

type Event = {
  date: Date
  type: TransactionType
  sourceUserId: string
  targetUserId: string
}

export default class EventsCentral {
  private _events: Event[] = []

  // Add an event
  public async add(event: Omit<Event, 'date'>) {
    this._events.push({ ...event, date: new Date() })
    this.purge()
  }

  // Get events for a user which are not expired
  public async getEvents(userId: string, date: Date | undefined) {
    return this._events.filter(
      (event) =>
        (event.sourceUserId === userId || event.targetUserId === userId) &&
        (date ? event.date.getTime() > date.getTime() : true)
    )
  }

  // Get all events
  public async listAll() {
    return this._events
  }

  // Check if the date is expired
  private static async validateDate(now: Date, target: Date) {
    return (
      now.getTime() - target.getTime() < settings.EVENT_EXPIRE_MINS * 60 * 1000
    )
  }

  // Purge expired events
  private async purge() {
    if (this._events.length <= 0) return

    const now = new Date()
    if (await EventsCentral.validateDate(now, this._events[0].date)) return

    while (this._events.length > 0) {
      if (await EventsCentral.validateDate(now, this._events[0].date)) break
      this._events.shift()
    }
  }
}

/* Global */
declare global {
  var eventsCentral: EventsCentral | undefined
}

export const eventsCentral = global.eventsCentral || new EventsCentral()

if (process.env.NODE_ENV !== 'production') {
  global.eventsCentral = eventsCentral
}
