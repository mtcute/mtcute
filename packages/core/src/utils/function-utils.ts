import { timers } from '@fuman/utils'

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
  let timeout: timers.Timer | null

  const res: ThrottledFunction = function () {
    if (timeout) {
      return
    }

    const later = () => {
      timeout = null
      func()
    }
    timeout = timers.setTimeout(later, delay)
  }

  res.reset = () => {
    if (timeout) {
      timers.clearTimeout(timeout)
      timeout = null
    }
  }

  return res
}

export function asyncResettable<T extends(...args: any[]) => Promise<any>>(func: T): {
  run: T
  finished: () => boolean
  wait: () => Promise<any> | null
  reset: () => void
} {
  let runningPromise: Promise<any> | null = null
  let finished = false

  const run = function (...args: any[]) {
    if (finished) return Promise.resolve()

    if (runningPromise) {
      return runningPromise
    }

    // eslint-disable-next-line ts/no-unsafe-argument
    runningPromise = func(...args)
    void runningPromise.then(() => {
      runningPromise = null
      finished = true
    })

    return runningPromise
  } as T

  return {
    run,
    finished: () => finished,
    wait: () => runningPromise,
    reset: () => {
      finished = false
    },
  }
}
