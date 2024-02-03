import { MaybePromise } from '../../types/utils.js'

export interface IAuthKeysRepository {
    /**
     * Store auth_key for the given DC
     *
     * If `key` is `null`, the key should be deleted instead
     *
     * **MUST** be applied immediately, without batching
     */
    set(dc: number, key: Uint8Array | null): MaybePromise<void>
    /** Get auth_key for the given DC */
    get(dc: number): MaybePromise<Uint8Array | null>

    /**
     * Store temp_auth_key for the given DC and idx,
     * along with its expiration date (in seconds)
     *
     * If `key` is `null`, the key should be deleted instead
     *
     * **MUST** be applied immediately, without batching
     */
    setTemp(dc: number, idx: number, key: Uint8Array | null, expires: number): MaybePromise<void>
    /**
     * Given the DC id, idx and point in time (in seconds),
     * return the temp_auth_key that should be used for the next request
     * (such that `now < key.expires`), or `null` if no such key exists
     */
    getTemp(dc: number, idx: number, now: number): MaybePromise<Uint8Array | null>

    /**
     * Delete all stored auth keys for the given DC, including
     * both permanent and temp keys
     *
     * **MUST** be applied immediately, without batching
     */
    deleteByDc(dc: number): MaybePromise<void>

    /**
     * Delete all stored auth keys, including both permanent and temp keys
     *
     * **MUST** be applied immediately, without batching
     */
    deleteAll(): MaybePromise<void>
}
