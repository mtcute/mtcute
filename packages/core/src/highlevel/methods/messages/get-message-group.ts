import { MtArgumentError } from '../../../types/errors.js'
import { isPresent } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputMessageId, Message, normalizeInputMessageId } from '../../types/index.js'
import { isInputPeerChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getMessages } from './get-messages.js'

/**
 * Get all messages inside of a message group
 *
 * @param chatId  Chat ID
 * @param message  ID of one of the messages in the group
 */
export async function getMessageGroup(client: ITelegramClient, params: InputMessageId): Promise<Message[]> {
    const { chatId, message } = normalizeInputMessageId(params)

    // awesome hack stolen from pyrogram
    // groups have no more than 10 items
    // however, since for non-channels message ids are shared,
    // we use larger number.
    // still, this might not be enough :shrug:

    const peer = await resolvePeer(client, chatId)

    const delta = isInputPeerChannel(peer) ? 9 : 19

    const ids: number[] = []

    for (let i = Math.max(message - delta, 0); i <= message + delta; i++) {
        ids.push(i)
    }

    const messages = await getMessages(client, chatId, ids)
    const groupedId = messages.find((it) => it?.id === message)!.groupedId

    if (!groupedId) throw new MtArgumentError('This message is not grouped')

    return messages.filter(isPresent).filter((it) => it.groupedId?.eq(groupedId))
}
