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
export type UpdateEventParams = {
  id: string
} & Partial<Omit<EventData, 'id'>>

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

async function request<T>(
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

// get_schedule API endpoint
export async function getSchedule(
  params: GetScheduleParams = {},
): Promise<GetScheduleResponse> {
  return request<GetScheduleResponse>('get_schedule', 'POST', params)
}

// get_event API endpoint
export async function getEvent(
  params: GetEventParams,
): Promise<GetEventResponse> {
  return request<GetEventResponse>('get_event', 'POST', params)
}

// create_event API endpoint
export async function createEvent(
  params: CreateEventInput,
): Promise<CreateEventResponse> {
  return request<CreateEventResponse>('create_event', 'POST', params)
}

// update_event API endpoint
export async function updateEvent(
  params: UpdateEventParams,
): Promise<UpdateEventResponse> {
  return request<UpdateEventResponse>('update_event', 'POST', params)
}

// delete_event API endpoint
export async function deleteEvent(
  params: DeleteEventParams,
): Promise<DeleteEventResponse> {
  return request<DeleteEventResponse>('delete_event', 'POST', params)
}

/* Functions */
export async function updateMenuPublishNotifyEvent(
  props:
    | {
        menuId: number
        date: Date
      }
    | {
        enabled: false
      },
) {
  try {
    const response = await updateEvent({
      // title: `menu notify [${menuId}]`,
      // category: settings.CRONICLE_CATEGORY_ID,
      // plugin: 'urlplug',
      // target: 'allgrp',
      id: settings.CRONICLE_EVENT_MENU_NOTIFY,
      enabled: 'enabled' in props ? (props.enabled ? 1 : 0) : 1,
      ...('menuId' in props && {
        timing: {
          years: [props.date.getFullYear()],
          months: [props.date.getMonth() + 1],
          days: [props.date.getDate()],
          hours: [props.date.getHours()],
          minutes: [props.date.getMinutes()],
        },
        params: {
          method: 'POST',
          url: `${settings.WEBSITE_URL}/api/utils/menu-publish-notify`,
          headers: `User-Agent: Google-Cloud-Scheduler\nContent-Type: application/json\nAuthorization: Bearer ${settings.AUTH_API_TOKEN}`,
          data: JSON.stringify({
            menuId: props.menuId,
          }),
        },
      }),
    })
    return response
  } catch (error) {
    console.error(`Error updating menu publish notify event:`, error)
  }
}
