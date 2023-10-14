import { tl } from '@mtcute/tl'
import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { BasicPeerType, MaybeAsync } from '../types/index.js'
import { Logger } from '../utils/index.js'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ITelegramStorage {
    export interface PeerInfo {
        // marked id
        id: number
        accessHash: tl.Long
        type: BasicPeerType
        username?: string
        phone?: string

        full: tl.TypeUser | tl.TypeChat
    }

    export interface SelfInfo {
        isBot: boolean
        userId: number
    }

    export interface DcOptions {
        main: tl.RawDcOption
        media: tl.RawDcOption
    }
}

/**
 * Abstract interface for persistent storage.
 *
 * In some cases you may want to extend existing MemorySession
 * and override save()/load()/destroy() methods, but you are also free
 * to implement your own session (be sure to refer to MemorySession
 * source code to avoid shooting your leg though)
 *
 * Note that even though set methods *can* be async, you should only
 * write updates to the disk when `save()` is called.
 */
export interface ITelegramStorage {
    /**
     * This method is called before any other.
     * For storages that use logging, logger instance.
     * For storages that use binary storage, binary maps
     */
    setup?(log: Logger, readerMap: TlReaderMap, writerMap: TlWriterMap): void

    /**
     * Load session from some external storage.
     * Should be used either to load session content from file/network/etc
     * to memory, or to open required connections to fetch session content later
     */
    load?(): MaybeAsync<void>
    /**
     * Save session to some external storage.
     * Should be used to commit pending changes in the session.
     * For example, saving session content to file/network/etc,
     * or committing a database transaction
     */
    save?(): MaybeAsync<void>
    /**
     * Cleanup session and release all used resources.
     */
    destroy?(): MaybeAsync<void>

    /**
     * Reset session to its default state
     */
    reset(): void

    /**
     * Set default datacenter to use with this session.
     */
    setDefaultDcs(dcs: ITelegramStorage.DcOptions | null): MaybeAsync<void>
    /**
     * Get default datacenter for this session
     * (by default should return null)
     */
    getDefaultDcs(): MaybeAsync<ITelegramStorage.DcOptions | null>

    /**
     * Get auth_key for a given DC
     * (returning null will start authorization)
     * For temp keys: should also return null if the key has expired
     *
     * @param dcId DC ID
     * @param tempIndex  Index of the temporary key (usually 0, used for multi-connections)
     */
    getAuthKeyFor(dcId: number, tempIndex?: number): MaybeAsync<Uint8Array | null>
    /**
     * Set auth_key for a given DC
     */
    setAuthKeyFor(dcId: number, key: Uint8Array | null): MaybeAsync<void>
    /**
     * Set temp_auth_key for a given DC
     * expiresAt is unix time in ms
     */
    setTempAuthKeyFor(dcId: number, index: number, key: Uint8Array | null, expiresAt: number): MaybeAsync<void>
    /**
     * Remove all saved auth keys (both temp and perm)
     * for the given DC. Used when perm_key becomes invalid,
     * meaning all temp_keys also become invalid
     */
    dropAuthKeysFor(dcId: number): MaybeAsync<void>

    /**
     * Get information about currently logged in user (if available)
     */
    getSelf(): MaybeAsync<ITelegramStorage.SelfInfo | null>
    /**
     * Save information about currently logged in user
     */
    setSelf(self: ITelegramStorage.SelfInfo | null): MaybeAsync<void>

    /**
     * Update local database of input peers from the peer info list
     */
    updatePeers(peers: ITelegramStorage.PeerInfo[]): MaybeAsync<void>
    /**
     * Find a peer in local database by its marked ID
     */
    getPeerById(peerId: number): MaybeAsync<tl.TypeInputPeer | null>
    /**
     * Find a peer in local database by its username
     */
    getPeerByUsername(username: string): MaybeAsync<tl.TypeInputPeer | null>
    /**
     * Find a peer in local database by its phone number
     */
    getPeerByPhone(phone: string): MaybeAsync<tl.TypeInputPeer | null>

    /**
     * Get updates state (if available), represented as a tuple
     * containing: `pts, qts, date, seq`
     */
    getUpdatesState(): MaybeAsync<[number, number, number, number] | null>

    /**
     * Set common `pts` value
     */
    setUpdatesPts(val: number): MaybeAsync<void>
    /**
     * Set common `qts` value
     */
    setUpdatesQts(val: number): MaybeAsync<void>
    /**
     * Set updates `date` value
     */
    setUpdatesDate(val: number): MaybeAsync<void>
    /**
     * Set updates `seq` value
     */
    setUpdatesSeq(val: number): MaybeAsync<void>

    /**
     * Get channel `pts` value
     */
    getChannelPts(entityId: number): MaybeAsync<number | null>
    /**
     * Set channels `pts` values in batch.
     * Storage is supposed to replace stored channel `pts` values
     * with given in the object (key is unmarked peer id, value is the `pts`)
     */
    setManyChannelPts(values: Map<number, number>): MaybeAsync<void>

    /**
     * Get cached peer information by their marked ID.
     * Return `null` if caching is not supported, or the entity
     * is not cached (yet).
     *
     * This is primarily used when a `min` entity is encountered
     * in an update, or when a *short* update is encountered.
     * Returning `null` will require re-fetching that
     * update with the peers added, which might not be very efficient.
     */
    getFullPeerById(id: number): MaybeAsync<tl.TypeUser | tl.TypeChat | null>
}
