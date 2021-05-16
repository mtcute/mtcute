import { tl } from '@mtcute/tl'
import { makeInspectable } from '@mtcute/client/src/types/utils'
import { MAX_CHANNEL_ID } from '@mtcute/core'
import { TelegramClient } from '@mtcute/client'

/**
 * One or more messages were deleted
 */
export class DeleteMessageUpdate {
    readonly client: TelegramClient
    readonly raw: tl.RawUpdateDeleteMessages | tl.RawUpdateDeleteChannelMessages

    constructor(
        client: TelegramClient,
        raw: tl.RawUpdateDeleteMessages | tl.RawUpdateDeleteChannelMessages
    ) {
        this.client = client
        this.raw = raw
    }

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
            ? MAX_CHANNEL_ID - this.raw.channelId
            : null
    }
}

makeInspectable(DeleteMessageUpdate)
