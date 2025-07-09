import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import type { InputText } from '../../types/misc/entities.js'
import { resolveUser } from '../users/resolve-peer.js'

const empty: [string, undefined] = ['', undefined]

function adjustOffsets(entities: tl.TypeMessageEntity[], from: number, by: number): void {
    for (const ent of entities) {
        if (ent.offset < from) continue
        if (by >= 0) {
            ent.offset += by
            continue
        }

        const adjustTotal = Math.min(ent.offset, Math.abs(by))
        const adjustInternal = Math.max(Math.abs(by) - ent.offset, 0)
        ent.offset -= adjustTotal
        ent.length -= adjustInternal
    }
}

/** @internal */
export async function _normalizeInputText(
    client: ITelegramClient,
    input?: InputText,
): Promise<[string, tl.TypeMessageEntity[] | undefined]> {
    if (!input) {
        return empty
    }

    if (typeof input === 'string') {
        return [input, undefined]
    }

    let text = input.text
    const entities = input.entities
    if (!entities) return [text, undefined]

    let canTrimStart = true
    // replace mentionName entities with input ones
    for (const ent of entities) {
        if (ent._ === 'messageEntityMentionName') {
            try {
                const inputPeer = await resolveUser(client, ent.userId)

                const ent_ = ent as unknown as tl.RawInputMessageEntityMentionName
                ent_._ = 'inputMessageEntityMentionName'
                ent_.userId = inputPeer
            } catch (e) {
                client.log.warn('Failed to resolve mention entity for %s: %s', ent.userId, e)
            }
        }
        if (ent._ === 'messageEntityPre' && ent.offset === 0) {
            canTrimStart = false
        }
    }

    // trim text on both sides and adjust offsets
    if (canTrimStart) {
        const resultTrimmed = text.trimStart()
        const numCharsTrimmed = text.length - resultTrimmed.length
        text = resultTrimmed
        adjustOffsets(entities, 0, -numCharsTrimmed)
    }

    text = text.trimEnd()
    for (const ent of entities) {
        const end = ent.offset + ent.length
        if (end > text.length) ent.length = text.length - ent.offset
    }

    return [text, entities]
}
