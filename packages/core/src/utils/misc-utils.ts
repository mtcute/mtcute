/**
 * Sleep for the given number of ms
 *
 * @param ms  Number of ms to sleep
 */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export function sleepWithAbort(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        // eslint-disable-next-line prefer-const
        let timeout: NodeJS.Timeout

        const onAbort = () => {
            clearTimeout(timeout)
            reject(signal.reason)
        }

        signal.addEventListener('abort', onAbort)

        timeout = setTimeout(() => {
            signal.removeEventListener('abort', onAbort)
            resolve()
        }, ms)
    })
}

export function getRandomInt(top: number): number {
    return Math.floor(Math.random() * top)
}
