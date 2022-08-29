/**
 * Sleep for the given number of ms
 *
 * @param ms  Number of ms to sleep
 */
export const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms))

export function getRandomInt(top: number): number {
    return Math.floor(Math.random() * top)
}
