import { MtTypeAssertionError, tl } from '@mtcute/core'
import { assertTypeIs, hasValueAtKey } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { PeersIndex, Story } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/** @internal */
export function _findStoryInUpdate(this: TelegramClient, res: tl.TypeUpdates): Story {
    assertIsUpdatesGroup('_findStoryInUpdate', res)

    this._handleUpdate(res, true)

    const peers = PeersIndex.from(res)
    const updateStory = res.updates.find(hasValueAtKey('_', 'updateStory'))

    if (!updateStory) {
        throw new MtTypeAssertionError('_findStoryInUpdate (@ .updates[*])', 'updateStory', 'none')
    }

    assertTypeIs('updateStory.story', updateStory.story, 'storyItem')

    return new Story(this, updateStory.story, peers)
}
