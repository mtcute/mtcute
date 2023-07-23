import { TelegramClient } from '../../client'

/**
 * Translate text to a given language.
 *
 * Returns `null` if it could not translate the message.
 *
 * > **Note**: For now doesn't seem to work, returns null for all messages.
 *
 * @param text  Text to translate
 * @param toLanguage  Target language (two-letter ISO 639-1 language code)
 * @internal
 */
export async function translateText(
    this: TelegramClient,
    text: string,
    toLanguage: string,
): Promise<string | null> {
    const res = await this.call({
        _: 'messages.translateText',
        text: [
            {
                _: 'textWithEntities',
                text,
                entities: [],
            },
        ],
        toLang: toLanguage,
    })

    return res.result[0].text
}
