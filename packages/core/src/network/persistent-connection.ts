import type { ReconnectionStrategy } from '@fuman/net'
import type { tl } from '../tl/index.js'
import type { BasicDcOption, ICryptoProvider, Logger } from '../utils/index.js'
import type { ConnectionFloodLimits } from './flood-control.js'
import type { IPacketCodec, ITelegramConnection, TelegramTransport } from './transports/abstract.js'

import { FramedReader, FramedWriter } from '@fuman/io'

import { ConnectionClosedError, PersistentConnection as FumanPersistentConnection, ip } from '@fuman/net'
import { Emitter, timers } from '@fuman/utils'
import { MtcuteError, MtTimeoutError } from '../types/errors.js'
import { dedupeDcOptions, getDcOptionAddressKey } from '../utils/dcs.js'
import { ConnectionFloodController } from './flood-control.js'

// only applied when there are other addresses to try, otherwise we'd just retry the same one.
// doubled after every round over all addresses without success (up to the max),
// so that slow connections (e.g. via a proxy) still get through eventually
const CONNECT_TIMEOUT = 15_000
const MAX_CONNECT_TIMEOUT = 60_000
// for how long other connections to the same dc will skip an address that failed to connect
const DC_FAILURE_TTL = 600_000

// not reported via handleError, since it's already logged when switching to the next address
class ConnectTimeoutError extends MtTimeoutError {}

function isPlainMessage(data: Uint8Array): boolean {
  if (data.length < 8) return false

  for (let i = 0; i < 8; i++) {
    if (data[i] !== 0) return false
  }

  return true
}

export interface PersistentConnectionParams {
  crypto: ICryptoProvider
  transport: TelegramTransport
  /** DC to connect to. Updated when switching to one of {@link dcFallbacks} */
  dc: BasicDcOption
  /** Addresses of the same DC to try (in order) if connecting to {@link dc} fails */
  dcFallbacks?: BasicDcOption[]
  /**
   * Addresses that recently failed to connect (address key → `performance.now()` of the failure).
   * Shared between all connections to the same DC, so that they can skip these addresses
   */
  dcFailures?: Map<string, number>
  testMode: boolean
  reconnectionStrategy: ReconnectionStrategy
  inactivityTimeout?: number
  /** if present, each connection gates its connects through its own flood controller */
  floodControl?: ConnectionFloodLimits
}

let nextConnectionUid = 0

/**
 * Base class for persistent connections.
 * Only used for {@link PersistentConnection} and used as a mean of code splitting.
 * This class doesn't know anything about MTProto, it just manages the transport.
 */
export abstract class PersistentConnection {
  private _uid = nextConnectionUid++

  readonly params: PersistentConnectionParams

  private _sendOnceConnected: Uint8Array[] = []
  private _codec: IPacketCodec
  private _fuman: FumanPersistentConnection<BasicDcOption, ITelegramConnection>

  // reconnection
  protected _disconnectedManually = false

  // inactivity timeout
  private _inactivityTimeout: timers.Timer | null = null
  _inactive = true
  _destroyed = false
  _usable = false

  // each connection slot throttles its own connect attempts, mirroring
  // TDLib's per-SessionProxy flood control. a fresh controller has empty
  // limiters, so the first connect always passes immediately.
  protected readonly _floodControl?: ConnectionFloodController
  // aborts a pending flood-control wait when the connection is being
  // closed (manually or for good) — otherwise close() would block until
  // the wait expires, and the connect would still proceed afterwards
  private _connectAbort?: AbortController

  // params.dc followed by params.dcFallbacks, params.dc is always one of these
  private _dcCandidates: BasicDcOption[]
  private _dcCandidateIdx = 0
  // failed connects in a row, used to report when none of the addresses work
  private _failedConnects = 0
  // fuman requires the same address object on every .connect() call,
  // the actual address is picked from _dcCandidates in _connect()
  private readonly _fumanAddress: BasicDcOption

  readonly onWait: Emitter<number> = new Emitter()
  readonly onUsable: Emitter<void> = new Emitter()
  readonly onError: Emitter<Error> = new Emitter()

  protected abstract onConnected(): void
  protected abstract onClosed(): void
  protected abstract handleError(err: Error): void

  protected abstract onMessage(data: Uint8Array): void

  protected constructor(
    params: PersistentConnectionParams,
    readonly log: Logger,
  ) {
    this.params = params

    this.params.transport.setup?.(this.params.crypto, log)
    this._codec = this.params.transport.packetCodec(params.dc)
    this._codec.setup?.(this.params.crypto, this.log)

    if (params.floodControl) {
      this._floodControl = new ConnectionFloodController(params.floodControl)
      this._floodControl.setLogger(log.create('flood'))
    }

    this._dcCandidates = dedupeDcOptions([params.dc, ...(params.dcFallbacks ?? [])])
    this._fumanAddress = params.dc

    this._onInactivityTimeout = this._onInactivityTimeout.bind(this)
    this._connect = this._connect.bind(this)
    this._fuman = new FumanPersistentConnection({
      connect: this._connect,
      strategy: params.reconnectionStrategy,
      onOpen: this._onOpen.bind(this),
      onClose: this._onClose.bind(this),
      onError: this._onError.bind(this),
      onWait: (wait) => {
        this._updateLogPrefix()
        this.log.debug('waiting for %d ms before reconnecting', wait)
        this.onWait.emit(wait)
      },
    })

    this._updateLogPrefix()
  }

