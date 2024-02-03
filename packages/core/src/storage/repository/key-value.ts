import { MaybePromise } from '../../types/utils.js'

export interface IKeyValueRepository {
    /** Set a key-value pair */
    set(key: string, value: Uint8Array): MaybePromise<void>
    /** Get a key-value pair */
    get(key: string): MaybePromise<Uint8Array | null>
    /** Delete a key-value pair */
    delete(key: string): MaybePromise<void>

    deleteAll(): MaybePromise<void>
}
