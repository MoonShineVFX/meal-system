import { settings, UserLite } from './settings'

/* Define */
class TokenCache {
  private _data: { [token: string]: UserLite } = {}

  // Check if token exists
  public async has(token: string) {
    return token in this._data
  }

  // Get user by token
  public async getUser(token: string) {
    return this._data[token]
  }

  // Add a token
  public async add(token: string, user: UserLite) {
    this._data[token] = user
    if (Object.keys(this._data).length > settings.CACHED_MAX_LENGTH) {
      this.purge()
    }
  }

  // Purge old tokens
  private async purge() {
    const keys = Object.keys(this._data)
    const purgeKeys = keys.slice(0, settings.PURGE_AMOUNT)
    purgeKeys.forEach((key) => {
      delete this._data[key]
    })
  }

  public async listAll() {
    return this._data
  }
}

/* Global */
declare global {
  var tokenCache: TokenCache | undefined
}

export const tokenCache = global.tokenCache ?? new TokenCache()

if (process.env.NODE_ENV !== 'production') {
  global.tokenCache = tokenCache
}
