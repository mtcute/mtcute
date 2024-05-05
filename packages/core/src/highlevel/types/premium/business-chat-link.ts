import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { MessageEntity } from '../messages/message-entity.js'

/**
 * A business chat link, i.e. a link to start a chat with a pre-filled message.
 */
export class BusinessChatLink {
    constructor(readonly raw: tl.RawBusinessChatLink) {}

    /** The link itself */
    get link(): string {
        return this.raw.link
    }

    /** Text to be inserted into the message input */
    get text(): string {
        return this.raw.message
    }

    /** Entities for the text */
    get entities(): MessageEntity[] {
        return this.raw.entities?.map((x) => new MessageEntity(x)) ?? []
    }

    /** Custom title for the link */
    get title(): string | null {
        return this.raw.title ?? null
    }

    /** Number of clicks on the link */
    get clicks(): number {
        return this.raw.views
    }
}

makeInspectable(BusinessChatLink)
memoizeGetters(BusinessChatLink, ['entities'])
