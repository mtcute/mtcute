import { timers } from '@fuman/utils'

export function sleepWithAbort(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let timeout: timers.Timer

    const onAbort = () => {
      timers.clearTimeout(timeout)
      reject(signal.reason)
    }

    signal.addEventListener('abort', onAbort)

    timeout = timers.setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
  })
}

export function getRandomInt(top: number): number {
  return Math.floor(Math.random() * top)
}
