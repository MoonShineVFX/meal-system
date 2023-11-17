import { settings } from '@/lib/common'

type SubscriptionCallback = (
  subscription: PushSubscription | null,
  state: 'subscribe' | 'unsubscribe',
  endpoint?: string,
) => void

export default class ServiceWorkerHandler {
  private registration: ServiceWorkerRegistration | null = null
  private pushSubscription: PushSubscription | null = null
  private userSub: { id: string; endpoint: string | null } | null = null
  private subCallback: SubscriptionCallback | null = null
  private errorCallback: ((error: Error) => void) | null = null
  private isUserSet = false

  constructor(props: {
    onSubscriptionChange?: SubscriptionCallback
    onError?: (error: Error) => void
  }) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/pwa-sw.js').then((reg) => {
        console.debug('Service worker registered')
        this.subCallback = props.onSubscriptionChange ?? null
        this.errorCallback = props.onError ?? null
        this.registration = reg
        this.getSubscription()
      })
    } else {
      console.warn('Service workers are not supported in this browser')
    }
  }

  public setUser(userSub: { id: string; endpoint: string | null } | null) {
    if (!this.isUserSet) this.isUserSet = true
    if (this.userSub === null && userSub === null) {
      return
    }
    if (
      this.userSub?.endpoint === userSub?.endpoint &&
      this.userSub?.id === userSub?.id
    ) {
      return
    }
    this.userSub = userSub
    this.updateSubscription()
  }

  private async getSubscription() {
    if (Notification.permission !== 'granted') {
      console.warn('Notifications are not granted')
      return
    }

    if (!this.registration) {
      console.warn('Service worker is not registered')
      return
    }

    if (!('pushManager' in this.registration)) {
      console.warn('Push notifications are not supported in this browser')
      return
    }

    this.pushSubscription =
      await this.registration.pushManager.getSubscription()
    this.updateSubscription()
  }

  public async updateSubscription() {
    if (Notification.permission !== 'granted') {
      console.warn('Notifications are not granted')
      return
    }

    if (!this.registration) {
      console.warn('Service worker is not registered')
      return
    }

    if (!('pushManager' in this.registration)) {
      console.warn('Push notifications are not supported in this browser')
      return
    }

    if (!this.isUserSet) {
      return
    }

    if (this.pushSubscription && this.userSub === null) {
      return await this.unsubscribe()
    }
    if (!this.pushSubscription && this.userSub !== null) {
      return await this.subscribe()
    }
    if (this.pushSubscription && this.userSub !== null) {
      if (this.pushSubscription.endpoint !== this.userSub.endpoint) {
        if (this.subCallback) {
          this.subCallback(
            null,
            'unsubscribe',
            this.userSub.endpoint ?? undefined,
          )
          this.subCallback(this.pushSubscription, 'subscribe')
        }
      }
    }
  }

  private async subscribe() {
    this.registration!.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: settings.WEBPUSH_PUBLIC_KEY,
    })
      .then((subscription) => {
        this.pushSubscription = subscription
        if (this.subCallback) {
          this.subCallback(this.pushSubscription, 'subscribe')
        }
      })
      .catch((err) => {
        console.error('Failed to subscribe the user: ', err)
        if (this.errorCallback) {
          this.errorCallback(err)
        }

        // unsubscribe the user from the server when the subscription fails
        return this.unsubscribe()
      })
  }

  private async unsubscribe() {
    if (this.subCallback) {
      this.subCallback(this.pushSubscription, 'unsubscribe')
    }
    await this.pushSubscription?.unsubscribe()
    this.pushSubscription = null
  }
}
