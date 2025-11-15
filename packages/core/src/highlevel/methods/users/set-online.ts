import type { ITelegramClient } from '../../client.types.js'

/**
 * Change user status to offline or online once,
 * which will expire after a while (currently ~5 minutes)
 *
 * For continuously sending online/offline status, use {@link setOnline}
 *
 * @param online  Whether the user is currently online
 */
export async function sendOnline(client: ITelegramClient, online: boolean): Promise<void> {
  await client.call({
    _: 'account.updateStatus',
    offline: !online,
  })
}

const TIMER_ID = 'online'
const TIMER_INTERVAL = 240_000 // 4 minutes

/**
 * Change user status to online or offline
 *
 * Once called with `true`, mtcute will keep notifying the server
 * that the user is still online until a further call with `false` is made.
 *
 * @param online
 */
export async function setOnline(client: ITelegramClient, online = true): Promise<void> {
  if (online) {
    client.timers.create(TIMER_ID, async (abortSignal) => {
      await client.call({
        _: 'account.updateStatus',
        offline: false,
      }, { abortSignal })
    }, TIMER_INTERVAL, true)
  } else {
    client.timers.cancel(TIMER_ID)

    await client.call({
      _: 'account.updateStatus',
      offline: true,
    })
  }
}
