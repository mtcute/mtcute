import { tl } from '@mtcute/core'

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
