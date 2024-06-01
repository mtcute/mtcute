import { tl } from '@mtcute/tl'

import { LongMap } from '../../../utils/long-utils.js'
import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { MessageEffect } from '../../types/index.js'

// @available=user
/**
 * Get a list of available message effects
 */
export async function getAvailableMessageEffects(client: ITelegramClient): Promise<MessageEffect[]> {
    const res = await client.call({
        _: 'messages.getAvailableEffects',
        hash: 0,
    })

    assertTypeIsNot('getAvailableMessageEffects', res, 'messages.availableEffectsNotModified')

    const documentsMap = new LongMap<tl.RawDocument>()

    for (const doc of res.documents) {
        if (doc._ !== 'document') continue
        documentsMap.set(doc.id, doc)
    }

    return res.effects.map((effect) => new MessageEffect(effect, documentsMap))
}
