export type ThrottledFunction = (() => void) & {
    reset: () => void
}

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
export function throttle(func: () => void, delay: number): ThrottledFunction {
    let timeout: NodeJS.Timeout | null

    const res: ThrottledFunction = function () {
        if (timeout) {
            return
        }

        const later = () => {
            timeout = null
            func()
        }
        timeout = setTimeout(later, delay)
    }

    res.reset = () => {
        if (timeout) {
            clearTimeout(timeout)
            timeout = null
        }
    }

    return res
}
