import { BaseTelegramClient } from '@mtcute/core'

import { InputMessageId, MessageEntity, normalizeInputMessageId } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Translate message text to a given language.
 *
 * Returns `null` if it could not translate the message.
 */
export async function translateMessage(
    client: BaseTelegramClient,
    params: InputMessageId & {
        /** Target language (two-letter ISO 639-1 language code) */
        toLanguage: string
    },
): Promise<[string, MessageEntity[]] | null> {
    const { toLanguage } = params
    const { chatId, message } = normalizeInputMessageId(params)

    const res = await client.call({
        _: 'messages.translateText',
        peer: await resolvePeer(client, chatId),
        id: [message],
        toLang: toLanguage,
    })

    return [res.result[0].text, res.result[0].entities.map((it) => new MessageEntity(it, res.result[0].text))]
}
