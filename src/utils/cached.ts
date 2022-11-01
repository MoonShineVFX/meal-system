import { settings, UserLite } from './settings'

/* Define */
class TokenCache {
  private _data: { [token: string]: UserLite }

  constructor() {
    this._data = {}
  }

  /* Functions */
  public has(token: string) {
    return token in this._data
  }

  public getUser(token: string) {
    return this._data[token]
  }

  public add(token: string, user: UserLite) {
    this._data[token] = user
    if (Object.keys(this._data).length > settings.CACHED_MAX_LENGTH) {
      this.purge()
    }
  }

  public purge() {
    const keys = Object.keys(this._data)
    const purgeKeys = keys.slice(0, settings.PURGE_AMOUNT)
    purgeKeys.forEach((key) => {
      delete this._data[key]
    })
  }

  public listAll() {
    return this._data
  }
}

/* Global */
declare global {
  var tokenCache: TokenCache | undefined
}

export const tokenCache = global.tokenCache || new TokenCache()

if (process.env.NODE_ENV !== 'production') {
  global.tokenCache = tokenCache
}
