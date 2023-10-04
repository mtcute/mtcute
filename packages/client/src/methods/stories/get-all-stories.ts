import { assertTypeIsNot } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { AllStories } from '../../types'

/**
 * Get all stories (e.g. to load the top bar)
 *
 * @internal
 */
export async function getAllStories(
    this: TelegramClient,
    params?: {
        /**
         * Offset from which to fetch stories
         */
        offset?: string

        /**
         * Whether to fetch stories from "archived" (or "hidden") peers
         */
        archived?: boolean
    },
): Promise<AllStories> {
    if (!params) params = {}

    const { offset, archived } = params

    const res = await this.call({
        _: 'stories.getAllStories',
        state: offset,
        next: Boolean(offset),
        hidden: archived,
    })

    assertTypeIsNot('getAllStories', res, 'stories.allStoriesNotModified')

    return new AllStories(this, res)
}
