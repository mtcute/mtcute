import { MtUnsupportedError } from '../types/index.js'
import { JsonMemoryStorage } from './json.js'

/**
 * mtcute storage that stores data in a `localStorage` key.
 *
 * > **Note**: This storage is **not fully persistent**, meaning that
 * > some data *will* be lost on restart, including entities cache,
 * > FSM and rate limiter states, because the JSON would be too large otherwise.
 * >
 * > This storage should only be used for testing purposes,
 * > and should not be used in production. Use e.g. {@link IdbStorage} instead.
 *
 * @deprecated
 */
export class LocalstorageStorage extends JsonMemoryStorage {
    private readonly _key: string

    constructor(key: string) {
        super()

        if (typeof localStorage === 'undefined') {
            throw new MtUnsupportedError('localStorage is not available!')
        }

        this._key = key
    }

    load(): void {
        try {
            const val = localStorage.getItem(this._key)
            if (val === null) return

            this._loadJson(val)
        } catch (e) {}
    }

    save(): void {
        localStorage.setItem(this._key, this._saveJson())
    }
}
