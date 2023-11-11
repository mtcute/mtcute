import { MtUnsupportedError } from '../types/index.js'
import { JsonMemoryStorage } from './json.js'

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
