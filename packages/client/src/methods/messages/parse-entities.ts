/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseTelegramClient, MtArgumentError, tl } from '@mtcute/core'

import { FormattedString } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { getParseModesState } from '../parse-modes/_state'
import { resolvePeer } from '../users/resolve-peer'

const empty: [string, undefined] = ['', undefined]

/** @internal */
export async function _parseEntities(
    client: BaseTelegramClient,
    text?: string | FormattedString<string>,
    mode?: string | null,
    entities?: tl.TypeMessageEntity[],
): Promise<[string, tl.TypeMessageEntity[] | undefined]> {
    if (!text) {
        return empty
    }

    if (typeof text === 'object') {
        mode = text.mode
        text = text.value
    }

    if (!entities) {
        const parseModesState = getParseModesState(client)

        if (mode === undefined) {
            mode = parseModesState.defaultParseMode
        }
        // either explicitly disabled or no available parser
        if (!mode) return [text, []]

        const modeImpl = parseModesState.parseModes.get(mode)

        if (!modeImpl) {
            throw new MtArgumentError(`Parse mode ${mode} is not registered.`)
        }

        [text, entities] = modeImpl.parse(text)
    }

    // replace mentionName entities with input ones
    for (const ent of entities) {
        if (ent._ === 'messageEntityMentionName') {
            try {
                const inputPeer = normalizeToInputUser(await resolvePeer(client, ent.userId), ent.userId)

                // not a user
                if (!inputPeer) continue
                (ent as any)._ = 'inputMessageEntityMentionName'
                ;(ent as any).userId = inputPeer
            } catch (e) {}
        }
    }

    return [text, entities]
}
