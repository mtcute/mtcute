import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteArgumentError, Message } from '../../types'

/**
 * Get all messages inside of a message group
 *
 * @param chatId  Chat ID
 * @param message  ID of one of the messages in the group
 * @internal
 */
export async function getMessageGroup(
    this: TelegramClient,
    chatId: InputPeerLike,
    message: number
): Promise<Message[]> {
    // awesome hack stolen from pyrogram
    // groups have no more than 10 items

    const ids: number[] = []
    for (let i = Math.max(message - 9, 0); i <= message + 9; i++) {
        ids.push(i)
    }

    const messages = await this.getMessages(chatId, ids)
    const groupedId = messages.find((it) => it.id === message)!.groupedId

    if (!groupedId)
        throw new MtCuteArgumentError('This message is not grouped')

    return messages.filter((it) => it.groupedId?.eq(groupedId))
}
