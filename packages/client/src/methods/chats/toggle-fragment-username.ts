import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { isInputPeerChannel, isInputPeerUser, normalizeToInputChannel, normalizeToInputUser } from '../../utils'

/**
 * Toggle a collectible (Fragment) username
 *
 * > **Note**: non-collectible usernames must still be changed
 * > using {@link setUsername}/{@link setChatUsername}
 *
 * @internal
 */
export async function toggleFragmentUsername(
    this: TelegramClient,
    params: {
        /** Peer ID whose username to toggle */
        peerId: InputPeerLike

        /**
         * Username to toggle
         */
        username: string

        /**
         * Whether to enable or disable the username
         */
        active: boolean
    },
): Promise<void> {
    const { peerId, username, active } = params

    const peer = await this.resolvePeer(peerId)

    if (isInputPeerUser(peer)) {
        // either a bot or self

        if (peer._ === 'inputPeerSelf' || peer.userId === this._userId) {
            // self
            await this.call({
                _: 'account.toggleUsername',
                username,
                active,
            })

            return
        }

        // bot
        await this.call({
            _: 'bots.toggleUsername',
            bot: normalizeToInputUser(peer, peerId),
            username,
            active,
        })
    } else if (isInputPeerChannel(peer)) {
        await this.call({
            _: 'channels.toggleUsername',
            channel: normalizeToInputChannel(peer, peerId),
            username,
            active,
        })
    }
}
