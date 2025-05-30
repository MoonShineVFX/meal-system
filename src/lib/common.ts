import {
  Menu,
  MenuType,
  OrderStatus,
  TransactionType,
  User,
  UserAuthority,
  UserRole,
} from '@prisma/client'
import { z } from 'zod'

/* Types */
export type ConvertPrismaJson<T> = T extends Date
  ? Date
  : T extends object
  ? {
      [key in keyof T]: key extends 'optionSets'
        ? OptionSet[]
        : key extends 'options'
        ? OrderOptions
        : T[key] extends object
        ? ConvertPrismaJson<T[key]>
        : T[key]
    }
  : T

export enum CurrencyType {
  CREDIT = 'credit',
  POINT = 'point',
}

export const optionValueSchema = z.union([
  z.string(),
  z.object({
    name: z.string(),
    price: z.number(),
  }),
])
export type OptionValue = z.infer<typeof optionValueSchema>

export type OptionSet = {
  name: string
  multiSelect: boolean
  order: number
  options: OptionValue[]
}

export type OrderOptions = Record<string, OptionValue | OptionValue[]>
export const ORDER_TIME_STATUS = [
  'timeCanceled',
  'timeCompleted',
  'timeDishedUp',
  'timePreparing',
] as const
export type OrderTimeStatus = typeof ORDER_TIME_STATUS[number]
export const ORDER_STATUS_MAP = {
  timePreparing: 'PREPARING',
  timeDishedUp: 'DISHED_UP',
  timeCompleted: 'COMPLETED',
  timeCanceled: 'CANCELED',
} as const satisfies {
  [key in OrderTimeStatus]: OrderStatus
}

export enum MenuUnavailableReason {
  NOT_PUBLISHED = '尚未到達開放訂購時間',
  CLOSED = '已過開放訂購時間',
  MENU_LIMIT_PER_USER_EXCEEDED = '您已達全部餐點的訂購上限',
}

export enum ComUnavailableReason {
  STOCK_OUT = '餐點已售完',
  COM_LIMIT_PER_USER_EXCEEDED = '您已達此餐點的每人訂購數量上限',
  COM_LIMIT_PER_ORDER_EXCEEDED = '您已達此餐點的單筆訂購數量上限',
}

export const MenuTypeName: Record<MenuType, string> = {
  [MenuType.BREAKFAST]: '早餐',
  [MenuType.LUNCH]: '午餐',
  [MenuType.DINNER]: '晚餐',
  [MenuType.TEA]: '下午茶',
  [MenuType.LIVE]: '即時',
  [MenuType.RETAIL]: '自助',
}

export const UserAuthorityName: Record<UserAuthority, string> = {
  [UserAuthority.CLIENT_ORDER]: '客戶招待',
}

export const TransactionName: Record<TransactionType, string> = {
  [TransactionType.PAYMENT]: '付款',
  [TransactionType.REFUND]: '退款',
  [TransactionType.RECHARGE]: '贈點',
  [TransactionType.CANCELED]: '取消訂單',
  [TransactionType.TRANSFER]: '轉帳',
  [TransactionType.DEPOSIT]: '儲值',
  [TransactionType.RECYCLE]: '回收',
}

