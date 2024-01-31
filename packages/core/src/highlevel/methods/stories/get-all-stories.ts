import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { AllStories } from '../../types/index.js'

/**
 * Get all stories (e.g. to load the top bar)
 */
export async function getAllStories(
    client: ITelegramClient,
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

    const res = await client.call({
        _: 'stories.getAllStories',
        state: offset,
        next: Boolean(offset),
        hidden: archived,
    })

    assertTypeIsNot('getAllStories', res, 'stories.allStoriesNotModified')

    return new AllStories(res)
}
