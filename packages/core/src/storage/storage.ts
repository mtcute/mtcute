import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { getPlatform } from '../platform.js'
import { asyncResettable } from '../utils/index.js'
import { Logger } from '../utils/logger.js'
import { IMtStorageProvider } from './provider.js'
import { AuthKeysService } from './service/auth-keys.js'
import { ServiceOptions } from './service/base.js'
import { DefaultDcsService } from './service/default-dcs.js'
import { FutureSaltsService } from './service/future-salts.js'

interface StorageManagerOptions {
    provider: IMtStorageProvider
    log: Logger
    readerMap: TlReaderMap
    writerMap: TlWriterMap
}

/**
 * Additional options for {@link StorageManager}, that
 * can be customized by the user.
 *
 * @internal
 */
export interface StorageManagerExtraOptions {
    /**
     * Interval in milliseconds for saving the storage.
     *
     * When saving, the storage is expected to persist
     * all changes to disk, so that they are not lost.
     */
    saveInterval?: number

    /**
     * Whether to finalize database before exiting.
     *
     * @default  `true`
     */
    cleanup?: boolean
}

export class StorageManager {
    readonly provider
    readonly driver
    readonly log
    readonly dcs
    readonly salts
    readonly keys

    constructor(readonly options: StorageManagerOptions & StorageManagerExtraOptions) {
        this.provider = this.options.provider
        this.driver = this.provider.driver
        this.log = this.options.log.create('storage')

        const serviceOptions: ServiceOptions = {
            driver: this.driver,
            readerMap: this.options.readerMap,
            writerMap: this.options.writerMap,
            log: this.log,
        }

        this.dcs = new DefaultDcsService(this.provider.kv, serviceOptions)
        this.salts = new FutureSaltsService(this.provider.kv, serviceOptions)
        this.keys = new AuthKeysService(this.provider.authKeys, this.salts, serviceOptions)
    }

    private _cleanupRestore?: () => void

    private _load = asyncResettable(async () => {
        this.driver.setup?.(this.log)

        if (this.options.cleanup ?? true) {
            this._cleanupRestore = getPlatform().beforeExit(() => {
                this._destroy().catch((err) => this.log.error('cleanup error: %s', err))
            })
        }

        await this.driver.load?.()
    })
    load(): Promise<void> {
        return this._load.run()
    }

    async save(): Promise<void> {
        await this.driver.save?.()
    }

    async clear(withAuthKeys = false) {
        if (withAuthKeys) {
            await this.provider.authKeys.deleteAll()
        }
        await this.provider.kv.deleteAll()
        await this.save()
    }

    private async _destroy(): Promise<void> {
        if (!this._load.finished()) return
        await this._load.wait()

        await this.driver.destroy?.()
        this._load.reset()
    }

    async destroy(): Promise<void> {
        if (this._cleanupRestore) {
            this._cleanupRestore()
            this._cleanupRestore = undefined
        }

        await this._destroy()
    }
}
