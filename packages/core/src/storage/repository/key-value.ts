import { MaybeAsync } from '../../types/utils.js'

export interface IKeyValueRepository {
    /** Set a key-value pair */
    set(key: string, value: Uint8Array): MaybeAsync<void>
    /** Get a key-value pair */
    get(key: string): MaybeAsync<Uint8Array | null>
    /** Delete a key-value pair */
    delete(key: string): MaybeAsync<void>

    deleteAll(): MaybeAsync<void>
}
