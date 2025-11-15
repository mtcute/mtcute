import type { tl } from '@mtcute/tl'

/**
 * Formatted text with entities
 */
export interface TextWithEntities {
  readonly text: string
  readonly entities?: tl.TypeMessageEntity[]
}

/**
 * Type to be used as a parameter for methods that accept
 * a formatted text with entities.
 *
 * Can be either a plain string or an object with `text` and `entities` fields.
 */
export type InputText = string | TextWithEntities

/**
 * Convert {@link InputText} to a {@link tl.RawTextWithEntities} object
 *
 * @param text  Input text
 * @returns  TL object
 */
export function inputTextToTl(text: InputText): tl.RawTextWithEntities {
  return {
    _: 'textWithEntities',
    text: typeof text === 'string' ? text : text.text,
    entities: typeof text === 'string' ? [] : text.entities ?? [],
  }
}
