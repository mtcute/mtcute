import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, Message, MessageReactions, PeersIndex } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get reactions to messages by their IDs.
 *
 * > Apps should short-poll reactions for visible messages
 * > (that weren't sent by the user) once every 15-30 seconds,
 * > but only if `message.reactions` is set
 *
 * @param chatId  ID of the chat with messages
 * @param messages  Message IDs
 * @returns  Reactions to corresponding messages, or `null` if there are none
 */
export async function getMessageReactionsById(
    client: ITelegramClient,
    chatId: InputPeerLike,
    messages: number[],
): Promise<(MessageReactions | null)[]> {
    const res = await client.call({
        _: 'messages.getMessagesReactions',
        peer: await resolvePeer(client, chatId),
        id: messages,
    })

    assertIsUpdatesGroup('messages.getMessagesReactions', res)
    client.handleClientUpdate(res)

    // normally the group contains updateMessageReactions
    // for each message requested that has reactions
    //
    // these updates are not ordered in any way, so
    // we don't need to pass them to updates engine

    const index: Record<number, MessageReactions> = {}

    const peers = PeersIndex.from(res)

    for (const update of res.updates) {
        assertTypeIs('messages.getMessagesReactions', update, 'updateMessageReactions')

        index[update.msgId] = new MessageReactions(update.msgId, getMarkedPeerId(update.peer), update.reactions, peers)
    }

    return messages.map((messageId) => index[messageId] ?? null)
}

/**
 * Get reactions to {@link Message}s.
 *
 * > **Note**: messages must all be from the same chat.
 *
 * > Apps should short-poll reactions for visible messages
 * > (that weren't sent by the user) once every 15-30 seconds,
 * > but only if `message.reactions` is set
 *
 * @param chatId  ID of the chat with messages
 * @param messages  Message IDs
 * @returns  Reactions to corresponding messages, or `null` if there are none
 */
export async function getMessageReactions(
    client: ITelegramClient,
    messages: Message[],
): Promise<(MessageReactions | null)[]> {
    return getMessageReactionsById(
        client,
        messages[0].chat.inputPeer,
        messages.map((it) => it.id),
    )
}
