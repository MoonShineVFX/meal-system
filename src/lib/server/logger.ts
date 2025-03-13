export function getLogger(prefix: string) {
  return function newLogger(...args: Parameters<typeof console.log>) {
    console.log(`[${prefix}]`, ...args)
  }
}

export function getDebugLogger(prefix: string) {
  return function newLogger(...args: Parameters<typeof console.log>) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${prefix}]`, ...args)
    }
  }
}
