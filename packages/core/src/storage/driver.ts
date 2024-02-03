import { MaybePromise } from '../types/utils.js'
import { Logger } from '../utils/logger.js'

/**
 * Basic storage driver interface,
 * describing the lifecycle of a storage driver
 */
export interface IStorageDriver {
    /**
     * Load session from some external storage.
     * Should be used either to load data from file/network/etc
     * to memory, or to open required connections to fetch data on demand
     *
     * May be called more than once, handle this with care
     * (or use {@link BaseStorageDriver} that handles this for you)
     */
    load?(): MaybePromise<void>
    /**
     * Save session to some external storage.
     * Should be used to commit pending changes in the session.
     * For example, saving session content to file/network/etc,
     * or committing a database transaction
     *
     * It is safe to batch all changes and only commit them here,
     * unless stated otherwise in the method description
     */
    save?(): MaybePromise<void>
    /**
     * Cleanup session and release all used resources.
     *
     * May be called more than once, handle this with care
     * (or use {@link BaseStorageDriver} that handles this for you)
     */
    destroy?(): MaybePromise<void>

    /**
     * Setup the driver, passing the logger instance,
     * in case your driver needs it
     */
    setup?(log: Logger): void
}

/**
 * Base storage driver class, implementing {@link IStorageDriver}
 * and handling the lifecycle for you
 */
export abstract class BaseStorageDriver implements IStorageDriver {
    abstract _load(): MaybePromise<void>
    abstract _destroy(): MaybePromise<void>
    abstract _save?(): MaybePromise<void>

    private _loadedTimes = 0
    private _destroyed = false

    protected _log!: Logger

    setup(log: Logger): void {
        this._log = log
    }

    protected get loaded(): boolean {
        return this._loadedTimes > 0
    }

    async load(): Promise<void> {
        if (this._loadedTimes === 0) {
            await this._load()
            this._destroyed = false
        }

        this._loadedTimes++
    }

    async destroy(): Promise<void> {
        if (this._destroyed) {
            return
        }

        this._loadedTimes--

        if (this._loadedTimes === 0) {
            await this._destroy()
            this._destroyed = true
        }
    }

    save(): MaybePromise<void> {
        return this._save?.()
    }
}
