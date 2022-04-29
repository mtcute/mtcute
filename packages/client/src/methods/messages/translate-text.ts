import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Translate text to a given language.
 *
 * Returns `null` if it could not translate the message.
 *
 * > **Note**: For now doesn't seem to work, returns null for all messages.
 *
 * @param text  Text to translate
 * @param toLanguage  Target language (two-letter ISO 639-1 language code)
 * @param fromLanguage  Source language (two-letter ISO 639-1 language code, by default auto-detected)
 * @internal
 */
export async function translateText(
    this: TelegramClient,
    text: string,
    toLanguage: string,
    fromLanguage?: string
): Promise<string | null> {
    const res = await this.call({
        _: 'messages.translateText',
        text,
        fromLang: fromLanguage,
        toLang: toLanguage,
    })

    if (res._ === 'messages.translateNoResult') {
        return null
    }

    return res.text
}
