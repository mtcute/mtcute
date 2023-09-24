import Long from 'long'

import { MtTypeAssertionError, tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike, Message, PeersIndex } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Send or remove a reaction.
 *
 * @param chatId  Chat ID with the message to react to
 * @param message  Message ID to react to
 * @param emoji  Reaction emoji (if `tl.Long` then this is a custom emoji) or `null` to remove
 * @param big  Whether to use a big reaction
 * @returns  Message to which the reaction was sent
 * @internal
 */
export async function sendReaction(
    this: TelegramClient,
    chatId: InputPeerLike,
    message: number,
    emoji: string | tl.Long | null,
    big = false,
): Promise<Message> {
    let reaction: tl.TypeReaction

    if (Long.isLong(emoji)) {
        reaction = {
            _: 'reactionCustomEmoji',
            documentId: emoji,
        }
    } else if (emoji) {
        reaction = {
            _: 'reactionEmoji',
            emoticon: emoji,
        }
    } else {
        reaction = {
            _: 'reactionEmpty',
        }
    }

    const res = await this.call({
        _: 'messages.sendReaction',
        peer: await this.resolvePeer(chatId),
        msgId: message,
        reaction: [reaction],
        big,
    })

    assertIsUpdatesGroup('messages.sendReaction', res)

    // normally the group contains 2 updates:
    // updateEditChannelMessage
    // updateMessageReactions
    // idk why, they contain literally the same data
    // so we can just return the message from the first one

    this._handleUpdate(res, true)

    const upd = res.updates.find((it) => it._ === 'updateEditChannelMessage') as
        | tl.RawUpdateEditChannelMessage
        | undefined

    if (!upd) {
        throw new MtTypeAssertionError('messages.sendReaction (@ .updates[*])', 'updateEditChannelMessage', 'undefined')
    }

    const peers = PeersIndex.from(res)

    return new Message(this, upd.message, peers)
}
