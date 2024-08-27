/* eslint-disable no-restricted-globals, ts/no-implied-eval */

// timers typings are mixed up across different runtimes, which leads
// to the globals being typed incorrectly.
// instead, we can treat the timers as opaque objects, and expose
// them through the `timers` esm namespace.
// this has near-zero runtime cost, but makes everything type-safe
//
// NB: we are using wrapper functions instead of...
//   - directly exposing the globals because the standard doesn't allow that
//   - .bind()-ing because it makes it harder to mock the timer globals

export interface Timer { readonly __type: 'Timer' }
export interface Interval { readonly __type: 'Interval' }
export interface Immediate { readonly __type: 'Immediate' }

const setTimeoutWrap = (
    (...args: Parameters<typeof setTimeout>) => setTimeout(...args)
) as unknown as <T extends (...args: any[]) => any>(
    fn: T, ms: number, ...args: Parameters<T>
) => Timer
const setIntervalWrap = (
    (...args: Parameters<typeof setInterval>) => setInterval(...args)
) as unknown as <T extends (...args: any[]) => any>(
    fn: T, ms: number, ...args: Parameters<T>
) => Interval

let setImmediateWrap: any
if (typeof setImmediate !== 'undefined') {
    setImmediateWrap = (...args: Parameters<typeof setImmediate>) => setImmediate(...args)
} else {
    // eslint-disable-next-line
    setImmediateWrap = (fn: (...args: any[]) => void, ...args: any[]) => setTimeout(fn, 0, ...args)
}
const setImmediateWrapExported = setImmediateWrap as <T extends (...args: any[]) => any>(
    fn: T, ...args: Parameters<T>
) => Immediate

const clearTimeoutWrap = (
    (...args: Parameters<typeof clearTimeout>) => clearTimeout(...args)
) as unknown as (timer?: Timer) => void
const clearIntervalWrap = (
    (...args: Parameters<typeof clearInterval>) => clearInterval(...args)
) as unknown as (timer?: Interval) => void

let clearImmediateWrap: any
if (typeof clearImmediate !== 'undefined') {
    clearImmediateWrap = (...args: Parameters<typeof clearImmediate>) => clearImmediate(...args)
} else {
    clearImmediateWrap = (timer: number) => clearTimeout(timer)
}
const clearImmediateWrapExported = clearImmediateWrap as (timer?: Immediate) => void

export {
    setTimeoutWrap as setTimeout,
    setIntervalWrap as setInterval,
    setImmediateWrapExported as setImmediate,
    clearTimeoutWrap as clearTimeout,
    clearIntervalWrap as clearInterval,
    clearImmediateWrapExported as clearImmediate,
}
