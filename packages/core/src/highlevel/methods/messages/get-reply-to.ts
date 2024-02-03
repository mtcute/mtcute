import { ITelegramClient } from '../../client.types.js'
import { Message } from '../../types/messages/index.js'
import { getMessages } from './get-messages.js'
import { getMessagesUnsafe } from './get-messages-unsafe.js'

/**
 * For messages containing a reply, fetch the message that is being replied.
 *
 * Note that even if a message has {@link replyToMessage},
 * the message itself may have been deleted, in which case
 * this method will also return `null`.
 */
export async function getReplyTo(client: ITelegramClient, message: Message): Promise<Message | null> {
    if (!message.replyToMessage?.id) {
        return null
    }

    if (message.raw.peerId._ === 'peerChannel') {
        const [msg] = await getMessages(client, message.chat.inputPeer, message.id, true)

        return msg
    }

    const [msg] = await getMessagesUnsafe(client, message.id, true)

    return msg
}
