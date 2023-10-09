import { BaseTelegramClient, MtTypeAssertionError, tl } from '@mtcute/core'
import { assertTypeIs, hasValueAtKey } from '@mtcute/core/utils'

import { PeersIndex, Story } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/** @internal */
export function _findStoryInUpdate(client: BaseTelegramClient, res: tl.TypeUpdates): Story {
    assertIsUpdatesGroup('_findStoryInUpdate', res)

    client.network.handleUpdate(res, true)

    const peers = PeersIndex.from(res)
    const updateStory = res.updates.find(hasValueAtKey('_', 'updateStory'))

    if (!updateStory) {
        throw new MtTypeAssertionError('_findStoryInUpdate (@ .updates[*])', 'updateStory', 'none')
    }

    assertTypeIs('updateStory.story', updateStory.story, 'storyItem')

    return new Story(updateStory.story, peers)
}
