import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike, MessageEntity } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Translate message text to a given language.
 *
 * Returns `null` if it could not translate the message.
 */
export async function translateMessage(
    client: BaseTelegramClient,
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

    const res = await client.call({
        _: 'messages.translateText',
        peer: await resolvePeer(client, chatId),
        id: [messageId],
        toLang: toLanguage,
    })

    return [res.result[0].text, res.result[0].entities.map((it) => new MessageEntity(it, res.result[0].text))]
}
