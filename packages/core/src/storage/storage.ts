import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { beforeExit } from '../utils/index.js'
import { Logger } from '../utils/logger.js'
import { IMtStorageProvider } from './provider.js'
import { AuthKeysService } from './service/auth-keys.js'
import { ServiceOptions } from './service/base.js'
import { CurrentUserService } from './service/current-user.js'
import { DefaultDcsService } from './service/default-dcs.js'
import { FutureSaltsService } from './service/future-salts.js'
import { PeersService, PeersServiceOptions } from './service/peers.js'
import { RefMessagesService, RefMessagesServiceOptions } from './service/ref-messages.js'
import { UpdatesStateService } from './service/updates.js'

/**
 * Options for {@link StorageManager}, for internal use only.
 */
export interface StorageManagerOptions {
    provider: IMtStorageProvider
    log: Logger
    readerMap: TlReaderMap
    writerMap: TlWriterMap
}

/**
 * Additional options for {@link StorageManager}, that
 * can be customized by the user.
 */
export interface StorageManagerExtraOptions {
    /**
     * Interval in milliseconds for saving the storage.
     *
     * When saving, the storage is expected to persist
     * all changes to disk, so that they are not lost.
     */
    saveInterval?: number

    refMessages?: RefMessagesServiceOptions
    peers?: PeersServiceOptions

    /**
     * Whether to finalize database before exiting.
     *
     * @default  `true`
     */
    cleanup?: boolean
}

export class StorageManager {
    constructor(readonly options: StorageManagerOptions & StorageManagerExtraOptions) {}

    readonly provider = this.options.provider
    readonly driver = this.provider.driver
    readonly log = this.options.log.create('storage')

    private _serviceOptions: ServiceOptions = {
        driver: this.driver,
        readerMap: this.options.readerMap,
        writerMap: this.options.writerMap,
        log: this.log,
    }

    readonly dcs = new DefaultDcsService(this.provider.kv, this._serviceOptions)
    readonly salts = new FutureSaltsService(this.provider.kv, this._serviceOptions)
    readonly updates = new UpdatesStateService(this.provider.kv, this._serviceOptions)
    readonly self = new CurrentUserService(this.provider.kv, this._serviceOptions)
    readonly keys = new AuthKeysService(this.provider.authKeys, this.salts, this._serviceOptions)
    readonly refMsgs = new RefMessagesService(
        this.options.refMessages ?? {},
        this.provider.refMessages,
        this._serviceOptions,
    )
    readonly peers = new PeersService(this.options.peers ?? {}, this.provider.peers, this.refMsgs, this._serviceOptions)

    private _cleanupRestore?: () => void

    private _loadPromise?: Promise<void> | true
    load(): Promise<void> {
        if (this._loadPromise === true) return Promise.resolve()
        if (this._loadPromise) return this._loadPromise

        this.driver.setup?.(this.log)

        if (this.options.cleanup ?? true) {
            this._cleanupRestore = beforeExit(() => this._destroy().catch((err) => this.log.error(err)))
        }

        this._loadPromise = Promise.resolve(this.driver.load?.()).then(() => {
            this._loadPromise = true
        })

        return this._loadPromise
    }

    async save(): Promise<void> {
        await this.driver.save?.()
    }

    async clear(withAuthKeys = false) {
        if (withAuthKeys) {
            await this.provider.authKeys.deleteAll()
        }
        await this.provider.kv.deleteAll()
        await this.provider.peers.deleteAll()
        await this.provider.refMessages.deleteAll()
        await this.save()
    }

    private async _destroy(): Promise<void> {
        if (!this._loadPromise) return
        await this._loadPromise

        await this.driver.destroy?.()
        this._loadPromise = undefined
    }

    async destroy(): Promise<void> {
        if (this._cleanupRestore) {
            this._cleanupRestore()
            this._cleanupRestore = undefined
        }

        await this._destroy()
    }
}
