import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Translate message text to a given language.
 *
 * Returns `null` if it could not translate the message.
 *
 * > **Note**: For now doesn't seem to work, returns null for all messages.
 *
 * @param chatId  Chat or user ID
 * @param messageId  Identifier of the message to translate
 * @param toLanguage  Target language (two-letter ISO 639-1 language code)
 * @param fromLanguage  Source language (two-letter ISO 639-1 language code, by default auto-detected)
 * @internal
 */
export async function translateMessage(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageId: number,
    toLanguage: string,
    fromLanguage?: string
): Promise<string | null> {
    const res = await this.call({
        _: 'messages.translateText',
        peer: await this.resolvePeer(chatId),
        msgId: messageId,
        fromLang: fromLanguage,
        toLang: toLanguage,
    })

    if (res._ === 'messages.translateNoResult') {
        return null
    }

    return res.text
}
