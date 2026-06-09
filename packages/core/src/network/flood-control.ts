import type { Logger } from '../utils/logger.js'
import { timers } from '@fuman/utils'

export interface FloodLimit {
  /** maximum events allowed within `windowMs` */
  count: number
  /** window size in ms */
  windowMs: number
}

/**
 * Sliding-window flood control. Port of TDLib's `FloodControlStrict`
 * (tdutils/td/utils/FloodControlStrict.h).
 */
export class FloodControl {
  private readonly _rules: readonly FloodLimit[]
  private readonly _maxWindow: number
  private _events: number[] = []

  constructor(rules: readonly FloodLimit[]) {
    if (rules.length === 0) throw new Error('FloodControl needs at least one rule')
    this._rules = rules
    this._maxWindow = rules.reduce((m, r) => Math.max(m, r.windowMs), 0)
  }

  /** Earliest absolute perf-now ms at which a new event is permitted. */
  getWakeupAt(now: number): number {
    let wakeup = 0
    for (const { count, windowMs } of this._rules) {
      // events at t = now - windowMs have aged out at this instant.
      const cutoff = now - windowMs
      let inWindow = 0
      let oldestInWindowIdx = -1
      for (let i = this._events.length - 1; i >= 0; i--) {
        if (this._events[i] <= cutoff) break
        inWindow++
        oldestInWindowIdx = i
      }
      if (inWindow >= count) {
        const t = this._events[oldestInWindowIdx] + windowMs
        if (t > wakeup) wakeup = t
      }
    }
    return wakeup
  }

  addEvent(now: number): void {
    this._events.push(now)
    this._prune(now)
  }

  private _prune(now: number): void {
    const cutoff = now - this._maxWindow
    let i = 0
    while (i < this._events.length && this._events[i] < cutoff) i++
    if (i > 0) this._events.splice(0, i)
  }

  reset(): void {
    this._events = []
  }
}

// TDLib defaults: ConnectionCreator.cpp:97-108
export const DEFAULT_SANITY_LIMITS: readonly FloodLimit[] = [
  { count: 5, windowMs: 10_000 },
]
export const DEFAULT_FLOOD_LIMITS: readonly FloodLimit[] = [
  { count: 1, windowMs: 1_000 },
  { count: 4, windowMs: 2_000 },
  { count: 8, windowMs: 3_000 },
]
export const DEFAULT_MTPROTO_ERROR_LIMITS: readonly FloodLimit[] = [
  { count: 1, windowMs: 1_000 },
  { count: 4, windowMs: 2_000 },
  { count: 8, windowMs: 3_000 },
]

export interface ConnectionFloodLimits {
  sanity?: readonly FloodLimit[]
  flood?: readonly FloodLimit[]
  mtprotoError?: readonly FloodLimit[]
}

/**
 * Per-connection-slot flood control bundle modeled after TDLib's
 * `ConnectionCreator` client state (`ConnectionCreator.cpp`) — TDLib keys
 * its flood control by pool slot (the `SessionProxy#i` hash), so each
 * socket's connect history is throttled independently.
 *
 * Three limiters compose:
 *  - `sanity` — absolute ceiling, always applied
 *  - `flood` — burst limit on connection attempts, always applied
 *  - `mtprotoError` — ticks only on MTProto-level errors, always applied
 *
 * TDLib additionally has a stricter "online" regime keyed to app foreground
 * state — we have no such signal, so only the permissive regime is modeled.
 *
 * `wait()` blocks until all limiters allow a fresh connection and records
 * the event atomically (sanity + flood).
 */
export class ConnectionFloodController {
  readonly sanity: FloodControl
  readonly flood: FloodControl
  readonly mtprotoError: FloodControl

  private _log?: Logger

  constructor(limits: ConnectionFloodLimits = {}) {
    this.sanity = new FloodControl(limits.sanity ?? DEFAULT_SANITY_LIMITS)
    this.flood = new FloodControl(limits.flood ?? DEFAULT_FLOOD_LIMITS)
    this.mtprotoError = new FloodControl(limits.mtprotoError ?? DEFAULT_MTPROTO_ERROR_LIMITS)
  }

  setLogger(log: Logger): void {
    this._log = log
  }

  /**
   * Notify a network-up transition.
   *
   * TDLib clears sanity + online-regime flood + backoff on
   * `ConnectionCreator::on_network(true)`. We don't model the online regime,
   * and our transport layer owns its own reconnect backoff, so only the
   * sanity limiter is reset here.
   */
  notifyNetworkUp(): void {
    this._log?.debug('network up, resetting sanity limiter')
    this.sanity.reset()
  }

  /** Record an MTProto-level error (transport 429; per TDLib, other codes don't tick this). */
  addMtprotoError(now: number = performance.now()): void {
    this._log?.debug('recording mtproto error')
    this.mtprotoError.addEvent(now)
  }

  /** Earliest perf-now ms at which a new connection attempt is permitted. */
  getWakeupAt(now: number): number {
    return Math.max(
      this.sanity.getWakeupAt(now),
      this.flood.getWakeupAt(now),
      this.mtprotoError.getWakeupAt(now),
    )
  }

  /**
   * Block until a connection attempt is permitted under all applicable
   * limiters, then record the attempt. Concurrent waiters serialize fairly
   * because the first to wake records its event before the next checks state.
   *
   * If `signal` aborts, the pending timer is cleared and the promise rejects
   * with the signal's reason.
   */
  async wait(signal?: AbortSignal): Promise<void> {
    let waited = false
    while (true) {
      signal?.throwIfAborted()

      const now = performance.now()
      const wakeup = this.getWakeupAt(now)

      if (wakeup <= now) {
        this.sanity.addEvent(now)
        this.flood.addEvent(now)
        if (waited) this._log?.debug('admitted connect after waiting')
        return
      }

      const delay = wakeup - now
      this._log?.debug('connect throttled (waiting %dms)', Math.round(delay))
      waited = true

      await new Promise<void>((resolve, reject) => {
        const handle = timers.setTimeout(() => {
          // eslint-disable-next-line ts/no-use-before-define
          signal?.removeEventListener('abort', onAbort)
          resolve()
        }, delay)
        const onAbort = () => {
          timers.clearTimeout(handle)
          reject(signal!.reason)
        }
        signal?.addEventListener('abort', onAbort, { once: true })
      })
    }
  }

  /** Reset all internal state. Mainly for tests. */
  reset(): void {
    this.sanity.reset()
    this.flood.reset()
    this.mtprotoError.reset()
  }
}
