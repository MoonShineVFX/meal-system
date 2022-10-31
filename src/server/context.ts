import { inferAsyncReturnType } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'

export async function createContext({
  req,
  res,
}: trpcNext.CreateNextContextOptions) {
  async function getUserFromHeader() {
    if (req.headers.cookie) {
      const value = '; ' + req.headers.cookie
      const parts = value.split('; test_token=')
      if (parts.length === 2) {
        return parts?.pop()?.split(';').shift()
      }
    }
    return undefined
  }
  const test_token = await getUserFromHeader()
  console.log(test_token)
  // return {
  //   headers: req.headers,
  // }
}

export type Context = inferAsyncReturnType<typeof createContext>
