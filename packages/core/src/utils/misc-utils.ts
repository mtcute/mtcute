export const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms))

export function getRandomInt(top: number): number {
    return Math.floor(Math.random() * top)
}
