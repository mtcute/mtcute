import { EventEmitter } from 'events'
import { PacketCodec } from './abstract'
import { ICryptoProvider } from '../../utils/crypto'

export abstract class WrappedCodec extends EventEmitter {
    protected _crypto: ICryptoProvider
    protected _inner: PacketCodec

    constructor (inner: PacketCodec) {
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

    setupCrypto(crypto: ICryptoProvider): void {
        this._crypto = crypto
        this._inner.setupCrypto?.(crypto)
    }
}