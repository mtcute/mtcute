import EventEmitter from 'events'

import { ITelegramTransport, TransportState } from '@mtcute/core'
import { ICryptoProvider, Logger } from '@mtcute/core/utils.js'
import { tl } from '@mtcute/tl'

export class StubTelegramTransport extends EventEmitter implements ITelegramTransport {
    constructor(
        readonly params: {
            getMtproxyInfo?: () => tl.RawInputClientProxy
            onConnect?: (dc: tl.RawDcOption, testMode: boolean) => void
            onClose?: () => void
            onMessage?: (msg: Uint8Array) => void
        },
    ) {
        super()

        if (params.getMtproxyInfo) {
            (this as ITelegramTransport).getMtproxyInfo = params.getMtproxyInfo
        }
    }

    _state = TransportState.Idle
    _currentDc: tl.RawDcOption | null = null
    _crypto!: ICryptoProvider
    _log!: Logger

    write(data: Uint8Array): void {
        this.emit('message', data)
    }

    setup(crypto: ICryptoProvider, log: Logger): void {
        this._crypto = crypto
        this._log = log
    }

    state(): TransportState {
        return this._state
    }

    currentDc(): tl.RawDcOption | null {
        return this._currentDc
    }

    connect(dc: tl.RawDcOption, testMode: boolean): void {
        this._currentDc = dc
        this._state = TransportState.Ready
        this.emit('ready')
        this._log.debug('stubbing connection to %s:%d', dc.ipAddress, dc.port)

        this.params.onConnect?.(dc, testMode)
    }

    close(): void {
        this._currentDc = null
        this._state = TransportState.Idle
        this.emit('close')
        this._log.debug('stub connection closed')

        this.params.onClose?.()
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async send(data: Uint8Array): Promise<void> {
        this.params.onMessage?.(data)
    }
}
