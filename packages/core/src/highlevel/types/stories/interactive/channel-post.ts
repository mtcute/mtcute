import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../../utils/index.js'
import { memoizeGetters } from '../../../utils/memoize.js'
import { Chat } from '../../peers/chat.js'
import { PeersIndex } from '../../peers/peers-index.js'
import { StoryInteractiveArea } from './base.js'

/**
 * Interactive element containing a channel post
 */
export class StoryInteractiveChannelPost extends StoryInteractiveArea {
    readonly type = 'channel_post' as const

    constructor(
        readonly raw: tl.RawMediaAreaChannelPost,
        readonly _peers: PeersIndex,
    ) {
        super(raw)
    }

    /** Channel being mentioned */
    get chat(): Chat {
        return new Chat(this._peers.chat(this.raw.channelId))
    }

    /** ID of the message being mentioned */
    get messageId(): number {
        return this.raw.msgId
    }
}

memoizeGetters(StoryInteractiveChannelPost, ['chat'])
makeInspectable(StoryInteractiveChannelPost)
