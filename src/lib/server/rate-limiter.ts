import { RateLimiterMemory } from 'rate-limiter-flexible'

class RateLimiter {
  private perSecondLimiter: RateLimiterMemory
  private perMinuteLimiter: RateLimiterMemory

  constructor() {
    this.perSecondLimiter = new RateLimiterMemory({
      points: 100,
      duration: 1,
    })
    this.perMinuteLimiter = new RateLimiterMemory({
      points: 100,
      duration: 60,
    })
  }

  async consume(
    userId: string,
    points: number,
    type: 'perSecond' | 'perMinute',
  ) {
    if (type === 'perSecond') {
      await this.perSecondLimiter.consume(userId, points)
    } else {
      await this.perMinuteLimiter.consume(userId, points)
    }
  }
}

/* Global */
declare global {
  var rateLimiter: RateLimiter | undefined
}

export const rateLimiter: RateLimiter = global.rateLimiter ?? new RateLimiter()

if (process.env.NODE_ENV !== 'production') {
  global.rateLimiter = rateLimiter
}
