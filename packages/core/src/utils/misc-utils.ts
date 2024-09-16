import * as timers from './timers.js'

/**
 * Sleep for the given number of ms
 *
 * @param ms  Number of ms to sleep
 */
export const sleep = (ms: number): Promise<void> => new Promise(resolve => timers.setTimeout(resolve, ms))

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