/* Settings */
export const settings = {
  /* Auth */
  AUTH_API_URL: process.env.AUTH_API_URL!,
  AUTH_API_TOKEN: process.env.AUTH_API_TOKEN!,
  COOKIE_TOKEN_NAME: 'meal_token',
  COOKIE_EXPIRE_DAYS: 60,

  /* Server */
  MENU_MAX_QUANTITY_PER_ORDER: 10,
  TOKEN_COUNT_PER_USER: 2,
  SERVER_USER_ID: '_server',
  SERVER_CLIENTORDER_ID: '_client',
  MENU_LIVE_ID: 1,
  MENU_RETAIL_ID: 2,
  POINT_DAILY_RECHARGE_AMOUNT: process.env.POINT_DAILY_RECHARGE_AMOUNT
    ? parseInt(process.env.POINT_DAILY_RECHARGE_AMOUNT)
    : 50,
  DEPOSIT_RATIO: process.env.DEPOSIT_RATIO
    ? parseFloat(process.env.DEPOSIT_RATIO)
    : 1.0,
  DEPOSIT_MIN_AMOUNT: 30,
  DEPOSIT_MAX_AMOUNT: 10000,
  PRINTER_API_URL: process.env.NEXT_PUBLIC_PRINTER_API_URL!,
  MAKE_UP_DAYS: process.env.MAKE_UP_DAYS
    ? process.env.MAKE_UP_DAYS.split(',').map((dateString) =>
        new Date(dateString + 'T00:00:00+08:00').getTime(),
      )
    : [],
  HOLIDAYS: process.env.HOLIDAYS
    ? process.env.HOLIDAYS.split(',').map((dateString) =>
        new Date(dateString + 'T00:00:00+08:00').getTime(),
      )
    : [],
  WEBPUSH_PUBLIC_KEY: process.env.NEXT_PUBLIC_WEBPUSH_PUBLIC_KEY!,
  WEBPUSH_PRIVATE_KEY: process.env.WEBPUSH_PRIVATE_KEY!,

  /* NewebPay */
  NEWEBPAY_API_URL: process.env.NEWEBPAY_API_URL!,
  NEWEBPAY_MERCHANT_ID: process.env.NEWEBPAY_MERCHANT_ID!,
  NEWEBPAY_HASH_KEY: process.env.NEWEBPAY_HASH_KEY!,
  NEWEBPAY_HASH_IV: process.env.NEWEBPAY_HASH_IV!,
  NEWEBPAY_NOTIFY_URL: process.env.NEWEBPAY_NOTIFY_URL!,
  NEWEBPAY_RETURN_URL: process.env.NEWEBPAY_RETURN_URL!,

  /* Connection */
  WEBSOCKET_DEV_PORT: process.env.NEXT_PUBLIC_WEBSOCKET_DEV_PORT ?? '3001',
  WEBSOCKET_PROD_HOST: process.env.NEXT_PUBLIC_WEBSOCKET_PROD_HOST,
  HTTP_PORT: process.env.PORT ?? '3000',
  WEBSITE_URL: process.env.WEBSITE_URL!,

  /* Log */
  LOG_BLOCKCHAIN: process.env.LOG_BLOCKCHAIN === 'true',
  LOG_DATABASE: process.env.LOG_DATABASE === 'true',

  /* Resource */
  RESOURCE_HOST: process.env.NEXT_PUBLIC_RESOURCE_HOST ?? '',
  RESOURCE_FOLDER: process.env.NEXT_PUBLIC_RESOURCE_FOLDER ?? '',
  // prefix with image
  RESOURCE_BADGE: 'asset/badge.png',
  RESOURCE_FOOD_PLACEHOLDER: 'asset/food-placeholder.png',
  RESOURCE_PROFILE_PLACEHOLDER: 'asset/profile-placeholder.png',
  RESOURCE_LOGIN_COVER: 'asset/login-cover.jpg',
  RESOURCE_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
  RESOURCE_UPLOAD_PATH: 'upload',
  // asset
  RESOURCE_NOTIFICATION_SOUND: 'audio/notification.mp3',

  /* R2 */
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID!,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY!,
  R2_ENDPOINT: process.env.R2_ENDPOINT!,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME!,

  /* Cronicle */
  CRONICLE_API_URL: process.env.CRONICLE_API_URL!,
  CRONICLE_API_KEY: process.env.CRONICLE_API_KEY!,
  CRONICLE_EVENT_MENU_NOTIFY: process.env.CRONICLE_EVENT_MENU_NOTIFY!,

  /* UI */
  ORDER_TAKE_PER_QUERY: 20,
  TRANSACTIONS_PER_QUERY: 20,
  DEPOSITS_PER_QUERY: 40,
  NOTIFICATION_DURATION_MS: 3500,
  MENU_CATEGORY_NULL: '未分類',
  TITLE: '夢想發光吧',
  EMAIL: 'rd@moonshine.tw',
  ZULIP: process.env.NEXT_PUBLIC_ZULIP_URL!,
}

/* Functions */
export function getResourceUrlByWidth(width?: number) {
  if (!width) return getResourceUrl()
  if (width <= 128) return getResourceUrl('xs')
  if (width <= 256) return getResourceUrl('sm')
  if (width <= 512) return getResourceUrl('md')
  if (width <= 1280) return getResourceUrl('lg')
  return getResourceUrl('lg')
}

export function getResourceUrl(type?: 'xs' | 'sm' | 'md' | 'lg') {
  // 128, 256, 512, 1280
  if (!type) return `${settings.RESOURCE_HOST}/${settings.RESOURCE_FOLDER}`

  return `${settings.RESOURCE_HOST}/opt/${type}/${settings.RESOURCE_FOLDER}`
}

