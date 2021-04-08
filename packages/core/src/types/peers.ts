/**
 * Peer types that have one-to-one relation to `tl.Peer*` types.
 */
export type BasicPeerType = 'user' | 'chat' | 'channel'

/**
 * More extensive peer types, that differentiate between
 * users and bots, channels and supergroups.
 */
export type PeerType = 'user' | 'bot' | 'group' | 'channel' | 'supergroup'
