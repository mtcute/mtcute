import { JsonMemoryStorage } from './json'

export class LocalstorageStorage extends JsonMemoryStorage {
    private readonly _key: string

    constructor(key: string) {
        super()
        if (typeof localStorage === 'undefined') {
            throw new Error('localStorage is not available!')
        }

        this._key = key
    }

    load(): void {
        try {
            this._loadJson(localStorage[this._key])
        } catch (e) {}
    }

    save(): void {
        localStorage[this._key] = this._saveJson()
    }
}
