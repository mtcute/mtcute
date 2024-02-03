import { tl } from '@mtcute/tl'

import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { Message } from '../../types/messages/message.js'
import { InputPeerLike, PeersIndex } from '../../types/peers/index.js'
import type { CallbackQuery } from '../../types/updates/callback-query.js'
import { isInputPeerChannel, toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=bot
/**
 * Get the message containing the button being clicked
 * in the given callback query.
 */
export async function getCallbackQueryMessage(
    client: ITelegramClient,
    id:
        | CallbackQuery
        | tl.RawUpdateBotCallbackQuery
        | {
              messageId: number
              queryId: tl.Long
              peer: InputPeerLike
          },
): Promise<Message | null> {
    let msgId: number
    let queryId: tl.Long
    let peer: tl.TypeInputPeer

    if ('_' in id) {
        msgId = id.msgId
        queryId = id.queryId
        peer = await resolvePeer(client, id.peer)
    } else if ('raw' in id) {
        msgId = id.messageId
        queryId = id.id
        peer = id.chat.inputPeer
    } else {
        msgId = id.messageId
        queryId = id.queryId
        peer = await resolvePeer(client, id.peer)
    }

    const inputMessage: tl.TypeInputMessage = {
        _: 'inputMessageCallbackQuery',
        id: msgId,
        queryId,
    }

    const isChannel = isInputPeerChannel(peer)

    const res = await client.call(
        isChannel ?
            {
                _: 'channels.getMessages',
                id: [inputMessage],
                channel: toInputChannel(peer),
            } :
            {
                _: 'messages.getMessages',
                id: [inputMessage],
            },
    )

    assertTypeIsNot('getCallbackQueryMessage', res, 'messages.messagesNotModified')

    if (res.messages[0]._ === 'messageEmpty') {
        return null
    }

    return new Message(res.messages[0], PeersIndex.from(res))
}
