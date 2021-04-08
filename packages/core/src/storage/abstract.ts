import { MaybeAsync, PeerType } from '../types'
import { tl } from '@mtcute/tl'
import { MAX_CHANNEL_ID } from '../utils/peer-utils'

export namespace ITelegramStorage {
    export interface PeerInfo {
        // marked id
        id: number
        accessHash: tl.Long
        type: PeerType
        username: string | null
        phone: string | null
        updated: number
    }

    export interface SelfInfo {
        isBot: boolean
        userId: number
    }

    export function getInputPeer(peerInfo?: PeerInfo): tl.TypeInputPeer | null {
        if (!peerInfo) return null
        if (peerInfo.type === 'user' || peerInfo.type === 'bot')
            return {
                _: 'inputPeerUser',
                userId: peerInfo.id,
                accessHash: peerInfo.accessHash,
            }

        if (peerInfo.type === 'group')
            return {
                _: 'inputPeerChat',
                chatId: -peerInfo.id,
            }

        if (peerInfo.type === 'channel' || peerInfo.type === 'supergroup')
            return {
                _: 'inputPeerChannel',
                channelId: MAX_CHANNEL_ID - peerInfo.id,
                accessHash: peerInfo.accessHash,
            }

        throw new Error(`Invalid peer type: ${peerInfo.type}`)
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
    setDefaultDc(dc: tl.RawDcOption | null): MaybeAsync<void>
    /**
     * Get default datacenter for this session
     * (by default should return null)
     */
    getDefaultDc(): MaybeAsync<tl.RawDcOption | null>

    /**
     * Get auth_key for a given DC
     * (returning null will start authorization)
     */
    getAuthKeyFor(dcId: number): MaybeAsync<Buffer | null>
    /**
     * Set auth_key for a given DC
     */
    setAuthKeyFor(dcId: number, key: Buffer | null): MaybeAsync<void>

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
     * Get common `pts` and `date` values (if available)
     */
    getCommonPts(): MaybeAsync<[number, number] | null>
    /**
     * Get channel `pts` value
     */
    getChannelPts(entityId: number): MaybeAsync<number | null>
    /**
     * Set common `pts` and `date` values
     *
     * `null` values in the tuple are replaced with the current value,
     * `null` as a `val` will remove common pts
     */
    setCommonPts(val: [number | null, number | null] | null): MaybeAsync<void>
    /**
     * Set channel `pts` value
     */
    setChannelPts(entityId: number, pts: number | null): MaybeAsync<void>

    // TODO!
    // exportToString(): MaybeAsync<string>
    // importFromString(): MaybeAsync<void>
}