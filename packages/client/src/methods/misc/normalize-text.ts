import { BaseTelegramClient, tl } from '@mtcute/core'

import { InputText } from '../../types/misc/entities.js'
import { toInputUser } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

const empty: [string, undefined] = ['', undefined]

/** @internal */
export async function _normalizeInputText(
    client: BaseTelegramClient,
    input?: InputText,
): Promise<[string, tl.TypeMessageEntity[] | undefined]> {
    if (!input) {
        return empty
    }

    if (typeof input === 'string') {
        return [input, undefined]
    }

    const { text, entities } = input
    if (!entities) return [text, undefined]

    // replace mentionName entities with input ones
    for (const ent of entities) {
        if (ent._ === 'messageEntityMentionName') {
            try {
                const inputPeer = toInputUser(await resolvePeer(client, ent.userId), ent.userId)

                const ent_ = ent as unknown as tl.RawInputMessageEntityMentionName
                ent_._ = 'inputMessageEntityMentionName'
                ent_.userId = inputPeer
            } catch (e) {
                client.log.warn('Failed to resolve mention entity for %s: %s', ent.userId, e)
            }
        }
    }

    return [text, entities]
}