export function generateCookie(token: string | undefined) {
  const expireTime = token ? settings.COOKIE_EXPIRE_DAYS * 24 * 60 * 60 : 0
  return `${settings.COOKIE_TOKEN_NAME}=${token}; Max-Age=${expireTime}; Path=/; SameSite=Strict`
}

export function validateRole(sourceRole: UserRole, targetRole: UserRole) {
  const roleWeight = {
    [UserRole.ADMIN]: 100,
    [UserRole.STAFF]: 50,
    [UserRole.USER]: 10,
  }

  return roleWeight[sourceRole] >= roleWeight[targetRole]
}

export function validateAuthority(
  user: Pick<User, 'role' | 'authorities'>,
  authority: UserAuthority,
) {
  if (
    user.authorities.includes(authority) ||
    validateRole(user.role, UserRole.ADMIN)
  ) {
    return true
  }
  return false
}

type TwDataKeys = 'selected' | 'loading' | 'busy' | 'available'
export function twData(
  parms: Partial<Record<TwDataKeys, boolean | undefined>>,
) {
  return {
    'data-ui': Object.entries(parms)
      .map(([key, value]) => (value ? key : `not-${key}`))
      .join(' '),
  }
}

export function getMenuName(menu?: Pick<Menu, 'date' | 'name' | 'type'>) {
  if (menu === undefined) return undefined

  if (menu.type === 'LIVE') return '即時點餐'
  if (menu.type === 'RETAIL') return '自助'
  if (menu.date === null) return '錯誤菜單'
  const typeName = MenuTypeName[menu.type]

  return `${menu.date.toLocaleDateString('zh-TW', {
    month: 'long',
    day: 'numeric',
  })} ${typeName}${menu.name !== '' ? ` - ${menu.name}` : ''}`
}

// Date
export function convertDateToInputDateValue(
  date: Date | null | undefined,
  dateTime: boolean = false,
) {
  if (!date) return ''
  const offsetIsoDate = new Date(date.getTime() + 8 * 60 * 60000)
  if (dateTime) return offsetIsoDate.toISOString().split('.')[0]
  return offsetIsoDate.toISOString().split('T')[0]
}

export function convertInputDateValueToDate(value: string | null) {
  if (!value) return null
  if (value === '') return null
  if (!value.includes('T')) value += 'T00:00:00'

  return new Date(value)
}

// Options
export function mergeOptions(source: OptionValue[], target: OptionValue[]) {
  const mergedOptions: {
    name: string
    price: number
    order: number
  }[] = []

  for (const sourceOption of source) {
    const targetOption = target.find(
      (option) => getOptionName(option) === getOptionName(sourceOption),
    )
    if (targetOption) {
      mergedOptions.push({
        name: getOptionName(targetOption),
        price: getOptionPrice(targetOption),
        order: target.indexOf(targetOption) - 0.1,
      })
    } else {
      mergedOptions.push({
        name: getOptionName(sourceOption),
        price: getOptionPrice(sourceOption),
        order: source.indexOf(sourceOption),
      })
    }
  }

  for (const targetOption of target) {
    const sourceOption = source.find(
      (option) => getOptionName(option) === getOptionName(targetOption),
    )
    if (!sourceOption) {
      mergedOptions.push({
        name: getOptionName(targetOption),
        price: getOptionPrice(targetOption),
        order: target.indexOf(targetOption) - 0.1,
      })
    }
  }

  return mergedOptions
    .sort((a, b) => a.order - b.order)
    .map((o) => ({
      name: o.name,
      price: o.price,
    })) as OptionValue[]
}

export function mergeOptionSets(source: OptionSet[], target: OptionSet[]) {
  const mergedOptionSets: OptionSet[] = []

  for (const sourceOptionSet of source) {
    const targetOptionSet = target.find(
      (optionSet) => optionSet.name === sourceOptionSet.name,
    )
    if (targetOptionSet) {
      mergedOptionSets.push({
        ...sourceOptionSet,
        options: mergeOptions(sourceOptionSet.options, targetOptionSet.options),
      })
    } else {
      mergedOptionSets.push(sourceOptionSet)
    }
  }

  for (const targetOptionSet of target) {
    const sourceOptionSet = source.find(
      (optionSet) => optionSet.name === targetOptionSet.name,
    )
    if (!sourceOptionSet) {
      mergedOptionSets.push(targetOptionSet)
    }
  }

  return mergedOptionSets
}

export function generateOptionsKey(options: OrderOptions) {
  return Object.entries(options)
    .sort()
    .reduce((acc, cur) => {
      const prefix = acc === '' ? '' : '_'
      const value = Array.isArray(cur[1])
        ? cur[1]
            .map((c) => getOptionName(c))
            .sort()
            .join(',')
        : getOptionName(cur[1])
      return `${acc}${prefix}${cur[0]}:${value}`
    }, '')
}

