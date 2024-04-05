import { tl } from '@mtcute/tl'

import { TextWithEntities } from '../types/misc/entities.js'

/**
 * Join multiple text parts with entities into a single text with entities,
 * adjusting the entities' offsets accordingly.
 *
 * @param parts  List of text parts with entities
 * @param delim  Delimiter to insert between parts
 * @returns  A single text with entities
 * @example
 *
 * ```ts
 * const scoreboardText = joinTextWithEntities(
 *   apiResult.scoreboard.map((entry) => html`<b>${entry.name}</b>: ${entry.score}`),
 *   html`<br>`
 * )
 * await tg.sendText(chatId, html`<b>scoreboard:</b><br><br>${scoreboardText}`)
 * ```
 */
export function joinTextWithEntities(
    parts: (string | TextWithEntities)[],
    delim: string | TextWithEntities = '',
): TextWithEntities {
    const textParts: string[] = []
    const newEntities: tl.TypeMessageEntity[] = []

    let position = 0

    if (typeof delim === 'string') {
        delim = { text: delim }
    }

    const pushPart = (part: TextWithEntities) => {
        textParts.push(part.text)
        const entitiesOffset = position
        position += part.text.length

        if (part.entities) {
            for (const entity of part.entities) {
                newEntities.push({
                    ...entity,
                    offset: entity.offset + entitiesOffset,
                })
            }
        }
    }

    for (const part of parts) {
        if (position > 0) {
            pushPart(delim)
        }

        pushPart(typeof part === 'string' ? { text: part } : part)
    }

    return {
        text: textParts.join(''),
        entities: newEntities,
    }
}
