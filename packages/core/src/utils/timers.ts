/* eslint-disable no-restricted-globals, ts/no-implied-eval */

// timers typings are mixed up across different runtimes, which leads
// to the globals being typed incorrectly.
// instead, we can treat the timers as opaque objects, and expose
// them through the `timers` esm namespace.
// this has zero runtime cost (as everything is stripped at compile time),
// but makes everything type-safe
//
// the `import.meta.env.MODE === 'test'` is a workaround for vitest
// not being able to mock timers because it mocks the globals
// todo: we should probably do this as a vite plugin instead

export interface Timer { readonly __type: 'Timer' }
export interface Interval { readonly __type: 'Interval' }
export interface Immediate { readonly __type: 'Immediate' }

const setTimeoutWrap = (
    import.meta.env?.MODE === 'test' ? (...args: Parameters<typeof setTimeout>) => setTimeout(...args) : setTimeout
) as unknown as <T extends (...args: any[]) => any>(
    fn: T, ms: number, ...args: Parameters<T>
) => Timer
const setIntervalWrap = (
    import.meta.env?.MODE === 'test' ? (...args: Parameters<typeof setInterval>) => setInterval(...args) : setInterval
) as unknown as <T extends (...args: any[]) => any>(
    fn: T, ms: number, ...args: Parameters<T>
) => Interval
const setImmediateWrap = (
    typeof setImmediate !== 'undefined' ? setImmediate : setTimeout
) as unknown as (
    fn: () => void
) => Immediate

const clearTimeoutWrap = (
    import.meta.env?.MODE === 'test' ? (...args: Parameters<typeof clearTimeout>) => clearTimeout(...args) : clearTimeout
) as unknown as (timer?: Timer) => void
const clearIntervalWrap = (
    import.meta.env?.MODE === 'test' ? (...args: Parameters<typeof clearInterval>) => clearInterval(...args) : clearInterval
) as unknown as (timer?: Interval) => void
const clearImmediateWrap = (
    typeof clearImmediate !== 'undefined' ? clearImmediate : clearTimeout
) as unknown as (timer?: Immediate) => void

export {
    setTimeoutWrap as setTimeout,
    setIntervalWrap as setInterval,
    setImmediateWrap as setImmediate,
    clearTimeoutWrap as clearTimeout,
    clearIntervalWrap as clearInterval,
    clearImmediateWrap as clearImmediate,
}
