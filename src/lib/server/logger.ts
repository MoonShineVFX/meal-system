export function getLogger(prefix: string) {
  return function newLogger(...args: Parameters<typeof console.log>) {
    console.log(`[${prefix}]`, ...args)
  }
}
