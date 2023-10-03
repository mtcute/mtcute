import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { isInputPeerChannel, isInputPeerUser, normalizeToInputChannel, normalizeToInputUser } from '../../utils'

/**
 * Toggle a collectible (Fragment) username
 *
 * > **Note**: non-collectible usernames must still be changed
 * > using {@link setUsername}/{@link setChatUsername}
 *
 * @param peerId  Bot, channel or "me"/"self"
 * @internal
 */
export async function toggleFragmentUsername(
    this: TelegramClient,
    peerId: InputPeerLike,
    params: {
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
    const { username, active } = params

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
