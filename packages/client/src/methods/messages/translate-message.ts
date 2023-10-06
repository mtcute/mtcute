import { TelegramClient } from '../../client'
import { InputPeerLike, MessageEntity } from '../../types'

/**
 * Translate message text to a given language.
 *
 * Returns `null` if it could not translate the message.
 *
 * @internal
 */
export async function translateMessage(
    this: TelegramClient,
    params: {
        /** Chat or user ID */
        chatId: InputPeerLike
        /** Identifier of the message to translate */
        messageId: number
        /** Target language (two-letter ISO 639-1 language code) */
        toLanguage: string
    },
): Promise<[string, MessageEntity[]] | null> {
    const { chatId, messageId, toLanguage } = params

    const res = await this.call({
        _: 'messages.translateText',
        peer: await this.resolvePeer(chatId),
        id: [messageId],
        toLang: toLanguage,
    })

    return [res.result[0].text, res.result[0].entities.map((it) => new MessageEntity(it, res.result[0].text))]
}
