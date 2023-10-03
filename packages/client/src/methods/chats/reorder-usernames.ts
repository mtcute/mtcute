import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { isInputPeerChannel, isInputPeerUser, normalizeToInputChannel, normalizeToInputUser } from '../../utils'

/**
 * Reorder usernames
 *
 * @param peerId  Bot, channel or "me"/"self"
 * @internal
 */
export async function reorderUsernames(this: TelegramClient, peerId: InputPeerLike, order: string[]): Promise<void> {
    const peer = await this.resolvePeer(peerId)

    if (isInputPeerUser(peer)) {
        // either a bot or self

        if (peer._ === 'inputPeerSelf' || peer.userId === this._userId) {
            // self
            await this.call({
                _: 'account.reorderUsernames',
                order,
            })

            return
        }

        // bot
        await this.call({
            _: 'bots.reorderUsernames',
            bot: normalizeToInputUser(peer, peerId),
            order,
        })
    } else if (isInputPeerChannel(peer)) {
        await this.call({
            _: 'channels.reorderUsernames',
            channel: normalizeToInputChannel(peer, peerId),
            order,
        })
    }
}
