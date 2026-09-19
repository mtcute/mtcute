import type { ITelegramClient } from '../../client.types.js'
import type { InputText, TextWithEntities } from '../../types/misc/entities.js'
import { MtcuteError } from '../../../types/errors.js'
import { _normalizeInputText } from '../misc/normalize-text.js'

/**
 * Translate text to a given language.
 *
 * @param text  Text to translate
 * @param toLanguage  Target language (two-letter ISO 639-1 language code)
 */
export async function translateText(
  client: ITelegramClient,
  text: InputText,
  toLanguage: string,
  params?: {
    /**
     * Tone of the translation
     *
     * @default  `"neutral"`
     */
    tone?: 'formal' | 'neutral' | 'casual' | (string & {})
  },
): Promise<TextWithEntities> {
  const [message, entities] = await _normalizeInputText(client, text)

  const res = await client.call({
    _: 'messages.translateText',
    text: [
      {
        _: 'textWithEntities',
        text: message,
        entities: entities || [],
      },
    ],
    toLang: toLanguage,
    tone: params?.tone,
  })

  if (!res.result[0]) {
    throw new MtcuteError('Translation result is empty')
  }

  return {
    text: res.result[0].text,
    entities: res.result[0].entities,
  }
}