  private _updateLogPrefix() {
    const uidPrefix = `[UID ${this._uid}] `
    if (this._fuman.isConnected) {
      const dc = this.params.dc
      const prettifiedIp = ip.prettify(dc.ipAddress, { encloseIpv6: true })
      this.log.prefix = `${uidPrefix}[DC ${dc.id} @ ${prettifiedIp}:${dc.port}] `
    } else if (this._fuman.isConnecting) {
      this.log.prefix = `${uidPrefix}[connecting] `
    } else {
      this.log.prefix = `${uidPrefix}[disconnected] `
    }
  }

  private async _connect(_: BasicDcOption, abortSignal: AbortSignal): Promise<ITelegramConnection> {
    if (this._floodControl) {
      if (!this._connectAbort || this._connectAbort.signal.aborted) {
        this._connectAbort = new AbortController()
      }
      this._updateLogPrefix()
      await this._floodControl.wait(this._connectAbort.signal)
    }
    this._updateLogPrefix()

    if (this._dcCandidates.length < 2) {
      this.log.debug('connecting to %j', this.params.dc)
      return this.params.transport.connect(this.params.dc, abortSignal)
    }

    this._skipFailedDcs()

    const dc = this.params.dc
    const dcKey = getDcOptionAddressKey(dc)
    const round = Math.floor(this._failedConnects / this._dcCandidates.length)
    const connectTimeout = Math.min(CONNECT_TIMEOUT * 2 ** round, MAX_CONNECT_TIMEOUT)
    this.log.debug('connecting to %j (timeout: %d ms)', dc, connectTimeout)

    // aborted either from the outside (fuman) or by our timeout
    const attemptAbort = new AbortController()
    const onOuterAbort = () => attemptAbort.abort(abortSignal.reason)
    if (abortSignal.aborted) {
      onOuterAbort()
    } else {
      abortSignal.addEventListener('abort', onOuterAbort)
    }

    const timeout = timers.setTimeout(
      () => attemptAbort.abort(new ConnectTimeoutError(connectTimeout)),
      connectTimeout,
    )

    try {
      const conn = await this.params.transport.connect(dc, attemptAbort.signal)
      this.params.dcFailures?.delete(dcKey)
      this._failedConnects = 0

      return conn
    } catch (e) {
      // aborted from the outside = the connection is being closed, not a connectivity issue
      if (abortSignal.aborted) throw e

      this.params.dcFailures?.set(dcKey, performance.now())
      this._failedConnects += 1

      // transports may wrap the abort reason, but _onError needs to recognize our timeout
      const err = attemptAbort.signal.aborted ? attemptAbort.signal.reason as Error : e as Error
      this._switchToNextDc(err)

      if (this._failedConnects % this._dcCandidates.length === 0) {
        // timeouts are only logged, so make sure the user knows if the dc is not reachable at all.
        // reported once per round over all addresses, not on every failure
        const addresses = this._dcCandidates.map(getDcOptionAddressKey).join(', ')
        this.onError.emit(new MtcuteError(`Could not connect to DC ${dc.id} using any of its addresses (${addresses})`))
      }

      throw err
    } finally {
      timers.clearTimeout(timeout)
      abortSignal.removeEventListener('abort', onOuterAbort)
    }
  }

  private _setDc(idx: number): void {
    const dc = this._dcCandidates[idx]

    this._dcCandidateIdx = idx
    this.params.dc = dc
    // codec may depend on the dc (e.g. mtproxy needs to know dc id and whether it's a media dc)
    this._codec = this.params.transport.packetCodec(dc)
    this._codec.setup?.(this.params.crypto, this.log)
  }

  private _switchToNextDc(err: Error): void {
    const prev = this.params.dc
    this._setDc((this._dcCandidateIdx + 1) % this._dcCandidates.length)

    this.log.warn(
      'failed to connect to %s (%s), will try %s next',
      getDcOptionAddressKey(prev),
      err.message,
      getDcOptionAddressKey(this.params.dc),
    )
  }

  // skip addresses that recently failed for other connections to the same dc
  private _skipFailedDcs(): void {
    const failures = this.params.dcFailures
    if (!failures?.size) return

    const now = performance.now()

    for (let i = 0; i < this._dcCandidates.length; i++) {
      const idx = (this._dcCandidateIdx + i) % this._dcCandidates.length
      const failedAt = failures.get(getDcOptionAddressKey(this._dcCandidates[idx]))

      if (failedAt === undefined || now - failedAt > DC_FAILURE_TTL) {
        if (i !== 0) {
          const prev = this.params.dc
          this._setDc(idx)
          this.log.debug('%s failed recently, using %s', getDcOptionAddressKey(prev), getDcOptionAddressKey(this.params.dc))
        }

        return
      }
    }

    // every address has failed recently, keep rotating as usual
  }

