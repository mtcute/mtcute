import { tl } from '@mtcute/core'

/**
 * Interface describing some text with entities.
 *
 * Primarily used as a return type for parsers.
 */
export interface TextWithEntities {
    readonly text: string
    readonly entities: tl.TypeMessageEntity[]
}
