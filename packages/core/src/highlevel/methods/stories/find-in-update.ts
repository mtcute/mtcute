import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { assertTypeIs, hasValueAtKey } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { PeersIndex, Story } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'

/** @internal */
export function _findStoryInUpdate(client: ITelegramClient, res: tl.TypeUpdates): Story {
    assertIsUpdatesGroup('_findStoryInUpdate', res)

    client.handleClientUpdate(res, true)

    const peers = PeersIndex.from(res)
    const updateStory = res.updates.find(hasValueAtKey('_', 'updateStory'))

    if (!updateStory) {
        throw new MtTypeAssertionError('_findStoryInUpdate (@ .updates[*])', 'updateStory', 'none')
    }

    assertTypeIs('updateStory.story', updateStory.story, 'storyItem')

    return new Story(updateStory.story, peers)
}
