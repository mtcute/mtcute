import type { MaybePromise } from '../../../types/utils.js'

// eslint-disable-next-line ts/no-namespace
export namespace IPeersRepository {
  /** Information about a cached peer */
  export interface PeerInfo {
    /** Peer marked ID */
    id: number
    /** Peer access hash, as a fast string representation */
    accessHash: string
    /** Whether the peer is a "min" peer */
    isMin: boolean
    /** Peer usernames, if any */
    usernames: string[]
    /** Timestamp (in seconds) when the peer was last updated */
    updated: number
    /** Peer phone number, if available */
    phone?: string

    /**
     * Complete information about the peer,
     * serialization of {@link tl.TypeUser} or {@link tl.TypeChat}
     */
    complete: Uint8Array
  }
}

export interface IPeersRepository {
  /** Store the given peer */
  store: (peer: IPeersRepository.PeerInfo) => MaybePromise<void>
  /**
   * Find a peer by their `id`.
   * Should return a "min" peer if one is available.
   */
  getById: (id: number) => MaybePromise<IPeersRepository.PeerInfo | null>
  /**
   * Find a peer by their username (where `usernames` includes `username`).
   * Should never return "min" peers
   */
  getByUsername: (username: string) => MaybePromise<IPeersRepository.PeerInfo | null>
  /**
   * Find a peer by their `phone`.
   * Should never return "min" peers
   */
  getByPhone: (phone: string) => MaybePromise<IPeersRepository.PeerInfo | null>

  deleteAll: () => MaybePromise<void>
}
