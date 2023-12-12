import { RateLimiterMemory } from 'rate-limiter-flexible'

/* Global */
declare global {
  var rateLimiter: RateLimiterMemory | undefined
}

export const rateLimiter: RateLimiterMemory =
  global.rateLimiter ??
  new RateLimiterMemory({
    points: 1,
    duration: 1,
  })

if (process.env.NODE_ENV !== 'production') {
  global.rateLimiter = rateLimiter
}