export function getOptionName(option: OptionValue | null | undefined) {
  if (option === null || option === undefined) return ''
  return typeof option === 'string' ? option : option.name
}

export function getOptionPrice(option: OptionValue | null | undefined) {
  if (option === null || option === undefined) return 0
  return typeof option === 'string' ? 0 : option.price
}

export function getOrderOptionsPrice(
  orderOptions: OrderOptions,
  optionSets: OptionSet[],
  basePrice: number | null = null,
) {
  let price = 0
  for (const [optionSetName, optionValues] of Object.entries(orderOptions)) {
    const optionSet = optionSets.find(
      (optionSet) => optionSet.name === optionSetName,
    )
    if (!optionSet) {
      console.debug('OptionSet not found', orderOptions, optionSets)
      continue
    }

    let names: string[]
    if (!Array.isArray(optionValues)) {
      names = [getOptionName(optionValues)]
    } else {
      names = optionValues.map((optionValue) => getOptionName(optionValue))
    }

    names.forEach((name) => {
      const option = optionSet.options.find(
        (option) => getOptionName(option) === name,
      )
      if (!option) {
        console.debug('Option not found', name)
        return
      }
      if (typeof option !== 'string') {
        price += option.price
      }
    })
  }

  if (basePrice === null) return price
  return Math.max(price + basePrice, 0)
}

/* Valid Cart Options */
export function validateAndSortOrderOptions({
  options,
  truthOptionSets,
}: {
  options: OrderOptions
  truthOptionSets: OptionSet[]
}) {
  // Check same keys
  const optionsKeys = Object.keys(options)
  const truthOptionSetsKeys = truthOptionSets.map((optionSet) => optionSet.name)
  const uniqueKeys = new Set([...optionsKeys, ...truthOptionSetsKeys])
  const hasSameKeys = uniqueKeys.size === optionsKeys.length

  if (!hasSameKeys) {
    throw new Error(
      `選項不同: options: ${optionsKeys}, truth: ${truthOptionSetsKeys}`,
    )
  }

  // Sort and valid options
  const sortedOptions: OrderOptions = {}
  const sortedTruthOptionSets = truthOptionSets.sort(
    (a, b) => a.order - b.order,
  )

  for (const truthOptionSet of sortedTruthOptionSets) {
    const optionValues = options[truthOptionSet.name]

    // Multi select
    if (truthOptionSet.multiSelect) {
      if (!Array.isArray(optionValues)) {
        throw new Error(`選項不是多選: ${truthOptionSet.name}`)
      }
      if (
        !optionValues.every((optionValue) => {
          const truthOption = truthOptionSet.options.find(
            (o) => getOptionName(o) === getOptionName(optionValue),
          )
          if (!truthOption) return false

          const price = typeof optionValue === 'string' ? 0 : optionValue.price
          const truthPrice =
            typeof truthOption === 'string' ? 0 : truthOption.price

          return price === truthPrice
        })
      ) {
        throw new Error(
          `找不到選項或選項不合法: ${truthOptionSet.name} - ${optionValues.map(
            (o) => getOptionName(o),
          )}`,
        )
      }

      const sortedOptionValue = optionValues.sort(
        (a, b) =>
          truthOptionSet.options
            .map((o) => getOptionName(o))
            .indexOf(getOptionName(a)) -
          truthOptionSet.options
            .map((o) => getOptionName(o))
            .indexOf(getOptionName(b)),
      )
      sortedOptions[truthOptionSet.name] = sortedOptionValue
      // Single select
    } else {
      if (Array.isArray(optionValues)) {
        throw new Error(`選項不是單選: ${truthOptionSet.name}`)
      }
      if (
        ![optionValues].every((optionValue) => {
          const truthOption = truthOptionSet.options.find(
            (o) => getOptionName(o) === getOptionName(optionValue),
          )
          if (!truthOption) return false

          const price = typeof optionValue === 'string' ? 0 : optionValue.price
          const truthPrice =
            typeof truthOption === 'string' ? 0 : truthOption.price

          return price === truthPrice
        })
      ) {
        throw new Error(
          `找不到選項或選項不合法: ${truthOptionSet.name} - ${getOptionName(
            optionValues,
          )}`,
        )
      }

      sortedOptions[truthOptionSet.name] = optionValues
    }
  }

  return sortedOptions
}
