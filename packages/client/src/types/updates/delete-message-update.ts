import { tl } from '@mtcute/tl'
import { toggleChannelIdMark } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'

/**
 * One or more messages were deleted
 */
export class DeleteMessageUpdate {
    constructor(
        readonly client: TelegramClient,
        readonly raw:
            | tl.RawUpdateDeleteMessages
            | tl.RawUpdateDeleteChannelMessages
    ) {}

    /**
     * IDs of the messages which were deleted
     */
    get messageIds(): number[] {
        return this.raw.messages
    }

    /**
     * Marked ID of the channel where the messages were deleted
     */
    get channelId(): number | null {
        return this.raw._ === 'updateDeleteChannelMessages'
            ? toggleChannelIdMark(this.raw.channelId)
            : null
    }
}

makeInspectable(DeleteMessageUpdate)
