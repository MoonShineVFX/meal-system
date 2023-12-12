import PQueue from 'p-queue'

/* Global */
declare global {
  var queue: PQueue | undefined
}

export const queue: PQueue =
  global.queue ??
  new PQueue({
    concurrency: 1,
  })

if (process.env.NODE_ENV !== 'production') {
  global.queue = queue
}
