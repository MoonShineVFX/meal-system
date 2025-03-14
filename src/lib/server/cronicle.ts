import { settings } from '../common'

// Base types and interfaces
export interface ApiResponse {
  code: number
  description?: string
}

// Event Timing Object type
export interface EventTimingObject {
  years?: number[]
  months?: number[] // 1-12
  days?: number[] // 1-31
  weekdays?: number[] // 0-6 (Sunday is 0)
  hours?: number[] // 0-23
  minutes?: number[] // 0-59
}

// Event Data type
export interface EventData {
  id?: string
  title: string
  enabled: boolean | number
  category: string
  plugin: string
  target: string
  params: Record<string, any>
  timing: EventTimingObject
  timezone: string
  catch_up?: boolean
  max_children?: number
  timeout?: number
  retries?: number
  retry_delay?: number
  chain?: string
  chain_error?: string
  detached?: number
  notify_success?: string
  notify_fail?: string
  web_hook?: string
  notes?: string
  multiplex?: number
  memory_limit?: number
  memory_sustain?: number
  cpu_limit?: number
  cpu_sustain?: number
  log_max_size?: number
  cpu_limit_overload?: number
  cpu_sustain_overload?: number
  log_max_files?: number
  queue?: boolean
  queue_max?: number
  modified?: number
  created?: number
  username?: string
  stagger?: number
}

// API client configuration
export interface CronicleApiConfig {
  baseUrl: string
  apiKey: string
}

// 1. get_schedule API endpoint types
export interface GetScheduleParams {
  offset?: number
  limit?: number
}

export interface GetScheduleResponse extends ApiResponse {
  rows: EventData[]
  list: {
    page_size: number
    first_page: number
    last_page: number
    length: number
    type: string
  }
}

// 2. get_event API endpoint types
export interface GetEventParams {
  id: string
}

export interface GetEventResponse extends ApiResponse {
  event: EventData
}

// 3. create_event API endpoint types
export type CreateEventInput = Pick<
  EventData,
  'title' | 'enabled' | 'category' | 'plugin' | 'target'
> &
  Partial<
    Omit<EventData, 'title' | 'enabled' | 'category' | 'plugin' | 'target'>
  >

export interface CreateEventResponse extends ApiResponse {
  id: string
}

// 4. update_event API endpoint types
export interface UpdateEventParams {
  id: string
  event: Partial<EventData>
}

export interface UpdateEventResponse extends ApiResponse {
  id: string
}

// 5. delete_event API endpoint types
export interface DeleteEventParams {
  id: string
}

export interface DeleteEventResponse extends ApiResponse {
  id: string
}

class CronicleApi {
  public constructor() {}

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
  ): Promise<T> {
    const url = `${settings.CRONICLE_API_URL}/api/app/${endpoint}/v1`

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': settings.CRONICLE_API_KEY,
      },
    }

    if (data) {
      options.body = JSON.stringify({
        ...data,
        api_key: settings.CRONICLE_API_KEY,
      })
    }

    const response = await fetch(url, options)
    const result = await response.json()

    if (result.code !== 0) {
      throw new Error(result.description || 'Unknown API error')
    }

    return result as T
  }

  // 1. get_schedule API endpoint
  async getSchedule(
    params: GetScheduleParams = {},
  ): Promise<GetScheduleResponse> {
    return this.request<GetScheduleResponse>('get_schedule', 'POST', params)
  }

  // 2. get_event API endpoint
  async getEvent(params: GetEventParams): Promise<GetEventResponse> {
    return this.request<GetEventResponse>('get_event', 'POST', params)
  }

  // 3. create_event API endpoint
  async createEvent(event: CreateEventInput): Promise<CreateEventResponse> {
    return this.request<CreateEventResponse>('create_event', 'POST', { event })
  }

  // 4. update_event API endpoint
  async updateEvent(params: UpdateEventParams): Promise<UpdateEventResponse> {
    return this.request<UpdateEventResponse>('update_event', 'POST', params)
  }

  // 5. delete_event API endpoint
  async deleteEvent(params: DeleteEventParams): Promise<DeleteEventResponse> {
    return this.request<DeleteEventResponse>('delete_event', 'POST', params)
  }
}

/* Global */
declare global {
  var cronicleApi: CronicleApi | undefined
}

export const cronicleApi: CronicleApi = global.cronicleApi ?? new CronicleApi()

if (process.env.NODE_ENV !== 'production') {
  global.cronicleApi = cronicleApi
}

/* Functions */
export async function addMenuNotifyEvent(props: {
  menuId: number
  date: Date
}) {
  const { menuId, date } = props

  return await cronicleApi.createEvent({
    title: `Menu Notify (${menuId})`,
    enabled: 1,
    category: settings.CRONICLE_CATEGORY_ID,
    plugin: 'urlplug',
    target: 'allgrp',
    timing: {
      years: [date.getFullYear()],
      months: [date.getMonth() + 1],
      days: [date.getDate()],
      hours: [date.getHours()],
      minutes: [date.getMinutes()],
    },
    params: {
      method: 'POST',
      url: `${settings.WEBSITE_URL}/api/utils/menu-publish-notify`,
      headers: `User-Agent: Google-Cloud-Scheduler\nContent-Type: application/json`,
      data: JSON.stringify({
        menuId,
      }),
    },
  })
}