  /**
   * Remove queued (not yet sent) unencrypted messages.
   * Should be called when an authorization attempt fails, since otherwise
   * its messages would be sent once connected, confusing the next attempt
   */
  protected _dropQueuedPlainMessages(): void {
    this._sendOnceConnected = this._sendOnceConnected.filter(it => !isPlainMessage(it))
  }

  get isConnected(): boolean {
    return this._fuman.isConnected
  }

  private _writer?: FramedWriter

  protected _mtproxyInfo?: tl.RawInputClientProxy

  private async _onOpen(conn: ITelegramConnection) {
    this._updateLogPrefix()
    this.log.debug('connected')

    const tag = await this._codec.tag()
    if (tag) {
      await conn.write(tag)
    }

    this._mtproxyInfo = conn.getMtproxyInfo?.()

    const reader = new FramedReader(conn, this._codec)
    this._writer = new FramedWriter(conn, this._codec)

    while (this._sendOnceConnected.length) {
      const data = this._sendOnceConnected.shift()!

      try {
        await this._writer.write(data)
      } catch (e) {
        this._sendOnceConnected.unshift(data)
        throw e
      }
    }

    this._rescheduleInactivity()
    this.onUsable.emit() // is this needed?
    this.onConnected()

    while (true) {
      const msg = await reader.read()

      if (msg) {
        this.onMessage(msg)
      }
    }
  }

  private _onClose(): void {
    this.log.debug('connection closed')
    this._updateLogPrefix()

    this._writer = undefined
    this._codec.reset()
    this.onClosed()
  }

  private _onError(err: Error) {
    this._updateLogPrefix()

    if (!(err instanceof ConnectionClosedError) && !(err instanceof ConnectTimeoutError)) {
      this.handleError(err)
    }

    return 'reconnect' as const
  }

  async changeTransport(transport: TelegramTransport): Promise<void> {
    this._connectAbort?.abort()
    await this._fuman.close()

    this._failedConnects = 0
    this.params.transport = transport
    this._codec = transport.packetCodec(this.params.dc)
    this._codec.setup?.(this.params.crypto, this.log)

    await this._fuman.changeTransport(this._connect)
    this._fuman.connect(this._fumanAddress)
  }

  connect(): void {
    if (this._destroyed) {
      this.log.warn('tried to connect a destroyed connection, ignoring')
      return
    }

    this._fuman.connect(this._fumanAddress)

    this._inactive = false
  }

  reconnect(): void {
    if (this._destroyed) {
      this.log.warn('tried to reconnect a destroyed connection, ignoring')
      return
    }

    if (this._disconnectedManually) {
      this._disconnectedManually = false
      this.connect()
      return
    }
    this._fuman.reconnect(true)
  }

  async disconnectManual(): Promise<void> {
    if (this._inactivityTimeout) {
      timers.clearTimeout(this._inactivityTimeout)
    }
    this._disconnectedManually = true
    this._connectAbort?.abort()
    await this._fuman.close()
    this._failedConnects = 0
  }

  async destroy(): Promise<void> {
    if (this._inactivityTimeout) {
      timers.clearTimeout(this._inactivityTimeout)
    }
    this._destroyed = true
    this._connectAbort?.abort()
    await this._fuman.close()
  }

  protected _rescheduleInactivity(): void {
    if (!this.params.inactivityTimeout) return
    if (this._inactivityTimeout) timers.clearTimeout(this._inactivityTimeout)
    this._inactivityTimeout = timers.setTimeout(this._onInactivityTimeout, this.params.inactivityTimeout)
  }

  protected _onInactivityTimeout(): void {
    this.log.info('disconnected because of inactivity for %d', this.params.inactivityTimeout)
    this._inactive = true
    this._inactivityTimeout = null
    this._connectAbort?.abort()
    Promise.resolve(this._fuman.close()).catch((err) => {
      this.log.warn('error closing transport: %e', err)
    })
  }

  setInactivityTimeout(timeout?: number): void {
    this.params.inactivityTimeout = timeout

    if (this._inactivityTimeout) {
      timers.clearTimeout(this._inactivityTimeout)
    }

    if (timeout) {
      this._rescheduleInactivity()
    }
  }

  async send(data: Uint8Array): Promise<void> {
    if (this._inactive) {
      this.connect()
    }

    if (this._writer) {
      this._rescheduleInactivity()
      try {
        await this._writer.write(data)
      } catch (e: unknown) {
        if (!(e instanceof ConnectionClosedError)) {
          this.log.warn('encountered an error while sending, reconnecting: %e', e)
          this._writer = undefined
          this._fuman.reconnect(true)
          this._sendOnceConnected.push(data)
        }
      }
    } else {
      this._sendOnceConnected.push(data)
    }
  }
}
