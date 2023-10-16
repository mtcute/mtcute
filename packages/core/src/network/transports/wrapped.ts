import EventEmitter from 'events'

import { ICryptoProvider, Logger } from '../../utils/index.js'
import { IPacketCodec } from './abstract.js'

export abstract class WrappedCodec extends EventEmitter {
    protected _crypto!: ICryptoProvider
    protected _inner: IPacketCodec

    constructor(inner: IPacketCodec) {
        super()
        this._inner = inner
        this._inner.on('error', (err) => this.emit('error', err))
        this._inner.on('packet', (buf) => this.emit('packet', buf))
    }

    removeAllListeners(): this {
        super.removeAllListeners()
        this._inner.removeAllListeners()

        return this
    }

    setup(crypto: ICryptoProvider, log: Logger): void {
        this._crypto = crypto
        this._inner.setup?.(crypto, log)
    }
}
