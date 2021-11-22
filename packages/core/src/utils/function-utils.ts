/**
 * Throttle a function with a given delay.
 * Similar to lodash.
 *
 * Throttling `F` for a delay of `D` means that
 * `F` will be called no more than 1 time every `D`.
 * In this implementation, `F` is called after `D`
 * has passed since the previous non-throttled invocation
 *
 * @param func  Function to throttle
 * @param delay  Throttle delay
 */
export function throttle<T extends Function>(
    func: T,
    delay: number
): () => void {
    let timeout: NodeJS.Timeout | null

    return function (this: any) {
        if (timeout) {
            return
        }
        const self = this
        const args = arguments
        const later = function (): void {
            timeout = null
            func.apply(self, args)
        }
        timeout = setTimeout(later, delay)
    } as any
}
